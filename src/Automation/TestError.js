
export default class TestError {

  constructor(test, group, collection, reason, response) {
    this._test = test;
    this._group = group;
    this._collection = collection;
    this._reason = reason;
    this._response = response;
  }
}
