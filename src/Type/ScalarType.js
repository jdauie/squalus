import { default as $ } from './../Tag';

const implementations = new Map();
[
  'null',
  'int',
  'uint',
  'float',
  'string',
  'password',
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
    return new this.constructor(this._type, this._values);
  }

  supportsValues() {
    return true;
  }

  _parse(values) {
    return values;
  }

  _build() {
    const inputType = this._type === 'password' ? 'password' : 'text';

    if (this._values) {
      if (this._values.length === 1) {
        return $('input', { type: inputType, disabled: true, value: this._values[0] });
      }
      return $('select',
        this._values.map(v => $('option', v))
      );
    }
    return $('input', { type: inputType, placeholder: this._type });
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

  _validate(value) {
    return typeof value === 'string';
  }

  validate(value, path, silent) {
    if (!this._validate(value, path, silent)) {
      if (silent) {
        return false;
      }
      throw new Error(`${path} must be of type ${this._type}`);
    }

    if (this._values && !this._values.includes(value)) {
      if (silent) {
        return false;
      }
      throw new Error(`${path}: '${value}' must be in [${this._values.join(', ')}]`);
    }

    return true;
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
    if (Array.isArray(type)) {
      type.forEach(t => implementations.set(t, implementation));
    } else {
      implementations.set(type, implementation);
    }
  }

  toJSON() {
    return {
      _: 'scalar',
      type: this._type,
    };
  }

  static create(type, values) {
    return new (implementations.get(type) || ScalarType)(type, values);
  }

  static getScalarTypes() {
    return Array.from(implementations.keys());
  }
}
