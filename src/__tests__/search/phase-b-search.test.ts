/**
 * Phase B — Search Enhancement Tests
 *
 * Tests for:
 * 1. Chain search v2 (buildChainedFragmentV2 via buildWhereClauseV2)
 * 2. SearchPlanner (filter reorder, chain depth, two-phase recommendation)
 * 3. Two-phase SQL builder (buildTwoPhaseSearchSQLv2)
 */

import { describe, it, expect } from 'vitest';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import { buildWhereClauseV2 } from '../../search/where-builder.js';
import { buildSearchSQLv2, buildTwoPhaseSearchSQLv2 } from '../../search/search-sql-builder.js';
import { planSearch } from '../../search/search-planner.js';
import { parseSearchRequest } from '../../search/param-parser.js';
import type { ParsedSearchParam, SearchRequest } from '../../search/types.js';

// =============================================================================
// Helpers
// =============================================================================

function createRegistry(): SearchParameterRegistry {
  const reg = new SearchParameterRegistry();
  reg.indexBundle({
    resourceType: 'Bundle',
    entry: [
      // Patient SPs
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Patient-birthdate', name: 'birthdate', code: 'birthdate', base: ['Patient'], type: 'date' as const, expression: 'Patient.birthDate' } },
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Patient-active', name: 'active', code: 'active', base: ['Patient'], type: 'token' as const, expression: 'Patient.active' } },
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Patient-gender', name: 'gender', code: 'gender', base: ['Patient'], type: 'token' as const, expression: 'Patient.gender' } },
      // Use 'family' with an expression that does NOT end with a LOOKUP_TABLE_EXPRESSION_SUFFIX
      // so it gets column strategy (not lookup-table)
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Patient-language', name: 'language', code: 'language', base: ['Patient'], type: 'token' as const, expression: 'Patient.communication.language' } },
      // Observation SPs
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Observation-subject', name: 'subject', code: 'subject', base: ['Observation'], type: 'reference' as const, expression: 'Observation.subject', target: ['Patient'] } },
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Observation-status', name: 'status', code: 'status', base: ['Observation'], type: 'token' as const, expression: 'Observation.status' } },
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Observation-date', name: 'date', code: 'date', base: ['Observation'], type: 'date' as const, expression: 'Observation.effectiveDateTime' } },
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Observation-code', name: 'code', code: 'code', base: ['Observation'], type: 'token' as const, expression: 'Observation.code' } },
    ],
  });
  return reg;
}

// =============================================================================
// Chain Search V2
// =============================================================================

