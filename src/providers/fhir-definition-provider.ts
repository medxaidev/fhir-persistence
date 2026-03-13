/**
 * FhirDefinitionBridge — Real fhir-definition Integration
 *
 * Wraps the actual `fhir-definition` package's `DefinitionRegistry`
 * (or `InMemoryDefinitionRegistry`) into the `DefinitionProvider`
 * interface used by `FhirSystem`.
 *
 * This bridges fhir-definition's concrete types into our minimal
 * structural types, maintaining the one-way dependency principle.
 *
 * ADR-01 §2.3: DefinitionProvider wraps fhir-definition, never
 * exposing fhir-definition types to the rest of fhir-persistence.
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
// Section 1: Structural types for fhir-definition
// =============================================================================

/**
 * Structural type matching fhir-definition's DefinitionRegistry.
 * Uses `any` for return types to bridge between fhir-definition's
 * concrete types and our minimal structural types.
 */
interface FhirDefinitionRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getStructureDefinition(url: string): any | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValueSet(url: string): any | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCodeSystem(url: string): any | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSearchParameters(resourceType: string): any[];
  listStructureDefinitions(): string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLoadedPackages?(): any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getStatistics?(): any;
}

// =============================================================================
// Section 2: FhirDefinitionBridge
// =============================================================================

/**
 * Bridges a fhir-definition DefinitionRegistry into our DefinitionProvider.
 *
 * Usage:
 * ```typescript
 * import { loadDefinitionPackages } from 'fhir-definition';
 *
 * const { registry } = await loadDefinitionPackages({ ... });
 * const provider = new FhirDefinitionBridge(registry);
 *
 * // Use with FhirSystem
 * const system = new FhirSystem(adapter);
 * await system.initialize(provider);
 * ```
 */
export class FhirDefinitionBridge implements DefinitionProvider {
  private readonly registry: FhirDefinitionRegistry;
  private cachedResourceTypes: string[] | null = null;

  constructor(registry: FhirDefinitionRegistry) {
    this.registry = registry;
  }

  // ---------------------------------------------------------------------------
  // DefinitionProvider interface
  // ---------------------------------------------------------------------------

  getStructureDefinition(url: string): StructureDefinitionDef | undefined {
    const sd = this.registry.getStructureDefinition(url);
    if (!sd) return undefined;
    return sd as StructureDefinitionDef;
  }

  getValueSet(url: string): ValueSetDef | undefined {
    const vs = this.registry.getValueSet(url);
    if (!vs) return undefined;
    return vs as ValueSetDef;
  }

  getCodeSystem(url: string): CodeSystemDef | undefined {
    const cs = this.registry.getCodeSystem(url);
    if (!cs) return undefined;
    return cs as CodeSystemDef;
  }

  getSearchParameters(resourceType: string): SearchParameterDef[] {
    const sps = this.registry.getSearchParameters(resourceType);
    return sps.map((sp: Record<string, unknown>) => ({
      resourceType: 'SearchParameter' as const,
      url: sp.url as string | undefined,
      name: sp.name as string | undefined,
      code: sp.code as string,
      type: sp.type as SearchParameterDef['type'],
      base: sp.base as string[],
      expression: sp.expression as string | undefined,
      target: sp.target as string[] | undefined,
    }));
  }

  getAllResourceTypes(): string[] {
    if (this.cachedResourceTypes) return this.cachedResourceTypes;

    // Extract resource types from registered StructureDefinitions
    const urls = this.registry.listStructureDefinitions();
    const types: string[] = [];

    for (const url of urls) {
      const sd = this.registry.getStructureDefinition(url);
      if (sd && sd.kind === 'resource' && sd.type && !sd.abstract) {
        types.push(sd.type as string);
      }
    }

    this.cachedResourceTypes = types;
    return types;
  }

  getLoadedPackages(): LoadedPackageDef[] {
    if (!this.registry.getLoadedPackages) return [];
    const pkgs = this.registry.getLoadedPackages();
    return pkgs.map((pkg: Record<string, unknown>) => ({
      name: pkg.name as string,
      version: pkg.version as string,
      loadedAt: pkg.loadedAt as string | undefined,
      resourceCount: pkg.resourceCount as number | undefined,
    }));
  }
}
