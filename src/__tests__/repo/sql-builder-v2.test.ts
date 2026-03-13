/**
 * SQL Builder v2 Tests — 12 tests covering dialect-aware SQL generation.
 */
import { describe, it, expect } from 'vitest';
import {
  buildInsertMainSQLv2,
  buildUpdateMainSQLv2,
  buildInsertHistorySQLv2,
  buildSelectByIdSQLv2,
  buildSelectVersionSQLv2,
  buildDeleteReferencesSQLv2,
  buildInsertReferencesSQLv2,
  buildInstanceHistorySQLv2,
  buildTypeHistorySQLv2,
} from '../../repo/sql-builder.js';

describe('SQL Builder v2', () => {
  // =========================================================================
  // 1. buildInsertMainSQLv2 — uses ? placeholders
  // =========================================================================
  it('buildInsertMainSQLv2 uses ? placeholders', () => {
    const { sql, values } = buildInsertMainSQLv2('Patient', {
      id: 'p1',
      versionId: 'v1',
      content: '{}',
      lastUpdated: '2024-01-01',
      deleted: 0,
    });
    expect(sql).toContain('INSERT INTO "Patient"');
    expect(sql).toContain('?, ?, ?, ?, ?');
    expect(sql).not.toContain('$');
    expect(values).toEqual(['p1', 'v1', '{}', '2024-01-01', 0]);
  });

  // =========================================================================
  // 2. buildInsertMainSQLv2 — no projectId column
  // =========================================================================
  it('buildInsertMainSQLv2 does not include projectId', () => {
    const { sql } = buildInsertMainSQLv2('Patient', {
      id: 'p1',
      versionId: 'v1',
      content: '{}',
      lastUpdated: '2024-01-01',
      deleted: 0,
    });
    expect(sql).not.toContain('projectId');
    expect(sql).not.toContain('__version');
  });

  // =========================================================================
  // 3. buildUpdateMainSQLv2 — UPDATE SET ... WHERE id = ?
  // =========================================================================
  it('buildUpdateMainSQLv2 generates UPDATE with WHERE id = ?', () => {
    const { sql, values } = buildUpdateMainSQLv2('Patient', {
      id: 'p1',
      versionId: 'v2',
      content: '{"updated":true}',
      deleted: 0,
    });
    expect(sql).toContain('UPDATE "Patient" SET');
    expect(sql).toContain('WHERE "id" = ?');
    expect(sql).toContain('"versionId" = ?');
    expect(sql).not.toContain('$');
    // values: update values first, then id at end
    expect(values[values.length - 1]).toBe('p1');
  });

  // =========================================================================
  // 4. buildUpdateMainSQLv2 — does not set id in SET clause
  // =========================================================================
  it('buildUpdateMainSQLv2 does not include id in SET clause', () => {
    const { sql } = buildUpdateMainSQLv2('Patient', {
      id: 'p1',
      versionId: 'v2',
      content: '{}',
      deleted: 0,
    });
    // SET should not have "id" = ?
    const setClause = sql.split('SET')[1].split('WHERE')[0];
    expect(setClause).not.toContain('"id"');
  });

  // =========================================================================
  // 5. buildInsertHistorySQLv2 — uses ? placeholders
  // =========================================================================
  it('buildInsertHistorySQLv2 uses ? placeholders', () => {
    const { sql, values } = buildInsertHistorySQLv2('Patient_History', {
      id: 'p1',
      versionId: 'v1',
      content: '{}',
      lastUpdated: '2024-01-01',
      deleted: 0,
    });
    expect(sql).toContain('INSERT INTO "Patient_History"');
    expect(sql).toContain('?');
    expect(sql).not.toContain('$');
    expect(values).toHaveLength(5);
  });

  // =========================================================================
  // 6. buildSelectByIdSQLv2 — no projectId
  // =========================================================================
  it('buildSelectByIdSQLv2 returns versionId and no projectId', () => {
    const sql = buildSelectByIdSQLv2('Patient');
    expect(sql).toContain('"versionId"');
    expect(sql).toContain('"deleted"');
    expect(sql).toContain('WHERE "id" = ?');
    expect(sql).not.toContain('projectId');
  });

  // =========================================================================
  // 7. buildSelectVersionSQLv2 — WHERE id + versionId
  // =========================================================================
  it('buildSelectVersionSQLv2 uses ? for id and versionId', () => {
    const sql = buildSelectVersionSQLv2('Patient_History');
    expect(sql).toContain('WHERE "id" = ? AND "versionId" = ?');
    expect(sql).not.toContain('$');
  });

  // =========================================================================
  // 8. buildDeleteReferencesSQLv2
  // =========================================================================
  it('buildDeleteReferencesSQLv2 generates DELETE WHERE resourceId = ?', () => {
    const sql = buildDeleteReferencesSQLv2('Patient_References');
    expect(sql).toBe('DELETE FROM "Patient_References" WHERE "resourceId" = ?');
  });

  // =========================================================================
  // 9. buildInsertReferencesSQLv2 — multi-row VALUES
  // =========================================================================
  it('buildInsertReferencesSQLv2 generates multi-row INSERT', () => {
    const sql = buildInsertReferencesSQLv2('Observation_References', 3);
    expect(sql).toContain('INSERT INTO "Observation_References"');
    expect(sql).toContain('"resourceId", "targetType", "targetId", "code", "referenceRaw"');
    // 3 rows × 5 columns = should have 3 parenthesized groups
    const matches = sql.match(/\([\?, ]+\)/g);
    expect(matches).toHaveLength(3);
  });

  // =========================================================================
  // 10. buildInstanceHistorySQLv2 — ORDER BY versionSeq DESC
  // =========================================================================
  it('buildInstanceHistorySQLv2 orders by versionSeq DESC', () => {
    const { sql, values } = buildInstanceHistorySQLv2('Patient_History', 'p1');
    expect(sql).toContain('ORDER BY "versionSeq" DESC');
    expect(sql).toContain('"deleted"');
    expect(values).toEqual(['p1']);
  });

  // =========================================================================
  // 11. buildInstanceHistorySQLv2 — with _since and _count
  // =========================================================================
  it('buildInstanceHistorySQLv2 handles _since and _count', () => {
    const { sql, values } = buildInstanceHistorySQLv2('Patient_History', 'p1', {
      since: '2024-01-01',
      count: 10,
    });
    expect(sql).toContain('"lastUpdated" >= ?');
    expect(sql).toContain('LIMIT ?');
    expect(values).toEqual(['p1', '2024-01-01', 10]);
  });

  // =========================================================================
  // 12. buildTypeHistorySQLv2 — no resource ID filter
  // =========================================================================
  it('buildTypeHistorySQLv2 has no id filter, orders by versionSeq DESC', () => {
    const { sql, values } = buildTypeHistorySQLv2('Patient_History');
    expect(sql).not.toContain('"id" = ?');
    expect(sql).toContain('ORDER BY "versionSeq" DESC');
    expect(values).toEqual([]);
  });
});
