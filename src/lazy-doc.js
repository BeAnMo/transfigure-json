import BFStream, { StreamItem } from "./bf-stream";
import { isCompound, setAtPath, isArray, getType } from "./utils";

function LazyDoc(doc, options = {}) {
  if (!isCompound(doc)) {
    throw new Error(
      `Instantiating TransfigureJSON requires an Object or an Array.`
    );
  } else if (!(this instanceof LazyDoc)) {
    return new LazyDoc(doc, options);
  }

  this.options = {
    delimeter: options.delimeter || ".",
    useConstructor: options.useConstructor || false,
  };
  this.doc = doc;
  this.pipes = [];
}

LazyDoc.operations = {};

LazyDoc.register = function (name, proc) {
  LazyDoc.prototype[name] = function (...args) {
    this.pipes.push([name, args]);

    return this;
  };
  LazyDoc.operations[name] = proc;

  return LazyDoc;
};

LazyDoc.prototype.setAccumulator = function () {
  const maybe = [...this.pipes].reverse().find(([name]) => name === "fold");

  if (maybe) {
    // Get accumulator arg from final fold operation.
    return maybe[1].slice(-1)[0];
  } else {
    return isArray(this.doc) ? [] : {};
  }
};

LazyDoc.prototype.compose = function (stream) {
  const ops = LazyDoc.operations;
  const bound = this.pipes.map(([name, args]) =>
    ops[name](...args).bind(stream)
  );

  const L = bound.length;

  return function next(nextVal) {
    let result = nextVal;

    for (let i = 0; i < L; i++) {
      result = bound[i](result);

      if (result === undefined) {
        return result;
      }
    }

    return result;
  };
};

LazyDoc.prototype.run = function () {
  const stream = new BFStream(this.doc, this.options.delimeter);
  const chained = this.compose(stream);
  let current = this.setAccumulator();

  while (!stream.empty()) {
    const next = chained(stream.next());

    if (next !== undefined) {
      if (StreamItem.is(next)) {
        setAtPath(current, next.path.toArray(), next.value);
      } else {
        current = next;
      }
    }
  }

  return current;
};

// !!!Need to record shape/paths of resulting document!!!
LazyDoc.register("fold", function foldWrap(proc, acc) {
  let results = acc;

  return function fold(item) {
    results = proc(results, item);

    return results;
  };
})
  .register("prune", function pruneWrap(predicate) {
    return function prune(item) {
      let curr = item;

      while (!this.empty() && !predicate(curr)) {
        curr = this.next();
      }

      return predicate(curr) ? curr : undefined;
    };
  })
  .register("transform", function transformWrap(proc) {
    return function transform(item) {
      return proc(item);
    };
  })
  .register("each", function eachWrap(proc) {
    return function each(item) {
      proc(item);
    };
  })
  .register("smoosh", function smooshWrap() {
    let results = {};

    return function smoosh({ path, value }) {
      results[path.toString()] = value;

      return results;
    };
  })
  .register("toggle", function toggleWrap() {
    let results = null;
    let add = null;

    if (isArray(this.doc)) {
      results = {};
      add = (key, val) => {
        results[key] = val;
      };
    } else {
      results = [];
      add = (key, val) => results.push([key, val]);
    }

    return function toggle({ key, value }) {
      add(key, value);

      return results;
    };
  });

export default LazyDoc;