describe('Chain Search V2', () => {
  const registry = createRegistry();

  it('builds EXISTS subquery for subject:Patient.birthdate', () => {
    const params: ParsedSearchParam[] = [
      {
        code: 'subject',
        values: ['1990-01-15'],
        prefix: 'eq',
        chain: { targetType: 'Patient', targetParam: 'birthdate' },
      },
    ];

    const result = buildWhereClauseV2(params, registry, 'Observation');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('EXISTS');
    expect(result!.sql).toContain('Observation_References');
    expect(result!.sql).toContain('JOIN "Patient"');
    expect(result!.sql).toContain('__ref."code" = ?');
    expect(result!.sql).toContain('__ref."targetType" = ?');
    expect(result!.sql).toContain('__target."deleted" = 0');
    // Values: code, targetType, then search value
    expect(result!.values[0]).toBe('subject');
    expect(result!.values[1]).toBe('Patient');
    expect(result!.values[2]).toBe('1990-01-15');
  });

  it('builds EXISTS subquery for subject:Patient.active (token)', () => {
    const params: ParsedSearchParam[] = [
      {
        code: 'subject',
        values: ['true'],
        chain: { targetType: 'Patient', targetParam: 'active' },
      },
    ];

    const result = buildWhereClauseV2(params, registry, 'Observation');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('EXISTS');
    expect(result!.sql).toContain('json_each');
    expect(result!.values[0]).toBe('subject');
    expect(result!.values[1]).toBe('Patient');
  });

  it('combines chain search with regular params', () => {
    const params: ParsedSearchParam[] = [
      { code: 'status', values: ['final'] },
      {
        code: 'subject',
        values: ['1990-01-15'],
        chain: { targetType: 'Patient', targetParam: 'birthdate' },
      },
    ];

    const result = buildWhereClauseV2(params, registry, 'Observation');
    expect(result).not.toBeNull();
    // Should have both: token match for status AND EXISTS for chain
    expect(result!.sql).toContain('json_each');
    expect(result!.sql).toContain('EXISTS');
    expect(result!.sql).toContain(' AND ');
  });

  it('returns null for chain with unknown target param', () => {
    const params: ParsedSearchParam[] = [
      {
        code: 'subject',
        values: ['test'],
        chain: { targetType: 'Patient', targetParam: 'nonexistent' },
      },
    ];

    const result = buildWhereClauseV2(params, registry, 'Observation');
    expect(result).toBeNull();
  });

  it('chain search works in full buildSearchSQLv2', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [
        {
          code: 'subject',
          values: ['1990-01-15'],
          chain: { targetType: 'Patient', targetParam: 'birthdate' },
        },
      ],
    };

    const sql = buildSearchSQLv2(request, registry);
    expect(sql.sql).toContain('SELECT');
    expect(sql.sql).toContain('EXISTS');
    expect(sql.sql).toContain('Observation_References');
    expect(sql.sql).toContain('LIMIT ?');
  });
});

// =============================================================================
// Search Planner
// =============================================================================

describe('SearchPlanner', () => {
  const registry = createRegistry();

  it('reorders filters by selectivity (_id first)', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [
        { code: 'date', values: ['2024-01-01'] },
        { code: '_id', values: ['obs-1'] },
        { code: 'status', values: ['final'] },
      ],
    };

    const plan = planSearch(request, registry);
    expect(plan.request.params[0].code).toBe('_id');
    // Token (status) should come before date
    expect(plan.request.params[1].code).toBe('status');
    expect(plan.request.params[2].code).toBe('date');
  });

  it('reorders: token before date before string', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [
        { code: 'birthdate', values: ['1990-01-15'] },
        { code: 'active', values: ['true'] },
      ],
    };

    const plan = planSearch(request, registry);
    // token (active) → priority 10, date (birthdate) → priority 20
    expect(plan.request.params[0].code).toBe('active');
    expect(plan.request.params[1].code).toBe('birthdate');
  });

  it('chain params are placed last', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [
        {
          code: 'subject',
          values: ['1990-01-15'],
          chain: { targetType: 'Patient', targetParam: 'birthdate' },
        },
        { code: 'status', values: ['final'] },
      ],
    };

    const plan = planSearch(request, registry);
    expect(plan.request.params[0].code).toBe('status');
    expect(plan.request.params[1].code).toBe('subject');
    expect(plan.hasChainedSearch).toBe(true);
  });

  it('detects high selectivity for _id search', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: '_id', values: ['pat-1'] }],
    };

    const plan = planSearch(request, registry);
    expect(plan.estimatedSelectivity).toBe('high');
  });

  it('detects low selectivity for no params', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
    };

    const plan = planSearch(request, registry);
    expect(plan.estimatedSelectivity).toBe('low');
  });

  it('recommends two-phase for chain searches', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [
        {
          code: 'subject',
          values: ['1990-01-15'],
          chain: { targetType: 'Patient', targetParam: 'birthdate' },
        },
      ],
    };

    const plan = planSearch(request, registry);
    expect(plan.useTwoPhase).toBe(true);
  });

  it('recommends two-phase for large estimated row counts', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'active', values: ['true'] }],
    };

    const plan = planSearch(request, registry, { estimatedRowCount: 50_000 });
    expect(plan.useTwoPhase).toBe(true);
  });

  it('does not recommend two-phase for small tables', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'active', values: ['true'] }],
    };

    const plan = planSearch(request, registry, { estimatedRowCount: 100 });
    expect(plan.useTwoPhase).toBe(false);
  });

  it('validates chain depth (default max=1 allows single-level)', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [
        {
          code: 'subject',
          values: ['Smith'],
          chain: { targetType: 'Patient', targetParam: 'birthdate' },
        },
      ],
    };

    const plan = planSearch(request, registry);
    expect(plan.warnings.length).toBe(0);
    expect(plan.request.params.length).toBe(1);
  });

  it('rejects chains when maxChainDepth=0', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [
        {
          code: 'subject',
          values: ['Smith'],
          chain: { targetType: 'Patient', targetParam: 'birthdate' },
        },
      ],
    };

    const plan = planSearch(request, registry, { maxChainDepth: 0 });
    expect(plan.warnings.length).toBe(1);
    expect(plan.warnings[0]).toContain('rejected');
    expect(plan.request.params.length).toBe(0);
  });

  it('preserves sort, count, offset from original request', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'birthdate', values: ['1990-01-15'] }],
      sort: [{ code: 'birthdate', descending: true }],
      count: 50,
      offset: 10,
    };

    const plan = planSearch(request, registry);
    expect(plan.request.sort).toEqual(request.sort);
    expect(plan.request.count).toBe(50);
    expect(plan.request.offset).toBe(10);
  });
});

