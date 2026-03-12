/**
 * MigrationRunner Tests
 *
 * Integration tests for the schema migration runner against real PostgreSQL.
 * Uses a dedicated test table prefix to avoid interfering with the main schema.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { DatabaseClient } from "../../db/client.js";
import { MigrationRunner } from "../../migrations/migration-runner.js";
import type { Migration } from "../../migrations/types.js";

// =============================================================================
// Setup
// =============================================================================

let db: DatabaseClient;

beforeAll(async () => {
  db = new DatabaseClient({
    host: process.env["DB_HOST"] ?? "localhost",
    port: Number(process.env["DB_PORT"] ?? 5433),
    database: process.env["DB_NAME"] ?? "medxai_dev",
    user: process.env["DB_USER"] ?? "postgres",
    password: process.env["DB_PASSWORD"] ?? "assert",
  });

  const alive = await db.ping();
  if (!alive) {
    throw new Error("Cannot connect to PostgreSQL.");
  }
});

afterAll(async () => {
  await db?.close();
});

beforeEach(async () => {
  // Clean up tracking table before each test
  await db.query('DROP TABLE IF EXISTS "_migrations" CASCADE');
});

// =============================================================================
// Test Migrations
// =============================================================================

const testMigration1: Migration = {
  version: 1,
  description: "Create test_migrate_1 table",
  up: [
    `CREATE TABLE IF NOT EXISTS "test_migrate_1" (id SERIAL PRIMARY KEY, name TEXT)`,
  ],
  down: [
    `DROP TABLE IF EXISTS "test_migrate_1"`,
  ],
};

const testMigration2: Migration = {
  version: 2,
  description: "Create test_migrate_2 table",
  up: [
    `CREATE TABLE IF NOT EXISTS "test_migrate_2" (id SERIAL PRIMARY KEY, value INTEGER)`,
  ],
  down: [
    `DROP TABLE IF EXISTS "test_migrate_2"`,
  ],
};

const testMigration3: Migration = {
  version: 3,
  description: "Add column to test_migrate_1",
  up: [
    `ALTER TABLE "test_migrate_1" ADD COLUMN IF NOT EXISTS email TEXT`,
  ],
  down: [
    `ALTER TABLE "test_migrate_1" DROP COLUMN IF EXISTS email`,
  ],
};

// Cleanup helper
async function cleanupTestTables(): Promise<void> {
  await db.query('DROP TABLE IF EXISTS "test_migrate_1" CASCADE');
  await db.query('DROP TABLE IF EXISTS "test_migrate_2" CASCADE');
  await db.query('DROP TABLE IF EXISTS "_migrations" CASCADE');
}

// =============================================================================
// Tests: ensureTrackingTable
// =============================================================================

describe("MigrationRunner — ensureTrackingTable", () => {
  it("creates _migrations table if not exists", async () => {
    const runner = new MigrationRunner(db, []);
    await runner.ensureTrackingTable();

    const result = await db.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_migrations')`,
    );
    expect(result.rows[0].exists).toBe(true);
  });

  it("is idempotent", async () => {
    const runner = new MigrationRunner(db, []);
    await runner.ensureTrackingTable();
    await runner.ensureTrackingTable(); // second call should not throw
    const result = await db.query(`SELECT COUNT(*) FROM "_migrations"`);
    expect(Number(result.rows[0].count)).toBe(0);
  });
});

// =============================================================================
// Tests: up
// =============================================================================

describe("MigrationRunner — up", () => {
  it("applies all pending migrations", async () => {
    const runner = new MigrationRunner(db, [testMigration1, testMigration2]);
    const result = await runner.up();

    expect(result.action).toBe("up");
    expect(result.applied).toEqual([1, 2]);
    expect(result.currentVersion).toBe(2);
    expect(result.errors).toEqual([]);

    // Verify tables created
    const t1 = await db.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_migrate_1')`);
    const t2 = await db.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_migrate_2')`);
    expect(t1.rows[0].exists).toBe(true);
    expect(t2.rows[0].exists).toBe(true);

    await cleanupTestTables();
  });

  it("skips already-applied migrations", async () => {
    const runner = new MigrationRunner(db, [testMigration1, testMigration2]);

    // Apply first
    await runner.up();

    // Apply again — should be no-op
    const result = await runner.up();
    expect(result.action).toBe("none");
    expect(result.applied).toEqual([]);
    expect(result.currentVersion).toBe(2);

    await cleanupTestTables();
  });

  it("applies up to target version", async () => {
    const runner = new MigrationRunner(db, [testMigration1, testMigration2, testMigration3]);
    const result = await runner.up(2);

    expect(result.applied).toEqual([1, 2]);
    expect(result.currentVersion).toBe(2);

    // v3 should NOT be applied
    const status = await runner.status();
    expect(status.pendingVersions).toEqual([3]);

    await cleanupTestTables();
  });

  it("applies remaining migrations after partial", async () => {
    const runner = new MigrationRunner(db, [testMigration1, testMigration2, testMigration3]);

    // Apply v1 only
    await runner.up(1);

    // Apply remaining
    const result = await runner.up();
    expect(result.applied).toEqual([2, 3]);
    expect(result.currentVersion).toBe(3);

    await cleanupTestTables();
  });

  it("handles migration errors and stops", async () => {
    const badMigration: Migration = {
      version: 99,
      description: "Bad migration",
      up: [`CREATE TABLE "test_migrate_1" (id SERIAL PRIMARY KEY)`, `INVALID SQL STATEMENT`],
      down: [`DROP TABLE IF EXISTS "test_migrate_1"`],
    };

    const runner = new MigrationRunner(db, [badMigration]);
    const result = await runner.up();

    expect(result.errors.length).toBe(1);
    expect(result.errors[0].version).toBe(99);

    await cleanupTestTables();
  });

  it("returns none when no migrations available", async () => {
    const runner = new MigrationRunner(db, []);
    const result = await runner.up();

    expect(result.action).toBe("none");
    expect(result.applied).toEqual([]);
    expect(result.currentVersion).toBe(0);
  });
});

// =============================================================================
// Tests: down
// =============================================================================

describe("MigrationRunner — down", () => {
  it("reverts all migrations when target is 0", async () => {
    const runner = new MigrationRunner(db, [testMigration1, testMigration2]);

    await runner.up();
    const result = await runner.down(0);

    expect(result.action).toBe("down");
    expect(result.applied).toEqual([2, 1]); // reverse order
    expect(result.currentVersion).toBe(0);

    // Verify tables dropped
    const t1 = await db.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_migrate_1')`);
    expect(t1.rows[0].exists).toBe(false);

    await cleanupTestTables();
  });

  it("reverts to specific version", async () => {
    const runner = new MigrationRunner(db, [testMigration1, testMigration2, testMigration3]);

    await runner.up();
    const result = await runner.down(1);

    expect(result.applied).toEqual([3, 2]); // v3 and v2 reverted
    expect(result.currentVersion).toBe(1);

    // test_migrate_1 should still exist (v1 not reverted)
    const t1 = await db.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_migrate_1')`);
    expect(t1.rows[0].exists).toBe(true);

    await cleanupTestTables();
  });

  it("returns none when nothing to revert", async () => {
    const runner = new MigrationRunner(db, [testMigration1]);
    const result = await runner.down(0);

    expect(result.action).toBe("none");
    expect(result.applied).toEqual([]);
  });
});

// =============================================================================
// Tests: status
// =============================================================================

describe("MigrationRunner — status", () => {
  it("reports empty state correctly", async () => {
    const runner = new MigrationRunner(db, [testMigration1, testMigration2]);
    const status = await runner.status();

    expect(status.currentVersion).toBe(0);
    expect(status.appliedVersions).toEqual([]);
    expect(status.availableVersions).toEqual([1, 2]);
    expect(status.pendingVersions).toEqual([1, 2]);
  });

  it("reports partial state correctly", async () => {
    const runner = new MigrationRunner(db, [testMigration1, testMigration2]);
    await runner.up(1);

    const status = await runner.status();
    expect(status.currentVersion).toBe(1);
    expect(status.appliedVersions).toEqual([1]);
    expect(status.pendingVersions).toEqual([2]);

    await cleanupTestTables();
  });

  it("reports fully applied state", async () => {
    const runner = new MigrationRunner(db, [testMigration1, testMigration2]);
    await runner.up();

    const status = await runner.status();
    expect(status.currentVersion).toBe(2);
    expect(status.appliedVersions).toEqual([1, 2]);
    expect(status.pendingVersions).toEqual([]);

    await cleanupTestTables();
  });
});

// =============================================================================
// Tests: getRecords
// =============================================================================

describe("MigrationRunner — getRecords", () => {
  it("returns applied records with timestamps", async () => {
    const runner = new MigrationRunner(db, [testMigration1]);
    await runner.up();

    const records = await runner.getRecords();
    expect(records).toHaveLength(1);
    expect(records[0].version).toBe(1);
    expect(records[0].description).toBe("Create test_migrate_1 table");
    expect(records[0].applied_at).toBeInstanceOf(Date);

    await cleanupTestTables();
  });
});

// =============================================================================
// Tests: ordering
// =============================================================================

describe("MigrationRunner — ordering", () => {
  it("sorts migrations by version regardless of input order", async () => {
    // Provide migrations in reverse order
    const runner = new MigrationRunner(db, [testMigration2, testMigration1]);
    const result = await runner.up();

    // Should apply in version order
    expect(result.applied).toEqual([1, 2]);

    await cleanupTestTables();
  });
});
