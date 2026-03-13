/**
 * PostgresDialect Tests — 12 pure unit tests.
 */
import { describe, it, expect } from 'vitest';
import { PostgresDialect } from '../../db/postgres-dialect.js';

describe('PostgresDialect', () => {
  const dialect = new PostgresDialect();

  // =========================================================================
  // 1. placeholder returns $N (1-indexed)
  // =========================================================================
  it('placeholder returns $N for given index', () => {
    expect(dialect.placeholder(1)).toBe('$1');
    expect(dialect.placeholder(2)).toBe('$2');
    expect(dialect.placeholder(10)).toBe('$10');
  });

  // =========================================================================
  // 2. textArrayContains generates && ARRAY[]::text[]
  // =========================================================================
  it('textArrayContains generates && ARRAY[]::text[] syntax', () => {
    const result = dialect.textArrayContains('__code', 2, 3);
    expect(result.sql).toBe('"__code" && ARRAY[$3, $4]::text[]');
  });

  // =========================================================================
  // 3. like generates LIKE $N (no ESCAPE)
  // =========================================================================
  it('like generates LIKE $N without ESCAPE', () => {
    const result = dialect.like('name', 5);
    expect(result).toBe('"name" LIKE $5');
    expect(result).not.toContain('ESCAPE');
  });

  // =========================================================================
  // 4. limitOffset generates LIMIT $N OFFSET $M
  // =========================================================================
  it('limitOffset generates LIMIT $N OFFSET $M', () => {
    const result = dialect.limitOffset(3);
    expect(result.sql).toBe('LIMIT $3 OFFSET $4');
  });

  // =========================================================================
  // 5. arrayLiteral generates ARRAY[...]::text[]
  // =========================================================================
  it('arrayLiteral generates ARRAY[...]::text[]', () => {
    const result = dialect.arrayLiteral(['system|code', '|code']);
    expect(result).toBe("ARRAY['system|code', '|code']::text[]");
  });

  // =========================================================================
  // 6. timestampType returns TIMESTAMPTZ
  // =========================================================================
  it('timestampType returns TIMESTAMPTZ', () => {
    expect(dialect.timestampType()).toBe('TIMESTAMPTZ');
  });

  // =========================================================================
  // 7. booleanType returns BOOLEAN
  // =========================================================================
  it('booleanType returns BOOLEAN', () => {
    expect(dialect.booleanType()).toBe('BOOLEAN');
  });

  // =========================================================================
  // 8. textArrayType returns TEXT[]
  // =========================================================================
  it('textArrayType returns TEXT[]', () => {
    expect(dialect.textArrayType()).toBe('TEXT[]');
  });

  // =========================================================================
  // 9. upsertSuffix generates ON CONFLICT DO UPDATE
  // =========================================================================
  it('upsertSuffix generates ON CONFLICT DO UPDATE SET', () => {
    const result = dialect.upsertSuffix('id', ['name', 'value']);
    expect(result).toBe('ON CONFLICT("id") DO UPDATE SET "name" = excluded."name", "value" = excluded."value"');
  });

  // =========================================================================
  // 10. autoIncrementPK returns GENERATED ALWAYS AS IDENTITY
  // =========================================================================
  it('autoIncrementPK returns GENERATED ALWAYS AS IDENTITY', () => {
    const result = dialect.autoIncrementPK();
    expect(result).toContain('GENERATED ALWAYS AS IDENTITY');
    expect(result).toContain('PRIMARY KEY');
  });

  // =========================================================================
  // 11. name property is 'postgres'
  // =========================================================================
  it('name property is postgres', () => {
    expect(dialect.name).toBe('postgres');
  });

  // =========================================================================
  // 12. arrayLiteral handles empty array and single-quote escaping
  // =========================================================================
  it('arrayLiteral handles empty array and escapes single quotes', () => {
    expect(dialect.arrayLiteral([])).toBe('ARRAY[]::text[]');
    expect(dialect.arrayLiteral(["it's"])).toBe("ARRAY['it''s']::text[]");
  });
});
