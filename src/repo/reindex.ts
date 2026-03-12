/**
 * Re-Index Tool
 *
 * Re-populates search columns, references, and lookup tables for
 * existing resources. Run after schema changes to ensure all
 * search indexes are up-to-date.
 *
 * @module fhir-persistence/repo
 */

import type { DatabaseClient } from '../db/client.js';
import type { SearchParameterRegistry } from '../registry/search-parameter-registry.js';
import type { PersistedResource } from './types.js';
import { buildResourceRowWithSearch } from './row-builder.js';
import { extractReferences } from './reference-indexer.js';
import { buildUpsertSQL } from './sql-builder.js';

// =============================================================================
// Section 1: Types
// =============================================================================

/**
 * Progress callback for re-index operations.
 */
export type ReindexProgressCallback = (info: {
  resourceType: string;
  processed: number;
  total: number;
}) => void;

/**
 * Result of a re-index operation.
 */
export interface ReindexResult {
  /** Total resources processed. */
  totalProcessed: number;
  /** Resources updated successfully. */
  totalUpdated: number;
  /** Resources that failed to re-index. */
  totalErrors: number;
  /** Per-type counts. */
  byType: Record<string, { processed: number; updated: number; errors: number }>;
}

// =============================================================================
// Section 2: Re-Index
// =============================================================================

const BATCH_SIZE = 100;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Re-index all resources of a given type.
 *
 * Reads all non-deleted resources, re-runs the row indexer and reference
 * indexer, and updates the database rows.
 *
 * @param db - Database client.
 * @param resourceType - The FHIR resource type to re-index.
 * @param registry - SearchParameterRegistry for search column extraction.
 * @param onProgress - Optional progress callback.
 * @returns Re-index result for this type.
 */
export async function reindexResourceType(
  db: DatabaseClient,
  resourceType: string,
  registry: SearchParameterRegistry,
  onProgress?: ReindexProgressCallback,
): Promise<{ processed: number; updated: number; errors: number }> {
  const impls = registry.getForResource(resourceType);

  // Count total
  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) AS "count" FROM "${resourceType}" WHERE "deleted" = false`,
    [],
  );
  const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

  let processed = 0;
  let updated = 0;
  let errors = 0;
  let lastId = '00000000-0000-0000-0000-000000000000';

  while (processed < total) {
    // Fetch a batch
    const { rows } = await db.query<{ id: string; content: string }>(
      `SELECT "id", "content" FROM "${resourceType}" WHERE "deleted" = false AND "id" > $1 ORDER BY "id" LIMIT $2`,
      [lastId, BATCH_SIZE],
    );

    if (rows.length === 0) break;

    for (const row of rows) {
      try {
        const resource = JSON.parse(row.content) as PersistedResource;
        const mainRow = buildResourceRowWithSearch(resource, impls);

        // Update main table row (search columns only via UPSERT)
        const upsert = buildUpsertSQL(resourceType, mainRow);
        await db.query(upsert.sql, upsert.values);

        // Re-populate references
        const refTable = `${resourceType}_References`;
        await db.query(`DELETE FROM "${refTable}" WHERE "resourceId" = $1`, [resource.id]);

        const refs = extractReferences(resource, impls);
        for (const ref of refs) {
          if (!isValidUuid(ref.targetId)) continue;
          await db.query(
            `INSERT INTO "${refTable}" ("resourceId", "targetId", "code") VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [ref.resourceId, ref.targetId, ref.code],
          );
        }

        updated++;
      } catch {
        errors++;
      }

      processed++;
      lastId = row.id;
    }

    if (onProgress) {
      onProgress({ resourceType, processed, total });
    }
  }

  return { processed, updated, errors };
}

/**
 * Re-index all resource types.
 *
 * @param db - Database client.
 * @param resourceTypes - List of resource types to re-index.
 * @param registry - SearchParameterRegistry.
 * @param onProgress - Optional progress callback.
 * @returns Complete re-index result.
 */
export async function reindexAll(
  db: DatabaseClient,
  resourceTypes: string[],
  registry: SearchParameterRegistry,
  onProgress?: ReindexProgressCallback,
): Promise<ReindexResult> {
  const result: ReindexResult = {
    totalProcessed: 0,
    totalUpdated: 0,
    totalErrors: 0,
    byType: {},
  };

  for (const resourceType of resourceTypes) {
    try {
      const typeResult = await reindexResourceType(db, resourceType, registry, onProgress);
      result.byType[resourceType] = typeResult;
      result.totalProcessed += typeResult.processed;
      result.totalUpdated += typeResult.updated;
      result.totalErrors += typeResult.errors;
    } catch {
      // Table may not exist — skip
      result.byType[resourceType] = { processed: 0, updated: 0, errors: 0 };
    }
  }

  return result;
}
