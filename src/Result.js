
export default class Result {

  constructor(relativeUrl, response) {
    this._relativeUrl = relativeUrl;
    this._response = response;
  }

  parse() {
    if (this._response instanceof Response) {
      if (this._response.ok) {
        //
      } else {
        //
      }
    } else {
      console.log(this._response.message);
    }
  }
}
