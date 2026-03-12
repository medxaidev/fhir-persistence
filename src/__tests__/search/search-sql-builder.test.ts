/**
 * Search SQL Builder — Unit Tests
 */

import { describe, it, expect } from 'vitest';
import type { SearchParameterImpl } from '../../registry/search-parameter-registry.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import type { SearchRequest } from '../../search/types.js';
import { buildSearchSQL, buildCountSQL } from '../../search/search-sql-builder.js';

// =============================================================================
// Helper: build a registry with test impls
// =============================================================================

function makeImpl(overrides: Partial<SearchParameterImpl> & { code: string; type: SearchParameterImpl['type'] }): SearchParameterImpl {
  return {
    resourceTypes: ['Patient'],
    expression: '',
    strategy: 'column',
    columnName: overrides.code,
    columnType: 'TEXT',
    array: false,
    ...overrides,
  };
}

function createTestRegistry(): SearchParameterRegistry {
  const registry = new SearchParameterRegistry();
  registry.indexImpl('Patient', makeImpl({ code: 'gender', type: 'token', columnName: 'gender', strategy: 'token-column' }));
  registry.indexImpl('Patient', makeImpl({ code: 'active', type: 'token', columnName: 'active', strategy: 'token-column' }));
  registry.indexImpl('Patient', makeImpl({ code: 'birthdate', type: 'date', columnName: 'birthdate', columnType: 'TIMESTAMPTZ' }));
  registry.indexImpl('Patient', makeImpl({ code: 'family', type: 'string', columnName: 'family' }));
  registry.indexImpl('Observation', makeImpl({ code: 'status', type: 'token', columnName: 'status', strategy: 'token-column', resourceTypes: ['Observation'] }));
  return registry;
}

// =============================================================================
// buildSearchSQL
// =============================================================================

describe('buildSearchSQL', () => {
  const registry = createTestRegistry();

  it('generates basic SELECT with no search params', () => {
    const request: SearchRequest = { resourceType: 'Patient', params: [] };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('SELECT "id", "content", "lastUpdated", "deleted"');
    expect(result.sql).toContain('FROM "Patient"');
    expect(result.sql).toContain('"deleted" = false');
    expect(result.sql).toContain('ORDER BY "lastUpdated" DESC');
    expect(result.sql).toContain('LIMIT $1');
    expect(result.values).toEqual([20]); // DEFAULT_SEARCH_COUNT
  });

  it('includes WHERE clause for search params', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'gender', values: ['male'] }],
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('"deleted" = false');
    expect(result.sql).toContain('"__genderText" && ARRAY[$1]::text[]');
    expect(result.sql).toContain('LIMIT $2');
    expect(result.values).toEqual(['male', 20]);
  });

  it('handles multiple AND params', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [
        { code: 'gender', values: ['male'] },
        { code: 'active', values: ['true'] },
      ],
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('"__genderText" && ARRAY[$1]::text[]');
    expect(result.sql).toContain('"__activeText" && ARRAY[$2]::text[]');
    expect(result.sql).toContain('LIMIT $3');
    expect(result.values).toEqual(['male', 'true', 20]);
  });

  it('respects custom _count', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      count: 50,
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('LIMIT $1');
    expect(result.values).toEqual([50]);
  });

  it('includes OFFSET when specified', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      count: 20,
      offset: 40,
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('OFFSET $2');
    expect(result.values).toEqual([20, 40]);
  });

  it('does not include OFFSET when 0', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      offset: 0,
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).not.toContain('OFFSET');
  });

  it('handles _sort ascending', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      sort: [{ code: 'birthdate', descending: false }],
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('ORDER BY "birthdate" ASC');
  });

  it('handles _sort descending', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      sort: [{ code: 'birthdate', descending: true }],
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('ORDER BY "birthdate" DESC');
  });

  it('handles _sort with multiple rules', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      sort: [
        { code: 'family', descending: false },
        { code: 'birthdate', descending: true },
      ],
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('ORDER BY "family" ASC, "birthdate" DESC');
  });

  it('falls back to lastUpdated DESC for unknown sort param', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      sort: [{ code: 'nonexistent', descending: false }],
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('ORDER BY "lastUpdated" DESC');
  });

  it('handles _sort by _lastUpdated', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      sort: [{ code: '_lastUpdated', descending: false }],
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('ORDER BY "lastUpdated" ASC');
  });

  it('handles _sort by _id', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      sort: [{ code: '_id', descending: false }],
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('ORDER BY "id" ASC');
  });

  it('generates correct SQL for complex query', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [
        { code: 'gender', values: ['male'] },
        { code: 'birthdate', prefix: 'ge', values: ['1990-01-01'] },
      ],
      count: 10,
      offset: 20,
      sort: [{ code: 'birthdate', descending: true }],
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('SELECT "id", "content", "lastUpdated", "deleted"');
    expect(result.sql).toContain('FROM "Patient"');
    expect(result.sql).toContain('"deleted" = false');
    expect(result.sql).toContain('"__genderText" && ARRAY[$1]::text[]');
    expect(result.sql).toContain('"birthdate" >= $2');
    expect(result.sql).toContain('ORDER BY "birthdate" DESC');
    expect(result.sql).toContain('LIMIT $3');
    expect(result.sql).toContain('OFFSET $4');
    expect(result.values).toEqual(['male', '1990-01-01', 10, 20]);
  });

  it('uses correct table name for different resource types', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [{ code: 'status', values: ['final'] }],
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('FROM "Observation"');
  });

  it('handles _id special parameter in search', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: '_id', values: ['abc-123'] }],
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('"id" = $1');
    expect(result.values[0]).toBe('abc-123');
  });

  it('handles _lastUpdated special parameter with prefix', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: '_lastUpdated', prefix: 'ge', values: ['2026-01-01'] }],
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('"lastUpdated" >= $1');
  });

  it('skips unknown params gracefully', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'nonexistent', values: ['val'] }],
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('"deleted" = false');
    expect(result.sql).not.toContain('nonexistent');
  });

  it('handles string search param with default prefix match', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'family', values: ['Smith'] }],
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('LOWER("family") LIKE $1');
    expect(result.values[0]).toBe('smith%');
  });
});

