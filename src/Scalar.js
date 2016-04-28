"use strict";

import {default as $} from './Tag';

export default class Scalar {

    constructor(type, values) {
        this._type = type;
        this._values = values;
        this._node = null;
    }

    name() {
        return this._type.name;
    }

    contentType() {
        return this._type.contentType;
    }

    build() {
        if (this.name() === 'null') {
            this._node = document.createTextNode('');
        }
        else if (this.name() === 'bool') {
            this._node = $('input', {type: 'checkbox', 'data-type': this});
        }
        else if (this._values) {
            var keys = Object.keys(this._values);
            if (keys.length === 1) {
                this._node = $('input', {
                    type: 'text',
                    disabled: true,
                    value: this._values[keys[0]],
                    'data-type': this
                });
            }
            else {
                this._node = $('select', {'data-type': this},
                    Object.keys(this._values).map(function (key) {
                        return $('option', this._values[key]);
                    })
                );
            }
        }
        else if (this.name() === 'object' || this.name() === 'anything' || this.contentType()) {
            this._node = $('textarea', {placeholder: this.name(), 'data-type': this});
        }
        else {
            this._node = $('input', {type: 'text', placeholder: this.name(), 'data-type': this});
        }
        return this._node;
    }

    value() {
        if (this.name() === 'null') {
            return null;
        }
        else if (this.name() === 'bool') {
            return this._node.prop('checked');
        }

        var val = this._node.val();
        if (this.name() === 'int') {
            val = parseInt(val);
        }
        else if (this.name() === 'float') {
            val = parseFloat(val);
        }

        if (this.name() === 'object' || this.name() === 'array' || this.name() === 'anything') {
            val = JSON.parse(val);
        }

        return val;
    }

    populate(data) {
        if (this.name() === 'null') {
            // do nothing
        }
        else if (this.name() === 'bool') {
            this._node.checked = data;
        }
        else {
            this._node.value = data;
        }
    }

    clear() {
        if (this.name() === 'null') {
            // do nothing
        }
        else if (this.name() === 'bool') {
            this._node.checked = false;
        }
        else {
            if (this._values) {
                this._node.selectedIndex = 0;
                // todo: trigger change event
            }
            else {
                this._node.value = '';
            }
        }
    }
}
