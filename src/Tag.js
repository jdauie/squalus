
function isObject(obj) {
  return obj === Object(obj) && !Array.isArray(obj);
}

function appendNode(element, content) {
  if (content && content.nodeType) {
    element.appendChild(content);
  } else {
    const div = document.createElement('div');
    div.innerHTML = content || '';

    while (div.firstChild) {
      element.appendChild(div.firstChild);
    }
  }
}

// (tagName, attributes?, children?, children?)
export default function (tagName, ...args) {
  const attributes = (args.length && isObject(args[0]) && !args[0].nodeType) ? args[0] : {};
  const children = args.slice((args[0] === attributes) ? 1 : 0);

  const elem = document.createElement(tagName);

  Object.keys(attributes).forEach(name => {
    if (name.startsWith('data-')) {
      elem.dataset[name.substr(5)] = attributes[name];
    } else if (name.startsWith('_')) {
      elem[name] = attributes[name];
    } else {
      elem.setAttribute(name, attributes[name]);
    }
  });

  children.forEach((child) => {
    if (Array.isArray(child)) {
      child.forEach((c) => {
        appendNode(elem, c);
      });
    } else {
      appendNode(elem, child);
    }
  });

  return elem;
}
