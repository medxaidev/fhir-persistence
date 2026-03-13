/**
 * Migration Generator Tests — 12 tests covering generateMigration.
 */
import { describe, it, expect } from 'vitest';
import { generateMigration } from '../../migration/migration-generator.js';
import type { SchemaDelta } from '../../migration/schema-diff.js';
import type { ResourceTableSet } from '../../schema/table-schema.js';

// Helper: minimal ResourceTableSet for ADD_TABLE
function makeTableSet(resourceType: string): ResourceTableSet {
  return {
    resourceType,
    main: {
      tableName: resourceType,
      resourceType,
      columns: [
        { name: 'id', type: 'TEXT', notNull: true, primaryKey: true },
        { name: 'content', type: 'TEXT', notNull: true, primaryKey: false },
        { name: 'lastUpdated', type: 'TEXT', notNull: true, primaryKey: false },
        { name: 'deleted', type: 'INTEGER', notNull: true, primaryKey: false, defaultValue: '0' },
      ],
      indexes: [
        { name: `${resourceType}_lastUpdated_idx`, columns: ['lastUpdated'], indexType: 'btree', unique: false },
      ],
      constraints: [],
    },
    history: {
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
      indexes: [],
    },
    references: {
      tableName: `${resourceType}_References`,
      resourceType,
      columns: [
        { name: 'resourceId', type: 'TEXT', notNull: true, primaryKey: false },
        { name: 'targetType', type: 'TEXT', notNull: true, primaryKey: false },
        { name: 'targetId', type: 'TEXT', notNull: true, primaryKey: false },
        { name: 'code', type: 'TEXT', notNull: true, primaryKey: false },
      ],
      indexes: [],
      compositePrimaryKey: [],
    },
  };
}

