
export default class ValidationContext {

  constructor(throwUnknownObjectAttributes) {
    this._throwUnknownObjectAttributes = !!throwUnknownObjectAttributes;
  }
}
