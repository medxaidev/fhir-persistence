/**
 * Schema Diff Tests — 12 tests covering compareSchemas.
 */
import { describe, it, expect } from 'vitest';
import { compareSchemas } from '../../migration/schema-diff.js';
import type { ResourceTableSet, ColumnSchema, IndexSchema } from '../../schema/table-schema.js';

// Helper: minimal ResourceTableSet factory
function makeTableSet(
  resourceType: string,
  extraCols: ColumnSchema[] = [],
  extraIndexes: IndexSchema[] = [],
  searchParams?: Array<{ code: string; type: string; expression: string }>,
): ResourceTableSet {
  return {
    resourceType,
    main: {
      tableName: resourceType,
      resourceType,
      columns: [
        { name: 'id', type: 'TEXT', notNull: true, primaryKey: true },
        { name: 'content', type: 'TEXT', notNull: true, primaryKey: false },
        ...extraCols,
      ],
      indexes: [
        { name: `${resourceType}_lastUpdated_idx`, columns: ['lastUpdated'], indexType: 'btree', unique: false },
        ...extraIndexes,
      ],
      constraints: [],
    },
    history: {
      tableName: `${resourceType}_History`,
      resourceType,
      columns: [],
      indexes: [],
    },
    references: {
      tableName: `${resourceType}_References`,
      resourceType,
      columns: [],
      indexes: [],
      compositePrimaryKey: [],
    },
    searchParams,
  };
}

