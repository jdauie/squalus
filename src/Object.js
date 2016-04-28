"use strict";

import {default as $} from './Tag';

export default class Obj {

    constructor(name, attributes) {
        this._name = name;
        this._attributes = attributes;
        this._node = null;
    }

    name() {
        return this._name;
    }

    build() {
        return this._node = $('table', {'data-type': this},
            $('tbody',
                this._attributes.map(function (type) {
                    return type.build();
                })
            )
        );
    }

    value() {
        var data = {};
        this._attributes.forEach(function (attr) {
            if (attr.required() || attr.included()) {
                data[attr.name()] = attr.value();
            }
        });
        return data;
    }

    populate(data, path, types) {
        this._attributes.forEach(function (attr) {
            if (data.hasOwnProperty(attr.name())) {
                attr.populate(data[attr.name()], path, types);
            }
        });
    }

    clear() {
        this._attributes.forEach(function (i, attr) {
            attr.clear();
        });
    }
}
