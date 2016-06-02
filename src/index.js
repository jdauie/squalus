import Squalus from './Squalus';
import docReady from 'es6-docready';
import yaml from 'js-yaml';

import AllTestsCollection from '../sandbox/tests/All';

console.log(AllTestsCollection);

AllTestsCollection.execute();

docReady(() => {
  Promise.all([
    '/sandbox/types.yaml',
    '/sandbox/endpoints.yaml',
  ].map(url => fetch(url))).then(responses => Promise.all(responses.map(r => r.text())).then(values => {
    ((types, endpoints) => {
      Squalus.buildTypes(types);
      Squalus.buildTests(endpoints);
    }).apply(null, values.map(v => yaml.safeLoad(v)));
  }));
});
