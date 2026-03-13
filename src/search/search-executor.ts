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
import type { SearchRequest, IncludeTarget } from './types.js';
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

// =============================================================================
// Section 4: v2 Search Executor (StorageAdapter, ? placeholders)
// =============================================================================

import type { StorageAdapter } from '../db/adapter.js';
import { buildSearchSQLv2, buildCountSQLv2 } from './search-sql-builder.js';

/**
 * v2: Raw row shape returned by search SQL.
 * Uses deleted: number (0/1) instead of boolean.
 */
interface SearchRowV2 {
  id: string;
  versionId: string;
  content: string;
  deleted: number;
  lastUpdated: string;
  [key: string]: unknown;
}

/**
 * v2: Execute a FHIR search query using StorageAdapter.
 *
 * Key differences from v1:
 * - Uses `StorageAdapter` instead of `DatabaseClient`
 * - Uses `?` placeholders (SQLite)
 * - `deleted` is number (0/1), not boolean
 * - No `_include` / `_revinclude` in this MVP (can be added)
 */
export async function executeSearchV2(
  adapter: StorageAdapter,
  request: SearchRequest,
  registry: SearchParameterRegistry,
  options?: SearchOptions,
): Promise<SearchResult> {
  // 1. Build and execute search SQL
  const searchSQL = buildSearchSQLv2(request, registry);
  const rows = await adapter.query<SearchRowV2>(searchSQL.sql, searchSQL.values);

  // 2. Map rows to PersistedResource[]
  const resources = mapRowsToResourcesV2(rows);

  // 3. Optionally get total count
  let total: number | undefined;
  if (options?.total === 'accurate') {
    const countSQL = buildCountSQLv2(request, registry);
    const countRow = await adapter.queryOne<{ count: number }>(countSQL.sql, countSQL.values);
    total = countRow?.count ?? 0;
  }

  // 4. Execute _include and _revinclude (v2 using StorageAdapter)
  const allIncluded: PersistedResource[] = [];

  if (request.include && request.include.length > 0) {
    const included = await executeIncludeV2(adapter, resources, request.include, registry);
    allIncluded.push(...included);
  }

  if (request.revinclude && request.revinclude.length > 0) {
    const revincluded = await executeRevincludeV2(adapter, resources, request.revinclude);
    allIncluded.push(...revincluded);
  }

  const result: SearchResult = { resources, total };
  if (allIncluded.length > 0) {
    result.included = allIncluded;
  }

  return result;
}

/**
 * v2: Map rows with deleted:number to PersistedResource[].
 */
export function mapRowsToResourcesV2(rows: SearchRowV2[]): PersistedResource[] {
  const resources: PersistedResource[] = [];
  for (const row of rows) {
    if (row.deleted === 1) continue;
    if (!row.content) continue;
    try {
      resources.push(JSON.parse(row.content) as PersistedResource);
    } catch {
      // Skip invalid JSON
    }
  }
  return resources;
}

// =============================================================================
// Section 5: v2 Include / Revinclude (StorageAdapter)
// =============================================================================

/**
 * v2: Execute _include using StorageAdapter with ? placeholders.
 */
async function executeIncludeV2(
  adapter: StorageAdapter,
  primaryResults: PersistedResource[],
  includes: IncludeTarget[],
  registry: SearchParameterRegistry,
): Promise<PersistedResource[]> {
  if (primaryResults.length === 0 || includes.length === 0) return [];

  const seen = new Set(primaryResults.map(r => `${r.resourceType}/${r.id}`));
  const allIncluded: PersistedResource[] = [];

  for (const include of includes) {
    if (include.wildcard) {
      // Wildcard: scan all reference strings from primary results
      for (const resource of primaryResults) {
        const refs = extractAllRefsFromResource(resource);
        for (const ref of refs) {
          const key = `${ref.resourceType}/${ref.id}`;
          if (seen.has(key)) continue;
          try {
            const row = await adapter.queryOne<{ content: string; deleted: number }>(
              `SELECT "content", "deleted" FROM "${ref.resourceType}" WHERE "id" = ? AND "deleted" = 0`,
              [ref.id],
            );
            if (row) {
              const res = JSON.parse(row.content) as PersistedResource;
              seen.add(key);
              allIncluded.push(res);
            }
          } catch {
            // Table may not exist
          }
        }
      }
      continue;
    }

    const impl = registry.getImpl(include.resourceType, include.searchParam);
    if (!impl || impl.type !== 'reference') continue;

    const sourceResults = primaryResults.filter(r => r.resourceType === include.resourceType);
    for (const resource of sourceResults) {
      const refs = extractRefsFromField(resource, impl.columnName);
      for (const ref of refs) {
        if (include.targetType && ref.resourceType !== include.targetType) continue;
        const key = `${ref.resourceType}/${ref.id}`;
        if (seen.has(key)) continue;
        try {
          const row = await adapter.queryOne<{ content: string; deleted: number }>(
            `SELECT "content", "deleted" FROM "${ref.resourceType}" WHERE "id" = ? AND "deleted" = 0`,
            [ref.id],
          );
          if (row) {
            const res = JSON.parse(row.content) as PersistedResource;
            seen.add(key);
            allIncluded.push(res);
          }
        } catch {
          // Table may not exist
        }
      }
    }
  }

  return allIncluded;
}

