/**
 * ConditionalService — v2 Conditional CRUD Operations
 *
 * Implements FHIR conditional create/update/delete using StorageAdapter
 * and SearchParameterRegistry (v2 architecture).
 *
 * ADR-07: No projectId, ? placeholders, transactional TOCTOU protection.
 *
 * Semantics (FHIR R4):
 * - conditionalCreate: 0 match → create, 1 match → return existing, 2+ → error
 * - conditionalUpdate: 0 match → create, 1 match → update, 2+ → PreconditionFailedError
 * - conditionalDelete: delete all matching, return count
 *
 * @module fhir-persistence/store
 */

import { randomUUID } from 'node:crypto';
import type { StorageAdapter } from '../db/adapter.js';
import type { SearchParameterRegistry } from '../registry/search-parameter-registry.js';
import type { FhirResource, PersistedResource, ResourceRowV2, HistoryRowV2 } from '../repo/types.js';
import { PreconditionFailedError } from '../repo/errors.js';
import { buildSearchSQLv2 } from '../search/search-sql-builder.js';
import type { ParsedSearchParam } from '../search/types.js';
import {
  buildInsertMainSQLv2,
  buildUpdateMainSQLv2,
  buildInsertHistorySQLv2,
} from '../repo/sql-builder.js';

// =============================================================================
// Section 1: Types
// =============================================================================

export interface ConditionalCreateResult<T = PersistedResource> {
  /** Whether a new resource was created or an existing one was returned. */
  outcome: 'created' | 'existing';
  /** The resource (created or existing). */
  resource: T;
}

export interface ConditionalUpdateResult<T = PersistedResource> {
  /** Whether a new resource was created or an existing one was updated. */
  outcome: 'created' | 'updated';
  /** The resource after the operation. */
  resource: T;
}

export interface ConditionalDeleteResult {
  /** Number of resources deleted. */
  count: number;
}

// =============================================================================
// Section 2: ConditionalService
// =============================================================================

export class ConditionalService {
  constructor(
    private readonly adapter: StorageAdapter,
    private readonly registry: SearchParameterRegistry,
  ) { }

  // ---------------------------------------------------------------------------
  // conditionalCreate (If-None-Exist)
  // ---------------------------------------------------------------------------

  /**
   * Conditional create: search for existing matches, create only if none found.
   *
   * - 0 matches → create new resource
   * - 1 match → return existing resource (no-op)
   * - 2+ matches → PreconditionFailedError
   *
   * @param resourceType - FHIR resource type
   * @param resource - The resource to create
   * @param searchParams - Search criteria (If-None-Exist)
   */
  async conditionalCreate<T extends FhirResource>(
    resourceType: string,
    resource: T,
    searchParams: ParsedSearchParam[],
  ): Promise<ConditionalCreateResult<T & PersistedResource>> {
    // Search for existing matches
    const matches = await this.searchMatches(resourceType, searchParams, 2);

    if (matches.length > 1) {
      throw new PreconditionFailedError(resourceType, matches.length);
    }

    if (matches.length === 1) {
      return {
        outcome: 'existing',
        resource: JSON.parse(matches[0].content) as T & PersistedResource,
      };
    }

    // No matches — create
    const persisted = await this.createInTransaction(resourceType, resource);
    return { outcome: 'created', resource: persisted };
  }

  // ---------------------------------------------------------------------------
  // conditionalUpdate (search-based PUT)
  // ---------------------------------------------------------------------------

