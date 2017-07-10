import { default as $ } from './../Tag';
import ValueCollection from './Scalar/ValueCollection';

const implementations = new Map();
[
  'string',
  'date',
  'datetime',
  'utc',
  'timestamp',
].forEach(type => implementations.set(type, null));

export default class ScalarType {

  constructor(type, values) {
    this._type = type;
    if (values instanceof ValueCollection) {
      this._values = values;
    } else {
      this._values = Array.isArray(values) ? this._parse(values) : null;
    }
    this._node = null;
  }

  get name() {
    return this._type;
  }

  clone() {
    return new this.constructor(this._type, this._values);
  }

  _parse(values) {
    return new ValueCollection(values);
  }

  _build() {
    if (this._values) {
      const values = this._values.values();
      if (values) {
        if (values.length === 1) {
          return $('input', { type: 'text', disabled: true, value: values[0] });
        }
        return $('select',
          values.map(v => $('option', v))
        );
      }
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
    this._node.value = (data === undefined) ? '' : data;
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

    if (this._values && !this._values.contains(value)) {
      if (silent) {
        return false;
      }
      throw new Error(`${path}: '${value}' must be in [${this._values.toString()}]`);
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

  static register(types) {
    types.forEach(type => {
      const supports = type.supports();
      (Array.isArray(supports) ? supports : [supports]).forEach(s => {
        if (implementations.has(s)) {
          throw new TypeError(`duplicate registration for scalar type ${s}`);
        }
        implementations.set(s, type);
      });
    });
  }

  static create(type, values) {
    return new (implementations.get(type) || ScalarType)(type, values);
  }

  static getScalarTypes() {
    return Array.from(implementations.keys());
  }
}
