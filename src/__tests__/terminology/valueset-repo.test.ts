/**
 * ValueSet Repo Tests — 12 tests on SQLite in-memory.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteAdapter } from '../../db/sqlite-adapter.js';
import { ValueSetRepo } from '../../terminology/valueset-repo.js';

describe('ValueSetRepo (SQLite integration)', () => {
  let adapter: SQLiteAdapter;
  let repo: ValueSetRepo;

  beforeEach(() => {
    adapter = new SQLiteAdapter(':memory:');
    repo = new ValueSetRepo(adapter);
  });

  afterEach(async () => {
    await adapter.close();
  });

  const sampleVS = {
    url: 'http://hl7.org/fhir/ValueSet/observation-codes',
    version: '4.0.1',
    name: 'ObservationCodes',
    content: JSON.stringify({ resourceType: 'ValueSet', url: 'http://hl7.org/fhir/ValueSet/observation-codes' }),
  };

  // =========================================================================
  // 1. ensureTable creates terminology_valuesets table
  // =========================================================================
  it('ensureTable creates the terminology_valuesets table', async () => {
    await repo.ensureTable();
    const rows = await adapter.query(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'terminology_valuesets'",
    );
    expect(rows).toHaveLength(1);
  });

  // =========================================================================
  // 2. upsert inserts new ValueSet
  // =========================================================================
  it('upsert inserts a new ValueSet', async () => {
    await repo.upsert(sampleVS);
    const count = await repo.getValueSetCount();
    expect(count).toBe(1);
  });

  // =========================================================================
  // 3. upsert updates existing ValueSet (same url+version)
  // =========================================================================
  it('upsert updates existing ValueSet with same url+version', async () => {
    await repo.upsert(sampleVS);

    const updated = { ...sampleVS, name: 'UpdatedName', content: '{"updated":true}' };
    await repo.upsert(updated);

    const count = await repo.getValueSetCount();
    expect(count).toBe(1);

    const result = await repo.getValueSet(sampleVS.url, sampleVS.version);
    expect(result?.name).toBe('UpdatedName');
    expect(result?.content).toBe('{"updated":true}');
  });

  // =========================================================================
  // 4. getValueSet returns content for existing
  // =========================================================================
  it('getValueSet returns stored ValueSet', async () => {
    await repo.upsert(sampleVS);
    const result = await repo.getValueSet(sampleVS.url, sampleVS.version);
    expect(result).toBeDefined();
    expect(result!.url).toBe(sampleVS.url);
    expect(result!.version).toBe(sampleVS.version);
    expect(result!.name).toBe(sampleVS.name);
    expect(result!.content).toBe(sampleVS.content);
    expect(result!.storedAt).toBeTruthy();
  });

  // =========================================================================
  // 5. getValueSet returns undefined for missing
  // =========================================================================
  it('getValueSet returns undefined for missing ValueSet', async () => {
    await repo.ensureTable();
    const result = await repo.getValueSet('http://nonexistent.org', '1.0');
    expect(result).toBeUndefined();
  });

  // =========================================================================
  // 6. getByUrl returns all versions for a url
  // =========================================================================
  it('getByUrl returns all versions for a url', async () => {
    await repo.upsert({ url: 'http://test.org/vs', version: '1.0', content: '{}' });
    await repo.upsert({ url: 'http://test.org/vs', version: '2.0', content: '{}' });
    await repo.upsert({ url: 'http://test.org/vs', version: '3.0', content: '{}' });

    const results = await repo.getByUrl('http://test.org/vs');
    expect(results).toHaveLength(3);
    expect(results.map(r => r.version)).toEqual(['1.0', '2.0', '3.0']);
  });

  // =========================================================================
  // 7. getByUrl returns empty for missing url
  // =========================================================================
  it('getByUrl returns empty for missing url', async () => {
    await repo.ensureTable();
    const results = await repo.getByUrl('http://nonexistent.org');
    expect(results).toHaveLength(0);
  });

  // =========================================================================
  // 8. remove deletes a specific version
  // =========================================================================
  it('remove deletes a specific version', async () => {
    await repo.upsert({ url: 'http://test.org/vs', version: '1.0', content: '{}' });
    await repo.upsert({ url: 'http://test.org/vs', version: '2.0', content: '{}' });

    await repo.remove('http://test.org/vs', '1.0');

    const remaining = await repo.getByUrl('http://test.org/vs');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].version).toBe('2.0');
  });

  // =========================================================================
  // 9. getAll returns all stored ValueSets
  // =========================================================================
  it('getAll returns all stored ValueSets', async () => {
    await repo.upsert({ url: 'http://a.org/vs', version: '1.0', content: '{}' });
    await repo.upsert({ url: 'http://b.org/vs', version: '1.0', content: '{}' });
    await repo.upsert({ url: 'http://b.org/vs', version: '2.0', content: '{}' });

    const all = await repo.getAll();
    expect(all).toHaveLength(3);
  });

  // =========================================================================
  // 10. upsert with different versions stores independently
  // =========================================================================
  it('different versions of same url are stored independently', async () => {
    await repo.upsert({ url: 'http://test.org/vs', version: '1.0', name: 'V1', content: '{"v":1}' });
    await repo.upsert({ url: 'http://test.org/vs', version: '2.0', name: 'V2', content: '{"v":2}' });

    const v1 = await repo.getValueSet('http://test.org/vs', '1.0');
    const v2 = await repo.getValueSet('http://test.org/vs', '2.0');
    expect(v1?.name).toBe('V1');
    expect(v1?.content).toBe('{"v":1}');
    expect(v2?.name).toBe('V2');
    expect(v2?.content).toBe('{"v":2}');
  });

  // =========================================================================
  // 11. getValueSetCount returns total count
  // =========================================================================
  it('getValueSetCount returns correct total', async () => {
    expect(await repo.getValueSetCount()).toBe(0);

    await repo.upsert({ url: 'http://a.org/vs', version: '1.0', content: '{}' });
    await repo.upsert({ url: 'http://b.org/vs', version: '1.0', content: '{}' });
    expect(await repo.getValueSetCount()).toBe(2);
  });

  // =========================================================================
  // 12. clear removes all ValueSets
  // =========================================================================
  it('clear removes all ValueSets', async () => {
    await repo.upsert({ url: 'http://a.org/vs', version: '1.0', content: '{}' });
    await repo.upsert({ url: 'http://b.org/vs', version: '1.0', content: '{}' });
    expect(await repo.getValueSetCount()).toBe(2);

    await repo.clear();
    expect(await repo.getValueSetCount()).toBe(0);
  });
});
