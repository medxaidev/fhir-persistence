/**
 * Reference Indexer v2 Tests — 11 tests covering targetType + referenceRaw extraction.
 */
import { describe, it, expect } from 'vitest';
import { extractReferencesV2 } from '../../repo/reference-indexer.js';
import type { SearchParameterImpl } from '../../registry/search-parameter-registry.js';
import type { FhirResource } from '../../repo/types.js';

function mockRefImpl(overrides: Partial<SearchParameterImpl>): SearchParameterImpl {
  return {
    code: 'subject',
    type: 'reference',
    resourceTypes: ['Observation'],
    expression: 'Observation.subject',
    strategy: 'column',
    columnName: 'subject',
    columnType: 'TEXT',
    array: false,
    ...overrides,
  };
}

describe('Reference Indexer v2', () => {
  // =========================================================================
  // 1. Extracts targetType from relative reference
  // =========================================================================
  it('extracts targetType from "Patient/123"', () => {
    const resource: FhirResource = {
      resourceType: 'Observation',
      id: 'obs-1',
      subject: { reference: 'Patient/123' },
    };
    const rows = extractReferencesV2(resource, [mockRefImpl({})]);
    expect(rows).toHaveLength(1);
    expect(rows[0].targetType).toBe('Patient');
    expect(rows[0].targetId).toBe('123');
    expect(rows[0].code).toBe('subject');
  });

  // =========================================================================
  // 2. Extracts targetType from absolute URL
  // =========================================================================
  it('extracts targetType from absolute URL reference', () => {
    const resource: FhirResource = {
      resourceType: 'Observation',
      id: 'obs-1',
      subject: { reference: 'http://example.com/fhir/Patient/456' },
    };
    const rows = extractReferencesV2(resource, [mockRefImpl({})]);
    expect(rows).toHaveLength(1);
    expect(rows[0].targetType).toBe('Patient');
    expect(rows[0].targetId).toBe('456');
  });

  // =========================================================================
  // 3. Preserves referenceRaw
  // =========================================================================
  it('preserves the original reference string as referenceRaw', () => {
    const resource: FhirResource = {
      resourceType: 'Observation',
      id: 'obs-1',
      subject: { reference: 'Patient/123' },
    };
    const rows = extractReferencesV2(resource, [mockRefImpl({})]);
    expect(rows[0].referenceRaw).toBe('Patient/123');
  });

  // =========================================================================
  // 4. Skips contained references
  // =========================================================================
  it('skips contained references (#)', () => {
    const resource: FhirResource = {
      resourceType: 'Observation',
      id: 'obs-1',
      subject: { reference: '#contained-patient' },
    };
    const rows = extractReferencesV2(resource, [mockRefImpl({})]);
    expect(rows).toHaveLength(0);
  });

  // =========================================================================
  // 5. Skips URN references
  // =========================================================================
  it('skips URN references', () => {
    const resource: FhirResource = {
      resourceType: 'Observation',
      id: 'obs-1',
      subject: { reference: 'urn:uuid:550e8400-e29b-41d4-a716-446655440000' },
    };
    const rows = extractReferencesV2(resource, [mockRefImpl({})]);
    expect(rows).toHaveLength(0);
  });

  // =========================================================================
  // 6. Skips display-only references
  // =========================================================================
  it('skips display-only references (no reference field)', () => {
    const resource: FhirResource = {
      resourceType: 'Observation',
      id: 'obs-1',
      subject: { display: 'John Smith' },
    };
    const rows = extractReferencesV2(resource, [mockRefImpl({})]);
    expect(rows).toHaveLength(0);
  });

  // =========================================================================
  // 7. Handles multiple references per search parameter
  // =========================================================================
  it('handles array of references (e.g., performer)', () => {
    const resource: FhirResource = {
      resourceType: 'Observation',
      id: 'obs-1',
      performer: [
        { reference: 'Practitioner/pract-1' },
        { reference: 'Organization/org-1' },
      ],
    };
    const impl = mockRefImpl({
      code: 'performer',
      expression: 'Observation.performer',
      columnName: 'performer',
    });
    const rows = extractReferencesV2(resource, [impl]);
    expect(rows).toHaveLength(2);
    expect(rows[0].targetType).toBe('Practitioner');
    expect(rows[0].targetId).toBe('pract-1');
    expect(rows[1].targetType).toBe('Organization');
    expect(rows[1].targetId).toBe('org-1');
  });

  // =========================================================================
  // 8. Handles union expressions (picks correct resource type path)
  // =========================================================================
  it('handles union expressions by picking correct path', () => {
    const resource: FhirResource = {
      resourceType: 'Observation',
      id: 'obs-1',
      subject: { reference: 'Patient/pat-1' },
    };
    const impl = mockRefImpl({
      code: 'subject',
      expression: 'Observation.subject | Condition.subject',
    });
    const rows = extractReferencesV2(resource, [impl]);
    expect(rows).toHaveLength(1);
    expect(rows[0].targetType).toBe('Patient');
  });

  // =========================================================================
  // 9. Returns empty for non-reference search params
  // =========================================================================
  it('returns empty for non-reference search parameters', () => {
    const resource: FhirResource = {
      resourceType: 'Patient',
      id: 'pat-1',
      name: [{ family: 'Smith' }],
    };
    const impl = mockRefImpl({
      code: 'name',
      type: 'string',
      expression: 'Patient.name',
      columnName: 'name',
      resourceTypes: ['Patient'],
    });
    const rows = extractReferencesV2(resource, [impl]);
    expect(rows).toHaveLength(0);
  });

  // =========================================================================
  // 10. Returns empty when resource has no id
  // =========================================================================
  it('returns empty when resource has no id', () => {
    const resource: FhirResource = {
      resourceType: 'Observation',
      subject: { reference: 'Patient/123' },
    };
    const rows = extractReferencesV2(resource, [mockRefImpl({})]);
    expect(rows).toHaveLength(0);
  });

  // =========================================================================
  // 11. Handles nested reference paths
  // =========================================================================
  it('handles nested reference paths (e.g., encounter.serviceProvider)', () => {
    const resource: FhirResource = {
      resourceType: 'Encounter',
      id: 'enc-1',
      serviceProvider: { reference: 'Organization/org-1' },
    };
    const impl = mockRefImpl({
      code: 'service-provider',
      expression: 'Encounter.serviceProvider',
      columnName: 'serviceProvider',
      resourceTypes: ['Encounter'],
    });
    const rows = extractReferencesV2(resource, [impl]);
    expect(rows).toHaveLength(1);
    expect(rows[0].targetType).toBe('Organization');
    expect(rows[0].targetId).toBe('org-1');
    expect(rows[0].referenceRaw).toBe('Organization/org-1');
  });
});
