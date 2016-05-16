import { default as $ } from './../Tag';
import BranchType from './BranchType';

export default class MapType {

  constructor(key, type, required) {
    this._type = type;
    this._key = key;
    this._required = required;
    this._rows = [];
    this._node = null;
    this._body = null;
  }

  name() {
    return `${this._type.name()}{}`;
  }

  clone() {
    return new this.constructor(this._key.clone(), this._type.clone(), this._required ? this._required.clone() : null);
  }

  build() {
    this._node = $('div', { _squalusType: this },
      $('table',
        this._body = $('tbody'),
        $('tfoot',
          $('th', $('input', { type: 'button', class: 'test-row-add', value: '+' })),
          $('th'),
          $('td')
        )
      )
    );
    if (this._required) {
      this._required.attributes().forEach((attr) => {
        this.add(attr.type(), attr.name());
      });
    }
    return this._node;
  }

  populate(data, path, types) {
    Object.keys(data).forEach((key, i) => {
      const row = this.add();
      this._body.children[i].firstElementChild.textContent = key;
      row.populate(data[key], `${path}[${key}]`, types);
    });
  }

  validate(value, path, returnOnly) {
    if (typeof value !== 'object') {
      if (returnOnly) {
        return false;
      }
      throw new Error(`${path} must be an object`);
    }

    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (!this._key.validate(key, `${path}[${key}]*`, returnOnly)) {
        return false;
      }

      if (!this._type.validate(value[key], `${path}[${key}]`, returnOnly)) {
        return false;
      }
    }

    if (this._required) {
      if (!this._type.validate(value, path, returnOnly)) {
        return false;
      }
    }

    return true;
  }

  value() {
    const obj = {};
    this._rows.forEach((row, i) => {
      const key = this._body.children[i].children[1].firstElementChild.value;
      obj[key] = row.value();
    });
    return obj;
  }

  clear() {
    this._rows = [];
    this._body.innerHTML = '';
  }

  add(type, key) {
    const clone = type || this._type.clone();
    this._rows.push(clone);
    const keyField = this._key ? this._key.build() : $('input', { type: 'text', placeholder: 'key' });
    if (key) {
      keyField.value = key;
    }
    this._body.appendChild($('tr',
        $('th', $('input', { type: 'button', class: 'test-row-remove', value: '-' })),
        $('th', keyField),
        $('td', clone.build())
      ));
    BranchType.initializeSelectionStates(this._body.lastElementChild);
    return clone;
  }

  remove(i) {
    this._rows.splice(i, 1);
    this._body.children[i].remove();
  }
}