/**
 * v2: Execute _revinclude using StorageAdapter with ? placeholders.
 * Uses the References table with targetType column for precise queries.
 */
async function executeRevincludeV2(
  adapter: StorageAdapter,
  primaryResults: PersistedResource[],
  revincludes: IncludeTarget[],
): Promise<PersistedResource[]> {
  if (primaryResults.length === 0 || revincludes.length === 0) return [];

  const primaryKeySet = new Set(primaryResults.map(r => `${r.resourceType}/${r.id}`));
  const allIncluded: PersistedResource[] = [];
  const seen = new Set(primaryKeySet);

  for (const rev of revincludes) {
    const sourceType = rev.resourceType;
    const refTable = `${sourceType}_References`;

    for (const primary of primaryResults) {
      // Use targetType for precise matching (v2 References table has targetType)
      const sql = `SELECT "resourceId" FROM "${refTable}" WHERE "targetId" = ? AND "code" = ? AND "targetType" = ?`;
      try {
        const rows = await adapter.query<{ resourceId: string }>(sql, [primary.id, rev.searchParam, primary.resourceType]);
        for (const row of rows) {
          const key = `${sourceType}/${row.resourceId}`;
          if (seen.has(key)) continue;
          const resourceRow = await adapter.queryOne<{ content: string; deleted: number }>(
            `SELECT "content", "deleted" FROM "${sourceType}" WHERE "id" = ? AND "deleted" = 0`,
            [row.resourceId],
          );
          if (resourceRow) {
            const res = JSON.parse(resourceRow.content) as PersistedResource;
            seen.add(key);
            allIncluded.push(res);
          }
        }
      } catch {
        // Table may not exist
      }
    }
  }

  return allIncluded;
}

// -- v2 reference extraction helpers --

function extractAllRefsFromResource(resource: PersistedResource): Array<{ resourceType: string; id: string }> {
  const results: Array<{ resourceType: string; id: string }> = [];
  const stack: unknown[] = [resource];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === null || current === undefined || typeof current !== 'object') continue;
    if (Array.isArray(current)) { for (const item of current) stack.push(item); continue; }
    const record = current as Record<string, unknown>;
    if (typeof record.reference === 'string') {
      const parsed = parseRefV2(record.reference);
      if (parsed) results.push(parsed);
    }
    for (const value of Object.values(record)) {
      if (typeof value === 'object' && value !== null) stack.push(value);
    }
  }
  return results;
}

function extractRefsFromField(resource: PersistedResource, fieldName: string): Array<{ resourceType: string; id: string }> {
  const record = resource as unknown as Record<string, unknown>;
  const value = record[fieldName];
  if (!value) return [];
  const results: Array<{ resourceType: string; id: string }> = [];
  if (Array.isArray(value)) {
    for (const v of value) {
      const ref = extractRefStringV2(v);
      if (ref) { const parsed = parseRefV2(ref); if (parsed) results.push(parsed); }
    }
  } else {
    const ref = extractRefStringV2(value);
    if (ref) { const parsed = parseRefV2(ref); if (parsed) results.push(parsed); }
  }
  return results;
}

function extractRefStringV2(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const ref = (value as Record<string, unknown>).reference;
    if (typeof ref === 'string') return ref;
  }
  return null;
}

function parseRefV2(ref: string): { resourceType: string; id: string } | null {
  if (ref.startsWith('#') || ref.startsWith('urn:')) return null;
  const segments = ref.split('/');
  if (segments.length < 2) return null;
  const id = segments[segments.length - 1];
  const resourceType = segments[segments.length - 2];
  if (!id || !resourceType) return null;
  return { resourceType, id };
}
