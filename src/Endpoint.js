import { default as $ } from './Tag';
import RequestInstance from './RequestInstance';

function closestAncestorByClassName(elem, className) {
  let e = elem.parentNode;
  while (e) {
    if (e.classList && e.classList.contains(className)) {
      return e;
    }
    e = e.parentNode;
  }
  return null;
}

function convertValueToParam(val, key, query) {
  if (Array.isArray(val)) {
    val.forEach((item, i) =>
      convertValueToParam(item, `${key}[${i}]`, query)
    );
  } else if (typeof val === 'object') {
    Object.keys(val).forEach((name) =>
      convertValueToParam(val[name], `${key}[${name}]`, query)
    );
  } else if (typeof val === 'boolean') {
    query.set(key, encodeURI(val ? 1 : 0));
  } else {
    query.set(key, encodeURI(val));
  }
}

const sections = {
  headers: 'http-headers',
  urlParams: 'url-params',
  queryParams: 'query-params',
  body: 'body',
};

export default class Endpoint {

  constructor(baseUrl, url, method, headers, urlParams, queryParams, body) {
    this._baseUrl = baseUrl;
    this._url = url;
    this._method = method;
    this._headers = headers;
    this._urlParams = urlParams;
    this._queryParams = queryParams;
    this._body = body;

    // todo: verify that url params is object and that there is a 1:1 correspondence with attributes and placeholders
    // query params can be object, map, or scalar?
    // headers can be object or map

    // const names = this._url.match(/{[^}\s]+}/g).map(m => m.substr(1, m.length - 2));

    this._node = null;
  }

  section(name) {
    return this[`_${name}`];
  }

  headers() {
    return this._headers ? this._headers.value() : null;
  }

  urlParams() {
    return this._urlParams ? this._urlParams.value() : null;
  }

  queryParams() {
    return this._queryParams ? this._queryParams.value() : null;
  }

  body() {
    return this._body ? this._body.value() : null;
  }

  clear() {
    this._body.clear();
  }

  lock() {
    this._body.find('*').prop('disabled', true);
  }

  unlock() {
    this._body.find('*').prop('disabled', false);
  }

  getPopulatedUrl() {
    let url = this._url;

    const urlParams = this.urlParams();
    if (urlParams) {
      for (const key of Object.keys(urlParams)) {
        url = url.replace(`{${key}}`, encodeURI(urlParams[key]));
      }
    }

    url = new URL(url, this._baseUrl);

    const queryParams = this.queryParams();
    if (queryParams) {
      const query = new Map();
      for (const key of Object.keys(queryParams)) {
        const val = queryParams[key];
        if (val !== null && val !== '') {
          convertValueToParam(val, key, query);
        }
      }
      query.forEach((value, key) => url.searchParams.append(key, value));
    }

    return url;
  }

  build() {
    this._node = $('div', { class: `endpoint endpoint-method-${this._method.toLowerCase()}`, _squalusDef: this },
      $('div', { class: 'endpoint-header' },
        $('span', { class: 'endpoint-method' }, this._method),
        $('span', { class: 'endpoint-url' }, this._url)
      )
    );

    const test = this._node.appendChild($('div', { class: 'endpoint-test' }));

    for (const key of Object.keys(sections)) {
      const section = this.section(key);
      if (section) {
        test.appendChild($('div', { class: `endpoint-test-${key === 'body' ? 'body' : 'params'}` },
          $('div', { class: 'endpoint-test-label' }, sections[key]),
          section.build())
        );
      }
    }

    test.appendChild($('div', { class: 'endpoint-test-controls' },
      $('input', { type: 'button', value: this._method, class: 'test-submit' }),
      $('span', { class: 'endpoint-test-status' })
    ));

    return this._node;
  }

  submit() {
    // todo: trap parse errors
    const url = this.getPopulatedUrl();
    const headers = this.headers();
    const body = this.body();

    const options = {
      method: this._method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (headers) {
      for (const header of Object.keys(headers)) {
        options.headers[header] = headers[header];
      }
    }

    if (['PUT', 'POST', 'PATCH'].includes(this._method)) {
      options.body = JSON.stringify(body);
    }

    RequestInstance.execute(url, options).then(req => {
      req.dump();
    });
  }

  storageKey() {
    return `squalus:${this._method.toLowerCase()}-${this._url}`;
  }

  load() {
    // todo: load from storage if the endpoint hasn't changed

    for (const key of Object.keys(sections)) {
      const section = this.section(key);
      if (section) {
        let value = localStorage.getItem(`${this.storageKey()}-${key}`);
        if (value != null) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            continue;
          }
          section.populate(value);
        }
      }
    }
  }

  unload() {
    // todo: save values, ignoring parse errors? not sure, it needs to be able to recreate branches, etc.

    for (const key of Object.keys(sections)) {
      const section = this.section(key);
      if (section) {
        localStorage.setItem(`${this.storageKey()}-${key}`, JSON.stringify(section.value()));
      }
    }
  }

  static onBeforeUnload() {
    Array.from(document.getElementsByClassName('endpoint')).forEach(node => node._squalusDef.unload());
  }

  static onKeyPress(event, def) {
    if (event.which === 13) {
      event.preventDefault();
      (def || this.closest(event.target)).submit();
    }
  }

  static onSubmit(event, def) {
    (def || this.closest(event.target)).submit();
  }

  static closest(elem) {
    const node = closestAncestorByClassName(elem, 'endpoint');
    return node ? node._squalusDef : null;
  }
}
