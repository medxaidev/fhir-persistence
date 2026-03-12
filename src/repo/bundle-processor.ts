/**
 * Bundle Processor
 *
 * Processes FHIR Bundle resources of type `transaction` and `batch`.
 *
 * - **Transaction**: All entries in a single PostgreSQL transaction.
 *   Rollback all on any failure.
 * - **Batch**: Each entry processed independently.
 *   Individual success/failure per entry.
 *
 * Supports `urn:uuid:` internal reference resolution for transactions.
 *
 * @module fhir-persistence/repo
 */

import { randomUUID } from 'node:crypto';
import type { FhirResource, PersistedResource } from './types.js';
import type { FhirRepository, TransactionClient } from './fhir-repo.js';

// =============================================================================
// Section 1: Types
// =============================================================================

/**
 * A single entry in a FHIR Bundle.
 */
export interface BundleEntry {
  /** Full URL or urn:uuid for reference resolution. */
  fullUrl?: string;
  /** The resource to create/update. */
  resource?: FhirResource;
  /** The request details. */
  request?: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string;
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
  /** The created/updated resource (if successful). */
  resource?: PersistedResource;
  /** HTTP-like status string. */
  status: string;
  /** Error message if failed. */
  error?: string;
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
 */
function parseRequestUrl(url: string): { resourceType: string; id?: string } {
  const parts = url.split('/');
  return { resourceType: parts[0], id: parts[1] };
}

// =============================================================================
// Section 3: urn:uuid Resolution
// =============================================================================

/**
 * Replace `urn:uuid:` references in a resource with actual IDs.
 *
 * Uses structured deep-walk instead of regex on serialized JSON.
 * Only replaces values in `.reference` fields (FHIR Reference type)
 * to avoid accidental replacement in narratives or identifiers.
 */
function resolveUrnReferences(
  resource: FhirResource,
  urnMap: Map<string, string>,
): FhirResource {
  if (urnMap.size === 0) return resource;

  return deepResolveUrns(structuredClone(resource), urnMap) as FhirResource;
}

function deepResolveUrns(
  obj: unknown,
  urnMap: Map<string, string>,
): unknown {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = deepResolveUrns(obj[i], urnMap);
    }
    return obj;
  }

  const record = obj as Record<string, unknown>;

  // Replace .reference field if it matches a urn:uuid
  if (typeof record.reference === 'string') {
    const mapped = urnMap.get(record.reference);
    if (mapped) {
      record.reference = mapped;
    }
  }

  // Recurse into all fields
  for (const key of Object.keys(record)) {
    if (typeof record[key] === 'object' && record[key] !== null) {
      record[key] = deepResolveUrns(record[key], urnMap);
    }
  }

  return record;
}

// =============================================================================
// Section 4: Transaction Processing
// =============================================================================

/**
 * Process a transaction bundle — all-or-nothing.
 *
 * All entries are processed within a single database transaction.
 * If any entry fails, the entire transaction is rolled back automatically.
 */
