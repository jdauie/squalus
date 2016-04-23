"use strict";

define(['squalus/Tag'], function ($) {

    class Attribute {

        constructor(name, type, required) {
            this._name = name;
            this._type = type;
            this._required = required;
            this._included = false;
        }

        name() {
            return this._name;
        }

        required() {
            return this._required;
        }

        included() {
            return this._included;
        }

        build() {
            this._node = $('tr', {'data-type': this},
                $('th'),
                $('th', this._name),
                $('td', this._type.build())
            );
            if (!this._required) {
                this._node.firstElementChild.appendChild([
                    $('input', {type: 'button', class: 'test-attr-toggle', value: '\uD83D\uDCCE'})
                ]);
            }
            this.update();
            return this._node;
        }

        value() {
            return this._type.value();
        }

        populate(data, path, types) {
            this._type.populate(data, `${path}.${this._name}`, types);
            this._included = true;
            this.update();
        }

        clear() {
            this._type.clear();
            this._included = false;
            this.update();
        }

        toggle() {
            this._included = !this._included;
            this.update();
        }

        update() {
            if (!this._required) {
                this._node.children[0].firstElementChild.classList.toggle('test-attr-included', this._included);
                this._node.children[1].classList.toggle('test-attr-toggle', !this._included);
                this._node.children[2].firstElementChild.classList.toggle('test-hidden', !this._included);
            }
        }
    }

    Attribute.onClickToggle = function (event) {
        this.parentNode.parentNode.dataset.type.toggle();
    };

    return Attribute;

});