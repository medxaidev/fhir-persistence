/**
 * Resource Cache — In-Memory LRU
 *
 * Provides an in-memory LRU cache for `readResource` results.
 * Invalidated on update and delete operations.
 *
 * Disabled by default. Enable via configuration.
 *
 * @module fhir-persistence/cache
 */

import type { PersistedResource } from '../repo/types.js';

// =============================================================================
// Section 1: Types
// =============================================================================

/**
 * Configuration for the resource cache.
 */
export interface ResourceCacheConfig {
  /** Maximum number of entries. Default: 1000. */
  maxSize?: number;
  /** Time-to-live in milliseconds. Default: 60000 (60s). */
  ttlMs?: number;
  /** Whether the cache is enabled. Default: false. */
  enabled?: boolean;
}

interface CacheEntry {
  resource: PersistedResource;
  expiresAt: number;
}

// =============================================================================
// Section 2: LRU Cache Implementation
// =============================================================================

/**
 * Simple LRU cache for FHIR resources.
 *
 * Uses a Map (insertion-ordered) for O(1) get/set/delete.
 * Evicts the oldest entry when maxSize is reached.
 */
export class ResourceCache {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly ttlMs: number;
  private readonly enabled: boolean;

  // Stats
  private _hits = 0;
  private _misses = 0;

  constructor(config?: ResourceCacheConfig) {
    this.maxSize = config?.maxSize ?? 1000;
    this.ttlMs = config?.ttlMs ?? 60_000;
    this.enabled = config?.enabled ?? false;
  }

  /**
   * Build cache key from resourceType and id.
   */
  private key(resourceType: string, id: string): string {
    return `${resourceType}/${id}`;
  }

  /**
   * Get a resource from the cache.
   * Returns undefined on miss or expiry.
   */
  get(resourceType: string, id: string): PersistedResource | undefined {
    if (!this.enabled) return undefined;

    const k = this.key(resourceType, id);
    const entry = this.cache.get(k);

    if (!entry) {
      this._misses++;
      return undefined;
    }

    // Check TTL
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(k);
      this._misses++;
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(k);
    this.cache.set(k, entry);

    this._hits++;
    return entry.resource;
  }

  /**
   * Put a resource into the cache.
   */
  set(resourceType: string, id: string, resource: PersistedResource): void {
    if (!this.enabled) return;

    const k = this.key(resourceType, id);

    // Delete if exists (to refresh insertion order)
    this.cache.delete(k);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(k, {
      resource,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /**
   * Invalidate a cache entry (on update or delete).
   */
  invalidate(resourceType: string, id: string): void {
    if (!this.enabled) return;
    this.cache.delete(this.key(resourceType, id));
  }

  /**
   * Clear all cache entries.
   */
  clear(): void {
    this.cache.clear();
    this._hits = 0;
    this._misses = 0;
  }

  /**
   * Current cache size.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Cache statistics.
   */
  get stats(): { hits: number; misses: number; size: number; hitRate: number } {
    const total = this._hits + this._misses;
    return {
      hits: this._hits,
      misses: this._misses,
      size: this.cache.size,
      hitRate: total > 0 ? this._hits / total : 0,
    };
  }

  get isEnabled(): boolean {
    return this.enabled;
  }
}

// =============================================================================
// Section 3: v2 — ResourceCacheV2 with Eviction Policy
// =============================================================================

/**
 * Eviction policy for the cache.
 *
 * - `lru` — Least Recently Used: evict the entry that was accessed longest ago.
 * - `fifo` — First In First Out: evict the entry that was inserted first.
 * - `ttl-only` — No size-based eviction; entries only expire via TTL.
 */
export type EvictionPolicy = 'lru' | 'fifo' | 'ttl-only';

/**
 * v2 configuration for the resource cache.
 */
export interface ResourceCacheV2Config {
  /** Maximum number of entries. Default: 1000. Ignored for ttl-only policy. */
  maxSize?: number;
  /** Time-to-live in milliseconds. Default: 60000 (60s). */
  ttlMs?: number;
  /** Whether the cache is enabled. Default: false. */
  enabled?: boolean;
  /** Eviction policy. Default: 'lru'. */
  evictionPolicy?: EvictionPolicy;
}

interface CacheEntryV2 {
  resource: PersistedResource;
  expiresAt: number;
  insertedAt: number;
}

/**
 * v2 Resource Cache with configurable eviction policy.
 *
 * Upgrades v1 with:
 * - Eviction policy: lru / fifo / ttl-only
 * - stats.reset() to zero counters
 * - sweep() to proactively remove expired entries
 */
export class ResourceCacheV2 {
  private readonly cache = new Map<string, CacheEntryV2>();
  private readonly maxSize: number;
  private readonly ttlMs: number;
  private readonly enabled: boolean;
  private readonly evictionPolicy: EvictionPolicy;

  private _hits = 0;
  private _misses = 0;
  private _evictions = 0;

  constructor(config?: ResourceCacheV2Config) {
    this.maxSize = config?.maxSize ?? 1000;
    this.ttlMs = config?.ttlMs ?? 60_000;
    this.enabled = config?.enabled ?? false;
    this.evictionPolicy = config?.evictionPolicy ?? 'lru';
  }

  private key(resourceType: string, id: string): string {
    return `${resourceType}/${id}`;
  }

  get(resourceType: string, id: string): PersistedResource | undefined {
    if (!this.enabled) return undefined;

    const k = this.key(resourceType, id);
    const entry = this.cache.get(k);

    if (!entry) {
      this._misses++;
      return undefined;
    }

    // Check TTL
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(k);
      this._misses++;
      return undefined;
    }

    // LRU: move to end on access; FIFO/ttl-only: do not move
    if (this.evictionPolicy === 'lru') {
      this.cache.delete(k);
      this.cache.set(k, entry);
    }

    this._hits++;
    return entry.resource;
  }

  set(resourceType: string, id: string, resource: PersistedResource): void {
    if (!this.enabled) return;

    const k = this.key(resourceType, id);
    this.cache.delete(k);

    // Size-based eviction (not for ttl-only)
    if (this.evictionPolicy !== 'ttl-only') {
      while (this.cache.size >= this.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey !== undefined) {
          this.cache.delete(oldestKey);
          this._evictions++;
        } else {
          break;
        }
      }
    }

    const now = Date.now();
    this.cache.set(k, {
      resource,
      expiresAt: now + this.ttlMs,
      insertedAt: now,
    });
  }

  invalidate(resourceType: string, id: string): void {
    if (!this.enabled) return;
    this.cache.delete(this.key(resourceType, id));
  }

  clear(): void {
    this.cache.clear();
    this._hits = 0;
    this._misses = 0;
    this._evictions = 0;
  }

  /**
   * Proactively remove all expired entries.
   * @returns Number of entries swept.
   */
  sweep(): number {
    const now = Date.now();
    let swept = 0;
    for (const [k, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(k);
        swept++;
      }
    }
    return swept;
  }

  get size(): number {
    return this.cache.size;
  }

  get stats(): { hits: number; misses: number; size: number; hitRate: number; evictions: number } {
    const total = this._hits + this._misses;
    return {
      hits: this._hits,
      misses: this._misses,
      size: this.cache.size,
      hitRate: total > 0 ? this._hits / total : 0,
      evictions: this._evictions,
    };
  }

  /**
   * Reset stats counters without clearing cache entries.
   */
  resetStats(): void {
    this._hits = 0;
    this._misses = 0;
    this._evictions = 0;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  get policy(): EvictionPolicy {
    return this.evictionPolicy;
  }
}
