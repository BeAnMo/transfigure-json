import Doc from './doc';
import JsonPath from './json-path';

describe('Json-document instantiation', () => {
  it('should throw when passed a primitive value', () => {
    expect(() => Doc(43)).toThrow();
    expect(() => Doc('hey there')).toThrow();
    expect(() => Doc(null)).toThrow();
    expect(() => Doc(true)).toThrow();
  });

  it('should instantiate with & without "new"', () => {
    const d0 = Doc({ a: 1, b: 2 });

    expect(d0).toBeInstanceOf(Doc);

    const d1 = new Doc({ a: 1, b: 2 });

    expect(d1).toBeInstanceOf(Doc);
  });
});

describe('Json-document static methods', () => {
  it('should perform a deep clone of an Object', () => {
    const base = { a: 1, b: 2, c: [3, 4, 5] };

    expect(Doc.clone(base)).toStrictEqual({ a: 1, b: 2, c: [3, 4, 5] });
  });

  it('should perform a deep clone of an Array', () => {
    const base = [1, 2, { c: [3, 4, 5] }];

    expect(Doc.clone(base)).toStrictEqual([1, 2, { c: [3, 4, 5] }]);
  });

  it('should return a schema based on primitive values', () => {
    const doc = {
      a: 1,
      b: 'hello',
      c: [{ value: 4 }, { value: '5' }, { value: 6 }],
    };
    const fullSchema = {
      a: 'number',
      b: 'string',
      c: [{ value: 'number' }, { value: 'string' }, { value: 'number' }],
    };
    // TODO
    const firstOnlySchema = {
      a: 'number',
      b: 'string',
      c: [{ value: 'number' }],
    };

    expect(Doc.schema(doc)).toStrictEqual(fullSchema);
    //expect(Doc.schema(doc, { firstArrayElementOnly: true })).toStrictEqual(firstOnlySchema);
  });
});

describe('A json-document instance getters/setters', () => {
  const base = { a: 1, b: 2, c: [3, 4, 5] };
  const clone = () => Doc.clone(base);
  const d0 = new Doc(clone());

  it('should retrieve a value at the given key', () => {
    const d0b = d0.get('c.2', { useConstructor: false });

    expect(d0b).toBe(5);

    const d0c = d0.get('c', { useConstructor: false });

    expect(d0c).toStrictEqual([3, 4, 5]);

    const d0d = d0.get('b', { useConstructor: false });

    expect(d0d).toStrictEqual(2);
  });

  it('should retrieve an instance at the given key unless the result is a primitive', () => {
    const d0b = d0.get('c.2', { useConstructor: true });

    expect(d0b).toBe(5);

    const d0c = d0.get('c', { useConstructor: true });

    expect(d0c).toStrictEqual(new Doc([3, 4, 5]));
  });

  it('should set a root key to the given value', () => {
    const d1 = new Doc(clone());
    const d1a = d1.set('a', 7);

    expect(d1a.doc).toStrictEqual({ a: 7, b: 2, c: [3, 4, 5] });

    // Replace a primitive with a compound object.
    const d3 = new Doc(clone());
    const d3a = d3.set('b', [5, 6]);

    expect(d3a.doc).toStrictEqual({ a: 1, b: [5, 6], c: [3, 4, 5] });
  });

  it('should set a nested key to the given value', () => {
    const d2 = new Doc(clone());
    const d2a = d2.set('c.2', 7);
    expect(d2a.doc).toStrictEqual({ a: 1, b: 2, c: [3, 4, 7] });
  });

  it('should not have mutated the original test object', () => {
    expect(base).toStrictEqual({ a: 1, b: 2, c: [3, 4, 5] });
  });
});

describe('Json-document instance iterative methods', () => {
  const base = { a: 1, b: 2, c: [3, 4, 5] };

  describe('doc.select(...)', () => {
    it('should return undefined if no matching value is found', () => {
      expect(Doc(base).select(({ key }) => key === 'whut?')).toBe(undefined);
      // Compound values are not returned.
      expect(Doc(base).select(({ key }) => key === 'c')).toBe(undefined);
    });

    it('should return the value based on the given predicate', () => {
      expect(
        Doc(base).select(({ path }) => path.toArray().indexOf('c') > -1)
      ).toStrictEqual({
        value: 3,
        key: '0',
        path: new JsonPath(['c', '0'], '.'),
      });
      expect(Doc(base).select(({ key }) => key === 'b')).toStrictEqual({
        value: 2,
        key: 'b',
        path: new JsonPath('b', '.'),
      });
    });
  });

  it('should iterate an exposed stream until finished', () => {
    const clone = new Doc(Doc.clone(base));
    const stream = clone.toStream();

    while (!stream.empty()) {
      expect(stream.next()).toBeTruthy();
    }

    expect(stream.empty()).toBeTruthy();
    expect(stream.next()).toBeFalsy();
  });

  it('should "prune" a nested Object by its values', () => {
    const clone = new Doc(Doc.clone(base));

    const pruned = clone.prune(({ value }) => value % 2 === 0);

    // An "empty slot" is not equal to "undefined".
    let arr = [];
    arr[1] = 4;

    expect(pruned.doc).toStrictEqual({ b: 2, c: arr });
  });

  it('should "prune" a nested Object by its keys', () => {
    const clone = new Doc(Doc.clone(base));

    const pruned = clone.prune(
      ({ key }) => key === 'a' || key === '0' || key === '2'
    );
    // An "empty slot" is not equal to "undefined".
    let arr = [3];
    arr[2] = 5;

    expect(pruned.doc).toStrictEqual({ a: 1, c: arr });
  });

  it('should fold a document by summing its values', () => {
    const clone = new Doc(Doc.clone(base));

    const summed = clone.fold((acc, { value }) => acc + value, 0);

    expect(summed).toBe(15);
  });

  it('should fold a document by grouping odd and even values', () => {
    const clone = new Doc(Doc.clone(base));

    const folded = clone.fold((acc, { value }) => {
      const name = value % 2 === 0 ? 'evens' : 'odds';
      const nextPosn = acc.get(name).length;

      return acc.set(`${name}.${nextPosn}`, value);
    }, new Doc({ odds: [], evens: [] }));

    expect(folded.get()).toStrictEqual({
      odds: [1, 3, 5],
      evens: [2, 4],
    });
  });

  it('should square all values', () => {
    const clone = new Doc(Doc.clone(base));

    const squared = clone.transform(({ value }) => value * value);

    expect(squared.get()).toStrictEqual({ a: 1, b: 4, c: [9, 16, 25] });
  });

  it('should iterate over each value and return itself', () => {
    const clone = new Doc(Doc.clone(base));

    let paths = [];
    let squared = [];
    const eached = clone
      .each(({ path }) => {
        paths.push(path.toString());
      })
      .each(({ value }) => {
        squared.push(value * value);
      });

    expect(paths).toStrictEqual(['a', 'b', 'c.0', 'c.1', 'c.2']);
    expect(squared).toStrictEqual([1, 4, 9, 16, 25]);

    expect(eached).toBeInstanceOf(Doc);
  });

  it('should smoooooooosh', () => {
    const clone = new Doc(Doc.clone(base));

    const smooshed = clone.smoosh();

    expect(smooshed.get()).toStrictEqual({
      a: 1,
      b: 2,
      'c.0': 3,
      'c.1': 4,
      'c.2': 5,
    });
  });
});
