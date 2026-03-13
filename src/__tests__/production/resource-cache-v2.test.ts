/**
 * ResourceCacheV2 Tests — 12 pure unit tests.
 */
import { describe, it, expect, vi } from 'vitest';
import { ResourceCacheV2 } from '../../cache/resource-cache.js';
import type { PersistedResource } from '../../repo/types.js';

function makeResource(id: string, resourceType = 'Patient'): PersistedResource {
  return { resourceType, id, meta: { versionId: '1', lastUpdated: new Date().toISOString() } } as PersistedResource;
}

describe('ResourceCacheV2', () => {
  // =========================================================================
  // 1. LRU eviction: oldest access evicted when full
  // =========================================================================
  it('LRU eviction evicts least recently accessed entry', () => {
    const cache = new ResourceCacheV2({ maxSize: 2, enabled: true, evictionPolicy: 'lru' });
    cache.set('Patient', '1', makeResource('1'));
    cache.set('Patient', '2', makeResource('2'));

    // Access '1' to make it recently used
    cache.get('Patient', '1');

    // Insert '3' — should evict '2' (least recently accessed)
    cache.set('Patient', '3', makeResource('3'));

    expect(cache.get('Patient', '1')).toBeDefined();
    expect(cache.get('Patient', '2')).toBeUndefined();
    expect(cache.get('Patient', '3')).toBeDefined();
  });

  // =========================================================================
  // 2. FIFO eviction: first inserted evicted when full
  // =========================================================================
  it('FIFO eviction evicts first inserted entry', () => {
    const cache = new ResourceCacheV2({ maxSize: 2, enabled: true, evictionPolicy: 'fifo' });
    cache.set('Patient', '1', makeResource('1'));
    cache.set('Patient', '2', makeResource('2'));

    // Access '1' — should NOT change eviction order in FIFO
    cache.get('Patient', '1');

    // Insert '3' — should evict '1' (first inserted)
    cache.set('Patient', '3', makeResource('3'));

    expect(cache.get('Patient', '1')).toBeUndefined();
    expect(cache.get('Patient', '2')).toBeDefined();
    expect(cache.get('Patient', '3')).toBeDefined();
  });

  // =========================================================================
  // 3. TTL-only eviction: no size limit
  // =========================================================================
  it('ttl-only eviction does not evict by size', () => {
    const cache = new ResourceCacheV2({ maxSize: 2, enabled: true, evictionPolicy: 'ttl-only', ttlMs: 60000 });
    cache.set('Patient', '1', makeResource('1'));
    cache.set('Patient', '2', makeResource('2'));
    cache.set('Patient', '3', makeResource('3'));

    // All 3 should exist — no size-based eviction
    expect(cache.size).toBe(3);
    expect(cache.get('Patient', '1')).toBeDefined();
    expect(cache.get('Patient', '2')).toBeDefined();
    expect(cache.get('Patient', '3')).toBeDefined();
  });

  // =========================================================================
  // 4. TTL expiry removes stale entries
  // =========================================================================
  it('TTL expiry removes stale entries on get', () => {
    vi.useFakeTimers();
    const cache = new ResourceCacheV2({ maxSize: 10, enabled: true, ttlMs: 100 });
    cache.set('Patient', '1', makeResource('1'));

    expect(cache.get('Patient', '1')).toBeDefined();

    vi.advanceTimersByTime(150);
    expect(cache.get('Patient', '1')).toBeUndefined();

    vi.useRealTimers();
  });

  // =========================================================================
  // 5. get refreshes LRU order
  // =========================================================================
  it('get refreshes LRU order but not FIFO order', () => {
    const lru = new ResourceCacheV2({ maxSize: 2, enabled: true, evictionPolicy: 'lru' });
    lru.set('Patient', 'a', makeResource('a'));
    lru.set('Patient', 'b', makeResource('b'));
    lru.get('Patient', 'a'); // refresh 'a'
    lru.set('Patient', 'c', makeResource('c')); // evict 'b'
    expect(lru.get('Patient', 'a')).toBeDefined();
    expect(lru.get('Patient', 'b')).toBeUndefined();
  });

  // =========================================================================
  // 6. invalidate removes specific entry
  // =========================================================================
  it('invalidate removes specific entry', () => {
    const cache = new ResourceCacheV2({ maxSize: 10, enabled: true });
    cache.set('Patient', '1', makeResource('1'));
    cache.set('Patient', '2', makeResource('2'));
    cache.invalidate('Patient', '1');
    expect(cache.get('Patient', '1')).toBeUndefined();
    expect(cache.get('Patient', '2')).toBeDefined();
  });

  // =========================================================================
  // 7. clear resets cache and stats
  // =========================================================================
  it('clear resets cache entries and stats', () => {
    const cache = new ResourceCacheV2({ maxSize: 10, enabled: true });
    cache.set('Patient', '1', makeResource('1'));
    cache.get('Patient', '1');
    cache.get('Patient', 'missing');
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.stats.hits).toBe(0);
    expect(cache.stats.misses).toBe(0);
  });

  // =========================================================================
  // 8. stats reports hits/misses/hitRate/evictions
  // =========================================================================
  it('stats reports hits, misses, hitRate, evictions', () => {
    const cache = new ResourceCacheV2({ maxSize: 1, enabled: true });
    cache.set('Patient', '1', makeResource('1'));
    cache.get('Patient', '1'); // hit
    cache.get('Patient', 'x'); // miss
    cache.set('Patient', '2', makeResource('2')); // eviction

    const s = cache.stats;
    expect(s.hits).toBe(1);
    expect(s.misses).toBe(1);
    expect(s.hitRate).toBe(0.5);
    expect(s.evictions).toBe(1);
  });

  // =========================================================================
  // 9. resetStats zeroes counters without clearing entries
  // =========================================================================
  it('resetStats zeroes counters without clearing entries', () => {
    const cache = new ResourceCacheV2({ maxSize: 10, enabled: true });
    cache.set('Patient', '1', makeResource('1'));
    cache.get('Patient', '1');
    cache.resetStats();
    expect(cache.stats.hits).toBe(0);
    expect(cache.stats.misses).toBe(0);
    expect(cache.stats.evictions).toBe(0);
    expect(cache.size).toBe(1); // entry still there
  });

  // =========================================================================
  // 10. disabled cache returns undefined
  // =========================================================================
  it('disabled cache always returns undefined', () => {
    const cache = new ResourceCacheV2({ enabled: false });
    cache.set('Patient', '1', makeResource('1'));
    expect(cache.get('Patient', '1')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  // =========================================================================
  // 11. set overwrites existing entry
  // =========================================================================
  it('set overwrites existing entry with new value', () => {
    const cache = new ResourceCacheV2({ maxSize: 10, enabled: true });
    const r1 = makeResource('1');
    const r2 = makeResource('1');
    (r2 as Record<string, unknown>).meta = { versionId: '2', lastUpdated: new Date().toISOString() };

    cache.set('Patient', '1', r1);
    cache.set('Patient', '1', r2);
    expect(cache.size).toBe(1);
    const result = cache.get('Patient', '1');
    expect((result?.meta as Record<string, unknown>)?.versionId).toBe('2');
  });

  // =========================================================================
  // 12. sweep removes all expired entries
  // =========================================================================
  it('sweep removes all expired entries', () => {
    vi.useFakeTimers();
    const cache = new ResourceCacheV2({ maxSize: 10, enabled: true, ttlMs: 100 });
    cache.set('Patient', '1', makeResource('1'));
    cache.set('Patient', '2', makeResource('2'));

    vi.advanceTimersByTime(50);
    cache.set('Patient', '3', makeResource('3')); // newer

    vi.advanceTimersByTime(60); // entries 1,2 expired; 3 still valid

    const swept = cache.sweep();
    expect(swept).toBe(2);
    expect(cache.size).toBe(1);
    expect(cache.get('Patient', '3')).toBeDefined();

    vi.useRealTimers();
  });
});
