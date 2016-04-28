"use strict";

import Scalar from './Scalar';
import Nullable from './Nullable';

export default class Any {

    constructor(types) {
        this._types = types;
        this._node = null;
    }

    name() {
        return this._types.map(function (type) {
            return type.name();
        }).join('|');
    }

    replace() {
        if (this._types.length === 2 && (this._types[0] instanceof Scalar) && this._types[1].name() === 'null') {
            return new Nullable(this._types[0]);
        }
        return this;
    }

    build() {
        return this._node = $('div', {'data-type': this},
            $('select', {class: 'test-option'}, this._types.map(function (type) {
                return $('option', getLastToken(type.name()));
            })),
            this._types.map(function (type) {
                return $('div', {class: 'test-option'}, type.build());
            })
        );
    }

    value() {
        return this._types[this._node.firstElementChild.selectedIndex].value();
    }

    populate(data, path, types) {
        var current = types[path];

        var type = this._types.find(function (type) {
            return type.name() === current || current.endsWith('_' + getLastToken(type.name()));
        });

        var select = this._node.firstElementChild;
        select.value = type.name();

        // trigger change event

        type.populate(data);
    }

    clear() {
        for (let type of this._types) {
            type.clear();
        }
    }

    static onChange(event) {
        var node = this;
        var i = 0;
        while (node = node.nextElementSibling) {
            node.classList.toggle('test-hidden', i++ !== this.selectedIndex);
        }
    }
}

var getLastToken = function (str, char) {
    if (char === undefined) {
        char = '_';
    }
    return str.substr(str.lastIndexOf(char) + 1)
};