import ScalarType from './../ScalarType';

export default class FloatScalarType extends ScalarType {

  _parse(values) {
    return values ? values.map(v => parseFloat(v)) : null;
  }

  _validate(value) {
    return typeof value === 'number';
  }

  value() {
    return parseFloat(this._node.value);
  }
}
