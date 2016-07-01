import ScalarType from './../ScalarType';

export default class NullScalarType extends ScalarType {

  supportsValues() {
    return false;
  }

  _build() {
    return document.createTextNode('');
  }

  _validate(value) {
    return value === null;
  }

  value() {
    return null;
  }
}
