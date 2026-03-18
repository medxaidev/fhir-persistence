/**
 * ExpansionCacheRepo Tests — SQLite in-memory.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';
import { ExpansionCacheRepo } from '../../conformance/expansion-cache-repo.js';

describe('ExpansionCacheRepo (SQLite integration)', () => {
  let adapter: BetterSqlite3Adapter;
  let repo: ExpansionCacheRepo;

  beforeEach(() => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    repo = new ExpansionCacheRepo(adapter);
  });

  afterEach(async () => {
    await adapter.close();
  });

  it('ensureTable is idempotent', async () => {
    await repo.ensureTable();
    await repo.ensureTable();
  });

  it('upsert + get round-trip', async () => {
    const json = JSON.stringify({ contains: [{ code: 'A' }] });
    await repo.upsert('http://example.com/vs/1', '1.0', json, 1);
    const result = await repo.get('http://example.com/vs/1', '1.0');
    expect(result).toBeDefined();
    expect(result!.valuesetUrl).toBe('http://example.com/vs/1');
    expect(result!.version).toBe('1.0');
    expect(result!.codeCount).toBe(1);
    expect(result!.expansionJson).toBe(json);
    expect(result!.expandedAt).toBeDefined();
  });

  it('get returns undefined for missing entry', async () => {
    const result = await repo.get('http://missing', '1.0');
    expect(result).toBeUndefined();
  });

  it('upsert overwrites existing entry', async () => {
    await repo.upsert('http://example.com/vs/1', '1.0', '{"old":true}', 1);
    await repo.upsert('http://example.com/vs/1', '1.0', '{"new":true}', 5);
    const result = await repo.get('http://example.com/vs/1', '1.0');
    expect(result!.expansionJson).toBe('{"new":true}');
    expect(result!.codeCount).toBe(5);
  });

  it('invalidate removes specific entry', async () => {
    await repo.upsert('http://example.com/vs/1', '1.0', '{}', 0);
    await repo.upsert('http://example.com/vs/1', '2.0', '{}', 0);
    await repo.invalidate('http://example.com/vs/1', '1.0');
    const r1 = await repo.get('http://example.com/vs/1', '1.0');
    const r2 = await repo.get('http://example.com/vs/1', '2.0');
    expect(r1).toBeUndefined();
    expect(r2).toBeDefined();
  });

  it('clear removes all entries', async () => {
    await repo.upsert('http://a', '1.0', '{}', 0);
    await repo.upsert('http://b', '1.0', '{}', 0);
    await repo.clear();
    const r1 = await repo.get('http://a', '1.0');
    const r2 = await repo.get('http://b', '1.0');
    expect(r1).toBeUndefined();
    expect(r2).toBeUndefined();
  });
});
