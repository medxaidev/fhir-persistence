/**
 * FhirRepository — Unit Tests (Mock DB)
 *
 * Tests the FhirRepository class in isolation using a mock DatabaseClient.
 * No real PostgreSQL connection required.
 *
 * Coverage:
 * - UUID generation for id and versionId (A-01 ~ A-05)
 * - Correct DB call patterns: UPSERT + History INSERT (A-06 ~ A-07)
 * - Error propagation (A-08)
 * - Update validation (A-09 ~ A-11)
 * - Delete row semantics: deleted=true, content='', __version=-1 (A-12 ~ A-14)
 * - readVersion with empty content → ResourceGoneError (A-15)
 *
 * Corresponds to Medplum: packages/server/src/fhir/repo.test.ts (core CRUD)
 * and transaction.test.ts (ifMatch behavior)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';

import { FhirRepository } from '../../repo/fhir-repo.js';
import {
  ResourceNotFoundError,
  ResourceGoneError,
  ResourceVersionConflictError,
} from '../../repo/errors.js';
import type { FhirResource, PersistedResource } from '../../repo/types.js';
import { DELETED_SCHEMA_VERSION } from '../../repo/types.js';

// =============================================================================
// Mock DatabaseClient
// =============================================================================

/**
 * Creates a mock DatabaseClient that simulates the pg.Pool interface.
 * `withTransaction` immediately invokes the callback with the mock client.
 */
function makeMockDb() {
  const mockClient = {
    query: vi.fn(),
  };

  const mockDb = {
    query: vi.fn(),
    withTransaction: vi.fn(async (callback: (client: typeof mockClient) => Promise<void>) => {
      await callback(mockClient);
    }),
    ping: vi.fn().mockResolvedValue(true),
    close: vi.fn().mockResolvedValue(undefined),
    isClosed: false,
  };

  return { mockDb, mockClient };
}

// =============================================================================
// Helpers
// =============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ISO_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function makePatient(overrides?: Partial<FhirResource>): FhirResource {
  return {
    resourceType: 'Patient',
    name: [{ family: 'UnitTest', given: ['Mock'] }],
    birthDate: '1990-01-01',
    ...overrides,
  };
}

function makePersistedPatient(overrides?: Partial<PersistedResource>): PersistedResource {
  return {
    resourceType: 'Patient',
    id: randomUUID(),
    meta: {
      versionId: randomUUID(),
      lastUpdated: new Date().toISOString(),
    },
    name: [{ family: 'UnitTest', given: ['Mock'] }],
    birthDate: '1990-01-01',
    ...overrides,
  };
}

// =============================================================================
// A-01 ~ A-05: createResource — Return value and UUID generation
// =============================================================================

describe('createResource — return value (A-01 ~ A-05)', () => {
  let mockDb: ReturnType<typeof makeMockDb>['mockDb'];
  let mockClient: ReturnType<typeof makeMockDb>['mockClient'];
  let repo: FhirRepository;

  beforeEach(() => {
    const mocks = makeMockDb();
    mockDb = mocks.mockDb;
    mockClient = mocks.mockClient;
    mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
    repo = new FhirRepository(mockDb as any);
  });

  it('A-01: returns resource with id, versionId, lastUpdated populated', async () => {
    const result = await repo.createResource(makePatient());

    expect(result.id).toBeTruthy();
    expect(result.meta.versionId).toBeTruthy();
    expect(result.meta.lastUpdated).toBeTruthy();
    expect(result.resourceType).toBe('Patient');
  });

  it('A-02: id is a valid UUID v4', async () => {
    const result = await repo.createResource(makePatient());
    expect(result.id).toMatch(UUID_REGEX);
  });

  it('A-03: versionId is a valid UUID v4', async () => {
    const result = await repo.createResource(makePatient());
    expect(result.meta.versionId).toMatch(UUID_REGEX);
  });

  it('A-04: lastUpdated is an ISO 8601 timestamp', async () => {
    const result = await repo.createResource(makePatient());
    expect(result.meta.lastUpdated).toMatch(ISO_REGEX);
  });

  it('A-05: assignedId is used as the resource id', async () => {
    const assignedId = randomUUID();
    const result = await repo.createResource(makePatient(), { assignedId });
    expect(result.id).toBe(assignedId);
  });

  it('A-05b: two creates produce different ids', async () => {
    const r1 = await repo.createResource(makePatient());
    const r2 = await repo.createResource(makePatient());
    expect(r1.id).not.toBe(r2.id);
  });

  it('A-05c: two creates produce different versionIds', async () => {
    const r1 = await repo.createResource(makePatient());
    const r2 = await repo.createResource(makePatient());
    expect(r1.meta.versionId).not.toBe(r2.meta.versionId);
  });
});

// =============================================================================
// A-06 ~ A-07: createResource — DB call pattern
// =============================================================================

