"use strict";

define(['squalus/Tag', 'object-clone'], function($) {

	class Vector {

		constructor(type) {
			this._type = type;
			this._rows = [];
			this._node = null;
			this._body = null;
		}

		name() {
			return this._type.name()+'[]';
		}

		build() {
			return this._node = $('div', {'data-type': this},
                $('table',
                    this._body = $('tbody'),
                    $('tfoot',
                        $('th', $('input', {type: 'button', class: 'test-row-add', value: '+'})),
                        $('th'),
                        $('td')
                    )
                )
            );
		}

		populate(data, path, types) {
			for (var i = 0; i < data.length; i++) {
				var row = this.add();
				row.populate(data[i], `${path}[${i}]`, types);
			}
		}

		value() {
			return this._rows.map(function(val) {
				return val.value();
			});
		}

		clear() {
			this._rows = [];
			this._body.innerHTML = '';
		}

		add() {
			var clone = Object.clone(this._type, true);
			this._rows.push(clone);
            this._body.appendChild($('tr',
                $('th', $('input', {type: 'button', class: 'test-row-remove', value: '-'})),
                $('th', `[${this._body.children.length}]`),
                $('td', clone.build())
            ));
			return clone;
		}

		remove(i) {
			this._rows.splice(i, 1);
			this._body.children[i].remove();
		}
	}

	Vector.onClickAdd = function(event) {
		this.parentNode.parentNode.dataset.type.add();
	};

	Vector.onClickRemove = function(event) {
        var row = this.parentNode.parentNode;
        var index = Array.prototype.indexOf.call(row.parentNode.children, row);
        row.parentNode.parentNode.dataset.type.remove(i);
	};
	
	return Vector;

});