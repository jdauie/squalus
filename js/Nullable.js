"use strict";

define([], function () {

    class Nullable {

        constructor(type) {
            this._type = type;
        }

        name() {
            return this._type.name();
        }

        build() {
            return this._type.build();
        }

        value() {
            var val = this._type.value();
            if (val === '') {
                val = null;
            }
            return val;
        }

        populate(data, path, types) {
            this._type.populate(data, path, types);
        }

        clear() {
            this._type.clear();
        }
    }

    return Nullable;

});