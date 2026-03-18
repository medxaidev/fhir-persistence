/**
 * IG Import Orchestrator (B2)
 *
 * Coordinates all conformance repositories to execute a complete
 * IG import pipeline. Accepts optional fhir-runtime extraction
 * functions for element indexing, SD dependency extraction, and
 * concept hierarchy flattening.
 *
 * @module fhir-persistence/conformance
 */

import type { StorageAdapter } from '../db/adapter.js';
import type { DDLDialect } from '../schema/ddl-generator.js';
import { IGResourceMapRepo } from './ig-resource-map-repo.js';
import type { IGResourceMapEntry } from './ig-resource-map-repo.js';
import { SDIndexRepo } from './sd-index-repo.js';
import type { SDIndexEntry } from './sd-index-repo.js';
import { ElementIndexRepo } from './element-index-repo.js';
import type { ElementIndexEntry } from './element-index-repo.js';
import { ExpansionCacheRepo } from './expansion-cache-repo.js';
import { ConceptHierarchyRepo } from './concept-hierarchy-repo.js';
import type { ConceptHierarchyEntry } from './concept-hierarchy-repo.js';
import { SearchParamIndexRepo } from './search-param-index-repo.js';
import type { SearchParamIndexEntry } from './search-param-index-repo.js';

// =============================================================================
// Section 1: Types
// =============================================================================

/** A minimal FHIR Bundle shape for IG import. */
interface FhirBundle {
  resourceType: 'Bundle';
  entry?: Array<{
    resource?: Record<string, unknown>;
  }>;
}

export interface IGImportOptions {
  /** Extract element index rows from a StructureDefinition (from fhir-runtime). */
  extractElementIndex?: (sd: Record<string, unknown>) => Omit<ElementIndexEntry, 'structureId'>[];
  /** Extract SD dependencies (from fhir-runtime). */
  extractDependencies?: (sd: Record<string, unknown>) => string[];
  /** Flatten concept hierarchy from a CodeSystem (from fhir-runtime). */
  flattenConcepts?: (cs: Record<string, unknown>) => ConceptHierarchyEntry[];
}

export interface IGImportResult {
  igId: string;
  resourceCount: number;
  sdIndexCount: number;
  elementIndexCount: number;
  conceptCount: number;
  spIndexCount: number;
  errors: string[];
}

// =============================================================================
// Section 2: IGImportOrchestrator
// =============================================================================

export class IGImportOrchestrator {
  private readonly resourceMapRepo: IGResourceMapRepo;
  private readonly sdIndexRepo: SDIndexRepo;
  private readonly elementIndexRepo: ElementIndexRepo;
  private readonly expansionCacheRepo: ExpansionCacheRepo;
  private readonly conceptRepo: ConceptHierarchyRepo;
  private readonly spIndexRepo: SearchParamIndexRepo;
  private readonly opts: IGImportOptions;

  constructor(
    adapter: StorageAdapter,
    dialect: DDLDialect = 'sqlite',
    options?: IGImportOptions,
  ) {
    this.resourceMapRepo = new IGResourceMapRepo(adapter, dialect);
    this.sdIndexRepo = new SDIndexRepo(adapter, dialect);
    this.elementIndexRepo = new ElementIndexRepo(adapter, dialect);
    this.expansionCacheRepo = new ExpansionCacheRepo(adapter, dialect);
    this.conceptRepo = new ConceptHierarchyRepo(adapter, dialect);
    this.spIndexRepo = new SearchParamIndexRepo(adapter, dialect);
    this.opts = options ?? {};
  }

  /** Ensure all conformance tables exist. */
  async ensureAllTables(): Promise<void> {
    await this.resourceMapRepo.ensureTable();
    await this.sdIndexRepo.ensureTable();
    await this.elementIndexRepo.ensureTable();
    await this.expansionCacheRepo.ensureTable();
    await this.conceptRepo.ensureTable();
    await this.spIndexRepo.ensureTable();
  }

