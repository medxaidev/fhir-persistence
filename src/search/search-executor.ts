/**
 * Search Executor (v2)
 *
 * Executes FHIR search queries using StorageAdapter and returns results.
 * Supports _include, _revinclude, and _include:iterate.
 *
 * @module fhir-persistence/search
 */

import type { PersistedResource } from '../repo/types.js';
import type { SearchParameterRegistry } from '../registry/search-parameter-registry.js';
import type { SearchRequest, IncludeTarget } from './types.js';
import type { StorageAdapter } from '../db/adapter.js';
import { buildSearchSQLv2, buildCountSQLv2 } from './search-sql-builder.js';

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

/** Maximum recursion depth for _include:iterate (ADR limit). */
const MAX_INCLUDE_ITERATE_DEPTH = 3;

/** Maximum total included resources (safety cap). */
const MAX_INCLUDE_RESOURCES = 1000;

/**
 * v2: Execute _include using StorageAdapter with ? placeholders.
 * Supports _include:iterate for recursive include resolution.
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

  // Separate iterate vs non-iterate includes
  const nonIterateIncludes = includes.filter(i => !i.iterate);
  const iterateIncludes = includes.filter(i => i.iterate);

  // Phase 1: Non-iterate includes (single pass)
  const firstPassResults = await resolveIncludesOnce(
    adapter, primaryResults, nonIterateIncludes, registry, seen, allIncluded,
  );

  // Phase 2: Iterate includes (recursive, up to MAX_INCLUDE_ITERATE_DEPTH)
  if (iterateIncludes.length > 0) {
    // Start with primary + first-pass results as the source pool
    let currentSources: PersistedResource[] = [...primaryResults, ...firstPassResults];

    for (let depth = 0; depth < MAX_INCLUDE_ITERATE_DEPTH; depth++) {
      if (allIncluded.length >= MAX_INCLUDE_RESOURCES) break;

      const newlyIncluded = await resolveIncludesOnce(
        adapter, currentSources, iterateIncludes, registry, seen, allIncluded,
      );

      if (newlyIncluded.length === 0) break; // No new resources found — stop
      currentSources = newlyIncluded; // Next iteration uses newly included as sources
    }
  }

  return allIncluded;
}

/**
 * Single pass of include resolution. Returns newly included resources.
 */
async function resolveIncludesOnce(
  adapter: StorageAdapter,
  sourceResources: PersistedResource[],
  includes: IncludeTarget[],
  registry: SearchParameterRegistry,
  seen: Set<string>,
  allIncluded: PersistedResource[],
): Promise<PersistedResource[]> {
  const newlyIncluded: PersistedResource[] = [];

  for (const include of includes) {
    if (allIncluded.length >= MAX_INCLUDE_RESOURCES) break;

    if (include.wildcard) {
      for (const resource of sourceResources) {
        if (allIncluded.length >= MAX_INCLUDE_RESOURCES) break;
        const refs = extractAllRefsFromResource(resource);
        for (const ref of refs) {
          if (allIncluded.length >= MAX_INCLUDE_RESOURCES) break;
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
              newlyIncluded.push(res);
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

    const matchingResources = sourceResources.filter(r => r.resourceType === include.resourceType);
    for (const resource of matchingResources) {
      if (allIncluded.length >= MAX_INCLUDE_RESOURCES) break;
      const refs = extractRefsFromField(resource, impl.columnName);
      for (const ref of refs) {
        if (allIncluded.length >= MAX_INCLUDE_RESOURCES) break;
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
            newlyIncluded.push(res);
          }
        } catch {
          // Table may not exist
        }
      }
    }
  }

  return newlyIncluded;
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
