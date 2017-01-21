import ScalarType from './../ScalarType';

export default class FloatScalarType extends ScalarType {

  _parse(values) {
    return values ? values.map(v => parseFloat(v)) : null;
  }

  _validate(value) {
    return typeof value === 'number';
  }

  value() {
    const value = this._node.value.trim();
    return value === '' ? null : parseFloat(this._node.value);
  }
}
