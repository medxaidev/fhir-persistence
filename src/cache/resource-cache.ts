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
