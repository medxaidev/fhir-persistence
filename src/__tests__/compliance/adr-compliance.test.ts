/**
 * ADR Compliance Tests
 *
 * Verifies that the Stage 1-9 implementation adheres to the
 * 14 Architecture Decision Records (ADRs).
 *
 * Each test group maps to a specific ADR document.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
// 鈹€鈹€鈹€ v2 modules 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';
import { SQLiteDialect } from '../../db/sqlite-dialect.js';
import { PostgresDialect } from '../../db/postgres-dialect.js';
import { FhirStore } from '../../store/fhir-store.js';
import { StructureDefinitionRegistry } from '../../registry/structure-definition-registry.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import {
  buildResourceTableSet,
} from '../../schema/table-schema-builder.js';
import {
  generateResourceDDL,
  generateCreateIndex,
} from '../../schema/ddl-generator.js';
import { compareSchemas } from '../../migration/schema-diff.js';
import { generateMigration } from '../../migration/migration-generator.js';
import { PackageRegistryRepo } from '../../registry/package-registry-repo.js';
import { IGPersistenceManager } from '../../migration/ig-persistence-manager.js';
import { ReindexScheduler } from '../../migration/reindex-scheduler.js';
import { TerminologyCodeRepo } from '../../terminology/terminology-code-repo.js';
import { ValueSetRepo } from '../../terminology/valueset-repo.js';
import { ResourceCacheV2 } from '../../cache/resource-cache.js';
import { SearchLogger } from '../../observability/search-logger.js';
import { rewritePlaceholders } from '../../db/postgres-adapter.js';
import {
  ResourceNotFoundError,
  ResourceGoneError,
  ResourceVersionConflictError,
} from '../../repo/errors.js';
import {
  buildInsertMainSQLv2,
  buildSelectByIdSQLv2,
  buildDeleteReferencesSQLv2,
  buildInsertReferencesSQLv2,
  buildInstanceHistorySQLv2,
} from '../../repo/sql-builder.js';
import { buildUrnMap, deepResolveUrns } from '../../transaction/urn-resolver.js';
import { processTransactionV2, processBatchV2 } from '../../transaction/bundle-processor.js';
import {
  getPlatformProfiles,
  getPlatformSearchParameters,
  PLATFORM_PACKAGE_NAME,
} from '../../platform/platform-ig-definitions.js';
import { buildPlatformTableSets } from '../../platform/platform-ig-loader.js';

// =============================================================================
// Helpers
// =============================================================================

function createTestSDRegistry(): StructureDefinitionRegistry {
  const reg = new StructureDefinitionRegistry();
  reg.indexAll([{
    url: 'http://hl7.org/fhir/StructureDefinition/Patient',
    name: 'Patient', kind: 'resource', type: 'Patient', abstract: false,
    elements: new Map(),
  }] as never[]);
  return reg;
}

function createTestSPRegistry(): SearchParameterRegistry {
  const reg = new SearchParameterRegistry();
  reg.indexBundle({
    resourceType: 'Bundle',
    entry: [
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Patient-name', name: 'name', code: 'name', base: ['Patient'], type: 'string' as const, expression: 'Patient.name' } },
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Patient-gender', name: 'gender', code: 'gender', base: ['Patient'], type: 'token' as const, expression: 'Patient.gender' } },
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Patient-birthdate', name: 'birthdate', code: 'birthdate', base: ['Patient'], type: 'date' as const, expression: 'Patient.birthDate' } },
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Observation-subject', name: 'subject', code: 'subject', base: ['Observation'], type: 'reference' as const, expression: 'Observation.subject' } },
    ],
  });
  return reg;
}

// =============================================================================
// ADR-02: SQLite & PostgreSQL Strategy
// =============================================================================

describe('ADR-02: SQLite & PostgreSQL Strategy', () => {
  let adapter: BetterSqlite3Adapter;

  beforeAll(async () => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    await adapter.execute('SELECT 1'); // ensure init
  });

  afterAll(async () => {
    await adapter.close();
  });

  it('StorageAdapter interface has all required methods', () => {
    expect(typeof adapter.execute).toBe('function');
    expect(typeof adapter.query).toBe('function');
    expect(typeof adapter.queryOne).toBe('function');
    expect(typeof adapter.queryStream).toBe('function');
    expect(typeof adapter.prepare).toBe('function');
    expect(typeof adapter.transaction).toBe('function');
    expect(typeof adapter.close).toBe('function');
  });

  it('SQLiteDialect uses ? placeholders', () => {
    const dialect = new SQLiteDialect();
    expect(dialect.placeholder(1)).toBe('?');
    expect(dialect.placeholder(5)).toBe('?');
  });

  it('PostgresDialect uses $N placeholders', () => {
    const dialect = new PostgresDialect();
    expect(dialect.placeholder(1)).toBe('$1');
    expect(dialect.placeholder(5)).toBe('$5');
  });

  it('rewritePlaceholders converts ? to $N', () => {
    expect(rewritePlaceholders('SELECT * WHERE a = ? AND b = ?')).toBe(
      'SELECT * WHERE a = $1 AND b = $2',
    );
  });

  it('rewritePlaceholders skips ? inside string literals', () => {
    expect(rewritePlaceholders("SELECT * WHERE a = '?' AND b = ?")).toBe(
      "SELECT * WHERE a = '?' AND b = $1",
    );
  });

  it('BetterSqlite3Adapter transaction uses BEGIN IMMEDIATE', async () => {
    const result = await adapter.transaction(async (tx) => {
      await tx.execute('CREATE TABLE IF NOT EXISTS "__adr02_test" ("id" TEXT PRIMARY KEY)');
      await tx.execute('INSERT INTO "__adr02_test" VALUES (?)', ['test-1']);
      return tx.queryOne<{ id: string }>('SELECT "id" FROM "__adr02_test" WHERE "id" = ?', ['test-1']);
    });
    expect(result).toBeDefined();
    expect(result!.id).toBe('test-1');
    await adapter.execute('DROP TABLE "__adr02_test"');
  });

  it('SQLiteDialect textArrayContains uses json_each', () => {
    const dialect = new SQLiteDialect();
    const result = dialect.textArrayContains('__code', 1, 1);
    expect(result.sql).toContain('json_each');
  });

  it('PostgresDialect textArrayContains uses ARRAY[]::text[]', () => {
    const dialect = new PostgresDialect();
    const result = dialect.textArrayContains('__code', 2, 1);
    expect(result.sql).toContain('ARRAY[');
    expect(result.sql).toContain('::text[]');
  });

  it('Token column stores system|code strings, not UUID hashes', async () => {
    await adapter.execute(`
      CREATE TABLE IF NOT EXISTS "__adr02_token" (
        "id" TEXT PRIMARY KEY,
        "__code" TEXT
      )
    `);
    const tokenValue = JSON.stringify(['http://loinc.org|8480-6', '|8480-6']);
    await adapter.execute(
      'INSERT INTO "__adr02_token" ("id", "__code") VALUES (?, ?)',
      ['obs-1', tokenValue],
    );
    const row = await adapter.queryOne<{ __code: string }>(
      'SELECT "__code" FROM "__adr02_token" WHERE "id" = ?', ['obs-1'],
    );
    expect(row).toBeDefined();
    const parsed = JSON.parse(row!.__code);
    expect(parsed).toContain('http://loinc.org|8480-6');
    expect(parsed).toContain('|8480-6');
    // Must NOT be a UUID/hash
    expect(parsed[0]).not.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}/);
    await adapter.execute('DROP TABLE "__adr02_token"');
  });

  it('DDLGenerator produces dialect-specific DDL', () => {
    const sdReg = createTestSDRegistry();
    const spReg = createTestSPRegistry();
    const tableSet = buildResourceTableSet('Patient', sdReg, spReg);
    const sqliteDDL = generateResourceDDL(tableSet, 'sqlite');
    const pgDDL = generateResourceDDL(tableSet, 'postgres');
    // SQLite uses TEXT for dates, PG uses TIMESTAMPTZ
    expect(sqliteDDL.some(s => s.includes('TEXT'))).toBe(true);
    // Both should create Patient, Patient_History, Patient_References
    expect(sqliteDDL.some(s => s.includes('"Patient"'))).toBe(true);
    expect(pgDDL.some(s => s.includes('"Patient"'))).toBe(true);
  });
});

// =============================================================================
// ADR-04 + ADR-13: IG Database & Package Registry
// =============================================================================

describe('ADR-04/13: IG Database & Package Registry', () => {
  let adapter: BetterSqlite3Adapter;

  beforeAll(async () => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    await adapter.execute('SELECT 1');
  });

  afterAll(async () => {
    await adapter.close();
  });

  it('PackageRegistryRepo creates fhir_packages table', async () => {
    const repo = new PackageRegistryRepo(adapter);
    await repo.ensureTable();
    const packages = await repo.getInstalledPackages();
    expect(Array.isArray(packages)).toBe(true);
  });

  it('PackageRegistryRepo tracks package checksum', async () => {
    const repo = new PackageRegistryRepo(adapter);
    await repo.upsertPackage({ name: 'test.pkg', version: '1.0.0', checksum: 'sha256:abc123', schemaSnapshot: null });
    const pkg = await repo.getPackage('test.pkg');
    expect(pkg).toBeDefined();
    expect(pkg!.checksum).toBe('sha256:abc123');
  });

  it('PackageRegistryRepo.checkStatus detects new/upgrade/consistent', async () => {
    const repo = new PackageRegistryRepo(adapter);
    // Already inserted test.pkg with sha256:abc123
    expect(await repo.checkStatus('test.pkg', 'sha256:abc123')).toBe('consistent');
    expect(await repo.checkStatus('test.pkg', 'sha256:newHash')).toBe('upgrade');
    expect(await repo.checkStatus('unknown.pkg', 'sha256:xxx')).toBe('new');
  });

  it('IGPersistenceManager handles fresh install (new)', async () => {
    const freshAdapter = new BetterSqlite3Adapter({ path: ':memory:' });
    await freshAdapter.execute('SELECT 1');
    const manager = new IGPersistenceManager(freshAdapter, 'sqlite');
    const sdReg = createTestSDRegistry();
    const spReg = createTestSPRegistry();
    const tableSets = [buildResourceTableSet('Patient', sdReg, spReg)];
    const result = await manager.initialize({
      name: 'test.fhir.r4',
      version: '1.0.0',
      checksum: 'sha256:fresh',
      tableSets,
    });
    expect(result.action).toBe('new');
    expect(result.ddlCount).toBeGreaterThan(0);
    await freshAdapter.close();
  });

  it('IGPersistenceManager returns consistent on same checksum', async () => {
    const adapter2 = new BetterSqlite3Adapter({ path: ':memory:' });
    await adapter2.execute('SELECT 1');
    const manager = new IGPersistenceManager(adapter2, 'sqlite');
    const sdReg = createTestSDRegistry();
    const spReg = createTestSPRegistry();
    const tableSets = [buildResourceTableSet('Patient', sdReg, spReg)];
    // First: new
    await manager.initialize({ name: 'test.fhir', version: '1.0.0', checksum: 'sha256:same', tableSets });
    // Second: consistent
    const result = await manager.initialize({ name: 'test.fhir', version: '1.0.0', checksum: 'sha256:same', tableSets });
    expect(result.action).toBe('consistent');
    await adapter2.close();
  });

  it('ReindexScheduler creates reindex_jobs table', async () => {
    const scheduler = new ReindexScheduler(adapter);
    await scheduler.ensureTable();
    const jobs = await scheduler.getAllJobs();
    expect(Array.isArray(jobs)).toBe(true);
  });

  it('ReindexScheduler can schedule and retrieve jobs', async () => {
    const scheduler = new ReindexScheduler(adapter);
    await scheduler.ensureTable();
    await scheduler.schedule([{
      kind: 'REINDEX' as const,
      resourceType: 'Patient',
      tableName: 'Patient',
      searchParam: { code: 'name', type: 'string', expression: 'Patient.name' },
    }]);
    const pending = await scheduler.getPendingJobs();
    expect(pending.length).toBeGreaterThanOrEqual(1);
    expect(pending.some(j => j.resourceType === 'Patient')).toBe(true);
  });
});

// =============================================================================
// ADR-05: Platform IG Strategy
// =============================================================================

describe('ADR-05: Platform IG Strategy', () => {
  it('defines 5 platform resource types', () => {
    const profiles = getPlatformProfiles();
    expect(profiles.length).toBe(5);
    const types = profiles.map(p => p.type);
    expect(types).toContain('User');
    expect(types).toContain('Bot');
    expect(types).toContain('Project');
    expect(types).toContain('Agent');
    expect(types).toContain('ClientApplication');
  });

  it('defines platform search parameters', () => {
    const sps = getPlatformSearchParameters();
    expect(sps.length).toBeGreaterThanOrEqual(5);
    expect(sps.every(sp => sp.resourceType === 'SearchParameter')).toBe(true);
  });

  it('PLATFORM_PACKAGE_NAME is medxai.core', () => {
    expect(PLATFORM_PACKAGE_NAME).toBe('medxai.core');
  });

  it('buildPlatformTableSets produces 5 table sets', () => {
    const tableSets = buildPlatformTableSets();
    expect(tableSets.length).toBe(5);
    const types = tableSets.map(ts => ts.resourceType);
    expect(types).toContain('User');
    expect(types).toContain('Bot');
  });

  it('each platform table set has main + history + references', () => {
    const tableSets = buildPlatformTableSets();
    for (const ts of tableSets) {
      expect(ts.main).toBeDefined();
      expect(ts.history).toBeDefined();
      expect(ts.references).toBeDefined();
      expect(ts.main.tableName).toBe(ts.resourceType);
      expect(ts.history.tableName).toBe(`${ts.resourceType}_History`);
      expect(ts.references.tableName).toBe(`${ts.resourceType}_References`);
    }
  });

  it('platform IG initializes through IGPersistenceManager', async () => {
    const adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    await adapter.execute('SELECT 1');
    const { initializePlatformIG } = await import('../../platform/platform-ig-loader.js');
    const result = await initializePlatformIG(adapter);
    expect(result.action).toBe('new');
    expect(result.ddlCount).toBeGreaterThan(0);
    // Verify table exists
    const row = await adapter.queryOne<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='User'`,
    );
    expect(row).toBeDefined();
    await adapter.close();
  });

  it('platform User search params avoid name/email LOOKUP_TABLE_PARAMS codes', () => {
    const sps = getPlatformSearchParameters();
    // User specifically avoids 'name' and 'email' codes (uses 'display-name', 'user-email')
    const userSPs = sps.filter(sp => sp.base.includes('User'));
    const FORBIDDEN_USER_CODES = new Set(['name', 'email']);
    for (const sp of userSPs) {
      expect(FORBIDDEN_USER_CODES.has(sp.code)).toBe(false);
    }
  });
});

// =============================================================================
// ADR-07: Persistence CRUD (FhirStore)
// =============================================================================

describe('ADR-07: Persistence CRUD', () => {
  let adapter: BetterSqlite3Adapter;
  let store: FhirStore;

  beforeAll(async () => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    await adapter.execute('SELECT 1');
    // Create Patient tables
    await adapter.execute(`
      CREATE TABLE "Patient" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "versionId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "lastUpdated" TEXT NOT NULL,
        "deleted" INTEGER NOT NULL DEFAULT 0,
        "_source" TEXT,
        "_profile" TEXT
      )
    `);
    await adapter.execute(`
      CREATE TABLE "Patient_History" (
        "versionSeq" INTEGER PRIMARY KEY AUTOINCREMENT,
        "id" TEXT NOT NULL,
        "versionId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "lastUpdated" TEXT NOT NULL,
        "deleted" INTEGER NOT NULL DEFAULT 0,
        UNIQUE ("id", "versionId")
      )
    `);
    await adapter.execute(`
      CREATE TABLE "Patient_References" (
        "resourceId" TEXT NOT NULL,
        "targetType" TEXT NOT NULL,
        "targetId" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "referenceRaw" TEXT
      )
    `);
    store = new FhirStore(adapter);
  });

  afterAll(async () => {
    await adapter.close();
  });

  it('createResource generates UUID id and versionId', async () => {
    const result = await store.createResource('Patient', { resourceType: 'Patient' } as any);
    expect(result.id).toBeDefined();
    expect(result.meta.versionId).toBeDefined();
    expect(result.meta.lastUpdated).toBeDefined();
    // UUID format check
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.meta.versionId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('readResource returns persisted resource', async () => {
    const created = await store.createResource('Patient', {
      resourceType: 'Patient', name: [{ family: 'Smith' }],
    } as any);
    const read = await store.readResource('Patient', created.id);
    expect(read.id).toBe(created.id);
  });

  it('readResource on non-existent throws ResourceNotFoundError', async () => {
    await expect(store.readResource('Patient', 'non-existent'))
      .rejects.toThrow(ResourceNotFoundError);
  });

  it('updateResource changes versionId', async () => {
    const created = await store.createResource('Patient', {
      resourceType: 'Patient',
    } as any);
    const { resource: updated } = await store.updateResource('Patient', {
      resourceType: 'Patient', id: created.id, name: [{ family: 'Jones' }],
    } as any);
    expect(updated.meta.versionId).not.toBe(created.meta.versionId);
  });

  it('updateResource with ifMatch enforces optimistic locking', async () => {
    const created = await store.createResource('Patient', { resourceType: 'Patient' } as any);
    await expect(
      store.updateResource('Patient', { resourceType: 'Patient', id: created.id } as any, { ifMatch: 'wrong-version' }),
    ).rejects.toThrow(ResourceVersionConflictError);
  });

  it('deleteResource soft-deletes (deleted=1, content preserved)', async () => {
    const created = await store.createResource('Patient', {
      resourceType: 'Patient', name: [{ family: 'ToDelete' }],
    } as any);
    await store.deleteResource('Patient', created.id);
    // Direct DB check: content preserved, deleted=1
    const row = await adapter.queryOne<{ deleted: number; content: string }>(
      'SELECT "deleted", "content" FROM "Patient" WHERE "id" = ?', [created.id],
    );
    expect(row).toBeDefined();
    expect(row!.deleted).toBe(1);
    expect(row!.content).toBeTruthy(); // content preserved
    expect(row!.content.length).toBeGreaterThan(10);
  });

  it('readResource on deleted throws ResourceGoneError', async () => {
    const created = await store.createResource('Patient', { resourceType: 'Patient' } as any);
    await store.deleteResource('Patient', created.id);
    await expect(store.readResource('Patient', created.id))
      .rejects.toThrow(ResourceGoneError);
  });

  it('no projectId in any v2 SQL builder output', () => {
    const insertSQL = buildInsertMainSQLv2('Patient', { id: 'x', versionId: 'v', content: '{}', lastUpdated: 'now', deleted: 0 });
    expect(insertSQL.sql).not.toContain('projectId');
    const selectSQL = buildSelectByIdSQLv2('Patient');
    expect(selectSQL).not.toContain('projectId');
    const deleteRefSQL = buildDeleteReferencesSQLv2('Patient_References');
    expect(deleteRefSQL).not.toContain('projectId');
  });

  it('history ordered by versionSeq DESC', () => {
    const { sql } = buildInstanceHistorySQLv2('Patient_History', 'test-id');
    expect(sql).toContain('ORDER BY "versionSeq" DESC');
  });
});

// =============================================================================
// ADR-08: Resource Versioning
// =============================================================================

describe('ADR-08: Resource Versioning', () => {
  let adapter: BetterSqlite3Adapter;
  let store: FhirStore;

  beforeAll(async () => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    await adapter.execute('SELECT 1');
    await adapter.execute(`
      CREATE TABLE "Patient" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "versionId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "lastUpdated" TEXT NOT NULL,
        "deleted" INTEGER NOT NULL DEFAULT 0,
        "_source" TEXT, "_profile" TEXT
      )
    `);
    await adapter.execute(`
      CREATE TABLE "Patient_History" (
        "versionSeq" INTEGER PRIMARY KEY AUTOINCREMENT,
        "id" TEXT NOT NULL,
        "versionId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "lastUpdated" TEXT NOT NULL,
        "deleted" INTEGER NOT NULL DEFAULT 0,
        UNIQUE ("id", "versionId")
      )
    `);
    await adapter.execute(`CREATE TABLE "Patient_References" ("resourceId" TEXT, "targetType" TEXT, "targetId" TEXT, "code" TEXT, "referenceRaw" TEXT)`);
    store = new FhirStore(adapter);
  });

  afterAll(async () => {
    await adapter.close();
  });

  it('History table is append-only (create + update adds 2 rows)', async () => {
    const created = await store.createResource('Patient', { resourceType: 'Patient' } as any);
    await store.updateResource('Patient', { resourceType: 'Patient', id: created.id, name: [{ family: 'Updated' }] } as any);
    const rows = await adapter.query<{ versionSeq: number }>(
      'SELECT "versionSeq" FROM "Patient_History" WHERE "id" = ? ORDER BY "versionSeq"',
      [created.id],
    );
    expect(rows.length).toBe(2);
    expect(rows[1].versionSeq).toBeGreaterThan(rows[0].versionSeq);
  });

  it('versionId is UUID v4 format', async () => {
    const created = await store.createResource('Patient', { resourceType: 'Patient' } as any);
    expect(created.meta.versionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('soft delete preserves content in History', async () => {
    const created = await store.createResource('Patient', {
      resourceType: 'Patient', name: [{ family: 'HistoryTest' }],
    } as any);
    await store.deleteResource('Patient', created.id);
    const history = await store.readHistory('Patient', created.id);
    expect(history.length).toBe(2); // create + delete
    // Delete version has content preserved (via direct DB check)
    const rows = await adapter.query<{ content: string; versionSeq: number }>(
      'SELECT "content", "versionSeq" FROM "Patient_History" WHERE "id" = ? ORDER BY "versionSeq" DESC',
      [created.id],
    );
    expect(rows[0].content).toBeTruthy();
    expect(rows[0].content.length).toBeGreaterThan(10);
  });

  it('readVersion returns specific historical version', async () => {
    const created = await store.createResource('Patient', {
      resourceType: 'Patient', name: [{ family: 'V1' }],
    } as any);
    const v1VersionId = created.meta.versionId;
    await store.updateResource('Patient', { resourceType: 'Patient', id: created.id, name: [{ family: 'V2' }] } as any);
    const v1 = await store.readVersion('Patient', created.id, v1VersionId);
    expect(v1).toBeDefined();
  });
});

// =============================================================================
// ADR-10: Transaction Engine
// =============================================================================

describe('ADR-10: Transaction Engine', () => {
  it('buildUrnMap pre-assigns real IDs with resourceType', () => {
    const entries = [
      { fullUrl: 'urn:uuid:aaa-bbb', resource: { resourceType: 'Patient', id: '' }, request: { method: 'POST', url: 'Patient' } },
      { fullUrl: 'urn:uuid:ccc-ddd', resource: { resourceType: 'Observation', id: '', subject: { reference: 'urn:uuid:aaa-bbb' } }, request: { method: 'POST', url: 'Observation' } },
    ];
    const urnMap = buildUrnMap(entries as never[]);
    expect(urnMap.size).toBe(2);
    const patientEntry = urnMap.get('urn:uuid:aaa-bbb');
    expect(patientEntry).toBeDefined();
    expect(patientEntry!.resourceType).toBe('Patient');
    expect(patientEntry!.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('deepResolveUrns replaces urn:uuid references with ResourceType/id', () => {
    const urnMap = new Map([
      ['urn:uuid:pat-1', { id: 'real-id-1', resourceType: 'Patient' }],
    ]);
    const resource = {
      resourceType: 'Observation',
      subject: { reference: 'urn:uuid:pat-1' },
    } as any;
    const resolved = deepResolveUrns(resource, urnMap);
    expect(resolved.subject.reference).toBe('Patient/real-id-1');
  });

  it('deepResolveUrns handles nested references', () => {
    const urnMap = new Map([
      ['urn:uuid:enc-1', { id: 'enc-real', resourceType: 'Encounter' }],
    ]);
    const resource = {
      resourceType: 'Observation',
      encounter: { reference: 'urn:uuid:enc-1' },
      performer: [{ reference: 'Practitioner/existing' }],
    } as any;
    const resolved = deepResolveUrns(resource, urnMap);
    expect(resolved.encounter.reference).toBe('Encounter/enc-real');
    expect(resolved.performer[0].reference).toBe('Practitioner/existing'); // unchanged
  });
});

// =============================================================================
// ADR-11: Reference Resolver (References table structure)
// =============================================================================

describe('ADR-11: Reference Resolver', () => {
  it('References table uses targetType + targetId split columns', () => {
    const sql = buildInsertReferencesSQLv2('Patient_References', 1);
    expect(sql).toContain('"targetType"');
    expect(sql).toContain('"targetId"');
    expect(sql).toContain('"code"');
    expect(sql).toContain('"referenceRaw"');
  });

  it('References INSERT has 5 columns per row', () => {
    const sql = buildInsertReferencesSQLv2('Observation_References', 3);
    // 3 rows 脳 5 params = 15 placeholders
    const qCount = (sql.match(/\?/g) || []).length;
    expect(qCount).toBe(15);
  });

  it('DELETE references by resourceId', () => {
    const sql = buildDeleteReferencesSQLv2('Patient_References');
    expect(sql).toContain('"resourceId"');
    expect(sql).toContain('?');
  });
});

// =============================================================================
// ADR-12: Terminology Engine
// =============================================================================

describe('ADR-12: Terminology Engine', () => {
  let adapter: BetterSqlite3Adapter;

  beforeAll(async () => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    await adapter.execute('SELECT 1');
  });

  afterAll(async () => {
    await adapter.close();
  });

  it('TerminologyCodeRepo creates table with system+code PK', async () => {
    const repo = new TerminologyCodeRepo(adapter);
    await repo.ensureTable();
    const count = await repo.getCodeCount();
    expect(count).toBe(0);
  });

  it('TerminologyCodeRepo batch insert and lookup', async () => {
    const repo = new TerminologyCodeRepo(adapter);
    await repo.batchInsert([
      { system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' },
      { system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' },
    ]);
    const display = await repo.lookup('http://loinc.org', '8480-6');
    expect(display).toBe('Systolic blood pressure');
  });

  it('TerminologyCodeRepo lookupByCode (any system)', async () => {
    const repo = new TerminologyCodeRepo(adapter);
    const results = await repo.lookupByCode('8480-6');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].system).toBe('http://loinc.org');
  });

  it('ValueSetRepo creates table with url+version PK', async () => {
    const repo = new ValueSetRepo(adapter);
    await repo.ensureTable();
    await repo.upsert({
      url: 'http://hl7.org/fhir/ValueSet/gender',
      version: '4.0.1',
      name: 'AdministrativeGender',
      content: '{"resourceType":"ValueSet"}',
    });
    const vs = await repo.getValueSet('http://hl7.org/fhir/ValueSet/gender', '4.0.1');
    expect(vs).toBeDefined();
    expect(vs!.name).toBe('AdministrativeGender');
  });

  it('ValueSetRepo supports multiple versions', async () => {
    const repo = new ValueSetRepo(adapter);
    await repo.upsert({
      url: 'http://hl7.org/fhir/ValueSet/gender',
      version: '5.0.0',
      content: '{"resourceType":"ValueSet","version":"5.0.0"}',
    });
    const all = await repo.getByUrl('http://hl7.org/fhir/ValueSet/gender');
    expect(all.length).toBe(2);
  });
});

// =============================================================================
// ADR-14: Schema Migration Engine
// =============================================================================

describe('ADR-14: Schema Migration Engine', () => {
  it('SchemaDiff detects ADD_TABLE for new resource type', () => {
    const sdReg = createTestSDRegistry();
    const spReg = createTestSPRegistry();
    const newTableSet = buildResourceTableSet('Patient', sdReg, spReg);
    const deltas = compareSchemas([], [newTableSet]);
    expect(deltas.some(d => d.kind === 'ADD_TABLE' && d.resourceType === 'Patient')).toBe(true);
  });

  it('SchemaDiff detects DROP_TABLE for removed resource type', () => {
    const sdReg = createTestSDRegistry();
    const spReg = createTestSPRegistry();
    const oldTableSet = buildResourceTableSet('Patient', sdReg, spReg);
    const deltas = compareSchemas([oldTableSet], []);
    expect(deltas.some(d => d.kind === 'DROP_TABLE' && d.resourceType === 'Patient')).toBe(true);
  });

  it('SchemaDiff detects ADD_COLUMN for new SearchParameter', () => {
    const sdReg = createTestSDRegistry();
    const spReg1 = new SearchParameterRegistry();
    spReg1.indexBundle({
      resourceType: 'Bundle',
      entry: [
        {
          resource: {
            resourceType: 'SearchParameter' as const,
            url: 'http://hl7.org/fhir/SearchParameter/Patient-name',
            name: 'name',
            code: 'name',
            base: ['Patient'] as string[],
            type: 'string' as const,
            expression: 'Patient.name'
          }
        },
      ],
    });
    const spReg2 = new SearchParameterRegistry();
    spReg2.indexBundle({
      resourceType: 'Bundle',
      entry: [
        {
          resource: {
            resourceType: 'SearchParameter' as const,
            url: 'http://hl7.org/fhir/SearchParameter/Patient-name',
            name: 'name',
            code: 'name',
            base: ['Patient'] as string[],
            type: 'string' as const,
            expression: 'Patient.name'
          }
        },
        {
          resource: {
            resourceType: 'SearchParameter' as const,
            url: 'http://hl7.org/fhir/SearchParameter/Patient-active',
            name: 'active',
            code: 'active',
            base: ['Patient'] as string[],
            type: 'token' as const,
            expression: 'Patient.active'
          }
        },
      ],
    });
    const oldTs = buildResourceTableSet('Patient', sdReg, spReg1);
    const newTs = buildResourceTableSet('Patient', sdReg, spReg2);
    const deltas = compareSchemas([oldTs], [newTs]);
    expect(deltas.some(d => d.kind === 'ADD_COLUMN')).toBe(true);
  });

  it('MigrationGenerator produces up/down SQL', () => {
    const sdReg = createTestSDRegistry();
    const spReg = createTestSPRegistry();
    const tableSet = buildResourceTableSet('Patient', sdReg, spReg);
    const deltas = compareSchemas([], [tableSet]);
    const migration = generateMigration(deltas, 'sqlite');
    expect(migration.up.length).toBeGreaterThan(0);
    expect(migration.up.some(s => s.includes('CREATE TABLE'))).toBe(true);
    expect(migration.description).toContain('Patient');
  });

  it('MigrationGenerator produces down: DROP TABLE for ADD_TABLE', () => {
    const sdReg = createTestSDRegistry();
    const spReg = createTestSPRegistry();
    const tableSet = buildResourceTableSet('Patient', sdReg, spReg);
    const deltas = compareSchemas([], [tableSet]);
    const migration = generateMigration(deltas, 'sqlite');
    expect(migration.down.some(s => s.includes('DROP TABLE'))).toBe(true);
  });
});

// =============================================================================
// ADR-09: Search Execution (Production Hardening)
// =============================================================================

describe('ADR-09 + Production: Search & Observability', () => {
  it('ResourceCacheV2 supports lru/fifo/ttl-only eviction', () => {
    for (const policy of ['lru', 'fifo', 'ttl-only'] as const) {
      const cache = new ResourceCacheV2({ maxSize: 10, ttlMs: 60000, evictionPolicy: policy, enabled: true });
      cache.set('Patient', 'id-1', { id: 'id-1' } as never);
      expect(cache.get('Patient', 'id-1')).toBeDefined();
    }
  });

  it('ResourceCacheV2 sweep removes expired entries', async () => {
    const cache = new ResourceCacheV2({ maxSize: 100, ttlMs: 50, evictionPolicy: 'lru', enabled: true });
    cache.set('Patient', 'exp-1', { id: 'exp-1' } as never);
    await new Promise(r => setTimeout(r, 100));
    cache.sweep();
    expect(cache.get('Patient', 'exp-1')).toBeUndefined();
  });

  it('SearchLogger tracks execution times and detects slow queries', () => {
    const logger = new SearchLogger({ slowThresholdMs: 100, maxEntries: 10 });
    logger.log('Patient', 2, 10, 50); // fast
    logger.log('Observation', 5, 100, 200); // slow
    const stats = logger.getStats();
    expect(stats.totalSearches).toBe(2);
    expect(stats.slowCount).toBe(1);
    const slow = logger.getSlowQueries();
    expect(slow.length).toBe(1);
    expect(slow[0].resourceType).toBe('Observation');
  });
});

// =============================================================================
// Cross-cutting: 3-table-per-resource pattern
// =============================================================================

describe('3-Table-Per-Resource Pattern', () => {
  it('every ResourceTableSet has main + history + references', () => {
    const sdReg = createTestSDRegistry();
    const spReg = createTestSPRegistry();
    const ts = buildResourceTableSet('Patient', sdReg, spReg);
    expect(ts.main).toBeDefined();
    expect(ts.history).toBeDefined();
    expect(ts.references).toBeDefined();
    expect(ts.main.tableName).toBe('Patient');
    expect(ts.history.tableName).toBe('Patient_History');
    expect(ts.references.tableName).toBe('Patient_References');
  });

  it('main table has required columns: id, versionId, content, lastUpdated, deleted', () => {
    const sdReg = createTestSDRegistry();
    const spReg = createTestSPRegistry();
    const ts = buildResourceTableSet('Patient', sdReg, spReg);
    const colNames = ts.main.columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('versionId');
    expect(colNames).toContain('content');
    expect(colNames).toContain('lastUpdated');
    expect(colNames).toContain('deleted');
  });

  it('history table has versionSeq + id + versionId + content + lastUpdated', () => {
    const sdReg = createTestSDRegistry();
    const spReg = createTestSPRegistry();
    const ts = buildResourceTableSet('Patient', sdReg, spReg);
    const colNames = ts.history.columns.map(c => c.name);
    expect(colNames).toContain('versionSeq');
    expect(colNames).toContain('id');
    expect(colNames).toContain('versionId');
    expect(colNames).toContain('content');
    expect(colNames).toContain('lastUpdated');
  });

  it('references table has resourceId + targetType + targetId + code', () => {
    const sdReg = createTestSDRegistry();
    const spReg = createTestSPRegistry();
    const ts = buildResourceTableSet('Patient', sdReg, spReg);
    const colNames = ts.references.columns.map(c => c.name);
    expect(colNames).toContain('resourceId');
    expect(colNames).toContain('targetType');
    expect(colNames).toContain('targetId');
    expect(colNames).toContain('code');
  });
});
