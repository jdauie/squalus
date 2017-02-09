export default class NullableType {

  constructor(type) {
    this._type = type;
  }

  name() {
    return this._type.name();
  }

  build() {
    return this._type.build();
  }

  clone() {
    return new this.constructor(this._type.clone());
  }

  value() {
    let val = this._type.value();
    if (val === '') {
      val = null;
    }
    return val;
  }

  validate(value, path, silent, context) {
    return (value === null) || this._type.validate(value, path, silent, context);
  }

  populate(data) {
    this._type.populate(data);
  }

  clear() {
    this._type.clear();
  }
}
