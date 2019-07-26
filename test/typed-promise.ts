import { TypedPromise } from '../src';

const error = new Error('Whatever');

describe('TypedPromise.constructor>', () => {
  test('resolves like a promise', () => {
    return new TypedPromise<number>(resolve => {
      setTimeout(() => {
        resolve(1);
      }, 30);
    }).then(val => {
      expect(val).toBe(1);
    });
  });

  test('should always be asynchronous', () => {
    const p = new TypedPromise(resolve => resolve(5));

    expect((p as any).value).not.toBe(5);
  });

  test('should resolve with the expected value', () => {
    return new TypedPromise<number>(resolve => resolve(30)).then(val => {
      expect(val).toBe(30);
    });
  });

  test('should catch errors (reject)', () => {
    return new TypedPromise((resolve, reject) => {
      return reject(error);
    }).catch((err: Error) => {
      expect(err).toBe(error);
    });
  });

  test('should catch errors (throw)', () => {
    return new TypedPromise(() => {
      throw error;
    }).catch(err => {
      expect(err).toBe(error);
    });
  });

  test('should not be mutable', () => {
    const start = new TypedPromise<boolean>(resolve => resolve(true));

    return TypedPromise.all([
      start
        .then(val => {
          expect(val).toBe(true);
          return false;
        })
        .then(val => expect(val).toBe(false)),
      start.then(val => expect(val).toBe(true)),
    ]);
  });
});

describe('TypedPromise.prototype.resolve', () => {
  test('should resolve with a value', () => {
    return TypedPromise.resolve(0).then(val => expect(val).toBe(0));
  });
});

describe('TypedPromise.prototype.reject', () => {
  test('should reject with an error', () => {
    return TypedPromise.reject(error).catch(err => expect(err).toBe(error));
  });
});

describe('TypedPromise.prototype.finally', () => {
  test('should be called regardless of the promise state', () => {
    let counter = 0;
    return TypedPromise.resolve(15)
      .finally(() => {
        counter += 1;
      })
      .then(() => {
        return TypedPromise.reject(15);
      })
      .then(() => {
        counter = 1000;
      })
      .finally(() => {
        counter += 1;
      })
      .catch(reason => {
        expect(reason).toBe(15);
        expect(counter).toBe(2);
      });
  });
});

describe('TypedPromise.resolve', () => {
  test('resolves a value', () => {
    return TypedPromise.resolve(5).then(value => {
      expect(value).toBe(5);
    });
  });
});

describe('TypedPromise.reject', () => {
  test('rejects a value', () => {
    return TypedPromise.reject(5).catch(value => {
      expect(value).toBe(5);
    });
  });
});

describe('TypedPromise.all', () => {
  test('should throw type error if input is not an iterable', () => {
    return TypedPromise.all({} as any).catch(
      reason => reason instanceof TypeError,
    );
  });

  test('should resolve an iterable of promises in correct order', () => {
    return TypedPromise.all([
      'a',
      TypedPromise.resolve('b'),
      TypedPromise.resolve('c'),
    ]).then(iterable => {
      expect(iterable).toEqual(['a', 'b', 'c']);
    });
  });

  test('should reject if one item rejects', () => {
    return TypedPromise.all([
      TypedPromise.reject('a'),
      TypedPromise.resolve('b'),
    ]).catch(reason => {
      expect(reason).toBe('a');
    });
  });
});

describe('TypedPromise.race', () => {
  const fulfilled = new TypedPromise(resolve => {
    setTimeout(() => resolve('delayed success'), 500);
  });

  test('should reject with error', () => {
    const rejected = TypedPromise.reject(error);
    TypedPromise.race([rejected, fulfilled]).catch(reason => {
      expect(reason).toBe(error);
    });
  });

  test('should resolve with single value', () => {
    const success = TypedPromise.resolve('immediate success');
    const first = TypedPromise.race([success, fulfilled]).then(value => {
      expect(value).toBe('immediate success');
    });
  });
});
