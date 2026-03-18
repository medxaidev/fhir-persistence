/**
 * SearchParamIndexRepo Tests — SQLite in-memory.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';
import { SearchParamIndexRepo } from '../../conformance/search-param-index-repo.js';

describe('SearchParamIndexRepo (SQLite integration)', () => {
  let adapter: BetterSqlite3Adapter;
  let repo: SearchParamIndexRepo;

  beforeEach(() => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    repo = new SearchParamIndexRepo(adapter);
  });

  afterEach(async () => {
    await adapter.close();
  });

  it('ensureTable is idempotent', async () => {
    await repo.ensureTable();
    await repo.ensureTable();
  });

  it('upsert + getByIG round-trip', async () => {
    await repo.upsert({
      id: 'sp-1', igId: 'us-core', code: 'ethnicity', type: 'token',
      base: ['Patient'], expression: 'Patient.extension("ethnicity")',
      url: 'http://example.com/sp/ethnicity',
    });
    const results = await repo.getByIG('us-core');
    expect(results).toHaveLength(1);
    expect(results[0].code).toBe('ethnicity');
    expect(results[0].base).toEqual(['Patient']);
  });

  it('batchUpsert returns count', async () => {
    const count = await repo.batchUpsert([
      { id: 'sp-1', igId: 'ig-1', code: 'a', type: 'string', base: ['Patient'] },
      { id: 'sp-2', igId: 'ig-1', code: 'b', type: 'token', base: ['Observation'] },
    ]);
    expect(count).toBe(2);
  });

  it('getByCode returns cross-IG results', async () => {
    await repo.upsert({ id: 'sp-1', igId: 'ig-1', code: 'race', type: 'token', base: ['Patient'] });
    await repo.upsert({ id: 'sp-2', igId: 'ig-2', code: 'race', type: 'token', base: ['Patient'] });
    const results = await repo.getByCode('race');
    expect(results).toHaveLength(2);
  });

  it('remove deletes entry', async () => {
    await repo.upsert({ id: 'sp-1', igId: 'ig-1', code: 'a', type: 'string', base: [] });
    await repo.remove('sp-1');
    const results = await repo.getByIG('ig-1');
    expect(results).toHaveLength(0);
  });

  it('removeByIG clears all entries for an IG', async () => {
    await repo.upsert({ id: 'sp-1', igId: 'ig-1', code: 'a', type: 'string', base: [] });
    await repo.upsert({ id: 'sp-2', igId: 'ig-1', code: 'b', type: 'token', base: [] });
    await repo.upsert({ id: 'sp-3', igId: 'ig-2', code: 'c', type: 'token', base: [] });
    await repo.removeByIG('ig-1');
    const r1 = await repo.getByIG('ig-1');
    const r2 = await repo.getByIG('ig-2');
    expect(r1).toHaveLength(0);
    expect(r2).toHaveLength(1);
  });
});
