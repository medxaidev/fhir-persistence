/**
 * Tests for FhirDefinitionBridge — Direction A: Real fhir-definition Integration
 *
 * Covers:
 * - Bridging fhir-definition's InMemoryDefinitionRegistry to DefinitionProvider
 * - getStructureDefinition / getValueSet / getCodeSystem / getSearchParameters
 * - getAllResourceTypes from registered SDs
 * - getLoadedPackages from registry
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDefinitionRegistry } from 'fhir-definition';
import { FhirDefinitionBridge } from '../../providers/fhir-definition-provider.js';

// =============================================================================
// Section 1: Basic bridging
// =============================================================================

describe('FhirDefinitionBridge', () => {
  it('bridges getStructureDefinition', () => {
    const registry = new InMemoryDefinitionRegistry();
    registry.register({
      resourceType: 'StructureDefinition',
      url: 'http://hl7.org/fhir/StructureDefinition/Patient',
      name: 'Patient',
      kind: 'resource',
      type: 'Patient',
      abstract: false,
      status: 'active',
    });

    const bridge = new FhirDefinitionBridge(registry);
    const sd = bridge.getStructureDefinition('http://hl7.org/fhir/StructureDefinition/Patient');
    expect(sd).toBeDefined();
    expect(sd!.url).toBe('http://hl7.org/fhir/StructureDefinition/Patient');
    expect(sd!.name).toBe('Patient');
  });

  it('returns undefined for missing SD', () => {
    const registry = new InMemoryDefinitionRegistry();
    const bridge = new FhirDefinitionBridge(registry);
    expect(bridge.getStructureDefinition('http://nonexistent')).toBeUndefined();
  });

  it('bridges getSearchParameters', () => {
    const registry = new InMemoryDefinitionRegistry();
    registry.register({
      resourceType: 'SearchParameter',
      url: 'http://hl7.org/fhir/SearchParameter/Patient-birthdate',
      name: 'birthdate',
      code: 'birthdate',
      type: 'date',
      base: ['Patient'],
      expression: 'Patient.birthDate',
      status: 'active',
    });

    const bridge = new FhirDefinitionBridge(registry);
    const sps = bridge.getSearchParameters('Patient');
    expect(sps.length).toBeGreaterThanOrEqual(1);
    const bd = sps.find(sp => sp.code === 'birthdate');
    expect(bd).toBeDefined();
    expect(bd!.type).toBe('date');
    expect(bd!.expression).toBe('Patient.birthDate');
  });

  it('bridges getValueSet', () => {
    const registry = new InMemoryDefinitionRegistry();
    registry.register({
      resourceType: 'ValueSet',
      url: 'http://hl7.org/fhir/ValueSet/administrative-gender',
      name: 'AdministrativeGender',
      status: 'active',
    });

    const bridge = new FhirDefinitionBridge(registry);
    const vs = bridge.getValueSet('http://hl7.org/fhir/ValueSet/administrative-gender');
    expect(vs).toBeDefined();
    expect(vs!.url).toBe('http://hl7.org/fhir/ValueSet/administrative-gender');
  });

  it('bridges getCodeSystem', () => {
    const registry = new InMemoryDefinitionRegistry();
    registry.register({
      resourceType: 'CodeSystem',
      url: 'http://hl7.org/fhir/administrative-gender',
      name: 'AdministrativeGender',
      status: 'active',
      content: 'complete',
    });

    const bridge = new FhirDefinitionBridge(registry);
    const cs = bridge.getCodeSystem('http://hl7.org/fhir/administrative-gender');
    expect(cs).toBeDefined();
    expect(cs!.url).toBe('http://hl7.org/fhir/administrative-gender');
  });

  it('getAllResourceTypes returns registered resource types', () => {
    const registry = new InMemoryDefinitionRegistry();
    registry.register({
      resourceType: 'StructureDefinition',
      url: 'http://hl7.org/fhir/StructureDefinition/Patient',
      name: 'Patient',
      kind: 'resource',
      type: 'Patient',
      abstract: false,
      status: 'active',
    });
    registry.register({
      resourceType: 'StructureDefinition',
      url: 'http://hl7.org/fhir/StructureDefinition/Observation',
      name: 'Observation',
      kind: 'resource',
      type: 'Observation',
      abstract: false,
      status: 'active',
    });

    const bridge = new FhirDefinitionBridge(registry);
    const types = bridge.getAllResourceTypes();
    expect(types).toContain('Patient');
    expect(types).toContain('Observation');
  });

  it('getAllResourceTypes excludes abstract types', () => {
    const registry = new InMemoryDefinitionRegistry();
    registry.register({
      resourceType: 'StructureDefinition',
      url: 'http://hl7.org/fhir/StructureDefinition/Resource',
      name: 'Resource',
      kind: 'resource',
      type: 'Resource',
      abstract: true,
      status: 'active',
    });
    registry.register({
      resourceType: 'StructureDefinition',
      url: 'http://hl7.org/fhir/StructureDefinition/Patient',
      name: 'Patient',
      kind: 'resource',
      type: 'Patient',
      abstract: false,
      status: 'active',
    });

    const bridge = new FhirDefinitionBridge(registry);
    const types = bridge.getAllResourceTypes();
    expect(types).not.toContain('Resource');
    expect(types).toContain('Patient');
  });

  it('getLoadedPackages returns registered packages', () => {
    const registry = new InMemoryDefinitionRegistry();
    registry.registerPackage({
      name: 'hl7.fhir.r4.core',
      version: '4.0.1',
      path: '/tmp/packages/hl7.fhir.r4.core',
      definitionCount: 100,
      loadedAt: new Date().toISOString(),
    } as any);

    const bridge = new FhirDefinitionBridge(registry);
    const pkgs = bridge.getLoadedPackages();
    expect(pkgs.length).toBeGreaterThanOrEqual(1);
    const core = pkgs.find(p => p.name === 'hl7.fhir.r4.core');
    expect(core).toBeDefined();
    expect(core!.version).toBe('4.0.1');
  });
});
