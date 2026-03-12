/**
 * Unit tests for history SQL builder extensions (Phase 10).
 */

import { describe, it, expect } from 'vitest';
import { buildInstanceHistorySQL, buildTypeHistorySQL } from '../../repo/sql-builder.js';

// =============================================================================
// buildInstanceHistorySQL
// =============================================================================

describe('buildInstanceHistorySQL', () => {
  it('generates basic instance history SQL with id filter', () => {
    const { sql, values } = buildInstanceHistorySQL('Patient_History', 'p1');
    expect(sql).toContain('"Patient_History"');
    expect(sql).toContain('"id" = $1');
    expect(sql).toContain('ORDER BY "lastUpdated" DESC');
    expect(values).toEqual(['p1']);
  });

  it('adds _since filter', () => {
    const { sql, values } = buildInstanceHistorySQL('Patient_History', 'p1', {
      since: '2024-01-01T00:00:00Z',
    });
    expect(sql).toContain('"lastUpdated" >= $2');
    expect(values).toEqual(['p1', '2024-01-01T00:00:00Z']);
  });

  it('adds cursor filter', () => {
    const { sql, values } = buildInstanceHistorySQL('Patient_History', 'p1', {
      cursor: '2024-06-01T00:00:00Z',
    });
    expect(sql).toContain('"lastUpdated" < $2');
    expect(values).toEqual(['p1', '2024-06-01T00:00:00Z']);
  });

  it('adds _count LIMIT', () => {
    const { sql, values } = buildInstanceHistorySQL('Patient_History', 'p1', {
      count: 10,
    });
    expect(sql).toContain('LIMIT $2');
    expect(values).toEqual(['p1', 10]);
  });

  it('combines _since + cursor + _count', () => {
    const { sql, values } = buildInstanceHistorySQL('Patient_History', 'p1', {
      since: '2024-01-01T00:00:00Z',
      cursor: '2024-06-01T00:00:00Z',
      count: 5,
    });
    expect(sql).toContain('"lastUpdated" >= $2');
    expect(sql).toContain('"lastUpdated" < $3');
    expect(sql).toContain('LIMIT $4');
    expect(values).toEqual(['p1', '2024-01-01T00:00:00Z', '2024-06-01T00:00:00Z', 5]);
  });

  it('selects id, versionId, lastUpdated, content columns', () => {
    const { sql } = buildInstanceHistorySQL('Patient_History', 'p1');
    expect(sql).toContain('"id"');
    expect(sql).toContain('"versionId"');
    expect(sql).toContain('"lastUpdated"');
    expect(sql).toContain('"content"');
  });

  it('does not add LIMIT when count is 0', () => {
    const { sql, values } = buildInstanceHistorySQL('Patient_History', 'p1', {
      count: 0,
    });
    expect(sql).not.toContain('LIMIT');
    expect(values).toEqual(['p1']);
  });

  it('quotes table name correctly for different resource types', () => {
    const { sql } = buildInstanceHistorySQL('Observation_History', 'obs-1');
    expect(sql).toContain('"Observation_History"');
  });

  it('uses $1 for id parameter', () => {
    const { sql, values } = buildInstanceHistorySQL('Patient_History', 'uuid-123');
    expect(sql).toContain('$1');
    expect(values[0]).toBe('uuid-123');
  });

  it('handles _since + _count without cursor', () => {
    const { sql, values } = buildInstanceHistorySQL('Patient_History', 'p1', {
      since: '2024-01-01T00:00:00Z',
      count: 10,
    });
    expect(sql).toContain('"lastUpdated" >= $2');
    expect(sql).toContain('LIMIT $3');
    expect(sql).not.toContain('"lastUpdated" <');
    expect(values).toEqual(['p1', '2024-01-01T00:00:00Z', 10]);
  });
});

// =============================================================================
// buildTypeHistorySQL
// =============================================================================

describe('buildTypeHistorySQL', () => {
  it('generates basic type history SQL without WHERE', () => {
    const { sql, values } = buildTypeHistorySQL('Patient_History');
    expect(sql).toContain('"Patient_History"');
    expect(sql).not.toContain('WHERE');
    expect(sql).toContain('ORDER BY "lastUpdated" DESC');
    expect(values).toEqual([]);
  });

  it('adds _since filter', () => {
    const { sql, values } = buildTypeHistorySQL('Patient_History', {
      since: '2024-01-01T00:00:00Z',
    });
    expect(sql).toContain('WHERE "lastUpdated" >= $1');
    expect(values).toEqual(['2024-01-01T00:00:00Z']);
  });

  it('adds cursor filter', () => {
    const { sql, values } = buildTypeHistorySQL('Patient_History', {
      cursor: '2024-06-01T00:00:00Z',
    });
    expect(sql).toContain('WHERE "lastUpdated" < $1');
    expect(values).toEqual(['2024-06-01T00:00:00Z']);
  });

  it('adds _count LIMIT', () => {
    const { sql, values } = buildTypeHistorySQL('Patient_History', {
      count: 20,
    });
    expect(sql).toContain('LIMIT $1');
    expect(values).toEqual([20]);
  });

  it('combines _since + cursor + _count', () => {
    const { sql, values } = buildTypeHistorySQL('Patient_History', {
      since: '2024-01-01T00:00:00Z',
      cursor: '2024-06-01T00:00:00Z',
      count: 5,
    });
    expect(sql).toContain('"lastUpdated" >= $1');
    expect(sql).toContain('"lastUpdated" < $2');
    expect(sql).toContain('LIMIT $3');
    expect(values).toEqual(['2024-01-01T00:00:00Z', '2024-06-01T00:00:00Z', 5]);
  });
});
