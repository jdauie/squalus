define([], function() {

    class Type {
        constructor() {
            this._id = createUuidV4();
            this._node = null;
        }

        node() {
            if (!this._node) {
                this._node = document.getElementById(this._id);
                if (!this._node) {
                    throw "too early; node not available";
                }
                this._node.dataset.type = this;
            }
            return this._node;
        }
    }

    var createUuidV4 = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    };

    return Type;

});