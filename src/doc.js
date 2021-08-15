import BFStream from './bf-stream';
import { isCompound } from './utils';

function Doc(doc, options = {}) {
  if (!(this instanceof Doc)) {
    return new Doc(doc, options);
  }

  if (!isCompound(doc)) {
    throw new Error(
      `TransfigureJSON must be instantiated with an object or array, given ${doc}.`
    );
  }

  this.data = doc;
  this.options = {
    algo: 'bfs',
  };
}

Doc.prototype[Symbol.iterator] = function* () {
  if (this.options.algo === 'bfs') {
    yield* new BFStream(this.data);
  }
};

export default Doc;
