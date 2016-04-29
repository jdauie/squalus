"use strict";

define([
    'require',
    'squalus/Tag',
    'squalus/Any',
    'squalus/Attribute',
    'squalus/Map',
    'squalus/Object',
    'squalus/Scalar',
    'squalus/Vector'
], function (require, $, Any, Attribute, Map, Obj, Scalar, Vector) {

    class Definition {

        constructor(guid, endpoint, type, params) {
            this._guid = guid;
            this._endpoint = endpoint;
            this._type = type ? createType(type) : null;
            this._params = params;
            this._test = document.getElementById(guid);
            this._body = this._test.querySelector('.endpoint-test-body');
            this._json = this._body.querySelector('.test-json');

            this._body.innerHTML = '';
            this._body.dataset.definition = this;
        }

        syncTabParams () {
            var container = this._body.querySelector('.tab-container');
            if (container) {
                var src = container.children().filter('.current').find('.test-param');
                var dst = container.children().not('.current').find('.test-param');
                src.each(function (i, node) {
                    dst.eq(i).val($(node).val());
                });
            }
        }

        updateSingleParam (data) {
            if (this._endpoint.params) {
                if (data.Id) {
                    this._body.querySelector('.test-param').dataset.type.populate(data.Id);
                }
            }
        }

        value () {
            if (!this._type) {
                return null;
            }

            // use the json tab (instead of the form) if it is selected
            if (this._json && closestAncestorByTagName(this._json).classList.contains('current')) {
                var val = this._json.value;
                if (val === '') {
                    val = null;
                }
                return JSON.parse(val);
            }
            return this._type.value();
        }

        populate (data, types) {
            this._type.populate(data, 'body', types);
            this.switchTab(0);
        }

        clear () {
            this._type.clear();
            this._json.value = '';
        }

        lock () {
            //this._body.find('*').prop('disabled', true);
        }

        unlock () {
            //this._body.find('*').prop('disabled', false);
        }

        getPopulatedUrl () {
            var url = this._endpoint.url;
            var query = {};
            var map = {};
            if (this._endpoint.params) {
                var params = Object.keys(this._endpoint.params);
                var tab = this._body.querySelector('.tab-container .current') || this._body;
                var testParams = tab.querySelectorAll('.test-param');
                for (var i = 0; i < testParams.length; i++) {
                    var key = params[i];
                    var keyPlaceholder = '<' + key + '>';
                    var val = testParams[i].dataset.type.value();
                    if (url.indexOf(keyPlaceholder) === -1) {
                        if (val !== '' && val != null) {
                            convertValueToParam(val, key, query);
                        }
                    }
                    else {
                        map[keyPlaceholder] = encodeURI(val);
                    }
                }
            }
            url = Utilities.replaceAll(url, map);
            query = $.param(query);
            if (query) {
                url += '?' + query;
            }

            return url;
        }

        buildParamsNode () {
            if (this._endpoint.params) {
                return $('table',
                    $('tbody',
                        Object.keys(this._endpoint.params).map(function (param, i) {
                            // this has to happen for each tab
                            var type = createType(this._params[param].type);
                            return $('tr', {class: 'test-param', 'data-type': type},
                                $('th', param),
                                $('td', type.build())
                            )
                        }.bind(this))
                    )
                );
            }
        }

        appendTableControls (table) {
            if (this._endpoint.params) {
                table.appendChild(
                    $('thead',
                        $('tr',
                            $('th'),
                            $('th', (this._endpoint.method === 'PUT')
                                ? $('input', {type: 'button', value: 'GET', class: 'test-edit'})
                                : document.createTextNode('[params]')
                            ),
                            $('td', this.buildParamsNode()),
                        )
                    )
                );
            }

            table.appendChild(
                $('tfoot',
                    $('tr',
                        $('th'),
                        $('th', $('input', {type: 'button', value: this._endpoint.method, class: 'test-submit'})),
                        $('td', $('span', {class: 'test-edit-status'})),
                    )
                )
            );
        }

        build () {
            var body = this._body;

            var table = this._type ? this._type.build() : $('table');

            if (this._type instanceof Scalar || this._type instanceof Any) {
                table = $('table',
                    $('tbody',
                        $('tr',
                            $('th', 'body'),
                            $('td', table)
                        )
                    )
                );
            }

            this.appendTableControls(table);

            // check for xml, etc.
            if (this._type && (!(this._type instanceof Scalar) || !this._type.contentType())) {

                var json = $('table',
                    $('tbody',
                        $('tr',
                            $('th', 'JSON'),
                            $('td', $('textarea', {class: 'test-json'}))
                        )
                    )
                );

                this.appendTableControls(json);

                // tabs
                var container = $('div', {class: 'tab-container'},
                    $('ul',
                        $('li', {class: 'current'}, 'Editor'),
                        $('li', 'JSON')
                    ),
                    $('div', {class: 'current'}, table),
                    $('div', json)
                );
                body.appendChild(container);

                // todo: trigger click event
                container.children().filter('ul').find('li').click(Definition.onTabSwitch)
            }
            else {
                body.append(table);
            }

            body.on('change', 'select.test-option', null, Any.onChange);

            // this is for both Map and Vector
            body.on('click', '.test-row-add', null, Vector.onClickAdd);
            body.on('click', '.test-row-remove', null, Vector.onClickRemove);

            body.on('click', '.test-attr-toggle', null, Attribute.onClickToggle);

            body.on('click', '.test-edit', null, onEdit);
            body.on('click', '.test-submit', null, onSubmit);

            body.on('keypress', 'input[type=text],input[type=checkbox],select', null, onKeyPress);
        }

        switchTab (index) {
            var divs = this._body.querySelectorAll('.tab-container > div');
            var lis = this._body.querySelectorAll('.tab-container > div');

            for (let i = 0; i < divs.length; i++) {
                divs[i].classList.toggle('current', i == index);
                lis[i].classList.toggle('current', i == index);
            }

            if (this._json) {
                var val = this._type.value();
                if (val !== null) {
                    this._json.value = JSON.stringify(val, null, 2);
                }
            }
        }

        submit () {
            var Factory = require('squalus/Factory');
            Factory.ajax({
                type: this._endpoint.method,
                url: this.getPopulatedUrl(),
                data: this.value(),
                outputId: this._guid
            });
        }

        edit () {
            var def = this;
            var status = def.body.find('.test-edit-status');
            def.clear();
            def.lock();
            def.syncTabParams();
            $.ajax({
                type: 'GET',
                url: def.getPopulatedUrl()
            }).done(function (data, textStatus, jqXHR) {
                status.text('');
                var Factory = require('squalus/Factory');

                // todo: this is going to require the actual validation implementation

                var types = JSON.parse(Factory.inflate(jqXHR.getResponseHeader("X-Squalus-Response-Valid-Types")));
                // check if data is array and edit the first one (for convenience only)
                // (this is for endpoints that support guid or search pattern, e.g. Users)
                if (Array.isArray(data)) {
                    if (data.length && (def.endpoint.params && Object.keys(def.endpoint.params).length === 1)) {
                        status.text('Loaded first record (' + data.length + ' total)');
                        data = data[0];
                        def.updateSingleParam(data);

                        // modify the "Any" result types as if for the single record
                        var types2 = {};
                        var arr = Object.keys(types);
                        for (var i = 0; i < arr.length; i++) {
                            var path = arr[i];
                            if (path.indexOf('body[0]') === 0) {
                                types2['body' + path.substr('body[0]'.length)] = types[path];
                            }
                        }
                        types = types2;
                    }
                    else {
                        data = null;
                    }
                }
                if (data) {
                    def.populate(data, types);
                    //editable.find('*').prop('disabled', false);
                }
                else {
                    status.text('No match for pattern');
                }
            }).fail(function (jqXHR, textStatus, errorThrown) {
                status.text(jqXHR.responseJSON.error.message);
            }).always(function () {
                def.unlock();
            });
        }
    }

    function onKeyPress(event) {
        if (event.which === 13) {
            event.preventDefault();
            closestDefinition(this).submit();
        }
    }

    function onSubmit(event) {
        closestDefinition(this).submit();
    }

    function onEdit(event) {
        closestDefinition(this).edit();
    }

    function onTabSwitch() {
        var index = $(this).parent().children().filter('li').index($(this));
        closestDefinition(this).switchTab(index);
    }

    function closestDefinition(elem) {
        return closestAncestorByClassName(elem, 'endpoint-test-body').dataset.definition;
    }

    function closestAncestorByClassName(elem, className) {
        while (elem = elem.parent) {
            if (elem.classList.contains(className)) {
                return elem;
            }
        }
        return null;
    }

    function closestAncestorByTagName(elem, tagName) {
        while (elem = elem.parent) {
            if (elem.tagName === tagName) {
                return elem;
            }
        }
        return null;
    }

    function createType(def) {
        var func = require('squalus/' + def.class);
        var params = /\(([^\)]*)\)/.exec(func.prototype.constructor.toString());
        var args = [];
        if (params) {
            params = params[1].split(',').map(Function.prototype.call, String.prototype.trim);
            for (var i = 0; i < params.length; i++) {
                var value = def[params[i]];
                if (Array.isArray(value) && value[0].class) {
                    value = value.map(createType);
                }
                else if (value && value.class) {
                    value = createType(value);
                }
                args.push(value);
            }
        }
        var obj = func.construct(args);
        if (obj.replace) {
            obj = obj.replace();
        }
        return obj;
    }

    function convertValueToParam(val, key, query) {
        if (Array.isArray(val)) {
            val.map(function (item, i) {
                convertValueToParam(item, `${key}[${i}]`, query);
            });
        }
        else if (typeof val === 'object') {
            for (var name in val) {
                convertValueToParam(val[name], `${key}[${name}]`, query);
            }
        }
        else {
            if (typeof val === 'boolean') {
                val = (val ? 1 : 0);
            }
            query[key] = encodeURI(val);
        }
    }

    return Definition;

});