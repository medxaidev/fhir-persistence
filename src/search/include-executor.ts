/**
 * Include / Revinclude Executor
 *
 * Implements `_include`, `_include:iterate`, `_include=*`,
 * `_revinclude`, and `_revinclude:iterate` FHIR search features.
 *
 * - `_include`: After primary search, load referenced resources.
 * - `_include:iterate`: Recursively include references from included resources (max depth).
 * - `_include=*`: Include ALL referenced resources (wildcard).
 * - `_revinclude`: After primary search, load resources that reference the results.
 *
 * @module fhir-persistence/search
 */

import type { DatabaseClient } from '../db/client.js';
import type { PersistedResource } from '../repo/types.js';
import type { SearchParameterRegistry } from '../registry/search-parameter-registry.js';
import type { IncludeTarget } from './types.js';

/**
 * Maximum recursion depth for `_include:iterate`.
 * Prevents infinite loops in circular reference graphs.
 */
const MAX_ITERATE_DEPTH = 3;

// =============================================================================
// Section 1: _include Execution
// =============================================================================

/**
 * Execute `_include` — load resources referenced by the primary search results.
 *
 * Supports three modes:
 * 1. **Normal** `_include=Type:param` — single-pass include
 * 2. **Iterate** `_include:iterate=Type:param` — recursive include (max depth 3)
 * 3. **Wildcard** `_include=*` — include all references via References table
 *
 * @param db - Database client.
 * @param primaryResults - Primary search results (match resources).
 * @param includes - Parsed _include targets.
 * @param registry - SearchParameterRegistry for resolving reference params.
 * @returns Included resources (deduplicated).
 */
