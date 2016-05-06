import { default as $ } from './Tag';
import Definition from './Definition';
import Any from './Type/Any';
import Vector from './Type/Vector';
import Attribute from './Type/Attribute';

function toposort(elements, getName, getRequires) {
  const edges = new Map();
  const s = [];

  const sources = new Map();
  elements.forEach(elem => sources.set(getName(elem), elem));

  sources.forEach(source => {
    const requires = getRequires(source);
    if (requires && requires.length) {
      requires.forEach(dependency => {
        if (!sources.has(dependency)) {
          throw new Error(`Unknown dependency ${dependency}`);
        }
        if (!edges.has(dependency)) {
          edges.set(dependency, []);
        }
        edges.get(dependency).push(getName(source));
      });
    } else {
      s.push(source);
    }
  });

  let parents;
  const sorted = new Map();
  while (s.length > 0) {
    const nSource = s.pop();
    const n = getName(nSource);
    sorted.set(n, nSource);
    if (edges.has(n)) {
      parents = edges.get(n);
      while (parents.length > 0) {
        const m = parents.pop();
        const mSource = sources.get(m);
        const requires = getRequires(mSource);
        if (!requires || !requires.find(d => !sorted.has(d))) {
          s.push(mSource);
        }
      }
    }
  }

  edges.forEach(value => {
    if (value.size > 0) {
      throw new Error('Graph cycle; unable to sort');
    }
  });

  return sorted;
}

function parseTokensFromType(type, dependenciesOnly) {
  /*
   * e.g.
   *   type
   *   type:map(Name,Value)
   *   type1|type2|type3
   *   type1 => type2
   *   int{1,2,7-9}?
   *   string?[]?
   *   type1,type2 # this only applies to inheritance
   * todo:
   *   content-type(image/png) && signature(89 50 4E 47 0D 0A 1A 0A)
   */
  const tokens = type.split(/([|{}()?:,]|&&|\[]|=>)/).map(t => t.trim()).filter(t => t !== '');

  // expand shortcuts
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === '?') {
      tokens.splice(i, 1, '|', 'null');
      --i;
    }
  }

  if (!dependenciesOnly) {
    return tokens;
  }

  /*
   * remove
   *   |
   *   []
   *   {...}
   *   :func(...)
   */
  const dependencies = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === '{') {
      while (tokens[i] !== '}') {
        ++i;
      }
      continue;
    } else if (tokens[i] === ':') {
      while (tokens[i] !== ')') {
        ++i;
      }
      continue;
    } else if (tokens[i] === '[]' || tokens[i] === '=>' || tokens[i] === '|' || tokens[i] === ',') {
      continue;
    }
    dependencies.push(tokens[i]);
  }

  return dependencies;
}

function getKnownScalarTypes() {
  return [
    'null',
    'int',
    'uint',
    'float',
    'string',
    'bool',
    'date',
    'datetime',
    'guid',
  ];
}

function buildKnownDependencies() {
  return getKnownScalarTypes().map(t => ({
    name: t,
  }));
}

function parseChild(types) {
  const dependencies = new Set();

  Object.keys(types).forEach(key => {
    const type = types[key];

    if (typeof type === 'string') {
      parseTokensFromType(type, true).forEach(t => dependencies.add(t));
    } else {
      parseChild(type).forEach(t => dependencies.add(t));
    }
  });

  return dependencies;
}

function scopify(iter, scope) {
  let source = iter;
  if (typeof iter === 'string') {
    source = [iter];
  }
  const result = Array.from(source, item => ((item.indexOf('.') === -1 && !getKnownScalarTypes().includes(item))
      ? `${scope}.${item}`
      : item)
  );

  return (typeof iter === 'string') ? result[0] : result;
}

function parseRoot(root) {
  const parsed = [];

  Object.keys(root).forEach(scope => {
    Object.keys(root[scope]).forEach(name => {
      const type = root[scope][name];

      const requires = new Set();

      if (typeof type === 'string') {
        parseTokensFromType(type, true).forEach(t => requires.add(t));
      } else {
        parseChild(type).forEach(t => requires.add(t));
      }

      parsed.push({
        name: scopify(name, scope),
        requires: scopify(requires, scope),
        data: type,
      });
    });
  });

  return parsed;
}

function buildChildType(key, def, map) {
  if (typeof def === 'string') {
    //
  } else {
    Object.keys(def).forEach(key => {
      const type = def[key];

      if (typeof type === 'string') {
        //parseTokensFromType(type, true).forEach(t => dependencies.add(t));
      } else {
        //parseChild(type).forEach(t => dependencies.add(t));
      }
    });
  }
}

function buildRootType(key, def, map) {
  if (def === undefined) {
    // todo: scalar
    return null;
  }

  if (typeof def === 'string') {
    const tokens = parseTokensFromType(def);
  } else {
    Object.keys(def).forEach(attr => buildChildType(attr, def[attr], map));
  }
}

export default class Squalus {

  static buildTypes(root) {
    // check names and dependencies
    const dependencies = buildKnownDependencies().concat(parseRoot(root));
    const sorted = toposort(dependencies, d => d.name, d => d.requires);
    console.log(sorted);

    const lookup = new Map();
    const built = sorted.map(type => buildRootType(type.key, type.data, lookup));
    console.log(lookup);
    console.log(built);
  }

  static buildTests(tests) {
    const root = document.getElementById('api-root');
    const ul = root.appendChild($('ul', { class: 'api-tests' }));

    tests.forEach(test => {
      const def = new Definition(test.url, test.method, test.params, test.data);
      ul.appendChild(def.build());
    });

    const events = {
      change: {
        'select.test-option': Any.onChange,
      },
      click: {
        '.tab-container > ul > li': Definition.onTabSwitch,
        '.test-row-add': Vector.onClickAdd,
        '.test-row-remove': Vector.onClickRemove,
        '.test-attr-toggle': Attribute.onClickToggle,
        '.test-edit': Definition.onEdit,
        '.test-submit': Definition.onSubmit,
      },
      keypress: {
        'input[type=text],input[type=checkbox],select': Definition.onKeyPress,
      },
    };

    // handle events
    Object.keys(events).forEach(type => {
      root.addEventListener(type, e => {
        if (e.target) {
          const def = Definition.closest(e.target);
          if (def) {
            Object.keys(events[type]).forEach(selector => {
              if (e.target.matches(selector)) {
                const func = events[type][selector];
                func(e, def);
              }
            });
          }
        }
      });
    });

    // initialize selection states
    Array.from(root.querySelectorAll('select')).forEach(elem => {
      const event = new Event('change', { bubbles: true });
      elem.dispatchEvent(event);
    });
  }
}
