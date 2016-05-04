import { default as $ } from './Tag';
import AnyType from './Type/Any';
import AttributeType from './Type/Attribute';
import MapType from './Type/Map';
import ObjectType from './Type/Object';
import ScalarType from './Type/Scalar';
import VectorType from './Type/Vector';
import NullableType from './Type/Nullable';
import Result from './Result';

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

function convertToMap(obj) {
  const map = new Map();
  Object.keys(map).forEach(key => {
    map.set(key, obj[key]);
  });
  return map;
}

function buildMap(keys, func) {
  const map = new Map();
  keys.forEach(key => {
    map.set(key, func ? func(key) : key);
  });
  return map;
}

function transformMap(map, func) {
  const newMap = new Map();
  map.forEach((value, key) => {
    newMap.set(key, func(value, key));
  });
  return newMap;
}

function createTypeFromDef(definition) {
  if (!definition) {
    return null;
  }

  const def = (typeof definition === 'string') ? {
    type: definition,
  } : definition;

  let type = def.type;
  let item = def.item;
  let values = null;
  let branches = null;

  // any shortcut (string|int|float)
  if (type.indexOf('|') !== -1) {
    branches = type.split('|');
    type = 'any';
  }

  // array shortcut
  if (type.endsWith('[]')) {
    if (item) {
      throw new Error('duplicate item declaration');
    }
    item = type.substr(0, type.length - 2);
    type = 'array';
  }

  // scalar values shortcut
  if (type.endsWith('}')) {
    values = type.substring(type.indexOf('{') + 1, type.length - 1).split(',');
    type = type.substring(0, type.indexOf('{'));
  }

  // nullable shortcut (string? => string|null)
  if (type.endsWith('?')) {
    branches = [type.substr(0, type.length - 1), 'null'];
    type = 'any';
  }

  const isScalar = [
    'null',
    'int',
    'float',
    'string',
    'bool',
  ].includes(type);

  // scalar values
  if (def.values) {
    if (!isScalar) {
      throw new Error('values can only be set for scalars');
    }
    if (values) {
      throw new Error('duplicate values declaration');
    }
    if (!Array.isArray(def.values)) {
      throw new Error('values must be an array');
    }
    values = def.values;
  }

  if (values && values.length === 0) {
    throw new Error('empty values list');
  }

  // any branches
  if (def.branches) {
    if (type !== 'any') {
      throw new Error('branches can only be set for any');
    }
    if (branches) {
      throw new Error('duplicate branches declaration');
    }
    branches = def.branches;
  }

  if (branches && branches.length === 0) {
    throw new Error('empty branches list');
  }

  // todo: ensure branches are unique (by type)

  // build type
  if (isScalar) {
    return new ScalarType(type, values);
  } else if (type === 'object') {
    if (!def.attributes) {
      throw new Error('object must have attributes (or be a map instead)');
    }
    return new ObjectType(Object.keys(def.attributes).map(a =>
      new AttributeType(a, createTypeFromDef(def.attributes[a]), def.attributes[a].required))
    );
  } else if (type === 'map') {
    return new MapType(createTypeFromDef(item), def.key, def.required);
  } else if (type === 'array') {
    return new VectorType(createTypeFromDef(item));
  } else if (type === 'any') {
    branches = Array.isArray(branches) ? buildMap(branches) : convertToMap(branches);
    branches = transformMap(branches, value => createTypeFromDef(value));
    // auto-null if possible (this could be confusing)
    if (branches.size === 2) {
      const types = Array.from(branches.values());
      if ((types[0] instanceof ScalarType) && (types[1] instanceof ScalarType) &&
        (types[0].name === 'null' || types[1].name === 'null')) {
        return new NullableType(types[0].name === 'null' ? types[1] : types[0]);
      }
    }

    return new AnyType(branches);
  }

  throw new Error('unknown type');
}

export default class Definition {

  constructor(id, url, method, params, type, responseType) {
    this._url = url;
    this._method = method;
    this._params = params;
    this._type = createTypeFromDef(type);
    this._responseType = createTypeFromDef(responseType);

    this._test = document.getElementById(id);
    this._body = this._test.querySelector('.endpoint-test-body');
    this._json = null;

    this._body.innerHTML = '';
    this._body._squalusDef = this;
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
        Object.keys(this._params).map(param => {
          // this has to happen for each tab
          const type = createTypeFromDef(this._params[param]);
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

    this._json = this._body.querySelector('.test-json');
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
    return closestAncestorByClassName(elem, 'endpoint-test-body')._squalusDef;
  }
}
