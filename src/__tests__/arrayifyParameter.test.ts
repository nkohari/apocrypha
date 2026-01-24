import { describe, expect, it } from 'vitest';
import { arrayifyParameter } from '../util/arrayifyParameter';

describe('arrayifyParameter', () => {
  it('given undefined, should return an empty array', () => {
    const result = arrayifyParameter(undefined);
    expect(result).toEqual([]);
  });

  it('given an array, should return the same array', () => {
    const input = [1, 2, 3];
    const result = arrayifyParameter(input);
    expect(result).toEqual([1, 2, 3]);
    expect(result).toBe(input);
  });

  it('given a hash, should return an array of values', () => {
    const input = { a: 1, b: 2, c: 3 };
    const result = arrayifyParameter(input);
    expect(result).toEqual([1, 2, 3]);
  });

  it('given an empty hash, should return an empty array', () => {
    const result = arrayifyParameter({});
    expect(result).toEqual([]);
  });

  it('given a hash with object values, should return an array of values', () => {
    const obj1 = { name: 'test1' };
    const obj2 = { name: 'test2' };
    const input = { first: obj1, second: obj2 };
    const result = arrayifyParameter(input);
    expect(result).toEqual([obj1, obj2]);
  });
});
