/**
 * DDL Generator v2 Tests — 12 tests covering dialect-aware DDL generation.
 *
 * Tests SQLite-specific DDL output including type mapping,
 * AUTOINCREMENT, no GIN indexes, no USING clause, etc.
 */
import { describe, it, expect } from 'vitest';
import {
  generateCreateMainTable,
  generateCreateHistoryTable,
  generateCreateReferencesTable,
  generateCreateIndex,
  generateResourceDDL,
  generateCreateGlobalLookupTable,
} from '../../schema/ddl-generator.js';
import type {
  MainTableSchema,
  HistoryTableSchema,
  ReferencesTableSchema,
  IndexSchema,
  GlobalLookupTableSchema,
  ResourceTableSet,
} from '../../schema/table-schema.js';

// ---------------------------------------------------------------------------
// Helpers: minimal table schemas for testing
// ---------------------------------------------------------------------------

function mockMainTable(resourceType: string): MainTableSchema {
  return {
    tableName: resourceType,
    resourceType,
    columns: [
      { name: 'id', type: 'TEXT', notNull: true, primaryKey: true },
      { name: 'versionId', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'content', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'lastUpdated', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'deleted', type: 'INTEGER', notNull: true, primaryKey: false, defaultValue: '0' },
      { name: '__gender', type: 'TEXT', notNull: false, primaryKey: false },
      { name: '__genderSort', type: 'TEXT', notNull: false, primaryKey: false },
    ],
    indexes: [
      { name: `${resourceType}_lastUpdated_idx`, columns: ['lastUpdated'], indexType: 'btree', unique: false },
      { name: `${resourceType}___gender_idx`, columns: ['__gender'], indexType: 'btree', unique: false },
    ],
    constraints: [{ name: `${resourceType}_pk`, type: 'primary_key', columns: ['id'] }],
  };
}

function mockHistoryTable(resourceType: string): HistoryTableSchema {
  return {
    tableName: `${resourceType}_History`,
    resourceType,
    columns: [
      { name: 'versionSeq', type: 'INTEGER', notNull: true, primaryKey: true },
      { name: 'id', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'versionId', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'content', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'lastUpdated', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'deleted', type: 'INTEGER', notNull: true, primaryKey: false, defaultValue: '0' },
    ],
    indexes: [
      { name: `${resourceType}_History_id_seq_idx`, columns: ['id', 'versionSeq'], indexType: 'btree', unique: false },
    ],
  };
}

function mockReferencesTable(resourceType: string): ReferencesTableSchema {
  return {
    tableName: `${resourceType}_References`,
    resourceType,
    columns: [
      { name: 'resourceId', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'targetType', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'targetId', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'code', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'referenceRaw', type: 'TEXT', notNull: false, primaryKey: false },
    ],
    indexes: [
      { name: `${resourceType}_References_target_idx`, columns: ['targetType', 'targetId', 'code'], indexType: 'btree', unique: false },
    ],
    compositePrimaryKey: [],
  };
}

function mockTableSet(resourceType: string): ResourceTableSet {
  return {
    resourceType,
    main: mockMainTable(resourceType),
    history: mockHistoryTable(resourceType),
    references: mockReferencesTable(resourceType),
  };
}

