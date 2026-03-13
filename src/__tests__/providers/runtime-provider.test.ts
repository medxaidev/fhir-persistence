/**
 * B2: RuntimeProvider Bridge Tests
 *
 * Verifies the RuntimeProvider interface and PropertyPathRuntimeProvider
 * implementation against ADR-01 §4.1b requirements.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PropertyPathRuntimeProvider } from '../../providers/property-path-runtime-provider.js';
import type { RuntimeProvider, ExtractedReference } from '../../providers/runtime-provider.js';
import type { SearchParameterDef } from '../../providers/definition-provider.js';

// =============================================================================
// Shared fixtures
// =============================================================================

const PATIENT_SPS: SearchParameterDef[] = [
  {
    resourceType: 'SearchParameter',
    code: 'birthdate',
    type: 'date',
    base: ['Patient'],
    expression: 'Patient.birthDate',
  },
  {
    resourceType: 'SearchParameter',
    code: 'gender',
    type: 'token',
    base: ['Patient'],
    expression: 'Patient.gender',
  },
  {
    resourceType: 'SearchParameter',
    code: 'active',
    type: 'token',
    base: ['Patient'],
    expression: 'Patient.active',
  },
  {
    resourceType: 'SearchParameter',
    code: 'general-practitioner',
    type: 'reference',
    base: ['Patient'],
    expression: 'Patient.generalPractitioner',
    target: ['Practitioner', 'Organization'],
  },
];

const OBSERVATION_SPS: SearchParameterDef[] = [
  {
    resourceType: 'SearchParameter',
    code: 'subject',
    type: 'reference',
    base: ['Observation'],
    expression: 'Observation.subject',
    target: ['Patient', 'Group'],
  },
  {
    resourceType: 'SearchParameter',
    code: 'code',
    type: 'token',
    base: ['Observation'],
    expression: 'Observation.code',
  },
  {
    resourceType: 'SearchParameter',
    code: 'status',
    type: 'token',
    base: ['Observation'],
    expression: 'Observation.status',
  },
  {
    resourceType: 'SearchParameter',
    code: 'date',
    type: 'date',
    base: ['Observation'],
    expression: 'Observation.effectiveDateTime',
  },
];

// =============================================================================
// Tests
// =============================================================================

describe('B2: RuntimeProvider Interface', () => {
  let provider: PropertyPathRuntimeProvider;

  beforeEach(() => {
    provider = new PropertyPathRuntimeProvider();
  });

  // ---------------------------------------------------------------------------
  // ADR-01 §4.1b: Interface contract
  // ---------------------------------------------------------------------------

  describe('ADR-01 §4.1b: Interface contract', () => {
    it('implements RuntimeProvider interface', () => {
      const rp: RuntimeProvider = provider;
      expect(rp.extractSearchValues).toBeTypeOf('function');
      expect(rp.extractReferences).toBeTypeOf('function');
    });

    it('validate is optional', () => {
      const rp: RuntimeProvider = provider;
      expect(rp.validate).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // extractSearchValues — date type
  // ---------------------------------------------------------------------------

  describe('extractSearchValues — date', () => {
    it('extracts birthDate from Patient', () => {
      const patient = {
        resourceType: 'Patient',
        birthDate: '1990-01-15',
      };
      const result = provider.extractSearchValues(patient, PATIENT_SPS);
      expect(result.birthdate).toEqual(['1990-01-15']);
    });

    it('extracts effectiveDateTime from Observation', () => {
      const obs = {
        resourceType: 'Observation',
        effectiveDateTime: '2024-06-01T10:00:00Z',
      };
      const result = provider.extractSearchValues(obs, OBSERVATION_SPS);
      expect(result.date).toEqual(['2024-06-01T10:00:00Z']);
    });

    it('returns empty for missing date field', () => {
      const patient = { resourceType: 'Patient' };
      const result = provider.extractSearchValues(patient, PATIENT_SPS);
      expect(result.birthdate).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // extractSearchValues — token type
  // ---------------------------------------------------------------------------

  describe('extractSearchValues — token (string values)', () => {
    it('extracts plain string token (gender)', () => {
      const patient = {
        resourceType: 'Patient',
        gender: 'male',
      };
      const result = provider.extractSearchValues(patient, PATIENT_SPS);
      expect(result.gender).toEqual(['male']);
    });

    it('extracts boolean token (active)', () => {
      const patient = {
        resourceType: 'Patient',
        active: true,
      };
      const result = provider.extractSearchValues(patient, PATIENT_SPS);
      expect(result.active).toEqual(['true']);
    });

    it('extracts plain string token (status)', () => {
      const obs = {
        resourceType: 'Observation',
        status: 'final',
      };
      const result = provider.extractSearchValues(obs, OBSERVATION_SPS);
      expect(result.status).toEqual(['final']);
    });
  });

  describe('extractSearchValues — token (CodeableConcept)', () => {
    it('extracts system|code from CodeableConcept', () => {
      const obs = {
        resourceType: 'Observation',
        code: {
          coding: [
            { system: 'http://loinc.org', code: '8480-6', display: 'Systolic BP' },
          ],
        },
      };
      const result = provider.extractSearchValues(obs, OBSERVATION_SPS);
      expect(result.code).toContain('http://loinc.org|8480-6');
    });

    it('extracts multiple codings from CodeableConcept', () => {
      const obs = {
        resourceType: 'Observation',
        code: {
          coding: [
            { system: 'http://loinc.org', code: '8480-6' },
            { system: 'http://snomed.info/sct', code: '271649006' },
          ],
        },
      };
      const result = provider.extractSearchValues(obs, OBSERVATION_SPS);
      expect(result.code).toHaveLength(2);
      expect(result.code).toContain('http://loinc.org|8480-6');
      expect(result.code).toContain('http://snomed.info/sct|271649006');
    });

    it('extracts code without system (empty system prefix)', () => {
      const obs = {
        resourceType: 'Observation',
        code: {
          coding: [{ code: '8480-6' }],
        },
      };
      const result = provider.extractSearchValues(obs, OBSERVATION_SPS);
      expect(result.code).toContain('|8480-6');
    });
  });

  // ---------------------------------------------------------------------------
  // extractSearchValues — reference type
  // ---------------------------------------------------------------------------

  describe('extractSearchValues — reference', () => {
    it('extracts reference string from Reference object', () => {
      const obs = {
        resourceType: 'Observation',
        subject: { reference: 'Patient/123' },
      };
      const result = provider.extractSearchValues(obs, OBSERVATION_SPS);
      expect(result.subject).toEqual(['Patient/123']);
    });

    it('extracts reference from array of Reference objects', () => {
      const patient = {
        resourceType: 'Patient',
        generalPractitioner: [
          { reference: 'Practitioner/doc-1' },
          { reference: 'Organization/org-1' },
        ],
      };
      const result = provider.extractSearchValues(patient, PATIENT_SPS);
      expect(result['general-practitioner']).toEqual([
        'Practitioner/doc-1',
        'Organization/org-1',
      ]);
    });
  });

  // ---------------------------------------------------------------------------
  // extractSearchValues — edge cases
  // ---------------------------------------------------------------------------

  describe('extractSearchValues — edge cases', () => {
    it('returns empty object for resource without matching expressions', () => {
      const result = provider.extractSearchValues(
        { resourceType: 'Condition' },
        PATIENT_SPS,
      );
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('skips params without expression', () => {
      const result = provider.extractSearchValues(
        { resourceType: 'Patient', birthDate: '1990-01-01' },
        [{ resourceType: 'SearchParameter', code: 'test', type: 'string', base: ['Patient'] }],
      );
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('handles resource with no resourceType gracefully', () => {
      const result = provider.extractSearchValues({}, PATIENT_SPS);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // extractReferences
  // ---------------------------------------------------------------------------

  describe('extractReferences', () => {
    it('extracts single reference with correct targetType/targetId', () => {
      const obs = {
        resourceType: 'Observation',
        subject: { reference: 'Patient/p-1' },
      };
      const refs = provider.extractReferences(obs, OBSERVATION_SPS);
      expect(refs).toHaveLength(1);
      expect(refs[0]).toEqual({
        code: 'subject',
        reference: 'Patient/p-1',
        targetType: 'Patient',
        targetId: 'p-1',
      });
    });

    it('extracts multiple references from array', () => {
      const patient = {
        resourceType: 'Patient',
        generalPractitioner: [
          { reference: 'Practitioner/doc-1' },
          { reference: 'Organization/org-1' },
        ],
      };
      const refs = provider.extractReferences(patient, PATIENT_SPS);
      expect(refs).toHaveLength(2);
      expect(refs[0].targetType).toBe('Practitioner');
      expect(refs[0].targetId).toBe('doc-1');
      expect(refs[1].targetType).toBe('Organization');
      expect(refs[1].targetId).toBe('org-1');
    });

    it('skips non-reference params', () => {
      const patient = {
        resourceType: 'Patient',
        birthDate: '1990-01-15',
        gender: 'male',
      };
      const refs = provider.extractReferences(patient, PATIENT_SPS);
      expect(refs).toHaveLength(0);
    });

    it('skips contained references (#id)', () => {
      const obs = {
        resourceType: 'Observation',
        subject: { reference: '#contained-1' },
      };
      const refs = provider.extractReferences(obs, OBSERVATION_SPS);
      expect(refs).toHaveLength(0);
    });

    it('handles absolute URL references', () => {
      const obs = {
        resourceType: 'Observation',
        subject: { reference: 'https://other-server.com/fhir/Patient/p-1' },
      };
      const refs = provider.extractReferences(obs, OBSERVATION_SPS);
      expect(refs).toHaveLength(1);
      expect(refs[0].targetType).toBe('Patient');
      expect(refs[0].targetId).toBe('p-1');
    });

    it('returns empty for resource without references', () => {
      const obs = {
        resourceType: 'Observation',
        status: 'final',
      };
      const refs = provider.extractReferences(obs, OBSERVATION_SPS);
      expect(refs).toHaveLength(0);
    });

    it('returns empty for mismatched resource type', () => {
      const refs = provider.extractReferences(
        { resourceType: 'Condition' },
        OBSERVATION_SPS,
      );
      expect(refs).toHaveLength(0);
    });
  });
});
