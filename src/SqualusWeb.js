import Squalus from './Squalus';
import docReady from 'es6-docready';
import yaml from 'js-yaml';

export default class SqualusWeb extends Squalus {

  static build(types, baseUrl, endpoints) {
    const resolvedTypes = (Array.isArray(types) || typeof types === 'string')
      ? Promise.all((Array.isArray(types) ? types : [types]).map(url =>
          fetch(url)
            .then(response => response.text())
            .then(text => yaml.safeLoad(text))
        )).then(chunks => Object.assign.apply(null, chunks))
      : Promise.resolve(types);

    const resolvedEndpoints = (typeof endpoints === 'string' ||
      (Array.isArray(endpoints) && endpoints.length && typeof endpoints[0] === 'string'))
      ? Promise.all((Array.isArray(endpoints) ? endpoints : [endpoints]).map(url =>
        fetch(url)
          .then(response => response.text())
          .then(text => yaml.safeLoad(text))
        )).then(chunks => Array.prototype.concat.apply([], chunks))
      : Promise.resolve(endpoints);

    Promise.all([
      resolvedTypes,
      resolvedEndpoints,
    ]).then(values => ((t, e) => {
      Squalus.buildTypes(t);
      docReady(() => {
        Squalus.buildTests(e, baseUrl);
      });
    }).apply(null, values));
  }
}
