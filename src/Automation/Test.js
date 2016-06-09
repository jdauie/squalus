import Squalus from '../Squalus';
import rp from 'request-promise';

class Test {

  constructor(name) {
    this._name = name;
    this._method = null;
    this._url = null;
    this._contentType = null;
    this._body = null;
    this._status = null;
    this._type = null;
    this._save = null;
    this._expect = null;
    this._promise = null;
  }

  execute(context) {
    if (!this._promise) {
      console.log(this._name);

      const urlPrefix = 'http://localjournal.submishmash.com';
      let url = this._url;
      if (typeof url === 'function') {
        url = url(context);
      }
      url = urlPrefix + url;

      let body = this._body;
      if (typeof body === 'function') {
        body = body(context);
      }

      const status = (response) => {
        if (!this._status || typeof this._status !== 'number') {
          return Promise.reject('invalid response status');
        }
        if (response.statusCode !== this._status) {
          return Promise.reject(`response status ${response.statusCode} does not match expected ${this._status}`);
        }
        return Promise.resolve(response);
      };

      const type = (response) => {
        if (this._type) {
          const responseType = Squalus.getType(this._type);
          if (!responseType) {
            return Promise.reject(`failed to create response type ${this._type}`);
          }
          const json = JSON.parse(response.body);
          response.bodyJson = json;
          responseType.validate(json, 'body');
          return Promise.resolve(response);
        }
        return Promise.resolve(response);
      };

      const expect = (response) => {
        if (this._expect) {
          return Promise.all(Array.from(this._expect.keys()).map(key =>
            Promise.resolve(this._expect.get(key)(response.bodyJson, context)).then(v => {
              if (!v) {
                return Promise.reject(`expect test '${key}' failed`);
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
            Promise.resolve(this._save.get(key)(response.bodyJson, response)).then(v => {
              context.set(key, v);
              console.log(`  [${key}] = ${v}`);
            })
          )).then(() => Promise.resolve(response));
        }
        return Promise.resolve(response);
      };

      const options = {
        uri: url,
        method: this._method,
        headers: {
          'Content-Type': this._contentType || 'application/json',
          Cookie: context.get('sessionCookie'),
        },
        body,
        resolveWithFullResponse: true,
        simple: false,
      };

      this._promise = rp(options)
        .then(res => status(res))
        .then(res => type(res))
        .then(res => expect(res))
        .then(res => save(res));
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
    this._contentType = 'multipart/form-data';
    const form = new FormData();
    Object.keys(data).forEach(key => form.set(key, data[key]));
    this._body = form;
    return this;
  }

  status(code) {
    this._status = code;
    return this;
  }

  is(type) {
    this._type = type;
    return this;
  }

  save(name, func) {
    if (!this._save) {
      this._save = new Map();
    }
    this._save.set(name, func);
    return this;
  }

  expect(name, func) {
    if (!this._expect) {
      this._expect = new Map();
    }
    this._expect.set(name, func);
    return this;
  }
}

export default function test(name) {
  return new Test(name);
}
