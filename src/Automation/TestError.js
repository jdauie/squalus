
export default class TestError {

  constructor(test, group, collection, reason, response) {
    this._test = test;
    this._group = group;
    this._collection = collection;
    this._reason = reason;
    this._response = response;
  }

  log(context) {
    const info = {
      collection: this._collection._name,
      group: this._group._name,
    };

    if (this._test._name !== undefined && this._test._name !== null && this._test._name.length > 0) {
      info.test = this._test._name;
    } else {
      info.test = `#${this._group._tests.indexOf(this._test)}`;
    }

    info['req-url'] = this._response.request.uri.href;
    info['req-method'] = this._response.request.method.toUpperCase();

    if (['post', 'put', 'patch'].includes(this._response.request.method)) {
      info['req-body'] = this._response.request.body;
    }

    if (this._response.statusCode >= 200 && ![204, 205].includes(this._response.statusCode)) {
      // the response MAY include an entity
      const responseContentType = (this._response.headers['content-type'] || '')
        .split(';')[0].toLowerCase().trim();
      // technically, the content-type header is only a SHOULD, rather than a MUST for entity responses,
      // but I don't care enough to sniff the response to determine the media response
      if (responseContentType) {
        let responseBody = this._response.body;
        let responseNote = null;

        if (responseContentType === 'text/html') {
          if (this._response.statusCode === 500 && /<span><H1>Server Error in/i.test(responseBody)) {
            responseNote = 'including only error trace from ASP.NET YSOD response';
            responseBody = responseBody.replace(/^[\s\S]*<!--([\s\S]*)-->\s*$/, '$1');
          }
        } else if (responseContentType === 'application/json') {
          responseBody = JSON.stringify(JSON.parse(responseBody), null, 4);
        }

        if (this._test._type) {
          info['res-squalus-type'] = this._test._type;
        }

        info['res-content-type'] = responseContentType;
        info['res-body'] = `${(responseNote ? `(${responseNote})` : '')}\n${responseBody}`;
      }
    }

    info.context = JSON.stringify(Array.from(context.keys()).reduce((a, b) =>
      Object.assign(a, { [`${b}`]: context.get(b) }), {}), null, 4);

    if (this._reason instanceof Error) {
      info.error = this._reason.stack;
    } else {
      info.reason = this._reason;
    }

    const maxInfoNameLength = Object.keys(info).reduce((a, b) => (Math.max(a, b.length)), 0);

    console.log();
    console.log('  failed'.red);
    console.log();
    Object.keys(info).forEach(k => console.log('    %s%s : %s',
      k.yellow,
      info[k].indexOf('\n') === -1
        ? ' '.repeat(maxInfoNameLength - k.length)
        : '',
      info[k].replace(/\n/g, `\n${' '.repeat(4 + 4)}`)
    ));
    console.log();
  }
}
