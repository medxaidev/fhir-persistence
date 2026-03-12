/**
 * SearchSet Bundle Builder
 *
 * Constructs FHIR R4 Bundle of type `searchset` from search results.
 * Pure function — no database dependency.
 *
 * FHIR R4 Search Bundle spec:
 * - `Bundle.type` = `"searchset"`
 * - Each entry has `search.mode` = `"match"`
 * - `Bundle.total` is optional (only when `_total=accurate`)
 * - `Bundle.link` includes `self` and optionally `next`
 *
 * @module fhir-persistence/search
 */

import { randomUUID } from 'node:crypto';
import type { PersistedResource } from '../repo/types.js';
import type { BundleLink } from '../repo/history-bundle.js';

// =============================================================================
// Section 1: Types
// =============================================================================

/**
 * A FHIR R4 Bundle of type `searchset`.
 */
export interface SearchBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'searchset';
  total?: number;
  link?: BundleLink[];
  entry?: SearchBundleEntry[];
}

/**
 * A single entry in a searchset Bundle.
 */
export interface SearchBundleEntry {
  fullUrl?: string;
  resource: Record<string, unknown>;
  search: {
    mode: 'match' | 'include' | 'outcome';
  };
}

/**
 * Options for building a searchset Bundle.
 */
export interface BuildSearchBundleOptions {
  /** Base URL for fullUrl construction (e.g., `"http://localhost:3000/fhir/R4"`). */
  baseUrl?: string;
  /** Total count of matching resources (only included when `_total=accurate`). */
  total?: number;
  /** Self link URL. */
  selfUrl?: string;
  /** Next page link URL. */
  nextUrl?: string;
  /** Included resources from _include/_revinclude. */
  included?: PersistedResource[];
}

// =============================================================================
// Section 2: Bundle Construction
// =============================================================================

/**
 * Build a FHIR R4 searchset Bundle from PersistedResource[].
 *
 * @param resources - Matched resources.
 * @param options - Optional bundle metadata.
 * @returns A FHIR R4 Bundle of type `searchset`.
 */
export function buildSearchBundle(
  resources: PersistedResource[],
  options?: BuildSearchBundleOptions,
): SearchBundle {
  const bundle: SearchBundle = {
    resourceType: 'Bundle',
    id: randomUUID(),
    type: 'searchset',
  };

  // Total (only when explicitly provided)
  if (options?.total !== undefined) {
    bundle.total = options.total;
  }

  // Links
  const links: BundleLink[] = [];
  if (options?.selfUrl) {
    links.push({ relation: 'self', url: options.selfUrl });
  }
  if (options?.nextUrl) {
    links.push({ relation: 'next', url: options.nextUrl });
  }
  if (links.length > 0) {
    bundle.link = links;
  }

  // Entries
  const entries: SearchBundleEntry[] = [];

  // Primary match entries
  for (const resource of resources) {
    entries.push(toSearchEntry(resource, 'match', options?.baseUrl));
  }

  // Included entries (_include / _revinclude)
  if (options?.included && options.included.length > 0) {
    for (const resource of options.included) {
      entries.push(toSearchEntry(resource, 'include', options?.baseUrl));
    }
  }

  if (entries.length > 0) {
    bundle.entry = entries;
  }

  return bundle;
}

// =============================================================================
// Section 3: Entry Construction
// =============================================================================

/**
 * Convert a PersistedResource to a SearchBundleEntry.
 */
function toSearchEntry(
  resource: PersistedResource,
  mode: 'match' | 'include' | 'outcome',
  baseUrl?: string,
): SearchBundleEntry {
  const entry: SearchBundleEntry = {
    resource: resource as unknown as Record<string, unknown>,
    search: {
      mode,
    },
  };

  if (baseUrl) {
    entry.fullUrl = `${baseUrl}/${resource.resourceType}/${resource.id}`;
  }

  return entry;
}
