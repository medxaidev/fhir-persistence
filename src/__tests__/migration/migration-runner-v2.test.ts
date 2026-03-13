/**
 * Migration Runner v2 Integration Tests — 12 tests on SQLite in-memory.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteAdapter } from '../../db/sqlite-adapter.js';
import { MigrationRunnerV2 } from '../../migrations/migration-runner.js';
import type { MigrationV2 } from '../../migrations/migration-runner.js';

describe('MigrationRunnerV2 (SQLite integration)', () => {
  let adapter: SQLiteAdapter;

  beforeEach(() => {
    adapter = new SQLiteAdapter(':memory:');
  });

  afterEach(async () => {
    await adapter.close();
  });

  // =========================================================================
  // 1. up: applies pending migrations
  // =========================================================================
  it('up applies pending migrations', async () => {
    const migrations: MigrationV2[] = [
      {
        version: 1,
        description: 'Create test table',
        up: ['CREATE TABLE "test" ("id" TEXT PRIMARY KEY);'],
        down: ['DROP TABLE "test";'],
        type: 'file',
      },
    ];
    const runner = new MigrationRunnerV2(adapter, migrations);
    const result = await runner.up();

    expect(result.action).toBe('up');
    expect(result.applied).toEqual([1]);
    expect(result.currentVersion).toBe(1);
    expect(result.errors).toHaveLength(0);

    // Verify table was created
    const rows = await adapter.query('SELECT name FROM sqlite_master WHERE type = ? AND name = ?', ['table', 'test']);
    expect(rows).toHaveLength(1);
  });

  // =========================================================================
  // 2. up: skips already-applied migrations
  // =========================================================================
  it('up skips already-applied migrations', async () => {
    const migrations: MigrationV2[] = [
      {
        version: 1,
        description: 'First',
        up: ['CREATE TABLE "t1" ("id" TEXT PRIMARY KEY);'],
        down: ['DROP TABLE "t1";'],
        type: 'file',
      },
      {
        version: 2,
        description: 'Second',
        up: ['CREATE TABLE "t2" ("id" TEXT PRIMARY KEY);'],
        down: ['DROP TABLE "t2";'],
        type: 'file',
      },
    ];
    const runner = new MigrationRunnerV2(adapter, migrations);

    // Apply first time
    await runner.up();

    // Apply again — should be no-op
    const result = await runner.up();
    expect(result.action).toBe('none');
    expect(result.applied).toHaveLength(0);
    expect(result.currentVersion).toBe(2);
  });

  // =========================================================================
  // 3. down: reverts to target version
  // =========================================================================
  it('down reverts to target version', async () => {
    const migrations: MigrationV2[] = [
      {
        version: 1,
        description: 'Create t1',
        up: ['CREATE TABLE "t1" ("id" TEXT PRIMARY KEY);'],
        down: ['DROP TABLE "t1";'],
        type: 'file',
      },
      {
        version: 2,
        description: 'Create t2',
        up: ['CREATE TABLE "t2" ("id" TEXT PRIMARY KEY);'],
        down: ['DROP TABLE "t2";'],
        type: 'file',
      },
    ];
    const runner = new MigrationRunnerV2(adapter, migrations);
    await runner.up();

    const result = await runner.down(1);
    expect(result.action).toBe('down');
    expect(result.applied).toEqual([2]);
    expect(result.currentVersion).toBe(1);

    // t2 should be gone
    const rows = await adapter.query('SELECT name FROM sqlite_master WHERE type = ? AND name = ?', ['table', 't2']);
    expect(rows).toHaveLength(0);
  });

  // =========================================================================
  // 4. status: reports current/pending versions
  // =========================================================================
  it('status reports current and pending versions', async () => {
    const migrations: MigrationV2[] = [
      { version: 1, description: 'A', up: ['SELECT 1;'], down: [], type: 'file' },
      { version: 2, description: 'B', up: ['SELECT 1;'], down: [], type: 'file' },
      { version: 3, description: 'C', up: ['SELECT 1;'], down: [], type: 'file' },
    ];
    const runner = new MigrationRunnerV2(adapter, migrations);
    await runner.up(2); // Apply only up to version 2

    const status = await runner.status();
    expect(status.currentVersion).toBe(2);
    expect(status.appliedVersions).toEqual([1, 2]);
    expect(status.pendingVersions).toEqual([3]);
    expect(status.availableVersions).toEqual([1, 2, 3]);
  });

  // =========================================================================
  // 5. tracking table auto-created
  // =========================================================================
  it('auto-creates tracking table on first use', async () => {
    const runner = new MigrationRunnerV2(adapter);
    await runner.ensureTrackingTable();

    const rows = await adapter.query('SELECT name FROM sqlite_master WHERE type = ? AND name = ?', ['table', '_migrations']);
    expect(rows).toHaveLength(1);
  });

  // =========================================================================
  // 6. transaction rollback on migration failure
  // =========================================================================
  it('rolls back on migration failure', async () => {
    const migrations: MigrationV2[] = [
      {
        version: 1,
        description: 'Good',
        up: ['CREATE TABLE "good" ("id" TEXT PRIMARY KEY);'],
        down: ['DROP TABLE "good";'],
        type: 'file',
      },
      {
        version: 2,
        description: 'Bad — invalid SQL',
        up: ['CREATE TABLE "bad" ("id" TEXT PRIMARY KEY);', 'INVALID SQL STATEMENT;'],
        down: [],
        type: 'file',
      },
    ];
    const runner = new MigrationRunnerV2(adapter, migrations);
    const result = await runner.up();

    expect(result.applied).toEqual([1]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].version).toBe(2);
    expect(result.currentVersion).toBe(1);

    // "bad" table should NOT exist (rolled back)
    const rows = await adapter.query('SELECT name FROM sqlite_master WHERE type = ? AND name = ?', ['table', 'bad']);
    expect(rows).toHaveLength(0);
  });

  // =========================================================================
  // 7. type=ig migrations tracked
  // =========================================================================
  it('tracks IG migrations with type=ig', async () => {
    const migrations: MigrationV2[] = [
      { version: 1, description: 'IG migration', up: ['SELECT 1;'], down: [], type: 'ig' },
    ];
    const runner = new MigrationRunnerV2(adapter, migrations);
    await runner.up();

    const records = await runner.getRecords();
    expect(records).toHaveLength(1);
    expect(records[0].type).toBe('ig');
    expect(records[0].description).toBe('IG migration');
  });

  // =========================================================================
  // 8. type=file migrations tracked
  // =========================================================================
  it('tracks file migrations with type=file', async () => {
    const migrations: MigrationV2[] = [
      { version: 1, description: 'File migration', up: ['SELECT 1;'], down: [], type: 'file' },
    ];
    const runner = new MigrationRunnerV2(adapter, migrations);
    await runner.up();

    const records = await runner.getRecords();
    expect(records).toHaveLength(1);
    expect(records[0].type).toBe('file');
  });

  // =========================================================================
  // 9. applyIGMigration: applies generated migration
  // =========================================================================
  it('applyIGMigration applies a generated migration with auto-version', async () => {
    const runner = new MigrationRunnerV2(adapter);
    const result = await runner.applyIGMigration({
      up: ['CREATE TABLE "ig_test" ("id" TEXT PRIMARY KEY);'],
      down: [],
      reindexDeltas: [],
      description: 'Add ig_test table',
    });

    expect(result.action).toBe('up');
    expect(result.applied).toEqual([1]);
    expect(result.currentVersion).toBe(1);

    // Verify table created
    const rows = await adapter.query('SELECT name FROM sqlite_master WHERE type = ? AND name = ?', ['table', 'ig_test']);
    expect(rows).toHaveLength(1);

    // Verify tracked as IG
    const records = await runner.getRecords();
    expect(records[0].type).toBe('ig');
  });

  // =========================================================================
  // 10. IG migrations are forward-only (no down)
  // =========================================================================
  it('IG migrations cannot be reverted (forward-only)', async () => {
    const migrations: MigrationV2[] = [
      { version: 1, description: 'File', up: ['SELECT 1;'], down: ['SELECT 1;'], type: 'file' },
      { version: 2, description: 'IG', up: ['SELECT 1;'], down: [], type: 'ig' },
    ];
    const runner = new MigrationRunnerV2(adapter, migrations);
    await runner.up();

    // Try to revert to version 0 — IG migration (v2) should be skipped
    const result = await runner.down(0);
    expect(result.applied).toEqual([1]); // Only file migration reverted
    expect(result.currentVersion).toBe(2); // IG migration still applied
  });

  // =========================================================================
  // 11. getRecords returns all applied records with metadata
  // =========================================================================
  it('getRecords returns records with version, description, type, applied_at', async () => {
    const migrations: MigrationV2[] = [
      { version: 1, description: 'First', up: ['SELECT 1;'], down: [], type: 'file' },
      { version: 2, description: 'Second', up: ['SELECT 1;'], down: [], type: 'ig' },
    ];
    const runner = new MigrationRunnerV2(adapter, migrations);
    await runner.up();

    const records = await runner.getRecords();
    expect(records).toHaveLength(2);
    expect(records[0].version).toBe(1);
    expect(records[0].type).toBe('file');
    expect(records[1].version).toBe(2);
    expect(records[1].type).toBe('ig');
    // applied_at should be a string
    expect(typeof records[0].applied_at).toBe('string');
  });

  // =========================================================================
  // 12. multiple applyIGMigration calls assign incrementing versions
  // =========================================================================
  it('multiple applyIGMigration calls assign incrementing versions', async () => {
    const runner = new MigrationRunnerV2(adapter);

    const r1 = await runner.applyIGMigration({
      up: ['SELECT 1;'], down: [], reindexDeltas: [], description: 'IG v1',
    });
    expect(r1.applied).toEqual([1]);

    const r2 = await runner.applyIGMigration({
      up: ['SELECT 1;'], down: [], reindexDeltas: [], description: 'IG v2',
    });
    expect(r2.applied).toEqual([2]);

    const r3 = await runner.applyIGMigration({
      up: ['SELECT 1;'], down: [], reindexDeltas: [], description: 'IG v3',
    });
    expect(r3.applied).toEqual([3]);
    expect(r3.currentVersion).toBe(3);
  });
});
