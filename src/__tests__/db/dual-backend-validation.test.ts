/**
 * Dual-Backend Validation Test Suite
 *
 * Comprehensive validation of SQLite and PostgreSQL backends covering:
 *   1. Schema DDL correctness 鈥?generate and execute DDL on both backends
 *   2. IG lifecycle 鈥?initial install 鈫?add new IG 鈫?upgrade migration
 *   3. CRUD correctness 鈥?create, read, update, delete, history, vread
 *
 * SQLite: in-memory via BetterSqlite3Adapter
 * PostgreSQL: localhost:5433 (medxai_dev, postgres/assert)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';
import { PostgresAdapter } from '../../db/postgres-adapter.js';
import type { StorageAdapter } from '../../db/adapter.js';
import { FhirStore } from '../../store/fhir-store.js';
import { ResourceNotFoundError, ResourceGoneError, ResourceVersionConflictError } from '../../repo/errors.js';
import { StructureDefinitionRegistry } from '../../registry/structure-definition-registry.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import { buildResourceTableSet } from '../../schema/table-schema-builder.js';
import {
  generateCreateMainTable,
  generateCreateHistoryTable,
  generateCreateReferencesTable,
  generateCreateIndex,
  generateResourceDDL,
} from '../../schema/ddl-generator.js';
import type { DDLDialect } from '../../schema/ddl-generator.js';
import type { ResourceTableSet } from '../../schema/table-schema.js';
import { compareSchemas } from '../../migration/schema-diff.js';
import { generateMigration } from '../../migration/migration-generator.js';

// =============================================================================
// Helpers
// =============================================================================

const PG_CONFIG = {
  host: 'localhost',
  port: 5433,
  database: 'medxai_dev',
  user: 'postgres',
  password: 'assert',
};

// Unique resource type name per run 鈥?ensures constraint/index names are unique in PG
const RUN_ID = Date.now().toString(36);
const PG_RT = `Pt${RUN_ID}`;

function makeSDRegistry(resourceType = 'Patient'): StructureDefinitionRegistry {
  const reg = new StructureDefinitionRegistry();
  reg.index({
    resourceType: 'StructureDefinition',
    url: `http://test/${resourceType}`,
    name: resourceType,
    type: resourceType,
    kind: 'resource',
    abstract: false,
    status: 'active',
    snapshot: { element: [{ id: resourceType, path: resourceType }] },
  } as any);
  return reg;
}

function makeSPRegistry(
  resourceType = 'Patient',
  ...extraSPs: Array<{ code: string; type: string; expression: string }>
): SearchParameterRegistry {
  const reg = new SearchParameterRegistry();
  const entry = [
    { resource: { resourceType: 'SearchParameter' as const, url: 'sp:gender', name: 'gender', code: 'gender', base: [resourceType], type: 'token', expression: `${resourceType}.gender` } },
    { resource: { resourceType: 'SearchParameter' as const, url: 'sp:birthdate', name: 'birthdate', code: 'birthdate', base: [resourceType], type: 'date', expression: `${resourceType}.birthDate` } },
    ...extraSPs.map(sp => ({
      resource: { resourceType: 'SearchParameter' as const, url: `sp:${sp.code}`, name: sp.code, code: sp.code, base: [resourceType], type: sp.type, expression: sp.expression },
    })),
  ];
  reg.indexBundle({ resourceType: 'Bundle', entry } as any);
  return reg;
}

function buildTableSet(
  resourceType = 'Patient',
  ...extraSPs: Array<{ code: string; type: string; expression: string }>
): ResourceTableSet {
  return buildResourceTableSet(resourceType, makeSDRegistry(resourceType), makeSPRegistry(resourceType, ...extraSPs));
}

/** Generate full DDL for a table set and apply to adapter */
async function applyDDL(adapter: StorageAdapter, tableSet: ResourceTableSet, dialect: DDLDialect): Promise<string[]> {
  const stmts = generateResourceDDL(tableSet, dialect);
  for (const stmt of stmts) {
    await adapter.execute(stmt);
  }
  return stmts;
}

// =============================================================================
// Test Suite
// =============================================================================

