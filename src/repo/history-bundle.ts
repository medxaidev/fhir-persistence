/**
 * History Bundle Builder
 *
 * Constructs FHIR R4 Bundle of type `history` from `HistoryEntry[]`.
 * Pure function — no database dependency.
 *
 * FHIR R4 History Bundle spec:
 * - `Bundle.type` = `"history"`
 * - Each entry has `request` (method + URL) and `response` (status + etag)
 * - Delete entries have `request.method = "DELETE"` and no `resource`
 * - Entries ordered newest first
 *
 * @module fhir-persistence/repo
 */

import { randomUUID } from 'node:crypto';
import type { HistoryEntry } from './types.js';

// =============================================================================
// Section 1: Types
// =============================================================================

/**
 * A FHIR R4 Bundle (minimal shape for history).
 */
export interface HistoryBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'history';
  total: number;
  link?: BundleLink[];
  entry?: HistoryBundleEntry[];
}

export interface BundleLink {
  relation: string;
  url: string;
}

export interface HistoryBundleEntry {
  fullUrl?: string;
  resource?: Record<string, unknown>;
  request: {
    method: string;
    url: string;
  };
  response: {
    status: string;
    etag?: string;
    lastModified?: string;
  };
}

// =============================================================================
// Section 2: Bundle Construction
// =============================================================================

/**
 * Options for building a history bundle.
 */
export interface BuildHistoryBundleOptions {
  /** Base URL for fullUrl construction (e.g., `"http://localhost:3000/fhir/R4"`). */
  baseUrl?: string;
  /** Total count of matching entries (may differ from entries.length if paginated). */
  total?: number;
  /** Self link URL. */
  selfUrl?: string;
  /** Next page link URL. */
  nextUrl?: string;
}

/**
 * Build a FHIR R4 history Bundle from HistoryEntry[].
 *
 * @param entries - History entries (newest first).
 * @param options - Optional bundle metadata.
 * @returns A FHIR R4 Bundle of type `history`.
 */
export function buildHistoryBundle(
  entries: HistoryEntry[],
  options?: BuildHistoryBundleOptions,
): HistoryBundle {
  const bundle: HistoryBundle = {
    resourceType: 'Bundle',
    id: randomUUID(),
    type: 'history',
    total: options?.total ?? entries.length,
  };

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
  if (entries.length > 0) {
    bundle.entry = entries.map((entry) => toBundleEntry(entry, options?.baseUrl));
  }

  return bundle;
}

// =============================================================================
// Section 3: Entry Construction
// =============================================================================

function toBundleEntry(
  entry: HistoryEntry,
  baseUrl?: string,
): HistoryBundleEntry {
  const { resourceType, id, versionId, lastUpdated, deleted, resource } = entry;
  const resourceUrl = `${resourceType}/${id}`;

  const bundleEntry: HistoryBundleEntry = {
    request: {
      method: deleted ? 'DELETE' : (resource?.meta?.versionId === versionId ? 'PUT' : 'POST'),
      url: resourceUrl,
    },
    response: {
      status: deleted ? '204' : '200',
      etag: `W/"${versionId}"`,
      lastModified: lastUpdated,
    },
  };

  if (baseUrl) {
    bundleEntry.fullUrl = `${baseUrl}/${resourceUrl}`;
  }

  if (!deleted && resource) {
    bundleEntry.resource = resource as unknown as Record<string, unknown>;
  }

  return bundleEntry;
}

/**
 * Determine the HTTP method for a history entry.
 *
 * Heuristic: if the entry is the first version (oldest) for a resource,
 * it's a POST (create). Otherwise it's a PUT (update).
 * Delete entries are always DELETE.
 *
 * For simplicity, we check if this is the first entry in the history
 * by comparing with the resource's creation time. Since we don't have
 * that info here, we use a simple heuristic: POST for the first entry
 * in the array (oldest), PUT for the rest.
 */
export function determineMethod(
  entries: HistoryEntry[],
  index: number,
): string {
  const entry = entries[index];
  if (entry.deleted) return 'DELETE';
  // Last entry in the array (oldest, since newest-first) = POST (create)
  if (index === entries.length - 1) return 'POST';
  return 'PUT';
}
