import { default as $ } from './../Tag';

export default class ObjectType {

  constructor(attributes) {
    this._attributes = attributes;
    this._node = null;
  }

  attributes() {
    return this._attributes;
  }

  clone() {
    return new this.constructor(this._attributes.map(attr => attr.clone()));
  }

  build() {
    this._node = $('table', { _squalusType: this },
      $('tbody',
        this._attributes.map(type => type.build())
      )
    );
    return this._node;
  }

  value() {
    const data = {};
    this._attributes.forEach((attr) => {
      if (attr.required() || attr.included()) {
        data[attr.name()] = attr.value();
      }
    });
    return data;
  }

  populate(data, path, types) {
    this._attributes.forEach(attr => {
      attr.populate(data[attr.name()], path, types);
    });
  }

  validate(value, path, returnOnly) {
    // todo: filter/warn on unrecognized attributes

    if (typeof value !== 'object') {
      if (returnOnly) {
        return false;
      }
      throw new Error(`${path} must be an object`);
    }

    for (let i = 0; i < this._attributes.length; i++) {
      const attr = this._attributes[i];
      const key = attr.name();

      if (value[key] === undefined) {
        if (attr.required()) {
          if (returnOnly) {
            return false;
          }
          throw new Error(`${path}.${key} is required`);
        }
      } else if (!attr.validate(value[key], `${path}.${key}`, returnOnly)) {
        return false;
      }
    }

    return true;
  }

  clear() {
    this._attributes.forEach(attr => attr.clear());
  }
}
