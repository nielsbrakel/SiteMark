/**
 * Memoizes a pure function of a string (a pattern is parsed once and matched against many URLs).
 * The cache is bounded: it starts over when full, so hostile input can't grow it without limit.
 */
export function memoize<T>(fn: (key: string) => T, limit = 1000): (key: string) => T {
  const cache = new Map<string, T>();
  return (key) => {
    if (cache.has(key)) return cache.get(key) as T;
    if (cache.size >= limit) cache.clear();
    const value = fn(key);
    cache.set(key, value);
    return value;
  };
}
