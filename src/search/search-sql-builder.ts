/**
 * Search SQL Builder
 *
 * Composes a full SELECT statement from a parsed SearchRequest,
 * combining WHERE clauses, ORDER BY, and LIMIT/OFFSET.
 *
 * ## Generated SQL Shape
 *
 * ```sql
 * SELECT "id", "content", "lastUpdated", "deleted"
 * FROM "Patient"
 * WHERE "deleted" = false
 *   AND "gender" = $1
 *   AND "birthdate" >= $2
 * ORDER BY "lastUpdated" DESC
 * LIMIT $3
 * OFFSET $4
 * ```
 *
 * @module fhir-persistence/search
 */

import type { SearchParameterRegistry } from '../registry/search-parameter-registry.js';
import type { SearchRequest, SearchSQL, CountSQL, SortRule } from './types.js';
import { DEFAULT_SEARCH_COUNT } from './types.js';
import { buildWhereClause } from './where-builder.js';

// =============================================================================
// Section 1: Select Columns
// =============================================================================

/**
 * Default columns returned by search queries.
 */
const SEARCH_COLUMNS = ['"id"', '"content"', '"lastUpdated"', '"deleted"'].join(', ');

// =============================================================================
// Section 2: Main Builder
// =============================================================================

/**
 * Build a complete search SQL query from a parsed SearchRequest.
 *
 * @param request - The parsed search request.
 * @param registry - The SearchParameterRegistry for resolving parameter implementations.
 * @returns A SearchSQL with the full query and parameter values.
 */
export function buildSearchSQL(
  request: SearchRequest,
  registry: SearchParameterRegistry,
): SearchSQL {
  const tableName = quoteTable(request.resourceType);
  const parts: string[] = [];
  const allValues: unknown[] = [];
  let paramIndex = 1;

  // SELECT
  parts.push(`SELECT ${SEARCH_COLUMNS}`);
  parts.push(`FROM ${tableName}`);

  // WHERE
  const whereConditions: string[] = [];

  // Always filter out deleted resources
  whereConditions.push('"deleted" = false');

  // Add project filter for multi-tenant scoping
  if (request.project) {
    whereConditions.push(`"projectId" = $${paramIndex}`);
    allValues.push(request.project);
    paramIndex++;
  }

  // Add compartment filter if present
  if (request.compartment) {
    whereConditions.push(`"compartments" @> ARRAY[$${paramIndex}]::uuid[]`);
    allValues.push(request.compartment.id);
    paramIndex++;
  }

  // Add search parameter conditions
  if (request.params.length > 0) {
    const whereFragment = buildWhereClause(request.params, registry, request.resourceType);
    if (whereFragment) {
      // Reindex parameters to account for the offset
      const reindexedSql = reindexParams(whereFragment.sql, whereFragment.values.length, paramIndex);
      whereConditions.push(reindexedSql);
      allValues.push(...whereFragment.values);
      paramIndex += whereFragment.values.length;
    }
  }

  parts.push(`WHERE ${whereConditions.join(' AND ')}`);

  // ORDER BY
  const orderBy = buildOrderBy(request.sort, registry, request.resourceType);
  parts.push(`ORDER BY ${orderBy}`);

  // LIMIT
  const count = request.count ?? DEFAULT_SEARCH_COUNT;
  parts.push(`LIMIT $${paramIndex}`);
  allValues.push(count);
  paramIndex++;

  // OFFSET
  if (request.offset !== undefined && request.offset > 0) {
    parts.push(`OFFSET $${paramIndex}`);
    allValues.push(request.offset);
    paramIndex++;
  }

  return {
    sql: parts.join('\n'),
    values: allValues,
  };
}

// =============================================================================
// Section 3: Count Builder
// =============================================================================

/**
 * Build a COUNT query for a search request (for _total=accurate).
 *
 * @param request - The parsed search request.
 * @param registry - The SearchParameterRegistry.
 * @returns A CountSQL with the count query and parameter values.
 */
