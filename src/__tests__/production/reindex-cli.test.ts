/**
 * Reindex CLI v2 Tests — 12 tests on SQLite in-memory.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SQLiteAdapter } from '../../db/sqlite-adapter.js';
import { reindexResourceTypeV2, reindexAllV2 } from '../../cli/reindex.js';

describe('ReindexCLI v2 (SQLite integration)', () => {
  let adapter: SQLiteAdapter;

  beforeEach(async () => {
    adapter = new SQLiteAdapter(':memory:');
    // Create a minimal Patient table
    await adapter.execute(`
      CREATE TABLE "Patient" (
        "id" TEXT PRIMARY KEY,
        "versionId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "lastUpdated" TEXT NOT NULL,
        "deleted" INTEGER NOT NULL DEFAULT 0
      )
    `);
    await adapter.execute(`
      CREATE TABLE "Patient_History" (
        "versionSeq" INTEGER PRIMARY KEY AUTOINCREMENT,
        "id" TEXT NOT NULL,
        "versionId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "lastUpdated" TEXT NOT NULL,
        "deleted" INTEGER NOT NULL DEFAULT 0
      )
    `);
    await adapter.execute(`
      CREATE TABLE "Patient_References" (
        "resourceId" TEXT NOT NULL,
        "targetType" TEXT NOT NULL,
        "targetId" TEXT NOT NULL,
        "code" TEXT NOT NULL
      )
    `);
  });

  afterEach(async () => {
    await adapter.close();
  });

  function insertPatient(id: string, content?: object): Promise<{ changes: number }> {
    const c = content ?? { resourceType: 'Patient', id, name: [{ family: 'Test' }] };
    return adapter.execute(
      `INSERT INTO "Patient" ("id", "versionId", "content", "lastUpdated", "deleted") VALUES (?, ?, ?, ?, 0)`,
      [id, '1', JSON.stringify(c), new Date().toISOString()],
    );
  }

  // =========================================================================
  // 1. reindexResourceTypeV2 processes resources
  // =========================================================================
  it('reindexResourceTypeV2 processes resources', async () => {
    await insertPatient('p1');
    await insertPatient('p2');
    await insertPatient('p3');

    const result = await reindexResourceTypeV2(adapter, 'Patient');
    expect(result.processed).toBe(3);
    expect(result.updated).toBe(3);
    expect(result.errors).toBe(0);
  });

  // =========================================================================
  // 2. uses StorageAdapter (? placeholders)
  // =========================================================================
  it('uses StorageAdapter with ? placeholders (no $1)', async () => {
    await insertPatient('p1');
    // If it works on SQLite, it's using ? placeholders
    const result = await reindexResourceTypeV2(adapter, 'Patient');
    expect(result.processed).toBe(1);
  });

  // =========================================================================
  // 3. calls progress callback
  // =========================================================================
  it('calls progress callback', async () => {
    await insertPatient('p1');
    await insertPatient('p2');

    const onProgress = vi.fn();
    await reindexResourceTypeV2(adapter, 'Patient', onProgress);

    expect(onProgress).toHaveBeenCalled();
    const call = onProgress.mock.calls[onProgress.mock.calls.length - 1][0];
    expect(call.resourceType).toBe('Patient');
    expect(call.processed).toBe(2);
    expect(call.total).toBe(2);
  });

  // =========================================================================
  // 4. handles empty table
  // =========================================================================
  it('handles empty table gracefully', async () => {
    const result = await reindexResourceTypeV2(adapter, 'Patient');
    expect(result.processed).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.errors).toBe(0);
  });

  // =========================================================================
  // 5. reindexAllV2 processes multiple types
  // =========================================================================
  it('reindexAllV2 processes multiple resource types', async () => {
    await insertPatient('p1');

    // Create Observation table
    await adapter.execute(`
      CREATE TABLE "Observation" (
        "id" TEXT PRIMARY KEY,
        "versionId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "lastUpdated" TEXT NOT NULL,
        "deleted" INTEGER NOT NULL DEFAULT 0
      )
    `);
    await adapter.execute(
      `INSERT INTO "Observation" ("id", "versionId", "content", "lastUpdated", "deleted") VALUES (?, ?, ?, ?, 0)`,
      ['o1', '1', '{"resourceType":"Observation","id":"o1"}', new Date().toISOString()],
    );

    const result = await reindexAllV2(adapter, ['Patient', 'Observation']);
    expect(result.totalProcessed).toBe(2);
    expect(result.totalUpdated).toBe(2);
    expect(result.byType['Patient'].processed).toBe(1);
    expect(result.byType['Observation'].processed).toBe(1);
  });

  // =========================================================================
  // 6. reindexAllV2 skips missing tables
  // =========================================================================
  it('reindexAllV2 skips missing tables without failing', async () => {
    await insertPatient('p1');
    const result = await reindexAllV2(adapter, ['Patient', 'NonExistentType']);
    expect(result.totalProcessed).toBe(1);
    expect(result.byType['NonExistentType']).toEqual({ processed: 0, updated: 0, errors: 0 });
  });

  // =========================================================================
  // 7. batch processing respects BATCH_SIZE
  // =========================================================================
  it('processes in batches with keyset pagination', async () => {
    // Insert 5 resources
    for (let i = 1; i <= 5; i++) {
      await insertPatient(`p${String(i).padStart(3, '0')}`);
    }

    const result = await reindexResourceTypeV2(adapter, 'Patient');
    expect(result.processed).toBe(5);
    expect(result.updated).toBe(5);
  });

  // =========================================================================
  // 8. reindex updates search columns (infrastructure test)
  // =========================================================================
  it('reindex marks valid JSON resources as updated', async () => {
    await insertPatient('p1', { resourceType: 'Patient', id: 'p1', active: true });
    const result = await reindexResourceTypeV2(adapter, 'Patient');
    expect(result.updated).toBe(1);
  });

  // =========================================================================
  // 9. reindex result includes per-type stats
  // =========================================================================
  it('reindexAllV2 result includes per-type breakdown', async () => {
    await insertPatient('p1');
    await insertPatient('p2');

    const result = await reindexAllV2(adapter, ['Patient']);
    expect(result.byType['Patient']).toBeDefined();
    expect(result.byType['Patient'].processed).toBe(2);
    expect(result.byType['Patient'].updated).toBe(2);
    expect(result.byType['Patient'].errors).toBe(0);
  });

  // =========================================================================
  // 10. reindex handles parse errors gracefully
  // =========================================================================
  it('handles invalid JSON content as error', async () => {
    // Insert a row with invalid JSON
    await adapter.execute(
      `INSERT INTO "Patient" ("id", "versionId", "content", "lastUpdated", "deleted") VALUES (?, ?, ?, ?, 0)`,
      ['bad', '1', 'NOT VALID JSON', new Date().toISOString()],
    );

    const result = await reindexResourceTypeV2(adapter, 'Patient');
    expect(result.processed).toBe(1);
    expect(result.errors).toBe(1);
    expect(result.updated).toBe(0);
  });

  // =========================================================================
  // 11. reindex with 0 resources returns zeros
  // =========================================================================
  it('reindexAllV2 with empty types list returns zeros', async () => {
    const result = await reindexAllV2(adapter, []);
    expect(result.totalProcessed).toBe(0);
    expect(result.totalUpdated).toBe(0);
    expect(result.totalErrors).toBe(0);
  });

  // =========================================================================
  // 12. reindex result totals are correct
  // =========================================================================
  it('reindexAllV2 totals sum correctly across types', async () => {
    await insertPatient('p1');
    await insertPatient('p2');

    // Insert bad content
    await adapter.execute(
      `INSERT INTO "Patient" ("id", "versionId", "content", "lastUpdated", "deleted") VALUES (?, ?, ?, ?, 0)`,
      ['bad', '1', '{invalid', new Date().toISOString()],
    );

    const result = await reindexAllV2(adapter, ['Patient']);
    expect(result.totalProcessed).toBe(3);
    expect(result.totalUpdated).toBe(2);
    expect(result.totalErrors).toBe(1);
    expect(result.totalProcessed).toBe(
      result.totalUpdated + result.totalErrors,
    );
  });
});
