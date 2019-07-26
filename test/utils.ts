import { isFunction, isObjectLiteral, isThenable } from '../src/utils';

describe('isFunction', () => {
  test('should return true for a function', () => {
    expect(isFunction(() => null)).toBe(true);
  });

  test('should return false for anything else', () => {
    expect(isFunction(0)).toBe(false);
    expect(isFunction('')).toBe(false);
    expect(isFunction([])).toBe(false);
    expect(isFunction({})).toBe(false);
  });
});

describe('isObjectLiteral', () => {
  test('should return false for an array', () => {
    expect(isObjectLiteral([])).toBe(false);
  });

  test('should return false for null', () => {
    expect(isObjectLiteral(null)).toBe(false);
  });

  test('should return false for a function', () => {
    expect(isObjectLiteral(() => null)).toBe(false);
  });

  test('should return false for undefined', () => {
    expect(isObjectLiteral(undefined)).toBe(false);
  });

  test('should return false for a primitive', () => {
    expect(isObjectLiteral(0)).toBe(false);
    expect(isObjectLiteral('')).toBe(false);
  });

  test('should return true for a plain object', () => {
    expect(isObjectLiteral({})).toBe(true);
    expect(isObjectLiteral({ then: () => null })).toBe(true);
  });
});

describe('isThenable', () => {
  test('should return true for an object having property "then" as a function', () => {
    expect(isThenable({ then: () => null })).toBe(true);
    expect(isThenable({ then: () => null, finally: () => null })).toBe(true);
  });

  test('should return false for an object having property "then" as not a function', () => {
    expect(isThenable({ then: null })).toBe(false);
    expect(isThenable({ then: null, finally: () => null })).toBe(false);
  });
});
