import { default as $ } from './../Tag';

export default class BranchType {

  constructor(types) {
    this._types = types;
    this._node = null;

    if (types.size < 2) {
      throw new Error('degenerate branch type');
    }
  }

  get types() {
    return this._types;
  }

  clone() {
    const types = new Map();
    this._types.forEach((type, key) => types.set(key, type.clone()));
    return new this.constructor(types);
  }

  build() {
    this._node = $('div', { _squalusType: this },
      $('select', { class: 'test-option' },
        Array.from(this._types.keys(), key => $('option', key))
      ),
      Array.from(this._types.values(), value => $('div', { class: 'test-option' }, value.build()))
    );
    return this._node;
  }

  value() {
    return Array.from(this._types.values())[this._node.firstElementChild.selectedIndex].value();
  }

  populate(data) {
    // validate data to determine branch
    const types = Array.from(this._types.values());
    const i = types.findIndex(type =>
      type.validate(data, '', true)
    );

    if (i === -1) {
      throw new Error('branch validation failed');
    }

    const select = this._node.firstElementChild;
    select.selectedIndex = i;

    const event = new Event('change', { bubbles: true });
    select.dispatchEvent(event);

    types[i].populate(data);
  }

  validate(value, path, returnOnly) {
    if (!this._types.some(type => type.validate(value, path, returnOnly))) {
      if (returnOnly) {
        return false;
      }
      throw new Error(`${path} does not match any candidate`);
    }
    return true;
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

  static initializeSelectionStates(root) {
    Array.from(root.querySelectorAll('select')).forEach(elem => {
      const event = new Event('change', { bubbles: true });
      elem.dispatchEvent(event);
    });
  }
}
