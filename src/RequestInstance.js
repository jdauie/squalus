import { default as $ } from './Tag';

export default class RequestInstance {

  constructor(url, options, output) {
    this._url = url;
    this._options = options;
    this._output = output;
    this._sendTime = (new Date()).getTime();
    this._responseTime = null;
    this._responseUrl = null;
    this._responseStatus = null;
    this._responseHeaders = null;
    this._responseBody = null;
  }

  static execute(url, options, output) {
    const result = new RequestInstance(url, options, output);

    result._output.innerHTML = '';

    const sections = {
      url: result._url,
      method: result._options.method,
      status: 'fetching...',
    };

    result.dumpSections(sections);

    return fetch(url, options).then(res =>
      res.text().then(body => {
        result._responseTime = (new Date()).getTime();
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
    this._output.innerHTML = '';

    let responseBody = this._responseBody;
    const contentType = this._responseHeaders.get('content-type');
    if (contentType && contentType.indexOf('application/json') !== -1) {
      try {
        responseBody = JSON.stringify(JSON.parse(responseBody), null, 2);
      } catch (e) {
        // html comes back for some errors
      }
    }

    const body = $('pre');
    body.textContent = responseBody;

    const sections = {
      url: this._responseUrl,
      method: this._options.method,
      status: this._responseStatus,
      time: `${this._responseTime - this._sendTime} ms`,
      headers: $('table', Array.from(this._responseHeaders.entries()).map(x => $('tr', $('th', x[0]), $('td', x[1])))),
    };

    if (this._responseHeaders.get('content-type')) {
      sections.body = body;
    }

    this.dumpSections(sections);
  }

  dumpSections(sections) {
    for (const key of Object.keys(sections)) {
      this._output.appendChild($('div', { class: 'output-section' },
        $('div', { class: 'output-section-label' }, key),
        $('div', { class: 'output-section-content' }, sections[key])
      ));
    }
  }
}
