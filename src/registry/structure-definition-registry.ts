/**
 * StructureDefinition Registry
 *
 * Indexes `CanonicalProfile[]` by resource type for fast lookup.
 * MedXAI equivalent of Medplum's `indexStructureDefinitionBundle()` →
 * `DATA_TYPES`, but as an injectable instance (no global state).
 *
 * Used by `TableSchemaBuilder` to determine which resource types
 * need tables and to access element definitions for search column
 * generation.
 *
 * @module fhir-persistence/registry
 */

import type { CanonicalProfile } from '@medxai/fhir-core';

// =============================================================================
// Section 1: StructureDefinitionRegistry
// =============================================================================

/**
 * Indexes CanonicalProfile instances by their `type` field for O(1) lookup.
 *
 * ## Usage
 *
 * ```typescript
 * const registry = new StructureDefinitionRegistry();
 * const profiles = loadBundleFromFile('profiles-resources.json').profiles;
 * registry.indexAll(profiles);
 *
 * const patient = registry.get('Patient');
 * const tableTypes = registry.getTableResourceTypes(); // ~140+ types
 * ```
 */
export class StructureDefinitionRegistry {
  private readonly profiles = new Map<string, CanonicalProfile>();

  /**
   * Index a single CanonicalProfile by its `type` field.
   *
   * If a profile with the same type already exists, it is overwritten
   * (later definitions override earlier ones, matching BundleLoader
   * merge semantics).
   */
  index(profile: CanonicalProfile): void {
    this.profiles.set(profile.type, profile);
  }

  /**
   * Index multiple CanonicalProfiles.
   *
   * Profiles are indexed in order; later entries override earlier
   * ones with the same type.
   */
  indexAll(profiles: readonly CanonicalProfile[]): void {
    for (const profile of profiles) {
      this.index(profile);
    }
  }

  /**
   * Get a profile by resource type name.
   *
   * @param resourceType - The FHIR resource type (e.g., `'Patient'`).
   * @returns The CanonicalProfile, or `undefined` if not indexed.
   */
  get(resourceType: string): CanonicalProfile | undefined {
    return this.profiles.get(resourceType);
  }

  /**
   * Check if a resource type is indexed.
   */
  has(resourceType: string): boolean {
    return this.profiles.has(resourceType);
  }

  /**
   * Get all resource types that should have database tables.
   *
   * Returns types where `kind === 'resource'` AND `abstract === false`.
   * This excludes:
   * - Abstract types (Resource, DomainResource)
   * - Complex types (HumanName, Address)
   * - Primitive types (string, boolean)
   * - Logical models
   *
   * Results are sorted alphabetically for deterministic output.
   */
  getTableResourceTypes(): string[] {
    return Array.from(this.profiles.values())
      .filter((p) => p.kind === 'resource' && p.abstract === false)
      .map((p) => p.type)
      .sort();
  }

  /**
   * Get all indexed type names (regardless of kind or abstract).
   */
  getAllTypes(): string[] {
    return Array.from(this.profiles.keys()).sort();
  }

  /**
   * Get the number of indexed profiles.
   */
  get size(): number {
    return this.profiles.size;
  }

  /**
   * Remove all indexed profiles.
   */
  clear(): void {
    this.profiles.clear();
  }
}
