/**
 * FhirPersistence — v2 End-to-End Facade
 *
 * Top-level entry point that wires together all v2 modules into a single
 * cohesive API. Manages the full lifecycle:
 *
 * 1. **Startup** — Initialize StorageAdapter, run IG migrations, create tables
 * 2. **CRUD** — Create/Read/Update/Delete with automatic search indexing
 * 3. **Search** — Execute FHIR search queries via SearchExecutor
 * 4. **Indexing** — Search columns + References + Lookup tables
 *
 * Design decisions:
 * - Single constructor with StorageAdapter + SearchParameterRegistry
 * - CRUD operations automatically index via IndexingPipeline
 * - Search columns merged into main table row on create/update
 * - References and lookup rows written as side effects
 * - Soft delete clears index data (references + lookup rows)
 * - All writes transactional via StorageAdapter
 *
 * @module fhir-persistence/store
 */

import { randomUUID } from 'node:crypto';
import type { StorageAdapter } from '../db/adapter.js';
import type { SearchParameterRegistry, SearchParameterImpl } from '../registry/search-parameter-registry.js';
import type {
  FhirResource,
  PersistedResource,
  HistoryEntry,
  ResourceRowV2,
  HistoryRowV2,
} from '../repo/types.js';
import {
  ResourceNotFoundError,
  ResourceGoneError,
  ResourceVersionConflictError,
} from '../repo/errors.js';
import {
  buildInsertMainSQLv2,
  buildUpdateMainSQLv2,
  buildInsertHistorySQLv2,
  buildSelectByIdSQLv2,
  buildSelectVersionSQLv2,
  buildInstanceHistorySQLv2,
} from '../repo/sql-builder.js';
import { IndexingPipeline } from '../repo/indexing-pipeline.js';
import type { IndexingPipelineOptions } from '../repo/indexing-pipeline.js';

// =============================================================================
// Section 1: Options
// =============================================================================

export interface CreateResourceOptions {
  /** Pre-assigned ID (used in batch/transaction). */
  assignedId?: string;
}

export interface UpdateResourceOptions {
  /** Expected versionId for optimistic locking (If-Match header). */
  ifMatch?: string;
}

export interface HistoryOptions {
  since?: string;
  count?: number;
  cursor?: string;
}

export interface FhirPersistenceOptions {
  /** Indexing pipeline options. */
  indexing?: IndexingPipelineOptions;
}

// =============================================================================
// Section 2: FhirPersistence Class
// =============================================================================

export class FhirPersistence {
  private readonly adapter: StorageAdapter;
  private readonly registry: SearchParameterRegistry;
  private readonly pipeline: IndexingPipeline;

