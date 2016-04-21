define(['object-clone'], function() {

    var Map = function(type, key, required) {
        this._type = type;
        this._key = key;
        this._required = required;
        this._rows = [];
        this._node = null;
    };

    Map.prototype = {

        constructor: Map,

        name: function() {
            return this._type.name()+'{}';
        },

        build: function() {
            this._node = createElementFromHtml(`
                <div><table>
                    <tbody class="test-map-rows"></tbody>
                    <tfoot>
                        <th><input class="test-row-add" type="button" value="+"></th>
                        <th></th>
                        <td></td>
                    </tfoot>
                </table></div>
            `);
            if (this._required) {
                this._required._attributes.forEach(function(attr){
                    this.add(attr._type, attr.name());
                }.bind(this));
            }
            this._node.dataset.type = this;
            return this._node;
        },

        populate: function(data, path, types) {
            Object.keys(data).forEach(function(key, i){
                var row = this.add();
                this._node.querySelector('tbody').children[i].firstElementChild.textContent = key;
                row.populate(data[key], path+"['"+key+"']", types);
            }.bind(this));
        },

        value: function() {
            var obj = {};
            this._rows.forEach(function(row, i){
                var key = this._node.querySelector('tbody').children[i].children[1].children.firstElementChild.textContent;
                obj[key] = row.value();
            }.bind(this));
            return obj;
        },

        clear: function() {
            this._rows = [];
            this._node.querySelector('tbody').innerHTML = '';
        },

        add: function(type, key) {
            var clone = type || Object.clone(this._type, true);
            this._rows.push(clone);
            var tbody = this._node.querySelector('tbody');
            var keyField = this._key ? this._key.build() : createElementFromHtml('<input type="text" placeholder="key">');
            if (key) {
                keyField.value = key;
            }
            var tr = tbody.appendChild(createElementFromHtml(`
                <tr>
                    <th><input class="test-row-remove" type="button" value="-"></th>
                    <th></th>
                    <td></td>
                </tr>
            `));
            tr.children[1].appendChild(keyField);
            tr.children[2].appendChild(clone.build());
            return clone;
        },

        remove: function(i) {
            this._rows.splice(i, 1);
            var tbody = this._node.querySelector('tbody');
            tbody.removeChild(tbody.children[i])
        }
    };

    return Map;

});