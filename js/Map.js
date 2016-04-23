"use strict";

define(['squalus/Tag', 'object-clone'], function($) {

    class Map {

        constructor(type, key, required) {
            this._type = type;
            this._key = key;
            this._required = required;
            this._rows = [];
            this._node = null;
            this._body = null;
        }

        name() {
            return this._type.name()+'{}';
        }

        build() {
            this._node = $('div', {'data-type': this},
                $('table',
                    this._body = $('tbody', {class: 'test-map-rows'}),
                    $('tfoot',
                        $('th', $('input', {type: 'button', class: 'test-row-add', value: '+'})),
                        $('th'),
                        $('td')
                    )
                )
            );
            if (this._required) {
                this._required._attributes.forEach(function(attr){
                    this.add(attr._type, attr.name());
                }.bind(this));
            }
            return this._node;
        }

        populate(data, path, types) {
            Object.keys(data).forEach(function(key, i){
                var row = this.add();
                this._body.children[i].firstElementChild.textContent = key;
                row.populate(data[key], `${path}[${key}]`, types);
            }.bind(this));
        }

        value() {
            var obj = {};
            this._rows.forEach(function(row, i){
                var key = this._body.children[i].children[1].children.firstElementChild.textContent;
                obj[key] = row.value();
            }.bind(this));
            return obj;
        }

        clear() {
            this._rows = [];
            this._body.innerHTML = '';
        }

        add(type, key) {
            var clone = type || Object.clone(this._type, true);
            this._rows.push(clone);
            var keyField = this._key ? this._key.build() : $('input', {type: 'text', placeholder: 'key'});
            if (key) {
                keyField.value = key;
            }
            this._body.appendChild($('tr',
                $('th', $('input', {type: 'button', class: 'test-row-remove', value: '-'}),
                $('th', keyField),
                $('td', clone.build())
            )));
            return clone;
        }

        remove(i) {
            this._rows.splice(i, 1);
            this._body.children[i].remove()
        }
    }

    return Map;

});