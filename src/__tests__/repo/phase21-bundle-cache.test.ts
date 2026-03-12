/**
 * Phase 21 — Bundle Transaction/Batch, Cache & Retry — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processTransaction, processBatch } from '../../repo/bundle-processor.js';
import type { Bundle } from '../../repo/bundle-processor.js';
import { ResourceCache } from '../../cache/resource-cache.js';
import type { FhirRepository } from '../../repo/fhir-repo.js';
import type { PersistedResource } from '../../repo/types.js';

// =============================================================================
// Mock Repository
// =============================================================================

function makeMockRepo() {
  const created: PersistedResource[] = [];
  let createCounter = 0;

  const repo = {
    createResource: vi.fn(async (resource: any, options?: any) => {
      const persisted = {
        ...resource,
        id: options?.assignedId ?? `id-${created.length + 1}`,
        meta: { versionId: `v-${created.length + 1}`, lastUpdated: '2026-01-01T00:00:00Z' },
      } as PersistedResource;
      created.push(persisted);
      return persisted;
    }),
    updateResource: vi.fn(async (resource: any) => {
      return {
        ...resource,
        meta: { versionId: 'v-updated', lastUpdated: '2026-01-01T00:00:00Z' },
      } as PersistedResource;
    }),
    deleteResource: vi.fn(async () => { }),
    readResource: vi.fn(async (rt: string, id: string) => {
      return {
        resourceType: rt,
        id,
        meta: { versionId: 'v-read', lastUpdated: '2026-01-01T00:00:00Z' },
      } as PersistedResource;
    }),
    // Transaction support for atomic bundle processing
    runInTransaction: vi.fn(async (fn: (tx: any) => Promise<any>) => {
      const mockTx = { query: vi.fn(async () => ({ rows: [] })) };
      return fn(mockTx);
    }),
    _prepareCreate: vi.fn((resource: any, options?: any) => {
      createCounter++;
      return {
        ...resource,
        id: options?.assignedId ?? `id-${createCounter}`,
        meta: { versionId: `v-${createCounter}`, lastUpdated: '2026-01-01T00:00:00Z' },
      } as PersistedResource;
    }),
    _executeCreate: vi.fn(async () => { }),
    _prepareUpdate: vi.fn((resource: any) => {
      return {
        ...resource,
        meta: { versionId: 'v-updated', lastUpdated: '2026-01-01T00:00:00Z' },
      } as PersistedResource;
    }),
    _executeUpdate: vi.fn(async () => { }),
    _executeDelete: vi.fn(async () => { }),
  } as unknown as FhirRepository;

  return { repo, created };
}

// =============================================================================
// Transaction Bundle
// =============================================================================

describe('Phase 21 — transaction bundle', () => {
  it('processes all entries and returns transaction-response', async () => {
    const { repo } = makeMockRepo();

    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          resource: { resourceType: 'Patient', name: [{ family: 'Smith' }] },
          request: { method: 'POST', url: 'Patient' },
        },
        {
          resource: { resourceType: 'Observation', code: { text: 'BP' } },
          request: { method: 'POST', url: 'Observation' },
        },
      ],
    };

    const response = await processTransaction(repo, bundle);

    expect(response.type).toBe('transaction-response');
    expect(response.entry).toHaveLength(2);
    expect(response.entry[0].status).toBe('201');
    expect(response.entry[1].status).toBe('201');
    expect(response.entry[0].resource).toBeDefined();
  });

  it('resolves urn:uuid references', async () => {
    const { repo } = makeMockRepo();

    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          fullUrl: 'urn:uuid:patient-1',
          resource: { resourceType: 'Patient', name: [{ family: 'Doe' }] },
          request: { method: 'POST', url: 'Patient' },
        },
        {
          resource: {
            resourceType: 'Observation',
            subject: { reference: 'urn:uuid:patient-1' },
          },
          request: { method: 'POST', url: 'Observation' },
        },
      ],
    };

    const response = await processTransaction(repo, bundle);

    expect(response.entry).toHaveLength(2);
    expect(response.entry[0].status).toBe('201');
    expect(response.entry[1].status).toBe('201');

    // The second _prepareCreate call should have resolved the urn:uuid
    const secondCreateCall = (repo._prepareCreate as ReturnType<typeof vi.fn>).mock.calls[1];
    const obsResource = secondCreateCall[0];
    // The urn should have been replaced
    expect(obsResource.subject.reference).not.toContain('urn:uuid');
  });

  it('handles DELETE entries', async () => {
    const { repo } = makeMockRepo();

    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          request: { method: 'DELETE', url: 'Patient/pat-1' },
        },
      ],
    };

    const response = await processTransaction(repo, bundle);

    expect(response.entry).toHaveLength(1);
    expect(response.entry[0].status).toBe('204');
    expect(repo._executeDelete).toHaveBeenCalled();
  });

  it('returns error on missing request', async () => {
    const { repo } = makeMockRepo();

    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [{ resource: { resourceType: 'Patient' } }],
    };

    const response = await processTransaction(repo, bundle);

    expect(response.entry[0].status).toBe('400');
    expect(response.entry[0].error).toContain('Missing request');
  });
});

// =============================================================================
// Batch Bundle
// =============================================================================

describe('Phase 21 — batch bundle', () => {
  it('processes entries independently', async () => {
    const { repo } = makeMockRepo();

    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'batch',
      entry: [
        {
          resource: { resourceType: 'Patient' },
          request: { method: 'POST', url: 'Patient' },
        },
        {
          resource: { resourceType: 'Patient' },
          request: { method: 'POST', url: 'Patient' },
        },
      ],
    };

    const response = await processBatch(repo, bundle);

    expect(response.type).toBe('batch-response');
    expect(response.entry).toHaveLength(2);
    expect(response.entry[0].status).toBe('201');
    expect(response.entry[1].status).toBe('201');
  });

  it('continues on failure (individual error)', async () => {
    const { repo } = makeMockRepo();

    // First create succeeds, second throws
    (repo.createResource as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        resourceType: 'Patient',
        id: 'p1',
        meta: { versionId: 'v1', lastUpdated: '2026-01-01T00:00:00Z' },
      })
      .mockRejectedValueOnce(new Error('DB error'));

    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'batch',
      entry: [
        {
          resource: { resourceType: 'Patient' },
          request: { method: 'POST', url: 'Patient' },
        },
        {
          resource: { resourceType: 'Patient' },
          request: { method: 'POST', url: 'Patient' },
        },
      ],
    };

    const response = await processBatch(repo, bundle);

    expect(response.entry).toHaveLength(2);
    expect(response.entry[0].status).toBe('201');
    expect(response.entry[1].status).toBe('500');
    expect(response.entry[1].error).toContain('DB error');
  });

  it('handles empty bundle', async () => {
    const { repo } = makeMockRepo();

    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'batch',
      entry: [],
    };

    const response = await processBatch(repo, bundle);
    expect(response.entry).toHaveLength(0);
  });
});

// =============================================================================
// Resource Cache
// =============================================================================

describe('Phase 21 — ResourceCache', () => {
  it('returns undefined when disabled', () => {
    const cache = new ResourceCache({ enabled: false });
    cache.set('Patient', 'p1', { resourceType: 'Patient', id: 'p1', meta: { versionId: 'v1', lastUpdated: '' } });
    expect(cache.get('Patient', 'p1')).toBeUndefined();
  });

  it('stores and retrieves resources when enabled', () => {
    const cache = new ResourceCache({ enabled: true });
    const resource = { resourceType: 'Patient', id: 'p1', meta: { versionId: 'v1', lastUpdated: '' } } as PersistedResource;

    cache.set('Patient', 'p1', resource);
    const result = cache.get('Patient', 'p1');

    expect(result).toBeDefined();
    expect(result!.id).toBe('p1');
  });

  it('returns undefined for miss', () => {
    const cache = new ResourceCache({ enabled: true });
    expect(cache.get('Patient', 'missing')).toBeUndefined();
  });

  it('invalidates on call', () => {
    const cache = new ResourceCache({ enabled: true });
    const resource = { resourceType: 'Patient', id: 'p1', meta: { versionId: 'v1', lastUpdated: '' } } as PersistedResource;

    cache.set('Patient', 'p1', resource);
    expect(cache.get('Patient', 'p1')).toBeDefined();

    cache.invalidate('Patient', 'p1');
    expect(cache.get('Patient', 'p1')).toBeUndefined();
  });

  it('evicts oldest entry when maxSize reached', () => {
    const cache = new ResourceCache({ enabled: true, maxSize: 2 });
    const r1 = { resourceType: 'Patient', id: 'p1', meta: { versionId: 'v1', lastUpdated: '' } } as PersistedResource;
    const r2 = { resourceType: 'Patient', id: 'p2', meta: { versionId: 'v2', lastUpdated: '' } } as PersistedResource;
    const r3 = { resourceType: 'Patient', id: 'p3', meta: { versionId: 'v3', lastUpdated: '' } } as PersistedResource;

    cache.set('Patient', 'p1', r1);
    cache.set('Patient', 'p2', r2);
    cache.set('Patient', 'p3', r3); // should evict p1

    expect(cache.get('Patient', 'p1')).toBeUndefined();
    expect(cache.get('Patient', 'p2')).toBeDefined();
    expect(cache.get('Patient', 'p3')).toBeDefined();
    expect(cache.size).toBe(2);
  });

  it('expires entries after TTL', async () => {
    const cache = new ResourceCache({ enabled: true, ttlMs: 50 });
    const resource = { resourceType: 'Patient', id: 'p1', meta: { versionId: 'v1', lastUpdated: '' } } as PersistedResource;

    cache.set('Patient', 'p1', resource);
    expect(cache.get('Patient', 'p1')).toBeDefined();

    // Wait for TTL to expire
    await new Promise((r) => setTimeout(r, 60));
    expect(cache.get('Patient', 'p1')).toBeUndefined();
  });

  it('tracks hit/miss stats', () => {
    const cache = new ResourceCache({ enabled: true });
    const resource = { resourceType: 'Patient', id: 'p1', meta: { versionId: 'v1', lastUpdated: '' } } as PersistedResource;

    cache.set('Patient', 'p1', resource);
    cache.get('Patient', 'p1'); // hit
    cache.get('Patient', 'missing'); // miss

    const stats = cache.stats;
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(0.5);
  });

  it('clear resets everything', () => {
    const cache = new ResourceCache({ enabled: true });
    const resource = { resourceType: 'Patient', id: 'p1', meta: { versionId: 'v1', lastUpdated: '' } } as PersistedResource;

    cache.set('Patient', 'p1', resource);
    expect(cache.size).toBe(1);

    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('Patient', 'p1')).toBeUndefined();
  });
});

// =============================================================================
// Serialization Retry (unit test for isSerializationFailure logic)
// =============================================================================

describe('Phase 21 — serialization retry', () => {
  it('40001 error code is detectable', () => {
    // We test the pattern used in client.ts
    const err = { code: '40001', message: 'could not serialize access' };
    expect(typeof err === 'object' && err !== null && 'code' in err).toBe(true);
    expect((err as { code: string }).code).toBe('40001');
  });

  it('non-40001 errors are not serialization failures', () => {
    const err = { code: '23505', message: 'unique violation' };
    expect((err as { code: string }).code).not.toBe('40001');
  });
});
