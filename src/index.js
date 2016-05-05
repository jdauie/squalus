import Squalus from './Squalus';
import docReady from 'es6-docready';
import yaml from 'js-yaml';

// function toposort(sources, nameFunc, requiresFunc) {
//   const edges = {};
//   const s = [];
//
//   Object.keys(sources).forEach(name => {
//     const source = sources[name];
//     const requires = requiresFunc(source);
//     if (requires && requires.length) {
//       requires.forEach(dependency => {
//         if (!sources[dependency]) {
//           throw new Error(`Unknown dependency ${dependency}`);
//         }
//         edges[dependency] = edges[dependency] || [];
//         edges[dependency].push(nameFunc(source));
//       });
//     } else {
//       s.push(source);
//     }
//   });
//
//   let parents;
//   const sorted = {};
//   while (s.length > 0) {
//     const nSource = s.pop();
//     const n = nameFunc(nSource);
//     sorted[n] = nSource;
//     if (edges[n]) {
//       parents = edges[n];
//       while (parents.length > 0) {
//         const m = parents.pop();
//         const mSource = sources[m];
//         const requires = requiresFunc(mSource);
//         if (!requires || !requires.find(d => !sorted[d])) {
//           s.push(mSource);
//         }
//       }
//     }
//   }
//
//   Object.keys(edges).forEach(name => {
//     if (edges[name].length > 0) {
//       throw new Error('Graph cycle; unable to sort');
//     }
//   });
//
//   return sorted;
// }

const register = {};

function parse(types, topLevelType) {
  Object.keys(types).forEach(key => {
    let type = types[key];

    if (!topLevelType) {
      register[key] = new Set();
    }

    if (typeof type === 'string') {
      type = type.trim();
      // key
      // type[parent]
      // type[parent1,parent2]
      // type[parent:map(Name,Value)]

      // scalar/predefined or inheritance or any
      // type
      // type1|type2|type3
      // type1 => type2
      // int{1,2,7-9}?
      // string?[]?
      // content-type(image/png) && signature(89 50 4E 47 0D 0A 1A 0A)

      const tokens = type.split(/([|{}()?]|&&|\[]|=>)/).map(t => t.trim()).filter(t => t !== '');

      // remove ? [] {...}
      const tokens2 = [];
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === '{') {
          while (tokens[i] !== '}') {
            ++i;
          }
          continue;
        } else if (tokens[i] === '[]' || tokens[i] === '?' || tokens[i] === '=>' || tokens[i] === '|') {
          continue;
        }
        tokens2.push(tokens[i]);
      }

      tokens2.forEach(t => register[topLevelType || key].add(t));

      console.log(tokens2.join(' '));
    } else {
      parse(type, topLevelType || key);
    }

    if (!topLevelType) {
      console.log(register);
    }
  });
}

docReady(() => {
  fetch('/sandbox/types.yaml').then(res => {
    res.text().then(text => {
      parse(yaml.safeLoad(text));
    });
  });

  fetch('/sandbox/def.yaml').then(res => {
    res.text().then(text => Squalus.build(yaml.safeLoad(text)));
  });
});
