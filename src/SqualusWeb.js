import Squalus from './Squalus';
import DocReady from './DocReady';
import yaml from 'js-yaml';
import './static/squalus.css';

class SqualusWeb extends Squalus {

  constructor() {
    super();
    this._url = null;
    this._types = [];
    this._endpoints = [];
  }

  url(url) {
    this._url = url;
    return this;
  }

  typesYaml(yamlStr) {
    this._types.push(Promise.resolve(yaml.safeLoad(yamlStr)));
    return this;
  }

  typesUrl(url) {
    this._types.push(fetch(url)
      .then(response => response.text())
      .then(text => yaml.safeLoad(text)));
    return this;
  }

  types(obj) {
    this._types.push(Promise.resolve(obj));
    return this;
  }

  endpointsYaml(yamlStr) {
    this._endpoints.push(Promise.resolve(yaml.safeLoad(yamlStr)));
    return this;
  }

  endpointsUrl(url) {
    this._endpoints.push(fetch(url)
      .then(response => response.text())
      .then(text => yaml.safeLoad(text)));
    return this;
  }

  endpoints(obj) {
    this._endpoints.push(Promise.resolve(obj));
    return this;
  }

  build(id) {
    return Promise.all([
      Promise.all(this._types),
      Promise.all(this._endpoints),
    ]).then(values => ((types, endpoints) => {
      if (types.length) {
        Squalus.buildTypes(Object.assign.apply(null, types));
      }
      return endpoints;
    }).apply(null, values))
      .then(DocReady)
      .then(endpoints => {
        const url = this._url || window.location.origin;
        return Squalus.buildTests(Array.prototype.concat.apply([], endpoints), url, id);
      });
  }
}

export default SqualusWeb;
