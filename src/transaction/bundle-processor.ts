/**
 * Bundle Processor — v2
 *
 * Processes FHIR Bundle resources of type `transaction` and `batch`
 * using FhirStore + StorageAdapter (not FhirRepository).
 *
 * Key differences from v1 (src/repo/bundle-processor.ts):
 * - Uses `FhirStore` for CRUD (not `FhirRepository`)
 * - Uses `StorageAdapter.transaction()` for atomic transactions
 * - `urn:uuid:` carries resourceType via `UrnTarget`
 * - Batch rejects `urn:uuid:` references (returns 400)
 * - Supports `If-None-Exist` conditional create
 * - `?` placeholders (SQLite), `deleted = 0` (INTEGER)
 *
 * @module fhir-persistence/transaction
 */

import type { FhirResource, PersistedResource } from '../repo/types.js';
import type { StorageAdapter, TransactionContext } from '../db/adapter.js';
import type { FhirStore } from '../store/fhir-store.js';
import { buildUrnMap, deepResolveUrns } from './urn-resolver.js';
import type { UrnTarget } from './urn-resolver.js';
import {
  ResourceNotFoundError,
  ResourceGoneError,
} from '../repo/errors.js';

// =============================================================================
// Section 1: Types
// =============================================================================

/**
 * A single entry in a FHIR Bundle.
 */
export interface BundleEntry {
  fullUrl?: string;
  resource?: FhirResource;
  request?: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string;
    /** If-None-Exist header for conditional create. */
    ifNoneExist?: string;
  };
}

/**
 * A FHIR Bundle resource.
 */
export interface Bundle {
  resourceType: 'Bundle';
  type: 'transaction' | 'batch';
  entry?: BundleEntry[];
}

/**
 * Result entry for a single bundle operation.
 */
export interface BundleResponseEntry {
  resource?: PersistedResource;
  response: {
    status: string;
    location?: string;
    etag?: string;
    lastModified?: string;
    outcome?: { issue: Array<{ severity: string; code: string; diagnostics: string }> };
  };
}

/**
 * Result of processing a bundle.
 */
export interface BundleResponse {
  resourceType: 'Bundle';
  type: 'transaction-response' | 'batch-response';
  entry: BundleResponseEntry[];
}

// =============================================================================
// Section 2: URL Parsing
// =============================================================================

/**
 * Parse a FHIR request URL into resourceType and optional id.
 * Examples: "Patient" → { resourceType: "Patient" }
 *           "Patient/123" → { resourceType: "Patient", id: "123" }
 *           "Patient?identifier=xxx" → { resourceType: "Patient", query: "identifier=xxx" }
 */
function parseRequestUrl(url: string): { resourceType: string; id?: string; query?: string } {
  const qIdx = url.indexOf('?');
  let path = url;
  let query: string | undefined;
  if (qIdx !== -1) {
    path = url.substring(0, qIdx);
    query = url.substring(qIdx + 1);
  }
  const parts = path.split('/');
  return { resourceType: parts[0], id: parts[1], query };
}

// =============================================================================
// Section 3: Transaction Processing
// =============================================================================

/**
 * v2: Process a transaction bundle — all-or-nothing.
 *
 * All entries are processed within a single StorageAdapter transaction.
 * If any entry fails, the entire transaction is rolled back.
 *
 * Entry processing order: strict sequential (no reorder).
 */
export async function processTransactionV2(
  store: FhirStore,
  adapter: StorageAdapter,
  bundle: Bundle,
): Promise<BundleResponse> {
  const entries = bundle.entry ?? [];
  if (entries.length === 0) {
    return { resourceType: 'Bundle', type: 'transaction-response', entry: [] };
  }

  // Build urn:uuid map — pre-assign IDs for POST entries
  const urnMap = buildUrnMap(entries);

  try {
    // Process all entries within a single transaction
    const responseEntries = await adapter.transaction(async (tx) => {
      const results: BundleResponseEntry[] = [];

      for (const entry of entries) {
        const result = await processEntryInTransaction(tx, entry, urnMap);
        results.push(result);
      }

      return results;
    });

    return {
      resourceType: 'Bundle',
      type: 'transaction-response',
      entry: responseEntries,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      resourceType: 'Bundle',
      type: 'transaction-response',
      entry: [{
        response: {
          status: '500',
          outcome: {
            issue: [{ severity: 'error', code: 'exception', diagnostics: message }],
          },
        },
      }],
    };
  }
}

