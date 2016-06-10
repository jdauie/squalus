import { default as $ } from './../../Tag';
import ScalarType from './../ScalarType';

export default class BoolScalarType extends ScalarType {

  _parse(values) {
    return values ? values.map(v => v === true || v === 'true') : null;
  }

  _build() {
    return $('input', { type: 'checkbox' });
  }

  _validate(value) {
    return typeof value === 'boolean';
  }

  value() {
    return this._node.checked;
  }

  populate(data) {
    this._node.checked = data;
  }

  clear() {
    this._node.checked = false;
  }
}
