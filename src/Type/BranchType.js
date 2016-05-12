import { default as $ } from './../Tag';

export default class BranchType {

  constructor(types) {
    this._types = types;
    this._node = null;
  }

  get types() {
    return this._types;
  }

  clone() {
    const types = new Map();
    this._types.forEach((type, key) => types.set(key, type.clone()));
    return new BranchType(types);
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
    // todo: validate data to determine branch
    const type = null;

    const select = this._node.firstElementChild;
    select.value = type.name();

    // todo: trigger change event

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

  static initializeSelectionStates(root) {
    Array.from(root.querySelectorAll('select')).forEach(elem => {
      const event = new Event('change', { bubbles: true });
      elem.dispatchEvent(event);
    });
  }
}
