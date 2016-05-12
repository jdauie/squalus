import { default as $ } from './Tag';
import BranchType from './Type/BranchType';
import ScalarType from './Type/ScalarType';
import Result from './Result';

function closestAncestorByTagName(elem, tagName) {
  let e = elem.parentNode;
  while (e) {
    if (e.tagName.toLowerCase() === tagName) {
      return e;
    }
    e = e.parentNode;
  }
  return null;
}

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
    this._params = params;
    this._type = type;

    this._body = null;
  }

  syncTabParams() {
    const divs = this._body.querySelector('.tab-container > div');
    if (divs.length) {
      let src = divs[0].querySelectorAll('.test-param');
      let dst = divs[1].querySelectorAll('.test-param');
      if (!divs[0].classList.contains('current')) {
        [src, dst] = [dst, src];
      }
      [...src].forEach((param, i) => {
        dst[i].value = param.value;
      });
    }
  }

  updateSingleParam(data) {
    if (this._params) {
      if (data.Id) {
        this._body.querySelector('.test-param')._squalusType.populate(data.Id);
      }
    }
  }

  value() {
    if (!this._type) {
      return null;
    }

    // use the json tab (instead of the form) if it is selected
    if (this._json && closestAncestorByTagName(this._json, 'div').classList.contains('current')) {
      let val = this._json.value;
      if (val === '') {
        val = null;
      }
      return JSON.parse(val);
    }
    return this._type.value();
  }

  populate(data, types) {
    this._type.populate(data, 'body', types);
    this.switchTab(0);
  }

  clear() {
    this._type.clear();
    this._json.value = '';
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
      const params = Object.keys(this._params);
      const tab = this._body.querySelector('.tab-container .current') || this._body;
      const testParams = tab.querySelectorAll('.test-param');
      for (let i = 0; i < testParams.length; i++) {
        const key = params[i];
        const keyPlaceholder = `{${key}}`;
        const val = testParams[i]._squalusType.value();
        if (url.indexOf(keyPlaceholder) === -1) {
          if (val !== null && val !== '') {
            convertValueToParam(val, key, query);
          }
        } else {
          url = url.replace(keyPlaceholder, encodeURI(val));
        }
      }
    }

    url = new URL(url, window.location.href);
    query.forEach((value, key) => url.searchParams.append(key, value));

    return url;
  }

  buildParamsNode() {
    if (!this._params) {
      return null;
    }
    return $('table',
      $('tbody',
        this._params.keys().map(param => {
          // this has to happen for each tab
          const type = this._params.get(param);
          return $('tr', { class: 'test-param', _squalusType: type },
            $('th', param),
            $('td', type.build())
          );
        })
      )
    );
  }

  appendTableControls(table) {
    if (this._params) {
      table.appendChild(
        $('thead',
          $('tr',
            $('th'),
            $('th', (this._method === 'PUT')
              ? $('input', { type: 'button', value: 'GET', class: 'test-edit' })
              : document.createTextNode('[params]')
            ),
            $('td', this.buildParamsNode())
          )
        )
      );
    }

    table.appendChild(
      $('tfoot',
        $('tr',
          $('th'),
          $('th', $('input', { type: 'button', value: this._method, class: 'test-submit' })),
          $('td', $('span', { class: 'test-edit-status' }))
        )
      )
    );
  }

  build() {
    const item = $('li',
      $('div', { class: `endpoint-method-${this._method.toLowerCase()}` },
        $('span', { class: 'endpoint-method' }, this._method),
        $('span', { class: 'endpoint-path' }, this._url)
      ),
      $('div', { class: 'endpoint-test' },
        $('div', { class: 'endpoint-test-body' })
      )
    );
    this._body = item.querySelector('.endpoint-test-body');
    this._json = null;

    this._body.innerHTML = '';
    this._body._squalusDef = this;

    let table = this._type ? this._type.build() : $('table');

    if (this._type instanceof ScalarType || this._type instanceof BranchType) {
      table = $('table',
        $('tbody',
          $('tr',
            $('th', 'body'),
            $('td', table)
          )
        )
      );
    }

    this.appendTableControls(table);

    // check for xml, etc.
    if (this._type && (!(this._type instanceof ScalarType) || !this._type.contentType())) {
      const json = $('table',
        $('tbody',
          $('tr',
            $('th', 'JSON'),
            $('td', $('textarea', { class: 'test-json' }))
          )
        )
      );

      this.appendTableControls(json);

      // tabs
      const container = $('div', { class: 'tab-container' },
        $('ul',
          $('li', { class: 'current' }, 'Editor'),
          $('li', 'JSON')
        ),
        $('div', { class: 'current' }, table),
        $('div', json)
      );
      this._body.appendChild(container);

      // todo: trigger tab switch?
    } else {
      this._body.appendChild(table);
    }

    this._json = this._body.querySelector('.test-json');

    return item;
  }

  switchTab(index) {
    const divs = this._body.querySelectorAll('.tab-container > div');
    const lis = this._body.querySelectorAll('.tab-container > ul > li');

    for (let i = 0; i < divs.length; i++) {
      divs[i].classList.toggle('current', i === index);
      lis[i].classList.toggle('current', i === index);
    }

    if (this._json) {
      const val = this._type.value();
      if (val !== null) {
        this._json.value = JSON.stringify(val, null, 2);
      }
    }
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
    this.syncTabParams();

    fetch(url).then(res => {
      if (!res.ok) {
        //
      }

      let data = res.json();

      // todo: this is going to require the actual validation implementation to handle branching

      // if data is array, edit the first one (for convenience, to support shared id/search path)
      if (Array.isArray(data)) {
        if (data.length && (this._params && Object.keys(this._params).length === 1)) {
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

  static onTabSwitch(event, def) {
    (def || this.closest(event.target)).switchTab(event.target.previousElementSibling ? 1 : 0);
  }

  static closest(elem) {
    const node = closestAncestorByClassName(elem, 'endpoint-test-body');
    return node ? node._squalusDef : null;
  }
}