export async function processTransaction(
  repo: FhirRepository,
  bundle: Bundle,
): Promise<BundleResponse> {
  const entries = bundle.entry ?? [];
  const urnMap = new Map<string, string>();

  // Pre-assign IDs for POST entries with urn:uuid fullUrl
  for (const entry of entries) {
    if (entry.request?.method === 'POST' && entry.fullUrl?.startsWith('urn:uuid:')) {
      const newId = randomUUID();
      urnMap.set(entry.fullUrl, `${entry.resource?.resourceType}/${newId}`);
      // Also map just the urn to the ID for cases where only the ID is referenced
      urnMap.set(entry.fullUrl.replace('urn:uuid:', ''), newId);
    }
  }

  try {
    const responseEntries = await repo.runInTransaction(async (tx) => {
      const results: BundleResponseEntry[] = [];

      for (const entry of entries) {
        const result = await processEntryInTransaction(repo, tx, entry, urnMap);
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
    // Transaction failed and rolled back — return error response
    const message = err instanceof Error ? err.message : String(err);
    return {
      resourceType: 'Bundle',
      type: 'transaction-response',
      entry: [{ status: '500', error: message }],
    };
  }
}

// =============================================================================
// Section 5: Batch Processing
// =============================================================================

/**
 * Process a batch bundle — each entry independently.
 *
 * Each entry is processed in its own try/catch. Failures don't affect
 * other entries.
 */
export async function processBatch(
  repo: FhirRepository,
  bundle: Bundle,
): Promise<BundleResponse> {
  const entries = bundle.entry ?? [];
  const responseEntries: BundleResponseEntry[] = [];

  for (const entry of entries) {
    try {
      const result = await processEntry(repo, entry, new Map());
      responseEntries.push(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      responseEntries.push({ status: '500', error: message });
    }
  }

  return {
    resourceType: 'Bundle',
    type: 'batch-response',
    entry: responseEntries,
  };
}

// =============================================================================
// Section 6: Single Entry Processing (Transaction — shared client)
// =============================================================================

/**
 * Process a single bundle entry within an existing transaction client.
 *
 * Uses repo's internal _execute* methods to run SQL against the shared
 * transaction client, ensuring all entries are atomic.
 */
async function processEntryInTransaction(
  repo: FhirRepository,
  tx: TransactionClient,
  entry: BundleEntry,
  urnMap: Map<string, string>,
): Promise<BundleResponseEntry> {
  if (!entry.request) {
    return { status: '400', error: 'Missing request' };
  }

  const { method, url } = entry.request;
  const { resourceType, id } = parseRequestUrl(url);

  switch (method) {
    case 'POST': {
      if (!entry.resource) {
        return { status: '400', error: 'Missing resource for POST' };
      }
      const resolved = resolveUrnReferences(entry.resource, urnMap);
      let assignedId: string | undefined;
      if (entry.fullUrl?.startsWith('urn:uuid:')) {
        const mapped = urnMap.get(entry.fullUrl.replace('urn:uuid:', ''));
        if (mapped) assignedId = mapped;
      }
      const persisted = repo._prepareCreate(resolved, { assignedId });
      await repo._executeCreate(tx, persisted);
      return { resource: persisted, status: '201' };
    }

    case 'PUT': {
      if (!entry.resource) {
        return { status: '400', error: 'Missing resource for PUT' };
      }
      const resolved = resolveUrnReferences(entry.resource, urnMap);
      if (id) {
        const toUpdate = { ...resolved, id } as FhirResource;
        const persisted = repo._prepareUpdate(toUpdate);
        await repo._executeUpdate(tx, persisted);
        return { resource: persisted, status: '200' };
      }
      return { status: '400', error: 'PUT requires resource ID' };
    }

    case 'DELETE': {
      if (!id) {
        return { status: '400', error: 'DELETE requires resource ID' };
      }
      await repo._executeDelete(tx, resourceType, id);
      return { status: '204' };
    }

    case 'GET': {
      if (!id) {
        return { status: '400', error: 'GET requires resource ID' };
      }
      // GET reads via the shared transaction client for consistency
      const sql = `SELECT "content", "deleted" FROM "${resourceType}" WHERE "id" = $1`;
      const result = await tx.query(sql, [id]);
      if (result.rows.length === 0) {
        return { status: '404', error: `${resourceType}/${id} not found` };
      }
      const row = result.rows[0] as { content: string; deleted: boolean };
      if (row.deleted || !row.content) {
        return { status: '410', error: `${resourceType}/${id} is deleted` };
      }
      const resource = JSON.parse(row.content) as PersistedResource;
      return { resource, status: '200' };
    }

    default:
      return { status: '400', error: `Unsupported method: ${method}` };
  }
}

// =============================================================================
// Section 7: Single Entry Processing (Batch — own transaction)
// =============================================================================

/**
 * Process a single bundle entry using the repo's public API.
 * Each call creates its own transaction (used by batch processing).
 */
async function processEntry(
  repo: FhirRepository,
  entry: BundleEntry,
  urnMap: Map<string, string>,
): Promise<BundleResponseEntry> {
  if (!entry.request) {
    return { status: '400', error: 'Missing request' };
  }

  const { method, url } = entry.request;
  const { resourceType, id } = parseRequestUrl(url);

  switch (method) {
    case 'POST': {
      if (!entry.resource) {
        return { status: '400', error: 'Missing resource for POST' };
      }
      const resolved = resolveUrnReferences(entry.resource, urnMap);
      // Use pre-assigned ID if this entry had a urn:uuid fullUrl
      let assignedId: string | undefined;
      if (entry.fullUrl?.startsWith('urn:uuid:')) {
        const mapped = urnMap.get(entry.fullUrl.replace('urn:uuid:', ''));
        if (mapped) assignedId = mapped;
      }
      const created = await repo.createResource(resolved, { assignedId });
      return { resource: created, status: '201' };
    }

    case 'PUT': {
      if (!entry.resource) {
        return { status: '400', error: 'Missing resource for PUT' };
      }
      const resolved = resolveUrnReferences(entry.resource, urnMap);
      if (id) {
        const toUpdate = { ...resolved, id } as FhirResource;
        const updated = await repo.updateResource(toUpdate);
        return { resource: updated, status: '200' };
      }
      return { status: '400', error: 'PUT requires resource ID' };
    }

    case 'DELETE': {
      if (!id) {
        return { status: '400', error: 'DELETE requires resource ID' };
      }
      await repo.deleteResource(resourceType, id);
      return { status: '204' };
    }

    case 'GET': {
      // GET in bundle is read-only — just read the resource
      if (!id) {
        return { status: '400', error: 'GET requires resource ID' };
      }
      const resource = await repo.readResource(resourceType, id);
      return { resource, status: '200' };
    }

    default:
      return { status: '400', error: `Unsupported method: ${method}` };
  }
}
