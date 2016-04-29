import { default as $ } from './Tag';
import Scalar from './Scalar';
import Nullable from './Nullable';

function getLastToken(str) {
  return str.substr(str.lastIndexOf('_') + 1);
}

export default class Any {

  constructor(types) {
    this._types = types;
    this._node = null;
  }

  name() {
    return this._types.map((type) => type.name()).join('|');
  }

  replace() {
    if (this._types.length === 2 && (this._types[0] instanceof Scalar) && this._types[1].name() === 'null') {
      return new Nullable(this._types[0]);
    }
    return this;
  }

  build() {
    this._node = $('div', { 'data-type': this },
      $('select', { class: 'test-option' },
        this._types.map((type) => $('option', getLastToken(type.name())))
      ),
      this._types.map((type) => $('div', { class: 'test-option' }, type.build()))
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
    for (const type of this._types) {
      type.clear();
    }
  }

  static onChange() {
    let node = this;
    let i = 0;
    while (node.nextElementSibling) {
      node = node.nextElementSibling;
      node.classList.toggle('test-hidden', i++ !== this.selectedIndex);
    }
  }
}
