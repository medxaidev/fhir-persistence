/**
 * Terminology Code Repo Tests — 12 tests on SQLite in-memory.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';
import { TerminologyCodeRepo } from '../../terminology/terminology-code-repo.js';
import type { TerminologyCode } from '../../terminology/terminology-code-repo.js';

describe('TerminologyCodeRepo (SQLite integration)', () => {
  let adapter: BetterSqlite3Adapter;
  let repo: TerminologyCodeRepo;

  beforeEach(() => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    repo = new TerminologyCodeRepo(adapter);
  });

  afterEach(async () => {
    await adapter.close();
  });

  // =========================================================================
  // 1. ensureTable creates terminology_codes table
  // =========================================================================
  it('ensureTable creates the terminology_codes table', async () => {
    await repo.ensureTable();
    const rows = await adapter.query(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'terminology_codes'",
    );
    expect(rows).toHaveLength(1);
  });

  // =========================================================================
  // 2. batchInsert inserts multiple codes
  // =========================================================================
  it('batchInsert inserts multiple codes', async () => {
    const codes: TerminologyCode[] = [
      { system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' },
      { system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' },
      { system: 'http://snomed.info/sct', code: '271649006', display: 'Systolic BP' },
    ];
    const inserted = await repo.batchInsert(codes);
    expect(inserted).toBe(3);

    const count = await repo.getCodeCount();
    expect(count).toBe(3);
  });

  // =========================================================================
  // 3. batchInsert ignores duplicates (INSERT OR IGNORE)
  // =========================================================================
  it('batchInsert ignores duplicates silently', async () => {
    const codes: TerminologyCode[] = [
      { system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' },
    ];
    await repo.batchInsert(codes);
    const inserted2 = await repo.batchInsert(codes); // duplicate
    expect(inserted2).toBe(0);

    const count = await repo.getCodeCount();
    expect(count).toBe(1);
  });

  // =========================================================================
  // 4. lookup returns display for existing code
  // =========================================================================
  it('lookup returns display for existing (system, code)', async () => {
    await repo.batchInsert([
      { system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' },
    ]);
    const display = await repo.lookup('http://loinc.org', '8480-6');
    expect(display).toBe('Systolic blood pressure');
  });

  // =========================================================================
  // 5. lookup returns undefined for missing code
  // =========================================================================
  it('lookup returns undefined for missing code', async () => {
    await repo.ensureTable();
    const display = await repo.lookup('http://loinc.org', 'nonexistent');
    expect(display).toBeUndefined();
  });

  // =========================================================================
  // 6. lookupByCode returns all matches (no system filter)
  // =========================================================================
  it('lookupByCode returns all matches across systems', async () => {
    await repo.batchInsert([
      { system: 'http://loinc.org', code: 'BP', display: 'Blood Pressure (LOINC)' },
      { system: 'http://snomed.info/sct', code: 'BP', display: 'Blood Pressure (SNOMED)' },
    ]);
    const results = await repo.lookupByCode('BP');
    expect(results).toHaveLength(2);
    expect(results.map(r => r.system).sort()).toEqual([
      'http://loinc.org',
      'http://snomed.info/sct',
    ]);
  });

  // =========================================================================
  // 7. lookupByCode returns empty for missing code
  // =========================================================================
  it('lookupByCode returns empty array for missing code', async () => {
    await repo.ensureTable();
    const results = await repo.lookupByCode('nonexistent');
    expect(results).toHaveLength(0);
  });

  // =========================================================================
  // 8. batchInsert with empty array is no-op
  // =========================================================================
  it('batchInsert with empty array returns 0', async () => {
    const inserted = await repo.batchInsert([]);
    expect(inserted).toBe(0);
  });

  // =========================================================================
  // 9. lookup with system + code exact match
  // =========================================================================
  it('lookup distinguishes same code across different systems', async () => {
    await repo.batchInsert([
      { system: 'http://system-a.org', code: '123', display: 'Display A' },
      { system: 'http://system-b.org', code: '123', display: 'Display B' },
    ]);
    const displayA = await repo.lookup('http://system-a.org', '123');
    const displayB = await repo.lookup('http://system-b.org', '123');
    expect(displayA).toBe('Display A');
    expect(displayB).toBe('Display B');
  });

  // =========================================================================
  // 10. getCodeCount returns total code count
  // =========================================================================
  it('getCodeCount returns correct total', async () => {
    expect(await repo.getCodeCount()).toBe(0);
    await repo.batchInsert([
      { system: 's1', code: 'c1', display: 'd1' },
      { system: 's1', code: 'c2', display: 'd2' },
      { system: 's2', code: 'c1', display: 'd3' },
    ]);
    expect(await repo.getCodeCount()).toBe(3);
  });

  // =========================================================================
  // 11. batchInsert handles large batch (100+ codes)
  // =========================================================================
  it('batchInsert handles large batch (150 codes)', async () => {
    const codes: TerminologyCode[] = [];
    for (let i = 0; i < 150; i++) {
      codes.push({ system: 'http://test.org', code: `code-${i}`, display: `Display ${i}` });
    }
    const inserted = await repo.batchInsert(codes);
    expect(inserted).toBe(150);
    expect(await repo.getCodeCount()).toBe(150);
  });

  // =========================================================================
  // 12. clear removes all codes
  // =========================================================================
  it('clear removes all codes', async () => {
    await repo.batchInsert([
      { system: 's1', code: 'c1', display: 'd1' },
      { system: 's2', code: 'c2', display: 'd2' },
    ]);
    expect(await repo.getCodeCount()).toBe(2);

    await repo.clear();
    expect(await repo.getCodeCount()).toBe(0);
  });
});
