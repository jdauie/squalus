define(['squalus/Type', 'object-clone'], function() {

    class Map extends Type {

        constructor(type, key, required) {
            this._type = type;
            this._key = key;
            this._required = required;
            this._rows = [];
        }

        name() {
            return this._type.name()+'{}';
        }

        html() {
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
        }

        populate(data, path, types) {
            Object.keys(data).forEach(function(key, i){
                var row = this.add();
                this.body().children[i].firstElementChild.textContent = key;
                row.populate(data[key], path+"['"+key+"']", types);
            }.bind(this));
        }

        value() {
            var obj = {};
            this._rows.forEach(function(row, i){
                var key = this.body().children[i].children[1].children.firstElementChild.textContent;
                obj[key] = row.value();
            }.bind(this));
            return obj;
        }

        clear() {
            this._rows = [];
            this.node().querySelector('tbody').innerHTML = '';
        }

        add(type, key) {
            var clone = type || Object.clone(this._type, true);
            this._rows.push(clone);
            var keyField = this._key ? this._key.html() : createElementFromHtml('<input type="text" placeholder="key">');
            if (key) {
                keyField.value = key;
            }
            var tr = this.body().appendChild(createElementFromHtml(`
                <tr>
                    <th><input class="test-row-remove" type="button" value="-"></th>
                    <th></th>
                    <td></td>
                </tr>
            `));
            tr.children[1].appendChild(keyField);
            tr.children[2].appendChild(clone.html());
            return clone;
        }

        remove(i) {
            this._rows.splice(i, 1);
            this.body().removeChild(this.body().children[i])
        }

        body() {
            if (!this._tbody) {
                this._tbody = this.node().querySelector('tbody');
            }
            return this._tbody;
        }
    }

    return Map;

});