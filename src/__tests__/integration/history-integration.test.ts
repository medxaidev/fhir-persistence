/**
 * Integration tests for Phase 10: History Mechanism
 *
 * Tests instance history with options, type-level history,
 * history bundle construction, _since, _count, cursor pagination.
 *
 * Requires a running PostgreSQL instance (see .env).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { DatabaseClient } from '../../db/client.js';
import { loadDatabaseConfig } from '../../db/config.js';
import { FhirRepository } from '../../repo/fhir-repo.js';
import { buildHistoryBundle } from '../../repo/history-bundle.js';
import type { FhirResource, HistoryEntry } from '../../repo/types.js';

// =============================================================================
// Setup
// =============================================================================

let db: DatabaseClient;
let repo: FhirRepository;

beforeAll(async () => {
  const config = loadDatabaseConfig();
  db = new DatabaseClient(config);
  repo = new FhirRepository(db);
});

afterAll(async () => {
  await db.close();
});

// Cleanup helper
async function cleanup(resourceType: string, id: string): Promise<void> {
  await db.query(`DELETE FROM "${resourceType}_History" WHERE "id" = $1`, [id]);
  await db.query(`DELETE FROM "${resourceType}" WHERE "id" = $1`, [id]);
}

// =============================================================================
// Helpers
// =============================================================================

function makePatient(overrides: Record<string, unknown> = {}): FhirResource {
  return {
    resourceType: 'Patient',
    name: [{ family: 'HistoryTest', given: ['Phase10'] }],
    birthDate: '1990-01-15',
    ...overrides,
  } as FhirResource;
}

/** Small delay to ensure distinct lastUpdated timestamps */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Instance History with Options
// =============================================================================

describe('readHistory with HistoryOptions', () => {
  it('returns all entries including deletes', async () => {
    const p = makePatient();
    const v1 = await repo.createResource(p);
    await delay(10);
    const v2 = await repo.updateResource({ ...v1, birthDate: '1991-01-01' });
    await delay(10);
    await repo.deleteResource('Patient', v1.id);

    const history = await repo.readHistory('Patient', v1.id);
    expect(history).toHaveLength(3);
    expect(history[0].deleted).toBe(true);
    expect(history[1].versionId).toBe(v2.meta.versionId);
    expect(history[2].versionId).toBe(v1.meta.versionId);

    await cleanup('Patient', v1.id);
  });

  it('respects _count limit', async () => {
    const p = makePatient();
    const v1 = await repo.createResource(p);
    await delay(10);
    await repo.updateResource({ ...v1, birthDate: '1991-01-01' });
    await delay(10);
    await repo.updateResource({ ...v1, birthDate: '1992-01-01' });

    const history = await repo.readHistory('Patient', v1.id, { count: 2 });
    expect(history).toHaveLength(2);

    await cleanup('Patient', v1.id);
  });

  it('respects _since filter', async () => {
    const p = makePatient();
    const v1 = await repo.createResource(p);
    await delay(50);
    const sinceTime = new Date().toISOString();
    await delay(50);
    const v2 = await repo.updateResource({ ...v1, birthDate: '1991-01-01' });

    const history = await repo.readHistory('Patient', v1.id, { since: sinceTime });
    expect(history).toHaveLength(1);
    expect(history[0].versionId).toBe(v2.meta.versionId);

    await cleanup('Patient', v1.id);
  });

  it('respects cursor for pagination', async () => {
    const p = makePatient();
    const v1 = await repo.createResource(p);
    await delay(10);
    const v2 = await repo.updateResource({ ...v1, birthDate: '1991-01-01' });
    await delay(10);
    const v3 = await repo.updateResource({ ...v1, birthDate: '1992-01-01' });

    // Get first page
    const page1 = await repo.readHistory('Patient', v1.id, { count: 1 });
    expect(page1).toHaveLength(1);
    expect(page1[0].versionId).toBe(v3.meta.versionId);

    // Get second page using cursor
    const page2 = await repo.readHistory('Patient', v1.id, {
      count: 1,
      cursor: page1[0].lastUpdated,
    });
    expect(page2).toHaveLength(1);
    expect(page2[0].versionId).toBe(v2.meta.versionId);

    // Get third page
    const page3 = await repo.readHistory('Patient', v1.id, {
      count: 1,
      cursor: page2[0].lastUpdated,
    });
    expect(page3).toHaveLength(1);
    expect(page3[0].versionId).toBe(v1.meta.versionId);

    await cleanup('Patient', v1.id);
  });

  it('returns empty array for non-existent resource', async () => {
    const history = await repo.readHistory('Patient', randomUUID());
    expect(history).toEqual([]);
  });
});