export async function executeInclude(
  db: DatabaseClient,
  primaryResults: PersistedResource[],
  includes: IncludeTarget[],
  registry: SearchParameterRegistry,
): Promise<PersistedResource[]> {
  if (primaryResults.length === 0 || includes.length === 0) {
    return [];
  }

  const seen = new Set(primaryResults.map((r) => `${r.resourceType}/${r.id}`));
  const allIncluded: PersistedResource[] = [];

  // Separate wildcard, iterate, and normal includes
  const wildcardIncludes = includes.filter((i) => i.wildcard);
  const iterateIncludes = includes.filter((i) => i.iterate && !i.wildcard);
  const normalIncludes = includes.filter((i) => !i.iterate && !i.wildcard);

  // 1. Normal includes (single pass)
  if (normalIncludes.length > 0) {
    const normalResults = await resolveIncludePass(db, primaryResults, normalIncludes, registry);
    for (const r of normalResults) {
      const key = `${r.resourceType}/${r.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        allIncluded.push(r);
      }
    }
  }

  // 2. Wildcard includes
  if (wildcardIncludes.length > 0) {
    const wildcardResults = await resolveWildcardInclude(db, primaryResults);
    for (const r of wildcardResults) {
      const key = `${r.resourceType}/${r.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        allIncluded.push(r);
      }
    }
  }

  // 3. Iterate includes (recursive with depth limit)
  if (iterateIncludes.length > 0) {
    let currentBatch = [...primaryResults, ...allIncluded];
    for (let depth = 0; depth < MAX_ITERATE_DEPTH; depth++) {
      const newResults = await resolveIncludePass(db, currentBatch, iterateIncludes, registry);
      const newResources: PersistedResource[] = [];
      for (const r of newResults) {
        const key = `${r.resourceType}/${r.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          newResources.push(r);
          allIncluded.push(r);
        }
      }
      if (newResources.length === 0) break; // No new resources found — stop iterating
      currentBatch = newResources;
    }
  }

  return allIncluded;
}

/**
 * Single-pass include resolution: collect referenced resources from sourceResources.
 */
async function resolveIncludePass(
  db: DatabaseClient,
  sourceResources: PersistedResource[],
  includes: IncludeTarget[],
  registry: SearchParameterRegistry,
): Promise<PersistedResource[]> {
  const targetsByType = new Map<string, Set<string>>();

  for (const include of includes) {
    const impl = registry.getImpl(include.resourceType, include.searchParam);
    if (!impl || impl.type !== 'reference') continue;

    // Filter source results to matching source type
    const sourceResults = sourceResources.filter(
      (r) => r.resourceType === include.resourceType,
    );

    for (const resource of sourceResults) {
      const refs = extractReferenceStrings(resource, impl.columnName, impl.array);
      for (const ref of refs) {
        const parsed = parseReference(ref);
        if (!parsed) continue;

        // Apply target type filter if specified
        if (include.targetType && parsed.resourceType !== include.targetType) {
          continue;
        }

        const set = targetsByType.get(parsed.resourceType) ?? new Set();
        set.add(parsed.id);
        targetsByType.set(parsed.resourceType, set);
      }
    }
  }

  return batchLoadResources(db, targetsByType, new Set());
}

// =============================================================================
// Section 1b: Wildcard Include
// =============================================================================

/**
 * Execute wildcard `_include=*` — load ALL resources referenced by
 * the primary search results, using the `{Type}_References` table.
 *
 * Since the References table only stores (resourceId, targetId, code)
 * without a targetType column, we collect all targetIds and resolve
 * the actual resource type by extracting references from the source
 * resource JSON (which contains typed references like "Patient/123").
 */
async function resolveWildcardInclude(
  db: DatabaseClient,
  sourceResources: PersistedResource[],
): Promise<PersistedResource[]> {
  // Extract ALL reference strings from source resources
  const targetsByType = new Map<string, Set<string>>();

  for (const resource of sourceResources) {
    const refs = extractAllReferenceStrings(resource);
    for (const ref of refs) {
      const parsed = parseReference(ref);
      if (!parsed) continue;
      const set = targetsByType.get(parsed.resourceType) ?? new Set();
      set.add(parsed.id);
      targetsByType.set(parsed.resourceType, set);
    }
  }

  const excludeKeys = new Set(sourceResources.map((r) => `${r.resourceType}/${r.id}`));
  return batchLoadResources(db, targetsByType, excludeKeys);
}

/**
 * Extract ALL reference strings from a resource by deep-scanning
 * the JSON for objects with a `reference` property.
 */
function extractAllReferenceStrings(resource: PersistedResource): string[] {
  const results: string[] = [];
  const stack: unknown[] = [resource];

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === null || current === undefined || typeof current !== 'object') continue;

    if (Array.isArray(current)) {
      for (const item of current) {
        stack.push(item);
      }
      continue;
    }

    const record = current as Record<string, unknown>;
    // Check if this object has a "reference" string property (FHIR Reference)
    if (typeof record.reference === 'string') {
      results.push(record.reference);
    }

    // Recurse into all object properties
    for (const value of Object.values(record)) {
      if (typeof value === 'object' && value !== null) {
        stack.push(value);
      }
    }
  }

  return results;
}

// =============================================================================
// Section 2: _revinclude Execution
// =============================================================================

/**
 * Execute `_revinclude` — load resources that reference the primary search results.
 *
 * Uses the `{ResourceType}_References` table to find reverse references.
 *
 * @param db - Database client.
 * @param primaryResults - Primary search results.
 * @param revincludes - Parsed _revinclude targets.
 * @returns Reverse-included resources (deduplicated).
 */
export async function executeRevinclude(
  db: DatabaseClient,
  primaryResults: PersistedResource[],
  revincludes: IncludeTarget[],
): Promise<PersistedResource[]> {
  if (primaryResults.length === 0 || revincludes.length === 0) {
    return [];
  }

  const primaryIds = primaryResults.map((r) => r.id);
  const primaryKeySet = new Set(primaryResults.map((r) => `${r.resourceType}/${r.id}`));
  const resultsByType = new Map<string, Set<string>>();

  for (const rev of revincludes) {
    const sourceType = rev.resourceType;
    const refTable = `${sourceType}_References`;

    // Query the references table for resources that point to our primary results
    const sql = `SELECT "resourceId" FROM "${refTable}" WHERE "targetId" = ANY($1) AND "code" = $2`;
    try {
      const { rows } = await db.query<{ resourceId: string }>(sql, [primaryIds, rev.searchParam]);
      for (const row of rows) {
        const set = resultsByType.get(sourceType) ?? new Set();
        set.add(row.resourceId);
        resultsByType.set(sourceType, set);
      }
    } catch {
      // Table may not exist or query may fail — skip silently
      continue;
    }
  }

  return batchLoadResources(db, resultsByType, primaryKeySet);
}

// =============================================================================
// Section 3: Helpers
// =============================================================================

/**
 * Extract reference strings from a resource's search column values.
 *
 * For _include, we need to read the reference values from the resource JSON
 * directly (not from search columns), since the search columns store
 * processed values.
 */
function extractReferenceStrings(
  resource: PersistedResource,
  columnName: string,
  isArray: boolean,
): string[] {
  // Navigate the resource JSON to find the reference field
  // The columnName corresponds to the search param code, which maps to a field
  // We need to check common reference field patterns
  const record = resource as unknown as Record<string, unknown>;

  // Try direct field access (e.g., "subject" → resource.subject)
  const value = record[columnName];
  if (!value) return [];

  if (isArray && Array.isArray(value)) {
    return value
      .map((v) => extractRefString(v))
      .filter((r): r is string => r !== null);
  }

  const ref = extractRefString(value);
  return ref ? [ref] : [];
}

/**
 * Extract a reference string from a value (Reference object or string).
 */
function extractRefString(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const ref = (value as Record<string, unknown>).reference;
    if (typeof ref === 'string') return ref;
  }
  return null;
}

/**
 * Parse a FHIR reference string into resourceType + id.
 *
 * - `"Patient/123"` → `{ resourceType: "Patient", id: "123" }`
 * - `"http://example.com/fhir/Patient/123"` → `{ resourceType: "Patient", id: "123" }`
 * - `"#contained"` → null
 * - `"urn:uuid:..."` → null
 */
function parseReference(ref: string): { resourceType: string; id: string } | null {
  if (ref.startsWith('#') || ref.startsWith('urn:')) return null;

  // For absolute URLs, extract the last two segments (type/id)
  const segments = ref.split('/');
  if (segments.length < 2) return null;

  const id = segments[segments.length - 1];
  const resourceType = segments[segments.length - 2];

  if (!id || !resourceType) return null;

  return { resourceType, id };
}

/**
 * Batch-load resources by type and ID, excluding already-seen keys.
 */
async function batchLoadResources(
  db: DatabaseClient,
  targetsByType: Map<string, Set<string>>,
  excludeKeys: Set<string>,
): Promise<PersistedResource[]> {
  const results: PersistedResource[] = [];
  const seen = new Set(excludeKeys);

  for (const [resourceType, ids] of targetsByType) {
    const idArray = [...ids].filter((id) => !seen.has(`${resourceType}/${id}`));
    if (idArray.length === 0) continue;

    const sql = `SELECT "content" FROM "${resourceType}" WHERE "id" = ANY($1) AND "deleted" = false`;
    try {
      const { rows } = await db.query<{ content: string }>(sql, [idArray]);
      for (const row of rows) {
        try {
          const resource = JSON.parse(row.content) as PersistedResource;
          const key = `${resource.resourceType}/${resource.id}`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push(resource);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    } catch {
      // Table may not exist — skip
    }
  }

  return results;
}
