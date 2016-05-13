import { default as $ } from './Tag';
import Result from './Result';

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

export default class Endpoint {

  constructor(url, method, params, type) {
    this._url = url;
    this._method = method;
    this._params = (params && params.size) ? params : null;
    this._type = type;

    this._node = null;
  }

  updateSingleParam(data) {
    if (this._params) {
      if (data.Id) {
        this._node.querySelector('.test-param')._squalusType.populate(data.Id);
      }
    }
  }

  value() {
    if (!this._type) {
      return null;
    }
    return this._type.value();
  }

  populate(data, types) {
    this._type.populate(data, 'body', types);
  }

  clear() {
    this._type.clear();
  }

  lock() {
    // this causes problems with the "edit" populate
    // this._body.find('*').prop('disabled', true);
  }

  unlock() {
    // this._body.find('*').prop('disabled', false);
  }

  getPopulatedUrl() {
    const query = new Map();
    let url = this._url;
    if (this._params) {
      Array.from(this._node.querySelectorAll('.test-param')).forEach(param => {
        const key = param.dataset.name;
        const keyPlaceholder = `{${key}}`;
        const val = param._squalusType.value();
        if (url.indexOf(keyPlaceholder) === -1) {
          if (val !== null && val !== '') {
            convertValueToParam(val, key, query);
          }
        } else {
          url = url.replace(keyPlaceholder, encodeURI(val));
        }
      });
    }

    url = new URL(url, window.location.href);
    query.forEach((value, key) => url.searchParams.append(key, value));

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

    if (this._params) {
      const params = test.appendChild($('div', { class: 'endpoint-test-params' }));
      params.appendChild($('table',
        $('tbody',
          Array.from(this._params.keys()).map(param => {
            const type = this._params.get(param);
            return $('tr', { class: 'test-param', 'data-name': param, _squalusType: type },
              $('th', param),
              $('td', type.build())
            );
          })
        )
      ));
      if (this._method === 'PUT') {
        params.appendChild($('input', { type: 'button', value: 'EDIT', class: 'test-edit' }));
      }
    }

    if (this._type) {
      test.appendChild($('div', { class: 'endpoint-test-body' }, this._type.build()));
    }

    test.appendChild($('div', { class: 'endpoint-test-controls' },
      $('input', { type: 'button', value: this._method, class: 'test-submit' }),
      $('span', { class: 'test-edit-status' })
    ));

    return this._node;
  }

  submit() {
    // todo: trap parse errors
    const url = this.getPopulatedUrl();
    const value = JSON.stringify(this.value());

    const options = {
      method: this._method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (['PUT', 'POST', 'PATCH'].includes(this._method)) {
      options.body = value;
    }

    fetch(url, options).then(res => {
      new Result(url, res).parse();
    }).catch(error => {
      new Result(url, error).parse();
    });
  }

  edit() {
    const url = this.getPopulatedUrl();
    const status = this._body.querySelector('.test-edit-status');

    status.textContent = '';

    this.clear();
    this.lock();

    fetch(url).then(res => {
      if (!res.ok) {
        //
      }

      let data = res.json();

      // todo: this is going to require the actual validation implementation to handle branching

      // if data is array, edit the first one (for convenience, to support shared id/search path)
      if (Array.isArray(data)) {
        if (data.length && this._params && this._params.size === 1) {
          status.textContent = `Loaded first record (${data.length} total)`;
          data = data[0];
          this.updateSingleParam(data);
        } else {
          data = null;
        }
      }
      if (data) {
        this.populate(data);
      } else {
        status.textContent = 'No match for pattern';
      }

      this.unlock();
    }).catch(error => {
      status.textContent = error.message;
      this.unlock();
    });
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

  static onEdit(event, def) {
    (def || this.closest(event.target)).edit();
  }

  static closest(elem) {
    const node = closestAncestorByClassName(elem, 'endpoint');
    return node ? node._squalusDef : null;
  }
}