// =============================================================================
// Type-Level History
// =============================================================================

describe('readTypeHistory', () => {
  it('returns history across multiple resources of the same type', async () => {
    const p1 = await repo.createResource(makePatient({ birthDate: '1980-01-01' }));
    await delay(10);
    const p2 = await repo.createResource(makePatient({ birthDate: '1985-01-01' }));

    const history = await repo.readTypeHistory('Patient');
    // Should contain at least these 2 entries
    const ids = history.map((e) => e.id);
    expect(ids).toContain(p1.id);
    expect(ids).toContain(p2.id);

    // Newest first
    const p2Idx = history.findIndex((e) => e.id === p2.id);
    const p1Idx = history.findIndex((e) => e.id === p1.id);
    expect(p2Idx).toBeLessThan(p1Idx);

    await cleanup('Patient', p1.id);
    await cleanup('Patient', p2.id);
  });

  it('respects _count limit', async () => {
    const p1 = await repo.createResource(makePatient());
    await delay(10);
    const p2 = await repo.createResource(makePatient());

    const history = await repo.readTypeHistory('Patient', { count: 1 });
    expect(history).toHaveLength(1);

    await cleanup('Patient', p1.id);
    await cleanup('Patient', p2.id);
  });

  it('respects _since filter', async () => {
    const p1 = await repo.createResource(makePatient());
    await delay(50);
    const sinceTime = new Date().toISOString();
    await delay(50);
    const p2 = await repo.createResource(makePatient());

    const history = await repo.readTypeHistory('Patient', { since: sinceTime });
    const ids = history.map((e) => e.id);
    expect(ids).toContain(p2.id);
    expect(ids).not.toContain(p1.id);

    await cleanup('Patient', p1.id);
    await cleanup('Patient', p2.id);
  });

  it('includes delete entries in type history', async () => {
    const p = await repo.createResource(makePatient());
    await delay(10);
    await repo.deleteResource('Patient', p.id);

    const history = await repo.readTypeHistory('Patient');
    const entries = history.filter((e) => e.id === p.id);
    expect(entries).toHaveLength(2);
    expect(entries[0].deleted).toBe(true);
    expect(entries[1].deleted).toBe(false);

    await cleanup('Patient', p.id);
  });
});

// =============================================================================
// History Bundle Construction (Integration)
// =============================================================================

