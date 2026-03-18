/**
 * ElementIndexRepo Tests — SQLite in-memory.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';
import { ElementIndexRepo } from '../../conformance/element-index-repo.js';

describe('ElementIndexRepo (SQLite integration)', () => {
  let adapter: BetterSqlite3Adapter;
  let repo: ElementIndexRepo;

  beforeEach(() => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    repo = new ElementIndexRepo(adapter);
  });

  afterEach(async () => {
    await adapter.close();
  });

  it('ensureTable is idempotent', async () => {
    await repo.ensureTable();
    await repo.ensureTable();
  });

  it('batchInsert writes elements and returns count', async () => {
    const count = await repo.batchInsert('patient-sd', [
      { id: 'patient-sd:Patient', path: 'Patient', min: 0, max: '*', typeCodes: ['Patient'], isSlice: false, isExtension: false, mustSupport: false },
      { id: 'patient-sd:Patient.name', path: 'Patient.name', min: 1, max: '*', typeCodes: ['HumanName'], isSlice: false, isExtension: false, mustSupport: true },
    ]);
    expect(count).toBe(2);
  });

  it('getByStructureId returns correct elements', async () => {
    await repo.batchInsert('sd-1', [
      { id: 'sd-1:el1', path: 'Patient.name', typeCodes: ['HumanName'] },
      { id: 'sd-1:el2', path: 'Patient.birthDate', typeCodes: ['date'] },
    ]);
    await repo.batchInsert('sd-2', [
      { id: 'sd-2:el1', path: 'Observation.code', typeCodes: ['CodeableConcept'] },
    ]);
    const results = await repo.getByStructureId('sd-1');
    expect(results).toHaveLength(2);
    expect(results[0].structureId).toBe('sd-1');
  });

  it('searchByPath returns cross-SD results', async () => {
    await repo.batchInsert('sd-1', [
      { id: 'sd-1:el1', path: 'Patient.name' },
    ]);
    await repo.batchInsert('sd-2', [
      { id: 'sd-2:el1', path: 'Practitioner.name' },
    ]);
    const results = await repo.searchByPath('%.name');
    expect(results).toHaveLength(2);
  });

  it('removeByStructureId clears only target SD', async () => {
    await repo.batchInsert('sd-1', [{ id: 'sd-1:el1', path: 'A.b' }]);
    await repo.batchInsert('sd-2', [{ id: 'sd-2:el1', path: 'C.d' }]);
    await repo.removeByStructureId('sd-1');
    const r1 = await repo.getByStructureId('sd-1');
    const r2 = await repo.getByStructureId('sd-2');
    expect(r1).toHaveLength(0);
    expect(r2).toHaveLength(1);
  });

  it('typeCodes round-trip as JSON', async () => {
    await repo.batchInsert('sd-1', [
      { id: 'sd-1:el1', path: 'Patient.value[x]', typeCodes: ['string', 'Quantity', 'boolean'] },
    ]);
    const results = await repo.getByStructureId('sd-1');
    expect(results[0].typeCodes).toEqual(['string', 'Quantity', 'boolean']);
  });

  it('boolean fields round-trip correctly', async () => {
    await repo.batchInsert('sd-1', [
      { id: 'sd-1:el1', path: 'Obs.category:VSCat', isSlice: true, sliceName: 'VSCat', isExtension: false, mustSupport: true },
    ]);
    const results = await repo.getByStructureId('sd-1');
    expect(results[0].isSlice).toBe(true);
    expect(results[0].sliceName).toBe('VSCat');
    expect(results[0].isExtension).toBe(false);
    expect(results[0].mustSupport).toBe(true);
  });
});
