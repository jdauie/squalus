import ScalarType from './../ScalarType';

export default class FloatScalarType extends ScalarType {

  _parse(values) {
    return values ? values.map(v => parseFloat(v)) : null;
  }

  value() {
    return parseFloat(this._node.value);
  }
}