describe('Dual-Backend Validation', () => {
  let sqliteAdapter: BetterSqlite3Adapter;
  let pgPool: Pool;
  let pgAdapter: PostgresAdapter;

  beforeAll(async () => {
    sqliteAdapter = new BetterSqlite3Adapter({ path: ':memory:' });
    await sqliteAdapter.execute('SELECT 1');
    pgPool = new Pool(PG_CONFIG);
    pgAdapter = new PostgresAdapter(pgPool);
  });

  afterAll(async () => {
    // Cleanup PG test tables
    await pgAdapter.execute(`DROP TABLE IF EXISTS "${PG_RT}_References"`);
    await pgAdapter.execute(`DROP TABLE IF EXISTS "${PG_RT}_History"`);
    await pgAdapter.execute(`DROP TABLE IF EXISTS "${PG_RT}"`);
    await pgAdapter.close();
    await sqliteAdapter.close();
  });

  // ===========================================================================
  // Part 1: Schema DDL correctness
  // ===========================================================================

  describe('1. Schema DDL Correctness', () => {
    it('generates DDL for SQLite dialect 鈥?contains INTEGER, TEXT, AUTOINCREMENT', () => {
      const ts = buildTableSet();
      const mainDDL = generateCreateMainTable(ts.main, 'sqlite');
      const histDDL = generateCreateHistoryTable(ts.history, 'sqlite');
      const refsDDL = generateCreateReferencesTable(ts.references, 'sqlite');

      expect(mainDDL).toContain('CREATE TABLE IF NOT EXISTS');
      expect(mainDDL).toContain('"id" TEXT NOT NULL');
      expect(mainDDL).toContain('"deleted" INTEGER');
      expect(histDDL).toContain('AUTOINCREMENT');
      expect(histDDL).not.toContain('GENERATED ALWAYS AS IDENTITY');
      expect(refsDDL).toContain('"resourceId" TEXT NOT NULL');
    });

    it('generates DDL for PostgreSQL dialect 鈥?contains IDENTITY, no AUTOINCREMENT', () => {
      const ts = buildTableSet();
      const mainDDL = generateCreateMainTable(ts.main, 'postgres');
      const histDDL = generateCreateHistoryTable(ts.history, 'postgres');
      const refsDDL = generateCreateReferencesTable(ts.references, 'postgres');

      expect(mainDDL).toContain('CREATE TABLE IF NOT EXISTS');
      expect(mainDDL).toContain('"id" TEXT NOT NULL');
      expect(histDDL).toContain('GENERATED ALWAYS AS IDENTITY');
      expect(histDDL).not.toContain('AUTOINCREMENT');
      expect(refsDDL).toContain('"resourceId" TEXT NOT NULL');
    });

    it('SQLite DDL executes without error', async () => {
      const ts = buildTableSet();
      const stmts = await applyDDL(sqliteAdapter, ts, 'sqlite');
      expect(stmts.length).toBeGreaterThan(0);

      // Verify tables exist
      const tables = await sqliteAdapter.query<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('Patient','Patient_History','Patient_References')`,
      );
      const names = tables.map(r => r.name);
      expect(names).toContain('Patient');
      expect(names).toContain('Patient_History');
      expect(names).toContain('Patient_References');
    });

    it('PostgreSQL DDL executes without error (unique resource type)', async () => {
      // Build table set with unique resource type so constraint names are unique
      const ts = buildTableSet(PG_RT);
      const stmts = await applyDDL(pgAdapter, ts, 'postgres');
      expect(stmts.length).toBeGreaterThan(0);

      // Verify tables exist via information_schema
      const tables = await pgAdapter.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE ?`,
        [`${PG_RT}%`],
      );
      const names = tables.map(r => r.table_name);
      expect(names).toContain(PG_RT);
      expect(names).toContain(`${PG_RT}_History`);
      expect(names).toContain(`${PG_RT}_References`);
    });

    it('both dialects produce DDL statements for same tables', () => {
      const ts = buildTableSet();
      const sqliteStmts = generateResourceDDL(ts, 'sqlite');
      const pgStmts = generateResourceDDL(ts, 'postgres');
      // Both produce CREATE TABLE + CREATE INDEX; counts may differ slightly
      // (e.g., SQLite AUTOINCREMENT index). Key: both produce >0 statements.
      expect(sqliteStmts.length).toBeGreaterThan(0);
      expect(pgStmts.length).toBeGreaterThan(0);
      // Both produce same CREATE TABLE count (3: main, history, refs)
      const sqliteTables = sqliteStmts.filter(s => s.startsWith('CREATE TABLE'));
      const pgTables = pgStmts.filter(s => s.startsWith('CREATE TABLE'));
      expect(sqliteTables.length).toBe(pgTables.length);
    });

    it('both dialects include same set of columns in main table', () => {
      const ts = buildTableSet();
      const sqliteDDL = generateCreateMainTable(ts.main, 'sqlite');
      const pgDDL = generateCreateMainTable(ts.main, 'postgres');

      const extractCols = (ddl: string) => {
        const lines = ddl.split('\n').map(l => l.trim());
        return lines
          .filter(l => l.startsWith('"') && l.includes(' '))
          .map(l => l.match(/^"([^"]+)"/)?.[1])
          .filter(Boolean)
          .sort();
      };

      expect(extractCols(sqliteDDL)).toEqual(extractCols(pgDDL));
    });

    it('index DDL generates correct syntax for each dialect', () => {
      const ts = buildTableSet();
      for (const idx of ts.main.indexes) {
        const sqliteIdx = generateCreateIndex(idx, ts.main.tableName, 'sqlite');
        const pgIdx = generateCreateIndex(idx, ts.main.tableName, 'postgres');
        // Some indexes may return null (e.g., not applicable for dialect)
        if (sqliteIdx) expect(sqliteIdx).toContain('CREATE INDEX IF NOT EXISTS');
        if (pgIdx) expect(pgIdx).toContain('CREATE INDEX IF NOT EXISTS');
      }
    });
  });

  // ===========================================================================
  // Part 2: IG lifecycle 鈥?install, add SP, upgrade
  // ===========================================================================

  describe('2. IG Lifecycle (schema diff + migration)', () => {
    it('compareSchemas detects ADD_TABLE for fresh install', () => {
      const ts = buildTableSet();
      const deltas = compareSchemas([], [ts]);
      expect(deltas.length).toBeGreaterThan(0);
      const addTable = deltas.filter(d => d.kind === 'ADD_TABLE');
      expect(addTable.length).toBeGreaterThanOrEqual(1); // at least 1 ADD_TABLE delta per resource type
    });

    it('compareSchemas detects ADD_COLUMN when new SearchParameter added', () => {
      const tsOld = buildTableSet();
      const tsNew = buildTableSet('Patient',
        { code: 'active', type: 'token', expression: 'Patient.active' },
      );
      const deltas = compareSchemas([tsOld], [tsNew]);
      const addCol = deltas.filter(d => d.kind === 'ADD_COLUMN');
      expect(addCol.length).toBeGreaterThanOrEqual(1);
      const colNames = addCol.map(d => d.column?.name).filter(Boolean);
      expect(colNames.some(n => n?.includes('active'))).toBe(true);
    });

    it('generateMigration produces SQLite DDL for ADD_COLUMN', () => {
      const tsOld = buildTableSet();
      const tsNew = buildTableSet('Patient',
        { code: 'active', type: 'token', expression: 'Patient.active' },
      );
      const deltas = compareSchemas([tsOld], [tsNew]);
      const migration = generateMigration(deltas, 'sqlite');
      expect(migration.up.length).toBeGreaterThan(0);
      expect(migration.up.some(s => s.includes('ALTER TABLE'))).toBe(true);
      expect(migration.up.some(s => s.includes('active'))).toBe(true);
    });

    it('generateMigration produces PostgreSQL DDL for ADD_COLUMN', () => {
      const tsOld = buildTableSet();
      const tsNew = buildTableSet('Patient',
        { code: 'active', type: 'token', expression: 'Patient.active' },
      );
      const deltas = compareSchemas([tsOld], [tsNew]);
      const migration = generateMigration(deltas, 'postgres');
      expect(migration.up.length).toBeGreaterThan(0);
      expect(migration.up.some(s => s.includes('ALTER TABLE'))).toBe(true);
    });

    it('SQLite: apply migration DDL for new column succeeds', async () => {
      // Schema already created by Part 1 SQLite DDL test
      const tsOld = buildTableSet();
      const tsNew = buildTableSet('Patient',
        { code: 'active', type: 'token', expression: 'Patient.active' },
      );
      const deltas = compareSchemas([tsOld], [tsNew]);
      const migration = generateMigration(deltas, 'sqlite');

      for (const stmt of migration.up) {
        await sqliteAdapter.execute(stmt);
      }

      // Verify column exists
      const info = await sqliteAdapter.query<{ name: string }>(
        `PRAGMA table_info("Patient")`,
      );
      const colNames = info.map(r => r.name);
      expect(colNames.some(n => n.includes('active'))).toBe(true);
    });

    it('PostgreSQL: apply migration DDL for new column succeeds', async () => {
      // Use PG_RT table set from Part 1 as old, add new SP column
      const tsOld = buildTableSet(PG_RT);
      const tsNew = buildTableSet(PG_RT,
        { code: 'active', type: 'token', expression: `${PG_RT}.active` },
      );
      const deltas = compareSchemas([tsOld], [tsNew]);
      const migration = generateMigration(deltas, 'postgres');

      for (const stmt of migration.up) {
        await pgAdapter.execute(stmt);
      }

      // Verify column exists
      const cols = await pgAdapter.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns WHERE table_name = ? AND table_schema = 'public'`,
        [PG_RT],
      );
      const colNames = cols.map(r => r.column_name);
      expect(colNames.some(n => n.includes('active'))).toBe(true);
    });

    it('compareSchemas returns empty deltas for identical schemas', () => {
      const ts = buildTableSet();
      const deltas = compareSchemas([ts], [ts]);
      expect(deltas.length).toBe(0);
    });

    it('multiple SP additions produce correct deltas', () => {
      const tsOld = buildTableSet();
      const tsNew = buildTableSet('Patient',
        { code: 'active', type: 'token', expression: 'Patient.active' },
        { code: 'address', type: 'string', expression: 'Patient.address' },
      );
      const deltas = compareSchemas([tsOld], [tsNew]);
      const addCol = deltas.filter(d => d.kind === 'ADD_COLUMN');
      expect(addCol.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ===========================================================================
  // Part 3: CRUD correctness on both backends
  // ===========================================================================

  describe('3. CRUD Correctness (SQLite)', () => {
    let store: FhirStore;

    beforeAll(() => {
      store = new FhirStore(sqliteAdapter);
    });

    it('createResource 鈥?generates id, versionId, lastUpdated', async () => {
      const result = await store.createResource('Patient', {
        resourceType: 'Patient',
        name: [{ family: 'TestSqlite' }],
      } as any);
      expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.meta.versionId).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.meta.lastUpdated).toBeTruthy();
    });

    it('readResource 鈥?returns correct data', async () => {
      const created = await store.createResource('Patient', {
        resourceType: 'Patient',
        name: [{ family: 'ReadTest' }],
      } as any);
      const read = await store.readResource('Patient', created.id);
      expect(read.id).toBe(created.id);
      expect((read as any).name[0].family).toBe('ReadTest');
    });

    it('readResource 鈥?throws ResourceNotFoundError for missing', async () => {
      await expect(store.readResource('Patient', 'nonexistent-id'))
        .rejects.toThrow(ResourceNotFoundError);
    });

    it('updateResource 鈥?changes versionId, preserves id', async () => {
      const created = await store.createResource('Patient', {
        resourceType: 'Patient', gender: 'male',
      } as any);
      const { resource: updated } = await store.updateResource('Patient', {
        resourceType: 'Patient', id: created.id, gender: 'female',
      } as any);
      expect(updated.id).toBe(created.id);
      expect(updated.meta.versionId).not.toBe(created.meta.versionId);
      expect((updated as any).gender).toBe('female');
    });

    it('updateResource 鈥?ifMatch enforces optimistic locking', async () => {
      const created = await store.createResource('Patient', { resourceType: 'Patient' } as any);
      await expect(
        store.updateResource('Patient', { resourceType: 'Patient', id: created.id } as any, { ifMatch: 'wrong-version' }),
      ).rejects.toThrow(ResourceVersionConflictError);
    });

    it('updateResource 鈥?ifMatch succeeds with correct version', async () => {
      const created = await store.createResource('Patient', { resourceType: 'Patient' } as any);
      const { resource: updated } = await store.updateResource(
        'Patient',
        { resourceType: 'Patient', id: created.id, gender: 'other' } as any,
        { ifMatch: created.meta.versionId },
      );
      expect(updated.meta.versionId).not.toBe(created.meta.versionId);
    });

    it('deleteResource 鈥?soft delete, content preserved', async () => {
      const created = await store.createResource('Patient', {
        resourceType: 'Patient', name: [{ family: 'ToDelete' }],
      } as any);
      await store.deleteResource('Patient', created.id);
      const row = await sqliteAdapter.queryOne<{ deleted: number; content: string }>(
        `SELECT "deleted", "content" FROM "Patient" WHERE "id" = ?`, [created.id],
      );
      expect(row!.deleted).toBe(1);
      expect(row!.content).toContain('ToDelete');
    });

    it('readResource 鈥?throws ResourceGoneError for deleted', async () => {
      const created = await store.createResource('Patient', { resourceType: 'Patient' } as any);
      await store.deleteResource('Patient', created.id);
      await expect(store.readResource('Patient', created.id)).rejects.toThrow(ResourceGoneError);
    });

    it('readHistory 鈥?returns versions newest first', async () => {
      const created = await store.createResource('Patient', { resourceType: 'Patient', gender: 'male' } as any);
      await store.updateResource('Patient', { resourceType: 'Patient', id: created.id, gender: 'female' } as any);
      const history = await store.readHistory('Patient', created.id);
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[0].versionId).not.toBe(created.meta.versionId);
    });

    it('readVersion (vread) 鈥?returns specific version', async () => {
      const created = await store.createResource('Patient', { resourceType: 'Patient', gender: 'male' } as any);
      const v1Id = created.meta.versionId;
      await store.updateResource('Patient', { resourceType: 'Patient', id: created.id, gender: 'female' } as any);
      const v1 = await store.readVersion('Patient', created.id, v1Id);
      expect((v1 as any).gender).toBe('male');
    });

    it('double delete 鈥?throws ResourceGoneError', async () => {
      const created = await store.createResource('Patient', { resourceType: 'Patient' } as any);
      await store.deleteResource('Patient', created.id);
      await expect(store.deleteResource('Patient', created.id)).rejects.toThrow(ResourceGoneError);
    });

    it('update on non-existent 鈥?throws ResourceNotFoundError', async () => {
      await expect(
        store.updateResource('Patient', { resourceType: 'Patient', id: 'no-such-id' } as any),
      ).rejects.toThrow(ResourceNotFoundError);
    });
  });

  describe('3. CRUD Correctness (PostgreSQL)', () => {
    let store: FhirStore;

    beforeAll(() => {
      // Tables were created in Part 1 via generateResourceDDL with PG_RT
      store = new FhirStore(pgAdapter);
    });

    it('createResource 鈥?generates id, versionId, lastUpdated', async () => {
      const result = await store.createResource(PG_RT, {
        resourceType: 'Patient', name: [{ family: 'TestPg' }],
      } as any);
      expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.meta.versionId).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.meta.lastUpdated).toBeTruthy();
    });

    it('readResource 鈥?returns correct data', async () => {
      const created = await store.createResource(PG_RT, {
        resourceType: 'Patient', name: [{ family: 'PgRead' }],
      } as any);
      const read = await store.readResource(PG_RT, created.id);
      expect(read.id).toBe(created.id);
      expect((read as any).name[0].family).toBe('PgRead');
    });

    it('readResource 鈥?throws ResourceNotFoundError for missing', async () => {
      await expect(store.readResource(PG_RT, 'nonexistent-id'))
        .rejects.toThrow(ResourceNotFoundError);
    });

    it('updateResource 鈥?changes versionId, preserves id', async () => {
      const created = await store.createResource(PG_RT, { resourceType: 'Patient', gender: 'male' } as any);
      const { resource: updated } = await store.updateResource(PG_RT, { resourceType: 'Patient', id: created.id, gender: 'female' } as any);
      expect(updated.id).toBe(created.id);
      expect(updated.meta.versionId).not.toBe(created.meta.versionId);
      expect((updated as any).gender).toBe('female');
    });

    it('updateResource 鈥?ifMatch enforces optimistic locking', async () => {
      const created = await store.createResource(PG_RT, { resourceType: 'Patient' } as any);
      await expect(
        store.updateResource(PG_RT, { resourceType: 'Patient', id: created.id } as any, { ifMatch: 'wrong' }),
      ).rejects.toThrow(ResourceVersionConflictError);
    });

    it('updateResource 鈥?ifMatch succeeds with correct version', async () => {
      const created = await store.createResource(PG_RT, { resourceType: 'Patient' } as any);
      const { resource: updated } = await store.updateResource(
        PG_RT,
        { resourceType: 'Patient', id: created.id, gender: 'other' } as any,
        { ifMatch: created.meta.versionId },
      );
      expect(updated.meta.versionId).not.toBe(created.meta.versionId);
    });

    it('deleteResource 鈥?soft delete, content preserved', async () => {
      const created = await store.createResource(PG_RT, {
        resourceType: 'Patient', name: [{ family: 'PgDel' }],
      } as any);
      await store.deleteResource(PG_RT, created.id);
      const row = await pgAdapter.queryOne<{ deleted: number; content: string }>(
        `SELECT "deleted", "content" FROM "${PG_RT}" WHERE "id" = ?`, [created.id],
      );
      expect(Number(row!.deleted)).toBe(1);
      expect(row!.content).toContain('PgDel');
    });

    it('readResource 鈥?throws ResourceGoneError for deleted', async () => {
      const created = await store.createResource(PG_RT, { resourceType: 'Patient' } as any);
      await store.deleteResource(PG_RT, created.id);
      await expect(store.readResource(PG_RT, created.id)).rejects.toThrow(ResourceGoneError);
    });

    it('readHistory 鈥?returns versions newest first', async () => {
      const created = await store.createResource(PG_RT, { resourceType: 'Patient', gender: 'male' } as any);
      await store.updateResource(PG_RT, { resourceType: 'Patient', id: created.id, gender: 'female' } as any);
      const history = await store.readHistory(PG_RT, created.id);
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[0].versionId).not.toBe(created.meta.versionId);
    });

    it('readVersion (vread) 鈥?returns specific version', async () => {
      const created = await store.createResource(PG_RT, { resourceType: 'Patient', gender: 'male' } as any);
      const v1Id = created.meta.versionId;
      await store.updateResource(PG_RT, { resourceType: 'Patient', id: created.id, gender: 'female' } as any);
      const v1 = await store.readVersion(PG_RT, created.id, v1Id);
      expect((v1 as any).gender).toBe('male');
    });

    it('double delete 鈥?throws ResourceGoneError', async () => {
      const created = await store.createResource(PG_RT, { resourceType: 'Patient' } as any);
      await store.deleteResource(PG_RT, created.id);
      await expect(store.deleteResource(PG_RT, created.id)).rejects.toThrow(ResourceGoneError);
    });

    it('update on non-existent 鈥?throws ResourceNotFoundError', async () => {
      await expect(
        store.updateResource(PG_RT, { resourceType: 'Patient', id: 'no-such-id' } as any),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('transaction atomicity 鈥?all-or-nothing on PG', async () => {
      const created = await store.createResource(PG_RT, { resourceType: 'Patient' } as any);
      const origVersion = created.meta.versionId;
      await expect(
        store.updateResource(PG_RT, { resourceType: 'Patient', id: created.id } as any, { ifMatch: 'bad' }),
      ).rejects.toThrow(ResourceVersionConflictError);
      const read = await store.readResource(PG_RT, created.id);
      expect(read.meta.versionId).toBe(origVersion);
    });

    it('history auto-increments versionSeq on PG', async () => {
      const created = await store.createResource(PG_RT, { resourceType: 'Patient' } as any);
      await store.updateResource(PG_RT, { resourceType: 'Patient', id: created.id, gender: 'male' } as any);
      await store.updateResource(PG_RT, { resourceType: 'Patient', id: created.id, gender: 'female' } as any);
      const rows = await pgAdapter.query<{ versionSeq: number }>(
        `SELECT "versionSeq" FROM "${PG_RT}_History" WHERE "id" = ? ORDER BY "versionSeq"`,
        [created.id],
      );
      expect(rows.length).toBe(3);
      expect(rows[0].versionSeq).toBeLessThan(rows[1].versionSeq);
      expect(rows[1].versionSeq).toBeLessThan(rows[2].versionSeq);
    });
  });
});
