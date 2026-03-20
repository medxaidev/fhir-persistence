/**
 * Second-Pass Architecture Compliance Tests
 *
 * Systematic verification of key ADR requirements against actual code.
 * Covers critical compliance points identified during the second-pass review.
 */

import { describe, it, expect } from 'vitest';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import { buildWhereClauseV2, buildWhereFragmentV2 } from '../../search/where-builder.js';
import { buildSearchSQLv2, buildCountSQLv2, buildTwoPhaseSearchSQLv2 } from '../../search/search-sql-builder.js';
import { planSearch } from '../../search/search-planner.js';
import { parseSearchRequest, parseParamKey } from '../../search/param-parser.js';
import { buildSearchBundle } from '../../search/search-bundle.js';
import type { ParsedSearchParam, SearchRequest } from '../../search/types.js';

// =============================================================================
// Shared test registry
// =============================================================================

function createFullRegistry(): SearchParameterRegistry {
  const reg = new SearchParameterRegistry();
  reg.indexBundle({
    resourceType: 'Bundle',
    entry: [
      // Patient SPs
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Patient-birthdate', name: 'birthdate', code: 'birthdate', base: ['Patient'], type: 'date' as const, expression: 'Patient.birthDate' } },
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Patient-active', name: 'active', code: 'active', base: ['Patient'], type: 'token' as const, expression: 'Patient.active' } },
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Patient-gender', name: 'gender', code: 'gender', base: ['Patient'], type: 'token' as const, expression: 'Patient.gender' } },
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
// ADR-02: SQLite ? placeholders (no $N)
// =============================================================================

describe('ADR-02: SQLite ? placeholders', () => {
  const registry = createFullRegistry();

  it('buildSearchSQLv2 uses ? placeholders, never $N', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'birthdate', values: ['1990-01-15'], prefix: 'ge' }],
    };
    const sql = buildSearchSQLv2(request, registry);
    expect(sql.sql).not.toMatch(/\$\d+/); // No $N placeholders
    expect(sql.sql).toContain('?');
  });

  it('buildCountSQLv2 uses ? placeholders', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'active', values: ['true'] }],
    };
    const sql = buildCountSQLv2(request, registry);
    expect(sql.sql).not.toMatch(/\$\d+/);
    expect(sql.sql).toContain('COUNT(*)');
  });

  it('buildWhereClauseV2 uses ? placeholders for token params', () => {
    const params: ParsedSearchParam[] = [
      { code: 'gender', values: ['http://hl7.org/fhir/gender|male'] },
    ];
    const result = buildWhereClauseV2(params, registry, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).not.toMatch(/\$\d+/);
    expect(result!.sql).toContain('?');
  });

  it('v2 soft delete uses INTEGER 0, not BOOLEAN false', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
    };
    const sql = buildSearchSQLv2(request, registry);
    expect(sql.sql).toContain('"deleted" = 0');
    expect(sql.sql).not.toContain('"deleted" = false');
  });
});

// =============================================================================
// ADR-07: No projectId in v2
// =============================================================================

describe('ADR-07: No projectId in v2 SQL', () => {
  const registry = createFullRegistry();

  it('buildSearchSQLv2 has no projectId filter', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'birthdate', values: ['1990-01-15'] }],
    };
    const sql = buildSearchSQLv2(request, registry);
    expect(sql.sql).not.toContain('projectId');
  });

  it('buildCountSQLv2 has no projectId filter', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
    };
    const sql = buildCountSQLv2(request, registry);
    expect(sql.sql).not.toContain('projectId');
  });

  it('buildTwoPhaseSearchSQLv2 phase1 has no projectId', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
    };
    const result = buildTwoPhaseSearchSQLv2(request, registry);
    expect(result.phase1.sql).not.toContain('projectId');
  });
});

// =============================================================================
// ADR-09: Search Execution Engine
// =============================================================================

