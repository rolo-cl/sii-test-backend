import { TtlCache } from './ttl-cache';

describe('TtlCache', () => {
  let now: number;
  const clock = () => now;

  beforeEach(() => {
    now = 0;
  });

  it('reuses the cached value within the TTL', async () => {
    const cache = new TtlCache<number>(1000, 10, clock);
    const loader = jest.fn().mockResolvedValue(42);

    await cache.getOrLoad('a', loader);
    now = 999;
    await expect(cache.getOrLoad('a', loader)).resolves.toBe(42);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('reloads after the TTL expires', async () => {
    const cache = new TtlCache<number>(1000, 10, clock);
    const loader = jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    await cache.getOrLoad('a', loader);
    now = 1000;
    await expect(cache.getOrLoad('a', loader)).resolves.toBe(2);
  });

  it('shares a single in-flight load between concurrent callers', async () => {
    const cache = new TtlCache<number>(1000, 10, clock);
    const loader = jest.fn().mockResolvedValue(7);

    await Promise.all([
      cache.getOrLoad('a', loader),
      cache.getOrLoad('a', loader),
    ]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('does not cache failures', async () => {
    const cache = new TtlCache<number>(1000, 10, clock);
    const loader = jest
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(3);

    await expect(cache.getOrLoad('a', loader)).rejects.toThrow('boom');
    await expect(cache.getOrLoad('a', loader)).resolves.toBe(3);
  });

  it('evicts the oldest entry when full', async () => {
    const cache = new TtlCache<string>(1000, 2, clock);
    await cache.getOrLoad('a', () => Promise.resolve('a'));
    await cache.getOrLoad('b', () => Promise.resolve('b'));
    await cache.getOrLoad('c', () => Promise.resolve('c'));

    expect(cache.size).toBe(2);
    const loader = jest.fn().mockResolvedValue('a2');
    await expect(cache.getOrLoad('a', loader)).resolves.toBe('a2');
  });
});
