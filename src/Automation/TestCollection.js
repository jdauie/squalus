import colors from 'colors';

class TestCollection {

  constructor(name) {
    this._name = name;
    this._groups = null;
  }

  groups(groups) {
    this._groups = groups;
    return this;
  }

  getMaxGroupNameLength() {
    if (this._groups && !this._maxGroupNameLength) {
      this._maxGroupNameLength = this._groups.reduce((a, b) => (a._name.length > b._name.length ? a : b))._name.length;
    }
    return this._maxGroupNameLength;
  }

  execute(initial) {
    const root = Promise.resolve();
    const context = new Map();
    if (initial) {
      Object.keys(initial).forEach(k => context.set(k, initial[k]));
    }

    const testCount = this._groups.reduce((a, b) => a + b._tests.length, 0);

    console.log();
    console.log(`  collection [${this._name.green}]`);
    console.log();

    return Promise.all(this._groups.map(g => g.execute(context, this, root))).then(() => {
      console.log();
      console.log(`  ${testCount} passing`.green);
      console.log();
    }).catch(error => {
      const info = {
        reason: error._reason,
        group: error._group._name,
        test: error._test._name,
        href: error._response.request.uri.href,
        method: error._response.request.method.toUpperCase(),
        body: error._response.request.body,
        response: error._response.body,
      };
      const maxInfoNameLength = Object.keys(info).reduce((a, b) => (Math.max(a, b.length)), 0);

      console.log();
      console.log('  failed'.red);
      console.log();
      Object.keys(info).forEach(k => console.log('    %s%s : %s',
        k.yellow,
        ' '.repeat(maxInfoNameLength - k.length),
        info[k])
      );
      console.log();
    });
  }
}

export default function collection(name) {
  return new TestCollection(name);
}
