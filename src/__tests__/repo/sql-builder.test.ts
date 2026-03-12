/**
 * SQL Builder — Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  buildUpsertSQL,
  buildInsertSQL,
  buildSelectByIdSQL,
  buildSelectHistorySQL,
  buildSelectVersionSQL,
} from '../../repo/sql-builder.js';

// =============================================================================
// buildUpsertSQL
// =============================================================================

describe('buildUpsertSQL', () => {
  it('generates correct INSERT ... ON CONFLICT for a simple row', () => {
    const { sql, values } = buildUpsertSQL('Patient', {
      id: 'abc-123',
      content: '{"resourceType":"Patient"}',
      lastUpdated: '2026-01-01T00:00:00Z',
      deleted: false,
      __version: 1,
    });

    expect(sql).toContain('INSERT INTO "Patient"');
    expect(sql).toContain('"id"');
    expect(sql).toContain('"content"');
    expect(sql).toContain('ON CONFLICT ("id") DO UPDATE SET');
    expect(sql).not.toContain('"id" = EXCLUDED."id"');
    expect(sql).toContain('"content" = EXCLUDED."content"');
    expect(values).toEqual([
      'abc-123',
      '{"resourceType":"Patient"}',
      '2026-01-01T00:00:00Z',
      false,
      1,
    ]);
  });

  it('uses $1, $2, ... parameterized placeholders', () => {
    const { sql } = buildUpsertSQL('Observation', {
      id: 'x',
      content: 'y',
      lastUpdated: 'z',
    });

    expect(sql).toContain('$1');
    expect(sql).toContain('$2');
    expect(sql).toContain('$3');
    expect(sql).not.toContain('$4');
  });

  it('excludes "id" from ON CONFLICT update set', () => {
    const { sql } = buildUpsertSQL('Patient', {
      id: 'abc',
      content: 'json',
    });

    const updatePart = sql.split('ON CONFLICT')[1];
    expect(updatePart).not.toContain('"id" = EXCLUDED."id"');
    expect(updatePart).toContain('"content" = EXCLUDED."content"');
  });

  it('handles single column (id only) gracefully', () => {
    const { sql, values } = buildUpsertSQL('Binary', { id: 'x' });
    expect(sql).toContain('INSERT INTO "Binary"');
    expect(values).toEqual(['x']);
  });

  it('preserves column order', () => {
    const { sql } = buildUpsertSQL('Patient', {
      id: '1',
      content: '2',
      lastUpdated: '3',
      deleted: false,
    });

    const colsPart = sql.split('(')[1].split(')')[0];
    const cols = colsPart.split(',').map((c) => c.trim());
    expect(cols).toEqual(['"id"', '"content"', '"lastUpdated"', '"deleted"']);
  });

  it('handles null and undefined values', () => {
    const { values } = buildUpsertSQL('Patient', {
      id: 'x',
      _source: null,
      _profile: undefined,
    });
    expect(values).toEqual(['x', null, undefined]);
  });
});

// =============================================================================
// buildInsertSQL
// =============================================================================

describe('buildInsertSQL', () => {
  it('generates correct INSERT for history row', () => {
    const { sql, values } = buildInsertSQL('Patient_History', {
      id: 'abc-123',
      versionId: 'ver-456',
      lastUpdated: '2026-01-01T00:00:00Z',
      content: '{"resourceType":"Patient"}',
    });

    expect(sql).toContain('INSERT INTO "Patient_History"');
    expect(sql).toContain('"id", "versionId", "lastUpdated", "content"');
    expect(sql).toContain('$1, $2, $3, $4');
    expect(sql).not.toContain('ON CONFLICT');
    expect(values).toHaveLength(4);
  });

  it('generates correct parameter count', () => {
    const { sql, values } = buildInsertSQL('Test', { a: 1, b: 2 });
    expect(sql).toContain('$1, $2');
    expect(values).toEqual([1, 2]);
  });
});

// =============================================================================
// buildSelectByIdSQL
// =============================================================================

describe('buildSelectByIdSQL', () => {
  it('generates SELECT with content and deleted columns', () => {
    const sql = buildSelectByIdSQL('Patient');
    expect(sql).toBe('SELECT "content", "deleted", "projectId" FROM "Patient" WHERE "id" = $1');
  });

  it('quotes table name', () => {
    const sql = buildSelectByIdSQL('DiagnosticReport');
    expect(sql).toContain('"DiagnosticReport"');
  });
});

// =============================================================================
// buildSelectHistorySQL
// =============================================================================

describe('buildSelectHistorySQL', () => {
  it('generates SELECT ordered by lastUpdated DESC', () => {
    const sql = buildSelectHistorySQL('Patient_History');
    expect(sql).toContain('SELECT "content" FROM "Patient_History"');
    expect(sql).toContain('WHERE "id" = $1');
    expect(sql).toContain('ORDER BY "lastUpdated" DESC');
  });

  it('quotes table name correctly', () => {
    const sql = buildSelectHistorySQL('Observation_History');
    expect(sql).toContain('"Observation_History"');
  });
});

// =============================================================================
// buildSelectVersionSQL
// =============================================================================

describe('buildSelectVersionSQL', () => {
  it('generates SELECT by id and versionId', () => {
    const sql = buildSelectVersionSQL('Patient_History');
    expect(sql).toContain('WHERE "id" = $1 AND "versionId" = $2');
  });

  it('selects content column', () => {
    const sql = buildSelectVersionSQL('Patient_History');
    expect(sql).toContain('SELECT "content"');
  });

  it('quotes table name correctly', () => {
    const sql = buildSelectVersionSQL('DiagnosticReport_History');
    expect(sql).toContain('"DiagnosticReport_History"');
  });
});
