import { default as $ } from './../../Tag';
import ScalarType from './../ScalarType';

export default class PasswordScalarType extends ScalarType {

  _build() {
    return $('input', { type: 'password', placeholder: this._type });
  }

  static supports() {
    return ['password'];
  }
}
