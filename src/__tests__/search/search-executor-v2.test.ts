/**
 * Search Executor v2 Integration Tests — 12 tests on SQLite in-memory.
 *
 * Uses real SQLite adapter + FhirStore for data setup + executeSearchV2.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteAdapter } from '../../db/sqlite-adapter.js';
import { FhirStore } from '../../store/fhir-store.js';
import { executeSearchV2 } from '../../search/search-executor.js';
import type { SearchRequest } from '../../search/types.js';
import type { SearchParameterRegistry, SearchParameterImpl } from '../../registry/search-parameter-registry.js';

// ---------------------------------------------------------------------------
// DDL for Patient + Observation tables
// ---------------------------------------------------------------------------
const DDL = [
  // Patient main
  `CREATE TABLE IF NOT EXISTS "Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lastUpdated" TEXT NOT NULL,
    "deleted" INTEGER NOT NULL DEFAULT 0,
    "_source" TEXT,
    "_profile" TEXT,
    "compartments" TEXT,
    "gender" TEXT,
    "birthdate" TEXT
  )`,
  // Patient history
  `CREATE TABLE IF NOT EXISTS "Patient_History" (
    "versionSeq" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lastUpdated" TEXT NOT NULL,
    "deleted" INTEGER NOT NULL DEFAULT 0,
    UNIQUE ("id", "versionId")
  )`,
  // Patient references
  `CREATE TABLE IF NOT EXISTS "Patient_References" (
    "resourceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referenceRaw" TEXT
  )`,
  // Observation main
  `CREATE TABLE IF NOT EXISTS "Observation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lastUpdated" TEXT NOT NULL,
    "deleted" INTEGER NOT NULL DEFAULT 0,
    "_source" TEXT,
    "_profile" TEXT,
    "subject" TEXT,
    "compartments" TEXT
  )`,
  // Observation history
  `CREATE TABLE IF NOT EXISTS "Observation_History" (
    "versionSeq" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lastUpdated" TEXT NOT NULL,
    "deleted" INTEGER NOT NULL DEFAULT 0,
    UNIQUE ("id", "versionId")
  )`,
  // Observation references
  `CREATE TABLE IF NOT EXISTS "Observation_References" (
    "resourceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referenceRaw" TEXT
  )`,
];

// ---------------------------------------------------------------------------
// Mock SearchParameterRegistry
// ---------------------------------------------------------------------------
const IMPLS: Record<string, Record<string, SearchParameterImpl>> = {
  Patient: {
    gender: {
      code: 'gender',
      type: 'string',
      resourceTypes: ['Patient'],
      expression: 'Patient.gender',
      strategy: 'column',
      columnName: 'gender',
      columnType: 'TEXT',
      array: false,
    },
    birthdate: {
      code: 'birthdate',
      type: 'date',
      resourceTypes: ['Patient'],
      expression: 'Patient.birthDate',
      strategy: 'column',
      columnName: 'birthdate',
      columnType: 'TEXT',
      array: false,
    },
  },
  Observation: {
    subject: {
      code: 'subject',
      type: 'reference',
      resourceTypes: ['Observation'],
      expression: 'Observation.subject',
      strategy: 'column',
      columnName: 'subject',
      columnType: 'TEXT',
      array: false,
    },
  },
};

const registry: SearchParameterRegistry = {
  getImpl(resourceType: string, code: string) {
    return IMPLS[resourceType]?.[code] ?? null;
  },
} as unknown as SearchParameterRegistry;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a patient via FhirStore then manually set search columns. */
async function createPatient(
  adapter: SQLiteAdapter,
  store: FhirStore,
  data: { id: string; gender?: string; birthdate?: string },
) {
  const result = await store.createResource('Patient', {
    resourceType: 'Patient',
    id: data.id,
    gender: data.gender,
    birthDate: data.birthdate,
  }, { assignedId: data.id });

  // Manually set search columns (normally done by indexing pipeline)
  if (data.gender || data.birthdate) {
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (data.gender) { sets.push('"gender" = ?'); vals.push(data.gender); }
    if (data.birthdate) { sets.push('"birthdate" = ?'); vals.push(data.birthdate); }
    vals.push(data.id);
    await adapter.execute(`UPDATE "Patient" SET ${sets.join(', ')} WHERE "id" = ?`, vals);
  }

  return result;
}