describe('DDL Generator — SQLite dialect', () => {
  const dialect = 'sqlite' as const;

  // =========================================================================
  // 1. Main table — contains versionId column
  // =========================================================================
  it('generates main table with versionId column', () => {
    const ddl = generateCreateMainTable(mockMainTable('Patient'), dialect);
    expect(ddl).toContain('"versionId" TEXT NOT NULL');
    expect(ddl).toContain('"id" TEXT NOT NULL');
  });

  // =========================================================================
  // 2. Main table — no UUID types
  // =========================================================================
  it('generates main table without any UUID types', () => {
    const ddl = generateCreateMainTable(mockMainTable('Patient'), dialect);
    expect(ddl).not.toContain('UUID');
  });

  // =========================================================================
  // 3. Main table — deleted default 0
  // =========================================================================
  it('generates deleted column with DEFAULT 0', () => {
    const ddl = generateCreateMainTable(mockMainTable('Patient'), dialect);
    expect(ddl).toContain('"deleted" INTEGER NOT NULL DEFAULT 0');
  });

  // =========================================================================
  // 4. History table — AUTOINCREMENT for SQLite
  // =========================================================================
  it('generates history table with AUTOINCREMENT for versionSeq', () => {
    const ddl = generateCreateHistoryTable(mockHistoryTable('Patient'), dialect);
    expect(ddl).toContain('AUTOINCREMENT');
    expect(ddl).toContain('"versionSeq" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT');
  });

  // =========================================================================
  // 5. History table — UNIQUE (id, versionId) constraint
  // =========================================================================
  it('generates history table with UNIQUE (id, versionId)', () => {
    const ddl = generateCreateHistoryTable(mockHistoryTable('Patient'), dialect);
    expect(ddl).toContain('UNIQUE ("id", "versionId")');
  });

  // =========================================================================
  // 6. History table — PG uses GENERATED ALWAYS AS IDENTITY
  // =========================================================================
  it('generates history table with GENERATED ALWAYS for postgres', () => {
    const ddl = generateCreateHistoryTable(mockHistoryTable('Patient'), 'postgres');
    expect(ddl).toContain('GENERATED ALWAYS AS IDENTITY');
    expect(ddl).not.toContain('AUTOINCREMENT');
  });

  // =========================================================================
  // 7. References table — targetType + targetId + referenceRaw
  // =========================================================================
  it('generates references table with targetType and targetId columns', () => {
    const ddl = generateCreateReferencesTable(mockReferencesTable('Patient'), dialect);
    expect(ddl).toContain('"targetType" TEXT NOT NULL');
    expect(ddl).toContain('"targetId" TEXT NOT NULL');
    expect(ddl).toContain('"referenceRaw" TEXT');
  });

  // =========================================================================
  // 8. Index — SQLite skips GIN indexes
  // =========================================================================
  it('returns null for GIN indexes in SQLite', () => {
    const ginIdx: IndexSchema = {
      name: 'Patient_compartments_idx',
      columns: ['compartments'],
      indexType: 'gin',
      unique: false,
    };
    const result = generateCreateIndex(ginIdx, 'Patient', 'sqlite');
    expect(result).toBeNull();
  });

  // =========================================================================
  // 9. Index — SQLite btree index has no USING clause
  // =========================================================================
  it('generates btree index without USING clause for SQLite', () => {
    const idx: IndexSchema = {
      name: 'Patient_lastUpdated_idx',
      columns: ['lastUpdated'],
      indexType: 'btree',
      unique: false,
    };
    const result = generateCreateIndex(idx, 'Patient', 'sqlite');
    expect(result).not.toBeNull();
    expect(result).not.toContain('USING');
    expect(result).toContain('ON "Patient"');
    expect(result).toContain('"lastUpdated"');
  });

  // =========================================================================
  // 10. Index — PG btree index has USING clause
  // =========================================================================
  it('generates btree index with USING clause for postgres', () => {
    const idx: IndexSchema = {
      name: 'Patient_lastUpdated_idx',
      columns: ['lastUpdated'],
      indexType: 'btree',
      unique: false,
    };
    const result = generateCreateIndex(idx, 'Patient', 'postgres');
    expect(result).not.toBeNull();
    expect(result).toContain('USING btree');
  });

  // =========================================================================
  // 11. generateResourceDDL — produces correct statement count for SQLite
  // =========================================================================
  it('generateResourceDDL produces all tables and indexes for SQLite', () => {
    const statements = generateResourceDDL(mockTableSet('Patient'), dialect);
    // 3 CREATE TABLE + 2 main indexes + 1 history index + 1 references index = 7
    expect(statements.length).toBeGreaterThanOrEqual(6);
    const joined = statements.join('\n');
    expect(joined).toContain('CREATE TABLE IF NOT EXISTS "Patient"');
    expect(joined).toContain('CREATE TABLE IF NOT EXISTS "Patient_History"');
    expect(joined).toContain('CREATE TABLE IF NOT EXISTS "Patient_References"');
    expect(joined).toContain('CREATE INDEX IF NOT EXISTS');
  });

  // =========================================================================
  // 12. Global lookup table — SQLite type mapping
  // =========================================================================
  it('generates global lookup table with TEXT types for SQLite', () => {
    const table: GlobalLookupTableSchema = {
      tableName: 'HumanName',
      columns: [
        { name: 'resourceId', type: 'TEXT', notNull: true, primaryKey: false },
        { name: 'resourceType', type: 'TEXT', notNull: true, primaryKey: false },
        { name: 'family', type: 'TEXT', notNull: false, primaryKey: false },
      ],
      indexes: [],
    };
    const ddl = generateCreateGlobalLookupTable(table, dialect);
    expect(ddl).toContain('"resourceId" TEXT NOT NULL');
    expect(ddl).not.toContain('UUID');
  });
});
