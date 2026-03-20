/**
 * WHERE Builder v2 Tests — 12 tests covering SQLite ? placeholders and json_each.
 */
import { describe, it, expect } from 'vitest';
import { buildWhereFragmentV2, buildWhereClauseV2 } from '../../search/where-builder.js';
import type { SearchParameterImpl } from '../../registry/search-parameter-registry.js';
import type { ParsedSearchParam } from '../../search/types.js';

function mockImpl(overrides: Partial<SearchParameterImpl>): SearchParameterImpl {
  return {
    code: 'test',
    type: 'string',
    resourceTypes: ['Patient'],
    expression: 'Patient.test',
    strategy: 'column',
    columnName: 'test',
    columnType: 'TEXT',
    array: false,
    ...overrides,
  };
}

describe('WHERE Builder v2', () => {
  // =========================================================================
  // 1. String: default prefix match uses ? and LOWER LIKE
  // =========================================================================
  it('string default: LOWER(col) LIKE ? with prefix wildcard', () => {
    const impl = mockImpl({ code: 'name', columnName: 'name' });
    const param: ParsedSearchParam = { code: 'name', values: ['Smith'] };
    const frag = buildWhereFragmentV2(impl, param);
    expect(frag).not.toBeNull();
    expect(frag!.sql).toBe('LOWER("name") LIKE ?');
    expect(frag!.values).toEqual(['smith%']);
    expect(frag!.sql).not.toContain('$');
  });

  // =========================================================================
  // 2. String: :exact modifier uses = ?
  // =========================================================================
  it('string :exact uses equality with ?', () => {
    const impl = mockImpl({ code: 'name', columnName: 'name' });
    const param: ParsedSearchParam = { code: 'name', modifier: 'exact', values: ['Smith'] };
    const frag = buildWhereFragmentV2(impl, param);
    expect(frag!.sql).toBe('"name" = ?');
    expect(frag!.values).toEqual(['Smith']);
  });

  // =========================================================================
  // 3. String: :contains modifier uses %value%
  // =========================================================================
  it('string :contains uses LIKE with surrounding wildcards', () => {
    const impl = mockImpl({ code: 'name', columnName: 'name' });
    const param: ParsedSearchParam = { code: 'name', modifier: 'contains', values: ['mit'] };
    const frag = buildWhereFragmentV2(impl, param);
    expect(frag!.sql).toBe('LOWER("name") LIKE ?');
    expect(frag!.values).toEqual(['%mit%']);
  });

  // =========================================================================
  // 4. Date: ge prefix
  // =========================================================================
  it('date ge prefix generates >= ?', () => {
    const impl = mockImpl({ code: 'birthdate', type: 'date', columnName: 'birthdate' });
    const param: ParsedSearchParam = { code: 'birthdate', prefix: 'ge', values: ['1990-01-01'] };
    const frag = buildWhereFragmentV2(impl, param);
    expect(frag!.sql).toBe('"birthdate" >= ?');
    expect(frag!.values).toEqual(['1990-01-01']);
  });

  // =========================================================================
  // 5. Date: ap (approximately) BETWEEN
  // =========================================================================
  it('date ap prefix generates BETWEEN ? AND ?', () => {
    const impl = mockImpl({ code: 'birthdate', type: 'date', columnName: 'birthdate' });
    const param: ParsedSearchParam = { code: 'birthdate', prefix: 'ap', values: ['2000-06-15T00:00:00.000Z'] };
    const frag = buildWhereFragmentV2(impl, param);
    expect(frag!.sql).toBe('"birthdate" BETWEEN ? AND ?');
    expect(frag!.values).toHaveLength(2);
  });

  // =========================================================================
  // 6. Token: json_each match (system|code)
  // =========================================================================
  it('token uses json_each for SQLite', () => {
    const impl = mockImpl({
      code: 'code',
      type: 'token',
      strategy: 'token-column',
      columnName: 'code',
      array: true,
    });
    const param: ParsedSearchParam = { code: 'code', values: ['http://loinc.org|8480-6'] };
    const frag = buildWhereFragmentV2(impl, param);
    expect(frag!.sql).toContain('json_each');
    expect(frag!.sql).toContain('json_each.value = ?');
    expect(frag!.values).toEqual(['http://loinc.org|8480-6']);
    expect(frag!.sql).not.toContain('ARRAY');
    expect(frag!.sql).not.toContain('::text[]');
  });

  // =========================================================================
  // 6b. Bug-1 regression: token column name matches DDL (__code, not __codeText)
  // =========================================================================
  it('token column references __<name> not __<name>Text (Bug-1 regression)', () => {
    const impl = mockImpl({
      code: 'gender',
      type: 'token',
      strategy: 'token-column',
      columnName: 'gender',
      array: true,
    });
    const param: ParsedSearchParam = { code: 'gender', values: ['male'] };
    const frag = buildWhereFragmentV2(impl, param);
    expect(frag!.sql).toContain('"__gender"');
    expect(frag!.sql).not.toContain('"__genderText"');
  });

  // =========================================================================
  // 6c. Bug-3 regression: bare code uses LIKE, |code uses exact match
  // =========================================================================
  it('bare code uses LIKE %|code to match any system (Bug-3 regression)', () => {
    const impl = mockImpl({
      code: 'gender',
      type: 'token',
      strategy: 'token-column',
      columnName: 'gender',
      array: true,
    });
    const param: ParsedSearchParam = { code: 'gender', values: ['male'] };
    const frag = buildWhereFragmentV2(impl, param);
    expect(frag!.sql).toContain('json_each');
    expect(frag!.sql).toContain('LIKE ?');
    expect(frag!.values).toEqual(['%|male']);
  });

  it('|code uses exact match against stored |code (Bug-3 regression)', () => {
    const impl = mockImpl({
      code: 'gender',
      type: 'token',
      strategy: 'token-column',
      columnName: 'gender',
      array: true,
    });
    const param: ParsedSearchParam = { code: 'gender', values: ['|male'] };
    const frag = buildWhereFragmentV2(impl, param);
    expect(frag!.sql).toContain('json_each.value = ?');
    expect(frag!.values).toEqual(['|male']);
  });

  // =========================================================================
  // 7. Token: :not modifier
  // =========================================================================
  it('token :not with bare code uses NOT LIKE via json_each', () => {
    const impl = mockImpl({
      code: 'status',
      type: 'token',
      strategy: 'token-column',
      columnName: 'status',
      array: true,
    });
    const param: ParsedSearchParam = { code: 'status', modifier: 'not', values: ['cancelled'] };
    const frag = buildWhereFragmentV2(impl, param);
    expect(frag!.sql).toContain('NOT');
    expect(frag!.sql).toContain('json_each');
    expect(frag!.sql).toContain('LIKE ?');
    expect(frag!.values).toEqual(['%|cancelled']);
  });

  it('token :not with system|code uses NOT EXISTS exact match', () => {
    const impl = mockImpl({
      code: 'status',
      type: 'token',
      strategy: 'token-column',
      columnName: 'status',
      array: true,
    });
    const param: ParsedSearchParam = { code: 'status', modifier: 'not', values: ['http://hl7.org|cancelled'] };
    const frag = buildWhereFragmentV2(impl, param);
    expect(frag!.sql).toContain('NOT EXISTS');
    expect(frag!.sql).toContain('json_each');
    expect(frag!.values).toEqual(['http://hl7.org|cancelled']);
  });

  // =========================================================================
  // 8. Token: :text modifier searches sort column
  // =========================================================================
  it('token :text modifier uses sort column LIKE', () => {
    const impl = mockImpl({
      code: 'code',
      type: 'token',
      strategy: 'token-column',
      columnName: 'code',
      array: true,
    });
    const param: ParsedSearchParam = { code: 'code', modifier: 'text', values: ['blood'] };
    const frag = buildWhereFragmentV2(impl, param);
    expect(frag!.sql).toContain('"__codeSort"');
    expect(frag!.sql).toContain('LIKE ?');
    expect(frag!.values).toEqual(['blood%']);
  });

  // =========================================================================
  // 9. Reference: simple equality with ?
  // =========================================================================
  it('reference scalar uses = ?', () => {
    const impl = mockImpl({
      code: 'subject',
      type: 'reference',
      columnName: 'subject',
    });
    const param: ParsedSearchParam = { code: 'subject', values: ['Patient/123'] };
    const frag = buildWhereFragmentV2(impl, param);
    expect(frag!.sql).toBe('"subject" = ?');
    expect(frag!.values).toEqual(['Patient/123']);
  });

  // =========================================================================
  // 10. :missing modifier
  // =========================================================================
  it(':missing=true generates IS NULL, no values', () => {
    const impl = mockImpl({ code: 'active', columnName: 'active' });
    const param: ParsedSearchParam = { code: 'active', modifier: 'missing', values: ['true'] };
    const frag = buildWhereFragmentV2(impl, param);
    expect(frag!.sql).toBe('"active" IS NULL');
    expect(frag!.values).toEqual([]);
  });

  // =========================================================================
  // 11. Number/quantity: prefix support
  // =========================================================================
  it('number gt prefix generates > ?', () => {
    const impl = mockImpl({ code: 'value-quantity', type: 'quantity', columnName: 'valueQuantity' });
    const param: ParsedSearchParam = { code: 'value-quantity', prefix: 'gt', values: ['100'] };
    const frag = buildWhereFragmentV2(impl, param);
    expect(frag!.sql).toBe('"valueQuantity" > ?');
    expect(frag!.values).toEqual([100]);
  });

  // =========================================================================
  // 12. OR semantics: multiple values joined with OR
  // =========================================================================
  it('multiple values produce OR clause with ?', () => {
    const impl = mockImpl({ code: 'gender', columnName: 'gender' });
    const param: ParsedSearchParam = { code: 'gender', modifier: 'exact', values: ['male', 'female'] };
    const frag = buildWhereFragmentV2(impl, param);
    expect(frag!.sql).toBe('("gender" = ? OR "gender" = ?)');
    expect(frag!.values).toEqual(['male', 'female']);
  });
});