describe('ADR-09: Search Execution Engine', () => {
  const registry = createFullRegistry();

  it('default search count is 20', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
    };
    const sql = buildSearchSQLv2(request, registry);
    // Default count=20 should be in values
    expect(sql.values).toContain(20);
  });

  it('default sort is lastUpdated DESC', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
    };
    const sql = buildSearchSQLv2(request, registry);
    expect(sql.sql).toContain('"lastUpdated" DESC');
  });

  it('custom sort overrides default', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      sort: [{ code: 'birthdate', descending: false }],
    };
    const sql = buildSearchSQLv2(request, registry);
    expect(sql.sql).toContain('"birthdate" ASC');
  });

  it('_id resolves to uri strategy on "id" column', () => {
    const params: ParsedSearchParam[] = [
      { code: '_id', values: ['patient-1'] },
    ];
    const result = buildWhereClauseV2(params, registry, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('"id"');
  });

  it('_lastUpdated resolves to date strategy on "lastUpdated" column', () => {
    const params: ParsedSearchParam[] = [
      { code: '_lastUpdated', values: ['2024-01-01'], prefix: 'ge' },
    ];
    const result = buildWhereClauseV2(params, registry, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('"lastUpdated"');
  });

  it('token search uses json_each for SQLite (not array overlap)', () => {
    const params: ParsedSearchParam[] = [
      { code: 'status', values: ['final'] },
    ];
    const result = buildWhereClauseV2(params, registry, 'Observation');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('json_each');
    // Should NOT contain PostgreSQL array operators
    expect(result!.sql).not.toContain('&&');
    expect(result!.sql).not.toContain('ARRAY[');
  });

  it('OR semantics: multi-value bare code param generates OR of LIKE patterns', () => {
    const params: ParsedSearchParam[] = [
      { code: 'status', values: ['final', 'preliminary'] },
    ];
    const result = buildWhereClauseV2(params, registry, 'Observation');
    expect(result).not.toBeNull();
    // Multi-value bare codes produce OR of LIKE patterns (any system match)
    expect(result!.sql).toContain('LIKE ?');
    expect(result!.sql).toContain('OR');
    expect(result!.values).toContain('%|final');
    expect(result!.values).toContain('%|preliminary');
  });
});

// =============================================================================
// ADR-09: Two-Phase SQL (id-first strategy)
// =============================================================================

describe('ADR-09: Two-Phase SQL', () => {
  const registry = createFullRegistry();

  it('phase1 selects only id (no content), phase2 includes content', () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'birthdate', values: ['1990-01-15'] }],
    };
    const result = buildTwoPhaseSearchSQLv2(request, registry);

    // Phase 1: id only
    expect(result.phase1.sql).toContain('SELECT "id"');
    expect(result.phase1.sql).not.toContain('"content"');

    // Phase 2: content included
    expect(result.phase2Template).toContain('"content"');
    expect(result.phase2Template).toContain('"versionId"');
    expect(result.phase2Template).toContain('%PLACEHOLDERS%');
  });

  it('SearchPlanner recommends two-phase for chain search', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [{
        code: 'subject',
        values: ['1990-01-15'],
        chain: { targetType: 'Patient', targetParam: 'birthdate' },
      }],
    };
    const plan = planSearch(request, registry);
    expect(plan.useTwoPhase).toBe(true);
    expect(plan.hasChainedSearch).toBe(true);
  });
});

// =============================================================================
// ADR-11: Chain Search with targetType filter
// =============================================================================

describe('ADR-11: Chain Search References table compliance', () => {
  const registry = createFullRegistry();

  it('chain search includes targetType filter (not just targetId)', () => {
    const params: ParsedSearchParam[] = [{
      code: 'subject',
      values: ['1990-01-15'],
      chain: { targetType: 'Patient', targetParam: 'birthdate' },
    }];

    const result = buildWhereClauseV2(params, registry, 'Observation');
    expect(result).not.toBeNull();
    // Must filter by targetType for precision (ADR-11 compliance)
    expect(result!.sql).toContain('__ref."targetType" = ?');
    expect(result!.values).toContain('Patient');
  });

  it('chain search JOIN uses targetId directly (no SPLIT_PART)', () => {
    const params: ParsedSearchParam[] = [{
      code: 'subject',
      values: ['1990-01-15'],
      chain: { targetType: 'Patient', targetParam: 'birthdate' },
    }];

    const result = buildWhereClauseV2(params, registry, 'Observation');
    expect(result).not.toBeNull();
    // JOIN uses targetId directly
    expect(result!.sql).toContain('__ref."targetId" = __target."id"');
    // Must NOT use SPLIT_PART or SUBSTR for reference parsing
    expect(result!.sql).not.toContain('SPLIT_PART');
    expect(result!.sql).not.toContain('SUBSTR');
  });

  it('chain search uses References table (not column)', () => {
    const params: ParsedSearchParam[] = [{
      code: 'subject',
      values: ['ge1990-01-15'],
      prefix: 'ge',
      chain: { targetType: 'Patient', targetParam: 'birthdate' },
    }];

    const result = buildWhereClauseV2(params, registry, 'Observation');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('Observation_References');
    expect(result!.sql).toContain('__ref."code" = ?');
  });
});

// =============================================================================
// ADR-09: SearchParamParser chained search parsing
// =============================================================================

