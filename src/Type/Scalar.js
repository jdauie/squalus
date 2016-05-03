import { default as $ } from './../Tag';

export default class Scalar {

  constructor(type, values) {
    this._type = type;
    this._values = values;
    this._node = null;
  }

  get name() {
    return this._type;
  }

  build() {
    if (this._type === 'null') {
      this._node = document.createTextNode('');
    } else if (this._type === 'bool') {
      this._node = $('input', { type: 'checkbox', _squalusType: this });
    } else if (this._values) {
      const keys = Object.keys(this._values);
      if (keys.length === 1) {
        this._node = $('input', {
          type: 'text',
          disabled: true,
          value: this._values[keys[0]],
          'data-type': this,
        });
      } else {
        this._node = $('select', { _squalusType: this },
          Object.keys(this._values).map((key) => $('option', this._values[key]))
        );
      }
    } else if (this._type === 'anything') {
      this._node = $('textarea', { placeholder: this._type, 'data-type': this });
    } else {
      this._node = $('input', { type: 'text', placeholder: this._type, _squalusType: this });
    }
    return this._node;
  }

  value() {
    if (this._type === 'null') {
      return null;
    } else if (this._type === 'bool') {
      return this._node.prop('checked');
    }

    let val = this._node.value;
    if (this._type === 'int') {
      val = parseInt(val, 10);
    } else if (this._type === 'float') {
      val = parseFloat(val);
    }

    if (['object', 'array', 'anything'].includes(this._type)) {
      val = JSON.parse(val);
    }

    return val;
  }

  populate(data) {
    if (this._type === 'null') {
      // do nothing
    } else if (this._type === 'bool') {
      this._node.checked = data;
    } else {
      this._node.value = data;
    }
  }

  clear() {
    if (this._type === 'null') {
      // do nothing
    } else if (this._type === 'bool') {
      this._node.checked = false;
    } else {
      if (this._values) {
        this._node.selectedIndex = 0;
        // todo: trigger change event
      } else {
        this._node.value = '';
      }
    }
  }
}
