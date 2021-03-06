import Squalus from '../Squalus';
import FormData from 'form-data';
import rp from 'request-promise';
import 'colors';
import TestError from './TestError';

function padRight(str, width, char = ' ') {
  if (str.length < width) {
    return str + char.repeat(width - str.length);
  }
  return str;
}

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func) {
  const fnStr = func.toString().replace(STRIP_COMMENTS, '');
  let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if (result === null) {
    result = [];
  }
  return result;
}

function callFuncWithParamInjection(func, response, body, context) {
  const sourceParams = new Map();
  sourceParams.set('response', response);
  sourceParams.set('body', body);
  sourceParams.set('context', context);
  const maps = [sourceParams];
  Array.from(sourceParams.values()).filter(p => p instanceof Map).forEach(map => maps.push(map));

  return func.apply(null, getParamNames(func).map(name => {
    const map = maps.find(m => m.has(name));
    if (map) {
      return map.get(name);
    }
    return undefined;
  }));
}

export default class Test {

  constructor(name) {
    this._name = name;
    this._method = null;
    this._url = null;
    this._contentType = null;
    this._responseContentType = null;
    this._body = null;
    this._status = null;
    this._type = null;
    this._save = null;
    this._expect = null;
    this._promise = null;
  }

  execute(context, group, collection) {
    if (!this._promise) {
      let url = this._url;
      if (typeof url === 'function') {
        url = url(context);
      }

      const populateVariables = (m, name) => (context.has(name) ? context.get(name) : m);

      url = url.replace(/[@:]([a-z0-9_]+)/gi, populateVariables);
      url = url.replace(/{([a-z0-9_]+)}/gi, populateVariables);

      const absUrl = context.get('baseUrl') + url;

      let body = this._body;
      if (typeof body === 'function') {
        body = body(context);
      }

      const reject = (reason, response) =>
        Promise.reject(new TestError(this, group, collection, reason, response));

      const status = (response) => {
        if (!this._status || typeof this._status !== 'number') {
          return reject('invalid response status', response);
        }
        if (response.statusCode !== this._status) {
          return reject(`response status ${response.statusCode} does not match expected ${this._status}`, response);
        }
        if (this._responseContentType) {
          const contentType = (response.headers['content-type'] || '').split(';', 2)[0];
          if (contentType !== this._responseContentType) {
            return reject(`response content type ${contentType} does not match expected ${this._responseContentType}`,
              response);
          }
        }
        return Promise.resolve(response);
      };

      const type = (response) => {
        if (this._type) {
          const responseType = Squalus.getType(this._type);
          if (!responseType) {
            return reject(`failed to create response type ${this._type}`, response);
          }
          try {
            const json = JSON.parse(response.body);
            response.bodyJson = json;// eslint-disable-line no-param-reassign
            responseType.validate(json, 'body', false, collection._validationContext);
          } catch (e) {
            return reject(e, response);
          }
          return Promise.resolve(response);
        }
        return Promise.resolve(response);
      };

      const expect = (response) => {
        if (this._expect) {
          return Promise.all(this._expect.map((func, i) =>
            Promise.resolve(callFuncWithParamInjection(
              func,
              response,
              response.bodyJson !== undefined ? response.bodyJson : response.body,
              context
            )).then(passed => {
              if (!passed) {
                return reject(`expect test '${i}' failed`, response);
              }
              return Promise.resolve(response);
            })
          )).then(() => Promise.resolve(response));
        }
        return Promise.resolve(response);
      };

      const save = (response) => {
        if (this._save) {
          return Promise.all(Array.from(this._save.keys()).map(key =>
            Promise.resolve(
              callFuncWithParamInjection(
                this._save.get(key),
                response,
                response.bodyJson !== undefined ? response.bodyJson : response.body,
                context
              )
            ).then(v => {
              if (context.has(key)) {
                throw new Error(`The context already contains key '${key}'`);
              }
              context.set(key, v);
              // console.log(`  [${key}] = ${v}`);
            })
          )).then(() => Promise.resolve(response));
        }
        return Promise.resolve(response);
      };

      const options = {
        uri: absUrl,
        method: this._method,
        headers: {
          'Content-Type': this._contentType || 'application/json',
        },
        resolveWithFullResponse: true,
        simple: false,
      };

      const sessionCookie = context.get(`http_cookie__${group._session}`);
      if (sessionCookie) {
        options.headers.Cookie = sessionCookie;
      }

      const sessionAuthorization = context.get(`http_authorization__${group._session}`);
      if (sessionAuthorization) {
        options.headers.Authorization = sessionAuthorization;
      }

      if (this._contentType === 'application/x-www-form-urlencoded') {
        options.form = body;
      } else if (this._contentType === 'multipart/form-data') {
        options.formData = body;
      } else {
        options.body = body;
      }

      this._promise = rp(options)
        .then(res => status(res))
        .then(res => type(res))
        .then(res => expect(res))
        .then(res => save(res))
        .then(() => {
          if (collection._cancel) {
            return Promise.reject();
          }
          console.log('    %s %s %s %s',
            padRight(group._name, collection.getMaxGroupNameLength()).gray,
            padRight(this._method.toUpperCase(), 6).magenta,
            url,
            this._name.cyan
          );
          return Promise.resolve();
        });
    }
    return this._promise;
  }

  get(url) {
    this._method = 'get';
    this._url = url;
    this._status = this._status || 200;
    return this;
  }

  post(url) {
    this._method = 'post';
    this._url = url;
    this._status = this._status || 200;
    return this;
  }

  put(url) {
    this._method = 'put';
    this._url = url;
    this._status = this._status || 204;
    return this;
  }

  delete(url) {
    this._method = 'delete';
    this._url = url;
    this._status = this._status || 204;
    return this;
  }

  json(data) {
    this._contentType = 'application/json';
    if (typeof data === 'function') {
      this._body = context => JSON.stringify(data(context));
    } else {
      this._body = JSON.stringify(data);
    }
    return this;
  }

  form(data) {
    this._contentType = 'application/x-www-form-urlencoded';
    this._body = data;
    return this;
  }

  formData(data) {
    this._contentType = 'multipart/form-data';
    const form = new FormData();
    Object.keys(data).forEach(key => form.append(key, data[key]));
    this._body = form;
    return this;
  }

  save(name, func) {
    if (!this._save) {
      this._save = new Map();
    }
    this._save.set(name, func);
    return this;
  }

  saveCookie(name, func) {
    return this.save(`http_cookie__${name}`, func);
  }

  saveAuthorization(name, func) {
    return this.save(`http_authorization__${name}`, func);
  }

  expect(type) {
    if (typeof type === 'function') {
      if (!this._expect) {
        this._expect = [];
      }
      this._expect.push(type);
    } else if (typeof type === 'number') {
      this._status = type;
    } else if (type.indexOf('/') !== -1) {
      this._responseContentType = type;
    } else {
      this._type = type;
    }
    return this;
  }
}
