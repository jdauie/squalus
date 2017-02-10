import NumericValueCollection from './NumericValueCollection';

const maxRangeExpansion = 100;

export default class IntValueCollection extends NumericValueCollection {

  parse(value) {
    return parseInt(value, 10);
  }

  values() {
    if (this._ranges.some(x => isNaN(x[0]) || isNaN(x[1]))) {
      return null;
    }

    const rangeSize = this._ranges.reduce((previous, current) => previous + (current[1] - current[0]), 0);

    if (rangeSize + this._values.length > maxRangeExpansion) {
      return null;
    }

    const values = this._values.slice();
    this._ranges.forEach(r => {
      for (let i = r[0]; i <= r[1]; i++) {
        values.push(i);
      }
    });
    return values.sort((a, b) => a - b);
  }
}
