/**
 * WHERE Clause Builder — Unit Tests
 */

import { describe, it, expect } from 'vitest';
import type { SearchParameterImpl } from '../../registry/search-parameter-registry.js';
import type { ParsedSearchParam } from '../../search/types.js';
import {
  prefixToOperator,
  buildWhereFragment,
  buildWhereClause,
} from '../../search/where-builder.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';

// =============================================================================
// Helper: build a minimal SearchParameterImpl
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

// =============================================================================
// prefixToOperator
// =============================================================================

describe('prefixToOperator', () => {
  it('returns = for eq', () => expect(prefixToOperator('eq')).toBe('='));
  it('returns = for undefined', () => expect(prefixToOperator(undefined)).toBe('='));
  it('returns <> for ne', () => expect(prefixToOperator('ne')).toBe('<>'));
  it('returns < for lt', () => expect(prefixToOperator('lt')).toBe('<'));
  it('returns > for gt', () => expect(prefixToOperator('gt')).toBe('>'));
  it('returns <= for le', () => expect(prefixToOperator('le')).toBe('<='));
  it('returns >= for ge', () => expect(prefixToOperator('ge')).toBe('>='));
  it('returns > for sa', () => expect(prefixToOperator('sa')).toBe('>'));
  it('returns < for eb', () => expect(prefixToOperator('eb')).toBe('<'));
  it('returns ap for ap (handled by type-specific builders)', () => expect(prefixToOperator('ap')).toBe('ap'));
});

// =============================================================================
// buildWhereFragment — string type
// =============================================================================