export function buildCountSQL(
  request: SearchRequest,
  registry: SearchParameterRegistry,
): CountSQL {
  const tableName = quoteTable(request.resourceType);
  const parts: string[] = [];
  const allValues: unknown[] = [];
  let paramIndex = 1;

  parts.push(`SELECT COUNT(*) AS "count"`);
  parts.push(`FROM ${tableName}`);

  const whereConditions: string[] = [];
  whereConditions.push('"deleted" = false');

  // Add project filter for multi-tenant scoping
  if (request.project) {
    whereConditions.push(`"projectId" = $${paramIndex}`);
    allValues.push(request.project);
    paramIndex++;
  }

  // Add compartment filter if present
  if (request.compartment) {
    whereConditions.push(`"compartments" @> ARRAY[$${paramIndex}]::uuid[]`);
    allValues.push(request.compartment.id);
    paramIndex++;
  }

  if (request.params.length > 0) {
    const whereFragment = buildWhereClause(request.params, registry, request.resourceType);
    if (whereFragment) {
      const reindexedSql = reindexParams(whereFragment.sql, whereFragment.values.length, paramIndex);
      whereConditions.push(reindexedSql);
      allValues.push(...whereFragment.values);
      paramIndex += whereFragment.values.length;
    }
  }

  parts.push(`WHERE ${whereConditions.join(' AND ')}`);

  return {
    sql: parts.join('\n'),
    values: allValues,
  };
}

// =============================================================================
// Section 4: ORDER BY Builder
// =============================================================================

/**
 * Build an ORDER BY clause from sort rules.
 *
 * Default: `ORDER BY "lastUpdated" DESC`.
 */
function buildOrderBy(
  sort: SortRule[] | undefined,
  registry: SearchParameterRegistry,
  resourceType: string,
): string {
  if (!sort || sort.length === 0) {
    return '"lastUpdated" DESC';
  }

  const clauses: string[] = [];

  for (const rule of sort) {
    const columnName = resolveOrderByColumn(rule.code, registry, resourceType);
    if (columnName) {
      const direction = rule.descending ? 'DESC' : 'ASC';
      clauses.push(`"${columnName}" ${direction}`);
    }
  }

  if (clauses.length === 0) {
    return '"lastUpdated" DESC';
  }

  return clauses.join(', ');
}

/**
 * Resolve a sort parameter code to a column name.
 */
function resolveOrderByColumn(
  code: string,
  registry: SearchParameterRegistry,
  resourceType: string,
): string | null {
  // Special parameters
  switch (code) {
    case '_id':
      return 'id';
    case '_lastUpdated':
      return 'lastUpdated';
  }

  // Look up in registry
  const impl = registry.getImpl(resourceType, code);
  if (!impl) {
    return null;
  }

  // Column strategy: use the column name directly
  if (impl.strategy === 'column') {
    return impl.columnName;
  }

  // Token-column and lookup-table strategies: use the __XSort column
  if (impl.strategy === 'token-column' || impl.strategy === 'lookup-table') {
    return `__${impl.columnName}Sort`;
  }

  return null;
}

// =============================================================================
// Section 5: Helpers
// =============================================================================

/**
 * Double-quote a table name for safe SQL usage.
 */
function quoteTable(name: string): string {
  return `"${name}"`;
}

/**
 * Re-index parameter placeholders from $1-based to $startIndex-based.
 *
 * The WHERE builder always starts at $1. When composing into a larger
 * query, we need to shift the indices.
 */
function reindexParams(sql: string, paramCount: number, startIndex: number): string {
  if (startIndex === 1) {
    return sql; // No reindexing needed
  }

  // Replace $N with $(N + offset), working from highest to lowest to avoid double-replacement
  let result = sql;
  const offset = startIndex - 1;

  for (let i = paramCount; i >= 1; i--) {
    result = result.replace(new RegExp(`\\$${i}(?!\\d)`, 'g'), `$${i + offset}`);
  }

  return result;
}
