
export default function (elements, getName, getRequires) {
  const edges = new Map();
  const s = [];

  const sources = new Map();
  elements.forEach(elem => sources.set(getName(elem), elem));

  sources.forEach(source => {
    const requires = getRequires(source);
    if (requires && requires.length) {
      requires.forEach(dependency => {
        if (!sources.has(dependency)) {
          throw new Error(`Unknown dependency ${dependency}`);
        }
        if (!edges.has(dependency)) {
          edges.set(dependency, []);
        }
        edges.get(dependency).push(getName(source));
      });
    } else {
      s.push(source);
    }
  });

  let parents;
  const sorted = new Map();
  while (s.length > 0) {
    const nSource = s.pop();
    const n = getName(nSource);
    sorted.set(n, nSource);
    if (edges.has(n)) {
      parents = edges.get(n);
      while (parents.length > 0) {
        const m = parents.pop();
        const mSource = sources.get(m);
        const requires = getRequires(mSource);
        if (!requires || !requires.find(d => !sorted.has(d))) {
          s.push(mSource);
        }
      }
    }
  }

  edges.forEach(value => {
    if (value.size > 0) {
      throw new Error('Graph cycle; unable to sort');
    }
  });

  return sorted;
}
