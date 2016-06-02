
class Test {

  constructor(name) {
    this._name = name;
    this._method = null;
    this._url = null;
    this._data = null;
    this._type = null;
    this._save = null;
    this._promise = null;
  }

  execute() {
    if (!this._promise) {
      this._promise = new Promise((resolve, reject) => {
        console.log(this._name);
        resolve();
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

  data(data) {
    this._data = data;
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
