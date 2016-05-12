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
    return new NullableType(this._type.clone());
  }

  value() {
    let val = this._type.value();
    if (val === '') {
      val = null;
    }
    return val;
  }

  populate(data, path, types) {
    this._type.populate(data, path, types);
  }

  clear() {
    this._type.clear();
  }
}
