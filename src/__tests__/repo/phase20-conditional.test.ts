/**
 * Phase 20 — Conditional Operations, $everything, Multi-Sort — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FhirRepository } from '../../repo/fhir-repo.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import { PreconditionFailedError } from '../../repo/errors.js';
import type { DatabaseClient } from '../../db/client.js';

// =============================================================================
// Mock DB
// =============================================================================

function makeMockDb() {
  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [] }),
  };

  const db = {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    withTransaction: vi.fn(async (fn: (client: typeof mockClient) => Promise<unknown>) => {
      return fn(mockClient);
    }),
  } as unknown as DatabaseClient;

  return { db, mockClient };
}

function makeRegistry() {
  const registry = new SearchParameterRegistry();
  registry.indexImpl('Patient', {
    code: 'identifier',
    type: 'token',
    resourceTypes: ['Patient'],
    expression: 'Patient.identifier',
    strategy: 'token-column',
    columnName: 'identifier',
    columnType: 'UUID[]',
    array: true,
  });
  return registry;
}

// =============================================================================
// Conditional Create
// =============================================================================

describe('Phase 20 — conditionalCreate', () => {
  it('creates resource when no match found', async () => {
    const { db, mockClient } = makeMockDb();
    const registry = makeRegistry();
    const repo = new FhirRepository(db, registry);

    // Search returns 0 results
    (db.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [] });

    const result = await repo.conditionalCreate(
      { resourceType: 'Patient', name: [{ family: 'Smith' }] },
      { resourceType: 'Patient', params: [], include: [], revinclude: [], sort: [] },
    );

    expect(result.created).toBe(true);
    expect(result.resource.id).toBeDefined();
    expect(result.resource.meta.versionId).toBeDefined();
  });

  it('returns existing resource when match found', async () => {
    const { db, mockClient } = makeMockDb();
    const registry = makeRegistry();
    const repo = new FhirRepository(db, registry);

    const existingResource = {
      resourceType: 'Patient',
      id: 'existing-id',
      meta: { versionId: 'v1', lastUpdated: '2026-01-01T00:00:00Z' },
    };

    // Search returns 1 result (inside transaction via mockClient)
    mockClient.query.mockResolvedValueOnce({
      rows: [{ id: 'existing-id', content: JSON.stringify(existingResource), deleted: false }],
    });

    const result = await repo.conditionalCreate(
      { resourceType: 'Patient', name: [{ family: 'Smith' }] },
      { resourceType: 'Patient', params: [], include: [], revinclude: [], sort: [] },
    );

    expect(result.created).toBe(false);
    expect(result.resource.id).toBe('existing-id');
  });

  it('throws without registry', async () => {
    const { db } = makeMockDb();
    const repo = new FhirRepository(db);

    await expect(
      repo.conditionalCreate(
        { resourceType: 'Patient' },
        { resourceType: 'Patient', params: [], include: [], revinclude: [], sort: [] },
      ),
    ).rejects.toThrow('SearchParameterRegistry is required');
  });
});

// =============================================================================
// Conditional Update
// =============================================================================

describe('Phase 20 — conditionalUpdate', () => {
  it('creates when no match', async () => {
    const { db, mockClient } = makeMockDb();
    const registry = makeRegistry();
    const repo = new FhirRepository(db, registry);

    // Search returns 0
    (db.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [] });

    const result = await repo.conditionalUpdate(
      { resourceType: 'Patient', name: [{ family: 'Doe' }] },
      { resourceType: 'Patient', params: [], include: [], revinclude: [], sort: [] },
    );

    expect(result.created).toBe(true);
    expect(result.resource.id).toBeDefined();
  });

  it('updates when exactly 1 match', async () => {
    const { db, mockClient } = makeMockDb();
    const registry = makeRegistry();
    const repo = new FhirRepository(db, registry);

    const existing = {
      resourceType: 'Patient',
      id: 'pat-1',
      meta: { versionId: 'v1', lastUpdated: '2026-01-01T00:00:00Z' },
    };

    // Search returns 1 match (inside transaction via mockClient)
    mockClient.query
      .mockResolvedValueOnce({
        rows: [{ id: 'pat-1', content: JSON.stringify(existing), deleted: false }],
      })
      // FOR UPDATE lock inside _executeUpdate
      .mockResolvedValueOnce({
        rows: [{ content: JSON.stringify(existing), deleted: false }],
      });

    const result = await repo.conditionalUpdate(
      { resourceType: 'Patient', name: [{ family: 'Updated' }] },
      { resourceType: 'Patient', params: [], include: [], revinclude: [], sort: [] },
    );

    expect(result.created).toBe(false);
    expect(result.resource.id).toBe('pat-1');
  });

  it('throws PreconditionFailedError when 2+ matches', async () => {
    const { db, mockClient } = makeMockDb();
    const registry = makeRegistry();
    const repo = new FhirRepository(db, registry);

    const pat1 = { resourceType: 'Patient', id: 'p1', meta: { versionId: 'v1', lastUpdated: '2026-01-01T00:00:00Z' } };
    const pat2 = { resourceType: 'Patient', id: 'p2', meta: { versionId: 'v2', lastUpdated: '2026-01-01T00:00:00Z' } };

    // Search returns 2 matches (inside transaction via mockClient)
    mockClient.query.mockResolvedValueOnce({
      rows: [
        { id: 'p1', content: JSON.stringify(pat1), deleted: false },
        { id: 'p2', content: JSON.stringify(pat2), deleted: false },
      ],
    });

    await expect(
      repo.conditionalUpdate(
        { resourceType: 'Patient' },
        { resourceType: 'Patient', params: [], include: [], revinclude: [], sort: [] },
      ),
    ).rejects.toThrow(PreconditionFailedError);
  });
});

// =============================================================================
// Conditional Delete
// =============================================================================

describe('Phase 20 — conditionalDelete', () => {
  it('deletes matching resources', async () => {
    const { db, mockClient } = makeMockDb();
    const registry = makeRegistry();
    const repo = new FhirRepository(db, registry);

    const pat1 = { resourceType: 'Patient', id: 'p1', meta: { versionId: 'v1', lastUpdated: '2026-01-01T00:00:00Z' } };

    // Search returns 1 match (inside transaction via mockClient)
    mockClient.query
      .mockResolvedValueOnce({
        rows: [{ id: 'p1', content: JSON.stringify(pat1), deleted: false }],
      })
      // FOR UPDATE lock in _executeDelete
      .mockResolvedValueOnce({
        rows: [{ deleted: false }],
      });

    const count = await repo.conditionalDelete('Patient', {
      resourceType: 'Patient',
      params: [],
      include: [],
      revinclude: [],
      sort: [],
    });

    expect(count).toBe(1);
  });

  it('returns 0 when no matches', async () => {
    const { db } = makeMockDb();
    const registry = makeRegistry();
    const repo = new FhirRepository(db, registry);

    (db.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [] });

    const count = await repo.conditionalDelete('Patient', {
      resourceType: 'Patient',
      params: [],
      include: [],
      revinclude: [],
      sort: [],
    });

    expect(count).toBe(0);
  });
});

// =============================================================================
// $everything
// =============================================================================

describe('Phase 20 — everything', () => {
  it('returns focal resource plus compartment resources', async () => {
    const { db } = makeMockDb();
    const registry = makeRegistry();
    const repo = new FhirRepository(db, registry);

    const patient = {
      resourceType: 'Patient',
      id: 'pat-123',
      meta: { versionId: 'v1', lastUpdated: '2026-01-01T00:00:00Z' },
    };
    const obs = {
      resourceType: 'Observation',
      id: 'obs-1',
      meta: { versionId: 'v1', lastUpdated: '2026-01-01T00:00:00Z' },
      subject: { reference: 'Patient/pat-123' },
    };

    // readResource (focal)
    (db.query as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        rows: [{ content: JSON.stringify(patient), deleted: false }],
      })
      // compartment search for Observation
      .mockResolvedValueOnce({
        rows: [{ content: JSON.stringify(obs), deleted: false }],
      })
      // compartment search for Encounter (empty)
      .mockResolvedValueOnce({ rows: [] });

    const results = await repo.everything('Patient', 'pat-123', ['Observation', 'Encounter']);

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('pat-123');
    expect(results[1].id).toBe('obs-1');
  });

  it('throws ResourceNotFoundError for missing patient', async () => {
    const { db } = makeMockDb();
    const repo = new FhirRepository(db);

    (db.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [] });

    await expect(repo.everything('Patient', 'missing', [])).rejects.toThrow('not found');
  });
});

// =============================================================================
// Multi-Sort
// =============================================================================

describe('Phase 20 — multi-sort SQL', () => {
  // This tests the SQL builder directly
  it('generates composite ORDER BY for multiple sort fields', async () => {
    const { buildSearchSQL } = await import('../../search/search-sql-builder.js');
    const registry = makeRegistry();
    registry.indexImpl('Patient', {
      code: 'birthdate',
      type: 'date',
      resourceTypes: ['Patient'],
      expression: 'Patient.birthDate',
      strategy: 'column',
      columnName: 'birthdate',
      columnType: 'DATE',
      array: false,
    });
    registry.indexImpl('Patient', {
      code: 'name',
      type: 'string',
      resourceTypes: ['Patient'],
      expression: 'Patient.name',
      strategy: 'lookup-table',
      columnName: 'name',
      columnType: 'TEXT',
      array: false,
    });

    const result = buildSearchSQL({
      resourceType: 'Patient',
      params: [],
      include: [],
      revinclude: [],
      sort: [
        { code: 'name', descending: false },
        { code: 'birthdate', descending: true },
      ],
    }, registry);

    expect(result.sql).toContain('ORDER BY "__nameSort" ASC, "birthdate" DESC');
  });

  it('sorts by _lastUpdated DESC by default', async () => {
    const { buildSearchSQL } = await import('../../search/search-sql-builder.js');
    const registry = makeRegistry();

    const result = buildSearchSQL({
      resourceType: 'Patient',
      params: [],
      include: [],
      revinclude: [],
      sort: [],
    }, registry);

    expect(result.sql).toContain('ORDER BY "lastUpdated" DESC');
  });
});
