
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

  execute(root, context) {
    if (!this._promise) {
      console.log(`execute group '${this._name}`);
      let when = root;
      if (this._requires) {
        when = Promise.all(this._requires.map(g => g.execute(root, context)));
      }
      this._promise = new Promise((resolve, reject) => {
        if (this._parallel) {
          when.then(() => {
            Promise.all(this._tests.map(t => t.execute())).then(resolve, reject);
            resolve();
          }, reason => {
            // a previous required group failed?
            console.log(reason);
            reject(reason);
          });
        } else {
          const tests = this._tests.slice().reverse();

          const onReject = reason => {
            // previous test failed in this group?
            console.log(reason);
            reject(reason);
          };

          const onResolve = () => {
            if (tests.length) {
              tests.pop().execute(context).then(onResolve, onReject);
            } else {
              resolve();
            }
          };

          when.then(onResolve, onReject);
        }
      });
    }
    return this._promise;
  }
}

export default function group(name) {
  return new TestGroup(name);
}