// =============================================================================
// Section 4: Batch Processing
// =============================================================================

/**
 * v2: Process a batch bundle — each entry independently.
 *
 * Each entry is processed in its own try/catch.
 * urn:uuid references are rejected in batch mode (return 400).
 */
export async function processBatchV2(
  store: FhirStore,
  bundle: Bundle,
): Promise<BundleResponse> {
  const entries = bundle.entry ?? [];
  const responseEntries: BundleResponseEntry[] = [];

  for (const entry of entries) {
    // Reject urn:uuid references in batch mode
    if (entry.fullUrl?.startsWith('urn:uuid:')) {
      responseEntries.push({
        response: {
          status: '400',
          outcome: {
            issue: [{ severity: 'error', code: 'invalid', diagnostics: 'urn:uuid references are not allowed in batch mode' }],
          },
        },
      });
      continue;
    }

    try {
      const result = await processBatchEntry(store, entry);
      responseEntries.push(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = errorToStatus(err);
      responseEntries.push({
        response: {
          status,
          outcome: {
            issue: [{ severity: 'error', code: 'exception', diagnostics: message }],
          },
        },
      });
    }
  }

  return {
    resourceType: 'Bundle',
    type: 'batch-response',
    entry: responseEntries,
  };
}

// =============================================================================
// Section 5: Transaction Entry Processing (shared TransactionContext)
// =============================================================================

/**
 * Process a single entry within a transaction context.
 * Uses raw SQL against the TransactionContext for atomicity.
 */
async function processEntryInTransaction(
  tx: TransactionContext,
  entry: BundleEntry,
  urnMap: Map<string, UrnTarget>,
): Promise<BundleResponseEntry> {
  if (!entry.request) {
    throw new Error('Missing request');
  }

  const { method, url } = entry.request;
  const { resourceType, id } = parseRequestUrl(url);

  switch (method) {
    case 'POST': {
      if (!entry.resource) {
        throw new Error('Missing resource for POST');
      }

      // If-None-Exist: conditional create
      if (entry.request.ifNoneExist) {
        const matchResult = checkIfNoneExistInTx(tx, resourceType, entry.request.ifNoneExist);
        if (matchResult.status !== 'create') {
          return matchResult.response!;
        }
      }

      const resolved = deepResolveUrns(entry.resource, urnMap);

      // Get pre-assigned ID from urnMap
      let assignedId: string | undefined;
      if (entry.fullUrl?.startsWith('urn:uuid:')) {
        const target = urnMap.get(entry.fullUrl);
        if (target) assignedId = target.id;
      }

      const now = new Date().toISOString();
      const { randomUUID } = require('node:crypto');
      const versionId = randomUUID();
      const finalId = assignedId ?? resolved.id ?? randomUUID();

      const persisted = {
        ...resolved,
        resourceType,
        id: finalId,
        meta: {
          ...resolved.meta,
          versionId,
          lastUpdated: now,
        },
      } as PersistedResource;

      const content = JSON.stringify(persisted);

      // INSERT main
      tx.execute(
        `INSERT INTO "${resourceType}" ("id", "versionId", "content", "lastUpdated", "deleted", "_source", "_profile") VALUES (?, ?, ?, ?, 0, ?, ?)`,
        [finalId, versionId, content, now, persisted.meta?.source ?? null, persisted.meta?.profile ? JSON.stringify(persisted.meta.profile) : null],
      );

      // INSERT history
      tx.execute(
        `INSERT INTO "${resourceType}_History" ("id", "versionId", "content", "lastUpdated", "deleted") VALUES (?, ?, ?, ?, 0)`,
        [finalId, versionId, content, now],
      );

      return {
        resource: persisted,
        response: {
          status: '201',
          location: `${resourceType}/${finalId}/_history/${versionId}`,
          etag: `W/"${versionId}"`,
          lastModified: now,
        },
      };
    }

    case 'PUT': {
      if (!entry.resource) {
        throw new Error('Missing resource for PUT');
      }
      if (!id) {
        throw new Error('PUT requires resource ID in URL');
      }

      const resolved = deepResolveUrns(entry.resource, urnMap);
      const now = new Date().toISOString();
      const { randomUUID } = require('node:crypto');
      const versionId = randomUUID();

      const persisted = {
        ...resolved,
        resourceType,
        id,
        meta: {
          ...resolved.meta,
          versionId,
          lastUpdated: now,
        },
      } as PersistedResource;

      const content = JSON.stringify(persisted);

      // Check if resource exists
      const existing = tx.queryOne<{ id: string; deleted: number }>(
        `SELECT "id", "deleted" FROM "${resourceType}" WHERE "id" = ?`,
        [id],
      );

      if (existing) {
        // UPDATE
        tx.execute(
          `UPDATE "${resourceType}" SET "versionId" = ?, "content" = ?, "lastUpdated" = ?, "deleted" = 0, "_source" = ?, "_profile" = ? WHERE "id" = ?`,
          [versionId, content, now, persisted.meta?.source ?? null, persisted.meta?.profile ? JSON.stringify(persisted.meta.profile) : null, id],
        );
      } else {
        // INSERT (create-on-update / upsert)
        tx.execute(
          `INSERT INTO "${resourceType}" ("id", "versionId", "content", "lastUpdated", "deleted", "_source", "_profile") VALUES (?, ?, ?, ?, 0, ?, ?)`,
          [id, versionId, content, now, persisted.meta?.source ?? null, persisted.meta?.profile ? JSON.stringify(persisted.meta.profile) : null],
        );
      }

      // INSERT history
      tx.execute(
        `INSERT INTO "${resourceType}_History" ("id", "versionId", "content", "lastUpdated", "deleted") VALUES (?, ?, ?, ?, 0)`,
        [id, versionId, content, now],
      );

      return {
        resource: persisted,
        response: {
          status: existing ? '200' : '201',
          location: `${resourceType}/${id}/_history/${versionId}`,
          etag: `W/"${versionId}"`,
          lastModified: now,
        },
      };
    }

    case 'DELETE': {
      if (!id) {
        throw new Error('DELETE requires resource ID');
      }

      const existing = tx.queryOne<{ id: string; content: string; deleted: number }>(
        `SELECT "id", "content", "deleted" FROM "${resourceType}" WHERE "id" = ?`,
        [id],
      );

      if (!existing || existing.deleted === 1) {
        return { response: { status: '204' } };
      }

      const now = new Date().toISOString();
      const { randomUUID } = require('node:crypto');
      const versionId = randomUUID();

      // Soft delete: content preserved (ADR-08)
      tx.execute(
        `UPDATE "${resourceType}" SET "versionId" = ?, "lastUpdated" = ?, "deleted" = 1 WHERE "id" = ?`,
        [versionId, now, id],
      );

      tx.execute(
        `INSERT INTO "${resourceType}_History" ("id", "versionId", "content", "lastUpdated", "deleted") VALUES (?, ?, ?, ?, 1)`,
        [id, versionId, existing.content, now],
      );

      // Clear references
      tx.execute(
        `DELETE FROM "${resourceType}_References" WHERE "resourceId" = ?`,
        [id],
      );

      return { response: { status: '204' } };
    }

    case 'GET': {
      if (!id) {
        throw new Error('GET requires resource ID');
      }

      const row = tx.queryOne<{ content: string; deleted: number }>(
        `SELECT "content", "deleted" FROM "${resourceType}" WHERE "id" = ?`,
        [id],
      );

      if (!row) {
        throw new ResourceNotFoundError(resourceType, id);
      }
      if (row.deleted === 1) {
        throw new ResourceGoneError(resourceType, id);
      }

      const resource = JSON.parse(row.content) as PersistedResource;
      return { resource, response: { status: '200' } };
    }

    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

// =============================================================================
// Section 6: If-None-Exist (Conditional Create)
// =============================================================================

/**
 * Check If-None-Exist condition within a transaction context.
 *
 * The ifNoneExist string is a search query (e.g., "identifier=xxx").
 * We do a simple column-based lookup for the common case.
 *
 * Returns:
 * - 0 matches → { status: 'create' } (proceed with create)
 * - 1 match → { status: 'existing', response } (return 200 with existing)
 * - 2+ matches → { status: 'error', response } (return 412)
 */
function checkIfNoneExistInTx(
  tx: TransactionContext,
  resourceType: string,
  ifNoneExist: string,
): { status: 'create' | 'existing' | 'error'; response?: BundleResponseEntry } {
  // Parse the query string: "identifier=xxx" or "_id=yyy"
  const params = new URLSearchParams(ifNoneExist);
  const conditions: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of params.entries()) {
    if (key === '_id') {
      conditions.push('"id" = ?');
      values.push(value);
    } else if (key === 'identifier') {
      // For identifier, search in content JSON (simple substring match)
      conditions.push('"content" LIKE ?');
      values.push(`%${value}%`);
    } else {
      // Generic: try column match
      conditions.push(`"${key}" = ?`);
      values.push(value);
    }
  }

  if (conditions.length === 0) {
    return { status: 'create' };
  }

  const whereClause = conditions.join(' AND ');
  const rows = tx.query<{ id: string; content: string; versionId: string; lastUpdated: string }>(
    `SELECT "id", "content", "versionId", "lastUpdated" FROM "${resourceType}" WHERE "deleted" = 0 AND ${whereClause}`,
    values,
  );

  if (rows.length === 0) {
    return { status: 'create' };
  }

  if (rows.length === 1) {
    const existing = JSON.parse(rows[0].content) as PersistedResource;
    return {
      status: 'existing',
      response: {
        resource: existing,
        response: {
          status: '200',
          location: `${resourceType}/${rows[0].id}/_history/${rows[0].versionId}`,
          etag: `W/"${rows[0].versionId}"`,
          lastModified: rows[0].lastUpdated,
        },
      },
    };
  }

  // Multiple matches → 412 Precondition Failed
  return {
    status: 'error',
    response: {
      response: {
        status: '412',
        outcome: {
          issue: [{
            severity: 'error',
            code: 'duplicate',
            diagnostics: `If-None-Exist matched ${rows.length} resources for ${resourceType}`,
          }],
        },
      },
    },
  };
}

// =============================================================================
// Section 7: Batch Entry Processing (uses FhirStore public API)
// =============================================================================

/**
 * Process a single entry in batch mode using FhirStore's public API.
 * Each call creates its own transaction internally.
 */
async function processBatchEntry(
  store: FhirStore,
  entry: BundleEntry,
): Promise<BundleResponseEntry> {
  if (!entry.request) {
    return errorResponse('400', 'Missing request');
  }

  const { method, url } = entry.request;
  const { resourceType, id } = parseRequestUrl(url);

  switch (method) {
    case 'POST': {
      if (!entry.resource) {
        return errorResponse('400', 'Missing resource for POST');
      }
      const created = await store.createResource(resourceType, entry.resource);
      const versionId = created.meta?.versionId ?? '';
      const lastUpdated = created.meta?.lastUpdated ?? '';
      return {
        resource: created,
        response: {
          status: '201',
          location: `${resourceType}/${created.id}/_history/${versionId}`,
          etag: `W/"${versionId}"`,
          lastModified: lastUpdated,
        },
      };
    }

    case 'PUT': {
      if (!entry.resource || !id) {
        return errorResponse('400', 'PUT requires resource and ID');
      }
      const toUpdate = { ...entry.resource, id } as FhirResource;
      const updated = await store.updateResource(resourceType, toUpdate);
      const versionId = updated.meta?.versionId ?? '';
      const lastUpdated = updated.meta?.lastUpdated ?? '';
      return {
        resource: updated,
        response: {
          status: '200',
          location: `${resourceType}/${id}/_history/${versionId}`,
          etag: `W/"${versionId}"`,
          lastModified: lastUpdated,
        },
      };
    }

    case 'DELETE': {
      if (!id) {
        return errorResponse('400', 'DELETE requires resource ID');
      }
      await store.deleteResource(resourceType, id);
      return { response: { status: '204' } };
    }

    case 'GET': {
      if (!id) {
        return errorResponse('400', 'GET requires resource ID');
      }
      const resource = await store.readResource(resourceType, id);
      return { resource, response: { status: '200' } };
    }

    default:
      return errorResponse('400', `Unsupported method: ${method}`);
  }
}

// =============================================================================
// Section 8: Helpers
// =============================================================================

function errorResponse(status: string, message: string): BundleResponseEntry {
  return {
    response: {
      status,
      outcome: {
        issue: [{ severity: 'error', code: 'processing', diagnostics: message }],
      },
    },
  };
}

function errorToStatus(err: unknown): string {
  if (err instanceof ResourceNotFoundError) return '404';
  if (err instanceof ResourceGoneError) return '410';
  return '500';
}
