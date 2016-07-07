
export default class TestGroup {

  constructor(name) {
    this._name = name;
    this._requires = null;
    this._parallel = false;
    this._session = null;
    this._tests = null;
    this._promise = null;
  }

  requires(groups) {
    this._requires = Array.isArray(groups) ? groups : [groups];
    return this;
  }

  parallel() {
    this._parallel = true;
    return this;
  }

  session(name) {
    this._session = name;
    return this;
  }

  tests(tests) {
    this._tests = tests;
    return this;
  }

  execute(context, collection, root) {
    if (!this._promise) {
      let when = root;
      if (this._requires) {
        when = Promise.all(this._requires.map(g => g.execute(root, context)));
      }
      this._promise = new Promise((resolve, reject) => {
        if (this._parallel && !collection._sequential) {
          when.then(() => {
            Promise.all(this._tests.map(t => t.execute(context, this, collection))).then(resolve, reject);
          });
        } else {
          const tests = this._tests.slice().reverse();

          const onResolve = () => {
            if (tests.length) {
              tests.pop().execute(context, this, collection).then(onResolve, reject);
            } else {
              resolve();
            }
          };

          when.then(onResolve, reject);
        }
      });
    }
    return this._promise;
  }
}
