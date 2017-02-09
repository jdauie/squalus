export default class ValueCollection {

  constructor(values) {
    this._values = values;
  }

  contains(value) {
    return this._values.includes(value);
  }

  values() {
    return this._values;
  }
}
