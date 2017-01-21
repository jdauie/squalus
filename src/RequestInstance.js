
export default class RequestInstance {

  constructor(url, options) {
    this._url = url;
    this._options = options;
    this._responseUrl = null;
    this._responseStatus = null;
    this._responseHeaders = null;
    this._responseBody = null;
  }

  static execute(url, options) {
    const result = new RequestInstance(url, options);

    return fetch(url, options).then(res =>
      res.text().then(body => {
        result._responseUrl = res.url;
        result._responseStatus = res.status;
        result._responseHeaders = res.headers;
        result._responseBody = body;
        return result;
      })
    ).catch(error => {
      console.log(error.message);
    });
  }

  dump() {
    console.log(`url: ${this._responseUrl}`);
    console.log(`status: ${this._responseStatus}`);
    console.log('headers:');
    for (const pair of this._responseHeaders.entries()) {
      console.log(`  ${pair[0]}: ${pair[1]}`);
    }
    try {
      console.log(JSON.parse(this._responseBody));
    } catch (e) {
      // ignore
    }
  }
}
