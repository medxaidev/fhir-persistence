/**
 * PostgresAdapter Integration Tests — Real PostgreSQL (localhost:5433)
 *
 * Tests the full PostgresAdapter against a live PostgreSQL database.
 * Covers: CRUD, transactions, search SQL, schema DDL, migrations, FhirStore.
 *
 * Connection: host=localhost port=5433 database=medxai_dev user=postgres password=assert
 *
 * Each test uses a unique schema prefix to avoid conflicts.
 * Tables are dropped in afterAll.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { PostgresAdapter } from '../../db/postgres-adapter.js';
import { PostgresDialect } from '../../db/postgres-dialect.js';
import { FhirStore } from '../../store/fhir-store.js';
import { MigrationRunnerV2 } from '../../migrations/migration-runner.js';
import type { MigrationV2 } from '../../migrations/migration-runner.js';
import { buildSearchSQLv2, buildCountSQLv2 } from '../../search/search-sql-builder.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import { executeSearchV2 } from '../../search/search-executor.js';
import type { SearchRequest } from '../../search/types.js';
import { generateCreateMainTable, generateCreateHistoryTable, generateCreateReferencesTable, generateCreateIndex } from '../../schema/ddl-generator.js';
import { buildResourceTableSet } from '../../schema/table-schema-builder.js';
import { StructureDefinitionRegistry } from '../../registry/structure-definition-registry.js';

// =============================================================================
// Connection config
// =============================================================================

const PG_CONFIG = {
  host: 'localhost',
  port: 5433,
  database: 'medxai_dev',
  user: 'postgres',
  password: 'assert',
};

// Unique prefix per test run to avoid conflicts
const PREFIX = `_test_${Date.now()}`;
const PATIENT_TABLE = `"Patient${PREFIX}"`;
const PATIENT_HISTORY_TABLE = `"Patient${PREFIX}_History"`;
const PATIENT_REFS_TABLE = `"Patient${PREFIX}_References"`;

const dialect = new PostgresDialect();

// =============================================================================
// Helpers
// =============================================================================

function patientDDL(): string[] {
  return [
    `CREATE TABLE IF NOT EXISTS ${PATIENT_TABLE} (
      "id" TEXT NOT NULL PRIMARY KEY,
      "versionId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "lastUpdated" TEXT NOT NULL,
      "deleted" INTEGER NOT NULL DEFAULT 0,
      "_source" TEXT,
      "_profile" TEXT,
      "compartments" TEXT,
      "__gender" TEXT,
      "__genderText" TEXT,
      "__genderSort" TEXT,
      "birthdate" TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS ${PATIENT_HISTORY_TABLE} (
      "versionSeq" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      "id" TEXT NOT NULL,
      "versionId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "lastUpdated" TEXT NOT NULL,
      "deleted" INTEGER NOT NULL DEFAULT 0,
      UNIQUE ("id", "versionId")
    )`,
    `CREATE TABLE IF NOT EXISTS ${PATIENT_REFS_TABLE} (
      "resourceId" TEXT NOT NULL,
      "targetType" TEXT NOT NULL,
      "targetId" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "referenceRaw" TEXT
    )`,
  ];
}

// =============================================================================
// Test Suite
// =============================================================================

describe('PostgresAdapter Integration (real PG)', () => {
  let pool: Pool;
  let adapter: PostgresAdapter;

  beforeAll(async () => {
    pool = new Pool(PG_CONFIG);
    adapter = new PostgresAdapter(pool);

    // Create test tables
    for (const ddl of patientDDL()) {
      await adapter.execute(ddl);
    }
  });

  afterAll(async () => {
    // Drop test tables
    await adapter.execute(`DROP TABLE IF EXISTS ${PATIENT_REFS_TABLE}`);
    await adapter.execute(`DROP TABLE IF EXISTS ${PATIENT_HISTORY_TABLE}`);
    await adapter.execute(`DROP TABLE IF EXISTS ${PATIENT_TABLE}`);
    await adapter.close();
  });

  // ===========================================================================
  // 1. Basic execute + query
  // ===========================================================================

  it('executes INSERT and reports changes', async () => {
    const result = await adapter.execute(
      `INSERT INTO ${PATIENT_TABLE} ("id","versionId","content","lastUpdated","deleted") VALUES (?,?,?,?,0)`,
      ['pg-1', 'v1', '{"resourceType":"Patient","id":"pg-1"}', '2024-01-01T00:00:00Z'],
    );
    expect(result.changes).toBe(1);
  });

  it('queries inserted row', async () => {
    const rows = await adapter.query<{ id: string; content: string }>(
      `SELECT "id","content" FROM ${PATIENT_TABLE} WHERE "id" = ?`,
      ['pg-1'],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('pg-1');
    expect(JSON.parse(rows[0].content).resourceType).toBe('Patient');
  });

  it('queryOne returns single row', async () => {
    const row = await adapter.queryOne<{ id: string }>(
      `SELECT "id" FROM ${PATIENT_TABLE} WHERE "id" = ?`,
      ['pg-1'],
    );
    expect(row).toBeDefined();
    expect(row!.id).toBe('pg-1');
  });

  it('queryOne returns undefined for missing row', async () => {
    const row = await adapter.queryOne<{ id: string }>(
      `SELECT "id" FROM ${PATIENT_TABLE} WHERE "id" = ?`,
      ['nonexistent'],
    );
    expect(row).toBeUndefined();
  });

  // ===========================================================================
  // 2. Transactions
  // ===========================================================================

  it('transaction commits on success', async () => {
    await adapter.transaction(async (tx) => {
      await tx.execute(
        `INSERT INTO ${PATIENT_TABLE} ("id","versionId","content","lastUpdated","deleted") VALUES (?,?,?,?,0)`,
        ['pg-tx-1', 'v1', '{"resourceType":"Patient","id":"pg-tx-1"}', '2024-01-01T00:00:00Z'],
      );
      await tx.execute(
        `INSERT INTO ${PATIENT_TABLE} ("id","versionId","content","lastUpdated","deleted") VALUES (?,?,?,?,0)`,
        ['pg-tx-2', 'v1', '{"resourceType":"Patient","id":"pg-tx-2"}', '2024-01-01T00:00:00Z'],
      );
    });

    const rows = await adapter.query<{ id: string }>(
      `SELECT "id" FROM ${PATIENT_TABLE} WHERE "id" IN (?,?)`,
      ['pg-tx-1', 'pg-tx-2'],
    );
    expect(rows).toHaveLength(2);
  });

  it('transaction rolls back on error', async () => {
    await expect(
      adapter.transaction(async (tx) => {
        await tx.execute(
          `INSERT INTO ${PATIENT_TABLE} ("id","versionId","content","lastUpdated","deleted") VALUES (?,?,?,?,0)`,
          ['pg-rollback', 'v1', '{}', '2024-01-01T00:00:00Z'],
        );
        throw new Error('deliberate rollback');
      }),
    ).rejects.toThrow('deliberate rollback');

    const row = await adapter.queryOne<{ id: string }>(
      `SELECT "id" FROM ${PATIENT_TABLE} WHERE "id" = ?`,
      ['pg-rollback'],
    );
    expect(row).toBeUndefined();
  });

  it('transaction returns a value', async () => {
    const count = await adapter.transaction(async (tx) => {
      const rows = await tx.query<{ id: string }>(
        `SELECT "id" FROM ${PATIENT_TABLE} WHERE "deleted" = 0`,
      );
      return rows.length;
    });
    expect(count).toBeGreaterThanOrEqual(3); // pg-1, pg-tx-1, pg-tx-2
  });

  it('transaction queryOne works', async () => {
    const row = await adapter.transaction(async (tx) => {
      return tx.queryOne<{ id: string; content: string }>(
        `SELECT "id","content" FROM ${PATIENT_TABLE} WHERE "id" = ?`,
        ['pg-1'],
      );
    });
    expect(row).toBeDefined();
    expect(row!.id).toBe('pg-1');
  });

  // ===========================================================================
  // 3. UPDATE and DELETE
  // ===========================================================================

  it('updates a row', async () => {
    const result = await adapter.execute(
      `UPDATE ${PATIENT_TABLE} SET "versionId" = ? WHERE "id" = ?`,
      ['v2', 'pg-1'],
    );
    expect(result.changes).toBe(1);

    const row = await adapter.queryOne<{ versionId: string }>(
      `SELECT "versionId" FROM ${PATIENT_TABLE} WHERE "id" = ?`,
      ['pg-1'],
    );
    expect(row!.versionId).toBe('v2');
  });

  it('soft-deletes a row', async () => {
    await adapter.execute(
      `UPDATE ${PATIENT_TABLE} SET "deleted" = 1 WHERE "id" = ?`,
      ['pg-tx-2'],
    );
    const row = await adapter.queryOne<{ deleted: number }>(
      `SELECT "deleted" FROM ${PATIENT_TABLE} WHERE "id" = ?`,
      ['pg-tx-2'],
    );
    expect(row!.deleted).toBe(1);
  });

  // ===========================================================================
  // 4. History table with GENERATED ALWAYS AS IDENTITY
  // ===========================================================================

  it('inserts into history table with auto-increment versionSeq', async () => {
    await adapter.execute(
      `INSERT INTO ${PATIENT_HISTORY_TABLE} ("id","versionId","content","lastUpdated","deleted") VALUES (?,?,?,?,0)`,
      ['pg-1', 'v1', '{"resourceType":"Patient","id":"pg-1","v":"1"}', '2024-01-01T00:00:00Z'],
    );
    await adapter.execute(
      `INSERT INTO ${PATIENT_HISTORY_TABLE} ("id","versionId","content","lastUpdated","deleted") VALUES (?,?,?,?,0)`,
      ['pg-1', 'v2', '{"resourceType":"Patient","id":"pg-1","v":"2"}', '2024-01-02T00:00:00Z'],
    );

    const rows = await adapter.query<{ versionSeq: number; versionId: string }>(
      `SELECT "versionSeq","versionId" FROM ${PATIENT_HISTORY_TABLE} WHERE "id" = ? ORDER BY "versionSeq"`,
      ['pg-1'],
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].versionSeq).toBeLessThan(rows[1].versionSeq);
    expect(rows[0].versionId).toBe('v1');
    expect(rows[1].versionId).toBe('v2');
  });

  // ===========================================================================
  // 5. References table
  // ===========================================================================

  it('inserts and queries reference rows', async () => {
    await adapter.execute(
      `INSERT INTO ${PATIENT_REFS_TABLE} ("resourceId","targetType","targetId","code","referenceRaw") VALUES (?,?,?,?,?)`,
      ['pg-1', 'Organization', 'org-1', 'managingOrganization', 'Organization/org-1'],
    );

    const rows = await adapter.query<{ targetId: string }>(
      `SELECT "targetId" FROM ${PATIENT_REFS_TABLE} WHERE "resourceId" = ?`,
      ['pg-1'],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].targetId).toBe('org-1');
  });

  // ===========================================================================
  // 6. Placeholder rewriting (? → $N)
  // ===========================================================================

  it('handles multiple placeholders correctly', async () => {
    const rows = await adapter.query<{ id: string }>(
      `SELECT "id" FROM ${PATIENT_TABLE} WHERE "id" = ? OR "id" = ? ORDER BY "id"`,
      ['pg-1', 'pg-tx-1'],
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].id).toBe('pg-1');
    expect(rows[1].id).toBe('pg-tx-1');
  });

  it('handles zero-param queries', async () => {
    const rows = await adapter.query<{ id: string }>(
      `SELECT "id" FROM ${PATIENT_TABLE} WHERE "deleted" = 0 ORDER BY "id" LIMIT 100`,
    );
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });

  // ===========================================================================
  // 7. queryStream
  // ===========================================================================

  it('streams rows via queryStream', async () => {
    let count = 0;
    for await (const row of adapter.queryStream(
      `SELECT "id" FROM ${PATIENT_TABLE} WHERE "deleted" = 0`,
    )) {
      expect((row as Record<string, unknown>).id).toBeDefined();
      count++;
    }
    expect(count).toBeGreaterThanOrEqual(2);
  });

  // ===========================================================================
  // 8. DDL generation for PostgreSQL dialect
  // ===========================================================================

  it('generates valid PG DDL for Patient table set', () => {
    const sdReg = new StructureDefinitionRegistry();
    sdReg.index({
      resourceType: 'StructureDefinition',
      url: 'http://hl7.org/fhir/StructureDefinition/Patient',
      name: 'Patient',
      type: 'Patient',
      kind: 'resource',
      abstract: false,
      status: 'active',
      snapshot: { element: [] },
    } as any);

    const spReg = new SearchParameterRegistry();
    spReg.indexBundle({
      resourceType: 'Bundle',
      entry: [
        { resource: { resourceType: 'SearchParameter', url: 'x', name: 'gender', code: 'gender', base: ['Patient'], type: 'token', expression: 'Patient.gender' } },
      ],
    });

    const tableSet = buildResourceTableSet('Patient', sdReg, spReg);
    const mainDDL = generateCreateMainTable(tableSet.main, 'postgres');
    const histDDL = generateCreateHistoryTable(tableSet.history, 'postgres');
    const refsDDL = generateCreateReferencesTable(tableSet.references, 'postgres');

    // PG dialect: GENERATED ALWAYS AS IDENTITY, no AUTOINCREMENT
    expect(histDDL).toContain('GENERATED ALWAYS AS IDENTITY');
    expect(histDDL).not.toContain('AUTOINCREMENT');

    // All should have CREATE TABLE IF NOT EXISTS
    expect(mainDDL).toContain('CREATE TABLE IF NOT EXISTS');
    expect(refsDDL).toContain('CREATE TABLE IF NOT EXISTS');
  });

  // ===========================================================================
  // 9. MigrationRunnerV2 on PostgreSQL
  // ===========================================================================

  it('runs migrations on PostgreSQL', async () => {
    const migrations: MigrationV2[] = [
      {
        version: 1,
        description: 'create-test-table',
        type: 'file',
        up: [`CREATE TABLE IF NOT EXISTS "_migtest${PREFIX}" ("id" TEXT PRIMARY KEY, "val" TEXT)`],
        down: [`DROP TABLE IF EXISTS "_migtest${PREFIX}"`],
      },
      {
        version: 2,
        description: 'add-column',
        type: 'file',
        up: [`ALTER TABLE "_migtest${PREFIX}" ADD COLUMN "extra" TEXT`],
        down: [`ALTER TABLE "_migtest${PREFIX}" DROP COLUMN "extra"`],
      },
    ];

    const runner = new MigrationRunnerV2(adapter, migrations);

    // Manually create tracking table with PG-compatible DDL
    await adapter.execute(`CREATE TABLE IF NOT EXISTS "_migrations" (
      "version" INTEGER PRIMARY KEY,
      "description" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'file',
      "applied_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    const result = await runner.up();
    expect(result.applied).toHaveLength(2);

    // Verify table exists with the extra column
    await adapter.execute(
      `INSERT INTO "_migtest${PREFIX}" ("id","val","extra") VALUES (?,?,?)`,
      ['m1', 'hello', 'world'],
    );
    const row = await adapter.queryOne<{ extra: string }>(
      `SELECT "extra" FROM "_migtest${PREFIX}" WHERE "id" = ?`,
      ['m1'],
    );
    expect(row!.extra).toBe('world');

    // Revert
    const downResult = await runner.down(0);
    expect(downResult.applied).toHaveLength(2);

    // Cleanup
    await adapter.execute(`DROP TABLE IF EXISTS "_migrations"`);
    await adapter.execute(`DROP TABLE IF EXISTS "_migtest${PREFIX}"`);
  });

  // ===========================================================================
  // 10. Search SQL generation for PostgreSQL dialect
  // ===========================================================================

  it('buildSearchSQLv2 with postgres dialect uses ? (rewritten by adapter)', () => {
    const spReg = new SearchParameterRegistry();
    spReg.indexBundle({
      resourceType: 'Bundle',
      entry: [
        { resource: { resourceType: 'SearchParameter', url: 'x', name: 'gender', code: 'gender', base: ['Patient'], type: 'token', expression: 'Patient.gender' } },
      ],
    });

    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'gender', values: ['male'] }],
    };

    const sql = buildSearchSQLv2(request, spReg, dialect);
    // PG dialect: token search uses ARRAY operator, not json_each
    expect(sql.sql).toContain('ARRAY');
    expect(sql.sql).not.toContain('json_each');
  });

  it('buildCountSQLv2 with postgres dialect uses array syntax', () => {
    const spReg = new SearchParameterRegistry();
    spReg.indexBundle({
      resourceType: 'Bundle',
      entry: [
        { resource: { resourceType: 'SearchParameter', url: 'x', name: 'gender', code: 'gender', base: ['Patient'], type: 'token', expression: 'Patient.gender' } },
      ],
    });

    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'gender', values: ['male'] }],
    };

    const sql = buildCountSQLv2(request, spReg, dialect);
    expect(sql.sql).toContain('COUNT(*)');
    expect(sql.sql).not.toContain('json_each');
  });

  // ===========================================================================
  // 11. Concurrent transactions
  // ===========================================================================

  it('handles concurrent transactions', async () => {
    const results = await Promise.all([
      adapter.transaction(async (tx) => {
        await tx.execute(
          `INSERT INTO ${PATIENT_TABLE} ("id","versionId","content","lastUpdated","deleted") VALUES (?,?,?,?,0)`,
          ['pg-conc-1', 'v1', '{}', '2024-01-01T00:00:00Z'],
        );
        return 'a';
      }),
      adapter.transaction(async (tx) => {
        await tx.execute(
          `INSERT INTO ${PATIENT_TABLE} ("id","versionId","content","lastUpdated","deleted") VALUES (?,?,?,?,0)`,
          ['pg-conc-2', 'v1', '{}', '2024-01-01T00:00:00Z'],
        );
        return 'b';
      }),
    ]);
    expect(results).toContain('a');
    expect(results).toContain('b');

    const rows = await adapter.query<{ id: string }>(
      `SELECT "id" FROM ${PATIENT_TABLE} WHERE "id" IN (?,?)`,
      ['pg-conc-1', 'pg-conc-2'],
    );
    expect(rows).toHaveLength(2);
  });

  // ===========================================================================
  // 12. Batch operations in transaction
  // ===========================================================================

  it('batch inserts 100 rows in a transaction', async () => {
    await adapter.transaction(async (tx) => {
      for (let i = 0; i < 100; i++) {
        await tx.execute(
          `INSERT INTO ${PATIENT_TABLE} ("id","versionId","content","lastUpdated","deleted") VALUES (?,?,?,?,0)`,
          [`pg-batch-${i}`, 'v1', `{"resourceType":"Patient","id":"pg-batch-${i}"}`, '2024-01-01T00:00:00Z'],
        );
      }
    });

    const countRow = await adapter.queryOne<{ count: string }>(
      `SELECT COUNT(*) as "count" FROM ${PATIENT_TABLE} WHERE "id" LIKE ?`,
      ['pg-batch-%'],
    );
    expect(parseInt(countRow!.count)).toBe(100);
  });

  // ===========================================================================
  // 13. NULL handling
  // ===========================================================================

  it('handles NULL values correctly', async () => {
    await adapter.execute(
      `INSERT INTO ${PATIENT_TABLE} ("id","versionId","content","lastUpdated","deleted","_source","_profile") VALUES (?,?,?,?,0,?,?)`,
      ['pg-null', 'v1', '{}', '2024-01-01T00:00:00Z', null, null],
    );

    const row = await adapter.queryOne<{ _source: string | null; _profile: string | null }>(
      `SELECT "_source","_profile" FROM ${PATIENT_TABLE} WHERE "id" = ?`,
      ['pg-null'],
    );
    expect(row!._source).toBeNull();
    expect(row!._profile).toBeNull();
  });

  // ===========================================================================
  // 14. Close and reopen guard
  // ===========================================================================

  it('throws after close', async () => {
    const pool2 = new Pool(PG_CONFIG);
    const adapter2 = new PostgresAdapter(pool2);
    await adapter2.close();

    await expect(adapter2.execute('SELECT 1')).rejects.toThrow('closed');
    await expect(adapter2.query('SELECT 1')).rejects.toThrow('closed');
    await expect(adapter2.queryOne('SELECT 1')).rejects.toThrow('closed');
  });
});
