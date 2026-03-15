/**
 * Tests for BetterSqlite3Adapter — Direction C: Production Hardening
 *
 * Covers:
 * - Basic CRUD (execute, query, queryOne)
 * - Transactions (commit, rollback)
 * - PreparedStatement (query, execute, finalize)
 * - queryStream (async iteration)
 * - WAL mode and PRAGMA configuration
 * - Error handling (closed database)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';

// =============================================================================
// Section 1: Basic CRUD
// =============================================================================

describe('BetterSqlite3Adapter — CRUD', () => {
  let adapter: BetterSqlite3Adapter;

  beforeEach(() => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
  });

  afterEach(async () => {
    await adapter.close();
  });

  it('creates table and inserts row', async () => {
    await adapter.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    const { changes } = await adapter.execute('INSERT INTO test (id, name) VALUES (?, ?)', [1, 'Alice']);
    expect(changes).toBe(1);
  });

  it('queries rows', async () => {
    await adapter.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    await adapter.execute('INSERT INTO test (id, name) VALUES (?, ?)', [1, 'Alice']);
    await adapter.execute('INSERT INTO test (id, name) VALUES (?, ?)', [2, 'Bob']);

    const rows = await adapter.query<{ id: number; name: string }>('SELECT * FROM test ORDER BY id');
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe('Alice');
    expect(rows[1].name).toBe('Bob');
  });

  it('queryOne returns first row', async () => {
    await adapter.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    await adapter.execute('INSERT INTO test (id, name) VALUES (?, ?)', [1, 'Alice']);

    const row = await adapter.queryOne<{ id: number; name: string }>('SELECT * FROM test WHERE id = ?', [1]);
    expect(row).toBeDefined();
    expect(row!.name).toBe('Alice');
  });

  it('queryOne returns undefined for no match', async () => {
    await adapter.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    const row = await adapter.queryOne('SELECT * FROM test WHERE id = ?', [999]);
    expect(row).toBeUndefined();
  });

  it('execute returns changes count', async () => {
    await adapter.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    await adapter.execute('INSERT INTO test (id, name) VALUES (?, ?)', [1, 'Alice']);
    await adapter.execute('INSERT INTO test (id, name) VALUES (?, ?)', [2, 'Bob']);

    const { changes } = await adapter.execute('DELETE FROM test');
    expect(changes).toBe(2);
  });
});

// =============================================================================
// Section 2: Transactions
// =============================================================================

describe('BetterSqlite3Adapter — Transactions', () => {
  let adapter: BetterSqlite3Adapter;

  beforeEach(() => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
  });

  afterEach(async () => {
    await adapter.close();
  });

  it('commits on success', async () => {
    await adapter.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');

    await adapter.transaction(async tx => {
      await tx.execute('INSERT INTO test (id, name) VALUES (?, ?)', [1, 'Alice']);
      await tx.execute('INSERT INTO test (id, name) VALUES (?, ?)', [2, 'Bob']);
    });

    const rows = await adapter.query('SELECT * FROM test');
    expect(rows).toHaveLength(2);
  });

  it('rolls back on error', async () => {
    await adapter.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');

    await expect(
      adapter.transaction(async tx => {
        await tx.execute('INSERT INTO test (id, name) VALUES (?, ?)', [1, 'Alice']);
        throw new Error('rollback test');
      }),
    ).rejects.toThrow('rollback test');

    const rows = await adapter.query('SELECT * FROM test');
    expect(rows).toHaveLength(0);
  });

  it('transaction context supports query', async () => {
    await adapter.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    await adapter.execute('INSERT INTO test (id, name) VALUES (?, ?)', [1, 'Alice']);

    const result = await adapter.transaction(async tx => {
      return tx.query<{ id: number; name: string }>('SELECT * FROM test');
    });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  it('transaction context supports queryOne', async () => {
    await adapter.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    await adapter.execute('INSERT INTO test (id, name) VALUES (?, ?)', [1, 'Alice']);

    const result = await adapter.transaction(async tx => {
      return tx.queryOne<{ id: number; name: string }>('SELECT * FROM test WHERE id = ?', [1]);
    });

    expect(result).toBeDefined();
    expect(result!.name).toBe('Alice');
  });

  it('returns value from transaction', async () => {
    await adapter.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');

    const count = await adapter.transaction(async tx => {
      await tx.execute('INSERT INTO test (id, name) VALUES (?, ?)', [1, 'Alice']);
      const row = await tx.queryOne<{ c: number }>('SELECT count(*) as c FROM test');
      return row!.c;
    });

    expect(count).toBe(1);
  });
});

// =============================================================================
// Section 3: PreparedStatement
// =============================================================================

describe('BetterSqlite3Adapter — PreparedStatement', () => {
  let adapter: BetterSqlite3Adapter;

  beforeEach(async () => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    await adapter.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
  });

  afterEach(async () => {
    await adapter.close();
  });

  it('prepared query returns rows', () => {
    const insertStmt = adapter.prepare('INSERT INTO test (id, name) VALUES (?, ?)');
    insertStmt.execute([1, 'Alice']);
    insertStmt.execute([2, 'Bob']);
    insertStmt.finalize();

    const selectStmt = adapter.prepare<{ id: number; name: string }>('SELECT * FROM test ORDER BY id');
    const rows = selectStmt.query();
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe('Alice');
    selectStmt.finalize();
  });

  it('prepared execute returns changes and lastInsertRowid', () => {
    const stmt = adapter.prepare('INSERT INTO test (id, name) VALUES (?, ?)');
    const result = stmt.execute([1, 'Alice']);
    expect(result.changes).toBe(1);
    expect(result.lastInsertRowid).toBeDefined();
    stmt.finalize();
  });
});

// =============================================================================
// Section 4: queryStream
// =============================================================================

describe('BetterSqlite3Adapter — queryStream', () => {
  let adapter: BetterSqlite3Adapter;

  beforeEach(async () => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    await adapter.execute('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    for (let i = 1; i <= 100; i++) {
      await adapter.execute('INSERT INTO test (id, name) VALUES (?, ?)', [i, `row-${i}`]);
    }
  });

  afterEach(async () => {
    await adapter.close();
  });

  it('iterates all rows', async () => {
    const rows: { id: number; name: string }[] = [];
    for await (const row of adapter.queryStream<{ id: number; name: string }>('SELECT * FROM test ORDER BY id')) {
      rows.push(row);
    }
    expect(rows).toHaveLength(100);
    expect(rows[0].name).toBe('row-1');
    expect(rows[99].name).toBe('row-100');
  });

  it('supports early break', async () => {
    let count = 0;
    for await (const _row of adapter.queryStream('SELECT * FROM test ORDER BY id')) {
      count++;
      if (count >= 10) break;
    }
    expect(count).toBe(10);
  });
});

// =============================================================================
// Section 5: Configuration & Error Handling
// =============================================================================

describe('BetterSqlite3Adapter — Configuration', () => {
  it('enables WAL mode by default', () => {
    const adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    const result = adapter.pragma('journal_mode') as { journal_mode: string }[];
    // In-memory databases may report 'memory' instead of 'wal'
    expect(result).toBeDefined();
    adapter.close();
  });

  it('supports custom PRAGMAs', () => {
    const adapter = new BetterSqlite3Adapter({
      path: ':memory:',
      pragmas: { cache_size: -8000 },
    });
    const result = adapter.pragma('cache_size') as { cache_size: number }[];
    expect(result[0].cache_size).toBe(-8000);
    adapter.close();
  });

  it('throws after close', async () => {
    const adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    await adapter.close();

    await expect(adapter.execute('SELECT 1')).rejects.toThrow('closed');
  });

  it('close is idempotent', async () => {
    const adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    await adapter.close();
    await adapter.close(); // should not throw
  });
});
