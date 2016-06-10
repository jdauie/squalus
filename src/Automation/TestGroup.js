import Test from './Test';

class TestGroup {

  constructor(name) {
    this._name = name;
    this._requires = null;
    this._parallel = false;
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
        if (this._parallel) {
          when.then(() => {
            Promise.all(this._tests.map(t => t.execute())).then(resolve, reject);
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

export function group(name) {
  return new TestGroup(name);
}

export function test(name) {
  return new Test(name);
}
