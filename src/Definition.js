import { default as $ } from './Tag';
import AnyType from './Type/Any';
import AttributeType from './Type/Attribute';
import MapType from './Type/Map';
import ObjectType from './Type/Object';
import ScalarType from './Type/Scalar';
import VectorType from './Type/Vector';
import Result from './Result';

const availableTypes = new Map();
[
  AnyType,
  AttributeType,
  MapType,
  ObjectType,
  ScalarType,
  VectorType,
].forEach(item => {
  availableTypes.set(item.prototype.constructor.name, item);
});

function closestAncestorByTagName(elem, tagName) {
  let e = elem.parentNode;
  while (e) {
    if (e.tagName === tagName) {
      return e;
    }
    e = e.parentNode;
  }
  return null;
}

function closestAncestorByClassName(elem, className) {
  let e = elem.parentNode;
  while (e) {
    if (e.classList.contains(className)) {
      return e;
    }
    e = e.parentNode;
  }
  return null;
}

function createType(def) {
  const func = availableTypes.get(def.class);
  let params = /\(([^\)]*)\)/.exec(func.prototype.constructor.toString());
  let args = [];
  if (params) {
    params = params[1].split(',').map(Function.prototype.call, String.prototype.trim);
    args = params.map((param) => {
      let value = def[param];
      if (Array.isArray(value) && value[0].class) {
        value = value.map(createType);
      } else if (value && value.class) {
        value = createType(value);
      }
      return value;
    });
  }
  let obj = Object.create(func.prototype);
  func.apply(obj, args);
  if (obj.replace) {
    obj = obj.replace();
  }
  return obj;
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

export default class Definition {

  constructor(id, endpoint, type, params) {
    this._endpoint = endpoint;
    this._type = type ? createType(type) : null;
    this._params = params;
    this._test = document.getElementById(id);
    this._body = this._test.querySelector('.endpoint-test-body');
    this._json = this._body.querySelector('.test-json');

    this._body.innerHTML = '';
    this._body.dataset.definition = this;
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
    if (this._endpoint.params) {
      if (data.Id) {
        this._body.querySelector('.test-param').dataset.type.populate(data.Id);
      }
    }
  }

  value() {
    if (!this._type) {
      return null;
    }

    // use the json tab (instead of the form) if it is selected
    if (this._json && closestAncestorByTagName(this._json).classList.contains('current')) {
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
    let url = this._endpoint.url;
    if (this._endpoint.params) {
      const params = Object.keys(this._endpoint.params);
      const tab = this._body.querySelector('.tab-container .current') || this._body;
      const testParams = tab.querySelectorAll('.test-param');
      for (let i = 0; i < testParams.length; i++) {
        const key = params[i];
        const keyPlaceholder = `<${key}>`;
        const val = testParams[i].dataset.type.value();
        if (url.indexOf(keyPlaceholder) === -1) {
          if (val !== null && val !== '') {
            convertValueToParam(val, key, query);
          }
        } else {
          url = url.replace(keyPlaceholder, encodeURI(val));
        }
      }
    }

    url = new URL(url);
    query.forEach((value, key) => url.searchParams.append(key, value));

    return url;
  }

  buildParamsNode() {
    if (!this._endpoint.params) {
      return null;
    }
    return $('table',
      $('tbody',
        Object.keys(this._endpoint.params).map(param => {
          // this has to happen for each tab
          const type = createType(this._params[param].type);
          return $('tr', { class: 'test-param', 'data-type': type },
            $('th', param),
            $('td', type.build())
          );
        })
      )
    );
  }

  appendTableControls(table) {
    if (this._endpoint.params) {
      table.appendChild(
        $('thead',
          $('tr',
            $('th'),
            $('th', (this._endpoint.method === 'PUT')
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
          $('th', $('input', { type: 'button', value: this._endpoint.method, class: 'test-submit' })),
          $('td', $('span', { class: 'test-edit-status' }))
        )
      )
    );
  }

  build() {
    const body = this._body;

    let table = this._type ? this._type.build() : $('table');

    if (this._type instanceof ScalarType || this._type instanceof AnyType) {
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
      body.appendChild(container);

      // todo: trigger tab switch
    } else {
      body.append(table);
    }
  }

  switchTab(index) {
    const divs = this._body.querySelectorAll('.tab-container > div');
    const lis = this._body.querySelectorAll('.tab-container > div');

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
    const method = this._endpoint.method;
    const value = JSON.stringify(this.value());

    fetch(url, {
      method,
      body: value,
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(res => {
      new Result(url, res).parse();
    }).catch(error => {
      new Result(url, error).parse();
    });
  }

  edit() {
    const url = this.getPopulatedUrl();
    const status = this._body.querySelector('.test-edit-status');

    status.text('');

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
        if (data.length && (this._endpoint.params && Object.keys(this._endpoint.params).length === 1)) {
          status.text(`Loaded first record (${data.length} total)`);
          data = data[0];
          this.updateSingleParam(data);
        } else {
          data = null;
        }
      }
      if (data) {
        this.populate(data);
      } else {
        status.text('No match for pattern');
      }

      this.unlock();
    }).catch(error => {
      status.text(error.message);
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
    (def || this.closest(event.target)).switchTab(event.target.previousSibling ? 1 : 0);
  }

  static closest(elem) {
    return closestAncestorByClassName(elem, 'endpoint-test-body').dataset.definition;
  }
}
