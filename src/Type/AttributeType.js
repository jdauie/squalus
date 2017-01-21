import { default as $ } from './../Tag';

export default class AttributeType {

  constructor(name, type, required) {
    this._name = name;
    this._type = type;
    this._required = required;
    this._included = false;

    if (this._name.endsWith('?')) {
      console.log(this);
    }
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
    return new this.constructor(this._name, this._type.clone(), this._required);
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

  populate(data) {
    this._type.populate(data);
    this._included = true;
    this.update();
  }

  validate(value, path, silent, context) {
    return this._type.validate(value, path, silent, context);
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

  toJSON() {
    return {
      _: 'attribute',
      name: this._name,
      type: this._type,
    };
  }

  static onClickToggle(event) {
    event.target.parentNode.parentNode._squalusType.toggle();
  }
}

