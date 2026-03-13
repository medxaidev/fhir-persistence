/**
 * FhirStore — v2 CRUD Facade
 *
 * Provides create / read / update / delete / history operations
 * against any StorageAdapter implementation (SQLite, PostgreSQL, etc.).
 *
 * Design decisions:
 * - Uses StorageAdapter interface (not DatabaseClient directly)
 * - All writes are transactional (BEGIN IMMEDIATE on SQLite)
 * - Soft delete: deleted=1, content preserved (ADR-08)
 * - Optimistic locking via versionId (If-Match / ETag)
 * - History ordered by versionSeq DESC
 * - No projectId (single-tenant)
 *
 * @module fhir-persistence/store
 */

import { randomUUID } from 'node:crypto';
import type { StorageAdapter } from '../db/adapter.js';
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
  buildDeleteReferencesSQLv2,
  buildInsertReferencesSQLv2,
  buildInstanceHistorySQLv2,
} from '../repo/sql-builder.js';
import type { ReferenceRowV2 } from '../repo/reference-indexer.js';

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

// =============================================================================
// Section 2: FhirStore Class
// =============================================================================

export class FhirStore {
  constructor(private readonly adapter: StorageAdapter) {}

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

    const content = JSON.stringify(persisted);

    const mainRow: ResourceRowV2 = {
      id,
      versionId,
      content,
      lastUpdated: now,
      deleted: 0,
      _source: persisted.meta?.source ?? null,
      _profile: persisted.meta?.profile ? JSON.stringify(persisted.meta.profile) : null,
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

    const content = JSON.stringify(persisted);

    const mainRow: ResourceRowV2 = {
      id,
      versionId,
      content,
      lastUpdated: now,
      deleted: 0,
      _source: persisted.meta?.source ?? null,
      _profile: persisted.meta?.profile ? JSON.stringify(persisted.meta.profile) : null,
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

      // Clear old references and re-insert (handled externally if needed)
      const delRefSQL = buildDeleteReferencesSQLv2(`${resourceType}_References`);
      tx.execute(delRefSQL, [id]);
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

    // v2: content preserved on soft delete (ADR-08)
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

    await this.adapter.transaction((tx) => {
      const updateSQL = buildUpdateMainSQLv2(resourceType, deleteRow);
      tx.execute(updateSQL.sql, updateSQL.values);

      const histSQL = buildInsertHistorySQLv2(`${resourceType}_History`, historyRow);
      tx.execute(histSQL.sql, histSQL.values);

      // Clear references for deleted resource
      const delRefSQL = buildDeleteReferencesSQLv2(`${resourceType}_References`);
      tx.execute(delRefSQL, [id]);
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
  // WRITE REFERENCES (utility for external callers)
  // ---------------------------------------------------------------------------

  async writeReferences(
    resourceType: string,
    resourceId: string,
    refs: ReferenceRowV2[],
  ): Promise<void> {
    if (refs.length === 0) return;

    const tableName = `${resourceType}_References`;
    const sql = buildInsertReferencesSQLv2(tableName, refs.length);
    const values: unknown[] = [];
    for (const ref of refs) {
      values.push(ref.resourceId, ref.targetType, ref.targetId, ref.code, ref.referenceRaw);
    }

    await this.adapter.execute(sql, values);
  }
}
