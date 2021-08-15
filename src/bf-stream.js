import { isCompound, getAtPath } from './utils';

export default class BFStream {
  constructor(doc) {
    this.doc = doc;
    this.q = [];
    this.len = 0;
    this.refs = new WeakSet();

    this.setQueue([], Object.keys(this.doc));
  }

  *[Symbol.iterator]() {
    while (!this.empty()) {
      const next = this.next();

      if (next) {
        yield next;
      }
    }
  }

  setQueue(path, keys) {
    keys.forEach((key) => {
      this.len = this.q.push([...path, key]);
    });

    return this;
  }

  next() {
    const path = this.q.shift();
    this.len -= 1;

    if (!path) {
      this.len = 0;
      return null;
    }

    const value = getAtPath(this.doc, path);

    if (!isCompound(value)) {
      return {
        path,
        value,
        key: path.slice(-1)[0],
      };
    } else {
      if (!this.refs.has(value)) {
        this.refs.add(value);
        this.setQueue(path, Object.keys(value));
      }

      return this.next();
    }
  }

  empty() {
    return this.len <= 0;
  }
}
