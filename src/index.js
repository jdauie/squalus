import Squalus from './Squalus';
import docReady from 'es6-docready';
import yaml from 'js-yaml';

function parse(types) {
  const extendedSymbols = {
    '&': '&&',
  };
  const symbols = [
    '|',
    '&',
    '[',
    '{',
    '(',
    ']',
    '}',
    ')',
  ];

  Object.keys(types).forEach(key => {
    let type = types[key];

    if (typeof type === 'string') {
      type = type.trim();
      // key
      // type[parent]
      // type[parent1,parent2]
      // type[parent:map(Name,Value)]

      // scalar/predefined or inheritance or any
      // type
      // type1|type2|type3
      // {type1 => type2}
      // int{1,2,7-9}?
      // string?[]?
      // content-type(image/png) && signature(89 50 4E 47 0D 0A 1A 0A)

      const tokens = [];
      let tokenStart = 0;
      for (let i = 0; i < type.length; i++) {
        const char = type.charAt(i);
        let symbol = symbols[char];
        if (symbol) {
          if (extendedSymbols[char] && type.substr(i, extendedSymbols[char].length) === extendedSymbols[char]) {
            if (i > 0) {
              tokens.push(type.substring(tokenStart, i));
            }
            tokens.push(splitSymbols[char]);
            i += (splitSymbols[char].length - 1);
            tokenStart = i + 1;
          }
        } else if (i === type.length - 1) {
          tokens.push(type.substring(tokenStart));
        }
      }

      console.log(tokens.map(t => t.trim()).join(' '));

      // const dependencies = new Map();
      // const stack = [type];
      //
      // for (let i = 0; i < stack.length; i++) {
      //   // any shortcut: string|int|float
      //   if (type.indexOf('|') !== -1) {
      //     type.split('|').forEach(t => stack.push(t));
      //   }
      // }
      //
      // dependencies.map(dep => {
      //   if (dep.startsWith('{')) {
      //
      //   }
      // });
    } else {
      // assume object
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
