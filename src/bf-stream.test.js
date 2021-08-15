import BFStream from './bf-stream';

describe('A breadth-first stream instance', () => {
  const d0 = { a: 1, b: 2, c: [3, 4, 5] };
  const s0 = new BFStream(d0);
  const values = [
    {
      key: 'a',
      value: 1,
      path: ['a'],
    },
    {
      key: 'b',
      value: 2,
      path: ['b'],
    },
    {
      key: '0',
      value: 3,
      path: ['c', '0'],
    },
    {
      key: '1',
      value: 4,
      path: ['c', '1'],
    },
    {
      key: '2',
      value: 5,
      path: ['c', '2'],
    },
  ];

  it('should iterate over the expected values', () => {
    let i = 0;

    for (const item of s0) {
      const expected = values[i];

      expect(item).toStrictEqual(expected);
      i++;
    }
  });

  it('should return null when the stream has ended', () => {
    const stream = new BFStream(d0);

    for (let i = 0; i < 6; i++) {
      stream.next();
    }

    expect(stream.next()).toBe(null);
  });

  it('should correctly reflect the empty status', () => {
    const stream = new BFStream(d0);

    for (let i = 0; i < 5; i++) {
      expect(stream.empty()).toBeFalsy();

      stream.next();
    }

    expect(stream.empty()).toBeTruthy();
  });

  describe('using empty container objects', () => {
    it('should return an empty array when given empty objects', () => {
      expect([...new BFStream({})]).toStrictEqual([]);
      expect([...new BFStream([])]).toStrictEqual([]);
    });

    it('should skip over empty containers', () => {
      const t0 = [{}, {}, [], 1, { a: 1 }];

      expect([...new BFStream(t0)]).toStrictEqual([
        {
          key: '3',
          value: 1,
          path: ['3'],
        },
        {
          key: 'a',
          value: 1,
          path: ['4', 'a'],
        },
      ]);
    });
  });
});
