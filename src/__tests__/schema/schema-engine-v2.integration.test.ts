/**
 * Schema Engine v2 Integration Tests — 10 tests
 *
 * End-to-end: build schema → generate SQLite DDL → execute on real SQLite → INSERT/SELECT.
 * Uses sql.js in-memory database.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteAdapter } from '../../db/sqlite-adapter.js';
import { buildResourceTableSet } from '../../schema/table-schema-builder.js';
import { generateResourceDDL, generateCreateGlobalLookupTable, generateCreateIndex } from '../../schema/ddl-generator.js';
import type { StructureDefinitionRegistry } from '../../registry/structure-definition-registry.js';
import type { SearchParameterRegistry, SearchParameterImpl } from '../../registry/search-parameter-registry.js';
import { buildGlobalLookupTables } from '../../schema/table-schema-builder.js';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function mockSdRegistry(...types: string[]): StructureDefinitionRegistry {
  const map = new Map<string, any>();
  for (const t of types) {
    map.set(t, { type: t, kind: 'resource', abstract: false });
  }
  return {
    get: (rt: string) => map.get(rt),
    has: (rt: string) => map.has(rt),
    getTableResourceTypes: () => types.sort(),
    getAllTypes: () => types.sort(),
    size: types.length,
    clear: () => map.clear(),
    index: () => {},
    indexAll: () => {},
  } as any;
}

function mockImpl(overrides: Partial<SearchParameterImpl>): SearchParameterImpl {
  return {
    code: 'test',
    type: 'string',
    resourceTypes: ['Patient'],
    expression: 'Patient.test',
    strategy: 'column',
    columnName: 'test',
    columnType: 'TEXT',
    array: false,
    ...overrides,
  };
}

function mockSpRegistry(implsByType: Record<string, SearchParameterImpl[]>): SearchParameterRegistry {
  return {
    getForResource: (rt: string) => implsByType[rt] ?? [],
  } as any;
}

// Common search params for Patient
const PATIENT_SPS: SearchParameterImpl[] = [
  mockImpl({ code: 'family', type: 'string', strategy: 'lookup-table', columnName: 'family', columnType: 'TEXT', resourceTypes: ['Patient'], expression: 'Patient.name.family' }),
  mockImpl({ code: 'birthdate', type: 'date', strategy: 'column', columnName: 'birthdate', columnType: 'TIMESTAMPTZ', resourceTypes: ['Patient'], expression: 'Patient.birthDate' }),
  mockImpl({ code: 'gender', type: 'token', strategy: 'token-column', columnName: 'gender', columnType: 'TEXT', resourceTypes: ['Patient'], expression: 'Patient.gender' }),
  mockImpl({ code: 'identifier', type: 'token', strategy: 'token-column', columnName: 'identifier', columnType: 'TEXT', resourceTypes: ['Patient'], expression: 'Patient.identifier' }),
];

describe('Schema Engine v2 Integration (SQLite in-memory)', () => {
  let adapter: SQLiteAdapter;

  beforeEach(() => {
    adapter = new SQLiteAdapter(':memory:');
  });

  afterEach(async () => {
    await adapter.close();
  });

  // Helper: execute all DDL statements
  async function executeDDL(statements: string[]): Promise<void> {
    for (const stmt of statements) {
      if (stmt.trim()) {
        await adapter.execute(stmt);
      }
    }
  }

  // =========================================================================
  // 1. Patient 3-table creation succeeds
  // =========================================================================
  it('creates Patient 3-table set without error', async () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry({ Patient: PATIENT_SPS });
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    const ddl = generateResourceDDL(tableSet, 'sqlite');
    await executeDDL(ddl);

    const tables = await adapter.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    const names = tables.map(t => t.name);
    expect(names).toContain('Patient');
    expect(names).toContain('Patient_History');
    expect(names).toContain('Patient_References');
  });

  // =========================================================================
  // 2. INSERT into main table succeeds
  // =========================================================================
  it('can INSERT and SELECT a row from Patient main table', async () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry({ Patient: PATIENT_SPS });
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    await executeDDL(generateResourceDDL(tableSet, 'sqlite'));

    await adapter.execute(
      `INSERT INTO "Patient" ("id","versionId","content","lastUpdated","deleted") VALUES (?,?,?,?,?)`,
      ['pat-1', 'ver-1', '{"resourceType":"Patient","id":"pat-1"}', '2024-01-01T00:00:00Z', 0],
    );

    const row = await adapter.queryOne<{ id: string; versionId: string }>(
      `SELECT "id", "versionId" FROM "Patient" WHERE "id" = ?`,
      ['pat-1'],
    );
    expect(row).toBeDefined();
    expect(row!.id).toBe('pat-1');
    expect(row!.versionId).toBe('ver-1');
  });

  // =========================================================================
  // 3. INSERT into history table with AUTOINCREMENT
  // =========================================================================
  it('history table auto-increments versionSeq', async () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry({ Patient: [] });
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    await executeDDL(generateResourceDDL(tableSet, 'sqlite'));

    await adapter.execute(
      `INSERT INTO "Patient_History" ("id","versionId","content","lastUpdated","deleted") VALUES (?,?,?,?,?)`,
      ['pat-1', 'ver-1', '{}', '2024-01-01T00:00:00Z', 0],
    );
    await adapter.execute(
      `INSERT INTO "Patient_History" ("id","versionId","content","lastUpdated","deleted") VALUES (?,?,?,?,?)`,
      ['pat-1', 'ver-2', '{}', '2024-01-02T00:00:00Z', 0],
    );

    const rows = await adapter.query<{ versionSeq: number; versionId: string }>(
      `SELECT "versionSeq", "versionId" FROM "Patient_History" ORDER BY "versionSeq"`,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].versionSeq).toBeLessThan(rows[1].versionSeq);
    expect(rows[0].versionId).toBe('ver-1');
    expect(rows[1].versionId).toBe('ver-2');
  });

  // =========================================================================
  // 4. INSERT into references table with targetType + targetId
  // =========================================================================
  it('references table stores targetType and targetId separately', async () => {
    const sd = mockSdRegistry('Observation');
    const sp = mockSpRegistry({ Observation: [] });
    const tableSet = buildResourceTableSet('Observation', sd, sp);
    await executeDDL(generateResourceDDL(tableSet, 'sqlite'));

    await adapter.execute(
      `INSERT INTO "Observation_References" ("resourceId","targetType","targetId","code","referenceRaw") VALUES (?,?,?,?,?)`,
      ['obs-1', 'Patient', 'pat-1', 'subject', null],
    );

    const row = await adapter.queryOne<{ targetType: string; targetId: string }>(
      `SELECT "targetType", "targetId" FROM "Observation_References" WHERE "resourceId" = ?`,
      ['obs-1'],
    );
    expect(row).toBeDefined();
    expect(row!.targetType).toBe('Patient');
    expect(row!.targetId).toBe('pat-1');
  });

  // =========================================================================
  // 5. Token column stores JSON array string
  // =========================================================================
  it('token column stores JSON array of "system|code" strings', async () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry({ Patient: PATIENT_SPS });
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    await executeDDL(generateResourceDDL(tableSet, 'sqlite'));

    const tokenValue = JSON.stringify(['http://hl7.org/fhir/administrative-gender|male', '|male']);
    await adapter.execute(
      `INSERT INTO "Patient" ("id","versionId","content","lastUpdated","deleted","__gender","__genderSort")
       VALUES (?,?,?,?,?,?,?)`,
      ['pat-1', 'ver-1', '{}', '2024-01-01T00:00:00Z', 0, tokenValue, 'male'],
    );

    const row = await adapter.queryOne<{ __gender: string; __genderSort: string }>(
      `SELECT "__gender", "__genderSort" FROM "Patient" WHERE "id" = ?`,
      ['pat-1'],
    );
    expect(row).toBeDefined();
    const parsed = JSON.parse(row!.__gender);
    expect(parsed).toContain('http://hl7.org/fhir/administrative-gender|male');
    expect(parsed).toContain('|male');
    expect(row!.__genderSort).toBe('male');
  });

  // =========================================================================
  // 6. json_each query on token column works
  // =========================================================================
  it('json_each query can search token column', async () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry({ Patient: PATIENT_SPS });
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    await executeDDL(generateResourceDDL(tableSet, 'sqlite'));

    const tokenMale = JSON.stringify(['http://hl7.org/fhir/administrative-gender|male', '|male']);
    const tokenFemale = JSON.stringify(['http://hl7.org/fhir/administrative-gender|female', '|female']);
    await adapter.execute(
      `INSERT INTO "Patient" ("id","versionId","content","lastUpdated","deleted","__gender") VALUES (?,?,?,?,?,?)`,
      ['pat-1', 'v1', '{}', '2024-01-01T00:00:00Z', 0, tokenMale],
    );
    await adapter.execute(
      `INSERT INTO "Patient" ("id","versionId","content","lastUpdated","deleted","__gender") VALUES (?,?,?,?,?,?)`,
      ['pat-2', 'v1', '{}', '2024-01-01T00:00:00Z', 0, tokenFemale],
    );

    // Search: code=male (no system) → should match "|male"
    const rows = await adapter.query<{ id: string }>(
      `SELECT "id" FROM "Patient" WHERE EXISTS (SELECT 1 FROM json_each("__gender") WHERE value = ?)`,
      ['|male'],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('pat-1');
  });

  // =========================================================================
  // 7. Multiple resource types can be created
  // =========================================================================
  it('creates 5 resource type table sets without conflict', async () => {
    const types = ['Patient', 'Observation', 'Encounter', 'Condition', 'Practitioner'];
    const sd = mockSdRegistry(...types);
    const sp = mockSpRegistry({
      Patient: PATIENT_SPS,
      Observation: [],
      Encounter: [],
      Condition: [],
      Practitioner: [],
    });

    for (const rt of types) {
      const tableSet = buildResourceTableSet(rt, sd, sp);
      await executeDDL(generateResourceDDL(tableSet, 'sqlite'));
    }

    const tables = await adapter.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    const names = new Set(tables.map(t => t.name));
    for (const rt of types) {
      expect(names.has(rt)).toBe(true);
      expect(names.has(`${rt}_History`)).toBe(true);
      expect(names.has(`${rt}_References`)).toBe(true);
    }
  });

  // =========================================================================
  // 8. Global lookup tables can be created
  // =========================================================================
  it('creates global lookup tables (HumanName, Address, ContactPoint, Identifier)', async () => {
    const lookups = buildGlobalLookupTables();
    for (const lookup of lookups) {
      const ddl = generateCreateGlobalLookupTable(lookup, 'sqlite');
      await adapter.execute(ddl);
      // Create btree indexes only (GIN skipped by generateCreateIndex)
      for (const idx of lookup.indexes) {
        const idxSql = generateCreateIndex(idx, lookup.tableName, 'sqlite');
        if (idxSql) await adapter.execute(idxSql);
      }
    }

    const tables = await adapter.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    const names = new Set(tables.map(t => t.name));
    expect(names.has('HumanName')).toBe(true);
    expect(names.has('Address')).toBe(true);
    expect(names.has('ContactPoint')).toBe(true);
    expect(names.has('Identifier')).toBe(true);
  });

  // =========================================================================
  // 9. UNIQUE constraint on history (id, versionId) prevents duplicates
  // =========================================================================
  it('history UNIQUE(id, versionId) prevents duplicate versions', async () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry({ Patient: [] });
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    await executeDDL(generateResourceDDL(tableSet, 'sqlite'));

    await adapter.execute(
      `INSERT INTO "Patient_History" ("id","versionId","content","lastUpdated","deleted") VALUES (?,?,?,?,?)`,
      ['pat-1', 'ver-1', '{}', '2024-01-01T00:00:00Z', 0],
    );

    // Duplicate (id, versionId) should fail
    await expect(
      adapter.execute(
        `INSERT INTO "Patient_History" ("id","versionId","content","lastUpdated","deleted") VALUES (?,?,?,?,?)`,
        ['pat-1', 'ver-1', '{}', '2024-01-02T00:00:00Z', 0],
      ),
    ).rejects.toThrow();
  });

  // =========================================================================
  // 10. Transaction: multi-table write is atomic
  // =========================================================================
  it('transaction atomically writes to main + history + references', async () => {
    const sd = mockSdRegistry('Observation');
    const sp = mockSpRegistry({ Observation: [] });
    const tableSet = buildResourceTableSet('Observation', sd, sp);
    await executeDDL(generateResourceDDL(tableSet, 'sqlite'));

    await adapter.transaction((tx) => {
      tx.execute(
        `INSERT INTO "Observation" ("id","versionId","content","lastUpdated","deleted") VALUES (?,?,?,?,?)`,
        ['obs-1', 'v1', '{"resourceType":"Observation"}', '2024-01-01T00:00:00Z', 0],
      );
      tx.execute(
        `INSERT INTO "Observation_History" ("id","versionId","content","lastUpdated","deleted") VALUES (?,?,?,?,?)`,
        ['obs-1', 'v1', '{"resourceType":"Observation"}', '2024-01-01T00:00:00Z', 0],
      );
      tx.execute(
        `INSERT INTO "Observation_References" ("resourceId","targetType","targetId","code") VALUES (?,?,?,?)`,
        ['obs-1', 'Patient', 'pat-1', 'subject'],
      );
    });

    const main = await adapter.queryOne(`SELECT * FROM "Observation" WHERE "id" = 'obs-1'`);
    const hist = await adapter.query(`SELECT * FROM "Observation_History" WHERE "id" = 'obs-1'`);
    const refs = await adapter.query(`SELECT * FROM "Observation_References" WHERE "resourceId" = 'obs-1'`);
    expect(main).toBeDefined();
    expect(hist).toHaveLength(1);
    expect(refs).toHaveLength(1);
  });
});
