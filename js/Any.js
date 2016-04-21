define(['squalus/Scalar', 'squalus/Nullable'], function(Scalar, Nullable) {

    var Any = function(types) {
        this._id = createUuidV4();
        this._types = types;
    };

    Any.prototype = {

        constructor: Any,

        name: function() {
            return this._types.map(function(type) {
                return type.name();
            }).join('|');
        },

        replace: function() {
            if (this._types.length === 2 && (this._types[0] instanceof Scalar) && this._types[1].name() === 'null') {
                return new Nullable(this._types[0]);
            }
            return this;
        },

        html: function() {
            return `
            <div id="${this._id}">
                <select class="test-option">
                    ${this._types.map(function(type) {
                        return `<option>${getLastToken(type.name())}</option>`;
                    }).join()}
                </select>
                ${this._types.map(function(type, i) {
                    return `<div class="test-option" ${i > 0 ? 'style="display:none"' : ''}>${type.html()}</div>`;
                })}
            </div>
            `;
        },

        value: function() {
            return this._types[document.getElementById(this._id).firstElementChild.selectedIndex].value();
        },

        populate: function(data, path, types) {
            var current = types[path];

            var type = this._types.find(function(type) {
                return type.name() === current || current.endsWith('_'+getLastToken(type.name()));
            });

            var select = document.getElementById(this._id).firstElementChild;
            select.value = type.name();

            // todo figure out a better way
            //select.dispatchEvent(new Event('change'));

            type.populate(data);
        },

        clear: function() {
            this._types.forEach(function(type) {
                type.clear();
            });
        }
    };

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

    var createUuidV4 = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    };

    return Any;

});