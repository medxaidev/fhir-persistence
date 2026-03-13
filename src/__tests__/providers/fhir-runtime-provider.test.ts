/**
 * Tests for FhirRuntimeProvider — Direction A: Real fhir-runtime Integration
 *
 * Covers:
 * - extractSearchValues via real fhir-runtime extractAllSearchValues
 * - extractReferences via real fhir-runtime extractReferences
 * - Token normalization (system|code strings)
 * - Reference extraction with path → code mapping
 * - Factory function createFhirRuntimeProvider
 */

import { describe, it, expect } from 'vitest';
import {
  extractSearchValues,
  extractAllSearchValues,
  extractReferences,
} from 'fhir-runtime';
import {
  FhirRuntimeProvider,
  createFhirRuntimeProvider,
} from '../../providers/fhir-runtime-provider.js';
import type { SearchParameterDef } from '../../providers/definition-provider.js';

// =============================================================================
// Helpers
// =============================================================================

function makeSP(overrides: Partial<SearchParameterDef> & { code: string; type: SearchParameterDef['type'] }): SearchParameterDef {
  return {
    resourceType: 'SearchParameter',
    base: ['Patient'],
    expression: '',
    ...overrides,
  };
}

function createProvider(): FhirRuntimeProvider {
  return createFhirRuntimeProvider({
    extractSearchValues,
    extractAllSearchValues,
    extractReferences,
  });
}

// =============================================================================
// Section 1: extractSearchValues
// =============================================================================

describe('FhirRuntimeProvider — extractSearchValues', () => {
  it('extracts string value (Patient.family)', () => {
    const provider = createProvider();
    const resource = {
      resourceType: 'Patient',
      name: [{ family: 'Smith', given: ['John'] }],
    };
    const params = [makeSP({
      code: 'family',
      type: 'string',
      base: ['Patient'],
      expression: 'Patient.name.family',
    })];

    const result = provider.extractSearchValues(resource, params);
    expect(result.family).toBeDefined();
    expect(result.family).toContain('Smith');
  });

  it('extracts date value (Patient.birthDate)', () => {
    const provider = createProvider();
    const resource = {
      resourceType: 'Patient',
      birthDate: '1990-01-15',
    };
    const params = [makeSP({
      code: 'birthdate',
      type: 'date',
      base: ['Patient'],
      expression: 'Patient.birthDate',
    })];

    const result = provider.extractSearchValues(resource, params);
    expect(result.birthdate).toBeDefined();
    expect(result.birthdate).toContain('1990-01-15');
  });

  it('extracts token value from plain string (Patient.gender)', () => {
    const provider = createProvider();
    const resource = {
      resourceType: 'Patient',
      gender: 'male',
    };
    const params = [makeSP({
      code: 'gender',
      type: 'token',
      base: ['Patient'],
      expression: 'Patient.gender',
    })];

    const result = provider.extractSearchValues(resource, params);
    expect(result.gender).toBeDefined();
    // Token values should include system|code format
    const genderValues = result.gender as string[];
    expect(genderValues.some(v => v.includes('male'))).toBe(true);
  });

  it('extracts token value from CodeableConcept (Observation.code)', () => {
    const provider = createProvider();
    const resource = {
      resourceType: 'Observation',
      code: {
        coding: [
          { system: 'http://loinc.org', code: '12345-6', display: 'Test' },
        ],
      },
    };
    const params = [makeSP({
      code: 'code',
      type: 'token',
      base: ['Observation'],
      expression: 'Observation.code',
    })];

    const result = provider.extractSearchValues(resource, params);
    expect(result.code).toBeDefined();
    const codeValues = result.code as string[];
    expect(codeValues.some(v => v.includes('http://loinc.org|12345-6'))).toBe(true);
  });

  it('extracts reference value (Observation.subject)', () => {
    const provider = createProvider();
    const resource = {
      resourceType: 'Observation',
      subject: { reference: 'Patient/123' },
    };
    const params = [makeSP({
      code: 'subject',
      type: 'reference',
      base: ['Observation'],
      expression: 'Observation.subject',
      target: ['Patient'],
    })];

    const result = provider.extractSearchValues(resource, params);
    expect(result.subject).toBeDefined();
    expect(result.subject).toContain('Patient/123');
  });

  it('returns empty for missing values', () => {
    const provider = createProvider();
    const resource = { resourceType: 'Patient' };
    const params = [makeSP({
      code: 'birthdate',
      type: 'date',
      base: ['Patient'],
      expression: 'Patient.birthDate',
    })];

    const result = provider.extractSearchValues(resource, params);
    expect(result.birthdate).toBeUndefined();
  });

  it('handles multiple search params at once', () => {
    const provider = createProvider();
    const resource = {
      resourceType: 'Patient',
      birthDate: '1990-01-15',
      gender: 'female',
      name: [{ family: 'Doe' }],
    };
    const params = [
      makeSP({ code: 'birthdate', type: 'date', base: ['Patient'], expression: 'Patient.birthDate' }),
      makeSP({ code: 'gender', type: 'token', base: ['Patient'], expression: 'Patient.gender' }),
      makeSP({ code: 'family', type: 'string', base: ['Patient'], expression: 'Patient.name.family' }),
    ];

    const result = provider.extractSearchValues(resource, params);
    expect(result.birthdate).toBeDefined();
    expect(result.gender).toBeDefined();
    expect(result.family).toBeDefined();
  });

  it('skips params without expression', () => {
    const provider = createProvider();
    const resource = { resourceType: 'Patient', gender: 'male' };
    const params = [makeSP({ code: 'gender', type: 'token', base: ['Patient'] })]; // no expression

    const result = provider.extractSearchValues(resource, params);
    expect(Object.keys(result)).toHaveLength(0);
  });
});

