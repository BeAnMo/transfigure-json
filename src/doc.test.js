import Doc from './doc';

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

  describe('iterating over a document', () => {
    it('should return an empty array when instantiated with an empty object', () => {
      expect([...Doc([])]).toStrictEqual([]);
      expect([...Doc({})]).toStrictEqual([]);
    });

    it('should return an array with the appropriate values', () => {
      const arr = [1, 2, { b: [], c: {}, d: 5 }];

      expect([...Doc(arr)]).toStrictEqual([
        {
          key: '0',
          value: 1,
          path: ['0'],
        },
        {
          key: '1',
          value: 2,
          path: ['1'],
        },
        {
          key: 'd',
          value: 5,
          path: ['2', 'd'],
        },
      ]);
    });
  });
});
