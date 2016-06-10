import Squalus from './Squalus';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

function getFiles(source, regex) {
  const files = [];

  const findChildren = (dir) =>
    fs.readdirSync(dir).forEach(f => {
      const child = path.join(dir, f);
      if (fs.statSync(child).isDirectory()) {
        findChildren(child);
      } else if (regex.test(f)) {
        files.push(child);
      }
    });

  if (fs.statSync(source).isDirectory()) {
    findChildren(source);
  } else {
    files.push(source);
  }

  return files;
}

export default class SqualusNode extends Squalus {

  static execute(typePath, collection, initialContextPath) {
    const files = getFiles(typePath, /\.yaml$/);

    if (files.length) {
      const types = Object.assign.apply(null,
        files.map(file => yaml.safeLoad(fs.readFileSync(file, { encoding: 'utf8' })))
      );

      Squalus.buildTypes(types);
    }

    let context = undefined;
    if (initialContextPath) {
      context = JSON.parse(fs.readFileSync(initialContextPath, { encoding: 'utf8' }));
    }

    return collection.execute(context);
  }
}
