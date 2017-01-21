import ScalarType from './../ScalarType';

export default class EmailScalarType extends ScalarType {

  _validate(value) {
    return value && value.match(
      /^(([^<>()\[\].,;:\s@"]+(\.[^<>()\[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i);
  }
}
