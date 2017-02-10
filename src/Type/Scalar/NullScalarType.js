import ScalarType from './../ScalarType';

export default class NullScalarType extends ScalarType {

  _build() {
    return document.createTextNode('');
  }

  _validate(value) {
    return value === null;
  }

  value() {
    return null;
  }

  static supports() {
    return ['null'];
  }
}
