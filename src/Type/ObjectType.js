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
    return new ObjectType(this._attributes.map(attr => attr.clone()));
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

  clear() {
    this._attributes.forEach(attr => attr.clear());
  }
}
