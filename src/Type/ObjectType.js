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

  validate(value, path, silent, context) {
    // todo: filter/warn on unrecognized attributes

    if (typeof value !== 'object' || value === null) {
      if (silent) {
        return false;
      }
      throw new Error(`${path} must be an object`);
    }

    for (let i = 0; i < this._attributes.length; i++) {
      const attr = this._attributes[i];
      const key = attr.name();

      if (value[key] === undefined) {
        if (attr.required()) {
          if (silent) {
            return false;
          }
          throw new Error(`${path}.${key} is required`);
        }
      } else if (!attr.validate(value[key], `${path}.${key}`, silent, context)) {
        return false;
      }
    }

    if (context._throwUnknownObjectAttributes) {
      const allowedKeys = new Set(this._attributes.map(a => a.name()));
      const diff = Object.keys(value).filter(x => !allowedKeys.has(x));
      if (diff.length > 0) {
        throw new Error(`Unknown attributes \`${diff.join(',')}\` not allowed in \`${path}\``);
      }
    }

    return true;
  }

  clear() {
    this._attributes.forEach(attr => attr.clear());
  }

  toJSON() {
    return {
      _: 'object',
      attributes: this._attributes,
    };
  }
}
