import { default as $ } from './../Tag';

export default class AttributeType {

  constructor(name, type, required) {
    this._name = name;
    this._type = type;
    this._required = required;
    this._included = false;
  }

  name() {
    return this._name;
  }

  type() {
    return this._type;
  }

  required() {
    return this._required;
  }

  included() {
    return this._included;
  }

  clone() {
    return new AttributeType(this._name, this._type, this._required);
  }

  build() {
    this._node = $('tr', { _squalusType: this },
      $('th'),
      $('th', this._name),
      $('td', this._type.build())
    );
    if (!this._required) {
      this._node.firstElementChild.appendChild(
        $('input', { type: 'button', class: 'test-attr-toggle', value: '\uD83D\uDCCE' })
      );
    }
    this.update();
    return this._node;
  }

  value() {
    return this._type.value();
  }

  populate(data, path, types) {
    this._type.populate(data, `${path}.${this._name}`, types);
    this._included = true;
    this.update();
  }

  clear() {
    this._type.clear();
    this._included = false;
    this.update();
  }

  toggle() {
    this._included = !this._included;
    this.update();
  }

  update() {
    if (!this._required) {
      this._node.children[0].firstElementChild.classList.toggle('test-attr-included', this._included);
      this._node.children[1].classList.toggle('test-attr-toggle', !this._included);
      this._node.children[2].firstElementChild.classList.toggle('test-hidden', !this._included);
    }
  }

  static onClickToggle(event) {
    event.target.parentNode.parentNode._squalusType.toggle();
  }
}

