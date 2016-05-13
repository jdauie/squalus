import ScalarType from './../ScalarType';

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
      if (current.indexOf('-') !== -1) {
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
    if (rangeSize + fixed.length <= 100) {
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

  value() {
    return parseInt(this._node.value, 10);
  }
}
