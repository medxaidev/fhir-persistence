/**
 * Tests for StructureDefinitionRegistry — Task 8.2
 *
 * Covers:
 * - index/indexAll: basic indexing, overwrite semantics
 * - get/has: lookup by type
 * - getTableResourceTypes: filtering logic
 * - getAllTypes: all indexed types
 * - size/clear: state management
 * - Integration: real profiles-resources.json
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resolve } from 'node:path';

import { StructureDefinitionRegistry } from '../../registry/structure-definition-registry.js';
import { loadBundleFromFile } from '@medxai/fhir-core';
import type { CanonicalProfile } from '@medxai/fhir-core';

// =============================================================================
// Helpers
// =============================================================================

function specPath(filename: string): string {
  return resolve(__dirname, '..', '..', '..', '..', '..', 'spec', 'fhir', 'r4', filename);
}

/** Create a minimal CanonicalProfile for testing */
function makeProfile(overrides: Partial<CanonicalProfile> = {}): CanonicalProfile {
  return {
    url: 'http://hl7.org/fhir/StructureDefinition/Patient',
    name: 'Patient',
    kind: 'resource',
    type: 'Patient',
    abstract: false,
    elements: new Map(),
    ...overrides,
  };
}

// =============================================================================
// Section 1: Unit Tests
// =============================================================================

describe('StructureDefinitionRegistry', () => {
  let registry: StructureDefinitionRegistry;

  beforeEach(() => {
    registry = new StructureDefinitionRegistry();
  });

  // --- index / get / has ---

  it('indexes a profile and retrieves it by type', () => {
    const profile = makeProfile();
    registry.index(profile);
    expect(registry.get('Patient')).toBe(profile);
    expect(registry.has('Patient')).toBe(true);
  });

  it('returns undefined for unknown type', () => {
    expect(registry.get('Unknown')).toBeUndefined();
    expect(registry.has('Unknown')).toBe(false);
  });

  it('overwrites on duplicate type', () => {
    const v1 = makeProfile({ name: 'PatientV1' });
    const v2 = makeProfile({ name: 'PatientV2' });
    registry.index(v1);
    registry.index(v2);
    expect(registry.get('Patient')?.name).toBe('PatientV2');
    expect(registry.size).toBe(1);
  });

  // --- indexAll ---

  it('indexes multiple profiles at once', () => {
    const profiles = [
      makeProfile({ type: 'Patient', name: 'Patient' }),
      makeProfile({ type: 'Observation', name: 'Observation', url: 'http://hl7.org/fhir/StructureDefinition/Observation' }),
      makeProfile({ type: 'Condition', name: 'Condition', url: 'http://hl7.org/fhir/StructureDefinition/Condition' }),
    ];
    registry.indexAll(profiles);
    expect(registry.size).toBe(3);
    expect(registry.has('Patient')).toBe(true);
    expect(registry.has('Observation')).toBe(true);
    expect(registry.has('Condition')).toBe(true);
  });

  it('indexAll later entries override earlier for same type', () => {
    const profiles = [
      makeProfile({ type: 'Patient', name: 'PatientV1' }),
      makeProfile({ type: 'Patient', name: 'PatientV2' }),
    ];
    registry.indexAll(profiles);
    expect(registry.size).toBe(1);
    expect(registry.get('Patient')?.name).toBe('PatientV2');
  });

  // --- getTableResourceTypes ---

  it('getTableResourceTypes returns only non-abstract resources', () => {
    registry.indexAll([
      makeProfile({ type: 'Patient', kind: 'resource', abstract: false }),
      makeProfile({ type: 'Observation', kind: 'resource', abstract: false, url: 'http://hl7.org/fhir/StructureDefinition/Observation' }),
    ]);
    const types = registry.getTableResourceTypes();
    expect(types).toContain('Patient');
    expect(types).toContain('Observation');
  });

  it('getTableResourceTypes excludes abstract resources', () => {
    registry.indexAll([
      makeProfile({ type: 'Resource', kind: 'resource', abstract: true, url: 'http://hl7.org/fhir/StructureDefinition/Resource' }),
      makeProfile({ type: 'DomainResource', kind: 'resource', abstract: true, url: 'http://hl7.org/fhir/StructureDefinition/DomainResource' }),
      makeProfile({ type: 'Patient', kind: 'resource', abstract: false }),
    ]);
    const types = registry.getTableResourceTypes();
    expect(types).toEqual(['Patient']);
  });

  it('getTableResourceTypes excludes complex types', () => {
    registry.indexAll([
      makeProfile({ type: 'HumanName', kind: 'complex-type', abstract: false, url: 'http://hl7.org/fhir/StructureDefinition/HumanName' }),
      makeProfile({ type: 'Address', kind: 'complex-type', abstract: false, url: 'http://hl7.org/fhir/StructureDefinition/Address' }),
      makeProfile({ type: 'Patient', kind: 'resource', abstract: false }),
    ]);
    const types = registry.getTableResourceTypes();
    expect(types).toEqual(['Patient']);
  });

  it('getTableResourceTypes excludes primitive types', () => {
    registry.indexAll([
      makeProfile({ type: 'string', kind: 'primitive-type', abstract: false, url: 'http://hl7.org/fhir/StructureDefinition/string' }),
      makeProfile({ type: 'boolean', kind: 'primitive-type', abstract: false, url: 'http://hl7.org/fhir/StructureDefinition/boolean' }),
      makeProfile({ type: 'Patient', kind: 'resource', abstract: false }),
    ]);
    const types = registry.getTableResourceTypes();
    expect(types).toEqual(['Patient']);
  });

  it('getTableResourceTypes excludes logical models', () => {
    registry.indexAll([
      makeProfile({ type: 'MyLogical', kind: 'logical', abstract: false, url: 'http://example.org/MyLogical' }),
      makeProfile({ type: 'Patient', kind: 'resource', abstract: false }),
    ]);
    const types = registry.getTableResourceTypes();
    expect(types).toEqual(['Patient']);
  });

  it('getTableResourceTypes returns sorted results', () => {
    registry.indexAll([
      makeProfile({ type: 'Observation', kind: 'resource', abstract: false, url: 'http://hl7.org/fhir/StructureDefinition/Observation' }),
      makeProfile({ type: 'Patient', kind: 'resource', abstract: false }),
      makeProfile({ type: 'Condition', kind: 'resource', abstract: false, url: 'http://hl7.org/fhir/StructureDefinition/Condition' }),
    ]);
    const types = registry.getTableResourceTypes();
    expect(types).toEqual(['Condition', 'Observation', 'Patient']);
  });

  it('getTableResourceTypes returns empty array when no resources indexed', () => {
    expect(registry.getTableResourceTypes()).toEqual([]);
  });

  // --- getAllTypes ---

  it('getAllTypes returns all indexed types sorted', () => {
    registry.indexAll([
      makeProfile({ type: 'string', kind: 'primitive-type', abstract: false, url: 'http://hl7.org/fhir/StructureDefinition/string' }),
      makeProfile({ type: 'Patient', kind: 'resource', abstract: false }),
      makeProfile({ type: 'HumanName', kind: 'complex-type', abstract: false, url: 'http://hl7.org/fhir/StructureDefinition/HumanName' }),
    ]);
    expect(registry.getAllTypes()).toEqual(['HumanName', 'Patient', 'string']);
  });

  // --- size / clear ---

  it('size returns 0 for empty registry', () => {
    expect(registry.size).toBe(0);
  });

  it('clear removes all profiles', () => {
    registry.indexAll([
      makeProfile({ type: 'Patient' }),
      makeProfile({ type: 'Observation', url: 'http://hl7.org/fhir/StructureDefinition/Observation' }),
    ]);
    expect(registry.size).toBe(2);
    registry.clear();
    expect(registry.size).toBe(0);
    expect(registry.has('Patient')).toBe(false);
  });
});