describe('buildHistoryBundle integration', () => {
  it('builds a valid history bundle from instance history', async () => {
    const p = makePatient();
    const v1 = await repo.createResource(p);
    await delay(10);
    const v2 = await repo.updateResource({ ...v1, birthDate: '1991-01-01' });

    const entries = await repo.readHistory('Patient', v1.id);
    const bundle = buildHistoryBundle(entries, {
      baseUrl: 'http://localhost:3000/fhir/R4',
      selfUrl: `http://localhost:3000/fhir/R4/Patient/${v1.id}/_history`,
    });

    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('history');
    expect(bundle.total).toBe(2);
    expect(bundle.entry).toHaveLength(2);
    expect(bundle.link).toHaveLength(1);
    expect(bundle.link![0].relation).toBe('self');

    // Newest first
    expect(bundle.entry![0].response.etag).toBe(`W/"${v2.meta.versionId}"`);
    expect(bundle.entry![1].response.etag).toBe(`W/"${v1.meta.versionId}"`);

    // fullUrl
    expect(bundle.entry![0].fullUrl).toBe(`http://localhost:3000/fhir/R4/Patient/${v1.id}`);

    await cleanup('Patient', v1.id);
  });

  it('builds bundle with delete entries correctly', async () => {
    const p = await repo.createResource(makePatient());
    await delay(10);
    await repo.deleteResource('Patient', p.id);

    const entries = await repo.readHistory('Patient', p.id);
    const bundle = buildHistoryBundle(entries);

    expect(bundle.total).toBe(2);
    // Delete entry (newest)
    expect(bundle.entry![0].request.method).toBe('DELETE');
    expect(bundle.entry![0].resource).toBeUndefined();
    expect(bundle.entry![0].response.status).toBe('204');

    // Create entry
    expect(bundle.entry![1].resource).toBeDefined();
    expect(bundle.entry![1].response.status).toBe('200');

    await cleanup('Patient', p.id);
  });

  it('builds bundle from type history', async () => {
    const p1 = await repo.createResource(makePatient());
    await delay(10);
    const p2 = await repo.createResource(makePatient());

    const entries = await repo.readTypeHistory('Patient', { count: 2 });
    const bundle = buildHistoryBundle(entries, {
      selfUrl: 'http://localhost:3000/fhir/R4/Patient/_history?_count=2',
    });

    expect(bundle.type).toBe('history');
    expect(bundle.total).toBe(2);
    expect(bundle.entry).toHaveLength(2);

    await cleanup('Patient', p1.id);
    await cleanup('Patient', p2.id);
  });

  it('builds bundle with pagination links', async () => {
    const p = await repo.createResource(makePatient());
    await delay(10);
    await repo.updateResource({ ...p, birthDate: '1991-01-01' });
    await delay(10);
    await repo.updateResource({ ...p, birthDate: '1992-01-01' });

    const page1 = await repo.readHistory('Patient', p.id, { count: 2 });
    const bundle = buildHistoryBundle(page1, {
      selfUrl: `http://localhost:3000/fhir/R4/Patient/${p.id}/_history?_count=2`,
      nextUrl: `http://localhost:3000/fhir/R4/Patient/${p.id}/_history?_count=2&_cursor=${page1[page1.length - 1].lastUpdated}`,
      total: 3,
    });

    expect(bundle.total).toBe(3);
    expect(bundle.entry).toHaveLength(2);
    expect(bundle.link).toHaveLength(2);
    expect(bundle.link![0].relation).toBe('self');
    expect(bundle.link![1].relation).toBe('next');

    await cleanup('Patient', p.id);
  });
});

// =============================================================================
// HistoryEntry structure
// =============================================================================

describe('HistoryEntry structure', () => {
  it('non-delete entries have resource with correct meta', async () => {
    const p = await repo.createResource(makePatient());
    const history = await repo.readHistory('Patient', p.id);

    expect(history).toHaveLength(1);
    const entry = history[0];
    expect(entry.deleted).toBe(false);
    expect(entry.resource).not.toBeNull();
    expect(entry.resource!.meta.versionId).toBe(entry.versionId);
    expect(entry.resourceType).toBe('Patient');
    expect(entry.id).toBe(p.id);

    await cleanup('Patient', p.id);
  });

  it('delete entries have null resource', async () => {
    const p = await repo.createResource(makePatient());
    await delay(10);
    await repo.deleteResource('Patient', p.id);

    const history = await repo.readHistory('Patient', p.id);
    const deleteEntry = history[0];

    expect(deleteEntry.deleted).toBe(true);
    expect(deleteEntry.resource).toBeNull();
    expect(deleteEntry.resourceType).toBe('Patient');
    expect(deleteEntry.id).toBe(p.id);
    expect(deleteEntry.versionId).toBeTruthy();

    await cleanup('Patient', p.id);
  });
});
