/**
 * ConceptHierarchyRepo Tests — SQLite in-memory.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';
import { ConceptHierarchyRepo } from '../../conformance/concept-hierarchy-repo.js';

describe('ConceptHierarchyRepo (SQLite integration)', () => {
  let adapter: BetterSqlite3Adapter;
  let repo: ConceptHierarchyRepo;

  beforeEach(() => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    repo = new ConceptHierarchyRepo(adapter);
  });

  afterEach(async () => {
    await adapter.close();
  });

  it('ensureTable is idempotent', async () => {
    await repo.ensureTable();
    await repo.ensureTable();
  });

  it('batchInsert writes hierarchy and returns count', async () => {
    const count = await repo.batchInsert([
      { id: 'loinc:LP1', codeSystemUrl: 'http://loinc.org', code: 'LP1', display: 'Root', level: 0 },
      { id: 'loinc:LP2', codeSystemUrl: 'http://loinc.org', code: 'LP2', display: 'Child', parentCode: 'LP1', level: 1 },
    ]);
    expect(count).toBe(2);
  });

  it('getTree returns concepts ordered by level', async () => {
    await repo.batchInsert([
      { id: 'cs:C', codeSystemUrl: 'http://cs', code: 'C', level: 1, parentCode: 'A' },
      { id: 'cs:A', codeSystemUrl: 'http://cs', code: 'A', level: 0 },
      { id: 'cs:B', codeSystemUrl: 'http://cs', code: 'B', level: 0 },
    ]);
    const tree = await repo.getTree('http://cs');
    expect(tree).toHaveLength(3);
    expect(tree[0].level).toBe(0);
    expect(tree[2].level).toBe(1);
  });

  it('getChildren returns direct children', async () => {
    await repo.batchInsert([
      { id: 'cs:A', codeSystemUrl: 'http://cs', code: 'A', level: 0 },
      { id: 'cs:B', codeSystemUrl: 'http://cs', code: 'B', parentCode: 'A', level: 1 },
      { id: 'cs:C', codeSystemUrl: 'http://cs', code: 'C', parentCode: 'A', level: 1 },
      { id: 'cs:D', codeSystemUrl: 'http://cs', code: 'D', parentCode: 'B', level: 2 },
    ]);
    const children = await repo.getChildren('http://cs', 'A');
    expect(children).toHaveLength(2);
    expect(children.map(c => c.code).sort()).toEqual(['B', 'C']);
  });

  it('lookup finds a specific concept', async () => {
    await repo.batchInsert([
      { id: 'cs:A', codeSystemUrl: 'http://cs', code: 'A', display: 'Alpha', level: 0 },
    ]);
    const result = await repo.lookup('http://cs', 'A');
    expect(result).toBeDefined();
    expect(result!.display).toBe('Alpha');
  });

  it('lookup returns undefined for missing concept', async () => {
    const result = await repo.lookup('http://cs', 'missing');
    expect(result).toBeUndefined();
  });

  it('removeByCodeSystem clears only target CS', async () => {
    await repo.batchInsert([
      { id: 'cs1:A', codeSystemUrl: 'http://cs1', code: 'A', level: 0 },
      { id: 'cs2:A', codeSystemUrl: 'http://cs2', code: 'A', level: 0 },
    ]);
    await repo.removeByCodeSystem('http://cs1');
    const r1 = await repo.getTree('http://cs1');
    const r2 = await repo.getTree('http://cs2');
    expect(r1).toHaveLength(0);
    expect(r2).toHaveLength(1);
  });
});
