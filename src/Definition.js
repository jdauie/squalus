import { default as $ } from './Tag';
import Any from './Any';
import Attribute from './Attribute';
import Map from './Map';
import Object from './Object';
import Scalar from './Scalar';
import Vector from './Vector';

function closestAncestorByTagName(elem, tagName) {
  let e = elem.parent;
  while (e) {
    if (e.tagName === tagName) {
      return e;
    }
    e = e.parent;
  }
  return null;
}

function closestAncestorByClassName(elem, className) {
  let e = elem.parent;
  while (e) {
    if (e.classList.contains(className)) {
      return e;
    }
    e = e.parent;
  }
  return null;
}

function closestDefinition(elem) {
  return closestAncestorByClassName(elem, 'endpoint-test-body').dataset.definition;
}

function onKeyPress(event) {
  if (event.which === 13) {
    event.preventDefault();
    closestDefinition(this).submit();
  }
}

function onSubmit() {
  closestDefinition(this).submit();
}

function onEdit() {
  closestDefinition(this).edit();
}

function onTabSwitch() {
  const index = $(this).parent().children().filter('li').index($(this));
  closestDefinition(this).switchTab(index);
}

function createType(def) {
  const func = require('squalus/' + def.class);
  let params = /\(([^\)]*)\)/.exec(func.prototype.constructor.toString());
  let args = [];
  if (params) {
    params = params[1].split(',').map(Function.prototype.call, String.prototype.trim);
    args = params.map((param) => {
      let value = def[param];
      if (Array.isArray(value) && value[0].class) {
        value = value.map(createType);
      } else if (value && value.class) {
        value = createType(value);
      }
      return value;
    });
  }
  let obj = func.construct(args);
  if (obj.replace) {
    obj = obj.replace();
  }
  return obj;
}

function convertValueToParam(val, key, query) {
  if (Array.isArray(val)) {
    val.forEach((item, i) =>
      convertValueToParam(item, `${key}[${i}]`, query)
    );
  } else if (typeof val === 'object') {
    Object.keys(val).forEach((name) =>
      convertValueToParam(val[name], `${key}[${name}]`, query)
    );
  } else if (typeof val === 'boolean') {
    query[key] = encodeURI(val ? 1 : 0);
  } else {
    query[key] = encodeURI(val);
  }
}

