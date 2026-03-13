/**
 * SQLiteAdapter Tests — 12 tests covering all StorageAdapter methods.
 *
 * Uses sql.js in-memory database for fast, isolated tests.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteAdapter } from '../../db/sqlite-adapter.js';

describe('SQLiteAdapter', () => {
  let adapter: SQLiteAdapter;

  beforeEach(() => {
    adapter = new SQLiteAdapter(':memory:');
  });

  afterEach(async () => {
    await adapter.close();
  });

  // =========================================================================
  // 1. execute — DDL
  // =========================================================================
  it('executes DDL (CREATE TABLE) without error', async () => {
    await adapter.execute('CREATE TABLE foo (id TEXT PRIMARY KEY, val TEXT)');
    const rows = await adapter.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='foo'",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('foo');
  });

  // =========================================================================
  // 2. execute — INSERT returns changes count
  // =========================================================================
  it('returns changes count from INSERT', async () => {
    await adapter.execute('CREATE TABLE foo (id TEXT PRIMARY KEY, val TEXT)');
    const result = await adapter.execute("INSERT INTO foo VALUES ('1', 'hello')");
    expect(result.changes).toBe(1);
  });

  // =========================================================================
  // 3. execute — UPDATE returns changes count
  // =========================================================================
  it('returns changes count from UPDATE', async () => {
    await adapter.execute('CREATE TABLE foo (id TEXT PRIMARY KEY, val TEXT)');
    await adapter.execute("INSERT INTO foo VALUES ('1', 'hello')");
    await adapter.execute("INSERT INTO foo VALUES ('2', 'world')");
    const result = await adapter.execute("UPDATE foo SET val = 'updated' WHERE id = '1'");
    expect(result.changes).toBe(1);
  });

  // =========================================================================
  // 4. query — returns all rows
  // =========================================================================
  it('query returns all matching rows', async () => {
    await adapter.execute('CREATE TABLE foo (id TEXT PRIMARY KEY, val TEXT)');
    await adapter.execute("INSERT INTO foo VALUES ('1', 'a')");
    await adapter.execute("INSERT INTO foo VALUES ('2', 'b')");
    await adapter.execute("INSERT INTO foo VALUES ('3', 'c')");
    const rows = await adapter.query<{ id: string; val: string }>('SELECT * FROM foo ORDER BY id');
    expect(rows).toHaveLength(3);
    expect(rows[0].id).toBe('1');
    expect(rows[2].val).toBe('c');
  });

  // =========================================================================
  // 5. query — returns empty array for no matches
  // =========================================================================
  it('query returns empty array when no rows match', async () => {
    await adapter.execute('CREATE TABLE foo (id TEXT PRIMARY KEY, val TEXT)');
    const rows = await adapter.query('SELECT * FROM foo');
    expect(rows).toHaveLength(0);
    expect(rows).toEqual([]);
  });

  // =========================================================================
  // 6. queryOne — returns first row
  // =========================================================================
  it('queryOne returns single matching row', async () => {
    await adapter.execute('CREATE TABLE foo (id TEXT PRIMARY KEY, val TEXT)');
    await adapter.execute("INSERT INTO foo VALUES ('1', 'hello')");
    const row = await adapter.queryOne<{ val: string }>("SELECT val FROM foo WHERE id = '1'");
    expect(row).toBeDefined();
    expect(row!.val).toBe('hello');
  });

  // =========================================================================
  // 7. queryOne — returns undefined for no match
  // =========================================================================
  it('queryOne returns undefined when no row matches', async () => {
    await adapter.execute('CREATE TABLE foo (id TEXT PRIMARY KEY, val TEXT)');
    const row = await adapter.queryOne("SELECT * FROM foo WHERE id = 'nonexistent'");
    expect(row).toBeUndefined();
  });

  // =========================================================================
  // 8. transaction — commits on success
  // =========================================================================
  it('transaction commits on success', async () => {
    await adapter.execute('CREATE TABLE foo (id TEXT PRIMARY KEY, val TEXT)');
    await adapter.transaction((tx) => {
      tx.execute("INSERT INTO foo VALUES ('1', 'inside-tx')");
    });
    const row = await adapter.queryOne<{ val: string }>("SELECT val FROM foo WHERE id = '1'");
    expect(row).toBeDefined();
    expect(row!.val).toBe('inside-tx');
  });

  // =========================================================================
  // 9. transaction — rolls back on error
  // =========================================================================
  it('transaction rolls back on error', async () => {
    await adapter.execute('CREATE TABLE foo (id TEXT PRIMARY KEY, val TEXT)');
    await expect(
      adapter.transaction((tx) => {
        tx.execute("INSERT INTO foo VALUES ('1', 'should-rollback')");
        throw new Error('forced rollback');
      }),
    ).rejects.toThrow('forced rollback');
    const row = await adapter.queryOne("SELECT * FROM foo WHERE id = '1'");
    expect(row).toBeUndefined();
  });

  // =========================================================================
  // 10. transaction — supports reads within tx
  // =========================================================================
  it('transaction supports reads within the transaction', async () => {
    await adapter.execute('CREATE TABLE foo (id TEXT PRIMARY KEY, val TEXT)');
    await adapter.execute("INSERT INTO foo VALUES ('1', 'existing')");
    const result = await adapter.transaction((tx) => {
      tx.execute("INSERT INTO foo VALUES ('2', 'new')");
      const rows = tx.query<{ id: string }>('SELECT id FROM foo ORDER BY id');
      return rows.length;
    });
    expect(result).toBe(2);
  });

  // =========================================================================
  // 11. queryStream — yields all rows
  // =========================================================================
  it('queryStream yields all rows without full memory load', async () => {
    await adapter.execute('CREATE TABLE foo (id INTEGER PRIMARY KEY)');
    for (let i = 0; i < 10; i++) {
      await adapter.execute('INSERT INTO foo VALUES (?)', [i]);
    }
    const ids: number[] = [];
    for await (const row of adapter.queryStream<{ id: number }>('SELECT id FROM foo ORDER BY id')) {
      ids.push(row.id);
    }
    expect(ids).toHaveLength(10);
    expect(ids[0]).toBe(0);
    expect(ids[9]).toBe(9);
  });

  // =========================================================================
  // 12. close — prevents further operations
  // =========================================================================
  it('close prevents further database operations', async () => {
    await adapter.close();
    await expect(adapter.execute('SELECT 1')).rejects.toThrow();
  });
});