// =============================================================================
// Section 2: Integration Tests (real spec files)
// =============================================================================

describe('StructureDefinitionRegistry — Integration', () => {
  it('indexes all profiles from profiles-resources.json', () => {
    const result = loadBundleFromFile(specPath('profiles-resources.json'));
    const registry = new StructureDefinitionRegistry();
    registry.indexAll(result.profiles);

    expect(registry.size).toBe(result.stats.loaded);
    expect(registry.has('Patient')).toBe(true);
    expect(registry.has('Observation')).toBe(true);
    expect(registry.has('Condition')).toBe(true);
    expect(registry.has('Binary')).toBe(true);
  });

  it('getTableResourceTypes returns ~140+ concrete resource types', () => {
    const result = loadBundleFromFile(specPath('profiles-resources.json'));
    const registry = new StructureDefinitionRegistry();
    registry.indexAll(result.profiles);

    const tableTypes = registry.getTableResourceTypes();
    expect(tableTypes.length).toBeGreaterThanOrEqual(140);

    // Should include concrete resources
    expect(tableTypes).toContain('Patient');
    expect(tableTypes).toContain('Observation');
    expect(tableTypes).toContain('Binary');

    // Should NOT include abstract resources
    expect(tableTypes).not.toContain('Resource');
    expect(tableTypes).not.toContain('DomainResource');
  });

  it('indexes profiles from multiple bundles', () => {
    const types = loadBundleFromFile(specPath('profiles-types.json'));
    const resources = loadBundleFromFile(specPath('profiles-resources.json'));
    const registry = new StructureDefinitionRegistry();
    registry.indexAll(types.profiles);
    registry.indexAll(resources.profiles);

    // Should have both types and resources
    expect(registry.has('string')).toBe(true);
    expect(registry.has('HumanName')).toBe(true);
    expect(registry.has('Patient')).toBe(true);
    // Some types overlap between bundles (e.g. Element, BackboneElement),
    // so combined size may be less than the arithmetic sum.
    expect(registry.size).toBeGreaterThanOrEqual(200);
    expect(registry.size).toBeLessThanOrEqual(types.stats.loaded + resources.stats.loaded);

    // Only resources should be table types
    const tableTypes = registry.getTableResourceTypes();
    expect(tableTypes).toContain('Patient');
    expect(tableTypes).not.toContain('string');
    expect(tableTypes).not.toContain('HumanName');
  });
});
