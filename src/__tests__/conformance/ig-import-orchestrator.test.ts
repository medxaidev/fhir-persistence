/**
 * IGImportOrchestrator Tests — SQLite in-memory.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';
import { IGImportOrchestrator } from '../../conformance/ig-import-orchestrator.js';

describe('IGImportOrchestrator (SQLite integration)', () => {
  let adapter: BetterSqlite3Adapter;

  beforeEach(() => {
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
  });

  afterEach(async () => {
    await adapter.close();
  });

  it('ensureAllTables is idempotent', async () => {
    const orch = new IGImportOrchestrator(adapter);
    await orch.ensureAllTables();
    await orch.ensureAllTables();
  });

  it('importIG processes a basic bundle', async () => {
    const orch = new IGImportOrchestrator(adapter);
    const bundle = {
      resourceType: 'Bundle' as const,
      entry: [
        { resource: { resourceType: 'StructureDefinition', id: 'sd-1', url: 'http://ex/sd/1', type: 'Patient', kind: 'resource' } },
        { resource: { resourceType: 'ValueSet', id: 'vs-1', url: 'http://ex/vs/1', name: 'TestVS' } },
        { resource: { resourceType: 'CodeSystem', id: 'cs-1', url: 'http://ex/cs/1' } },
        { resource: { resourceType: 'SearchParameter', id: 'sp-1', code: 'test', type: 'string', base: ['Patient'] } },
      ],
    };
    const result = await orch.importIG('test-ig', bundle);
    expect(result.igId).toBe('test-ig');
    expect(result.resourceCount).toBe(4);
    expect(result.sdIndexCount).toBe(1);
    expect(result.spIndexCount).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('importIG indexes elements when extractElementIndex is provided', async () => {
    const orch = new IGImportOrchestrator(adapter, 'sqlite', {
      extractElementIndex: (sd) => [
        { id: `${sd.id}:root`, path: `${sd.type}`, min: 0, max: '*' },
        { id: `${sd.id}:name`, path: `${sd.type}.name`, min: 0, max: '*', typeCodes: ['HumanName'] },
      ],
    });
    const bundle = {
      resourceType: 'Bundle' as const,
      entry: [
        { resource: { resourceType: 'StructureDefinition', id: 'sd-1', type: 'Patient', kind: 'resource' } },
      ],
    };
    const result = await orch.importIG('test-ig', bundle);
    expect(result.elementIndexCount).toBe(2);

    const elements = await orch.repos.elementIndex.getByStructureId('sd-1');
    expect(elements).toHaveLength(2);
  });

  it('importIG flattens concepts when flattenConcepts is provided', async () => {
    const orch = new IGImportOrchestrator(adapter, 'sqlite', {
      flattenConcepts: (cs) => [
        { id: `${cs.url}:A`, codeSystemUrl: cs.url as string, code: 'A', display: 'Alpha', level: 0 },
        { id: `${cs.url}:B`, codeSystemUrl: cs.url as string, code: 'B', display: 'Beta', parentCode: 'A', level: 1 },
      ],
    });
    const bundle = {
      resourceType: 'Bundle' as const,
      entry: [
        { resource: { resourceType: 'CodeSystem', id: 'cs-1', url: 'http://ex/cs/1' } },
      ],
    };
    const result = await orch.importIG('test-ig', bundle);
    expect(result.conceptCount).toBe(2);
  });

  it('repos accessor provides direct access to all repos', async () => {
    const orch = new IGImportOrchestrator(adapter);
    await orch.ensureAllTables();
    expect(orch.repos.resourceMap).toBeDefined();
    expect(orch.repos.sdIndex).toBeDefined();
    expect(orch.repos.elementIndex).toBeDefined();
    expect(orch.repos.expansionCache).toBeDefined();
    expect(orch.repos.conceptHierarchy).toBeDefined();
    expect(orch.repos.searchParamIndex).toBeDefined();
  });

  it('importIG skips entries without resourceType or id', async () => {
    const orch = new IGImportOrchestrator(adapter);
    const bundle = {
      resourceType: 'Bundle' as const,
      entry: [
        { resource: { resourceType: 'Patient', id: 'p-1' } },
        { resource: { resourceType: 'Observation' } },  // missing id
        { resource: {} },  // missing resourceType
        {},  // missing resource
      ],
    };
    const result = await orch.importIG('test-ig', bundle);
    expect(result.resourceCount).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('importIG with empty bundle', async () => {
    const orch = new IGImportOrchestrator(adapter);
    const result = await orch.importIG('empty-ig', { resourceType: 'Bundle' });
    expect(result.resourceCount).toBe(0);
    expect(result.errors).toHaveLength(0);
  });
});
