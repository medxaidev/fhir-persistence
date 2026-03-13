/**
 * Search SQL Builder v2 Tests — 11 tests covering ? placeholders, no projectId, deleted=0.
 */
import { describe, it, expect } from 'vitest';
import { buildSearchSQLv2, buildCountSQLv2 } from '../../search/search-sql-builder.js';
import type { SearchRequest } from '../../search/types.js';
import type { SearchParameterRegistry, SearchParameterImpl } from '../../registry/search-parameter-registry.js';

/** Minimal mock registry that returns impls for known codes. */
function mockRegistry(impls: Record<string, SearchParameterImpl>): SearchParameterRegistry {
  return {
    getImpl(_rt: string, code: string) {
      return impls[code] ?? null;
    },
  } as unknown as SearchParameterRegistry;
}

const emptyRegistry = mockRegistry({});

const genderRegistry = mockRegistry({
  gender: {
    code: 'gender',
    type: 'token',
    resourceTypes: ['Patient'],
    expression: 'Patient.gender',
    strategy: 'column',
    columnName: 'gender',
    columnType: 'TEXT',
    array: false,
  },
  birthdate: {
    code: 'birthdate',
    type: 'date',
    resourceTypes: ['Patient'],
    expression: 'Patient.birthDate',
    strategy: 'column',
    columnName: 'birthdate',
    columnType: 'TEXT',
    array: false,
  },
});

describe('Search SQL Builder v2', () => {
  // =========================================================================
  // 1. Basic SELECT with ? placeholders
  // =========================================================================
  it('generates SELECT with ? placeholder for LIMIT', () => {
    const request: SearchRequest = { resourceType: 'Patient', params: [] };
    const { sql, values } = buildSearchSQLv2(request, emptyRegistry);
    expect(sql).toContain('SELECT "id", "versionId", "content", "lastUpdated", "deleted"');
    expect(sql).toContain('FROM "Patient"');
    expect(sql).toContain('LIMIT ?');
    expect(sql).not.toContain('$');
    expect(values[values.length - 1]).toBe(20); // DEFAULT_SEARCH_COUNT
  });

  // =========================================================================
  // 2. No projectId filter
  // =========================================================================
  it('does not include projectId filter', () => {
    const request: SearchRequest = { resourceType: 'Patient', params: [] };
    const { sql } = buildSearchSQLv2(request, emptyRegistry);
    expect(sql).not.toContain('projectId');
  });

  // =========================================================================
  // 3. deleted = 0 (not false)
  // =========================================================================
  it('filters with deleted = 0 (INTEGER)', () => {
    const request: SearchRequest = { resourceType: 'Patient', params: [] };
    const { sql } = buildSearchSQLv2(request, emptyRegistry);
    expect(sql).toContain('"deleted" = 0');
    expect(sql).not.toContain('"deleted" = false');
  });

  // =========================================================================
  // 4. ORDER BY with _sort
  // =========================================================================
  it('applies ORDER BY from _sort parameter', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      sort: [{ code: 'birthdate', descending: true }],
    };
    const { sql } = buildSearchSQLv2(request, genderRegistry);
    expect(sql).toContain('"birthdate" DESC');
  });

  // =========================================================================
  // 5. Default ORDER BY lastUpdated DESC
  // =========================================================================
  it('defaults to ORDER BY lastUpdated DESC without _sort', () => {
    const request: SearchRequest = { resourceType: 'Patient', params: [] };
    const { sql } = buildSearchSQLv2(request, emptyRegistry);
    expect(sql).toContain('ORDER BY "lastUpdated" DESC');
  });

  // =========================================================================
  // 6. LIMIT and OFFSET with ?
  // =========================================================================
  it('applies LIMIT ? and OFFSET ?', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      count: 5,
      offset: 10,
    };
    const { sql, values } = buildSearchSQLv2(request, emptyRegistry);
    expect(sql).toContain('LIMIT ?');
    expect(sql).toContain('OFFSET ?');
    expect(values).toContain(5);
    expect(values).toContain(10);
  });

  // =========================================================================
  // 7. COUNT query for _total=accurate
  // =========================================================================
  it('buildCountSQLv2 generates COUNT(*) with deleted = 0', () => {
    const request: SearchRequest = { resourceType: 'Patient', params: [] };
    const { sql, values } = buildCountSQLv2(request, emptyRegistry);
    expect(sql).toContain('SELECT COUNT(*) AS "count"');
    expect(sql).toContain('"deleted" = 0');
    expect(sql).not.toContain('LIMIT');
    expect(values).toEqual([]);
  });

  // =========================================================================
  // 8. Multiple AND params
  // =========================================================================
  it('combines multiple search params with AND', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [
        { code: '_id', values: ['p1'] },
        { code: '_lastUpdated', prefix: 'ge', values: ['2024-01-01'] },
      ],
    };
    const { sql, values } = buildSearchSQLv2(request, emptyRegistry);
    expect(sql).toContain('"id" = ?');
    expect(sql).toContain('"lastUpdated" >= ?');
    expect(sql).toContain(' AND ');
    expect(values).toContain('p1');
    expect(values).toContain('2024-01-01');
  });

  // =========================================================================
  // 9. Empty params → only deleted filter
  // =========================================================================
  it('with no params, WHERE only has deleted = 0', () => {
    const request: SearchRequest = { resourceType: 'Patient', params: [] };
    const { sql } = buildSearchSQLv2(request, emptyRegistry);
    const whereClause = sql.split('WHERE')[1].split('ORDER')[0].trim();
    expect(whereClause).toBe('"deleted" = 0');
  });

  // =========================================================================
  // 10. Compartment filter with json_each
  // =========================================================================
  it('compartment filter uses json_each', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [],
      compartment: { resourceType: 'Patient', id: 'pat-123' },
    };
    const { sql, values } = buildSearchSQLv2(request, emptyRegistry);
    expect(sql).toContain('json_each("compartments")');
    expect(sql).toContain('json_each.value = ?');
    expect(values).toContain('pat-123');
  });

  // =========================================================================
  // 11. Sort by special params (_id, _lastUpdated)
  // =========================================================================
  it('sort by _lastUpdated ASC', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      sort: [{ code: '_lastUpdated', descending: false }],
    };
    const { sql } = buildSearchSQLv2(request, emptyRegistry);
    expect(sql).toContain('"lastUpdated" ASC');
  });
});
