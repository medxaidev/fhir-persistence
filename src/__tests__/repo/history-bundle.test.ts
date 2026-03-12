/**
 * Unit tests for history-bundle.ts
 */

import { describe, it, expect } from 'vitest';
import { buildHistoryBundle } from '../../repo/history-bundle.js';
import type { HistoryEntry } from '../../repo/types.js';
import type { PersistedResource } from '../../repo/types.js';

// =============================================================================
// Helpers
// =============================================================================

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    resource: {
      resourceType: 'Patient',
      id: 'p1',
      meta: { versionId: 'v1', lastUpdated: '2024-01-01T00:00:00.000Z' },
    } as PersistedResource,
    versionId: 'v1',
    lastUpdated: '2024-01-01T00:00:00.000Z',
    deleted: false,
    resourceType: 'Patient',
    id: 'p1',
    ...overrides,
  };
}

function makeDeleteEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    resource: null,
    versionId: 'v-del',
    lastUpdated: '2024-01-02T00:00:00.000Z',
    deleted: true,
    resourceType: 'Patient',
    id: 'p1',
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('buildHistoryBundle', () => {
  // ---------------------------------------------------------------------------
  // Basic structure
  // ---------------------------------------------------------------------------

  it('returns a Bundle with type=history', () => {
    const bundle = buildHistoryBundle([]);
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('history');
  });

  it('sets total to entries.length when no total override', () => {
    const entries = [makeEntry(), makeEntry({ versionId: 'v2' })];
    const bundle = buildHistoryBundle(entries);
    expect(bundle.total).toBe(2);
  });

  it('uses total override when provided', () => {
    const bundle = buildHistoryBundle([makeEntry()], { total: 42 });
    expect(bundle.total).toBe(42);
  });

  it('omits entry array when entries is empty', () => {
    const bundle = buildHistoryBundle([]);
    expect(bundle.entry).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // Entry construction
  // ---------------------------------------------------------------------------

  it('creates entry with request and response for a normal resource', () => {
    const bundle = buildHistoryBundle([makeEntry()]);
    expect(bundle.entry).toHaveLength(1);

    const entry = bundle.entry![0];
    expect(entry.request.url).toBe('Patient/p1');
    expect(entry.response.status).toBe('200');
    expect(entry.response.etag).toBe('W/"v1"');
    expect(entry.response.lastModified).toBe('2024-01-01T00:00:00.000Z');
    expect(entry.resource).toBeDefined();
  });

  it('creates delete entry with method=DELETE and no resource', () => {
    const bundle = buildHistoryBundle([makeDeleteEntry()]);
    const entry = bundle.entry![0];

    expect(entry.request.method).toBe('DELETE');
    expect(entry.request.url).toBe('Patient/p1');
    expect(entry.response.status).toBe('204');
    expect(entry.resource).toBeUndefined();
  });

  it('sets fullUrl when baseUrl is provided', () => {
    const bundle = buildHistoryBundle([makeEntry()], {
      baseUrl: 'http://localhost:3000/fhir/R4',
    });
    expect(bundle.entry![0].fullUrl).toBe('http://localhost:3000/fhir/R4/Patient/p1');
  });

  it('omits fullUrl when baseUrl is not provided', () => {
    const bundle = buildHistoryBundle([makeEntry()]);
    expect(bundle.entry![0].fullUrl).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // Links
  // ---------------------------------------------------------------------------

  it('omits link when no URLs provided', () => {
    const bundle = buildHistoryBundle([makeEntry()]);
    expect(bundle.link).toBeUndefined();
  });

  it('includes self link when selfUrl provided', () => {
    const bundle = buildHistoryBundle([makeEntry()], {
      selfUrl: 'http://localhost/Patient/_history',
    });
    expect(bundle.link).toHaveLength(1);
    expect(bundle.link![0].relation).toBe('self');
    expect(bundle.link![0].url).toBe('http://localhost/Patient/_history');
  });

  it('includes next link when nextUrl provided', () => {
    const bundle = buildHistoryBundle([makeEntry()], {
      nextUrl: 'http://localhost/Patient/_history?_count=10&_cursor=abc',
    });
    expect(bundle.link).toHaveLength(1);
    expect(bundle.link![0].relation).toBe('next');
  });

  it('includes both self and next links', () => {
    const bundle = buildHistoryBundle([makeEntry()], {
      selfUrl: 'http://localhost/Patient/_history',
      nextUrl: 'http://localhost/Patient/_history?_cursor=abc',
    });
    expect(bundle.link).toHaveLength(2);
  });

  // ---------------------------------------------------------------------------
  // Mixed entries
  // ---------------------------------------------------------------------------

  it('handles mixed create/update/delete entries', () => {
    const entries: HistoryEntry[] = [
      makeDeleteEntry({ versionId: 'v3', lastUpdated: '2024-01-03T00:00:00.000Z' }),
      makeEntry({ versionId: 'v2', lastUpdated: '2024-01-02T00:00:00.000Z' }),
      makeEntry({ versionId: 'v1', lastUpdated: '2024-01-01T00:00:00.000Z' }),
    ];

    const bundle = buildHistoryBundle(entries);
    expect(bundle.total).toBe(3);
    expect(bundle.entry).toHaveLength(3);

    // Delete entry
    expect(bundle.entry![0].request.method).toBe('DELETE');
    expect(bundle.entry![0].resource).toBeUndefined();

    // Non-delete entries have resources
    expect(bundle.entry![1].resource).toBeDefined();
    expect(bundle.entry![2].resource).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // ETag format
  // ---------------------------------------------------------------------------

  it('formats etag as weak validator W/"versionId"', () => {
    const bundle = buildHistoryBundle([makeEntry({ versionId: 'abc-123' })]);
    expect(bundle.entry![0].response.etag).toBe('W/"abc-123"');
  });

  // ---------------------------------------------------------------------------
  // Request method inference
  // ---------------------------------------------------------------------------

  it('uses PUT method for non-delete entries', () => {
    const bundle = buildHistoryBundle([makeEntry()]);
    expect(bundle.entry![0].request.method).toBe('PUT');
  });

  it('generates a UUID id for the bundle', () => {
    const bundle = buildHistoryBundle([makeEntry()]);
    expect(bundle.id).toBeDefined();
    expect(typeof bundle.id).toBe('string');
    expect(bundle.id.length).toBeGreaterThan(0);
    // UUID v4 format
    expect(bundle.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
