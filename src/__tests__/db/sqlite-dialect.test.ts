/**
 * SQLiteDialect Tests — 10 tests covering all SqlDialect methods.
 */
import { describe, it, expect } from 'vitest';
import { SQLiteDialect } from '../../db/sqlite-dialect.js';

describe('SQLiteDialect', () => {
  const dialect = new SQLiteDialect();

  // =========================================================================
  // 1. name
  // =========================================================================
  it('has name "sqlite"', () => {
    expect(dialect.name).toBe('sqlite');
  });

  // =========================================================================
  // 2. placeholder — always returns ?
  // =========================================================================
  it('placeholder returns ? regardless of index', () => {
    expect(dialect.placeholder(1)).toBe('?');
    expect(dialect.placeholder(5)).toBe('?');
    expect(dialect.placeholder(100)).toBe('?');
  });

  // =========================================================================
  // 3. textArrayContains — json_each EXISTS subquery
  // =========================================================================
  it('textArrayContains generates json_each EXISTS subquery', () => {
    const result = dialect.textArrayContains('__gender', 2, 1);
    expect(result.sql).toContain('json_each("__gender")');
    expect(result.sql).toContain('WHERE value IN (?, ?)');
    expect(result.sql).toContain('EXISTS');
  });

  // =========================================================================
  // 4. textArrayContains — single param
  // =========================================================================
  it('textArrayContains works with single param', () => {
    const result = dialect.textArrayContains('___tag', 1, 1);
    expect(result.sql).toContain('WHERE value IN (?)');
  });

  // =========================================================================
  // 5. like — ESCAPE clause
  // =========================================================================
  it('like generates LIKE with ESCAPE', () => {
    const result = dialect.like('__name', 1);
    expect(result).toContain('"__name" LIKE ?');
    expect(result).toContain('ESCAPE');
    expect(result).toContain("'\\");
  });

  // =========================================================================
  // 6. limitOffset — LIMIT ? OFFSET ?
  // =========================================================================
  it('limitOffset generates LIMIT ? OFFSET ?', () => {
    const result = dialect.limitOffset(1);
    expect(result.sql).toBe('LIMIT ? OFFSET ?');
  });

  // =========================================================================
  // 7. arrayLiteral — JSON string
  // =========================================================================
  it('arrayLiteral produces valid JSON array string', () => {
    const result = dialect.arrayLiteral(['http://loinc.org|8480-6', '|8480-6']);
    expect(result).toBe('["http://loinc.org|8480-6","|8480-6"]');
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
  });

  // =========================================================================
  // 8. arrayLiteral — empty array
  // =========================================================================
  it('arrayLiteral handles empty array', () => {
    const result = dialect.arrayLiteral([]);
    expect(result).toBe('[]');
  });

  // =========================================================================
  // 9. timestampType / booleanType / textArrayType
  // =========================================================================
  it('returns correct SQLite type mappings', () => {
    expect(dialect.timestampType()).toBe('TEXT');
    expect(dialect.booleanType()).toBe('INTEGER');
    expect(dialect.textArrayType()).toBe('TEXT');
  });

  // =========================================================================
  // 10. upsertSuffix
  // =========================================================================
  it('upsertSuffix generates ON CONFLICT DO UPDATE', () => {
    const result = dialect.upsertSuffix('id', ['content', 'lastUpdated']);
    expect(result).toContain('ON CONFLICT("id")');
    expect(result).toContain('"content" = excluded."content"');
    expect(result).toContain('"lastUpdated" = excluded."lastUpdated"');
  });

  // =========================================================================
  // 11. autoIncrementPK
  // =========================================================================
  it('autoIncrementPK returns AUTOINCREMENT syntax', () => {
    const result = dialect.autoIncrementPK();
    expect(result).toContain('INTEGER');
    expect(result).toContain('PRIMARY KEY');
    expect(result).toContain('AUTOINCREMENT');
  });
});