describe('compareSchemas', () => {
  // =========================================================================
  // 1. identical schemas → no deltas
  // =========================================================================
  it('returns no deltas for identical schemas', () => {
    const sets = [makeTableSet('Patient')];
    const deltas = compareSchemas(sets, sets);
    expect(deltas).toHaveLength(0);
  });

  // =========================================================================
  // 2. new column added → ADD_COLUMN delta
  // =========================================================================
  it('detects new column as ADD_COLUMN', () => {
    const oldSets = [makeTableSet('Patient')];
    const newSets = [makeTableSet('Patient', [
      { name: 'birthdate', type: 'TEXT', notNull: false, primaryKey: false },
    ])];
    const deltas = compareSchemas(oldSets, newSets);
    const addCol = deltas.find(d => d.kind === 'ADD_COLUMN');
    expect(addCol).toBeDefined();
    expect(addCol!.column!.name).toBe('birthdate');
    expect(addCol!.resourceType).toBe('Patient');
  });

  // =========================================================================
  // 3. column removed → DROP_COLUMN delta
  // =========================================================================
  it('detects removed column as DROP_COLUMN', () => {
    const oldSets = [makeTableSet('Patient', [
      { name: 'oldField', type: 'TEXT', notNull: false, primaryKey: false },
    ])];
    const newSets = [makeTableSet('Patient')];
    const deltas = compareSchemas(oldSets, newSets);
    const dropCol = deltas.find(d => d.kind === 'DROP_COLUMN');
    expect(dropCol).toBeDefined();
    expect(dropCol!.column!.name).toBe('oldField');
  });

  // =========================================================================
  // 4. new index added → ADD_INDEX delta
  // =========================================================================
  it('detects new index as ADD_INDEX', () => {
    const oldSets = [makeTableSet('Patient')];
    const newSets = [makeTableSet('Patient', [], [
      { name: 'Patient_birthdate_idx', columns: ['birthdate'], indexType: 'btree', unique: false },
    ])];
    const deltas = compareSchemas(oldSets, newSets);
    const addIdx = deltas.find(d => d.kind === 'ADD_INDEX');
    expect(addIdx).toBeDefined();
    expect(addIdx!.index!.name).toBe('Patient_birthdate_idx');
  });

  // =========================================================================
  // 5. index removed → DROP_INDEX delta
  // =========================================================================
  it('detects removed index as DROP_INDEX', () => {
    const oldSets = [makeTableSet('Patient', [], [
      { name: 'Patient_old_idx', columns: ['old'], indexType: 'btree', unique: false },
    ])];
    const newSets = [makeTableSet('Patient')];
    const deltas = compareSchemas(oldSets, newSets);
    const dropIdx = deltas.find(d => d.kind === 'DROP_INDEX');
    expect(dropIdx).toBeDefined();
    expect(dropIdx!.index!.name).toBe('Patient_old_idx');
  });

  // =========================================================================
  // 6. new table (resource type) added → ADD_TABLE delta
  // =========================================================================
  it('detects new resource type as ADD_TABLE', () => {
    const oldSets = [makeTableSet('Patient')];
    const newSets = [makeTableSet('Patient'), makeTableSet('Observation')];
    const deltas = compareSchemas(oldSets, newSets);
    const addTable = deltas.find(d => d.kind === 'ADD_TABLE');
    expect(addTable).toBeDefined();
    expect(addTable!.resourceType).toBe('Observation');
    expect(addTable!.tableSet).toBeDefined();
  });

  // =========================================================================
  // 7. table removed → DROP_TABLE delta
  // =========================================================================
  it('detects removed resource type as DROP_TABLE', () => {
    const oldSets = [makeTableSet('Patient'), makeTableSet('Observation')];
    const newSets = [makeTableSet('Patient')];
    const deltas = compareSchemas(oldSets, newSets);
    const dropTable = deltas.find(d => d.kind === 'DROP_TABLE');
    expect(dropTable).toBeDefined();
    expect(dropTable!.resourceType).toBe('Observation');
  });

  // =========================================================================
  // 8. column type changed → ALTER_COLUMN delta
  // =========================================================================
  it('detects column type change as ALTER_COLUMN', () => {
    const oldSets = [makeTableSet('Patient', [
      { name: 'score', type: 'TEXT', notNull: false, primaryKey: false },
    ])];
    const newSets = [makeTableSet('Patient', [
      { name: 'score', type: 'DOUBLE PRECISION', notNull: false, primaryKey: false },
    ])];
    const deltas = compareSchemas(oldSets, newSets);
    const alterCol = deltas.find(d => d.kind === 'ALTER_COLUMN');
    expect(alterCol).toBeDefined();
    expect(alterCol!.column!.name).toBe('score');
    expect(alterCol!.column!.type).toBe('DOUBLE PRECISION');
    expect(alterCol!.oldColumn!.type).toBe('TEXT');
  });

  // =========================================================================
  // 9. multiple changes across resource types
  // =========================================================================
  it('handles multiple changes across resource types', () => {
    const oldSets = [makeTableSet('Patient'), makeTableSet('Observation')];
    const newSets = [
      makeTableSet('Patient', [
        { name: 'newCol', type: 'TEXT', notNull: false, primaryKey: false },
      ]),
      makeTableSet('Observation', [], [
        { name: 'Obs_new_idx', columns: ['code'], indexType: 'btree', unique: false },
      ]),
    ];
    const deltas = compareSchemas(oldSets, newSets);
    expect(deltas.filter(d => d.resourceType === 'Patient')).toHaveLength(1);
    expect(deltas.filter(d => d.resourceType === 'Observation')).toHaveLength(1);
  });

  // =========================================================================
  // 10. token-column added (2 columns + 1 index)
  // =========================================================================
  it('detects token-column additions as multiple ADD_COLUMN + ADD_INDEX', () => {
    const oldSets = [makeTableSet('Patient')];
    const newSets = [makeTableSet('Patient', [
      { name: '__code', type: 'TEXT', notNull: false, primaryKey: false, strategy: 'token-column' },
      { name: '__codeSort', type: 'TEXT', notNull: false, primaryKey: false, strategy: 'token-column' },
    ], [
      { name: 'Patient___code_idx', columns: ['__code'], indexType: 'btree', unique: false },
    ])];
    const deltas = compareSchemas(oldSets, newSets);
    const addCols = deltas.filter(d => d.kind === 'ADD_COLUMN');
    const addIdxs = deltas.filter(d => d.kind === 'ADD_INDEX');
    expect(addCols).toHaveLength(2);
    expect(addIdxs).toHaveLength(1);
  });

  // =========================================================================
  // 11. SP expression changed → REINDEX delta
  // =========================================================================
  it('detects SP expression change as REINDEX', () => {
    const oldSets = [makeTableSet('Patient', [], [], [
      { code: 'birthdate', type: 'date', expression: 'Patient.birthDate' },
    ])];
    const newSets = [makeTableSet('Patient', [], [], [
      { code: 'birthdate', type: 'date', expression: 'Patient.birthdate' },
    ])];
    const deltas = compareSchemas(oldSets, newSets);
    const reindex = deltas.find(d => d.kind === 'REINDEX');
    expect(reindex).toBeDefined();
    expect(reindex!.searchParam!.code).toBe('birthdate');
  });

  // =========================================================================
  // 12. empty old schema (fresh install) → all ADD_TABLE
  // =========================================================================
  it('treats empty old schema as all ADD_TABLE', () => {
    const oldSets: ResourceTableSet[] = [];
    const newSets = [makeTableSet('Patient'), makeTableSet('Observation')];
    const deltas = compareSchemas(oldSets, newSets);
    const addTables = deltas.filter(d => d.kind === 'ADD_TABLE');
    expect(addTables).toHaveLength(2);
    expect(addTables.map(d => d.resourceType).sort()).toEqual(['Observation', 'Patient']);
  });
});
