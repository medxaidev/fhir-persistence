/**
 * SDIndexRepo Tests — SQLite in-memory.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';
import { SDIndexRepo } from '../../conformance/sd-index-repo.js';

describe('SDIndexRepo (SQLite integration)', () => {
  let adapter: BetterSqlite3Adapter;
  let repo: SDIndexRepo;

  beforeEach(() => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    repo = new SDIndexRepo(adapter);
  });

  afterEach(async () => {
    await adapter.close();
  });

  it('ensureTable is idempotent', async () => {
    await repo.ensureTable();
    await repo.ensureTable();
  });

  it('upsert + getById round-trip', async () => {
    await repo.upsert({
      id: 'us-core-patient',
      url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient',
      version: '6.0.0',
      type: 'Patient',
      kind: 'resource',
      baseDefinition: 'http://hl7.org/fhir/StructureDefinition/Patient',
      derivation: 'constraint',
    });
    const result = await repo.getById('us-core-patient');
    expect(result).toBeDefined();
    expect(result!.type).toBe('Patient');
    expect(result!.kind).toBe('resource');
    expect(result!.derivation).toBe('constraint');
  });

  it('batchUpsert returns count', async () => {
    const count = await repo.batchUpsert([
      { id: 'sd-1', type: 'Patient' },
      { id: 'sd-2', type: 'Observation' },
    ]);
    expect(count).toBe(2);
  });

  it('getByUrl returns matching entries', async () => {
    const url = 'http://example.com/sd/patient';
    await repo.upsert({ id: 'sd-1', url, version: '1.0' });
    await repo.upsert({ id: 'sd-2', url, version: '2.0' });
    const results = await repo.getByUrl(url);
    expect(results).toHaveLength(2);
  });

  it('getByType returns filtered results', async () => {
    await repo.upsert({ id: 'sd-1', type: 'Patient' });
    await repo.upsert({ id: 'sd-2', type: 'Observation' });
    await repo.upsert({ id: 'sd-3', type: 'Patient' });
    const results = await repo.getByType('Patient');
    expect(results).toHaveLength(2);
  });

  it('getByBaseDefinition returns derived profiles', async () => {
    const base = 'http://hl7.org/fhir/StructureDefinition/Patient';
    await repo.upsert({ id: 'sd-1', baseDefinition: base });
    await repo.upsert({ id: 'sd-2', baseDefinition: 'http://other' });
    const results = await repo.getByBaseDefinition(base);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('sd-1');
  });

  it('remove deletes entry', async () => {
    await repo.upsert({ id: 'sd-1', type: 'Patient' });
    await repo.remove('sd-1');
    const result = await repo.getById('sd-1');
    expect(result).toBeUndefined();
  });

  it('upsert overwrites existing entry', async () => {
    await repo.upsert({ id: 'sd-1', type: 'Patient', kind: 'resource' });
    await repo.upsert({ id: 'sd-1', type: 'Patient', kind: 'logical' });
    const result = await repo.getById('sd-1');
    expect(result!.kind).toBe('logical');
  });
});
