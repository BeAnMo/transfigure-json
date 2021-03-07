import JsonPath from "./json-path";
import { isCompound, getAtPath } from "./utils";

export function StreamItem(path, key, value) {
  this.path = path;
  this.key = key;
  this.value = value;
}

StreamItem.is = (item) => item instanceof StreamItem;

function BFStream(doc, delimeter) {
  this.doc = doc;
  this.delim = delimeter;
  // The queue contains JsonPaths.
  this.q = [];

  // Load up the queue on instantiation.
  this.setQueue(new JsonPath([], this.delim), Object.keys(this.doc));
}

BFStream.prototype.setQueue = function (path, keys) {
  keys.forEach((key) => {
    const keyPath = path.clone().append(key);

    this.q.push(keyPath);
  });

  return this;
};

BFStream.prototype.next = function () {
  const path = this.q.shift();

  if (!path) {
    return null;
  }

  const value = getAtPath(this.doc, path.toArray());

  if (!isCompound(value)) {
    return new StreamItem(path, path.slice(-1).toString(), value);
  } else {
    this.setQueue(path, Object.keys(value));

    return this.next();
  }
};

BFStream.prototype.empty = function () {
  return this.q.length === 0;
};

export default BFStream;