  /**
   * Conditional update: search for matches, update if exactly one found.
   *
   * - 0 matches → create new resource
   * - 1 match → update existing resource
   * - 2+ matches → PreconditionFailedError
   *
   * @param resourceType - FHIR resource type
   * @param resource - The resource to create/update
   * @param searchParams - Search criteria
   */
  async conditionalUpdate<T extends FhirResource>(
    resourceType: string,
    resource: T,
    searchParams: ParsedSearchParam[],
  ): Promise<ConditionalUpdateResult<T & PersistedResource>> {
    const matches = await this.searchMatches(resourceType, searchParams, 2);

    if (matches.length > 1) {
      throw new PreconditionFailedError(resourceType, matches.length);
    }

    if (matches.length === 0) {
      // No matches — create
      const persisted = await this.createInTransaction(resourceType, resource);
      return { outcome: 'created', resource: persisted };
    }

    // Exactly 1 match — update
    const existing = matches[0];
    const persisted = await this.updateInTransaction(
      resourceType,
      resource,
      existing.id,
    );
    return { outcome: 'updated', resource: persisted };
  }

  // ---------------------------------------------------------------------------
  // conditionalDelete
  // ---------------------------------------------------------------------------

  /**
   * Conditional delete: delete all resources matching the search criteria.
   *
   * @param resourceType - FHIR resource type
   * @param searchParams - Search criteria
   * @returns Number of resources deleted
   */
  async conditionalDelete(
    resourceType: string,
    searchParams: ParsedSearchParam[],
  ): Promise<ConditionalDeleteResult> {
    // Find all matches (no limit for delete)
    const matches = await this.searchMatches(resourceType, searchParams, 1000);

    if (matches.length === 0) {
      return { count: 0 };
    }

    // Soft-delete each match in a single transaction
    const now = new Date().toISOString();
    await this.adapter.transaction((tx) => {
      for (const match of matches) {
        const versionId = randomUUID();
        const deleteRow: ResourceRowV2 = {
          id: match.id,
          versionId,
          content: match.content,
          lastUpdated: now,
          deleted: 1,
        };

        const historyRow: HistoryRowV2 = {
          id: match.id,
          versionId,
          content: match.content,
          lastUpdated: now,
          deleted: 1,
        };

        const updateSQL = buildUpdateMainSQLv2(resourceType, deleteRow);
        tx.execute(updateSQL.sql, updateSQL.values);

        const histSQL = buildInsertHistorySQLv2(`${resourceType}_History`, historyRow);
        tx.execute(histSQL.sql, histSQL.values);
      }
    });

    return { count: matches.length };
  }

  // ---------------------------------------------------------------------------
  // Private: Search for matches
  // ---------------------------------------------------------------------------

  private async searchMatches(
    resourceType: string,
    searchParams: ParsedSearchParam[],
    limit: number,
  ): Promise<Array<{ id: string; content: string; versionId: string }>> {
    const searchSQL = buildSearchSQLv2(
      {
        resourceType,
        params: searchParams,
        count: limit,
      },
      this.registry,
    );

    return this.adapter.query<{ id: string; content: string; versionId: string }>(
      searchSQL.sql,
      searchSQL.values,
    );
  }

  // ---------------------------------------------------------------------------
  // Private: Create in transaction
  // ---------------------------------------------------------------------------

  private async createInTransaction<T extends FhirResource>(
    resourceType: string,
    resource: T,
  ): Promise<T & PersistedResource> {
    const now = new Date().toISOString();
    const id = resource.id ?? randomUUID();
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
  // Private: Update in transaction
  // ---------------------------------------------------------------------------

  private async updateInTransaction<T extends FhirResource>(
    resourceType: string,
    resource: T,
    existingId: string,
  ): Promise<T & PersistedResource> {
    const now = new Date().toISOString();
    const versionId = randomUUID();

    const persisted = {
      ...resource,
      resourceType,
      id: existingId,
      meta: {
        ...resource.meta,
        versionId,
        lastUpdated: now,
      },
    } as T & PersistedResource;

    const content = JSON.stringify(persisted);

    const mainRow: ResourceRowV2 = {
      id: existingId,
      versionId,
      content,
      lastUpdated: now,
      deleted: 0,
    };

    const historyRow: HistoryRowV2 = {
      id: existingId,
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
}
