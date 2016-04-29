import { default as $ } from './Tag';
import 'js-object-clone';

export default class Map {

  constructor(type, key, required) {
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

  build() {
    this._node = $('div', { 'data-type': this },
      $('table',
        this._body = $('tbody', { class: 'test-map-rows' }),
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

  value() {
    const obj = {};
    this._rows.forEach((row, i) => {
      const key = this._body.children[i].children[1].children.firstElementChild.textContent;
      obj[key] = row.value();
    });
    return obj;
  }

  clear() {
    this._rows = [];
    this._body.innerHTML = '';
  }

  add(type, key) {
    const clone = type || Object.clone(this._type, true);
    this._rows.push(clone);
    const keyField = this._key ? this._key.build() : $('input', { type: 'text', placeholder: 'key' });
    if (key) {
      keyField.value = key;
    }
    this._body.appendChild($('tr',
      $('th', $('input', { type: 'button', class: 'test-row-remove', value: '-' }),
        $('th', keyField),
        $('td', clone.build())
      )));
    return clone;
  }

  remove(i) {
    this._rows.splice(i, 1);
    this._body.children[i].remove();
  }
}
