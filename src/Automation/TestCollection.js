
class TestCollection {

  constructor(name) {
    this._name = name;
    this._groups = null;
  }

  groups(groups) {
    this._groups = groups;
    return this;
  }

  execute() {
    const root = Promise.resolve();
    Promise.all(this._groups.map(g => g.execute(root)));
  }

  dispatch() {
    //
  }
}

export default function collection(name) {
  return new TestCollection(name);
}
