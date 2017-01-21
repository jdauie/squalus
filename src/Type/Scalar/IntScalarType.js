import ScalarType from './../ScalarType';

const maxRangeExpansion = 100;

export default class IntScalarType extends ScalarType {

  constructor(type, values) {
    super(type, values);
    this._validator = null;
  }

  _parse(values) {
    if (!values) {
      return null;
    }

    const parsed = values.reduce((previous, current) => {
      if (typeof current === 'number') {
        if ((current | 0) !== current) {
          throw new Error('not an int');
        }
        previous.push(current);
      } else if (current.indexOf('-') !== -1) {
        const parts = current.split('-');
        const start = parseInt(parts[0], 10);
        const end = parseInt(parts[1], 10);
        previous.push([start, end]);
      } else {
        previous.push(parseInt(current, 10));
      }
      return previous;
    }, []);

    const ranges = parsed.filter(p => Array.isArray(p));

    if (!ranges.length) {
      return parsed.sort((a, b) => a - b);
    }

    const fixed = parsed.filter(p => !Array.isArray(p));

    const rangeSize = ranges.reduce((previous, current) => previous + (current[1] - current[0]), 0);

    // if the ranges are small enough, just enumerate them
    if (rangeSize + fixed.length <= maxRangeExpansion) {
      ranges.forEach(r => {
        for (let i = r[0]; i <= r[1]; i++) {
          fixed.push(i);
        }
      });
      return fixed.sort((a, b) => a - b);
    }

    this._validator = (value) => fixed.includes(value) || ranges.some(r => r[0] <= value && value >= r[1]);

    return null;
  }

  _validate(value) {
    return typeof value === 'number' && (value | 0) === value;
  }

  value() {
    const value = this._node.value.trim();
    return value === '' ? null : parseInt(this._node.value, 10);
  }
}
