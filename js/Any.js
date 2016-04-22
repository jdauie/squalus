"use strict";

define(['squalus/Type', 'squalus/Scalar', 'squalus/Nullable'], function(Scalar, Nullable) {

    class Any extends Type {

        constructor(types) {
            super.constructor();
            this._types = types;
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

        html() {
            return `
            <div id="${this._id}">
                <select class="test-option">
                    ${this._types.map(function (type) {
                        return `<option>${getLastToken(type.name())}</option>`;
                    }).join()}
                </select>
                ${this._types.map(function (type, i) {
                    return `<div class="test-option">${type.html()}</div>`;
                })}
            </div>
            `;
        }

        value() {
            return this._types[this.node().firstElementChild.selectedIndex].value();
        }

         populate(data, path, types) {
            var current = types[path];

            var type = this._types.find(function(type) {
                return type.name() === current || current.endsWith('_'+getLastToken(type.name()));
            });

            var select = this.node().firstElementChild;
            select.value = type.name();

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
            showElement(node, i++ == this.selectedIndex);
        }
    };

    var showElement = function(elem, cond) {
        if (cond === undefined) {
            cond = true;
        }
        elem.style.display = cond ? null : 'none';
    };

    var isVisible = function(elem) {
        return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
    };

    var createElementFromHtml = function(html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        if (div.children.length != 1) {
            throw "not a single element";
        }
        return div.firstElementChild;
    };

    var createElement = function(obj) {
        var elem = document.createElement(obj.tag);
        if (obj.class) {
            elem.className = obj.class;
        }
        if (obj.text) {
            elem.textContent = obj.text;
        }
        if (obj.append) {
            obj.append.forEach(function(elem) {
                elem.appendChild(elem);
            });
        }
        return elem;
    };

    var createElementSimple = function(tagName, text) {
        return createElement({
            tag: tagName,
            text: text
        });
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