/**
 * InMemoryDefinitionProvider — Test/Development Implementation
 *
 * Stores StructureDefinitions, SearchParameters, ValueSets, and CodeSystems
 * in memory. Useful for:
 *
 * - Unit tests (no IG package loading required)
 * - Development (quick iteration without fhir-definition dependency)
 * - Integration tests with controlled definition sets
 *
 * @module fhir-persistence/providers
 */

import type {
  DefinitionProvider,
  StructureDefinitionDef,
  ValueSetDef,
  CodeSystemDef,
  SearchParameterDef,
  LoadedPackageDef,
} from './definition-provider.js';

// =============================================================================
// Section 1: InMemoryDefinitionProvider
// =============================================================================

export class InMemoryDefinitionProvider implements DefinitionProvider {
  private readonly structureDefinitions = new Map<string, StructureDefinitionDef>();
  private readonly valueSets = new Map<string, ValueSetDef>();
  private readonly codeSystems = new Map<string, CodeSystemDef>();
  private readonly searchParams = new Map<string, SearchParameterDef[]>(); // resourceType → SP[]
  private readonly resourceTypes = new Set<string>();
  private readonly packages: LoadedPackageDef[] = [];

  // ---------------------------------------------------------------------------
  // DefinitionProvider interface
  // ---------------------------------------------------------------------------

  getStructureDefinition(url: string): StructureDefinitionDef | undefined {
    return this.structureDefinitions.get(url);
  }

  getValueSet(url: string): ValueSetDef | undefined {
    return this.valueSets.get(url);
  }

  getCodeSystem(url: string): CodeSystemDef | undefined {
    return this.codeSystems.get(url);
  }

  getSearchParameters(resourceType: string): SearchParameterDef[] {
    return this.searchParams.get(resourceType) ?? [];
  }

  getAllResourceTypes(): string[] {
    return Array.from(this.resourceTypes);
  }

  getLoadedPackages(): LoadedPackageDef[] {
    return [...this.packages];
  }

  // ---------------------------------------------------------------------------
  // Mutation methods (for test setup)
  // ---------------------------------------------------------------------------

  /**
   * Register a StructureDefinition.
   */
  addStructureDefinition(sd: StructureDefinitionDef): void {
    this.structureDefinitions.set(sd.url, sd);
    // If it's a resource type SD (kind=resource), register the type
    if (sd.kind === 'resource' && sd.type) {
      this.resourceTypes.add(sd.type);
    }
  }

  /**
   * Register a SearchParameter for one or more resource types.
   */
  addSearchParameter(sp: SearchParameterDef): void {
    for (const base of sp.base) {
      const existing = this.searchParams.get(base) ?? [];
      // Avoid duplicates by code
      if (!existing.some(e => e.code === sp.code)) {
        existing.push(sp);
      }
      this.searchParams.set(base, existing);
      this.resourceTypes.add(base);
    }
  }

  /**
   * Register a ValueSet.
   */
  addValueSet(vs: ValueSetDef): void {
    this.valueSets.set(vs.url, vs);
  }

  /**
   * Register a CodeSystem.
   */
  addCodeSystem(cs: CodeSystemDef): void {
    this.codeSystems.set(cs.url, cs);
  }

  /**
   * Register a loaded package (metadata only).
   */
  addPackage(pkg: LoadedPackageDef): void {
    this.packages.push(pkg);
  }

  /**
   * Bulk-load SearchParameters from a FHIR Bundle-like structure.
   * Compatible with SearchParameterRegistry.indexBundle() input format.
   */
  indexBundle(bundle: {
    resourceType: 'Bundle';
    entry?: Array<{ resource?: SearchParameterDef }>;
  }): void {
    if (!bundle.entry) return;
    for (const entry of bundle.entry) {
      if (entry.resource?.resourceType === 'SearchParameter') {
        this.addSearchParameter(entry.resource);
      }
    }
  }

  /**
   * Clear all stored definitions.
   */
  clear(): void {
    this.structureDefinitions.clear();
    this.valueSets.clear();
    this.codeSystems.clear();
    this.searchParams.clear();
    this.resourceTypes.clear();
    this.packages.length = 0;
  }

  /**
   * Get statistics about stored definitions.
   */
  getStatistics(): {
    structureDefinitions: number;
    searchParameters: number;
    valueSets: number;
    codeSystems: number;
    resourceTypes: number;
  } {
    let spCount = 0;
    for (const sps of this.searchParams.values()) {
      spCount += sps.length;
    }
    return {
      structureDefinitions: this.structureDefinitions.size,
      searchParameters: spCount,
      valueSets: this.valueSets.size,
      codeSystems: this.codeSystems.size,
      resourceTypes: this.resourceTypes.size,
    };
  }
}
