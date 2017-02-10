import ScalarType from './../ScalarType';
import NumericValueCollection from './NumericValueCollection';

export default class NumericScalarType extends ScalarType {

  _parse(values) {
    return new NumericValueCollection(values);
  }

  _validate(value) {
    return typeof value === 'number';
  }

  value() {
    const value = this._node.value.trim();
    return value === '' ? null : parseFloat(this._node.value);
  }

  static supports() {
    return ['float'];
  }
}
