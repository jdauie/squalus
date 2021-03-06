import { default as $ } from './Tag';
import Endpoint from './Endpoint';
import topoSort from './TopoSort';

import BranchType from './Type/BranchType';
import ArrayType from './Type/ArrayType';
import AttributeType from './Type/AttributeType';
import ObjectType from './Type/ObjectType';
import ScalarType from './Type/ScalarType';
import MapType from './Type/MapType';

import BoolScalarType from './Type/Scalar/BoolScalarType';
import EmailScalarType from './Type/Scalar/EmailScalarType';
import GuidScalarType from './Type/Scalar/GuidScalarType';
import IntScalarType from './Type/Scalar/IntScalarType';
import NullScalarType from './Type/Scalar/NullScalarType';
import NumericScalarType from './Type/Scalar/NumericScalarType';
import PasswordScalarType from './Type/Scalar/PasswordScalarType';

ScalarType.register([
  BoolScalarType,
  EmailScalarType,
  GuidScalarType,
  IntScalarType,
  NullScalarType,
  NumericScalarType,
  PasswordScalarType,
]);

const registeredTypes = new Map();

function findPreviousTokenGroupStart(tokens, i) {
  if (tokens[i] === ')') {
    let depth = 0;
    for (let j = i - 1; j >= 0; j--) {
      if (tokens[j] === ')') {
        ++depth;
      } else if (tokens[j] === '(') {
        if (depth === 0) {
          return findPreviousTokenGroupStart(tokens, j - 1);
        }
        --depth;
      }
    }
  } else if (tokens[i] === '}') {
    for (let j = i - 1; j >= 0; j--) {
      if (tokens[j] === '{') {
        return findPreviousTokenGroupStart(tokens, j - 1);
      }
    }
  } else if (tokens[i] === '[]') {
    return findPreviousTokenGroupStart(tokens, i - 1);
  }

  return i >= 0 ? i : 0;
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
   *   (string => int{2,4-9}|bool|string?)?[]?
   *   type1,type2 # this only applies to inheritance
   * todo:
   *   content-type(image/png) && signature(89 50 4E 47 0D 0A 1A 0A)
   */
  const tokens = type.split(/([|{}()?:,]|&&|\[]|=>)/).map(t => t.trim()).filter(t => t !== '');

  // expand shortcuts
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === '?') {
      const previous = findPreviousTokenGroupStart(tokens, i - 1);
      tokens.splice(previous, 0, '(');
      tokens.splice(i + 1, 1, '|', 'null', ')');
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
    } else if (['[]', '=>', '|', ',', '(', ')'].includes(tokens[i])) {
      continue;
    }
    dependencies.push(tokens[i]);
  }

  return dependencies;
}