describe('generateMigration', () => {
  // =========================================================================
  // 1. ADD_COLUMN → ALTER TABLE ADD COLUMN DDL
  // =========================================================================
  it('generates ALTER TABLE ADD COLUMN for ADD_COLUMN', () => {
    const deltas: SchemaDelta[] = [{
      kind: 'ADD_COLUMN',
      resourceType: 'Patient',
      tableName: 'Patient',
      column: { name: 'birthdate', type: 'TEXT', notNull: false, primaryKey: false },
    }];
    const result = generateMigration(deltas, 'sqlite');
    expect(result.up).toHaveLength(1);
    expect(result.up[0]).toContain('ALTER TABLE "Patient" ADD COLUMN "birthdate" TEXT');
  });

  // =========================================================================
  // 2. DROP_COLUMN → ALTER TABLE DROP COLUMN DDL
  // =========================================================================
  it('generates ALTER TABLE DROP COLUMN for DROP_COLUMN (sqlite)', () => {
    const deltas: SchemaDelta[] = [{
      kind: 'DROP_COLUMN',
      resourceType: 'Patient',
      tableName: 'Patient',
      column: { name: 'oldField', type: 'TEXT', notNull: false, primaryKey: false },
    }];
    const result = generateMigration(deltas, 'sqlite');
    expect(result.up).toHaveLength(1);
    expect(result.up[0]).toContain('DROP COLUMN "oldField"');
  });

  // =========================================================================
  // 3. ADD_INDEX → CREATE INDEX DDL
  // =========================================================================
  it('generates CREATE INDEX for ADD_INDEX', () => {
    const deltas: SchemaDelta[] = [{
      kind: 'ADD_INDEX',
      resourceType: 'Patient',
      tableName: 'Patient',
      index: { name: 'Patient_birthdate_idx', columns: ['birthdate'], indexType: 'btree', unique: false },
    }];
    const result = generateMigration(deltas, 'sqlite');
    expect(result.up).toHaveLength(1);
    expect(result.up[0]).toContain('CREATE INDEX IF NOT EXISTS "Patient_birthdate_idx"');
    expect(result.down).toHaveLength(1);
    expect(result.down[0]).toContain('DROP INDEX IF EXISTS');
  });

  // =========================================================================
  // 4. DROP_INDEX → DROP INDEX DDL
  // =========================================================================
  it('generates DROP INDEX for DROP_INDEX', () => {
    const deltas: SchemaDelta[] = [{
      kind: 'DROP_INDEX',
      resourceType: 'Patient',
      tableName: 'Patient',
      index: { name: 'Patient_old_idx', columns: ['old'], indexType: 'btree', unique: false },
    }];
    const result = generateMigration(deltas, 'sqlite');
    expect(result.up).toHaveLength(1);
    expect(result.up[0]).toContain('DROP INDEX IF EXISTS "Patient_old_idx"');
  });

  // =========================================================================
  // 5. ADD_TABLE → full CREATE TABLE DDL
  // =========================================================================
  it('generates full CREATE TABLE DDL for ADD_TABLE', () => {
    const deltas: SchemaDelta[] = [{
      kind: 'ADD_TABLE',
      resourceType: 'Observation',
      tableName: 'Observation',
      tableSet: makeTableSet('Observation'),
    }];
    const result = generateMigration(deltas, 'sqlite');
    expect(result.up.length).toBeGreaterThanOrEqual(3); // main + history + references
    expect(result.up[0]).toContain('CREATE TABLE IF NOT EXISTS "Observation"');
    expect(result.down.length).toBeGreaterThanOrEqual(3); // DROP TABLE x3
  });

  // =========================================================================
  // 6. DROP_TABLE → DROP TABLE DDL
  // =========================================================================
  it('generates DROP TABLE DDL for DROP_TABLE', () => {
    const deltas: SchemaDelta[] = [{
      kind: 'DROP_TABLE',
      resourceType: 'Observation',
      tableName: 'Observation',
    }];
    const result = generateMigration(deltas, 'sqlite');
    expect(result.up).toHaveLength(3); // _References, _History, main
    expect(result.up[0]).toContain('DROP TABLE IF EXISTS "Observation_References"');
    expect(result.up[1]).toContain('DROP TABLE IF EXISTS "Observation_History"');
    expect(result.up[2]).toContain('DROP TABLE IF EXISTS "Observation"');
  });

  // =========================================================================
  // 7. dialect=sqlite type mapping
  // =========================================================================
  it('maps TIMESTAMPTZ to TEXT for sqlite', () => {
    const deltas: SchemaDelta[] = [{
      kind: 'ADD_COLUMN',
      resourceType: 'Patient',
      tableName: 'Patient',
      column: { name: 'effective', type: 'TIMESTAMPTZ', notNull: false, primaryKey: false },
    }];
    const result = generateMigration(deltas, 'sqlite');
    expect(result.up[0]).toContain('TEXT');
    expect(result.up[0]).not.toContain('TIMESTAMPTZ');
  });

  // =========================================================================
  // 8. dialect=postgres type mapping
  // =========================================================================
  it('preserves TIMESTAMPTZ for postgres', () => {
    const deltas: SchemaDelta[] = [{
      kind: 'ADD_COLUMN',
      resourceType: 'Patient',
      tableName: 'Patient',
      column: { name: 'effective', type: 'TIMESTAMPTZ', notNull: false, primaryKey: false },
    }];
    const result = generateMigration(deltas, 'postgres');
    expect(result.up[0]).toContain('TIMESTAMPTZ');
  });

  // =========================================================================
  // 9. multiple deltas generate ordered SQL
  // =========================================================================
  it('generates SQL for multiple deltas in order', () => {
    const deltas: SchemaDelta[] = [
      {
        kind: 'ADD_COLUMN',
        resourceType: 'Patient',
        tableName: 'Patient',
        column: { name: 'col1', type: 'TEXT', notNull: false, primaryKey: false },
      },
      {
        kind: 'ADD_INDEX',
        resourceType: 'Patient',
        tableName: 'Patient',
        index: { name: 'Patient_col1_idx', columns: ['col1'], indexType: 'btree', unique: false },
      },
    ];
    const result = generateMigration(deltas, 'sqlite');
    expect(result.up).toHaveLength(2);
    expect(result.up[0]).toContain('ADD COLUMN');
    expect(result.up[1]).toContain('CREATE INDEX');
  });

  // =========================================================================
  // 10. ADD_COLUMN with default value
  // =========================================================================
  it('includes DEFAULT for ADD_COLUMN with notNull + defaultValue', () => {
    const deltas: SchemaDelta[] = [{
      kind: 'ADD_COLUMN',
      resourceType: 'Patient',
      tableName: 'Patient',
      column: { name: 'active', type: 'INTEGER', notNull: true, primaryKey: false, defaultValue: '1' },
    }];
    const result = generateMigration(deltas, 'sqlite');
    expect(result.up[0]).toContain('NOT NULL DEFAULT 1');
  });

  // =========================================================================
  // 11. REINDEX delta → no DDL (just metadata)
  // =========================================================================
  it('REINDEX produces no DDL, only reindexDeltas', () => {
    const deltas: SchemaDelta[] = [{
      kind: 'REINDEX',
      resourceType: 'Patient',
      tableName: 'Patient',
      searchParam: { code: 'birthdate', type: 'date', expression: 'Patient.birthdate' },
    }];
    const result = generateMigration(deltas, 'sqlite');
    expect(result.up).toHaveLength(0);
    expect(result.down).toHaveLength(0);
    expect(result.reindexDeltas).toHaveLength(1);
    expect(result.reindexDeltas[0].searchParam!.code).toBe('birthdate');
  });

  // =========================================================================
  // 12. empty deltas → empty SQL
  // =========================================================================
  it('returns empty SQL for empty deltas', () => {
    const result = generateMigration([], 'sqlite');
    expect(result.up).toHaveLength(0);
    expect(result.down).toHaveLength(0);
    expect(result.reindexDeltas).toHaveLength(0);
    expect(result.description).toBe('No changes');
  });
});