  constructor(
    adapter: StorageAdapter,
    registry: SearchParameterRegistry,
    options?: FhirPersistenceOptions,
  ) {
    this.adapter = adapter;
    this.registry = registry;
    this.pipeline = new IndexingPipeline(adapter, options?.indexing);
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  /** Get the underlying StorageAdapter. */
  getAdapter(): StorageAdapter { return this.adapter; }

  /** Get the SearchParameterRegistry. */
  getRegistry(): SearchParameterRegistry { return this.registry; }

  /** Get the IndexingPipeline. */
  getPipeline(): IndexingPipeline { return this.pipeline; }

  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------

  async createResource<T extends FhirResource>(
    resourceType: string,
    resource: T,
    options?: CreateResourceOptions,
  ): Promise<T & PersistedResource> {
    const now = new Date().toISOString();
    const id = options?.assignedId ?? resource.id ?? randomUUID();
    const versionId = randomUUID();

    const persisted = {
      ...resource,
      resourceType,
      id,
      meta: {
        ...resource.meta,
        versionId,
        lastUpdated: now,
      },
    } as T & PersistedResource;

    // Get search parameter impls for this resource type
    const impls = this.getImpls(resourceType);

    // Run indexing pipeline (extract search columns + references + lookup rows)
    const indexResult = await this.pipeline.indexResource(resourceType, persisted, impls);

    const content = JSON.stringify(persisted);

    // Build main row with search columns merged
    const mainRow: Record<string, unknown> = {
      id,
      versionId,
      content,
      lastUpdated: now,
      deleted: 0,
      _source: persisted.meta?.source ?? null,
      _profile: persisted.meta?.profile ? JSON.stringify(persisted.meta.profile) : null,
      ...indexResult.searchColumns,
    };

    const historyRow: HistoryRowV2 = {
      id,
      versionId,
      content,
      lastUpdated: now,
      deleted: 0,
    };

    await this.adapter.transaction((tx) => {
      const mainSQL = buildInsertMainSQLv2(resourceType, mainRow);
      tx.execute(mainSQL.sql, mainSQL.values);

      const histSQL = buildInsertHistorySQLv2(`${resourceType}_History`, historyRow);
      tx.execute(histSQL.sql, histSQL.values);
    });

    return persisted;
  }

  // ---------------------------------------------------------------------------
  // READ
  // ---------------------------------------------------------------------------

  async readResource(resourceType: string, id: string): Promise<PersistedResource> {
    const sql = buildSelectByIdSQLv2(resourceType);
    const row = await this.adapter.queryOne<{
      id: string;
      versionId: string;
      content: string;
      deleted: number;
      lastUpdated: string;
    }>(sql, [id]);

    if (!row) {
      throw new ResourceNotFoundError(resourceType, id);
    }
    if (row.deleted === 1) {
      throw new ResourceGoneError(resourceType, id);
    }

    return JSON.parse(row.content) as PersistedResource;
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------

  async updateResource<T extends FhirResource>(
    resourceType: string,
    resource: T,
    options?: UpdateResourceOptions,
  ): Promise<T & PersistedResource> {
    const id = resource.id;
    if (!id) {
      throw new Error('Resource must have an id for update');
    }

    // Read current version for optimistic locking
    const selectSQL = buildSelectByIdSQLv2(resourceType);
    const current = await this.adapter.queryOne<{
      id: string;
      versionId: string;
      content: string;
      deleted: number;
    }>(selectSQL, [id]);

    if (!current) {
      throw new ResourceNotFoundError(resourceType, id);
    }
    if (current.deleted === 1) {
      throw new ResourceGoneError(resourceType, id);
    }

    // Optimistic locking check
    if (options?.ifMatch) {
      const expected = options.ifMatch.replace(/^W\/"/, '').replace(/"$/, '');
      if (expected !== current.versionId) {
        throw new ResourceVersionConflictError(
          resourceType,
          id,
          expected,
          current.versionId,
        );
      }
    }

    const now = new Date().toISOString();
    const versionId = randomUUID();

    const persisted = {
      ...resource,
      resourceType,
      id,
      meta: {
        ...resource.meta,
        versionId,
        lastUpdated: now,
      },
    } as T & PersistedResource;

    // Re-index
    const impls = this.getImpls(resourceType);
    const indexResult = await this.pipeline.indexResource(resourceType, persisted, impls);

    const content = JSON.stringify(persisted);

    const mainRow: Record<string, unknown> = {
      id,
      versionId,
      content,
      lastUpdated: now,
      deleted: 0,
      _source: persisted.meta?.source ?? null,
      _profile: persisted.meta?.profile ? JSON.stringify(persisted.meta.profile) : null,
      ...indexResult.searchColumns,
    };

    const historyRow: HistoryRowV2 = {
      id,
      versionId,
      content,
      lastUpdated: now,
      deleted: 0,
    };

    await this.adapter.transaction((tx) => {
      const updateSQL = buildUpdateMainSQLv2(resourceType, mainRow);
      tx.execute(updateSQL.sql, updateSQL.values);

      const histSQL = buildInsertHistorySQLv2(`${resourceType}_History`, historyRow);
      tx.execute(histSQL.sql, histSQL.values);
    });

    return persisted;
  }

  // ---------------------------------------------------------------------------
  // DELETE (soft)
  // ---------------------------------------------------------------------------

  async deleteResource(resourceType: string, id: string): Promise<void> {
    const selectSQL = buildSelectByIdSQLv2(resourceType);
    const current = await this.adapter.queryOne<{
      id: string;
      versionId: string;
      content: string;
      deleted: number;
    }>(selectSQL, [id]);

    if (!current) {
      throw new ResourceNotFoundError(resourceType, id);
    }
    if (current.deleted === 1) {
      throw new ResourceGoneError(resourceType, id);
    }

    const now = new Date().toISOString();
    const versionId = randomUUID();

    const deleteRow: ResourceRowV2 = {
      id,
      versionId,
      content: current.content,
      lastUpdated: now,
      deleted: 1,
    };

    const historyRow: HistoryRowV2 = {
      id,
      versionId,
      content: current.content,
      lastUpdated: now,
      deleted: 1,
    };

    // Clear index data
    await this.pipeline.deleteIndex(resourceType, id);

    await this.adapter.transaction((tx) => {
      const updateSQL = buildUpdateMainSQLv2(resourceType, deleteRow);
      tx.execute(updateSQL.sql, updateSQL.values);

      const histSQL = buildInsertHistorySQLv2(`${resourceType}_History`, historyRow);
      tx.execute(histSQL.sql, histSQL.values);
    });
  }

  // ---------------------------------------------------------------------------
  // READ VERSION (vread)
  // ---------------------------------------------------------------------------

  async readVersion(
    resourceType: string,
    id: string,
    versionId: string,
  ): Promise<PersistedResource> {
    const sql = buildSelectVersionSQLv2(`${resourceType}_History`);
    const row = await this.adapter.queryOne<{
      content: string;
      deleted: number;
    }>(sql, [id, versionId]);

    if (!row) {
      throw new ResourceNotFoundError(resourceType, id);
    }

    return JSON.parse(row.content) as PersistedResource;
  }

  // ---------------------------------------------------------------------------
  // HISTORY
  // ---------------------------------------------------------------------------

  async readHistory(
    resourceType: string,
    id: string,
    options?: HistoryOptions,
  ): Promise<HistoryEntry[]> {
    const { sql, values } = buildInstanceHistorySQLv2(
      `${resourceType}_History`,
      id,
      options,
    );

    const rows = await this.adapter.query<{
      id: string;
      versionId: string;
      lastUpdated: string;
      content: string;
      deleted: number;
    }>(sql, values);

    return rows.map((row) => ({
      id: row.id,
      versionId: row.versionId,
      lastUpdated: row.lastUpdated,
      deleted: row.deleted === 1,
      resourceType,
      resource: row.deleted === 1 ? null : (JSON.parse(row.content) as PersistedResource),
    }));
  }

  // ---------------------------------------------------------------------------
  // SEARCH (streaming)
  // ---------------------------------------------------------------------------

  /**
   * Stream search results row-by-row for large result sets.
   *
   * Uses `StorageAdapter.queryStream` for true row-by-row iteration
   * without loading all results into memory. Useful for:
   * - Export operations ($export)
   * - Reindex-all workflows
   * - Large batch processing
   *
   * NOTE: Does NOT include _include/_revinclude resources.
   * Use `searchResources` for full FHIR search with includes.
   */
  async *searchStream(
    resourceType: string,
    sql: string,
    params: unknown[] = [],
  ): AsyncGenerator<PersistedResource> {
    for await (const row of this.adapter.queryStream<{
      content: string;
      deleted: number;
    }>(sql, params)) {
      if (row.deleted === 1) continue;
      if (!row.content) continue;
      try {
        yield JSON.parse(row.content) as PersistedResource;
      } catch {
        // Skip invalid JSON
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Re-index a single resource
  // ---------------------------------------------------------------------------

  /**
   * Re-index an existing resource (update search columns + references + lookup).
   * Does NOT create a new version.
   */
  async reindexResource(resourceType: string, id: string): Promise<void> {
    const resource = await this.readResource(resourceType, id);
    const impls = this.getImpls(resourceType);
    const indexResult = await this.pipeline.indexResource(resourceType, resource, impls);

    // Update search columns in main table
    const updateRow: Record<string, unknown> = {
      id,
      ...indexResult.searchColumns,
    };

    const updateSQL = buildUpdateMainSQLv2(resourceType, updateRow);
    await this.adapter.execute(updateSQL.sql, updateSQL.values);
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private getImpls(resourceType: string): SearchParameterImpl[] {
    return this.registry.getForResource(resourceType);
  }
}