describe('Search Executor v2 (SQLite integration)', () => {
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
  // 1. Search by _id
  // =========================================================================
  it('search by _id returns matching patient', async () => {
    await createPatient(adapter, store, { id: 'pat-1' });
    await createPatient(adapter, store, { id: 'pat-2' });

    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: '_id', values: ['pat-1'] }],
    };
    const result = await executeSearchV2(adapter, request, registry);
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].id).toBe('pat-1');
  });

  // =========================================================================
  // 2. Search by string column (gender)
  // =========================================================================
  it('search by string column returns matches', async () => {
    await createPatient(adapter, store, { id: 'p1', gender: 'male' });
    await createPatient(adapter, store, { id: 'p2', gender: 'female' });
    await createPatient(adapter, store, { id: 'p3', gender: 'male' });

    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'gender', modifier: 'exact', values: ['male'] }],
    };
    const result = await executeSearchV2(adapter, request, registry);
    expect(result.resources).toHaveLength(2);
    const ids = result.resources.map(r => r.id).sort();
    expect(ids).toEqual(['p1', 'p3']);
  });

  // =========================================================================
  // 3. Search by date with ge prefix
  // =========================================================================
  it('search by date with ge prefix', async () => {
    await createPatient(adapter, store, { id: 'p1', birthdate: '1980-01-01' });
    await createPatient(adapter, store, { id: 'p2', birthdate: '2000-06-15' });
    await createPatient(adapter, store, { id: 'p3', birthdate: '1970-03-20' });

    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'birthdate', prefix: 'ge', values: ['1990-01-01'] }],
    };
    const result = await executeSearchV2(adapter, request, registry);
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].id).toBe('p2');
  });

  // =========================================================================
  // 4. Search with _count limit
  // =========================================================================
  it('search respects _count limit', async () => {
    for (let i = 0; i < 5; i++) {
      await createPatient(adapter, store, { id: `p${i}` });
    }

    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      count: 2,
    };
    const result = await executeSearchV2(adapter, request, registry);
    expect(result.resources).toHaveLength(2);
  });

  // =========================================================================
  // 5. Search does not return deleted resources
  // =========================================================================
  it('search excludes deleted resources', async () => {
    await createPatient(adapter, store, { id: 'alive' });
    const created = await createPatient(adapter, store, { id: 'dead' });
    await store.deleteResource('Patient', 'dead');

    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
    };
    const result = await executeSearchV2(adapter, request, registry);
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].id).toBe('alive');
  });

  // =========================================================================
  // 6. Search with _total=accurate returns count
  // =========================================================================
  it('search with _total=accurate returns total count', async () => {
    for (let i = 0; i < 5; i++) {
      await createPatient(adapter, store, { id: `p${i}` });
    }

    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      count: 2,
    };
    const result = await executeSearchV2(adapter, request, registry, { total: 'accurate' });
    expect(result.resources).toHaveLength(2);
    expect(result.total).toBe(5);
  });

  // =========================================================================
  // 7. Search with _sort ordering
  // =========================================================================
  it('search with _sort orders results', async () => {
    await createPatient(adapter, store, { id: 'p1', birthdate: '2000-01-01' });
    await createPatient(adapter, store, { id: 'p2', birthdate: '1990-01-01' });
    await createPatient(adapter, store, { id: 'p3', birthdate: '2010-01-01' });

    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [],
      sort: [{ code: 'birthdate', descending: false }],
    };
    const result = await executeSearchV2(adapter, request, registry);
    // Need to filter out null birthdates — all 3 have birthdates
    expect(result.resources).toHaveLength(3);
    const dates = result.resources.map(r => (r as any).birthDate);
    // Should be ascending: 1990, 2000, 2010
    expect(dates[0]).toBe('1990-01-01');
    expect(dates[2]).toBe('2010-01-01');
  });

  // =========================================================================
  // 8. Search with multiple AND params
  // =========================================================================
  it('search with multiple AND params narrows results', async () => {
    await createPatient(adapter, store, { id: 'p1', gender: 'male', birthdate: '2000-01-01' });
    await createPatient(adapter, store, { id: 'p2', gender: 'female', birthdate: '2000-06-15' });
    await createPatient(adapter, store, { id: 'p3', gender: 'male', birthdate: '1990-01-01' });

    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [
        { code: 'gender', modifier: 'exact', values: ['male'] },
        { code: 'birthdate', prefix: 'ge', values: ['1995-01-01'] },
      ],
    };
    const result = await executeSearchV2(adapter, request, registry);
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].id).toBe('p1');
  });

  // =========================================================================
  // 9. _include forward reference
  // =========================================================================
  it('_include loads referenced Patient from Observation', async () => {
    // Create Patient
    await createPatient(adapter, store, { id: 'pat-1' });

    // Create Observation with subject reference
    const obs = await store.createResource('Observation', {
      resourceType: 'Observation',
      subject: { reference: 'Patient/pat-1' },
    }, { assignedId: 'obs-1' });

    // Manually set subject column
    await adapter.execute(
      'UPDATE "Observation" SET "subject" = ? WHERE "id" = ?',
      ['Patient/pat-1', 'obs-1'],
    );

    const request: SearchRequest = {
      resourceType: 'Observation',
      params: [],
      include: [{ resourceType: 'Observation', searchParam: 'subject' }],
    };
    const result = await executeSearchV2(adapter, request, registry);
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].id).toBe('obs-1');
    expect(result.included).toBeDefined();
    expect(result.included).toHaveLength(1);
    expect(result.included![0].id).toBe('pat-1');
  });

  // =========================================================================
  // 10. _revinclude reverse reference
  // =========================================================================
  it('_revinclude loads Observations that reference Patient', async () => {
    await createPatient(adapter, store, { id: 'pat-1' });

    // Create Observation
    await store.createResource('Observation', {
      resourceType: 'Observation',
      subject: { reference: 'Patient/pat-1' },
    }, { assignedId: 'obs-1' });

    // Insert reference row (normally done by indexing pipeline)
    await adapter.execute(
      'INSERT INTO "Observation_References" ("resourceId", "targetType", "targetId", "code", "referenceRaw") VALUES (?, ?, ?, ?, ?)',
      ['obs-1', 'Patient', 'pat-1', 'subject', 'Patient/pat-1'],
    );

    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: '_id', values: ['pat-1'] }],
      revinclude: [{ resourceType: 'Observation', searchParam: 'subject' }],
    };
    const result = await executeSearchV2(adapter, request, registry);
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].id).toBe('pat-1');
    expect(result.included).toBeDefined();
    expect(result.included).toHaveLength(1);
    expect(result.included![0].id).toBe('obs-1');
  });

  // =========================================================================
  // 11. OR semantics — comma-separated values
  // =========================================================================
  it('OR semantics: gender=male,female returns both', async () => {
    await createPatient(adapter, store, { id: 'p1', gender: 'male' });
    await createPatient(adapter, store, { id: 'p2', gender: 'female' });
    await createPatient(adapter, store, { id: 'p3', gender: 'other' });

    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: 'gender', modifier: 'exact', values: ['male', 'female'] }],
    };
    const result = await executeSearchV2(adapter, request, registry);
    expect(result.resources).toHaveLength(2);
    const ids = result.resources.map(r => r.id).sort();
    expect(ids).toEqual(['p1', 'p2']);
  });

  // =========================================================================
  // 12. Empty result set
  // =========================================================================
  it('search returns empty array when no matches', async () => {
    const request: SearchRequest = {
      resourceType: 'Patient',
      params: [{ code: '_id', values: ['nonexistent'] }],
    };
    const result = await executeSearchV2(adapter, request, registry);
    expect(result.resources).toHaveLength(0);
    expect(result.total).toBeUndefined();
  });
});
