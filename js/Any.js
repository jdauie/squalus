"use strict";

define(['squalus/Scalar', 'squalus/Nullable'], function(Scalar, Nullable) {

    class Any {

        constructor(types) {
            this._types = types;
            this._node = null;
        }

        name() {
            return this._types.map(function(type) {
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
            return this._node = tag('div', {'data-type': this},
                tag('select', {class: 'test-option'}, this._types.map(function(type) {
                    return tag('option', getLastToken(type.name()));
                })),
                this._types.map(function (type) {
                    return tag('div', {class: 'test-option'}, type.build());
                })
            );
        }

        value() {
            return this._types[this._node.firstElementChild.selectedIndex].value();
        }

        populate(data, path, types) {
            var current = types[path];

            var type = this._types.find(function(type) {
                return type.name() === current || current.endsWith('_'+getLastToken(type.name()));
            });

            var select = this._node.firstElementChild;
            select.value = type.name();

            // trigger change event

            type.populate(data);
        }

        clear() {
            this._types.forEach(function(type) {
                type.clear();
            });
        }
    }

    Any.onChange = function(event) {
        var node = this;
        var i = 0;
        while (node = node.nextElementSibling) {
            node.classList.toggle('test-hidden', i++ !== this.selectedIndex);
        }
    };

    var getLastToken = function(str, char) {
        if (char === undefined) {
            char = '_';
        }
        return str.substr(str.lastIndexOf(char)+1)
    };

    var replaceAll = function(str, map, processReplaceValuesAsRegex) {
        if (map) {
            var keys = Object.keys(map);
            for (var i = 0; i < keys.length; i++) {
                var value = map[keys[i]];
                str = str.replace(new RegExp(keys[i], 'g'), processReplaceValuesAsRegex ? value : (function(value) {
                    return function() {
                        return value;
                    };
                }(value)));
            }
        }
        return str;
    };

    return Any;

});