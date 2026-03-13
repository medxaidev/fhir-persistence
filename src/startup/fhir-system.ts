/**
 * FhirSystem — Top-Level Startup Orchestrator (B4)
 *
 * Wires together all v2 modules into a complete FHIR persistence system:
 *
 * 1. **loadDefinitions** — DefinitionProvider → SD/SP Registries
 * 2. **syncSchema** — IGPersistenceManager → table creation/migration
 * 3. **createPersistence** — FhirPersistence(adapter, registry, runtimeProvider)
 *
 * ADR-01 §4.1: Startup flow
 * ADR-03: StorageAdapter abstraction
 * ADR-04: IG database strategy
 *
 * @module fhir-persistence/startup
 */

import type { StorageAdapter } from '../db/adapter.js';
import type { DDLDialect } from '../schema/ddl-generator.js';
import type { DefinitionProvider, SearchParameterDef } from '../providers/definition-provider.js';
import type { RuntimeProvider } from '../providers/runtime-provider.js';
import { StructureDefinitionRegistry } from '../registry/structure-definition-registry.js';
import { SearchParameterRegistry } from '../registry/search-parameter-registry.js';
import type { SearchParameterBundle } from '../registry/search-parameter-registry.js';
import { buildResourceTableSet } from '../schema/table-schema-builder.js';
import { IGPersistenceManager } from '../migration/ig-persistence-manager.js';
import type { IGInitResult } from '../migration/ig-persistence-manager.js';
import { FhirPersistence } from '../store/fhir-persistence.js';
import type { ResourceTableSet } from '../schema/table-schema.js';

// =============================================================================
// Section 1: Types
// =============================================================================

export interface FhirSystemOptions {
  /** SQL dialect (default: 'sqlite'). */
  dialect?: DDLDialect;
  /** Optional RuntimeProvider for FHIRPath-driven extraction. */
  runtimeProvider?: RuntimeProvider;
  /** Enable lookup tables in the indexing pipeline (default: true). */
  enableLookupTables?: boolean;
  /** Enable reference indexing (default: true). */
  enableReferences?: boolean;
  /** Package name for IG persistence tracking (default: 'fhir-persistence.default'). */
  packageName?: string;
  /** Package version (default: '1.0.0'). */
  packageVersion?: string;
}

export interface FhirSystemReady {
  /** The initialized FhirPersistence facade. */
  persistence: FhirPersistence;
  /** StructureDefinition registry (populated from DefinitionProvider). */
  sdRegistry: StructureDefinitionRegistry;
  /** SearchParameter registry (populated from DefinitionProvider). */
  spRegistry: SearchParameterRegistry;
  /** IG initialization result (new/upgrade/consistent). */
  igResult: IGInitResult;
  /** Resource types with tables. */
  resourceTypes: string[];
}

// =============================================================================
// Section 2: FhirSystem Class
// =============================================================================

export class FhirSystem {
  private readonly adapter: StorageAdapter;
  private readonly dialect: DDLDialect;
  private readonly options: FhirSystemOptions;

  constructor(adapter: StorageAdapter, options?: FhirSystemOptions) {
    this.adapter = adapter;
    this.dialect = options?.dialect ?? 'sqlite';
    this.options = options ?? {};
  }

  /**
   * Initialize the full FHIR persistence system.
   *
   * Flow (ADR-01 §4.1):
   * ```
   * DefinitionProvider
   *   → populate SD/SP registries
   *   → buildResourceTableSets
   *   → IGPersistenceManager.initialize (DDL + migration)
   *   → FhirPersistence(adapter, spRegistry, { runtimeProvider })
   * ```
   */
  async initialize(definitionProvider: DefinitionProvider): Promise<FhirSystemReady> {
    // Step 1: Populate registries from DefinitionProvider
    const { sdRegistry, spRegistry } = this.populateRegistries(definitionProvider);

    // Step 2: Get resource types that need tables
    const resourceTypes = sdRegistry.getTableResourceTypes();

    // Step 3: Build table sets for all resource types
    const tableSets = this.buildTableSets(resourceTypes, sdRegistry, spRegistry);

    // Step 4: Compute checksum from table sets for change detection
    const checksum = this.computeChecksum(tableSets);

    // Step 5: Sync schema via IGPersistenceManager
    const igManager = new IGPersistenceManager(this.adapter, this.dialect);
    const igResult = await igManager.initialize({
      name: this.options.packageName ?? 'fhir-persistence.default',
      version: this.options.packageVersion ?? '1.0.0',
      checksum,
      tableSets,
    });

    // Step 6: Create FhirPersistence facade with optional RuntimeProvider
    const persistence = new FhirPersistence(this.adapter, spRegistry, {
      indexing: {
        enableLookupTables: this.options.enableLookupTables,
        enableReferences: this.options.enableReferences,
        runtimeProvider: this.options.runtimeProvider,
      },
    });

    return {
      persistence,
      sdRegistry,
      spRegistry,
      igResult,
      resourceTypes,
    };
  }

