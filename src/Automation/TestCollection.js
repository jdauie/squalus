/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^colors$" }] */

// colors is imported for the side effects
import colors from 'colors';
import topoSort from '../TopoSort';
import TestError from './TestError';
import ValidationContext from '../ValidationContext';

export default class TestCollection {

  constructor(name, options) {
    this._name = name;
    this._groups = null;
    this._cancel = false;
    this._sequential = !!((options || {}).sequential);
    this._validationContext = new ValidationContext(
      !!((options || {}).throwUnknownObjectAttributes)
    );
  }

  groups(groups) {
    this._groups = groups;
    return this;
  }

  getMaxGroupNameLength() {
    if (this._groups && !this._maxGroupNameLength) {
      this._maxGroupNameLength = this._groups.reduce((a, b) => (a._name.length > b._name.length ? a : b))._name.length;
    }
    return this._maxGroupNameLength;
  }

  execute(initial) {
    const startTime = Date.now();

    let root = Promise.resolve();
    const context = new Map();
    if (initial) {
      Object.keys(initial).forEach(k => context.set(k, initial[k]));
    }

    const testCount = this._groups.reduce((a, b) => a + b._tests.length, 0);

    const options = [];
    if (this._sequential) {
      options.push('sequential');
    }
    if (this._validationContext._throwUnknownObjectAttributes) {
      options.push('throwUnknownObjectAttributes');
    }

    console.log();
    console.log('  collection [%s] %s', this._name.green, options.length > 0 ? `(${options.join(',')})` : '');
    console.log();

    this._groups = Array.from(topoSort(this._groups, g => g._name, g =>
      (g._requires ? g._requires.map(r => r._name) : null)
    ).values());

    return Promise.all(this._groups.map((g, i, a) => {
      if (this._sequential && i > 0) {
        root = a[i - 1].execute();
      }
      return g.execute(context, this, root);
    })).then(() => {
      console.log();
      console.log('  %s after %s',
        `${testCount} passing`.green,
        `${(Date.now() - startTime)} ms`.magenta
      );
      console.log();
    }).catch(error => {
      if (this._cancel) {
        return;
      }

      this._cancel = true;

      if (error instanceof TestError) {
        error.log(context, startTime);
      } else {
        console.log(error);
      }
    });
  }
}
