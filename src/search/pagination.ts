/**
 * Pagination Helpers
 *
 * Build pagination URLs for FHIR search Bundle links.
 * Pure functions — no database dependency.
 *
 * FHIR R4 Pagination spec:
 * - `Bundle.link` with `relation: "self"` — current page URL
 * - `Bundle.link` with `relation: "next"` — next page URL (if more results)
 * - Offset-based pagination using `_offset` and `_count`
 *
 * @module fhir-persistence/search
 */

import { DEFAULT_SEARCH_COUNT } from './types.js';

// =============================================================================
// Section 1: Types
// =============================================================================

/**
 * Context for building pagination links.
 */
export interface PaginationContext {
  /** Base URL of the FHIR server (e.g., `"http://localhost:3000/fhir/R4"`). */
  baseUrl: string;
  /** The FHIR resource type being searched. */
  resourceType: string;
  /** Original query parameters (excluding `_offset`). */
  queryParams: Record<string, string | string[]>;
  /** Page size (`_count`). */
  count: number;
  /** Current offset (`_offset`). */
  offset: number;
  /** Number of results returned on the current page. */
  resultCount: number;
}

// =============================================================================
// Section 2: Link Builders
// =============================================================================

/**
 * Build the `self` link URL for the current search page.
 */
export function buildSelfLink(ctx: PaginationContext): string {
  const params = new URLSearchParams();

  // Add all original query params
  for (const [key, value] of Object.entries(ctx.queryParams)) {
    if (key === '_offset') continue; // We'll add offset explicitly
    if (Array.isArray(value)) {
      for (const v of value) {
        params.append(key, v);
      }
    } else {
      params.append(key, value);
    }
  }

  // Add offset if non-zero
  if (ctx.offset > 0) {
    params.set('_offset', String(ctx.offset));
  }

  const qs = params.toString();
  return qs
    ? `${ctx.baseUrl}/${ctx.resourceType}?${qs}`
    : `${ctx.baseUrl}/${ctx.resourceType}`;
}

/**
 * Build the `next` link URL, or `undefined` if there is no next page.
 *
 * A next page exists when the current page returned exactly `count` results,
 * indicating there may be more.
 */
export function buildNextLink(ctx: PaginationContext): string | undefined {
  if (!hasNextPage(ctx)) {
    return undefined;
  }

  const nextOffset = ctx.offset + ctx.count;
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(ctx.queryParams)) {
    if (key === '_offset') continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        params.append(key, v);
      }
    } else {
      params.append(key, value);
    }
  }

  params.set('_offset', String(nextOffset));

  return `${ctx.baseUrl}/${ctx.resourceType}?${params.toString()}`;
}

/**
 * Determine whether there is a next page of results.
 *
 * Returns `true` when the current page is full (resultCount === count),
 * indicating there may be more results.
 */
export function hasNextPage(ctx: PaginationContext): boolean {
  if (ctx.count <= 0) return false;
  return ctx.resultCount >= ctx.count;
}

/**
 * Build a pagination context from search request parameters.
 */
export function buildPaginationContext(
  baseUrl: string,
  resourceType: string,
  queryParams: Record<string, string | string[]>,
  count: number | undefined,
  offset: number | undefined,
  resultCount: number,
): PaginationContext {
  return {
    baseUrl,
    resourceType,
    queryParams,
    count: count ?? DEFAULT_SEARCH_COUNT,
    offset: offset ?? 0,
    resultCount,
  };
}