function htmlEscape(str) {
  return str.replace(/&/g, '&amp;') // first!
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

export default class Definition {

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

  syncTabParams() {
    const container = this._body.querySelector('.tab-container');
    if (container) {
      const src = container.children().filter('.current').find('.test-param');
      const dst = container.children().not('.current').find('.test-param');
      src.each(function (i, node) {
        dst.eq(i).val($(node).val());
      });
    }
  }

  updateSingleParam(data) {
    if (this._endpoint.params) {
      if (data.Id) {
        this._body.querySelector('.test-param').dataset.type.populate(data.Id);
      }
    }
  }

  value() {
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

  populate(data, types) {
    this._type.populate(data, 'body', types);
    this.switchTab(0);
  }

  clear() {
    this._type.clear();
    this._json.value = '';
  }

  lock() {
    //this._body.find('*').prop('disabled', true);
  }

  unlock() {
    //this._body.find('*').prop('disabled', false);
  }

  getPopulatedUrl() {
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

  buildParamsNode() {
    if (this._endpoint.params) {
      return $('table',
        $('tbody',
          Object.keys(this._endpoint.params).map(function (param, i) {
            // this has to happen for each tab
            var type = createType(this._params[param].type);
            return $('tr', { class: 'test-param', 'data-type': type },
              $('th', param),
              $('td', type.build())
            )
          }.bind(this))
        )
      );
    }
  }

  appendTableControls(table) {
    if (this._endpoint.params) {
      table.appendChild(
        $('thead',
          $('tr',
            $('th'),
            $('th', (this._endpoint.method === 'PUT')
              ? $('input', { type: 'button', value: 'GET', class: 'test-edit' })
              : document.createTextNode('[params]')
            ),
            $('td', this.buildParamsNode())
          )
        )
      );
    }

    table.appendChild(
      $('tfoot',
        $('tr',
          $('th'),
          $('th', $('input', { type: 'button', value: this._endpoint.method, class: 'test-submit' })),
          $('td', $('span', { class: 'test-edit-status' }))
        )
      )
    );
  }

  build() {
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

      const json = $('table',
        $('tbody',
          $('tr',
            $('th', 'JSON'),
            $('td', $('textarea', { class: 'test-json' }))
          )
        )
      );

      this.appendTableControls(json);

      // tabs
      const container = $('div', { class: 'tab-container' },
        $('ul',
          $('li', { class: 'current' }, 'Editor'),
          $('li', 'JSON')
        ),
        $('div', { class: 'current' }, table),
        $('div', json)
      );
      body.appendChild(container);

      // todo: trigger click event
      container.children().filter('ul').find('li').click(Definition.onTabSwitch);
    } else {
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

  switchTab(index) {
    const divs = this._body.querySelectorAll('.tab-container > div');
    const lis = this._body.querySelectorAll('.tab-container > div');

    for (let i = 0; i < divs.length; i++) {
      divs[i].classList.toggle('current', i === index);
      lis[i].classList.toggle('current', i === index);
    }

    if (this._json) {
      const val = this._type.value();
      if (val !== null) {
        this._json.value = JSON.stringify(val, null, 2);
      }
    }
  }

  submit() {
    // todo: trap parse errors
    const url = this.getPopulatedUrl();
    const method = this._endpoint.method;
    const value = JSON.stringify(this.value());

    let output = document.getElementById(this._guid);
    const testBody = output.querySelector('.endpoint-test-body');
    if (testBody) {
      output = testBody.querySelector('.output') || testBody.appendChild($('div', { class: 'output' }));
    }

    if (output.clientHeight > 0) {
      output.style.height = `${output.clientHeight}px`;
    }
    output.removeClass();
    output.addClass('output output-waiting');
    output.text(`[${method}] ${url}`);

    fetch(url, {
      method,
      body: value,
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((res) => {

      const request = `[${method}] <a href="${url}">${url}</a>`;

      if (res.ok) {
        //
      }

      const contentType = res.headers['Content-Type'];
      let content = '';

      // todo: don't lose "false"
      if (contentType === 'application/json') {
        result.json = JSON.stringify(res.json(), null, '  ');
      }
      else if (['application/xml', 'text/xml', 'application/vnd.google-earth.kml+xml'].includes(contentType)) {
        result.kml = Utilities.escapeHtml(new XMLSerializer().serializeToString(data));
      }
      else {
        result.text = '[' + contentType + ']';
      }

      var asdf = htmlEscape();

      output.html(Factory.render(result));
      output.removeClass();
      output.addClass('output output-response');
      output.style.height = 'auto';
    }).catch((error) => {
      console.log('There has been a problem with your fetch operation: ' + error.message);

      // var json = null;
      // var text = jqXHR.responseText;
      //
      // // don't lose "false"
      // var contentType = jqXHR.getResponseHeader('content-type');
      // if (contentType === 'application/json') {
      //   json = Utilities.escapeHtml(JSON.stringify(jqXHR.responseJSON, null, "\t"));
      //   text = null;
      // }
      //
      // var result = {
      //   request: Utilities.replaceAll('[@type] <a target="_blank" href="@url">@url</a>', {
      //     '@type': this.options.type,
      //     '@url': encodeURI(this.options.url)
      //   }),
      //   status: '[' + jqXHR.status + '] ' + error,
      //   text: text,
      //   json: json
      // };
      //
      // this.output.html(Factory.render(result));
      // this.output.removeClass();
      // this.output.addClass('output output-response-error');
      // this.output.height('');
    });

    // var names = [
    //   'Request',
    //   'Status',
    //   'Response',
    //   'Error',
    // ];
    //
    // var lines = [];
    // for (var key in names) {
    //   if (names.hasOwnProperty(key) && result[key]) {
    //     lines.push(Utilities.replaceAll('<div class="output-section-header">@name:</div><pre>@result</pre>', {
    //       '@name': names[key],
    //       '@result': result[key]
    //     }));
    //   }
    // }
    // return lines.join("\n");
  }

  edit() {
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
