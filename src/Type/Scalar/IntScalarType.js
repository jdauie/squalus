import NumericScalarType from './NumericScalarType';
import IntValueCollection from './IntValueCollection';

export default class IntScalarType extends NumericScalarType {

  _parse(values) {
    return new IntValueCollection(values);
  }

  _validate(value) {
    const unsigned = this._type.charAt(0) === 'u';
    const positive = this._type.charAt(0) === 'p';
    return typeof value === 'number' && (value | 0) === value && (!unsigned || value >= 0) && (!positive || value > 0);
  }

  value() {
    const value = this._node.value.trim();
    return value === '' ? null : parseInt(this._node.value, 10);
  }

  static supports() {
    return ['int', 'uint', 'pint', 'long', 'ulong', 'plong'];
  }
}
