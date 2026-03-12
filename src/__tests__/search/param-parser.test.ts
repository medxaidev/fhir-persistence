/**
 * Search Parameter Parser — Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  parseSearchRequest,
  parseParamKey,
  splitSearchValues,
  extractPrefix,
  parseSortParam,
  parseIncludeValue,
} from '../../search/param-parser.js';

// =============================================================================
// parseParamKey
// =============================================================================

describe('parseParamKey', () => {
  it('parses simple code', () => {
    expect(parseParamKey('gender')).toEqual({ code: 'gender' });
  });

  it('parses code with :exact modifier', () => {
    expect(parseParamKey('name:exact')).toEqual({ code: 'name', modifier: 'exact' });
  });

  it('parses code with :contains modifier', () => {
    expect(parseParamKey('name:contains')).toEqual({ code: 'name', modifier: 'contains' });
  });

  it('parses code with :missing modifier', () => {
    expect(parseParamKey('active:missing')).toEqual({ code: 'active', modifier: 'missing' });
  });

  it('parses code with :not modifier', () => {
    expect(parseParamKey('code:not')).toEqual({ code: 'code', modifier: 'not' });
  });

  it('parses hyphenated code', () => {
    expect(parseParamKey('birth-date')).toEqual({ code: 'birth-date' });
  });
});

// =============================================================================
// splitSearchValues
// =============================================================================

describe('splitSearchValues', () => {
  it('returns single value', () => {
    expect(splitSearchValues('male')).toEqual(['male']);
  });

  it('splits comma-separated values', () => {
    expect(splitSearchValues('male,female')).toEqual(['male', 'female']);
  });

  it('splits three values', () => {
    expect(splitSearchValues('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('handles escaped commas', () => {
    expect(splitSearchValues('a\\,b,c')).toEqual(['a,b', 'c']);
  });

  it('filters empty values', () => {
    expect(splitSearchValues('a,,b')).toEqual(['a', 'b']);
  });

  it('handles empty string', () => {
    expect(splitSearchValues('')).toEqual([]);
  });
});

// =============================================================================
// extractPrefix
// =============================================================================

describe('extractPrefix', () => {
  it('extracts ge prefix from date value', () => {
    const result = extractPrefix(['ge1990-01-01'], 'date');
    expect(result.prefix).toBe('ge');
    expect(result.cleanValues).toEqual(['1990-01-01']);
  });

  it('extracts lt prefix', () => {
    const result = extractPrefix(['lt2026-12-31'], 'date');
    expect(result.prefix).toBe('lt');
    expect(result.cleanValues).toEqual(['2026-12-31']);
  });

  it('extracts ne prefix from number', () => {
    const result = extractPrefix(['ne100'], 'number');
    expect(result.prefix).toBe('ne');
    expect(result.cleanValues).toEqual(['100']);
  });

  it('returns no prefix for string type', () => {
    const result = extractPrefix(['geSmith'], 'string');
    expect(result.prefix).toBeUndefined();
    expect(result.cleanValues).toEqual(['geSmith']);
  });

  it('returns no prefix when type is undefined', () => {
    const result = extractPrefix(['ge1990'], undefined);
    expect(result.prefix).toBeUndefined();
    expect(result.cleanValues).toEqual(['ge1990']);
  });

  it('returns no prefix for short values', () => {
    const result = extractPrefix(['ge'], 'date');
    expect(result.prefix).toBeUndefined();
    expect(result.cleanValues).toEqual(['ge']);
  });

  it('handles multiple values with prefix', () => {
    const result = extractPrefix(['ge1990-01-01', 'le2026-12-31'], 'date');
    expect(result.prefix).toBe('ge');
    expect(result.cleanValues).toEqual(['1990-01-01', '2026-12-31']);
  });
});

// =============================================================================
// parseSortParam
// =============================================================================

describe('parseSortParam', () => {
  it('parses single ascending sort', () => {
    expect(parseSortParam('birthdate')).toEqual([
      { code: 'birthdate', descending: false },
    ]);
  });

  it('parses single descending sort', () => {
    expect(parseSortParam('-birthdate')).toEqual([
      { code: 'birthdate', descending: true },
    ]);
  });

  it('parses multiple sort rules', () => {
    expect(parseSortParam('family,-birthdate')).toEqual([
      { code: 'family', descending: false },
      { code: 'birthdate', descending: true },
    ]);
  });

  it('filters empty segments', () => {
    expect(parseSortParam('family,,birthdate')).toEqual([
      { code: 'family', descending: false },
      { code: 'birthdate', descending: false },
    ]);
  });
});

// =============================================================================
// parseSearchRequest
// =============================================================================

describe('parseSearchRequest', () => {
  it('parses empty query', () => {
    const result = parseSearchRequest('Patient', {});
    expect(result.resourceType).toBe('Patient');
    expect(result.params).toEqual([]);
  });

  it('parses single parameter', () => {
    const result = parseSearchRequest('Patient', { gender: 'male' });
    expect(result.params).toHaveLength(1);
    expect(result.params[0]).toEqual({
      code: 'gender',
      values: ['male'],
    });
  });

  it('parses comma-separated OR values', () => {
    const result = parseSearchRequest('Patient', { gender: 'male,female' });
    expect(result.params[0].values).toEqual(['male', 'female']);
  });

  it('parses multiple AND parameters', () => {
    const result = parseSearchRequest('Patient', {
      gender: 'male',
      active: 'true',
    });
    expect(result.params).toHaveLength(2);
  });

  it('parses _count parameter', () => {
    const result = parseSearchRequest('Patient', { _count: '50' });
    expect(result.count).toBe(50);
    expect(result.params).toHaveLength(0);
  });

  it('caps _count at MAX_SEARCH_COUNT', () => {
    const result = parseSearchRequest('Patient', { _count: '9999' });
    expect(result.count).toBe(1000);
  });

  it('parses _offset parameter', () => {
    const result = parseSearchRequest('Patient', { _offset: '20' });
    expect(result.offset).toBe(20);
  });

  it('parses _sort parameter', () => {
    const result = parseSearchRequest('Patient', { _sort: '-birthdate' });
    expect(result.sort).toEqual([{ code: 'birthdate', descending: true }]);
  });

  it('parses _total parameter', () => {
    const result = parseSearchRequest('Patient', { _total: 'accurate' });
    expect(result.total).toBe('accurate');
  });

  it('ignores unknown _total values', () => {
    const result = parseSearchRequest('Patient', { _total: 'invalid' });
    expect(result.total).toBeUndefined();
  });

  it('parses modifier in key', () => {
    const result = parseSearchRequest('Patient', { 'name:exact': 'Smith' });
    expect(result.params[0].code).toBe('name');
    expect(result.params[0].modifier).toBe('exact');
  });

  it('parses date prefix', () => {
    const result = parseSearchRequest('Patient', { _lastUpdated: 'ge2026-01-01' });
    expect(result.params[0].code).toBe('_lastUpdated');
    expect(result.params[0].prefix).toBe('ge');
    expect(result.params[0].values).toEqual(['2026-01-01']);
  });

  it('parses _include into request.include', () => {
    const result = parseSearchRequest('Patient', {
      _include: 'Patient:organization',
      gender: 'male',
    });
    expect(result.params).toHaveLength(1);
    expect(result.params[0].code).toBe('gender');
    expect(result.include).toHaveLength(1);
    expect(result.include![0]).toEqual({ resourceType: 'Patient', searchParam: 'organization' });
  });

  it('parses _revinclude into request.revinclude', () => {
    const result = parseSearchRequest('Patient', {
      _revinclude: 'Observation:subject',
    });
    expect(result.params).toHaveLength(0);
    expect(result.revinclude).toHaveLength(1);
    expect(result.revinclude![0]).toEqual({ resourceType: 'Observation', searchParam: 'subject' });
  });

  it('parses _include with target type', () => {
    const result = parseSearchRequest('Patient', {
      _include: 'Observation:subject:Patient',
    });
    expect(result.include).toHaveLength(1);
    expect(result.include![0]).toEqual({
      resourceType: 'Observation',
      searchParam: 'subject',
      targetType: 'Patient',
    });
  });

  it('skips undefined and empty values', () => {
    const result = parseSearchRequest('Patient', {
      gender: undefined,
      active: '',
    });
    expect(result.params).toHaveLength(0);
  });
});

// =============================================================================
// parseIncludeValue
// =============================================================================

describe('parseIncludeValue', () => {
  it('parses ResourceType:param', () => {
    expect(parseIncludeValue('MedicationRequest:patient')).toEqual({
      resourceType: 'MedicationRequest',
      searchParam: 'patient',
    });
  });

  it('parses ResourceType:param:targetType', () => {
    expect(parseIncludeValue('Observation:subject:Patient')).toEqual({
      resourceType: 'Observation',
      searchParam: 'subject',
      targetType: 'Patient',
    });
  });

  it('returns null for invalid format (no colon)', () => {
    expect(parseIncludeValue('InvalidValue')).toBeNull();
  });

  it('returns null for empty parts', () => {
    expect(parseIncludeValue(':subject')).toBeNull();
    expect(parseIncludeValue('Patient:')).toBeNull();
  });
});

// =============================================================================
// Phase 18: Chained Search Parsing
// =============================================================================

describe('Phase 18 — parseParamKey chained syntax', () => {
  it('parses subject:Patient.name as chained search', () => {
    const result = parseParamKey('subject:Patient.name');
    expect(result).toEqual({
      code: 'subject',
      chain: { targetType: 'Patient', targetParam: 'name' },
    });
    expect(result.modifier).toBeUndefined();
  });

  it('parses performer:Practitioner.family as chained search', () => {
    const result = parseParamKey('performer:Practitioner.family');
    expect(result).toEqual({
      code: 'performer',
      chain: { targetType: 'Practitioner', targetParam: 'family' },
    });
  });

  it('does not confuse regular modifier with chained search', () => {
    const result = parseParamKey('name:exact');
    expect(result).toEqual({ code: 'name', modifier: 'exact' });
    expect(result.chain).toBeUndefined();
  });
});

describe('Phase 18 — parseSearchRequest chained params', () => {
  it('parses chained search param into request.params with chain field', () => {
    const request = parseSearchRequest('Observation', {
      'subject:Patient.name': 'Smith',
    });
    expect(request.params).toHaveLength(1);
    expect(request.params[0].code).toBe('subject');
    expect(request.params[0].values).toEqual(['Smith']);
    expect(request.params[0].chain).toEqual({
      targetType: 'Patient',
      targetParam: 'name',
    });
  });

  it('chained param coexists with normal params', () => {
    const request = parseSearchRequest('Observation', {
      'subject:Patient.name': 'Smith',
      '_count': '10',
    });
    expect(request.params).toHaveLength(1);
    expect(request.count).toBe(10);
    expect(request.params[0].chain).toBeDefined();
  });
});

// =============================================================================
// Phase 18: _include:iterate and _include=* Parsing
// =============================================================================

describe('Phase 18 — _include:iterate parsing', () => {
  it('_include:iterate sets iterate=true on target', () => {
    const request = parseSearchRequest('Observation', {
      '_include:iterate': 'Observation:subject',
    });
    expect(request.include).toHaveLength(1);
    expect(request.include![0].iterate).toBe(true);
    expect(request.include![0].resourceType).toBe('Observation');
    expect(request.include![0].searchParam).toBe('subject');
  });

  it('_revinclude:iterate sets iterate=true on target', () => {
    const request = parseSearchRequest('Patient', {
      '_revinclude:iterate': 'Observation:subject',
    });
    expect(request.revinclude).toHaveLength(1);
    expect(request.revinclude![0].iterate).toBe(true);
  });

  it('normal _include does not set iterate', () => {
    const request = parseSearchRequest('Observation', {
      '_include': 'Observation:subject',
    });
    expect(request.include).toHaveLength(1);
    expect(request.include![0].iterate).toBeUndefined();
  });
});

describe('Phase 18 — _include=* wildcard parsing', () => {
  it('_include=* produces wildcard IncludeTarget', () => {
    const result = parseIncludeValue('*');
    expect(result).not.toBeNull();
    expect(result!.wildcard).toBe(true);
    expect(result!.resourceType).toBe('*');
    expect(result!.searchParam).toBe('*');
  });

  it('parseSearchRequest with _include=* sets wildcard in include array', () => {
    const request = parseSearchRequest('Observation', {
      '_include': '*',
    });
    expect(request.include).toHaveLength(1);
    expect(request.include![0].wildcard).toBe(true);
  });
});