// =============================================================================
// Two-Phase SQL Builder
// =============================================================================

describe('Two-Phase SQL Builder', () => {
  const registry = createRegistry();

  it('phase1 selects only id column', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'birthdate', values: ['1990-01-15'] }],
    };

    const result = buildTwoPhaseSearchSQLv2(request, registry);
    expect(result.phase1.sql).toContain('SELECT "id"');
    expect(result.phase1.sql).not.toContain('"content"');
    expect(result.phase1.sql).toContain('FROM "Patient"');
    expect(result.phase1.sql).toContain('"deleted" = 0');
    expect(result.phase1.sql).toContain('LIMIT ?');
  });

  it('phase1 includes WHERE conditions', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'birthdate', values: ['1990-01-15'] }],
    };

    const result = buildTwoPhaseSearchSQLv2(request, registry);
    expect(result.phase1.sql).toContain('"birthdate"');
    expect(result.phase1.values).toContain('1990-01-15');
  });

  it('phase1 includes ORDER BY', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'birthdate', values: ['1990-01-15'] }],
      sort: [{ code: 'birthdate', descending: true }],
    };

    const result = buildTwoPhaseSearchSQLv2(request, registry);
    expect(result.phase1.sql).toContain('ORDER BY "birthdate" DESC');
  });

  it('phase1 includes OFFSET when specified', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      count: 10,
      offset: 20,
    };

    const result = buildTwoPhaseSearchSQLv2(request, registry);
    expect(result.phase1.sql).toContain('OFFSET ?');
    expect(result.phase1.values).toContain(10);
    expect(result.phase1.values).toContain(20);
  });

  it('phase2 template includes content columns and IN placeholder', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
    };

    const result = buildTwoPhaseSearchSQLv2(request, registry);
    expect(result.phase2Template).toContain('"content"');
    expect(result.phase2Template).toContain('"versionId"');
    expect(result.phase2Template).toContain('%PLACEHOLDERS%');
    expect(result.phase2Template).toContain('FROM "Patient"');
  });

  it('phase1 works with chain search params', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [
        {
          code: 'subject',
          values: ['1990-01-15'],
          chain: { targetType: 'Patient', targetParam: 'birthdate' },
        },
      ],
    };

    const result = buildTwoPhaseSearchSQLv2(request, registry);
    expect(result.phase1.sql).toContain('SELECT "id"');
    expect(result.phase1.sql).toContain('EXISTS');
    expect(result.phase1.sql).toContain('Observation_References');
  });

  it('phase1 default count is 20', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
    };

    const result = buildTwoPhaseSearchSQLv2(request, registry);
    expect(result.phase1.values).toContain(20);
  });
});
