/**
 * DefinitionProvider — Bridge Interface for fhir-definition
 *
 * Abstracts the `fhir-definition` registry so that `fhir-persistence`
 * never imports `fhir-definition` types directly. This enables:
 *
 * - Testing with in-memory mocks (no IG package loading)
 * - Swapping fhir-definition versions without touching persistence code
 * - Structural typing compatibility (duck typing)
 *
 * ADR-01 §2.3: DefinitionProvider interface contract.
 *
 * @module fhir-persistence/providers
 */

// =============================================================================
// Section 1: FHIR Definition Types (minimal shapes)
// =============================================================================

/**
 * Minimal StructureDefinition shape used by fhir-persistence.
 * Only the fields that fhir-persistence reads are declared.
 */
export interface StructureDefinitionDef {
  resourceType: 'StructureDefinition';
  url: string;
  name?: string;
  type?: string;
  kind?: string;
  snapshot?: {
    element?: Array<{
      path?: string;
      type?: Array<{ code?: string }>;
      [key: string]: unknown;
    }>;
  };
  [key: string]: unknown;
}

/**
 * Minimal ValueSet shape used by fhir-persistence.
 */
export interface ValueSetDef {
  resourceType: 'ValueSet';
  url: string;
  name?: string;
  status?: string;
  compose?: unknown;
  expansion?: unknown;
  [key: string]: unknown;
}

/**
 * Minimal CodeSystem shape used by fhir-persistence.
 */
export interface CodeSystemDef {
  resourceType: 'CodeSystem';
  url: string;
  name?: string;
  status?: string;
  content?: string;
  concept?: Array<{
    code: string;
    display?: string;
    definition?: string;
    concept?: unknown[];
  }>;
  [key: string]: unknown;
}

/**
 * Minimal SearchParameter shape used by fhir-persistence.
 */
export interface SearchParameterDef {
  resourceType: 'SearchParameter';
  url?: string;
  name?: string;
  code: string;
  type: 'number' | 'date' | 'string' | 'token' | 'reference' | 'composite' | 'quantity' | 'uri' | 'special';
  base: string[];
  expression?: string;
  target?: string[];
  [key: string]: unknown;
}

/**
 * Loaded package metadata.
 */
export interface LoadedPackageDef {
  name: string;
  version: string;
  loadedAt?: string;
  resourceCount?: number;
}

// =============================================================================
// Section 2: DefinitionProvider Interface
// =============================================================================

/**
 * Bridge interface for fhir-definition registry.
 *
 * fhir-persistence depends only on this interface, never on
 * fhir-definition internal types. Implementations may wrap
 * `InMemoryDefinitionRegistry` or provide test-only mocks.
 *
 * ADR-01 §2.3 — structural typing, no `implements` required.
 */
export interface DefinitionProvider {
  /**
   * Get a StructureDefinition by canonical URL.
   */
  getStructureDefinition(url: string): StructureDefinitionDef | undefined;

  /**
   * Get a ValueSet by canonical URL.
   */
  getValueSet(url: string): ValueSetDef | undefined;

  /**
   * Get a CodeSystem by canonical URL.
   */
  getCodeSystem(url: string): CodeSystemDef | undefined;

  /**
   * Get all SearchParameters for a specific resource type.
   */
  getSearchParameters(resourceType: string): SearchParameterDef[];

  /**
   * Enumerate all known resource types.
   * Used by SchemaEngine and ReindexCLI to iterate over all tables.
   */
  getAllResourceTypes(): string[];

  /**
   * Get metadata about loaded packages (optional).
   */
  getLoadedPackages?(): LoadedPackageDef[];
}
