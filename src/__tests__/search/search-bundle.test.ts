/**
 * SearchSet Bundle Builder — Unit Tests
 */

import { describe, it, expect } from 'vitest';
import type { PersistedResource } from '../../repo/types.js';
import {
  buildSearchBundle,
  type SearchBundle,
  type SearchBundleEntry,
} from '../../search/search-bundle.js';

// =============================================================================
// Helper: create a minimal PersistedResource
// =============================================================================

function makeResource(overrides?: Partial<PersistedResource>): PersistedResource {
  return {
    resourceType: 'Patient',
    id: 'p1',
    meta: {
      versionId: 'v1',
      lastUpdated: '2026-01-01T00:00:00.000Z',
    },
    ...overrides,
  };
}

// =============================================================================
// Basic Bundle structure
// =============================================================================

describe('buildSearchBundle — structure', () => {
  it('returns Bundle with type searchset', () => {
    const bundle = buildSearchBundle([]);
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('searchset');
  });

  it('generates a UUID id', () => {
    const bundle = buildSearchBundle([]);
    expect(bundle.id).toBeDefined();
    expect(bundle.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('generates unique ids for different bundles', () => {
    const b1 = buildSearchBundle([]);
    const b2 = buildSearchBundle([]);
    expect(b1.id).not.toBe(b2.id);
  });

  it('omits entry array when no resources', () => {
    const bundle = buildSearchBundle([]);
    expect(bundle.entry).toBeUndefined();
  });

  it('omits total when not provided', () => {
    const bundle = buildSearchBundle([]);
    expect(bundle.total).toBeUndefined();
  });

  it('omits link when no URLs provided', () => {
    const bundle = buildSearchBundle([]);
    expect(bundle.link).toBeUndefined();
  });
});

// =============================================================================
// Entries
// =============================================================================

describe('buildSearchBundle — entries', () => {
  it('includes single resource as entry', () => {
    const bundle = buildSearchBundle([makeResource()]);
    expect(bundle.entry).toHaveLength(1);
  });

  it('includes multiple resources', () => {
    const resources = [
      makeResource({ id: 'p1' }),
      makeResource({ id: 'p2' }),
      makeResource({ id: 'p3' }),
    ];
    const bundle = buildSearchBundle(resources);
    expect(bundle.entry).toHaveLength(3);
  });

  it('sets search.mode to match on all entries', () => {
    const bundle = buildSearchBundle([makeResource(), makeResource({ id: 'p2' })]);
    for (const entry of bundle.entry!) {
      expect(entry.search.mode).toBe('match');
    }
  });

  it('preserves resource content in entry', () => {
    const resource = makeResource({ id: 'patient-abc', name: [{ family: 'Smith' }] });
    const bundle = buildSearchBundle([resource]);
    const entry = bundle.entry![0];
    expect(entry.resource.id).toBe('patient-abc');
    expect(entry.resource.resourceType).toBe('Patient');
    expect((entry.resource as any).name).toEqual([{ family: 'Smith' }]);
  });

  it('handles large result set (100 entries)', () => {
    const resources = Array.from({ length: 100 }, (_, i) =>
      makeResource({ id: `p${i}` }),
    );
    const bundle = buildSearchBundle(resources);
    expect(bundle.entry).toHaveLength(100);
  });
});

// =============================================================================
// fullUrl
// =============================================================================

describe('buildSearchBundle — fullUrl', () => {
  it('constructs fullUrl with baseUrl', () => {
    const bundle = buildSearchBundle([makeResource()], {
      baseUrl: 'http://localhost:3000/fhir/R4',
    });
    expect(bundle.entry![0].fullUrl).toBe(
      'http://localhost:3000/fhir/R4/Patient/p1',
    );
  });

  it('omits fullUrl when no baseUrl', () => {
    const bundle = buildSearchBundle([makeResource()]);
    expect(bundle.entry![0].fullUrl).toBeUndefined();
  });

  it('constructs fullUrl for different resource types', () => {
    const resource = makeResource({ resourceType: 'Observation', id: 'obs-1' });
    const bundle = buildSearchBundle([resource], {
      baseUrl: 'http://example.com/fhir',
    });
    expect(bundle.entry![0].fullUrl).toBe(
      'http://example.com/fhir/Observation/obs-1',
    );
  });
});

// =============================================================================
// Total
// =============================================================================

describe('buildSearchBundle — total', () => {
  it('includes total when provided', () => {
    const bundle = buildSearchBundle([], { total: 42 });
    expect(bundle.total).toBe(42);
  });

  it('total can be 0', () => {
    const bundle = buildSearchBundle([], { total: 0 });
    expect(bundle.total).toBe(0);
  });

  it('total can differ from entry count (pagination)', () => {
    const bundle = buildSearchBundle([makeResource()], { total: 100 });
    expect(bundle.total).toBe(100);
    expect(bundle.entry).toHaveLength(1);
  });
});

// =============================================================================
// Links
// =============================================================================

describe('buildSearchBundle — links', () => {
  it('includes self link', () => {
    const bundle = buildSearchBundle([], {
      selfUrl: 'http://localhost:3000/fhir/R4/Patient?gender=male',
    });
    expect(bundle.link).toHaveLength(1);
    expect(bundle.link![0].relation).toBe('self');
    expect(bundle.link![0].url).toBe(
      'http://localhost:3000/fhir/R4/Patient?gender=male',
    );
  });

  it('includes next link', () => {
    const bundle = buildSearchBundle([], {
      nextUrl: 'http://localhost:3000/fhir/R4/Patient?_offset=20',
    });
    expect(bundle.link).toHaveLength(1);
    expect(bundle.link![0].relation).toBe('next');
  });

  it('includes both self and next links', () => {
    const bundle = buildSearchBundle([], {
      selfUrl: 'http://localhost:3000/fhir/R4/Patient',
      nextUrl: 'http://localhost:3000/fhir/R4/Patient?_offset=20',
    });
    expect(bundle.link).toHaveLength(2);
    expect(bundle.link![0].relation).toBe('self');
    expect(bundle.link![1].relation).toBe('next');
  });

  it('omits link array when no URLs', () => {
    const bundle = buildSearchBundle([makeResource()]);
    expect(bundle.link).toBeUndefined();
  });
});

// =============================================================================
// Combined options
// =============================================================================

describe('buildSearchBundle — combined', () => {
  it('builds complete bundle with all options', () => {
    const resources = [makeResource({ id: 'p1' }), makeResource({ id: 'p2' })];
    const bundle = buildSearchBundle(resources, {
      baseUrl: 'http://localhost:3000/fhir/R4',
      total: 50,
      selfUrl: 'http://localhost:3000/fhir/R4/Patient?_count=2',
      nextUrl: 'http://localhost:3000/fhir/R4/Patient?_count=2&_offset=2',
    });

    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('searchset');
    expect(bundle.total).toBe(50);
    expect(bundle.link).toHaveLength(2);
    expect(bundle.entry).toHaveLength(2);
    expect(bundle.entry![0].fullUrl).toContain('Patient/p1');
    expect(bundle.entry![1].fullUrl).toContain('Patient/p2');
    expect(bundle.entry![0].search.mode).toBe('match');
  });
});
