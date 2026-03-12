/**
 * Search Executor — Unit Tests
 *
 * Tests executeSearch() and mapRowsToResources() with mock DatabaseClient.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSearch, mapRowsToResources } from '../../search/search-executor.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import type { SearchRequest } from '../../search/types.js';
import type { DatabaseClient } from '../../db/client.js';

// =============================================================================
// Mock DatabaseClient
// =============================================================================

function createMockDb(queryResults?: { rows: unknown[] }[]): DatabaseClient {
  let callIndex = 0;
  const results = queryResults ?? [{ rows: [] }];
  return {
    query: vi.fn().mockImplementation(() => {
      const result = results[callIndex] ?? { rows: [] };
      callIndex++;
      return Promise.resolve(result);
    }),
  } as unknown as DatabaseClient;
}

// =============================================================================
// Helper: create a minimal SearchRequest
// =============================================================================

function makeRequest(overrides?: Partial<SearchRequest>): SearchRequest {
  return {
    resourceType: 'Patient',
    params: [],
    ...overrides,
  };
}

// =============================================================================
// Helper: create a resource JSON content string
// =============================================================================

function makeContent(id: string, resourceType = 'Patient'): string {
  return JSON.stringify({
    resourceType,
    id,
    meta: { versionId: 'v1', lastUpdated: '2026-01-01T00:00:00.000Z' },
  });
}

function makeRow(id: string, opts?: { deleted?: boolean; content?: string }) {
  return {
    id,
    content: opts?.content ?? makeContent(id),
    deleted: opts?.deleted ?? false,
  };
}

// =============================================================================
// mapRowsToResources
// =============================================================================

describe('mapRowsToResources', () => {
  it('maps rows with valid content to PersistedResource[]', () => {
    const rows = [makeRow('p1'), makeRow('p2')];
    const resources = mapRowsToResources(rows);
    expect(resources).toHaveLength(2);
    expect(resources[0].id).toBe('p1');
    expect(resources[1].id).toBe('p2');
  });

  it('returns empty array for no rows', () => {
    expect(mapRowsToResources([])).toEqual([]);
  });

  it('filters out deleted rows', () => {
    const rows = [makeRow('p1'), makeRow('p2', { deleted: true })];
    const resources = mapRowsToResources(rows);
    expect(resources).toHaveLength(1);
    expect(resources[0].id).toBe('p1');
  });

  it('filters out rows with empty content', () => {
    const rows = [makeRow('p1'), makeRow('p2', { content: '' })];
    const resources = mapRowsToResources(rows);
    expect(resources).toHaveLength(1);
  });

  it('skips rows with invalid JSON content', () => {
    const rows = [makeRow('p1'), makeRow('p2', { content: '{invalid' })];
    const resources = mapRowsToResources(rows);
    expect(resources).toHaveLength(1);
    expect(resources[0].id).toBe('p1');
  });

  it('preserves resource structure', () => {
    const content = JSON.stringify({
      resourceType: 'Patient',
      id: 'p1',
      meta: { versionId: 'v1', lastUpdated: '2026-01-01T00:00:00.000Z' },
      name: [{ family: 'Smith' }],
    });
    const rows = [makeRow('p1', { content })];
    const resources = mapRowsToResources(rows);
    expect((resources[0] as any).name).toEqual([{ family: 'Smith' }]);
  });
});

// =============================================================================
// executeSearch — basic
// =============================================================================

describe('executeSearch — basic', () => {
  const registry = new SearchParameterRegistry();

  it('returns empty resources for no matching rows', async () => {
    const db = createMockDb([{ rows: [] }]);
    const result = await executeSearch(db, makeRequest(), registry);
    expect(result.resources).toEqual([]);
    expect(result.total).toBeUndefined();
  });

  it('returns resources from matching rows', async () => {
    const db = createMockDb([{ rows: [makeRow('p1'), makeRow('p2')] }]);
    const result = await executeSearch(db, makeRequest(), registry);
    expect(result.resources).toHaveLength(2);
    expect(result.resources[0].id).toBe('p1');
    expect(result.resources[1].id).toBe('p2');
  });

  it('calls db.query with search SQL', async () => {
    const db = createMockDb([{ rows: [] }]);
    await executeSearch(db, makeRequest(), registry);
    expect(db.query).toHaveBeenCalledTimes(1);
    const [sql] = (db.query as any).mock.calls[0];
    expect(sql).toContain('SELECT');
    expect(sql).toContain('"Patient"');
  });

  it('filters deleted rows from results', async () => {
    const db = createMockDb([
      { rows: [makeRow('p1'), makeRow('p2', { deleted: true })] },
    ]);
    const result = await executeSearch(db, makeRequest(), registry);
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].id).toBe('p1');
  });
});

// =============================================================================
// executeSearch — total count
// =============================================================================

describe('executeSearch — total', () => {
  const registry = new SearchParameterRegistry();

  it('does not execute count query when total is undefined', async () => {
    const db = createMockDb([{ rows: [] }]);
    const result = await executeSearch(db, makeRequest(), registry);
    expect(result.total).toBeUndefined();
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('does not execute count query when total is none', async () => {
    const db = createMockDb([{ rows: [] }]);
    const result = await executeSearch(db, makeRequest(), registry, { total: 'none' });
    expect(result.total).toBeUndefined();
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('executes count query when total is accurate', async () => {
    const db = createMockDb([
      { rows: [makeRow('p1')] },
      { rows: [{ count: '42' }] },
    ]);
    const result = await executeSearch(db, makeRequest(), registry, { total: 'accurate' });
    expect(result.total).toBe(42);
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  it('returns total 0 when count query returns no rows', async () => {
    const db = createMockDb([
      { rows: [] },
      { rows: [] },
    ]);
    const result = await executeSearch(db, makeRequest(), registry, { total: 'accurate' });
    expect(result.total).toBe(0);
  });

  it('count query SQL contains COUNT', async () => {
    const db = createMockDb([
      { rows: [] },
      { rows: [{ count: '0' }] },
    ]);
    await executeSearch(db, makeRequest(), registry, { total: 'accurate' });
    const [countSql] = (db.query as any).mock.calls[1];
    expect(countSql).toContain('COUNT');
  });
});

// =============================================================================
// executeSearch — with search params
// =============================================================================

describe('executeSearch — with params', () => {
  const registry = new SearchParameterRegistry();
  registry.indexImpl('Patient', {
    code: 'gender',
    type: 'token',
    resourceTypes: ['Patient'],
    expression: '',
    strategy: 'token-column',
    columnName: 'gender',
    columnType: 'UUID[]',
    array: true,
  });

  it('passes search params to SQL builder', async () => {
    const db = createMockDb([{ rows: [] }]);
    const request = makeRequest({
      params: [{ code: 'gender', values: ['male'] }],
    });
    await executeSearch(db, request, registry);
    const [sql, values] = (db.query as any).mock.calls[0];
    expect(sql).toContain('"__genderText"');
    expect(values).toContain('male');
  });

  it('handles _count in request', async () => {
    const db = createMockDb([{ rows: [] }]);
    const request = makeRequest({ count: 5 });
    await executeSearch(db, request, registry);
    const [sql] = (db.query as any).mock.calls[0];
    expect(sql).toContain('LIMIT');
  });

  it('propagates database errors', async () => {
    const db = {
      query: vi.fn().mockRejectedValue(new Error('connection refused')),
    } as unknown as DatabaseClient;
    await expect(
      executeSearch(db, makeRequest(), registry),
    ).rejects.toThrow('connection refused');
  });
});
