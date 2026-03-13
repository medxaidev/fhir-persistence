/**
 * FhirPersistence v2 Tests
 *
 * End-to-end facade: CRUD with automatic indexing, search columns,
 * references, and lookup tables.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SQLiteAdapter } from '../../db/sqlite-adapter.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import { FhirPersistence } from '../../store/fhir-persistence.js';
import {
  ResourceNotFoundError,
  ResourceGoneError,
  ResourceVersionConflictError,
} from '../../repo/errors.js';

// =============================================================================
// Helpers
// =============================================================================

function createRegistry(): SearchParameterRegistry {
  const reg = new SearchParameterRegistry();
  reg.indexBundle({
    resourceType: 'Bundle',
    entry: [
      // 'birthdate' → column strategy (date, expression=Patient.birthDate)
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Patient-birthdate', name: 'birthdate', code: 'birthdate', base: ['Patient'], type: 'date' as const, expression: 'Patient.birthDate' } },
      // 'active' → token-column strategy (token, expression=Patient.active)
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Patient-active', name: 'active', code: 'active', base: ['Patient'], type: 'token' as const, expression: 'Patient.active' } },
      // 'subject' → column strategy (reference)
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Observation-subject', name: 'subject', code: 'subject', base: ['Observation'], type: 'reference' as const, expression: 'Observation.subject', target: ['Patient'] } },
      // 'status' → token-column strategy (token)
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Observation-status', name: 'status', code: 'status', base: ['Observation'], type: 'token' as const, expression: 'Observation.status' } },
    ],
  });
  return reg;
}

async function setupTables(adapter: SQLiteAdapter): Promise<void> {
  // Patient
  await adapter.execute(`
    CREATE TABLE "Patient" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "versionId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "lastUpdated" TEXT NOT NULL,
      "deleted" INTEGER NOT NULL DEFAULT 0,
      "_source" TEXT,
      "_profile" TEXT,
      "birthdate" TEXT,
      "__active" TEXT,
      "__activeText" TEXT,
      "__activeSort" TEXT
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

  // Observation
  await adapter.execute(`
    CREATE TABLE "Observation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "versionId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "lastUpdated" TEXT NOT NULL,
      "deleted" INTEGER NOT NULL DEFAULT 0,
      "_source" TEXT,
      "_profile" TEXT,
      "subject" TEXT,
      "__status" TEXT,
      "__statusText" TEXT,
      "__statusSort" TEXT
    )
  `);
  await adapter.execute(`
    CREATE TABLE "Observation_History" (
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
    CREATE TABLE "Observation_References" (
      "resourceId" TEXT NOT NULL,
      "targetType" TEXT NOT NULL,
      "targetId" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "referenceRaw" TEXT
    )
  `);
}

// =============================================================================
// Tests
// =============================================================================

describe('FhirPersistence v2 (end-to-end)', () => {
  let adapter: SQLiteAdapter;
  let persistence: FhirPersistence;

  beforeAll(async () => {
    adapter = new SQLiteAdapter(':memory:');
    await adapter.execute('SELECT 1');
    await setupTables(adapter);
    const registry = createRegistry();
    persistence = new FhirPersistence(adapter, registry);
  });

  afterAll(async () => {
    await adapter.close();
  });

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  it('exposes adapter, registry, and pipeline', () => {
    expect(persistence.getAdapter()).toBe(adapter);
    expect(persistence.getRegistry()).toBeDefined();
    expect(persistence.getPipeline()).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // CREATE with indexing
  // ---------------------------------------------------------------------------

  it('createResource persists resource and populates search columns', async () => {
    const result = await persistence.createResource('Patient', {
      resourceType: 'Patient',
      birthDate: '1990-01-15',
      active: true,
    } as any);

    expect(result.id).toBeDefined();
    expect(result.meta.versionId).toBeDefined();

    // Verify search columns in DB
    const row = await adapter.queryOne<{ birthdate: string }>(
      'SELECT "birthdate" FROM "Patient" WHERE "id" = ?',
      [result.id],
    );
    expect(row).toBeDefined();
    expect(row!.birthdate).toBe('1990-01-15');
  });

  it('createResource writes references for Observation.subject', async () => {
    const patient = await persistence.createResource('Patient', {
      resourceType: 'Patient',
    } as any);

    const obs = await persistence.createResource('Observation', {
      resourceType: 'Observation',
      subject: { reference: `Patient/${patient.id}` },
      status: 'final',
    } as any);

    // Verify reference in DB
    const refs = await adapter.query<{ targetType: string; targetId: string; code: string }>(
      'SELECT "targetType", "targetId", "code" FROM "Observation_References" WHERE "resourceId" = ?',
      [obs.id],
    );
    expect(refs.length).toBe(1);
    expect(refs[0].targetType).toBe('Patient');
    expect(refs[0].targetId).toBe(patient.id);
    expect(refs[0].code).toBe('subject');
  });

  // ---------------------------------------------------------------------------
  // READ
  // ---------------------------------------------------------------------------

  it('readResource returns the created resource', async () => {
    const created = await persistence.createResource('Patient', {
      resourceType: 'Patient',
      active: true,
    } as any);

    const read = await persistence.readResource('Patient', created.id);
    expect(read.id).toBe(created.id);
    expect(read.meta.versionId).toBe(created.meta.versionId);
  });

  it('readResource throws ResourceNotFoundError', async () => {
    await expect(persistence.readResource('Patient', 'non-existent'))
      .rejects.toThrow(ResourceNotFoundError);
  });

  // ---------------------------------------------------------------------------
  // UPDATE with re-indexing
  // ---------------------------------------------------------------------------

  it('updateResource changes versionId and re-indexes search columns', async () => {
    const created = await persistence.createResource('Patient', {
      resourceType: 'Patient',
      birthDate: '1980-01-01',
    } as any);

    const updated = await persistence.updateResource('Patient', {
      resourceType: 'Patient',
      id: created.id,
      birthDate: '2000-12-25',
    } as any);

    expect(updated.meta.versionId).not.toBe(created.meta.versionId);

    // Verify updated search columns
    const row = await adapter.queryOne<{ birthdate: string }>(
      'SELECT "birthdate" FROM "Patient" WHERE "id" = ?',
      [created.id],
    );
    expect(row!.birthdate).toBe('2000-12-25');
  });

  it('updateResource re-writes references', async () => {
    const pat1 = await persistence.createResource('Patient', { resourceType: 'Patient' } as any);
    const pat2 = await persistence.createResource('Patient', { resourceType: 'Patient' } as any);

    const obs = await persistence.createResource('Observation', {
      resourceType: 'Observation',
      subject: { reference: `Patient/${pat1.id}` },
    } as any);

    // Update to reference pat2
    await persistence.updateResource('Observation', {
      resourceType: 'Observation',
      id: obs.id,
      subject: { reference: `Patient/${pat2.id}` },
    } as any);

    const refs = await adapter.query<{ targetId: string }>(
      'SELECT "targetId" FROM "Observation_References" WHERE "resourceId" = ?',
      [obs.id],
    );
    expect(refs.length).toBe(1);
    expect(refs[0].targetId).toBe(pat2.id);
  });

  it('updateResource with ifMatch enforces optimistic locking', async () => {
    const created = await persistence.createResource('Patient', {
      resourceType: 'Patient',
    } as any);

    await expect(
      persistence.updateResource('Patient', {
        resourceType: 'Patient', id: created.id,
      } as any, { ifMatch: 'wrong-version' }),
    ).rejects.toThrow(ResourceVersionConflictError);
  });

  // ---------------------------------------------------------------------------
  // DELETE with index cleanup
  // ---------------------------------------------------------------------------

  it('deleteResource soft-deletes and clears references', async () => {
    const pat = await persistence.createResource('Patient', { resourceType: 'Patient' } as any);
    const obs = await persistence.createResource('Observation', {
      resourceType: 'Observation',
      subject: { reference: `Patient/${pat.id}` },
    } as any);

    await persistence.deleteResource('Observation', obs.id);

    // Soft deleted
    await expect(persistence.readResource('Observation', obs.id))
      .rejects.toThrow(ResourceGoneError);

    // References cleared
    const refs = await adapter.query(
      'SELECT * FROM "Observation_References" WHERE "resourceId" = ?',
      [obs.id],
    );
    expect(refs.length).toBe(0);
  });

  it('deleteResource preserves content (ADR-08)', async () => {
    const created = await persistence.createResource('Patient', {
      resourceType: 'Patient',
      active: true,
    } as any);

    await persistence.deleteResource('Patient', created.id);

    const row = await adapter.queryOne<{ content: string; deleted: number }>(
      'SELECT "content", "deleted" FROM "Patient" WHERE "id" = ?',
      [created.id],
    );
    expect(row!.deleted).toBe(1);
    expect(row!.content).toContain('"active":true');
  });

  // ---------------------------------------------------------------------------
  // HISTORY
  // ---------------------------------------------------------------------------

  it('readHistory returns all versions', async () => {
    const created = await persistence.createResource('Patient', {
      resourceType: 'Patient', birthDate: '1990-01-01',
    } as any);

    await persistence.updateResource('Patient', {
      resourceType: 'Patient', id: created.id, birthDate: '1991-02-02',
    } as any);

    const history = await persistence.readHistory('Patient', created.id);
    expect(history.length).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // READ VERSION (vread)
  // ---------------------------------------------------------------------------

  it('readVersion returns specific historical version', async () => {
    const created = await persistence.createResource('Patient', {
      resourceType: 'Patient', birthDate: '1970-01-01',
    } as any);
    const v1Id = created.meta.versionId;

    await persistence.updateResource('Patient', {
      resourceType: 'Patient', id: created.id, birthDate: '1971-02-02',
    } as any);

    const v1 = await persistence.readVersion('Patient', created.id, v1Id);
    expect(v1).toBeDefined();
    expect(v1.meta.versionId).toBe(v1Id);
  });

  // ---------------------------------------------------------------------------
  // REINDEX
  // ---------------------------------------------------------------------------

  it('reindexResource updates search columns without new version', async () => {
    const created = await persistence.createResource('Patient', {
      resourceType: 'Patient',
      birthDate: '1970-01-01',
    } as any);

    // Manually clear search columns in DB to simulate stale data
    await adapter.execute(
      'UPDATE "Patient" SET "birthdate" = NULL WHERE "id" = ?',
      [created.id],
    );

    // Reindex
    await persistence.reindexResource('Patient', created.id);

    // Verify re-populated
    const row = await adapter.queryOne<{ birthdate: string }>(
      'SELECT "birthdate" FROM "Patient" WHERE "id" = ?',
      [created.id],
    );
    expect(row!.birthdate).toBe('1970-01-01');

    // No new version created
    const history = await persistence.readHistory('Patient', created.id);
    expect(history.length).toBe(1);
  });
});
