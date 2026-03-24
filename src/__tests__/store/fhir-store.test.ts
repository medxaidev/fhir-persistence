/**
 * FhirStore Integration Tests 鈥?12 tests covering full CRUD + History on SQLite.
 *
 * Uses real SQLite in-memory database via BetterSqlite3Adapter + generated DDL.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';
import { FhirStore } from '../../store/fhir-store.js';
import { ResourceNotFoundError, ResourceGoneError, ResourceVersionConflictError } from '../../repo/errors.js';

// Minimal DDL for Patient + Patient_History + Patient_References
const PATIENT_DDL = [
  `CREATE TABLE IF NOT EXISTS "Patient" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lastUpdated" TEXT NOT NULL,
    "deleted" INTEGER NOT NULL DEFAULT 0,
    "_source" TEXT,
    "_profile" TEXT,
    "compartments" TEXT,
    CONSTRAINT "Patient_pk" PRIMARY KEY ("id")
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
  `CREATE INDEX IF NOT EXISTS "Patient_History_id_seq_idx" ON "Patient_History" ("id", "versionSeq")`,
];

describe('FhirStore (SQLite integration)', () => {
  let adapter: BetterSqlite3Adapter;
  let store: FhirStore;

  beforeEach(async () => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    store = new FhirStore(adapter);
    for (const ddl of PATIENT_DDL) {
      await adapter.execute(ddl);
    }
  });

  afterEach(async () => {
    await adapter.close();
  });

  // =========================================================================
  // 1. CREATE 鈥?generates id + versionId + lastUpdated
  // =========================================================================
  it('createResource generates id, versionId, and lastUpdated', async () => {
    const result = await store.createResource('Patient', {
      resourceType: 'Patient',
      name: [{ family: 'Smith' }],
    });

    expect(result.id).toBeDefined();
    expect(result.meta.versionId).toBeDefined();
    expect(result.meta.lastUpdated).toBeDefined();
    expect(result.resourceType).toBe('Patient');
    expect((result as any).name[0].family).toBe('Smith');
  });

  // =========================================================================
  // 2. CREATE 鈥?uses assignedId
  // =========================================================================
  it('createResource uses assignedId when provided', async () => {
    const result = await store.createResource('Patient', {
      resourceType: 'Patient',
    }, { assignedId: 'custom-id-123' });

    expect(result.id).toBe('custom-id-123');
  });

  // =========================================================================
  // 3. CREATE 鈥?stores in main + history tables
  // =========================================================================
  it('createResource writes to both main and history tables', async () => {
    const result = await store.createResource('Patient', {
      resourceType: 'Patient',
    });

    const mainRow = await adapter.queryOne<{ id: string }>(
      'SELECT "id" FROM "Patient" WHERE "id" = ?',
      [result.id],
    );
    expect(mainRow).toBeDefined();

    const histRows = await adapter.query<{ id: string; versionId: string }>(
      'SELECT "id", "versionId" FROM "Patient_History" WHERE "id" = ?',
      [result.id],
    );
    expect(histRows).toHaveLength(1);
    expect(histRows[0].versionId).toBe(result.meta.versionId);
  });

  // =========================================================================
  // 4. READ 鈥?returns persisted resource
  // =========================================================================
  it('readResource returns the persisted resource', async () => {
    const created = await store.createResource('Patient', {
      resourceType: 'Patient',
      name: [{ family: 'Doe' }],
    });

    const read = await store.readResource('Patient', created.id);
    expect(read.id).toBe(created.id);
    expect(read.meta.versionId).toBe(created.meta.versionId);
    expect((read as any).name[0].family).toBe('Doe');
  });

  // =========================================================================
  // 5. READ 鈥?throws ResourceNotFoundError for missing resource
  // =========================================================================
  it('readResource throws ResourceNotFoundError for nonexistent id', async () => {
    await expect(
      store.readResource('Patient', 'nonexistent-id'),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  // =========================================================================
  // 6. READ 鈥?throws ResourceGoneError for deleted resource
  // =========================================================================
  it('readResource throws ResourceGoneError for deleted resource', async () => {
    const created = await store.createResource('Patient', {
      resourceType: 'Patient',
    });
    await store.deleteResource('Patient', created.id);

    await expect(
      store.readResource('Patient', created.id),
    ).rejects.toThrow(ResourceGoneError);
  });

  // =========================================================================
  // 7. UPDATE 鈥?generates new versionId, old version in history
  // =========================================================================
  it('updateResource generates new versionId and preserves old in history', async () => {
    const created = await store.createResource('Patient', {
      resourceType: 'Patient',
      name: [{ family: 'Smith' }],
    });

    const { resource: updated } = await store.updateResource('Patient', {
      resourceType: 'Patient',
      id: created.id,
      name: [{ family: 'Jones' }],
    });

    expect(updated.meta.versionId).not.toBe(created.meta.versionId);
    expect((updated as any).name[0].family).toBe('Jones');

    // History should have 2 entries
    const histRows = await adapter.query<{ versionId: string }>(
      'SELECT "versionId" FROM "Patient_History" WHERE "id" = ? ORDER BY "versionSeq"',
      [created.id],
    );
    expect(histRows).toHaveLength(2);
    expect(histRows[0].versionId).toBe(created.meta.versionId);
    expect(histRows[1].versionId).toBe(updated.meta.versionId);
  });

  // =========================================================================
  // 8. UPDATE 鈥?ifMatch optimistic locking succeeds
  // =========================================================================
  it('updateResource succeeds when ifMatch matches current versionId', async () => {
    const created = await store.createResource('Patient', {
      resourceType: 'Patient',
    });

    const { resource: updated } = await store.updateResource('Patient', {
      resourceType: 'Patient',
      id: created.id,
    }, { ifMatch: created.meta.versionId });

    expect(updated.meta.versionId).not.toBe(created.meta.versionId);
  });

  // =========================================================================
  // 9. UPDATE 鈥?ifMatch optimistic locking fails
  // =========================================================================
  it('updateResource throws ResourceVersionConflictError on ifMatch mismatch', async () => {
    const created = await store.createResource('Patient', {
      resourceType: 'Patient',
    });

    await expect(
      store.updateResource('Patient', {
        resourceType: 'Patient',
        id: created.id,
      }, { ifMatch: 'wrong-version-id' }),
    ).rejects.toThrow(ResourceVersionConflictError);
  });

  // =========================================================================
  // 10. DELETE 鈥?soft delete, content preserved in main table
  // =========================================================================
  it('deleteResource performs soft delete with content preserved', async () => {
    const created = await store.createResource('Patient', {
      resourceType: 'Patient',
      name: [{ family: 'ToDelete' }],
    });

    await store.deleteResource('Patient', created.id);

    // Main table: deleted=1, content preserved
    const row = await adapter.queryOne<{ deleted: number; content: string }>(
      'SELECT "deleted", "content" FROM "Patient" WHERE "id" = ?',
      [created.id],
    );
    expect(row).toBeDefined();
    expect(row!.deleted).toBe(1);
    expect(row!.content).toContain('ToDelete');
  });

  // =========================================================================
  // 11. DELETE 鈥?creates history entry with deleted=1
  // =========================================================================
  it('deleteResource creates a history entry with deleted=1', async () => {
    const created = await store.createResource('Patient', {
      resourceType: 'Patient',
    });

    await store.deleteResource('Patient', created.id);

    const histRows = await adapter.query<{ deleted: number; versionId: string }>(
      'SELECT "deleted", "versionId" FROM "Patient_History" WHERE "id" = ? ORDER BY "versionSeq"',
      [created.id],
    );
    expect(histRows).toHaveLength(2);
    expect(histRows[0].deleted).toBe(0); // create
    expect(histRows[1].deleted).toBe(1); // delete
  });

  // =========================================================================
  // 12. HISTORY 鈥?returns entries ordered by versionSeq DESC
  // =========================================================================
  it('readHistory returns versions in newest-first order', async () => {
    const created = await store.createResource('Patient', {
      resourceType: 'Patient',
      name: [{ family: 'V1' }],
    });

    await store.updateResource('Patient', {
      resourceType: 'Patient',
      id: created.id,
      name: [{ family: 'V2' }],
    });

    await store.updateResource('Patient', {
      resourceType: 'Patient',
      id: created.id,
      name: [{ family: 'V3' }],
    });

    const history = await store.readHistory('Patient', created.id);
    expect(history).toHaveLength(3);
    // Newest first (versionSeq DESC)
    expect(history[0].versionId).not.toBe(created.meta.versionId);
    expect(history[2].versionId).toBe(created.meta.versionId);
    expect(history[0].deleted).toBe(false);
  });
});
