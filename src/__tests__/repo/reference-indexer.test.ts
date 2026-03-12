/**
 * Reference Indexer — Unit Tests (Task 16.1)
 */

import { describe, it, expect } from 'vitest';
import { extractReferences } from '../../repo/reference-indexer.js';
import type { SearchParameterImpl } from '../../registry/search-parameter-registry.js';

// =============================================================================
// Helpers
// =============================================================================

function makeImpl(overrides: Partial<SearchParameterImpl> & { code: string; expression: string }): SearchParameterImpl {
  return {
    type: 'reference',
    strategy: 'column',
    columnName: overrides.code,
    columnType: 'TEXT',
    array: false,
    resourceTypes: ['Patient'],
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('Reference Indexer — extractReferences', () => {
  it('extracts single reference (Patient.managingOrganization)', () => {
    const resource = {
      resourceType: 'Patient',
      id: 'p1',
      managingOrganization: { reference: 'Organization/org1' },
    };
    const impls = [makeImpl({
      code: 'organization',
      expression: 'Patient.managingOrganization',
      resourceTypes: ['Patient'],
    })];
    const rows = extractReferences(resource, impls);
    expect(rows).toEqual([
      { resourceId: 'p1', targetId: 'org1', code: 'organization' },
    ]);
  });

  it('extracts array references (Account.subject)', () => {
    const resource = {
      resourceType: 'Account',
      id: 'a1',
      subject: [
        { reference: 'Patient/p1' },
        { reference: 'Patient/p2' },
      ],
    };
    const impls = [makeImpl({
      code: 'subject',
      expression: 'Account.subject',
      resourceTypes: ['Account'],
      array: true,
      columnType: 'TEXT[]',
    })];
    const rows = extractReferences(resource, impls);
    expect(rows).toHaveLength(2);
    expect(rows).toContainEqual({ resourceId: 'a1', targetId: 'p1', code: 'subject' });
    expect(rows).toContainEqual({ resourceId: 'a1', targetId: 'p2', code: 'subject' });
  });

  it('skips display-only reference (no reference URL)', () => {
    const resource = {
      resourceType: 'Patient',
      id: 'p1',
      managingOrganization: { display: 'Some Hospital' },
    };
    const impls = [makeImpl({
      code: 'organization',
      expression: 'Patient.managingOrganization',
    })];
    const rows = extractReferences(resource, impls);
    expect(rows).toHaveLength(0);
  });

  it('skips empty/null reference fields', () => {
    const resource = {
      resourceType: 'Patient',
      id: 'p1',
    };
    const impls = [makeImpl({
      code: 'organization',
      expression: 'Patient.managingOrganization',
    })];
    const rows = extractReferences(resource, impls);
    expect(rows).toHaveLength(0);
  });

  it('extracts nested reference (Observation.subject)', () => {
    const resource = {
      resourceType: 'Observation',
      id: 'obs1',
      subject: { reference: 'Patient/p1' },
    };
    const impls = [makeImpl({
      code: 'subject',
      expression: 'Observation.subject',
      resourceTypes: ['Observation'],
    })];
    const rows = extractReferences(resource, impls);
    expect(rows).toEqual([
      { resourceId: 'obs1', targetId: 'p1', code: 'subject' },
    ]);
  });

  it('multiple reference params produce multiple rows', () => {
    const resource = {
      resourceType: 'Observation',
      id: 'obs1',
      subject: { reference: 'Patient/p1' },
      encounter: { reference: 'Encounter/e1' },
    };
    const impls = [
      makeImpl({
        code: 'subject',
        expression: 'Observation.subject',
        resourceTypes: ['Observation'],
      }),
      makeImpl({
        code: 'encounter',
        expression: 'Observation.encounter',
        resourceTypes: ['Observation'],
      }),
    ];
    const rows = extractReferences(resource, impls);
    expect(rows).toHaveLength(2);
    expect(rows).toContainEqual({ resourceId: 'obs1', targetId: 'p1', code: 'subject' });
    expect(rows).toContainEqual({ resourceId: 'obs1', targetId: 'e1', code: 'encounter' });
  });

  it('relative reference "Patient/123" → targetId = "123"', () => {
    const resource = {
      resourceType: 'Observation',
      id: 'obs1',
      subject: { reference: 'Patient/123' },
    };
    const impls = [makeImpl({
      code: 'subject',
      expression: 'Observation.subject',
      resourceTypes: ['Observation'],
    })];
    const rows = extractReferences(resource, impls);
    expect(rows[0].targetId).toBe('123');
  });

  it('absolute reference URL → extracts last segment as targetId', () => {
    const resource = {
      resourceType: 'Observation',
      id: 'obs1',
      subject: { reference: 'http://example.com/fhir/Patient/abc-def' },
    };
    const impls = [makeImpl({
      code: 'subject',
      expression: 'Observation.subject',
      resourceTypes: ['Observation'],
    })];
    const rows = extractReferences(resource, impls);
    expect(rows[0].targetId).toBe('abc-def');
  });

  it('skips non-reference impls', () => {
    const resource = {
      resourceType: 'Patient',
      id: 'p1',
      gender: 'male',
      managingOrganization: { reference: 'Organization/org1' },
    };
    const impls = [
      makeImpl({
        code: 'gender',
        type: 'token',
        expression: 'Patient.gender',
        strategy: 'token-column',
      }),
      makeImpl({
        code: 'organization',
        expression: 'Patient.managingOrganization',
      }),
    ];
    const rows = extractReferences(resource, impls);
    expect(rows).toHaveLength(1);
    expect(rows[0].code).toBe('organization');
  });

  it('skips resource without id', () => {
    const resource = {
      resourceType: 'Patient',
      managingOrganization: { reference: 'Organization/org1' },
    };
    const impls = [makeImpl({
      code: 'organization',
      expression: 'Patient.managingOrganization',
    })];
    const rows = extractReferences(resource, impls);
    expect(rows).toHaveLength(0);
  });

  it('skips contained references (#fragment)', () => {
    const resource = {
      resourceType: 'Observation',
      id: 'obs1',
      subject: { reference: '#contained-patient' },
    };
    const impls = [makeImpl({
      code: 'subject',
      expression: 'Observation.subject',
      resourceTypes: ['Observation'],
    })];
    const rows = extractReferences(resource, impls);
    expect(rows).toHaveLength(0);
  });

  it('skips URN references', () => {
    const resource = {
      resourceType: 'Observation',
      id: 'obs1',
      subject: { reference: 'urn:uuid:abc-def-123' },
    };
    const impls = [makeImpl({
      code: 'subject',
      expression: 'Observation.subject',
      resourceTypes: ['Observation'],
    })];
    const rows = extractReferences(resource, impls);
    expect(rows).toHaveLength(0);
  });
});