describe('buildWhereFragment — string', () => {
  const impl = makeImpl({ code: 'family', type: 'string', columnName: 'family' });

  it('default: prefix match with LOWER/LIKE', () => {
    const param: ParsedSearchParam = { code: 'family', values: ['Smith'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('LOWER("family") LIKE $1');
    expect(result!.values).toEqual(['smith%']);
  });

  it(':exact modifier: equality', () => {
    const param: ParsedSearchParam = { code: 'family', modifier: 'exact', values: ['Smith'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"family" = $1');
    expect(result!.values).toEqual(['Smith']);
  });

  it(':contains modifier: infix match', () => {
    const param: ParsedSearchParam = { code: 'family', modifier: 'contains', values: ['mit'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toContain('LOWER("family") LIKE $1');
    expect(result!.values).toEqual(['%mit%']);
  });

  it('multiple values produce OR', () => {
    const param: ParsedSearchParam = { code: 'family', values: ['Smith', 'Jones'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toContain('OR');
    expect(result!.values).toHaveLength(2);
  });

  it('escapes LIKE special characters', () => {
    const param: ParsedSearchParam = { code: 'family', values: ['100%'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.values[0]).toBe('100\\%%');
  });
});

// =============================================================================
// buildWhereFragment — date type
// =============================================================================

describe('buildWhereFragment — date', () => {
  const impl = makeImpl({ code: 'birthdate', type: 'date', columnName: 'birthdate', columnType: 'TIMESTAMPTZ' });

  it('default (eq): equality', () => {
    const param: ParsedSearchParam = { code: 'birthdate', values: ['1990-01-01'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"birthdate" = $1');
    expect(result!.values).toEqual(['1990-01-01']);
  });

  it('ge prefix: >=', () => {
    const param: ParsedSearchParam = { code: 'birthdate', prefix: 'ge', values: ['1990-01-01'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"birthdate" >= $1');
  });

  it('lt prefix: <', () => {
    const param: ParsedSearchParam = { code: 'birthdate', prefix: 'lt', values: ['2026-12-31'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"birthdate" < $1');
  });

  it('ne prefix: <>', () => {
    const param: ParsedSearchParam = { code: 'birthdate', prefix: 'ne', values: ['1990-01-01'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"birthdate" <> $1');
  });

  it('ap prefix: BETWEEN ±1 day', () => {
    const param: ParsedSearchParam = { code: 'birthdate', prefix: 'ap', values: ['2026-01-15T00:00:00.000Z'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('BETWEEN $1 AND $2');
    expect(result!.values).toHaveLength(2);
    // lo should be ~2026-01-14, hi should be ~2026-01-16
    expect(new Date(result!.values[0] as string).getTime()).toBeLessThan(new Date('2026-01-15T00:00:00.000Z').getTime());
    expect(new Date(result!.values[1] as string).getTime()).toBeGreaterThan(new Date('2026-01-15T00:00:00.000Z').getTime());
  });

  it('ap prefix with multiple values: OR of BETWEENs', () => {
    const param: ParsedSearchParam = { code: 'birthdate', prefix: 'ap', values: ['2026-01-15T00:00:00.000Z', '2026-06-15T00:00:00.000Z'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toContain('OR');
    expect(result!.values).toHaveLength(4);
  });
});

// =============================================================================
// buildWhereFragment — number type
// =============================================================================

describe('buildWhereFragment — number', () => {
  const impl = makeImpl({ code: 'length', type: 'number', columnName: 'length', columnType: 'DOUBLE PRECISION' });

  it('default: equality with numeric value', () => {
    const param: ParsedSearchParam = { code: 'length', values: ['100'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"length" = $1');
    expect(result!.values).toEqual([100]);
  });

  it('gt prefix: >', () => {
    const param: ParsedSearchParam = { code: 'length', prefix: 'gt', values: ['50'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"length" > $1');
    expect(result!.values).toEqual([50]);
  });

  it('ap prefix: BETWEEN ±10%', () => {
    const param: ParsedSearchParam = { code: 'length', prefix: 'ap', values: ['100'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('BETWEEN $1 AND $2');
    expect(result!.values).toHaveLength(2);
    expect(result!.values[0]).toBeCloseTo(90, 5);
    expect(result!.values[1]).toBeCloseTo(110, 5);
  });

  it('ap prefix with multiple values: OR of BETWEENs', () => {
    const param: ParsedSearchParam = { code: 'length', prefix: 'ap', values: ['100', '200'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toContain('OR');
    expect(result!.values).toHaveLength(4);
    expect(result!.values[0]).toBeCloseTo(90, 5);
    expect(result!.values[1]).toBeCloseTo(110, 5);
    expect(result!.values[2]).toBeCloseTo(180, 5);
    expect(result!.values[3]).toBeCloseTo(220, 5);
  });
});

// =============================================================================
// buildWhereFragment — reference type
// =============================================================================

describe('buildWhereFragment — reference', () => {
  const impl = makeImpl({ code: 'subject', type: 'reference', columnName: 'subject' });

  it('equality match', () => {
    const param: ParsedSearchParam = { code: 'subject', values: ['Patient/123'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"subject" = $1');
    expect(result!.values).toEqual(['Patient/123']);
  });

  it('multiple values produce OR', () => {
    const param: ParsedSearchParam = { code: 'subject', values: ['Patient/1', 'Patient/2'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toContain('OR');
    expect(result!.values).toHaveLength(2);
  });
});

// =============================================================================
// buildWhereFragment — uri type
// =============================================================================

describe('buildWhereFragment — uri', () => {
  const impl = makeImpl({ code: 'url', type: 'uri', columnName: 'url' });

  it('exact match', () => {
    const param: ParsedSearchParam = { code: 'url', values: ['http://example.com'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"url" = $1');
    expect(result!.values).toEqual(['http://example.com']);
  });
});

// =============================================================================
// buildWhereFragment — token type
// =============================================================================

describe('buildWhereFragment — token', () => {
  const impl = makeImpl({ code: 'gender', type: 'token', columnName: 'gender', strategy: 'token-column' });

  it('array overlap match on __genderText', () => {
    const param: ParsedSearchParam = { code: 'gender', values: ['male'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"__genderText" && ARRAY[$1]::text[]');
    expect(result!.values).toEqual(['male']);
  });

  it(':not modifier: NOT array overlap', () => {
    const param: ParsedSearchParam = { code: 'gender', modifier: 'not', values: ['male'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('NOT ("__genderText" && ARRAY[$1]::text[])');
  });

  it('multiple values in single ARRAY', () => {
    const param: ParsedSearchParam = { code: 'gender', values: ['male', 'female'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"__genderText" && ARRAY[$1, $2]::text[]');
    expect(result!.values).toEqual(['male', 'female']);
  });
});

// =============================================================================
// buildWhereFragment — :missing modifier
// =============================================================================

describe('buildWhereFragment — :missing', () => {
  const impl = makeImpl({ code: 'active', type: 'token', columnName: 'active' });

  it(':missing=true → IS NULL', () => {
    const param: ParsedSearchParam = { code: 'active', modifier: 'missing', values: ['true'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"active" IS NULL');
    expect(result!.values).toEqual([]);
  });

  it(':missing=false → IS NOT NULL', () => {
    const param: ParsedSearchParam = { code: 'active', modifier: 'missing', values: ['false'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"active" IS NOT NULL');
    expect(result!.values).toEqual([]);
  });
});

// =============================================================================
// buildWhereFragment — lookup-table strategy
// =============================================================================

describe('buildWhereFragment — lookup-table', () => {
  it('searches HumanName global table for lookup-table strategy', () => {
    const impl = makeImpl({ code: 'name', type: 'string', columnName: 'name', strategy: 'lookup-table' });
    const param: ParsedSearchParam = { code: 'name', values: ['Smith'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result).not.toBeNull();
    expect(result!.sql).toBe('EXISTS (SELECT 1 FROM "HumanName" __lookup WHERE __lookup."resourceId" = "id" AND LOWER(__lookup."name") LIKE $1)');
    expect(result!.values).toEqual(['smith%']);
  });
});

// =============================================================================
// buildWhereFragment — parameter index
// =============================================================================

describe('buildWhereFragment — parameter indexing', () => {
  it('uses startIndex for $N placeholder (token-column)', () => {
    const impl = makeImpl({ code: 'gender', type: 'token', columnName: 'gender', strategy: 'token-column' });
    const param: ParsedSearchParam = { code: 'gender', values: ['male'] };
    const result = buildWhereFragment(impl, param, 5);
    expect(result!.sql).toBe('"__genderText" && ARRAY[$5]::text[]');
  });

  it('increments index for multiple values (token-column)', () => {
    const impl = makeImpl({ code: 'gender', type: 'token', columnName: 'gender', strategy: 'token-column' });
    const param: ParsedSearchParam = { code: 'gender', values: ['male', 'female'] };
    const result = buildWhereFragment(impl, param, 3);
    expect(result!.sql).toContain('$3');
    expect(result!.sql).toContain('$4');
  });
});

// =============================================================================
// buildWhereClause — composite
// =============================================================================

describe('buildWhereClause', () => {
  const registry = new SearchParameterRegistry();

  // Manually index some test impls
  registry.indexImpl('Patient', makeImpl({ code: 'gender', type: 'token', columnName: 'gender', strategy: 'token-column' }));
  registry.indexImpl('Patient', makeImpl({ code: 'active', type: 'token', columnName: 'active', strategy: 'token-column' }));
  registry.indexImpl('Patient', makeImpl({ code: 'birthdate', type: 'date', columnName: 'birthdate', columnType: 'TIMESTAMPTZ' }));

  it('combines multiple params with AND', () => {
    const params: ParsedSearchParam[] = [
      { code: 'gender', values: ['male'] },
      { code: 'active', values: ['true'] },
    ];
    const result = buildWhereClause(params, registry, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('"__genderText" && ARRAY[$1]::text[]');
    expect(result!.sql).toContain('AND');
    expect(result!.sql).toContain('"__activeText" && ARRAY[$2]::text[]');
    expect(result!.values).toEqual(['male', 'true']);
  });

  it('handles _id special parameter', () => {
    const params: ParsedSearchParam[] = [
      { code: '_id', values: ['abc-123'] },
    ];
    const result = buildWhereClause(params, registry, 'Patient');
    expect(result!.sql).toContain('"id" = $1');
    expect(result!.values).toEqual(['abc-123']);
  });

  it('handles _lastUpdated special parameter with prefix', () => {
    const params: ParsedSearchParam[] = [
      { code: '_lastUpdated', prefix: 'ge', values: ['2026-01-01'] },
    ];
    const result = buildWhereClause(params, registry, 'Patient');
    expect(result!.sql).toContain('"lastUpdated" >= $1');
  });

  it('returns null for empty params', () => {
    const result = buildWhereClause([], registry, 'Patient');
    expect(result).toBeNull();
  });

  it('skips unknown params without registry match', () => {
    const params: ParsedSearchParam[] = [
      { code: 'nonexistent', values: ['value'] },
    ];
    const result = buildWhereClause(params, registry, 'Patient');
    expect(result).toBeNull();
  });

  it('handles mixed special and registry params', () => {
    const params: ParsedSearchParam[] = [
      { code: '_id', values: ['abc'] },
      { code: 'gender', values: ['male'] },
      { code: 'birthdate', prefix: 'ge', values: ['1990-01-01'] },
    ];
    const result = buildWhereClause(params, registry, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('"id"');
    expect(result!.sql).toContain('"__genderText" && ARRAY[$2]::text[]');
    expect(result!.sql).toContain('"birthdate" >= $3');
    expect(result!.values).toEqual(['abc', 'male', '1990-01-01']);
  });
});

// =============================================================================
// buildWhereClause — metadata search parameters
// =============================================================================

describe('buildWhereClause — metadata params', () => {
  const registry = new SearchParameterRegistry();

  it('_tag generates token-column array overlap on ___tagText', () => {
    const params: ParsedSearchParam[] = [
      { code: '_tag', values: ['http://example.com|urgent'] },
    ];
    const result = buildWhereClause(params, registry, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).toBe('"___tagText" && ARRAY[$1]::text[]');
    expect(result!.values).toEqual(['http://example.com|urgent']);
  });

  it('_tag:not generates NOT array overlap', () => {
    const params: ParsedSearchParam[] = [
      { code: '_tag', modifier: 'not', values: ['http://example.com|urgent'] },
    ];
    const result = buildWhereClause(params, registry, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).toBe('NOT ("___tagText" && ARRAY[$1]::text[])');
  });

  it('_tag with multiple values', () => {
    const params: ParsedSearchParam[] = [
      { code: '_tag', values: ['http://a.com|x', 'http://b.com|y'] },
    ];
    const result = buildWhereClause(params, registry, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).toBe('"___tagText" && ARRAY[$1, $2]::text[]');
    expect(result!.values).toEqual(['http://a.com|x', 'http://b.com|y']);
  });

  it('_security generates token-column array overlap on ___securityText', () => {
    const params: ParsedSearchParam[] = [
      { code: '_security', values: ['http://terminology.hl7.org/CodeSystem/v3-Confidentiality|R'] },
    ];
    const result = buildWhereClause(params, registry, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).toBe('"___securityText" && ARRAY[$1]::text[]');
  });

  it('_profile generates array overlap on _profile TEXT[]', () => {
    const params: ParsedSearchParam[] = [
      { code: '_profile', values: ['http://hl7.org/fhir/StructureDefinition/Patient'] },
    ];
    const result = buildWhereClause(params, registry, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).toBe('"_profile" && ARRAY[$1]::text[]');
    expect(result!.values).toEqual(['http://hl7.org/fhir/StructureDefinition/Patient']);
  });

  it('_profile with multiple values', () => {
    const params: ParsedSearchParam[] = [
      { code: '_profile', values: ['http://a.com/P1', 'http://b.com/P2'] },
    ];
    const result = buildWhereClause(params, registry, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).toBe('"_profile" && ARRAY[$1, $2]::text[]');
  });

  it('_source generates equality on _source TEXT', () => {
    const params: ParsedSearchParam[] = [
      { code: '_source', values: ['http://example.com'] },
    ];
    const result = buildWhereClause(params, registry, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).toBe('"_source" = $1');
    expect(result!.values).toEqual(['http://example.com']);
  });

  it('_source with multiple values produces OR', () => {
    const params: ParsedSearchParam[] = [
      { code: '_source', values: ['http://a.com', 'http://b.com'] },
    ];
    const result = buildWhereClause(params, registry, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('OR');
    expect(result!.values).toEqual(['http://a.com', 'http://b.com']);
  });

  it('mixed _tag + _id + gender', () => {
    const registry2 = new SearchParameterRegistry();
    registry2.indexImpl('Patient', makeImpl({ code: 'gender', type: 'token', columnName: 'gender', strategy: 'token-column' }));

    const params: ParsedSearchParam[] = [
      { code: '_tag', values: ['http://example.com|urgent'] },
      { code: '_id', values: ['abc'] },
      { code: 'gender', values: ['male'] },
    ];
    const result = buildWhereClause(params, registry2, 'Patient');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('"___tagText" && ARRAY[$1]::text[]');
    expect(result!.sql).toContain('"id" = $2');
    expect(result!.sql).toContain('"__genderText" && ARRAY[$3]::text[]');
    expect(result!.values).toEqual(['http://example.com|urgent', 'abc', 'male']);
  });
});

// =============================================================================
// buildWhereFragment — token system|code enhancement
// =============================================================================

describe('buildWhereFragment — token system|code', () => {
  const impl = makeImpl({ code: 'identifier', type: 'token', columnName: 'identifier', strategy: 'token-column' });

  it('plain code value → array overlap as-is', () => {
    const param: ParsedSearchParam = { code: 'identifier', values: ['12345'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"__identifierText" && ARRAY[$1]::text[]');
    expect(result!.values).toEqual(['12345']);
  });

  it('system|code value → array overlap as-is', () => {
    const param: ParsedSearchParam = { code: 'identifier', values: ['http://example.com|12345'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"__identifierText" && ARRAY[$1]::text[]');
    expect(result!.values).toEqual(['http://example.com|12345']);
  });

  it('system| value → EXISTS + unnest + LIKE', () => {
    const param: ParsedSearchParam = { code: 'identifier', values: ['http://example.com|'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toContain('EXISTS');
    expect(result!.sql).toContain('unnest');
    expect(result!.sql).toContain('LIKE');
    expect(result!.values).toEqual(['http://example.com|%']);
  });

  it('|code value → searches for plain code (strips leading pipe)', () => {
    const param: ParsedSearchParam = { code: 'identifier', values: ['|12345'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"__identifierText" && ARRAY[$1]::text[]');
    expect(result!.values).toEqual(['12345']);
  });

  it(':not with system|code', () => {
    const param: ParsedSearchParam = { code: 'identifier', modifier: 'not', values: ['http://example.com|12345'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('NOT ("__identifierText" && ARRAY[$1]::text[])');
    expect(result!.values).toEqual(['http://example.com|12345']);
  });

  it(':text modifier → LIKE on sort column', () => {
    const param: ParsedSearchParam = { code: 'identifier', modifier: 'text', values: ['body weight'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('LOWER("__identifierSort") LIKE $1');
    expect(result!.values).toEqual(['body weight%']);
  });

  it(':text modifier with multiple values → OR of LIKEs', () => {
    const param: ParsedSearchParam = { code: 'identifier', modifier: 'text', values: ['body', 'weight'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toContain('OR');
    expect(result!.sql).toContain('LOWER("__identifierSort") LIKE $1');
    expect(result!.sql).toContain('LOWER("__identifierSort") LIKE $2');
    expect(result!.values).toEqual(['body%', 'weight%']);
  });

  it('mixed values (some with pipe, some without)', () => {
    const param: ParsedSearchParam = { code: 'identifier', values: ['12345', 'http://example.com|67890'] };
    const result = buildWhereFragment(impl, param, 1);
    expect(result!.sql).toBe('"__identifierText" && ARRAY[$1, $2]::text[]');
    expect(result!.values).toEqual(['12345', 'http://example.com|67890']);
  });
});

// =============================================================================
// Phase 17 — Lookup-table strategy (sort-column search)
// =============================================================================

describe('Phase 17 — lookup-table strategy', () => {
  const nameImpl = makeImpl({
    code: 'name',
    type: 'string',
    strategy: 'lookup-table',
    columnName: 'name',
    expression: 'Patient.name',
  });

  const addressImpl = makeImpl({
    code: 'address',
    type: 'string',
    strategy: 'lookup-table',
    columnName: 'address',
    expression: 'Patient.address',
  });

  const telecomImpl = makeImpl({
    code: 'telecom',
    type: 'token',
    strategy: 'lookup-table',
    columnName: 'telecom',
    expression: 'Patient.telecom',
  });

  it('name prefix search generates EXISTS on HumanName table', () => {
    const param: ParsedSearchParam = { code: 'name', values: ['Smith'] };
    const result = buildWhereFragment(nameImpl, param, 1);
    expect(result).not.toBeNull();
    expect(result!.sql).toBe('EXISTS (SELECT 1 FROM "HumanName" __lookup WHERE __lookup."resourceId" = "id" AND LOWER(__lookup."name") LIKE $1)');
    expect(result!.values).toEqual(['smith%']);
  });

  it('name :exact generates EXISTS with equality on HumanName table', () => {
    const param: ParsedSearchParam = { code: 'name', modifier: 'exact', values: ['Smith'] };
    const result = buildWhereFragment(nameImpl, param, 1);
    expect(result).not.toBeNull();
    expect(result!.sql).toBe('EXISTS (SELECT 1 FROM "HumanName" __lookup WHERE __lookup."resourceId" = "id" AND __lookup."name" = $1)');
    expect(result!.values).toEqual(['Smith']);
  });

  it('name :contains generates EXISTS with LIKE wildcards on HumanName table', () => {
    const param: ParsedSearchParam = { code: 'name', modifier: 'contains', values: ['mit'] };
    const result = buildWhereFragment(nameImpl, param, 1);
    expect(result).not.toBeNull();
    expect(result!.sql).toBe('EXISTS (SELECT 1 FROM "HumanName" __lookup WHERE __lookup."resourceId" = "id" AND LOWER(__lookup."name") LIKE $1)');
    expect(result!.values).toEqual(['%mit%']);
  });

  it('multiple values generate OR clause with EXISTS', () => {
    const param: ParsedSearchParam = { code: 'name', values: ['Smith', 'Jones'] };
    const result = buildWhereFragment(nameImpl, param, 1);
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('OR');
    expect(result!.sql).toContain('LOWER(__lookup."name") LIKE $1');
    expect(result!.sql).toContain('LOWER(__lookup."name") LIKE $2');
    expect(result!.values).toEqual(['smith%', 'jones%']);
  });

  it('address search uses EXISTS on Address table', () => {
    const param: ParsedSearchParam = { code: 'address', values: ['Main'] };
    const result = buildWhereFragment(addressImpl, param, 1);
    expect(result).not.toBeNull();
    expect(result!.sql).toBe('EXISTS (SELECT 1 FROM "Address" __lookup WHERE __lookup."resourceId" = "id" AND LOWER(__lookup."address") LIKE $1)');
    expect(result!.values).toEqual(['main%']);
  });

  it('telecom search uses EXISTS on ContactPoint table', () => {
    const param: ParsedSearchParam = { code: 'telecom', values: ['555'] };
    const result = buildWhereFragment(telecomImpl, param, 1);
    expect(result).not.toBeNull();
    expect(result!.sql).toBe('EXISTS (SELECT 1 FROM "ContactPoint" __lookup WHERE __lookup."resourceId" = "id" AND LOWER(__lookup."value") LIKE $1)');
    expect(result!.values).toEqual(['555%']);
  });
});

// =============================================================================
// Phase 18: Chained Search
// =============================================================================

describe('Phase 18 — chained search WHERE clause', () => {
  // Build a registry with impls for both Observation and Patient
  function makeChainRegistry(): SearchParameterRegistry {
    const registry = new SearchParameterRegistry();
    registry.indexImpl('Observation', makeImpl({
      code: 'subject', type: 'reference', columnName: 'subject', columnType: 'TEXT[]', array: true,
    }));
    registry.indexImpl('Patient', makeImpl({
      code: 'name', type: 'string', columnName: 'name', strategy: 'lookup-table',
    }));
    registry.indexImpl('Patient', makeImpl({
      code: 'gender', type: 'token', columnName: 'gender', strategy: 'token-column', columnType: 'UUID[]', array: true,
    }));
    registry.indexImpl('Patient', makeImpl({
      code: 'birthdate', type: 'date', columnName: 'birthdate', columnType: 'TIMESTAMPTZ',
    }));
    return registry;
  }

  it('chained string search generates EXISTS with JOIN and LIKE', () => {
    const registry = makeChainRegistry();
    const params: ParsedSearchParam[] = [
      {
        code: 'subject',
        values: ['Smith'],
        chain: { targetType: 'Patient', targetParam: 'name' },
      },
    ];

    const result = buildWhereClause(params, registry, 'Observation');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('EXISTS');
    expect(result!.sql).toContain('"Observation_References"');
    expect(result!.sql).toContain('"Patient"');
    expect(result!.sql).toContain('__ref."targetId" = __target."id"');
    expect(result!.sql).toContain('__ref."code" = \'subject\'');
    expect(result!.sql).toContain('__target."deleted" = false');
    expect(result!.sql).toContain('LIKE $1');
    expect(result!.values).toEqual(['smith%']);
  });

  it('chained token search generates EXISTS with token text overlap', () => {
    const registry = makeChainRegistry();
    const params: ParsedSearchParam[] = [
      {
        code: 'subject',
        values: ['male'],
        chain: { targetType: 'Patient', targetParam: 'gender' },
      },
    ];

    const result = buildWhereClause(params, registry, 'Observation');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('EXISTS');
    expect(result!.sql).toContain('__target."__genderText"');
    expect(result!.sql).toContain('ARRAY[$1]::text[]');
    expect(result!.values).toEqual(['male']);
  });

  it('chained date search generates EXISTS with date comparison', () => {
    const registry = makeChainRegistry();
    const params: ParsedSearchParam[] = [
      {
        code: 'subject',
        values: ['1990-01-01'],
        prefix: 'ge',
        chain: { targetType: 'Patient', targetParam: 'birthdate' },
      },
    ];

    const result = buildWhereClause(params, registry, 'Observation');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('EXISTS');
    expect(result!.sql).toContain('>= $1');
    expect(result!.values).toEqual(['1990-01-01']);
  });

  it('returns null for unknown target param', () => {
    const registry = makeChainRegistry();
    const params: ParsedSearchParam[] = [
      {
        code: 'subject',
        values: ['value'],
        chain: { targetType: 'Patient', targetParam: 'nonexistent' },
      },
    ];

    const result = buildWhereClause(params, registry, 'Observation');
    expect(result).toBeNull();
  });

  it('chained param combined with normal param generates AND', () => {
    const extendedRegistry = makeChainRegistry();
    extendedRegistry.indexImpl('Observation', makeImpl({
      code: 'code', type: 'token', columnName: 'code', strategy: 'token-column', columnType: 'UUID[]', array: true,
    }));

    const params: ParsedSearchParam[] = [
      {
        code: 'subject',
        values: ['Smith'],
        chain: { targetType: 'Patient', targetParam: 'name' },
      },
      {
        code: 'code',
        values: ['12345'],
      },
    ];

    const result = buildWhereClause(params, extendedRegistry, 'Observation');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('EXISTS');
    expect(result!.sql).toContain('AND');
    expect(result!.sql).toContain('"__codeText"');
    expect(result!.values.length).toBe(2);
  });

  it('chained search with :exact modifier on target param', () => {
    const registry = makeChainRegistry();
    const params: ParsedSearchParam[] = [
      {
        code: 'subject',
        values: ['Smith'],
        modifier: 'exact',
        chain: { targetType: 'Patient', targetParam: 'name' },
      },
    ];

    const result = buildWhereClause(params, registry, 'Observation');
    expect(result).not.toBeNull();
    expect(result!.sql).toContain('EXISTS');
    expect(result!.sql).toContain('= $1');
    expect(result!.sql).not.toContain('LIKE');
    expect(result!.values).toEqual(['Smith']);
  });
});
