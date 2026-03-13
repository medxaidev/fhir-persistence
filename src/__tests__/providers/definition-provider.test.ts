/**
 * B1: DefinitionProvider Bridge Tests
 *
 * Verifies the DefinitionProvider interface and InMemoryDefinitionProvider
 * implementation against ADR-01 §2.3 requirements.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDefinitionProvider } from '../../providers/in-memory-definition-provider.js';
import type {
  DefinitionProvider,
  StructureDefinitionDef,
  SearchParameterDef,
  ValueSetDef,
  CodeSystemDef,
} from '../../providers/definition-provider.js';

// =============================================================================
// Shared fixtures
// =============================================================================

function createPatientSD(): StructureDefinitionDef {
  return {
    resourceType: 'StructureDefinition',
    url: 'http://hl7.org/fhir/StructureDefinition/Patient',
    name: 'Patient',
    type: 'Patient',
    kind: 'resource',
  };
}

function createObservationSD(): StructureDefinitionDef {
  return {
    resourceType: 'StructureDefinition',
    url: 'http://hl7.org/fhir/StructureDefinition/Observation',
    name: 'Observation',
    type: 'Observation',
    kind: 'resource',
  };
}

function createPatientSPs(): SearchParameterDef[] {
  return [
    {
      resourceType: 'SearchParameter',
      url: 'http://hl7.org/fhir/SearchParameter/Patient-birthdate',
      name: 'birthdate',
      code: 'birthdate',
      type: 'date',
      base: ['Patient'],
      expression: 'Patient.birthDate',
    },
    {
      resourceType: 'SearchParameter',
      url: 'http://hl7.org/fhir/SearchParameter/Patient-gender',
      name: 'gender',
      code: 'gender',
      type: 'token',
      base: ['Patient'],
      expression: 'Patient.gender',
    },
    {
      resourceType: 'SearchParameter',
      url: 'http://hl7.org/fhir/SearchParameter/Patient-name',
      name: 'name',
      code: 'name',
      type: 'string',
      base: ['Patient'],
      expression: 'Patient.name',
    },
  ];
}

function createObservationSPs(): SearchParameterDef[] {
  return [
    {
      resourceType: 'SearchParameter',
      url: 'http://hl7.org/fhir/SearchParameter/Observation-subject',
      name: 'subject',
      code: 'subject',
      type: 'reference',
      base: ['Observation'],
      expression: 'Observation.subject',
      target: ['Patient', 'Group'],
    },
    {
      resourceType: 'SearchParameter',
      url: 'http://hl7.org/fhir/SearchParameter/Observation-code',
      name: 'code',
      code: 'code',
      type: 'token',
      base: ['Observation'],
      expression: 'Observation.code',
    },
  ];
}

// =============================================================================
// Tests
// =============================================================================

describe('B1: DefinitionProvider Interface', () => {
  let provider: InMemoryDefinitionProvider;

  beforeEach(() => {
    provider = new InMemoryDefinitionProvider();
  });

  // ---------------------------------------------------------------------------
  // ADR-01 §2.3: Interface contract
  // ---------------------------------------------------------------------------

  describe('ADR-01 §2.3: Interface contract', () => {
    it('implements DefinitionProvider interface', () => {
      // Structural typing check — InMemoryDefinitionProvider satisfies DefinitionProvider
      const dp: DefinitionProvider = provider;
      expect(dp.getStructureDefinition).toBeTypeOf('function');
      expect(dp.getValueSet).toBeTypeOf('function');
      expect(dp.getCodeSystem).toBeTypeOf('function');
      expect(dp.getSearchParameters).toBeTypeOf('function');
      expect(dp.getAllResourceTypes).toBeTypeOf('function');
    });

    it('getLoadedPackages is optional in interface', () => {
      // The interface declares getLoadedPackages as optional
      const dp: DefinitionProvider = provider;
      expect(dp.getLoadedPackages).toBeTypeOf('function');
    });
  });

  // ---------------------------------------------------------------------------
  // StructureDefinition operations
  // ---------------------------------------------------------------------------

  describe('StructureDefinition', () => {
    it('returns undefined for unknown SD', () => {
      expect(provider.getStructureDefinition('http://unknown')).toBeUndefined();
    });

    it('stores and retrieves SD by URL', () => {
      const sd = createPatientSD();
      provider.addStructureDefinition(sd);
      const result = provider.getStructureDefinition(sd.url);
      expect(result).toBeDefined();
      expect(result!.name).toBe('Patient');
      expect(result!.type).toBe('Patient');
    });

    it('registers resource type from kind=resource SD', () => {
      provider.addStructureDefinition(createPatientSD());
      provider.addStructureDefinition(createObservationSD());
      const types = provider.getAllResourceTypes();
      expect(types).toContain('Patient');
      expect(types).toContain('Observation');
    });

    it('does not register non-resource SDs as resource types', () => {
      provider.addStructureDefinition({
        resourceType: 'StructureDefinition',
        url: 'http://hl7.org/fhir/StructureDefinition/HumanName',
        name: 'HumanName',
        type: 'HumanName',
        kind: 'complex-type',
      });
      expect(provider.getAllResourceTypes()).not.toContain('HumanName');
    });
  });

  // ---------------------------------------------------------------------------
  // SearchParameter operations
  // ---------------------------------------------------------------------------

  describe('SearchParameter', () => {
    it('returns empty array for unknown resource type', () => {
      expect(provider.getSearchParameters('Unknown')).toEqual([]);
    });

    it('stores and retrieves SPs by resource type', () => {
      for (const sp of createPatientSPs()) {
        provider.addSearchParameter(sp);
      }
      const sps = provider.getSearchParameters('Patient');
      expect(sps).toHaveLength(3);
      expect(sps.map(s => s.code).sort()).toEqual(['birthdate', 'gender', 'name']);
    });

    it('SPs for different resource types are isolated', () => {
      for (const sp of createPatientSPs()) {
        provider.addSearchParameter(sp);
      }
      for (const sp of createObservationSPs()) {
        provider.addSearchParameter(sp);
      }
      expect(provider.getSearchParameters('Patient')).toHaveLength(3);
      expect(provider.getSearchParameters('Observation')).toHaveLength(2);
    });

    it('avoids duplicate SPs by code', () => {
      const sp = createPatientSPs()[0];
      provider.addSearchParameter(sp);
      provider.addSearchParameter(sp); // duplicate
      expect(provider.getSearchParameters('Patient')).toHaveLength(1);
    });

    it('multi-base SPs are registered for each base type', () => {
      provider.addSearchParameter({
        resourceType: 'SearchParameter',
        code: 'date',
        type: 'date',
        base: ['Observation', 'DiagnosticReport'],
        expression: 'Observation.effectiveDateTime | DiagnosticReport.effectiveDateTime',
      });
      expect(provider.getSearchParameters('Observation')).toHaveLength(1);
      expect(provider.getSearchParameters('DiagnosticReport')).toHaveLength(1);
    });

    it('addSearchParameter registers resource types', () => {
      provider.addSearchParameter(createPatientSPs()[0]);
      expect(provider.getAllResourceTypes()).toContain('Patient');
    });
  });

  // ---------------------------------------------------------------------------
  // ValueSet & CodeSystem
  // ---------------------------------------------------------------------------

  describe('ValueSet & CodeSystem', () => {
    it('stores and retrieves ValueSet by URL', () => {
      const vs: ValueSetDef = {
        resourceType: 'ValueSet',
        url: 'http://hl7.org/fhir/ValueSet/gender',
        name: 'AdministrativeGender',
        status: 'active',
      };
      provider.addValueSet(vs);
      const result = provider.getValueSet(vs.url);
      expect(result).toBeDefined();
      expect(result!.name).toBe('AdministrativeGender');
    });

    it('returns undefined for unknown ValueSet', () => {
      expect(provider.getValueSet('http://unknown')).toBeUndefined();
    });

    it('stores and retrieves CodeSystem by URL', () => {
      const cs: CodeSystemDef = {
        resourceType: 'CodeSystem',
        url: 'http://hl7.org/fhir/gender',
        name: 'AdministrativeGender',
        status: 'active',
        content: 'complete',
        concept: [
          { code: 'male', display: 'Male' },
          { code: 'female', display: 'Female' },
        ],
      };
      provider.addCodeSystem(cs);
      const result = provider.getCodeSystem(cs.url);
      expect(result).toBeDefined();
      expect(result!.concept).toHaveLength(2);
    });

    it('returns undefined for unknown CodeSystem', () => {
      expect(provider.getCodeSystem('http://unknown')).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // indexBundle (bulk loading)
  // ---------------------------------------------------------------------------

  describe('indexBundle', () => {
    it('loads SPs from a Bundle structure', () => {
      provider.indexBundle({
        resourceType: 'Bundle',
        entry: [
          { resource: createPatientSPs()[0] },
          { resource: createPatientSPs()[1] },
          { resource: createObservationSPs()[0] },
        ],
      });
      expect(provider.getSearchParameters('Patient')).toHaveLength(2);
      expect(provider.getSearchParameters('Observation')).toHaveLength(1);
    });

    it('handles empty bundle', () => {
      provider.indexBundle({ resourceType: 'Bundle' });
      expect(provider.getAllResourceTypes()).toHaveLength(0);
    });

    it('ignores entries without resource', () => {
      provider.indexBundle({
        resourceType: 'Bundle',
        entry: [{ resource: undefined }],
      });
      expect(provider.getAllResourceTypes()).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Package metadata
  // ---------------------------------------------------------------------------

  describe('Package metadata', () => {
    it('stores and retrieves loaded packages', () => {
      provider.addPackage({ name: 'hl7.fhir.r4.core', version: '4.0.1' });
      provider.addPackage({ name: 'medxai.core', version: '1.0.0' });
      const pkgs = provider.getLoadedPackages();
      expect(pkgs).toHaveLength(2);
      expect(pkgs[0].name).toBe('hl7.fhir.r4.core');
      expect(pkgs[1].name).toBe('medxai.core');
    });

    it('returns empty array when no packages loaded', () => {
      expect(provider.getLoadedPackages()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Statistics & Clear
  // ---------------------------------------------------------------------------

  describe('Statistics & Clear', () => {
    it('reports correct statistics', () => {
      provider.addStructureDefinition(createPatientSD());
      for (const sp of createPatientSPs()) {
        provider.addSearchParameter(sp);
      }
      provider.addValueSet({
        resourceType: 'ValueSet',
        url: 'http://hl7.org/fhir/ValueSet/gender',
      });
      provider.addCodeSystem({
        resourceType: 'CodeSystem',
        url: 'http://hl7.org/fhir/gender',
      });

      const stats = provider.getStatistics();
      expect(stats.structureDefinitions).toBe(1);
      expect(stats.searchParameters).toBe(3);
      expect(stats.valueSets).toBe(1);
      expect(stats.codeSystems).toBe(1);
      expect(stats.resourceTypes).toBe(1); // Patient
    });

    it('clear removes all definitions', () => {
      provider.addStructureDefinition(createPatientSD());
      for (const sp of createPatientSPs()) {
        provider.addSearchParameter(sp);
      }
      provider.addPackage({ name: 'test', version: '1.0.0' });

      provider.clear();

      expect(provider.getStructureDefinition(createPatientSD().url)).toBeUndefined();
      expect(provider.getSearchParameters('Patient')).toEqual([]);
      expect(provider.getAllResourceTypes()).toHaveLength(0);
      expect(provider.getLoadedPackages()).toEqual([]);
    });
  });
});
