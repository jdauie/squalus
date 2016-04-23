"use strict";

define([], function() {

    function appendNode(element, content) {
        if (content && content.nodeType) {
            element.appendChild(content);
        }
        else {
            var div = document.createElement('div');
            div.innerHTML = content || '';

            while (div.firstChild) {
                element.appendChild(div.firstChild);
            }
        }
    }

    function isObject(obj) {
        return obj === Object(obj);
    }

    // (tagName, attributes?, children?, children?)
    return function (tagName, ...args) {
        var attributes = (args.length && isObject(args[0]) && !args[0].nodeType) ? args[0] : {};
        var children = args.slice((args[0] === attributes) ? 1 : 0);

        var elem = document.createElement(tagName);

        for (var name in attributes) {
            if (name.startsWith('data-')) {
                elem.dataset[name.substr(5)] = attributes[name];
            }
            else {
                elem.setAttribute(name, attributes[name]);
            }
        }

        children.forEach(function (child) {
            if (Array.isArray(child)) {
                children.forEach(function (child) {
                    appendNode(elem, child);
                })
            }
            else {
                appendNode(elem, child);
            }
        });
    };

});