function buildKnownDependencies() {
  return ScalarType.getScalarTypes().map(t => ({
    name: t,
    data: t,
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
  const result = Array.from(source, item => ((
    item.indexOf('{') === -1 && item.indexOf('[') === -1 && item.indexOf('|') === -1 &&
    item.indexOf('.') === -1 && !ScalarType.getScalarTypes().includes(item))
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

function createAttrFromName(name, type) {
  return new AttributeType(name.replace(/\?$/, ''), type.clone(), !name.endsWith('?'));
}

function stripOuterParens(array) {
  if (array[0] === '(' && array[array.length - 1] === ')') {
    array.splice(array.length - 1);
    array.splice(0, 1);
  }
}

function splitArray(array, split) {
  stripOuterParens(array);

  const chunks = [];
  let chunk = [];
  const stack = [];
  array.forEach(token => {
    if (token === '(') {
      stack.push(true);
      chunk.push(token);
    } else if (token === ')') {
      stack.pop();
      chunk.push(token);
    } else if (!stack.length && token === split) {
      if (chunk.length) {
        chunks.push(chunk);
      }
      chunk = [];
    } else {
      chunk.push(token);
    }
  });
  if (chunk.length) {
    chunks.push(chunk);
  }

  chunks.forEach(c => stripOuterParens(c));

  return chunks;
}

function buildType(def, scope) {
  // shortcuts
  if (typeof def === 'boolean') {
    def = def ? 'bool{true}' : 'bool{false}'; // eslint-disable-line no-param-reassign
  }

  // references
  if (typeof def === 'string') {
    const tokens = parseTokensFromType(def);

    const branches = splitArray(tokens, '|');
    if (branches.length > 1) {
      if (branches.length !== new Set(branches).size) {
        throw new Error('duplicate types in branch list');
      }
      const branchMap = new Map();
      branches.forEach(branch => {
        branchMap.set(branch, buildType(scopify(branch.join(''), scope)));
      });
      return BranchType.create(branchMap);
    }

    const map = splitArray(tokens, '=>');
    if (map.length > 1) {
      return new MapType(buildType(map[0].join(''), scope), buildType(map[1].join(''), scope));
    }

    if (tokens[tokens.length - 1] === '[]') {
      return new ArrayType(buildType(tokens.slice(0, tokens.length - 1).join(''), scope));
    }

    if (tokens[tokens.length - 1] === '}') {
      return ScalarType.create(
        tokens[tokens.indexOf('{') - 1],
        tokens.slice(tokens.indexOf('{') + 1, tokens.length - 1).filter(t => t !== ',')
      );
    }

    if (tokens[tokens.length - 1] === ')') {
      const transformStart = tokens.indexOf(':');
      const transformName = tokens[transformStart + 1];
      const transformArgs = tokens.slice(transformStart + 3, tokens.length - 1).filter(t => t !== ',');

      const transforms = {
        map: type => {
          const branchMap = new Map();
          type.attributes().forEach(attr =>
            branchMap.set(attr.name(), new ObjectType([
              new AttributeType(transformArgs[0], ScalarType.create('string', [attr.name()]), true),
              new AttributeType(transformArgs[1], attr.type().clone(), true),
            ]))
          );
          return new BranchType(branchMap);
        },
      };
      if (!transforms[transformName]) {
        throw new Error('unsupported transform');
      }
      return transforms[transformName](buildType(tokens.slice(0, transformStart).join(''), scope));
    }

    const scopedName = scopify(tokens.join(''), scope);
    if (registeredTypes.has(scopedName)) {
      return registeredTypes.get(scopedName).clone();
    }
    return ScalarType.create(scopedName);
  }

  // check for inheritance
  const attributeNames = Object.keys(def).filter(key => key !== '^');
  const inheritanceAttr = def['^'];
  if (inheritanceAttr) {
    if (typeof inheritanceAttr !== 'string') {
      throw new Error('inheritance attribute must be a string');
    }

    const parents = parseTokensFromType(inheritanceAttr).filter(t => t !== ',').map(parent =>
      registeredTypes.get(scopify(parent, scope))
    );

    if (parents.length === 1 && parents[0] instanceof BranchType) {
      const parent = parents[0];
      if (!Array.from(parent.types.values()).every(branchType => branchType instanceof Object)) {
        throw new Error('inheritance from branch with non-object');
      }
      // create inherited version of each object and re-aggregate
      const inheritedTypes = new Map();
      parent.types.forEach((branchType, key) => {
        const builder = (t, k) => {
          // add attributes to each branch
          const attributes = new Map();
          t.attributes().forEach(attr => {
            attributes.set(attr.name(), attr.clone());
          });
          attributeNames.forEach(attr =>
            attributes.set(attr.trim('?'), createAttrFromName(attr, buildType(def[attr], scope)))
          );
          inheritedTypes.set(k, new ObjectType(Array.from(attributes.values())));
        };

        if (branchType instanceof BranchType) {
          branchType.types.forEach((t, k) => builder(t, `${key}-${k}`));
        } else {
          builder(branchType, key);
        }
      });
      return new BranchType(inheritedTypes);
    } else if (parents.every(parent => parent instanceof ObjectType)) {
      // simple inheritance
      const attributes = new Map();
      parents.forEach(parent => {
        parent.attributes().forEach(parentAttr => {
          attributes.set(parentAttr, parentAttr.clone());
        });
      });
      attributeNames.forEach(attr =>
        attributes.set(attr.trim('?'), createAttrFromName(attr, buildType(def[attr], scope)))
      );
      return new ObjectType(Array.from(attributes.values()));
    }

    throw new Error('invalid parent type');
  }

  // no inheritance
  return new ObjectType(attributeNames.map(attr => createAttrFromName(attr, buildType(def[attr], scope))));
}

export default class Squalus {

  static getType(name) {
    return registeredTypes.get(name);
  }

  static buildTypes(root) {
    // check names and dependencies
    const dependencies = buildKnownDependencies().concat(parseRoot(root || {}));
    const sorted = topoSort(dependencies, d => d.name, d => d.requires);

    sorted.forEach((type, name) => {
      const scope = name.indexOf('.') ? name.substring(0, name.indexOf('.')) : null;
      registeredTypes.set(name, buildType(type.data, scope));
    });
  }

  static buildTests(tests, baseUrl, id) {
    const root = document.body.appendChild($('div', { class: 'api-root' }));

    if (id) {
      root.setAttribute('id', id);
    }

    const api = root.appendChild($('div', { class: 'api-container' }));
    root.appendChild($('div', { class: 'output-container' }));
    const ul = api.appendChild($('ul', { class: 'api-tests' }));

    tests.forEach(test => {
      const supportedMethods = [
        'get',
        'put',
        'post',
        'delete',
      ];

      const providedMethods = supportedMethods.filter(x => test[x]);

      if (providedMethods.length !== 1) {
        throw new Error('missing or invalid method');
      }

      const def = new Endpoint(
        baseUrl,
        test[providedMethods[0]],
        providedMethods[0].toUpperCase(),
        test.headers ? buildType(test.headers) : null,
        test.urlParams ? buildType(test.urlParams) : null,
        test.queryParams ? buildType(test.queryParams) : null,
        test.body ? buildType(test.body) : null
      );
      ul.appendChild($('li', def.build()));

      def.load();
    });

    const events = {
      change: {
        'select.test-option': BranchType.onChange,
      },
      click: {
        '.test-row-add': ArrayType.onClickAdd,
        '.test-row-remove': ArrayType.onClickRemove,
        '.test-attr-toggle': AttributeType.onClickToggle,
        '.test-submit': Endpoint.onSubmit,
      },
      keypress: {
        'input[type=text],input[type=checkbox],select': Endpoint.onKeyPress,
      },
    };

    window.addEventListener('beforeunload', Endpoint.onBeforeUnload);

    // handle events
    Object.keys(events).forEach(type => {
      root.addEventListener(type, e => {
        if (e.target) {
          const def = Endpoint.closest(e.target);
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

    BranchType.initializeSelectionStates(root);
    AttributeType.initializeIncludedStates(root);

    return root;
  }
}
