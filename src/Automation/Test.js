
class Test {

  constructor(name) {
    this._name = name;
    this._method = null;
    this._url = null;
    this._contentType = null;
    this._body = null;
    this._type = null;
    this._save = null;
    this._promise = null;
  }

  execute() {
    if (!this._promise) {
      this._promise = new Promise((resolve, reject) => {
        console.log(this._name);

        const url = 'http://localjournal.submishmash.com' + this._url;

        const request = new Request(url, {
          mode: 'cors',
          method: this._method,
          headers: new Headers({
            'Content-Type': this._contentType || 'application/json',
          }),
          body: this._body,
        });

        fetch(request).then(res => {
          if (res.ok) {
            // this will actually be to check for expected response, which may not be ok
            if (this._save) {
              Promise.all(Array.from(this._save.keys()).map(key => {
                return Promise.resolve(this._save.get(key)(res)).then(v => {
                  console.log('SAVE ' + key + ':');
                  console.log(v);
                });
              })).then(() => resolve());
            } else {
              resolve();
            }
          } else {
            //resolve();
            reject('response not ok');
          }
        }).catch(error => {
          reject(error);
        });
      });
    }
    return this._promise;
  }

  get(url) {
    this._method = 'get';
    this._url = url;
    return this;
  }

  post(url) {
    this._method = 'post';
    this._url = url;
    return this;
  }

  put(url) {
    this._method = 'put';
    this._url = url;
    return this;
  }

  patch(url) {
    this._method = 'patch';
    this._url = url;
    return this;
  }

  delete(url) {
    this._method = 'delete';
    this._url = url;
    return this;
  }

  json(data) {
    this._contentType = 'application/json';
    this._body = JSON.stringify(data);
    return this;
  }

  form(data) {
    this._contentType = 'multipart/form-data';
    const form = new FormData();
    Object.keys(data).forEach(key => form.set(key, data[key]));
    this._body = form;
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
}

export default function test(name) {
  return new Test(name);
}