// =============================================================================
// Section 2: extractReferences
// =============================================================================

describe('FhirRuntimeProvider — extractReferences', () => {
  it('extracts references from resource', () => {
    const provider = createProvider();
    const resource = {
      resourceType: 'Observation',
      subject: { reference: 'Patient/123' },
      performer: [{ reference: 'Practitioner/456' }],
    };
    const params = [
      makeSP({ code: 'subject', type: 'reference', base: ['Observation'], expression: 'Observation.subject', target: ['Patient'] }),
      makeSP({ code: 'performer', type: 'reference', base: ['Observation'], expression: 'Observation.performer', target: ['Practitioner'] }),
    ];

    const refs = provider.extractReferences(resource, params);
    expect(refs.length).toBeGreaterThanOrEqual(2);

    const subjectRef = refs.find(r => r.targetType === 'Patient');
    expect(subjectRef).toBeDefined();
    expect(subjectRef!.targetId).toBe('123');
    expect(subjectRef!.reference).toBe('Patient/123');

    const performerRef = refs.find(r => r.targetType === 'Practitioner');
    expect(performerRef).toBeDefined();
    expect(performerRef!.targetId).toBe('456');
  });

  it('skips contained references', () => {
    const provider = createProvider();
    const resource = {
      resourceType: 'Observation',
      subject: { reference: '#contained-1' },
    };
    const params = [
      makeSP({ code: 'subject', type: 'reference', base: ['Observation'], expression: 'Observation.subject' }),
    ];

    const refs = provider.extractReferences(resource, params);
    expect(refs.length).toBe(0);
  });

  it('returns empty for resource with no references', () => {
    const provider = createProvider();
    const resource = {
      resourceType: 'Patient',
      gender: 'male',
    };
    const params = [
      makeSP({ code: 'general-practitioner', type: 'reference', base: ['Patient'], expression: 'Patient.generalPractitioner' }),
    ];

    const refs = provider.extractReferences(resource, params);
    expect(refs).toHaveLength(0);
  });
});

// =============================================================================
// Section 3: Factory function
// =============================================================================

describe('FhirRuntimeProvider — factory', () => {
  it('createFhirRuntimeProvider creates a valid provider', () => {
    const provider = createFhirRuntimeProvider({
      extractSearchValues,
      extractAllSearchValues,
      extractReferences,
    });

    expect(provider).toBeInstanceOf(FhirRuntimeProvider);
    expect(typeof provider.extractSearchValues).toBe('function');
    expect(typeof provider.extractReferences).toBe('function');
  });
});
