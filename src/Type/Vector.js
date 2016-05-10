import { default as $ } from './../Tag';

export default class Vector {

  constructor(type) {
    this._type = type;
    this._rows = [];
    this._node = null;
    this._body = null;
  }

  name() {
    return `${this._type.name()}[]`;
  }

  clone() {
    return new Vector(this._type.clone());
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
    return this._node;
  }

  populate(data, path, types) {
    for (let i = 0; i < data.length; i++) {
      const row = this.add();
      row.populate(data[i], `${path}[${i}]`, types);
    }
  }

  value() {
    return this._rows.map((val) => val.value());
  }

  clear() {
    this._rows = [];
    this._body.innerHTML = '';
  }

  add() {
    const clone = this._type.clone();
    this._rows.push(clone);
    this._body.appendChild($('tr',
      $('th', $('input', { type: 'button', class: 'test-row-remove', value: '-' })),
      $('th', `[${this._body.children.length}]`),
      $('td', clone.build())
    ));
    return clone;
  }

  remove(i) {
    this._rows.splice(i, 1);
    this._body.children[i].remove();
  }

  static onClickAdd(event) {
    event.target.parentNode.parentNode.parentNode.parentNode._squalusType.add();
  }

  static onClickRemove(event) {
    const row = event.target.parentNode.parentNode;
    const i = Array.prototype.indexOf.call(row.parentNode.children, row);
    row.parentNode.parentNode.parentNode._squalusType.remove(i);
  }
}
