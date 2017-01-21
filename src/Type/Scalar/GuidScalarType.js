import ScalarType from './../ScalarType';

export default class GuidScalarType extends ScalarType {

  _validate(value) {
    return value && value.match(/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i);
  }
}