describe('ADR-09: SearchParamParser', () => {
  it('parseParamKey correctly parses chained search syntax', () => {
    const result = parseParamKey('subject:Patient.name');
    expect(result.code).toBe('subject');
    expect(result.chain).toBeDefined();
    expect(result.chain!.targetType).toBe('Patient');
    expect(result.chain!.targetParam).toBe('name');
    expect(result.modifier).toBeUndefined();
  });

  it('parseParamKey distinguishes modifier from chain', () => {
    const exact = parseParamKey('name:exact');
    expect(exact.code).toBe('name');
    expect(exact.modifier).toBe('exact');
    expect(exact.chain).toBeUndefined();
  });

  it('parseParamKey handles simple param (no modifier/chain)', () => {
    const simple = parseParamKey('birthdate');
    expect(simple.code).toBe('birthdate');
    expect(simple.modifier).toBeUndefined();
    expect(simple.chain).toBeUndefined();
  });
});

// =============================================================================
// ADR-09: SearchPlanner filter reordering
// =============================================================================

describe('ADR-09: SearchPlanner filter reordering', () => {
  const registry = createFullRegistry();

  it('_id always first (highest selectivity)', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [
        { code: 'status', values: ['final'] },
        { code: 'date', values: ['2024-01-01'] },
        { code: '_id', values: ['obs-1'] },
      ],
    };
    const plan = planSearch(request, registry);
    expect(plan.request.params[0].code).toBe('_id');
  });

  it('token before date (higher selectivity)', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [
        { code: 'date', values: ['2024-01-01'] },
        { code: 'status', values: ['final'] },
      ],
    };
    const plan = planSearch(request, registry);
    expect(plan.request.params[0].code).toBe('status');
    expect(plan.request.params[1].code).toBe('date');
  });

  it('chain search always last (most expensive)', () => {
    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [
        { code: 'subject', values: ['Smith'], chain: { targetType: 'Patient', targetParam: 'birthdate' } },
        { code: 'status', values: ['final'] },
        { code: 'date', values: ['2024-01-01'] },
      ],
    };
    const plan = planSearch(request, registry);
    const lastParam = plan.request.params[plan.request.params.length - 1];
    expect(lastParam.chain).toBeDefined();
  });
});

// =============================================================================
// ADR-09: SearchBundleBuilder
// =============================================================================

describe('ADR-09: SearchBundleBuilder', () => {
  it('builds a searchset Bundle with correct structure', () => {
    const bundle = buildSearchBundle([
      { resourceType: 'Patient', id: 'p1' } as any,
      { resourceType: 'Patient', id: 'p2' } as any,
    ], { total: 2, selfUrl: 'http://localhost/Patient', baseUrl: 'http://localhost/fhir' });

    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('searchset');
    expect(bundle.total).toBe(2);
    expect(bundle.link).toBeDefined();
    expect(bundle.link![0].relation).toBe('self');
    expect(bundle.entry).toHaveLength(2);
    expect(bundle.entry![0].search?.mode).toBe('match');
  });

  it('omits total when not provided (ADR-09: _total=none default)', () => {
    const bundle = buildSearchBundle([
      { resourceType: 'Patient', id: 'p1' } as any,
    ]);
    expect(bundle.total).toBeUndefined();
  });
});

// =============================================================================
// ADR-02: Token TEXT[] not UUID[] hash
// =============================================================================

describe('ADR-02: Token TEXT[] strategy (no UUID hash)', () => {
  const registry = createFullRegistry();

  it('token search with system|code uses json_each exact match', () => {
    const params: ParsedSearchParam[] = [
      { code: 'code', values: ['http://loinc.org|8480-6'] },
    ];
    const result = buildWhereClauseV2(params, registry, 'Observation');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('json_each');
    // Value should be the original system|code, not a hash
    expect(result!.values).toContain('http://loinc.org|8480-6');
  });

  it('token search without system uses code-only matching', () => {
    const params: ParsedSearchParam[] = [
      { code: 'code', values: ['8480-6'] },
    ];
    const result = buildWhereClauseV2(params, registry, 'Observation');
    expect(result).not.toBeNull();
    // Should match code portion after |
    expect(result!.sql).toContain('json_each');
  });
});

// =============================================================================
// ADR-09: Date search prefix semantics
// =============================================================================

describe('ADR-09: Date search prefixes', () => {
  const registry = createFullRegistry();

  it('ge prefix generates >= operator', () => {
    const params: ParsedSearchParam[] = [
      { code: 'birthdate', values: ['1990-01-15'], prefix: 'ge' },
    ];
    const result = buildWhereClauseV2(params, registry, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('>=');
  });

  it('lt prefix generates < operator', () => {
    const params: ParsedSearchParam[] = [
      { code: 'birthdate', values: ['2000-01-01'], prefix: 'lt' },
    ];
    const result = buildWhereClauseV2(params, registry, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('<');
  });

  it('eq prefix (default) generates = operator', () => {
    const params: ParsedSearchParam[] = [
      { code: 'birthdate', values: ['1990-01-15'], prefix: 'eq' },
    ];
    const result = buildWhereClauseV2(params, registry, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('=');
  });
});
