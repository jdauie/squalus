import { default as $ } from './../Tag';

const implementations = new Map();
[
  'null',
  'int',
  'uint',
  'float',
  'string',
  'bool',
  'date',
  'datetime',
  'timestamp',
  'guid',
].forEach(type => implementations.set(type, null));

export default class ScalarType {

  constructor(type, values) {
    this._type = type;
    this._values = this._parse(values);
    this._node = null;
  }

  get name() {
    return this._type;
  }

  clone() {
    return new ScalarType(this._type, this._values);
  }

  supportsValues() {
    return true;
  }

  _parse(values) {
    return values;
  }

  _build() {
    if (this._values) {
      if (this._values.length === 1) {
        return $('input', { type: 'text', disabled: true, value: this._values[0] });
      }
      return $('select',
        this._values.map(v => $('option', v))
      );
    }
    return $('input', { type: 'text', placeholder: this._type });
  }

  build() {
    this._node = this._build();
    this._node._squalusType = this;
    return this._node;
  }

  value() {
    return this._node.value;
  }

  populate(data) {
    this._node.value = data;
  }

  clear() {
    if (this._values) {
      if (this._node.selectedIndex !== undefined) {
        this._node.selectedIndex = 0;
      }
    } else {
      this._node.value = '';
    }
  }

  static register(type, implementation) {
    if (Array.isArray) {
      type.forEach(t => implementations.set(t, implementation));
    } else {
      implementations.set(type, implementation);
    }
  }

  static create(type, values) {
    return new (implementations.get(type) || ScalarType)(type, values);
  }

  static getScalarTypes() {
    return Array.from(implementations.keys());
  }
}
