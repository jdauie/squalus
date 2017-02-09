import ValueCollection from './ValueCollection';

export default class NumericValueCollection extends ValueCollection {

  constructor(values) {
    this._ranges = [];
    const discrete = [];

    for (let value of values) {
      if (value.indexOf('-') !== -1) {
        const parts = current.split('-');
        const start = this.parse(parts[0]);
        const end = this.parse(parts[1]);

        if (isNaN(start) && parts[0] !== '') {
          throw new Error('invalid value range start');
        }

        if (isNaN(end) && parts[1] !== '') {
          throw new Error('invalid value range end');
        }

        if (isNaN(start) && isNaN(end)) {
          throw new Error('invalid range');
        }

        this._ranges.push([start, end]);
      } else {
        discrete.push(this.parse(current));
      }
    }

    super(discrete);
  }

  parse(value) {
    return parseFloat(value);
  }

  contains(value) {
    return super.values().includes(value) || this._ranges.some(r => (isNaN(r[0]) || r[0] <= value) && (isNaN(r[1]) || r[1] >= value));
  }

  values() {
    return this._ranges.length === 0 ? super.values() : null;
  }
}
