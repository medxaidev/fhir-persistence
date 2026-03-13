/**
 * Bundle Processor v2 Integration Tests — 12 tests on SQLite in-memory.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteAdapter } from '../../db/sqlite-adapter.js';
import { FhirStore } from '../../store/fhir-store.js';
import { processTransactionV2, processBatchV2 } from '../../transaction/bundle-processor.js';
import type { Bundle, BundleEntry } from '../../transaction/bundle-processor.js';

// ---------------------------------------------------------------------------
// DDL for Patient + Observation tables
// ---------------------------------------------------------------------------
const DDL = [
  `CREATE TABLE IF NOT EXISTS "Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lastUpdated" TEXT NOT NULL,
    "deleted" INTEGER NOT NULL DEFAULT 0,
    "_source" TEXT,
    "_profile" TEXT,
    "compartments" TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS "Patient_History" (
    "versionSeq" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lastUpdated" TEXT NOT NULL,
    "deleted" INTEGER NOT NULL DEFAULT 0,
    UNIQUE ("id", "versionId")
  )`,
  `CREATE TABLE IF NOT EXISTS "Patient_References" (
    "resourceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referenceRaw" TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS "Observation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lastUpdated" TEXT NOT NULL,
    "deleted" INTEGER NOT NULL DEFAULT 0,
    "_source" TEXT,
    "_profile" TEXT,
    "compartments" TEXT,
    "subject" TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS "Observation_History" (
    "versionSeq" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lastUpdated" TEXT NOT NULL,
    "deleted" INTEGER NOT NULL DEFAULT 0,
    UNIQUE ("id", "versionId")
  )`,
  `CREATE TABLE IF NOT EXISTS "Observation_References" (
    "resourceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referenceRaw" TEXT
  )`,
];

describe('Bundle Processor v2 (SQLite integration)', () => {
  let adapter: SQLiteAdapter;
  let store: FhirStore;

  beforeEach(async () => {
    adapter = new SQLiteAdapter(':memory:');
    store = new FhirStore(adapter);
    for (const ddl of DDL) {
      await adapter.execute(ddl);
    }
  });

  afterEach(async () => {
    await adapter.close();
  });

  // =========================================================================
  // 1. Transaction: POST creates resources
  // =========================================================================
  it('transaction POST creates resources with 201', async () => {
    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          resource: { resourceType: 'Patient', name: [{ family: 'Smith' }] } as any,
          request: { method: 'POST', url: 'Patient' },
        },
      ],
    };

    const result = await processTransactionV2(store, adapter, bundle);
    expect(result.type).toBe('transaction-response');
    expect(result.entry).toHaveLength(1);
    expect(result.entry[0].response.status).toBe('201');
    expect(result.entry[0].resource).toBeDefined();
    expect(result.entry[0].resource!.resourceType).toBe('Patient');
    expect(result.entry[0].response.etag).toMatch(/^W\//);
    expect(result.entry[0].response.location).toContain('Patient/');
    expect(result.entry[0].response.lastModified).toBeTruthy();
  });

  // =========================================================================
  // 2. Transaction: PUT updates existing resource
  // =========================================================================
  it('transaction PUT updates existing resource with 200', async () => {
    // Create patient first
    await store.createResource('Patient', { resourceType: 'Patient' } as any, { assignedId: 'pat-1' });

    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          resource: { resourceType: 'Patient', id: 'pat-1', name: [{ family: 'Updated' }] } as any,
          request: { method: 'PUT', url: 'Patient/pat-1' },
        },
      ],
    };

    const result = await processTransactionV2(store, adapter, bundle);
    expect(result.entry[0].response.status).toBe('200');
    expect((result.entry[0].resource as any).name[0].family).toBe('Updated');
  });

  // =========================================================================
  // 3. Transaction: DELETE soft-deletes resource
  // =========================================================================
  it('transaction DELETE soft-deletes resource with 204', async () => {
    await store.createResource('Patient', { resourceType: 'Patient' } as any, { assignedId: 'pat-del' });

    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          request: { method: 'DELETE', url: 'Patient/pat-del' },
        },
      ],
    };

    const result = await processTransactionV2(store, adapter, bundle);
    expect(result.entry[0].response.status).toBe('204');

    // Verify soft-deleted
    const row = await adapter.queryOne<{ deleted: number }>(
      'SELECT "deleted" FROM "Patient" WHERE "id" = ?',
      ['pat-del'],
    );
    expect(row?.deleted).toBe(1);
  });

  // =========================================================================
  // 4. Transaction: urn:uuid references resolved across entries
  // =========================================================================
  it('transaction resolves urn:uuid references across entries', async () => {
    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          fullUrl: 'urn:uuid:new-patient',
          resource: { resourceType: 'Patient', name: [{ family: 'Doe' }] } as any,
          request: { method: 'POST', url: 'Patient' },
        },
        {
          fullUrl: 'urn:uuid:new-obs',
          resource: {
            resourceType: 'Observation',
            subject: { reference: 'urn:uuid:new-patient' },
          } as any,
          request: { method: 'POST', url: 'Observation' },
        },
      ],
    };

    const result = await processTransactionV2(store, adapter, bundle);
    expect(result.entry).toHaveLength(2);
    expect(result.entry[0].response.status).toBe('201');
    expect(result.entry[1].response.status).toBe('201');

    // The observation's subject.reference should be resolved to Patient/<actual-id>
    const obs = result.entry[1].resource as any;
    const patId = result.entry[0].resource!.id;
    expect(obs.subject.reference).toBe(`Patient/${patId}`);
  });

  // =========================================================================
  // 5. Transaction: rollback on any entry failure
  // =========================================================================
  it('transaction rolls back on entry failure', async () => {
    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          resource: { resourceType: 'Patient', name: [{ family: 'WillRollback' }] } as any,
          request: { method: 'POST', url: 'Patient' },
        },
        {
          // PUT without resource → will fail
          request: { method: 'PUT', url: 'Patient/nonexistent' },
        },
      ],
    };

    const result = await processTransactionV2(store, adapter, bundle);
    // Transaction failed → error response
    expect(result.entry[0].response.status).toBe('500');

    // No Patient should have been created (rolled back)
    const rows = await adapter.query<{ id: string }>('SELECT "id" FROM "Patient"');
    expect(rows).toHaveLength(0);
  });

  // =========================================================================
  // 6. Transaction: response includes location + etag + lastModified
  // =========================================================================
  it('transaction response includes location, etag, lastModified', async () => {
    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          resource: { resourceType: 'Patient' } as any,
          request: { method: 'POST', url: 'Patient' },
        },
      ],
    };

    const result = await processTransactionV2(store, adapter, bundle);
    const resp = result.entry[0].response;
    expect(resp.location).toMatch(/^Patient\/[a-f0-9-]+\/_history\/[a-f0-9-]+$/);
    expect(resp.etag).toMatch(/^W\/"[a-f0-9-]+"$/);
    expect(resp.lastModified).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  // =========================================================================
  // 7. Batch: each entry independent (failure doesn't affect others)
  // =========================================================================
  it('batch processes entries independently', async () => {
    await store.createResource('Patient', { resourceType: 'Patient' } as any, { assignedId: 'exists' });

    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'batch',
      entry: [
        {
          // This GET will succeed
          request: { method: 'GET', url: 'Patient/exists' },
        },
        {
          // This GET will fail (404)
          request: { method: 'GET', url: 'Patient/nonexistent' },
        },
        {
          // This POST will succeed
          resource: { resourceType: 'Patient', name: [{ family: 'New' }] } as any,
          request: { method: 'POST', url: 'Patient' },
        },
      ],
    };

    const result = await processBatchV2(store, bundle);
    expect(result.type).toBe('batch-response');
    expect(result.entry).toHaveLength(3);
    expect(result.entry[0].response.status).toBe('200');
    expect(result.entry[1].response.status).toBe('404');
    expect(result.entry[2].response.status).toBe('201');
  });

  // =========================================================================
  // 8. Batch: urn:uuid references rejected (400)
  // =========================================================================
  it('batch rejects urn:uuid references with 400', async () => {
    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'batch',
      entry: [
        {
          fullUrl: 'urn:uuid:rejected',
          resource: { resourceType: 'Patient' } as any,
          request: { method: 'POST', url: 'Patient' },
        },
      ],
    };

    const result = await processBatchV2(store, bundle);
    expect(result.entry[0].response.status).toBe('400');
    expect(result.entry[0].response.outcome!.issue[0].diagnostics).toContain('urn:uuid');
  });

  // =========================================================================
  // 9. If-None-Exist: 0 matches → create
  // =========================================================================
  it('If-None-Exist with 0 matches creates resource', async () => {
    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          resource: { resourceType: 'Patient', name: [{ family: 'Conditional' }] } as any,
          request: { method: 'POST', url: 'Patient', ifNoneExist: '_id=nonexistent' },
        },
      ],
    };

    const result = await processTransactionV2(store, adapter, bundle);
    expect(result.entry[0].response.status).toBe('201');
    expect(result.entry[0].resource).toBeDefined();
  });

  // =========================================================================
  // 10. If-None-Exist: 1 match → return existing (200)
  // =========================================================================
  it('If-None-Exist with 1 match returns existing resource', async () => {
    await store.createResource('Patient', { resourceType: 'Patient' } as any, { assignedId: 'existing-1' });

    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          resource: { resourceType: 'Patient', name: [{ family: 'Duplicate' }] } as any,
          request: { method: 'POST', url: 'Patient', ifNoneExist: '_id=existing-1' },
        },
      ],
    };

    const result = await processTransactionV2(store, adapter, bundle);
    expect(result.entry[0].response.status).toBe('200');
    expect(result.entry[0].resource!.id).toBe('existing-1');
  });

  // =========================================================================
  // 11. If-None-Exist: multiple matches → 412
  // =========================================================================
  it('If-None-Exist with multiple matches returns 412', async () => {
    // Create two patients that will match a content-based search
    await store.createResource('Patient', {
      resourceType: 'Patient',
      identifier: [{ value: 'dup-id' }],
    } as any, { assignedId: 'dup-1' });
    await store.createResource('Patient', {
      resourceType: 'Patient',
      identifier: [{ value: 'dup-id' }],
    } as any, { assignedId: 'dup-2' });

    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          resource: { resourceType: 'Patient' } as any,
          request: { method: 'POST', url: 'Patient', ifNoneExist: 'identifier=dup-id' },
        },
      ],
    };

    const result = await processTransactionV2(store, adapter, bundle);
    expect(result.entry[0].response.status).toBe('412');
  });

  // =========================================================================
  // 12. Transaction: GET reads resource within transaction
  // =========================================================================
  it('transaction GET reads resource within transaction context', async () => {
    await store.createResource('Patient', {
      resourceType: 'Patient',
      name: [{ family: 'ReadMe' }],
    } as any, { assignedId: 'read-me' });

    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          request: { method: 'GET', url: 'Patient/read-me' },
        },
      ],
    };

    const result = await processTransactionV2(store, adapter, bundle);
    expect(result.entry[0].response.status).toBe('200');
    expect(result.entry[0].resource).toBeDefined();
    expect(result.entry[0].resource!.id).toBe('read-me');
  });
});