  /** Execute a complete IG import from a FHIR Bundle. */
  async importIG(igId: string, bundle: FhirBundle): Promise<IGImportResult> {
    await this.ensureAllTables();

    const result: IGImportResult = {
      igId,
      resourceCount: 0,
      sdIndexCount: 0,
      elementIndexCount: 0,
      conceptCount: 0,
      spIndexCount: 0,
      errors: [],
    };

    const entries = bundle.entry ?? [];
    const resourceMapEntries: Omit<IGResourceMapEntry, 'igId'>[] = [];
    const structureDefs: Record<string, unknown>[] = [];
    const codeSystems: Record<string, unknown>[] = [];
    const searchParams: Record<string, unknown>[] = [];

    // Step 1: Collect resources and build resource map entries
    for (const entry of entries) {
      const resource = entry.resource;
      if (!resource || !resource.resourceType || !resource.id) continue;

      const resourceType = resource.resourceType as string;
      const resourceId = resource.id as string;

      const mapEntry: Omit<IGResourceMapEntry, 'igId'> = {
        resourceType,
        resourceId,
        resourceUrl: (resource.url as string) ?? undefined,
        resourceName: (resource.name as string) ?? undefined,
      };

      if (resourceType === 'StructureDefinition') {
        mapEntry.baseType = (resource.type as string) ?? undefined;
        structureDefs.push(resource);
      } else if (resourceType === 'CodeSystem') {
        codeSystems.push(resource);
      } else if (resourceType === 'SearchParameter') {
        searchParams.push(resource);
      }

      resourceMapEntries.push(mapEntry);
    }

    // Step 2: Write resource map
    try {
      result.resourceCount = await this.resourceMapRepo.batchInsert(igId, resourceMapEntries);
    } catch (err) {
      result.errors.push(`Resource map insert failed: ${String(err)}`);
    }

    // Step 3: Process StructureDefinitions
    for (const sd of structureDefs) {
      try {
        const sdEntry: SDIndexEntry = {
          id: sd.id as string,
          url: (sd.url as string) ?? undefined,
          version: (sd.version as string) ?? undefined,
          type: (sd.type as string) ?? undefined,
          kind: (sd.kind as string) ?? undefined,
          baseDefinition: (sd.baseDefinition as string) ?? undefined,
          derivation: (sd.derivation as string) ?? undefined,
        };
        await this.sdIndexRepo.upsert(sdEntry);
        result.sdIndexCount++;

        // Extract element indexes if function provided
        if (this.opts.extractElementIndex) {
          const elements = this.opts.extractElementIndex(sd);
          const count = await this.elementIndexRepo.batchInsert(sd.id as string, elements);
          result.elementIndexCount += count;
        }
      } catch (err) {
        result.errors.push(`SD processing failed for ${sd.id}: ${String(err)}`);
      }
    }

    // Step 4: Process CodeSystems
    for (const cs of codeSystems) {
      try {
        if (this.opts.flattenConcepts) {
          const concepts = this.opts.flattenConcepts(cs);
          const count = await this.conceptRepo.batchInsert(concepts);
          result.conceptCount += count;
        }
      } catch (err) {
        result.errors.push(`CodeSystem processing failed for ${cs.id}: ${String(err)}`);
      }
    }

    // Step 5: Process SearchParameters
    for (const sp of searchParams) {
      try {
        const spEntry: SearchParamIndexEntry = {
          id: sp.id as string,
          igId,
          url: (sp.url as string) ?? undefined,
          code: (sp.code as string) ?? '',
          type: (sp.type as string) ?? '',
          base: Array.isArray(sp.base) ? (sp.base as string[]) : [],
          expression: (sp.expression as string) ?? undefined,
        };
        await this.spIndexRepo.upsert(spEntry);
        result.spIndexCount++;
      } catch (err) {
        result.errors.push(`SearchParameter processing failed for ${sp.id}: ${String(err)}`);
      }
    }

    return result;
  }

  /** Get individual repos for direct access. */
  get repos() {
    return {
      resourceMap: this.resourceMapRepo,
      sdIndex: this.sdIndexRepo,
      elementIndex: this.elementIndexRepo,
      expansionCache: this.expansionCacheRepo,
      conceptHierarchy: this.conceptRepo,
      searchParamIndex: this.spIndexRepo,
    };
  }
}
