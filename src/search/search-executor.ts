/**
 * Search Executor
 *
 * Executes FHIR search queries against PostgreSQL and returns results.
 * Pure function — takes a `DatabaseClient` and returns `SearchResult`.
 *
 * This module bridges Phase 12's SQL generation with actual database execution.
 *
 * @module fhir-persistence/search
 */

import type { DatabaseClient } from '../db/client.js';
import type { PersistedResource } from '../repo/types.js';
import type { SearchParameterRegistry } from '../registry/search-parameter-registry.js';
import type { SearchRequest } from './types.js';
import { buildSearchSQL, buildCountSQL } from './search-sql-builder.js';
import { executeInclude, executeRevinclude } from './include-executor.js';

// =============================================================================
// Section 1: Types
// =============================================================================

/**
 * Options for search execution.
 */
export interface SearchOptions {
  /** Whether to include total count. */
  total?: 'none' | 'estimate' | 'accurate';
}

/**
 * Result of a search execution.
 */
export interface SearchResult {
  /** Matched resources. */
  resources: PersistedResource[];
  /** Included resources from _include/_revinclude (search.mode = 'include'). */
  included?: PersistedResource[];
  /** Total count (only when `total=accurate`). */
  total?: number;
}

// =============================================================================
// Section 2: Search Execution
// =============================================================================

/**
 * Raw row shape returned by search SQL.
 */
interface SearchRow {
  id: string;
  content: string;
  deleted: boolean;
  [key: string]: unknown;
}

/**
 * Raw row shape returned by count SQL.
 */
interface CountRow {
  count: string;
}

/**
 * Execute a FHIR search query against the database.
 *
 * 1. Builds and executes the search SQL (from Phase 12)
 * 2. Maps rows to `PersistedResource[]`
 * 3. Optionally executes a COUNT query for `_total=accurate`
 *
 * @param db - Database client for query execution.
 * @param request - Parsed search request.
 * @param registry - SearchParameter registry for column resolution.
 * @param options - Search options (e.g., total mode).
 * @returns Search result with resources and optional total.
 */
export async function executeSearch(
  db: DatabaseClient,
  request: SearchRequest,
  registry: SearchParameterRegistry,
  options?: SearchOptions,
): Promise<SearchResult> {
  // 1. Build and execute search SQL
  const searchSQL = buildSearchSQL(request, registry);
  const { rows } = await db.query<SearchRow>(searchSQL.sql, searchSQL.values);

  // 2. Map rows to PersistedResource[]
  const resources = mapRowsToResources(rows);

  // 3. Optionally get total count
  let total: number | undefined;
  if (options?.total === 'accurate') {
    const countSQL = buildCountSQL(request, registry);
    const countResult = await db.query<CountRow>(countSQL.sql, countSQL.values);
    total = parseInt(countResult.rows[0]?.count ?? '0', 10);
  }

  // 4. Execute _include and _revinclude
  const allIncluded: PersistedResource[] = [];

  if (request.include && request.include.length > 0) {
    const included = await executeInclude(db, resources, request.include, registry);
    allIncluded.push(...included);
  }

  if (request.revinclude && request.revinclude.length > 0) {
    const revincluded = await executeRevinclude(db, resources, request.revinclude);
    allIncluded.push(...revincluded);
  }

  const result: SearchResult = { resources, total };
  if (allIncluded.length > 0) {
    result.included = allIncluded;
  }

  return result;
}

// =============================================================================
// Section 3: Row Mapping
// =============================================================================

/**
 * Map database rows to PersistedResource[].
 *
 * Filters out deleted rows (defense-in-depth — the WHERE clause
 * already excludes them, but we double-check here).
 */
export function mapRowsToResources(rows: SearchRow[]): PersistedResource[] {
  const resources: PersistedResource[] = [];
  for (const row of rows) {
    if (row.deleted) continue;
    if (!row.content) continue;
    try {
      resources.push(JSON.parse(row.content) as PersistedResource);
    } catch {
      // Skip rows with invalid JSON (should not happen in practice)
    }
  }
  return resources;
}
