/**
 * IGResourceMapRepo Tests — SQLite in-memory.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';
import { IGResourceMapRepo } from '../../conformance/ig-resource-map-repo.js';

describe('IGResourceMapRepo (SQLite integration)', () => {
  let adapter: BetterSqlite3Adapter;
  let repo: IGResourceMapRepo;

  beforeEach(() => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    repo = new IGResourceMapRepo(adapter);
  });

  afterEach(async () => {
    await adapter.close();
  });

  it('ensureTable is idempotent', async () => {
    await repo.ensureTable();
    await repo.ensureTable();
  });

  it('batchInsert writes entries and returns count', async () => {
    const count = await repo.batchInsert('us-core', [
      { resourceType: 'StructureDefinition', resourceId: 'us-core-patient', resourceUrl: 'http://example.com/sd/patient', baseType: 'Patient' },
      { resourceType: 'ValueSet', resourceId: 'vs-1', resourceUrl: 'http://example.com/vs/1' },
      { resourceType: 'CodeSystem', resourceId: 'cs-1' },
    ]);
    expect(count).toBe(3);
  });

  it('getIGIndex groups resources correctly', async () => {
    await repo.batchInsert('us-core', [
      { resourceType: 'StructureDefinition', resourceId: 'sd-1', baseType: 'Patient' },
      { resourceType: 'StructureDefinition', resourceId: 'sd-ext', baseType: 'Extension' },
      { resourceType: 'ValueSet', resourceId: 'vs-1' },
      { resourceType: 'CodeSystem', resourceId: 'cs-1' },
      { resourceType: 'SearchParameter', resourceId: 'sp-1' },
    ]);
    const index = await repo.getIGIndex('us-core');
    expect(index.profiles).toHaveLength(1);
    expect(index.extensions).toHaveLength(1);
    expect(index.valueSets).toHaveLength(1);
    expect(index.codeSystems).toHaveLength(1);
    expect(index.searchParameters).toHaveLength(1);
  });

  it('getByType returns filtered results', async () => {
    await repo.batchInsert('ig-1', [
      { resourceType: 'StructureDefinition', resourceId: 'sd-1' },
      { resourceType: 'ValueSet', resourceId: 'vs-1' },
    ]);
    const sds = await repo.getByType('ig-1', 'StructureDefinition');
    expect(sds).toHaveLength(1);
    expect(sds[0].resourceType).toBe('StructureDefinition');
  });

  it('removeIG clears all entries for an IG', async () => {
    await repo.batchInsert('ig-1', [
      { resourceType: 'ValueSet', resourceId: 'vs-1' },
      { resourceType: 'ValueSet', resourceId: 'vs-2' },
    ]);
    await repo.removeIG('ig-1');
    const index = await repo.getIGIndex('ig-1');
    expect(index.valueSets).toHaveLength(0);
  });

  it('batchInsert upserts on conflict', async () => {
    await repo.batchInsert('ig-1', [
      { resourceType: 'ValueSet', resourceId: 'vs-1', resourceName: 'Old' },
    ]);
    await repo.batchInsert('ig-1', [
      { resourceType: 'ValueSet', resourceId: 'vs-1', resourceName: 'New' },
    ]);
    const results = await repo.getByType('ig-1', 'ValueSet');
    expect(results).toHaveLength(1);
    expect(results[0].resourceName).toBe('New');
  });
});
