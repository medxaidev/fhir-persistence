/**
 * PostgresAdapter Tests — 12 tests using mock PgPoolLike.
 */
import { describe, it, expect, vi } from 'vitest';
import { PostgresAdapter, rewritePlaceholders } from '../../db/postgres-adapter.js';
import type { PgPoolLike, PgClientLike } from '../../db/postgres-adapter.js';

// Helper: create a mock pool
function createMockPool(overrides?: Partial<PgPoolLike>): PgPoolLike {
  const mockClient: PgClientLike = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    release: vi.fn(),
  };
  return {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: vi.fn().mockResolvedValue(mockClient),
    end: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('rewritePlaceholders', () => {
  // =========================================================================
  // 1. execute rewrites ? to $1,$2,...
  // =========================================================================
  it('rewrites single ? to $1', () => {
    expect(rewritePlaceholders('SELECT * FROM t WHERE id = ?')).toBe(
      'SELECT * FROM t WHERE id = $1',
    );
  });

  // =========================================================================
  // 2. multiple ? placeholders rewrite correctly
  // =========================================================================
  it('rewrites multiple ? to sequential $N', () => {
    expect(rewritePlaceholders('INSERT INTO t (a, b, c) VALUES (?, ?, ?)')).toBe(
      'INSERT INTO t (a, b, c) VALUES ($1, $2, $3)',
    );
  });

  // =========================================================================
  // 3. no-param query passes through unchanged
  // =========================================================================
  it('passes through SQL without ? unchanged', () => {
    const sql = 'SELECT * FROM "Patient" WHERE "deleted" = 0';
    expect(rewritePlaceholders(sql)).toBe(sql);
  });

  // =========================================================================
  // 4. skips ? inside single-quoted strings
  // =========================================================================
  it('skips ? inside single-quoted string literals', () => {
    expect(rewritePlaceholders("SELECT * FROM t WHERE name = '?' AND id = ?")).toBe(
      "SELECT * FROM t WHERE name = '?' AND id = $1",
    );
  });

  // =========================================================================
  // 5. handles escaped single quotes
  // =========================================================================
  it('handles escaped single quotes correctly', () => {
    expect(rewritePlaceholders("SELECT * FROM t WHERE name = 'it''s' AND id = ?")).toBe(
      "SELECT * FROM t WHERE name = 'it''s' AND id = $1",
    );
  });
});

describe('PostgresAdapter', () => {
  // =========================================================================
  // 6. execute calls pool.query with rewritten SQL
  // =========================================================================
  it('execute rewrites ? and calls pool.query', async () => {
    const pool = createMockPool({
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 3 }),
    });
    const adapter = new PostgresAdapter(pool);

    const result = await adapter.execute('UPDATE t SET a = ? WHERE id = ?', ['val', '123']);
    expect(result.changes).toBe(3);
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE t SET a = $1 WHERE id = $2',
      ['val', '123'],
    );
  });

  // =========================================================================
  // 7. query returns typed rows
  // =========================================================================
  it('query returns rows from pool', async () => {
    const pool = createMockPool({
      query: vi.fn().mockResolvedValue({
        rows: [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }],
        rowCount: 2,
      }),
    });
    const adapter = new PostgresAdapter(pool);

    const rows = await adapter.query<{ id: string; name: string }>(
      'SELECT * FROM t WHERE active = ?', [true],
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe('Alice');
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM t WHERE active = $1', [true]);
  });

  // =========================================================================
  // 8. queryOne returns first row
  // =========================================================================
  it('queryOne returns first row', async () => {
    const pool = createMockPool({
      query: vi.fn().mockResolvedValue({
        rows: [{ id: '1', name: 'Alice' }],
        rowCount: 1,
      }),
    });
    const adapter = new PostgresAdapter(pool);

    const row = await adapter.queryOne<{ id: string; name: string }>(
      'SELECT * FROM t WHERE id = ?', ['1'],
    );
    expect(row).toBeDefined();
    expect(row!.name).toBe('Alice');
  });

  // =========================================================================
  // 9. queryOne returns undefined for empty result
  // =========================================================================
  it('queryOne returns undefined for empty result', async () => {
    const pool = createMockPool();
    const adapter = new PostgresAdapter(pool);

    const row = await adapter.queryOne('SELECT * FROM t WHERE id = ?', ['nonexistent']);
    expect(row).toBeUndefined();
  });

  // =========================================================================
  // 10. transaction BEGIN/COMMIT on success
  // =========================================================================
  it('transaction calls BEGIN/COMMIT on success', async () => {
    const clientQuery = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });
    const mockClient: PgClientLike = {
      query: clientQuery,
      release: vi.fn(),
    };
    const pool = createMockPool({
      connect: vi.fn().mockResolvedValue(mockClient),
    });
    const adapter = new PostgresAdapter(pool);

    // transactionAsync for PG
    await adapter.transactionAsync(async (tx) => {
      await tx.execute('INSERT INTO t (id) VALUES (?)', ['1']);
    });

    // Check BEGIN was called first, then the INSERT, then COMMIT
    expect(clientQuery).toHaveBeenCalledWith('BEGIN');
    expect(clientQuery).toHaveBeenCalledWith('INSERT INTO t (id) VALUES ($1)', ['1']);
    expect(clientQuery).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });

  // =========================================================================
  // 11. transaction ROLLBACK on error
  // =========================================================================
  it('transaction calls ROLLBACK on error', async () => {
    const clientQuery = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.startsWith('INSERT')) {
        throw new Error('insert failed');
      }
      return { rows: [], rowCount: 0 };
    });
    const mockClient: PgClientLike = {
      query: clientQuery,
      release: vi.fn(),
    };
    const pool = createMockPool({
      connect: vi.fn().mockResolvedValue(mockClient),
    });
    const adapter = new PostgresAdapter(pool);

    await expect(adapter.transactionAsync(async (tx) => {
      await tx.execute('INSERT INTO t (id) VALUES (?)', ['1']);
    })).rejects.toThrow('insert failed');

    expect(clientQuery).toHaveBeenCalledWith('BEGIN');
    expect(clientQuery).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });

  // =========================================================================
  // 12. close releases pool
  // =========================================================================
  it('close calls pool.end()', async () => {
    const pool = createMockPool();
    const adapter = new PostgresAdapter(pool);

    await adapter.close();
    expect(pool.end).toHaveBeenCalled();

    // Second close is no-op
    await adapter.close();
    expect(pool.end).toHaveBeenCalledTimes(1);
  });
});
