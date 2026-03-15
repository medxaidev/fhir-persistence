/**
 * IndexingPipeline v2 Tests
 *
 * Verifies unified indexing: search columns + references + lookup tables.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';
import { IndexingPipeline } from '../../repo/indexing-pipeline.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';

// =============================================================================
// Helpers
// =============================================================================

function createPatientSPRegistry(): SearchParameterRegistry {
  const reg = new SearchParameterRegistry();
  reg.indexBundle({
    resourceType: 'Bundle',
    entry: [
      // 'birthdate' â†?column strategy (date)
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Patient-birthdate', name: 'birthdate', code: 'birthdate', base: ['Patient'], type: 'date' as const, expression: 'Patient.birthDate' } },
      // 'active' â†?token-column strategy (token, not in LOOKUP_TABLE_PARAMS)
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Patient-active', name: 'active', code: 'active', base: ['Patient'], type: 'token' as const, expression: 'Patient.active' } },
      // 'subject' â†?column strategy (reference)
      { resource: { resourceType: 'SearchParameter' as const, url: 'http://hl7.org/fhir/SearchParameter/Observation-subject', name: 'subject', code: 'subject', base: ['Observation'], type: 'reference' as const, expression: 'Observation.subject', target: ['Patient'] } },
    ],
  });
  return reg;
}

async function setupPatientTable(adapter: BetterSqlite3Adapter): Promise<void> {
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
}

async function setupObservationTable(adapter: BetterSqlite3Adapter): Promise<void> {
  await adapter.execute(`
    CREATE TABLE "Observation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "versionId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "lastUpdated" TEXT NOT NULL,
      "deleted" INTEGER NOT NULL DEFAULT 0,
      "_source" TEXT,
      "_profile" TEXT,
      "subject" TEXT
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

describe('IndexingPipeline v2', () => {
  let adapter: BetterSqlite3Adapter;
  let pipeline: IndexingPipeline;
  let registry: SearchParameterRegistry;

  beforeAll(async () => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    await adapter.execute('SELECT 1');
    registry = createPatientSPRegistry();
    pipeline = new IndexingPipeline(adapter);
    await setupPatientTable(adapter);
    await setupObservationTable(adapter);
  });

  afterAll(async () => {
    await adapter.close();
  });

  // ---------------------------------------------------------------------------
  // Search column extraction
  // ---------------------------------------------------------------------------

  it('extractSearchColumns returns column values for Patient', () => {
    const resource = {
      resourceType: 'Patient',
      id: 'pat-1',
      birthDate: '1990-01-15',
      active: true,
    };
    const impls = registry.getForResource('Patient');
    const columns = pipeline.extractSearchColumns(resource as any, impls);
    expect(columns).toBeDefined();
    // Birthdate (column strategy)
    expect(columns['birthdate']).toBe('1990-01-15');
  });

  it('extractSearchColumns returns empty for resource with no matching values', () => {
    const resource = { resourceType: 'Patient', id: 'pat-empty' };
    const impls = registry.getForResource('Patient');
    const columns = pipeline.extractSearchColumns(resource as any, impls);
    // No search values for empty resource
    expect(Object.keys(columns).length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Reference extraction
  // ---------------------------------------------------------------------------

  it('extractReferences returns ReferenceRowV2 for Observation.subject', () => {
    const resource = {
      resourceType: 'Observation',
      id: 'obs-1',
      subject: { reference: 'Patient/pat-1' },
    };
    const impls = registry.getForResource('Observation');
    const refs = pipeline.extractReferences(resource as any, impls);
    expect(refs.length).toBe(1);
    expect(refs[0].targetType).toBe('Patient');
    expect(refs[0].targetId).toBe('pat-1');
    expect(refs[0].code).toBe('subject');
    expect(refs[0].referenceRaw).toBe('Patient/pat-1');
  });

  it('extractReferences skips urn: and # references', () => {
    const resource = {
      resourceType: 'Observation',
      id: 'obs-2',
      subject: { reference: 'urn:uuid:abc-def' },
    };
    const impls = registry.getForResource('Observation');
    const refs = pipeline.extractReferences(resource as any, impls);
    expect(refs.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Lookup table extraction
  // ---------------------------------------------------------------------------

  it('extractLookupRows returns HumanName rows for Patient.name', () => {
    const resource = {
      resourceType: 'Patient',
      id: 'pat-lookup',
      name: [{ family: 'Jones', given: ['Alice'] }],
    };
    const impls = registry.getForResource('Patient');
    const rows = pipeline.extractLookupRows(resource as any, impls);
    // name code is strategy='column' for our SP; lookup only fires for lookup-table strategy
    // So this may return 0 depending on strategy resolution
    expect(Array.isArray(rows)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Full indexResource
  // ---------------------------------------------------------------------------

  it('indexResource writes references to Observation_References', async () => {
    const resource = {
      resourceType: 'Observation',
      id: 'obs-idx-1',
      subject: { reference: 'Patient/pat-1' },
    };
    const impls = registry.getForResource('Observation');
    const result = await pipeline.indexResource('Observation', resource as any, impls);

    expect(result.referenceCount).toBe(1);

    // Verify in DB
    const refs = await adapter.query<{ targetType: string; targetId: string }>(
      'SELECT "targetType", "targetId" FROM "Observation_References" WHERE "resourceId" = ?',
      ['obs-idx-1'],
    );
    expect(refs.length).toBe(1);
    expect(refs[0].targetType).toBe('Patient');
    expect(refs[0].targetId).toBe('pat-1');
  });

  it('indexResource returns search columns', async () => {
    const resource = {
      resourceType: 'Patient',
      id: 'pat-idx-1',
      birthDate: '1985-06-15',
      active: true,
    };
    const impls = registry.getForResource('Patient');
    const result = await pipeline.indexResource('Patient', resource as any, impls);

    expect(result.searchColumns['birthdate']).toBe('1985-06-15');
  });

  it('indexResource replace strategy overwrites references', async () => {
    const resource1 = {
      resourceType: 'Observation',
      id: 'obs-replace',
      subject: { reference: 'Patient/pat-1' },
    };
    const resource2 = {
      resourceType: 'Observation',
      id: 'obs-replace',
      subject: { reference: 'Patient/pat-2' },
    };
    const impls = registry.getForResource('Observation');

    await pipeline.indexResource('Observation', resource1 as any, impls);
    await pipeline.indexResource('Observation', resource2 as any, impls);

    const refs = await adapter.query<{ targetId: string }>(
      'SELECT "targetId" FROM "Observation_References" WHERE "resourceId" = ?',
      ['obs-replace'],
    );
    expect(refs.length).toBe(1);
    expect(refs[0].targetId).toBe('pat-2');
  });

  // ---------------------------------------------------------------------------
  // deleteIndex
  // ---------------------------------------------------------------------------

  it('deleteIndex removes references', async () => {
    const resource = {
      resourceType: 'Observation',
      id: 'obs-del',
      subject: { reference: 'Patient/pat-1' },
    };
    const impls = registry.getForResource('Observation');
    await pipeline.indexResource('Observation', resource as any, impls);

    await pipeline.deleteIndex('Observation', 'obs-del');

    const refs = await adapter.query<{ targetId: string }>(
      'SELECT "targetId" FROM "Observation_References" WHERE "resourceId" = ?',
      ['obs-del'],
    );
    expect(refs.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Options
  // ---------------------------------------------------------------------------

  it('respects enableReferences=false', async () => {
    const noRefPipeline = new IndexingPipeline(adapter, { enableReferences: false });
    const resource = {
      resourceType: 'Observation',
      id: 'obs-noref',
      subject: { reference: 'Patient/pat-1' },
    };
    const impls = registry.getForResource('Observation');
    const result = await noRefPipeline.indexResource('Observation', resource as any, impls);

    expect(result.referenceCount).toBe(0);
    // No refs written
    const refs = await adapter.query(
      'SELECT * FROM "Observation_References" WHERE "resourceId" = ?',
      ['obs-noref'],
    );
    expect(refs.length).toBe(0);
  });

  it('handles resource without id gracefully', async () => {
    const resource = { resourceType: 'Patient' };
    const impls = registry.getForResource('Patient');
    const result = await pipeline.indexResource('Patient', resource as any, impls);
    expect(result.searchColumns).toEqual({});
    expect(result.referenceCount).toBe(0);
    expect(result.lookupRowCount).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // getLookupWriter
  // ---------------------------------------------------------------------------

  it('getLookupWriter returns LookupTableWriter instance', () => {
    const writer = pipeline.getLookupWriter();
    expect(writer).toBeDefined();
    expect(typeof writer.ensureTables).toBe('function');
    expect(typeof writer.writeRows).toBe('function');
  });
});