  // ---------------------------------------------------------------------------
  // Private: Populate registries from DefinitionProvider
  // ---------------------------------------------------------------------------

  /**
   * Bridge DefinitionProvider → StructureDefinitionRegistry + SearchParameterRegistry.
   *
   * Converts DefinitionProvider's minimal types to the existing registry
   * types expected by the schema builder and indexing pipeline.
   */
  private populateRegistries(dp: DefinitionProvider): {
    sdRegistry: StructureDefinitionRegistry;
    spRegistry: SearchParameterRegistry;
  } {
    const sdRegistry = new StructureDefinitionRegistry();
    const spRegistry = new SearchParameterRegistry();

    // Populate SD registry — convert StructureDefinitionDef → CanonicalProfile
    const resourceTypes = dp.getAllResourceTypes();
    for (const rt of resourceTypes) {
      const sd = dp.getStructureDefinition(
        `http://hl7.org/fhir/StructureDefinition/${rt}`,
      );
      // Register as CanonicalProfile (structural typing)
      sdRegistry.index({
        url: sd?.url ?? `http://hl7.org/fhir/StructureDefinition/${rt}`,
        name: sd?.name ?? rt,
        kind: (sd?.kind ?? 'resource') as 'resource' | 'complex-type' | 'primitive-type',
        type: sd?.type ?? rt,
        abstract: false,
        elements: new Map(),
      });
    }

    // Populate SP registry via indexBundle
    const allSPs: SearchParameterDef[] = [];
    for (const rt of resourceTypes) {
      const sps = dp.getSearchParameters(rt);
      for (const sp of sps) {
        // Avoid duplicates (multi-base SP may appear for multiple RTs)
        if (!allSPs.some(existing => existing.code === sp.code && existing.expression === sp.expression)) {
          allSPs.push(sp);
        }
      }
    }

    // Convert to Bundle format for SearchParameterRegistry.indexBundle()
    const bundle: SearchParameterBundle = {
      resourceType: 'Bundle',
      entry: allSPs.map(sp => ({
        resource: {
          resourceType: 'SearchParameter' as const,
          code: sp.code,
          type: sp.type,
          base: sp.base,
          expression: sp.expression,
          url: sp.url,
          name: sp.name,
          target: sp.target,
        },
      })),
    };
    spRegistry.indexBundle(bundle);

    return { sdRegistry, spRegistry };
  }

  // ---------------------------------------------------------------------------
  // Private: Build table sets
  // ---------------------------------------------------------------------------

  private buildTableSets(
    resourceTypes: string[],
    sdRegistry: StructureDefinitionRegistry,
    spRegistry: SearchParameterRegistry,
  ): ResourceTableSet[] {
    const tableSets: ResourceTableSet[] = [];
    for (const rt of resourceTypes) {
      try {
        const ts = buildResourceTableSet(rt, sdRegistry, spRegistry);
        tableSets.push(ts);
      } catch {
        // Skip resource types that can't build table sets (abstract, non-resource)
      }
    }
    return tableSets;
  }

  // ---------------------------------------------------------------------------
  // Private: Compute checksum
  // ---------------------------------------------------------------------------

  /**
   * Simple checksum from table set structure for change detection.
   * Uses JSON serialization of table schemas (column names + types).
   */
  private computeChecksum(tableSets: ResourceTableSet[]): string {
    const fingerprint = tableSets.map(ts => ({
      rt: ts.resourceType,
      cols: ts.main.columns.map(c => `${c.name}:${c.type}`).sort(),
      idx: ts.main.indexes.map(i => i.name).sort(),
    }));
    const json = JSON.stringify(fingerprint);
    // Simple hash — sufficient for change detection
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
      const chr = json.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32-bit integer
    }
    return `sha256:${Math.abs(hash).toString(16).padStart(8, '0')}`;
  }
}
