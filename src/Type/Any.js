import { default as $ } from './../Tag';

function getLastToken(str) {
  return str.substr(str.lastIndexOf('_') + 1);
}

export default class Any {

  constructor(types) {
    this._types = types;
    this._node = null;
  }

  build() {
    this._node = $('div', { _squalusType: this },
      $('select', { class: 'test-option' },
        Array.from(this._types.keys(), key => $('option', getLastToken(key)))
      ),
      Array.from(this._types.values(), value => $('div', { class: 'test-option' }, value.build()))
    );
    return this._node;
  }

  value() {
    return this._types[this._node.firstElementChild.selectedIndex].value();
  }

  populate(data, path, types) {
    const current = types[path];

    const type = this._types.find((t) => t.name() === current || current.endsWith(`_${getLastToken(t.name())}`));

    const select = this._node.firstElementChild;
    select.value = type.name();

    // trigger change event

    type.populate(data);
  }

  clear() {
    this._types.forEach(type => type.clear());
  }

  static onChange(event) {
    let node = event.target;
    let i = 0;
    while (node.nextElementSibling) {
      node = node.nextElementSibling;
      node.classList.toggle('test-hidden', i++ !== event.target.selectedIndex);
    }
  }
}
