import Squalus from './Squalus';
import fs from 'fs';
import yaml from 'js-yaml';

import AllTestsCollection from '../sandbox/tests/All';

export default function runApiTests() {
  const types = yaml.safeLoad(fs.readFileSync(`${__dirname}/../sandbox/types.yaml`, { encoding: 'utf8' }));
  Squalus.buildTypes(types);
  AllTestsCollection.execute().then(() =>
    console.log('tests completed')
  ).catch(error =>
    console.log(error)
  );
}
