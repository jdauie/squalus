import { default as $ } from './../../Tag';
import ScalarType from './../ScalarType';
import ValueCollection from './ValueCollection';

export default class BoolScalarType extends ScalarType {

  _parse(values) {
    return new ValueCollection(values.map(v => v === true || v === 'true'));
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

  static supports() {
    return ['bool'];
  }
}