describe('createResource — DB call pattern (A-06 ~ A-07)', () => {
  let mockDb: ReturnType<typeof makeMockDb>['mockDb'];
  let mockClient: ReturnType<typeof makeMockDb>['mockClient'];
  let repo: FhirRepository;

  beforeEach(() => {
    const mocks = makeMockDb();
    mockDb = mocks.mockDb;
    mockClient = mocks.mockClient;
    mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
    repo = new FhirRepository(mockDb as any);
  });

  it('A-06: calls DB exactly twice (UPSERT + History INSERT)', async () => {
    await repo.createResource(makePatient());
    expect(mockClient.query).toHaveBeenCalledTimes(2);
  });

  it('A-06b: first call is an UPSERT (ON CONFLICT)', async () => {
    await repo.createResource(makePatient());
    const firstCall = mockClient.query.mock.calls[0];
    expect(firstCall[0]).toContain('ON CONFLICT');
    expect(firstCall[0]).toContain('INSERT INTO "Patient"');
  });

  it('A-06c: second call is a plain INSERT into _History table', async () => {
    await repo.createResource(makePatient());
    const secondCall = mockClient.query.mock.calls[1];
    expect(secondCall[0]).toContain('INSERT INTO "Patient_History"');
    expect(secondCall[0]).not.toContain('ON CONFLICT');
  });

  it('A-07: both DB calls happen inside withTransaction', async () => {
    await repo.createResource(makePatient());
    expect(mockDb.withTransaction).toHaveBeenCalledTimes(1);
    // Both queries go through the transaction client, not the pool directly
    expect(mockDb.query).not.toHaveBeenCalled();
  });
});

// =============================================================================
// A-08: readResource — Error propagation
// =============================================================================

describe('readResource — error propagation (A-08)', () => {
  it('A-08: propagates DB errors upward', async () => {
    const { mockDb } = makeMockDb();
    mockDb.query.mockRejectedValue(new Error('DB connection lost'));
    const repo = new FhirRepository(mockDb as any);

    await expect(repo.readResource('Patient', randomUUID())).rejects.toThrow('DB connection lost');
  });

  it('A-08b: throws ResourceNotFoundError when no rows returned', async () => {
    const { mockDb } = makeMockDb();
    mockDb.query.mockResolvedValue({ rows: [], rowCount: 0 });
    const repo = new FhirRepository(mockDb as any);

    await expect(repo.readResource('Patient', randomUUID())).rejects.toThrow(ResourceNotFoundError);
  });

  it('A-08c: throws ResourceGoneError when deleted=true', async () => {
    const { mockDb } = makeMockDb();
    mockDb.query.mockResolvedValue({
      rows: [{ content: '', deleted: true }],
      rowCount: 1,
    });
    const repo = new FhirRepository(mockDb as any);

    await expect(repo.readResource('Patient', randomUUID())).rejects.toThrow(ResourceGoneError);
  });
});

// =============================================================================
// A-09 ~ A-11: updateResource — Validation and optimistic locking
// =============================================================================

describe('updateResource — validation and optimistic locking (A-09 ~ A-11)', () => {
  it('A-09: throws Error when resource has no id', async () => {
    const { mockDb } = makeMockDb();
    const repo = new FhirRepository(mockDb as any);

    await expect(repo.updateResource(makePatient())).rejects.toThrow('must have an id');
  });

  it('A-10: succeeds when ifMatch matches current versionId', async () => {
    const { mockDb, mockClient } = makeMockDb();
    const existing = makePersistedPatient();

    // SELECT FOR UPDATE returns existing (inside transaction)
    mockClient.query
      .mockResolvedValueOnce({
        rows: [{ content: JSON.stringify(existing), deleted: false }],
        rowCount: 1,
      })
      .mockResolvedValue({ rows: [], rowCount: 0 });

    const repo = new FhirRepository(mockDb as any);
    const result = await repo.updateResource(
      { ...existing, birthDate: '2000-01-01' },
      { ifMatch: existing.meta.versionId },
    );

    expect(result.id).toBe(existing.id);
    expect(result.meta.versionId).not.toBe(existing.meta.versionId);
  });

  it('A-11: throws ResourceVersionConflictError when ifMatch does not match', async () => {
    const { mockDb, mockClient } = makeMockDb();
    const existing = makePersistedPatient();

    // SELECT FOR UPDATE returns existing (inside transaction)
    mockClient.query.mockResolvedValueOnce({
      rows: [{ content: JSON.stringify(existing), deleted: false }],
      rowCount: 1,
    });

    const repo = new FhirRepository(mockDb as any);

    await expect(
      repo.updateResource(
        { ...existing, birthDate: '2000-01-01' },
        { ifMatch: 'wrong-version-id' },
      ),
    ).rejects.toThrow(ResourceVersionConflictError);
  });

  it('A-11b: conflict error contains expected and actual versions', async () => {
    const { mockDb, mockClient } = makeMockDb();
    const existing = makePersistedPatient();

    // SELECT FOR UPDATE returns existing (inside transaction)
    mockClient.query.mockResolvedValueOnce({
      rows: [{ content: JSON.stringify(existing), deleted: false }],
      rowCount: 1,
    });

    const repo = new FhirRepository(mockDb as any);

    try {
      await repo.updateResource(
        { ...existing },
        { ifMatch: 'stale-version' },
      );
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ResourceVersionConflictError);
      const conflict = err as ResourceVersionConflictError;
      expect(conflict.expectedVersion).toBe('stale-version');
      expect(conflict.actualVersion).toBe(existing.meta.versionId);
    }
  });
});

