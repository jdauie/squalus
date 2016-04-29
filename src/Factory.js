"use strict";

define(['squalus/Tag', 'squalus/Definition'], function (Tag, Definition) {

  Function.prototype.construct = function (args) {
    var oNew = Object.create(this.prototype);
    this.apply(oNew, args);
    return oNew;
  };

  var Factory = {};

  Factory.init = function () {
    $('.endpoint-test-json').each(function () {
      var guid = $(this).closest('.endpoint-test').attr('id');
      var json = JSON.parse($(this).text());

      var def = new Definition(guid, json.endpoint, json.type, json.params);
      Factory[guid] = def;
      def.build();
    });

    $('.content-expansion').bind('click', Factory.onToggleContentExpansion);
  };

  Factory.onToggleContentExpansion = function () {
    var curr = $(this);
    var next = curr.next();
    if (next.is(':hidden')) {
      curr.addClass('content-expansion-maximized');
    }
    else {
      curr.removeClass('content-expansion-maximized');
    }
    next.slideToggle();
  };

  Factory.ajax = function (options) {
    var output = $('#' + options.outputId);
    var testBody = output.find('.endpoint-test-body');
    if (testBody.length) {
      if (!testBody.find('.output').length) {
        testBody.append($('<div class="output"></div>'));
      }
      output = testBody.find('.output');
    }

    if (!options.contentType && options.data !== undefined) {
      options.contentType = 'application/json';
    }

    if (options.contentType === 'application/json' && options.data !== undefined) {
      options.data = JSON.stringify(options.data);
    }

    options.headers = options.headers || {};

    options.context = {
      output: output,
      options: options
    };

    if (output.height() > 0) {
      output.height(output.height());
    }
    output.removeClass();
    output.addClass('output output-waiting');
    output.text('[' + options.type + '] ' + options.url);

    $.ajax(options).then(Factory.done, Factory.fail);
  };

  Factory.done = function (data, textStatus, jqXHR) {
    var result = {
      request: Utilities.replaceAll('[@type] <a href="@url">@url</a>', {
        '@type': this.options.type,
        '@url': encodeURI(this.options.url)
      }),
    };

    // don't lose "false"
    var contentType = jqXHR.getResponseHeader('content-type');
    if (contentType === 'application/json') {
      result.json = Utilities.escapeHtml(JSON.stringify(data, null, "\t"));
    }
    else if (contentType === 'application/xml' || contentType === 'text/xml') {
      result.xml = Utilities.escapeHtml(new XMLSerializer().serializeToString(data));
    }
    else if (contentType === 'application/vnd.google-earth.kml+xml') {
      result.kml = Utilities.escapeHtml(new XMLSerializer().serializeToString(data));
    }
    else {
      result.text = '[' + contentType + ']';
    }

    this.output.html(Factory.render(result));
    this.output.removeClass();
    this.output.addClass('output output-response');
    this.output.height('');
  };

  Factory.fail = function (jqXHR, textStatus, error) {
    var json = null;
    var text = jqXHR.responseText;

    // don't lose "false"
    var contentType = jqXHR.getResponseHeader('content-type');
    if (contentType === 'application/json') {
      json = Utilities.escapeHtml(JSON.stringify(jqXHR.responseJSON, null, "\t"));
      text = null;
    }

    var result = {
      request: Utilities.replaceAll('[@type] <a target="_blank" href="@url">@url</a>', {
        '@type': this.options.type,
        '@url': encodeURI(this.options.url)
      }),
      status: '[' + jqXHR.status + '] ' + error,
      text: text,
      json: json
    };

    this.output.html(Factory.render(result));
    this.output.removeClass();
    this.output.addClass('output output-response-error');
    this.output.height('');
  };

  Factory.render = function (result) {
    var names = {
      request: 'Request',
      status: 'Status',
      text: 'Response',
      json: 'Response (JSON)',
      xml: 'Response (XML)',
      kml: 'Response (KML)',
      error: 'Error',
      debug: 'Debug'
    };

    var lines = [];
    for (var key in names) {
      if (names.hasOwnProperty(key) && result[key]) {
        lines.push(Utilities.replaceAll('<div class="output-section-header">@name:</div><pre>@result</pre>', {
          '@name': names[key],
          '@result': result[key]
        }));
      }
    }
    return lines.join("\n");
  };

  return Factory;

});
