/**
 * Tests for Row Indexer — Task 14.1
 *
 * Covers:
 * - Token hashing (deterministic UUID from system|code)
 * - Expression path parsing (simple, union, .where(), nested)
 * - Nested value extraction from resource JSON
 * - buildSearchColumns for all strategy types
 */

import { describe, it, expect } from 'vitest';

import {
  hashToken,
  extractPropertyPath,
  getNestedValues,
  buildSearchColumns,
  buildMetadataColumns,
} from '../../repo/row-indexer.js';
import type { SearchParameterImpl } from '../../registry/search-parameter-registry.js';

// =============================================================================
// Helpers
// =============================================================================

function makeImpl(overrides: Partial<SearchParameterImpl>): SearchParameterImpl {
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

// =============================================================================
// Section 1: Token Hashing
// =============================================================================

describe('Row Indexer — hashToken', () => {
  it('produces a UUID-format string', () => {
    const result = hashToken('http://example.com', 'male');
    expect(result).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('is deterministic (same input → same output)', () => {
    const a = hashToken('http://hl7.org/fhir/gender', 'male');
    const b = hashToken('http://hl7.org/fhir/gender', 'male');
    expect(a).toBe(b);
  });

  it('different inputs produce different hashes', () => {
    const male = hashToken('http://hl7.org/fhir/gender', 'male');
    const female = hashToken('http://hl7.org/fhir/gender', 'female');
    expect(male).not.toBe(female);
  });

  it('handles empty system', () => {
    const result = hashToken('', 'active');
    expect(result).toMatch(/^[0-9a-f]{8}-/);
  });

  it('handles empty code', () => {
    const result = hashToken('http://example.com', '');
    expect(result).toMatch(/^[0-9a-f]{8}-/);
  });
});

// =============================================================================
// Section 2: Expression Path Parsing
// =============================================================================

describe('Row Indexer — extractPropertyPath', () => {
  it('simple path: Patient.birthDate', () => {
    expect(extractPropertyPath('Patient.birthDate', 'Patient')).toEqual(['birthDate']);
  });

  it('nested path: Patient.contact.name', () => {
    expect(extractPropertyPath('Patient.contact.name', 'Patient')).toEqual(['contact', 'name']);
  });

  it('union: picks correct resource type', () => {
    const expr = 'AllergyIntolerance.patient | Condition.subject | Observation.subject';
    expect(extractPropertyPath(expr, 'Observation')).toEqual(['subject']);
    expect(extractPropertyPath(expr, 'Condition')).toEqual(['subject']);
  });

  it('strips .where() clause', () => {
    const expr = 'Account.subject.where(resolve() is Patient)';
    expect(extractPropertyPath(expr, 'Account')).toEqual(['subject']);
  });

  it('strips .as() type cast', () => {
    const expr = 'Observation.value.as(Quantity)';
    expect(extractPropertyPath(expr, 'Observation')).toEqual(['value']);
  });

  it('strips .resolve()', () => {
    const expr = 'Account.subject.where(resolve() is Patient)';
    expect(extractPropertyPath(expr, 'Account')).toEqual(['subject']);
  });

  it('returns null for non-matching resource type', () => {
    expect(extractPropertyPath('Patient.birthDate', 'Observation')).toBeNull();
  });

  it('returns null for empty expression', () => {
    expect(extractPropertyPath('', 'Patient')).toBeNull();
  });
});

// =============================================================================
// Section 3: Nested Value Extraction
// =============================================================================

describe('Row Indexer — getNestedValues', () => {
  it('extracts simple property', () => {
    const resource = { birthDate: '1990-01-01' };
    expect(getNestedValues(resource, ['birthDate'])).toEqual(['1990-01-01']);
  });

  it('extracts nested property', () => {
    const resource = { name: [{ family: 'Smith' }] };
    expect(getNestedValues(resource, ['name', 'family'])).toEqual(['Smith']);
  });

  it('extracts from array', () => {
    const resource = { name: [{ family: 'Smith' }, { family: 'Jones' }] };
    expect(getNestedValues(resource, ['name', 'family'])).toEqual(['Smith', 'Jones']);
  });

  it('returns empty for missing property', () => {
    expect(getNestedValues({ foo: 1 }, ['bar'])).toEqual([]);
  });

  it('returns empty for null', () => {
    expect(getNestedValues(null, ['foo'])).toEqual([]);
  });

  it('returns the object itself for empty path (scalar)', () => {
    expect(getNestedValues('hello', [])).toEqual(['hello']);
  });

  it('flattens array for empty path', () => {
    expect(getNestedValues(['a', 'b'], [])).toEqual(['a', 'b']);
  });

  it('handles deeply nested arrays', () => {
    const resource = {
      contact: [
        { name: { family: 'A' } },
        { name: { family: 'B' } },
      ],
    };
    expect(getNestedValues(resource, ['contact', 'name', 'family'])).toEqual(['A', 'B']);
  });
});

// =============================================================================
// Section 4: buildSearchColumns — column strategy
// =============================================================================

describe('Row Indexer — buildSearchColumns (column strategy)', () => {
  it('extracts date value (Patient.birthDate)', () => {
    const resource = { resourceType: 'Patient', birthDate: '1990-01-01' };
    const impls = [makeImpl({
      code: 'birthdate',
      type: 'date',
      expression: 'Patient.birthDate',
      columnName: 'birthdate',
      columnType: 'TIMESTAMPTZ',
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.birthdate).toBe('1990-01-01');
  });

  it('extracts string value', () => {
    const resource = { resourceType: 'Account', name: 'Test Account' };
    const impls = [makeImpl({
      code: 'name',
      type: 'string',
      expression: 'Account.name',
      columnName: 'name',
      columnType: 'TEXT',
      resourceTypes: ['Account'],
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.name).toBe('Test Account');
  });

  it('extracts single-target reference (scalar TEXT)', () => {
    const resource = {
      resourceType: 'Observation',
      specimen: { reference: 'Specimen/abc' },
    };
    const impls = [makeImpl({
      code: 'specimen',
      type: 'reference',
      expression: 'Observation.specimen',
      columnName: 'specimen',
      columnType: 'TEXT',
      array: false,
      resourceTypes: ['Observation'],
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.specimen).toBe('Specimen/abc');
  });

  it('extracts multi-target reference (array TEXT[])', () => {
    const resource = {
      resourceType: 'Account',
      subject: [
        { reference: 'Patient/1' },
        { reference: 'Device/2' },
      ],
    };
    const impls = [makeImpl({
      code: 'subject',
      type: 'reference',
      expression: 'Account.subject',
      columnName: 'subject',
      columnType: 'TEXT[]',
      array: true,
      resourceTypes: ['Account'],
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.subject).toEqual(['Patient/1', 'Device/2']);
  });

  it('extracts reference from .where() expression', () => {
    const resource = {
      resourceType: 'Account',
      subject: [
        { reference: 'Patient/1' },
        { reference: 'Organization/2' },
      ],
    };
    const impls = [makeImpl({
      code: 'patient',
      type: 'reference',
      expression: 'Account.subject.where(resolve() is Patient)',
      columnName: 'patient',
      columnType: 'TEXT[]',
      array: true,
      resourceTypes: ['Account'],
    })];
    const cols = buildSearchColumns(resource, impls);
    // Extracts all subjects (filtering by type is a future enhancement)
    expect(cols.patient).toEqual(['Patient/1', 'Organization/2']);
  });

  it('extracts number value', () => {
    const resource = {
      resourceType: 'RiskAssessment',
      prediction: [{ probabilityDecimal: 0.75 }],
    };
    const impls = [makeImpl({
      code: 'probability',
      type: 'number',
      expression: 'RiskAssessment.prediction.probabilityDecimal',
      columnName: 'probability',
      columnType: 'DOUBLE PRECISION',
      resourceTypes: ['RiskAssessment'],
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.probability).toBe(0.75);
  });

  it('extracts uri value', () => {
    const resource = { resourceType: 'ValueSet', url: 'http://example.com/vs' };
    const impls = [makeImpl({
      code: 'url',
      type: 'uri',
      expression: 'ValueSet.url',
      columnName: 'url',
      columnType: 'TEXT',
      resourceTypes: ['ValueSet'],
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.url).toBe('http://example.com/vs');
  });

  it('returns empty for missing values', () => {
    const resource = { resourceType: 'Patient' };
    const impls = [makeImpl({
      code: 'birthdate',
      type: 'date',
      expression: 'Patient.birthDate',
      columnName: 'birthdate',
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.birthdate).toBeUndefined();
  });
});

// =============================================================================
// Section 5: buildSearchColumns — token-column strategy
// =============================================================================

describe('Row Indexer — buildSearchColumns (token-column strategy)', () => {
  it('extracts token from code string (Patient.gender)', () => {
    const resource = { resourceType: 'Patient', gender: 'male' };
    const impls = [makeImpl({
      code: 'gender',
      type: 'token',
      expression: 'Patient.gender',
      strategy: 'token-column',
      columnName: 'gender',
      columnType: 'UUID[]',
      array: true,
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.__gender).toHaveLength(1);
    expect((cols.__gender as string[])[0]).toMatch(/^[0-9a-f]{8}-/);
    expect(cols.__genderText).toEqual(['male']);
    expect(cols.__genderSort).toBe('male');
  });

  it('extracts token from CodeableConcept (Observation.code)', () => {
    const resource = {
      resourceType: 'Observation',
      code: {
        coding: [
          { system: 'http://loinc.org', code: '12345-6', display: 'Test' },
          { system: 'http://snomed.info', code: '789', display: 'Alt' },
        ],
        text: 'Test observation',
      },
    };
    const impls = [makeImpl({
      code: 'code',
      type: 'token',
      expression: 'Observation.code',
      strategy: 'token-column',
      columnName: 'code',
      columnType: 'UUID[]',
      array: true,
      resourceTypes: ['Observation'],
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.__code).toHaveLength(2);
    expect(cols.__codeText).toEqual([
      'http://loinc.org|12345-6',
      'http://snomed.info|789',
    ]);
    expect(cols.__codeSort).toBe('Test');
  });

  it('extracts token from boolean', () => {
    const resource = { resourceType: 'Patient', active: true };
    const impls = [makeImpl({
      code: 'active',
      type: 'token',
      expression: 'Patient.active',
      strategy: 'token-column',
      columnName: 'active',
      columnType: 'UUID[]',
      array: true,
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.__activeText).toEqual(['true']);
    expect(cols.__activeSort).toBe('true');
  });

  it('handles missing token value', () => {
    const resource = { resourceType: 'Patient' };
    const impls = [makeImpl({
      code: 'gender',
      type: 'token',
      expression: 'Patient.gender',
      strategy: 'token-column',
      columnName: 'gender',
      columnType: 'UUID[]',
      array: true,
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.__gender).toBeUndefined();
    expect(cols.__genderText).toBeUndefined();
  });

  it('extracts token from Identifier', () => {
    const resource = {
      resourceType: 'Patient',
      identifier: [
        { system: 'http://hospital.org', value: 'MRN-001' },
      ],
    };
    const impls = [makeImpl({
      code: 'identifier',
      type: 'token',
      expression: 'Patient.identifier',
      strategy: 'token-column',
      columnName: 'identifier',
      columnType: 'UUID[]',
      array: true,
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.__identifier).toHaveLength(1);
    expect(cols.__identifierText).toEqual(['http://hospital.org|MRN-001']);
  });
});

// =============================================================================
// Section 6: buildSearchColumns — lookup-table strategy
// =============================================================================

describe('Row Indexer — buildSearchColumns (lookup-table strategy)', () => {
  it('extracts sort string from HumanName (Patient.name)', () => {
    const resource = {
      resourceType: 'Patient',
      name: [{ family: 'Smith', given: ['John', 'Q'] }],
    };
    const impls = [makeImpl({
      code: 'name',
      type: 'string',
      expression: 'Patient.name',
      strategy: 'lookup-table',
      columnName: 'name',
      columnType: 'TEXT',
      array: false,
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.__nameSort).toBe('Smith John Q');
  });

  it('extracts sort string from Address (Practitioner.address)', () => {
    const resource = {
      resourceType: 'Practitioner',
      address: [{ line: ['123 Main St'], city: 'Boston', state: 'MA', postalCode: '02101' }],
    };
    const impls = [makeImpl({
      code: 'address',
      type: 'string',
      expression: 'Practitioner.address',
      strategy: 'lookup-table',
      columnName: 'address',
      columnType: 'TEXT',
      array: false,
      resourceTypes: ['Practitioner'],
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.__addressSort).toBe('123 Main St Boston MA 02101');
  });

  it('handles missing lookup-table value', () => {
    const resource = { resourceType: 'Patient' };
    const impls = [makeImpl({
      code: 'name',
      type: 'string',
      expression: 'Patient.name',
      strategy: 'lookup-table',
      columnName: 'name',
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.__nameSort).toBeUndefined();
  });

  it('extracts sort string from plain string (Account.name)', () => {
    const resource = { resourceType: 'Account', name: 'Test Account' };
    const impls = [makeImpl({
      code: 'name',
      type: 'string',
      expression: 'Account.name',
      strategy: 'lookup-table',
      columnName: 'name',
      resourceTypes: ['Account'],
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.__nameSort).toBe('Test Account');
  });

  it('extracts sort string from ContactPoint (Patient.telecom)', () => {
    const resource = {
      resourceType: 'Patient',
      telecom: [{ system: 'phone', value: '555-1234', use: 'home' }],
    };
    const impls = [makeImpl({
      code: 'telecom',
      type: 'token',
      expression: 'Patient.telecom',
      strategy: 'lookup-table',
      columnName: 'telecom',
      columnType: 'TEXT',
      array: false,
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.__telecomSort).toBe('555-1234');
  });

  it('Address sort string includes country', () => {
    const resource = {
      resourceType: 'Patient',
      address: [{ line: ['456 Oak Ave'], city: 'Springfield', state: 'IL', postalCode: '62704', country: 'US' }],
    };
    const impls = [makeImpl({
      code: 'address',
      type: 'string',
      expression: 'Patient.address',
      strategy: 'lookup-table',
      columnName: 'address',
      columnType: 'TEXT',
      array: false,
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.__addressSort).toBe('456 Oak Ave Springfield IL 62704 US');
  });

  it('HumanName sort string includes family and all given names', () => {
    const resource = {
      resourceType: 'Patient',
      name: [{ family: 'Doe', given: ['Jane', 'Marie'] }],
    };
    const impls = [makeImpl({
      code: 'name',
      type: 'string',
      expression: 'Patient.name',
      strategy: 'lookup-table',
      columnName: 'name',
      columnType: 'TEXT',
      array: false,
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.__nameSort).toBe('Doe Jane Marie');
  });

  it('multiple names uses first name for sort', () => {
    const resource = {
      resourceType: 'Patient',
      name: [
        { family: 'Official', given: ['First'] },
        { family: 'Nickname', given: ['Nick'] },
      ],
    };
    const impls = [makeImpl({
      code: 'name',
      type: 'string',
      expression: 'Patient.name',
      strategy: 'lookup-table',
      columnName: 'name',
      columnType: 'TEXT',
      array: false,
    })];
    const cols = buildSearchColumns(resource, impls);
    expect(cols.__nameSort).toBe('Official First');
  });
});

// =============================================================================
// Section 7: buildSearchColumns — multiple impls
// =============================================================================

describe('Row Indexer — buildSearchColumns (multiple impls)', () => {
  it('handles multiple search params for one resource', () => {
    const resource = {
      resourceType: 'Patient',
      birthDate: '1990-01-01',
      gender: 'female',
      active: true,
      name: [{ family: 'Doe', given: ['Jane'] }],
    };
    const impls = [
      makeImpl({
        code: 'birthdate', type: 'date', expression: 'Patient.birthDate',
        strategy: 'column', columnName: 'birthdate', columnType: 'TIMESTAMPTZ',
      }),
      makeImpl({
        code: 'gender', type: 'token', expression: 'Patient.gender',
        strategy: 'token-column', columnName: 'gender', columnType: 'UUID[]', array: true,
      }),
      makeImpl({
        code: 'active', type: 'token', expression: 'Patient.active',
        strategy: 'token-column', columnName: 'active', columnType: 'UUID[]', array: true,
      }),
      makeImpl({
        code: 'name', type: 'string', expression: 'Patient.name',
        strategy: 'lookup-table', columnName: 'name', columnType: 'TEXT',
      }),
    ];
    const cols = buildSearchColumns(resource, impls);

    expect(cols.birthdate).toBe('1990-01-01');
    expect(cols.__gender).toHaveLength(1);
    expect(cols.__genderText).toEqual(['female']);
    expect(cols.__active).toHaveLength(1);
    expect(cols.__activeText).toEqual(['true']);
    expect(cols.__nameSort).toBe('Doe Jane');
  });

  it('returns empty object for empty impls', () => {
    const resource = { resourceType: 'Patient', birthDate: '1990-01-01' };
    const cols = buildSearchColumns(resource, []);
    expect(cols).toEqual({});
  });
});

// =============================================================================
// buildMetadataColumns — Task 15.4
// =============================================================================

describe('buildMetadataColumns', () => {
  it('extracts meta.tag → ___tag, ___tagText, ___tagSort', () => {
    const resource = {
      resourceType: 'Patient',
      meta: {
        tag: [{ system: 'http://example.com', code: 'urgent', display: 'Urgent' }],
      },
    };
    const cols = buildMetadataColumns(resource);
    expect(cols.___tag).toHaveLength(1);
    expect(cols.___tagText).toEqual(['http://example.com|urgent']);
    expect(cols.___tagSort).toBe('http://example.com|urgent');
  });

  it('extracts meta.security → ___security, ___securityText, ___securitySort', () => {
    const resource = {
      resourceType: 'Patient',
      meta: {
        security: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'R' }],
      },
    };
    const cols = buildMetadataColumns(resource);
    expect(cols.___security).toHaveLength(1);
    expect(cols.___securityText).toEqual(['http://terminology.hl7.org/CodeSystem/v3-Confidentiality|R']);
    expect(cols.___securitySort).toBe('http://terminology.hl7.org/CodeSystem/v3-Confidentiality|R');
  });

  it('no meta.tag → no ___tag columns', () => {
    const resource = { resourceType: 'Patient', meta: { lastUpdated: '2026-01-01' } };
    const cols = buildMetadataColumns(resource);
    expect(cols.___tag).toBeUndefined();
    expect(cols.___tagText).toBeUndefined();
  });

  it('multiple tags → arrays with all values', () => {
    const resource = {
      resourceType: 'Patient',
      meta: {
        tag: [
          { system: 'http://a.com', code: 'x' },
          { system: 'http://b.com', code: 'y' },
        ],
      },
    };
    const cols = buildMetadataColumns(resource);
    expect(cols.___tag).toHaveLength(2);
    expect(cols.___tagText).toEqual(['http://a.com|x', 'http://b.com|y']);
    expect(cols.___tagSort).toBe('http://a.com|x');
  });

  it('tag with system|code → correct text format', () => {
    const resource = {
      resourceType: 'Patient',
      meta: { tag: [{ system: 'http://example.com', code: 'urgent' }] },
    };
    const cols = buildMetadataColumns(resource);
    expect(cols.___tagText).toEqual(['http://example.com|urgent']);
  });

  it('tag with code only (no system) → no system prefix', () => {
    const resource = {
      resourceType: 'Patient',
      meta: { tag: [{ code: 'local-tag' }] },
    };
    const cols = buildMetadataColumns(resource);
    expect(cols.___tagText).toEqual(['local-tag']);
  });

  it('empty meta → empty result', () => {
    const resource = { resourceType: 'Patient' };
    const cols = buildMetadataColumns(resource);
    expect(cols).toEqual({});
  });

  it('meta with no tag or security → empty result', () => {
    const resource = { resourceType: 'Patient', meta: { lastUpdated: '2026-01-01' } };
    const cols = buildMetadataColumns(resource);
    expect(cols).toEqual({});
  });
});
