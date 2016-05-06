import Squalus from './Squalus';
import docReady from 'es6-docready';
import yaml from 'js-yaml';

docReady(() => {
  fetch('/sandbox/types.yaml').then(res => {
    res.text().then(text => Squalus.buildTypes(yaml.safeLoad(text)));
  });

  fetch('/sandbox/def.yaml').then(res => {
    res.text().then(text => Squalus.buildTests(yaml.safeLoad(text)));
  });
});