// =============================================================================
// buildCountSQL
// =============================================================================

describe('buildCountSQL', () => {
  const registry = createTestRegistry();

  it('generates COUNT query with no params', () => {
    const request: SearchRequest = { resourceType: 'Patient', params: [] };
    const result = buildCountSQL(request, registry);

    expect(result.sql).toContain('SELECT COUNT(*) AS "count"');
    expect(result.sql).toContain('FROM "Patient"');
    expect(result.sql).toContain('"deleted" = false');
    expect(result.sql).not.toContain('LIMIT');
    expect(result.sql).not.toContain('ORDER BY');
    expect(result.values).toEqual([]);
  });

  it('includes WHERE clause for search params', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'gender', values: ['male'] }],
    };
    const result = buildCountSQL(request, registry);

    expect(result.sql).toContain('"__genderText" && ARRAY[$1]::text[]');
    expect(result.values).toEqual(['male']);
  });

  it('does not include LIMIT or ORDER BY', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'active', values: ['true'] }],
      count: 10,
      sort: [{ code: 'birthdate', descending: true }],
    };
    const result = buildCountSQL(request, registry);

    expect(result.sql).not.toContain('LIMIT');
    expect(result.sql).not.toContain('ORDER BY');
  });
});

// =============================================================================
// Phase 18: Compartment Search SQL
// =============================================================================

describe('Phase 18 — compartment search SQL', () => {
  const registry = createTestRegistry();

  it('buildSearchSQL adds compartment filter to WHERE clause', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [],
      compartment: { resourceType: 'Patient', id: '550e8400-e29b-41d4-a716-446655440000' },
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('"compartments" @> ARRAY[$1]::uuid[]');
    expect(result.values[0]).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('compartment filter combined with search params', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [{ code: 'status', values: ['final'] }],
      compartment: { resourceType: 'Patient', id: '550e8400-e29b-41d4-a716-446655440000' },
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).toContain('"compartments" @> ARRAY[$1]::uuid[]');
    expect(result.sql).toContain('"__statusText" && ARRAY[$2]::text[]');
    expect(result.values[0]).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.values[1]).toBe('final');
  });

  it('buildCountSQL adds compartment filter', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [],
      compartment: { resourceType: 'Patient', id: 'abc-123' },
    };
    const result = buildCountSQL(request, registry);

    expect(result.sql).toContain('"compartments" @> ARRAY[$1]::uuid[]');
    expect(result.values[0]).toBe('abc-123');
  });

  it('no compartment filter when compartment is undefined', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [],
    };
    const result = buildSearchSQL(request, registry);

    expect(result.sql).not.toContain('compartments');
  });
});