// =============================================================================
// A-12 ~ A-14: deleteResource — Soft delete row semantics
// =============================================================================

describe('deleteResource — soft delete semantics (A-12 ~ A-14)', () => {
  let mockDb: ReturnType<typeof makeMockDb>['mockDb'];
  let mockClient: ReturnType<typeof makeMockDb>['mockClient'];
  let repo: FhirRepository;
  let existing: PersistedResource;

  beforeEach(() => {
    const mocks = makeMockDb();
    mockDb = mocks.mockDb;
    mockClient = mocks.mockClient;
    existing = makePersistedPatient();

    // SELECT FOR UPDATE returns existing (inside transaction), then remaining calls succeed
    mockClient.query
      .mockResolvedValueOnce({
        rows: [{ deleted: false }],
        rowCount: 1,
      })
      .mockResolvedValue({ rows: [], rowCount: 0 });

    repo = new FhirRepository(mockDb as any);
  });

  it('A-12: calls DB eight times inside transaction (SELECT FOR UPDATE + UPSERT + History INSERT + DELETE refs + 4x DELETE lookup)', async () => {
    await repo.deleteResource('Patient', existing.id);
    expect(mockClient.query).toHaveBeenCalledTimes(8);
  });

  it('A-12b: first call is SELECT FOR UPDATE', async () => {
    await repo.deleteResource('Patient', existing.id);
    const firstCall = mockClient.query.mock.calls[0];
    expect(firstCall[0]).toContain('FOR UPDATE');
  });

  it('A-13: UPSERT row has content = empty string', async () => {
    await repo.deleteResource('Patient', existing.id);
    const upsertCall = mockClient.query.mock.calls[1];
    // The values array should contain '' as the content value
    const values = upsertCall[1] as unknown[];
    expect(values).toContain('');
  });

  it('A-14: UPSERT row has __version = -1 (DELETED_SCHEMA_VERSION)', async () => {
    await repo.deleteResource('Patient', existing.id);
    const upsertCall = mockClient.query.mock.calls[1];
    const values = upsertCall[1] as unknown[];
    expect(values).toContain(DELETED_SCHEMA_VERSION);
  });

  it('A-14b: UPSERT row has deleted = true', async () => {
    await repo.deleteResource('Patient', existing.id);
    const upsertCall = mockClient.query.mock.calls[1];
    const values = upsertCall[1] as unknown[];
    expect(values).toContain(true);
  });

  it('A-14c: History INSERT has empty content', async () => {
    await repo.deleteResource('Patient', existing.id);
    const histCall = mockClient.query.mock.calls[2];
    const values = histCall[1] as unknown[];
    expect(values).toContain('');
  });
});

// =============================================================================
// A-15: readVersion — Empty content → ResourceGoneError
// =============================================================================

describe('readVersion — empty content handling (A-15)', () => {
  it('A-15: throws ResourceGoneError when version content is empty string', async () => {
    const { mockDb } = makeMockDb();
    mockDb.query.mockResolvedValue({
      rows: [{ content: '' }],
      rowCount: 1,
    });
    const repo = new FhirRepository(mockDb as any);

    await expect(
      repo.readVersion('Patient', randomUUID(), randomUUID()),
    ).rejects.toThrow(ResourceGoneError);
  });

  it('A-15b: throws ResourceNotFoundError when no version row found', async () => {
    const { mockDb } = makeMockDb();
    mockDb.query.mockResolvedValue({ rows: [], rowCount: 0 });
    const repo = new FhirRepository(mockDb as any);

    await expect(
      repo.readVersion('Patient', randomUUID(), randomUUID()),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('A-15c: returns parsed resource when content is valid JSON', async () => {
    const { mockDb } = makeMockDb();
    const persisted = makePersistedPatient();
    mockDb.query.mockResolvedValue({
      rows: [{ content: JSON.stringify(persisted) }],
      rowCount: 1,
    });
    const repo = new FhirRepository(mockDb as any);

    const result = await repo.readVersion('Patient', persisted.id, persisted.meta.versionId);
    expect(result.id).toBe(persisted.id);
    expect(result.meta.versionId).toBe(persisted.meta.versionId);
  });
});
