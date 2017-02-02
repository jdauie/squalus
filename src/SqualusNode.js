import Squalus from './Squalus';
import TestCollection from './Automation/TestCollection';
import TestGroup from './Automation/TestGroup';
import Test from './Automation/Test';
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

class SqualusNode extends Squalus {

  static execute(typePath, collectionInstance, initialContextPath) {
    const typePaths = Array.isArray(typePath) ? typePath : [typePath];
    const files = [].concat.apply([], typePaths.map(p => getFiles(p, /\.yaml$/)));

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

    return collectionInstance.execute(context);
  }
}

function collection(name, options) {
  return new TestCollection(name, options);
}

function group(name) {
  return new TestGroup(name);
}

function test(name) {
  return new Test(name);
}

export { SqualusNode as squalus, collection, group, test };
