
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

  execute(root) {
    if (!this._promise) {
      let when = root;
      if (this._requires) {
        when = Promise.all(this._requires.map(g => g.execute(root)));
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
          this._tests.reduce((previous, current) => previous.then(() => {
            current.execute();
          }, reason => {
            // previous test failed in this group?
            console.log(reason);
            reject(reason);
          }), when).then(() => {
            resolve();
          }, reason => {
            // last test in the group failed?
            console.log(reason);
            reject(reason);
          });
        }
      });
    }
    return this._promise;
  }
}

export default function group(name) {
  return new TestGroup(name);
}
