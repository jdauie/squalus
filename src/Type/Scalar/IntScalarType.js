import ScalarType from './../ScalarType';

export default class IntScalarType extends ScalarType {

  _parse(values) {
    return values ? values.map(v => parseInt(v, 10)) : null;
  }

  value() {
    return parseInt(this._node.value, 10);
  }
}
