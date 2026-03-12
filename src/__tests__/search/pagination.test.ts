/**
 * Pagination Helpers — Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  buildSelfLink,
  buildNextLink,
  hasNextPage,
  buildPaginationContext,
  type PaginationContext,
} from '../../search/pagination.js';

// =============================================================================
// Helper: create a minimal PaginationContext
// =============================================================================

function makeCtx(overrides?: Partial<PaginationContext>): PaginationContext {
  return {
    baseUrl: 'http://localhost:3000/fhir/R4',
    resourceType: 'Patient',
    queryParams: {},
    count: 20,
    offset: 0,
    resultCount: 20,
    ...overrides,
  };
}

// =============================================================================
// buildSelfLink
// =============================================================================

describe('buildSelfLink', () => {
  it('returns base URL with resource type when no params', () => {
    const ctx = makeCtx({ queryParams: {} });
    expect(buildSelfLink(ctx)).toBe('http://localhost:3000/fhir/R4/Patient');
  });

  it('includes search params in URL', () => {
    const ctx = makeCtx({ queryParams: { gender: 'male' } });
    const url = buildSelfLink(ctx);
    expect(url).toContain('gender=male');
  });

  it('includes multiple search params', () => {
    const ctx = makeCtx({ queryParams: { gender: 'male', active: 'true' } });
    const url = buildSelfLink(ctx);
    expect(url).toContain('gender=male');
    expect(url).toContain('active=true');
  });

  it('includes _count param', () => {
    const ctx = makeCtx({ queryParams: { _count: '10' } });
    const url = buildSelfLink(ctx);
    expect(url).toContain('_count=10');
  });

  it('includes _offset when non-zero', () => {
    const ctx = makeCtx({ offset: 20 });
    const url = buildSelfLink(ctx);
    expect(url).toContain('_offset=20');
  });

  it('omits _offset when zero', () => {
    const ctx = makeCtx({ offset: 0 });
    const url = buildSelfLink(ctx);
    expect(url).not.toContain('_offset');
  });

  it('handles array parameter values', () => {
    const ctx = makeCtx({ queryParams: { _sort: ['birthdate', '-name'] } });
    const url = buildSelfLink(ctx);
    expect(url).toContain('_sort=birthdate');
    expect(url).toContain('_sort=-name');
  });

  it('preserves _sort in link', () => {
    const ctx = makeCtx({ queryParams: { _sort: '-birthdate', gender: 'male' } });
    const url = buildSelfLink(ctx);
    expect(url).toContain('_sort=-birthdate');
    expect(url).toContain('gender=male');
  });

  it('preserves _total in link', () => {
    const ctx = makeCtx({ queryParams: { _total: 'accurate' } });
    const url = buildSelfLink(ctx);
    expect(url).toContain('_total=accurate');
  });

  it('strips _offset from queryParams (uses ctx.offset instead)', () => {
    const ctx = makeCtx({ queryParams: { _offset: '999' }, offset: 10 });
    const url = buildSelfLink(ctx);
    expect(url).toContain('_offset=10');
    expect(url).not.toContain('_offset=999');
  });

  it('URL-encodes special characters in values', () => {
    const ctx = makeCtx({ queryParams: { name: 'O\'Brien' } });
    const url = buildSelfLink(ctx);
    expect(url).toContain('name=O');
  });
});

// =============================================================================
// hasNextPage
// =============================================================================

describe('hasNextPage', () => {
  it('returns true when resultCount equals count', () => {
    expect(hasNextPage(makeCtx({ count: 20, resultCount: 20 }))).toBe(true);
  });

  it('returns false when resultCount less than count', () => {
    expect(hasNextPage(makeCtx({ count: 20, resultCount: 10 }))).toBe(false);
  });

  it('returns false when resultCount is 0', () => {
    expect(hasNextPage(makeCtx({ count: 20, resultCount: 0 }))).toBe(false);
  });

  it('returns false when count is 0', () => {
    expect(hasNextPage(makeCtx({ count: 0, resultCount: 0 }))).toBe(false);
  });

  it('returns true when resultCount exceeds count', () => {
    expect(hasNextPage(makeCtx({ count: 10, resultCount: 10 }))).toBe(true);
  });
});

// =============================================================================
// buildNextLink
// =============================================================================

describe('buildNextLink', () => {
  it('returns next URL when more results exist', () => {
    const ctx = makeCtx({ count: 20, offset: 0, resultCount: 20 });
    const url = buildNextLink(ctx);
    expect(url).toBeDefined();
    expect(url).toContain('_offset=20');
  });

  it('returns undefined when no more results', () => {
    const ctx = makeCtx({ count: 20, resultCount: 10 });
    expect(buildNextLink(ctx)).toBeUndefined();
  });

  it('returns undefined for empty results', () => {
    const ctx = makeCtx({ count: 20, resultCount: 0 });
    expect(buildNextLink(ctx)).toBeUndefined();
  });

  it('increments offset by count', () => {
    const ctx = makeCtx({ count: 10, offset: 30, resultCount: 10 });
    const url = buildNextLink(ctx)!;
    expect(url).toContain('_offset=40');
  });

  it('preserves search params in next link', () => {
    const ctx = makeCtx({
      queryParams: { gender: 'male', _count: '10' },
      count: 10,
      offset: 0,
      resultCount: 10,
    });
    const url = buildNextLink(ctx)!;
    expect(url).toContain('gender=male');
    expect(url).toContain('_count=10');
    expect(url).toContain('_offset=10');
  });

  it('returns undefined when count is 0', () => {
    const ctx = makeCtx({ count: 0, resultCount: 0 });
    expect(buildNextLink(ctx)).toBeUndefined();
  });

  it('handles large offset values', () => {
    const ctx = makeCtx({ count: 100, offset: 9900, resultCount: 100 });
    const url = buildNextLink(ctx)!;
    expect(url).toContain('_offset=10000');
  });
});

// =============================================================================
// buildPaginationContext
// =============================================================================

describe('buildPaginationContext', () => {
  it('creates context with defaults', () => {
    const ctx = buildPaginationContext(
      'http://localhost:3000/fhir/R4',
      'Patient',
      {},
      undefined,
      undefined,
      5,
    );
    expect(ctx.count).toBe(20); // DEFAULT_SEARCH_COUNT
    expect(ctx.offset).toBe(0);
    expect(ctx.resultCount).toBe(5);
  });

  it('uses provided count and offset', () => {
    const ctx = buildPaginationContext(
      'http://localhost:3000/fhir/R4',
      'Observation',
      { status: 'final' },
      50,
      100,
      50,
    );
    expect(ctx.count).toBe(50);
    expect(ctx.offset).toBe(100);
    expect(ctx.resourceType).toBe('Observation');
    expect(ctx.queryParams).toEqual({ status: 'final' });
  });
});
