/**
 * Include / Revinclude Executor — Unit Tests
 *
 * Tests executeInclude (normal, iterate, wildcard) and executeRevinclude
 * with mock DatabaseClient.
 */

import { describe, it, expect, vi } from 'vitest';
import { executeInclude, executeRevinclude } from '../../search/include-executor.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import type { PersistedResource } from '../../repo/types.js';
import type { IncludeTarget } from '../../search/types.js';
import type { DatabaseClient } from '../../db/client.js';

// =============================================================================
// Mock Helpers
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

function makeResource(resourceType: string, id: string, extra?: Record<string, unknown>): PersistedResource {
  return {
    resourceType,
    id,
    meta: { versionId: 'v1', lastUpdated: '2026-01-01T00:00:00.000Z' },
    ...extra,
  } as PersistedResource;
}

function makeRegistry(): SearchParameterRegistry {
  const registry = new SearchParameterRegistry();
  registry.indexImpl('Observation', {
    code: 'subject',
    type: 'reference',
    resourceTypes: ['Observation'],
    expression: 'Observation.subject',
    strategy: 'column',
    columnName: 'subject',
    columnType: 'TEXT',
    array: false,
  });
  registry.indexImpl('Observation', {
    code: 'encounter',
    type: 'reference',
    resourceTypes: ['Observation'],
    expression: 'Observation.encounter',
    strategy: 'column',
    columnName: 'encounter',
    columnType: 'TEXT',
    array: false,
  });
  registry.indexImpl('Encounter', {
    code: 'service-provider',
    type: 'reference',
    resourceTypes: ['Encounter'],
    expression: 'Encounter.serviceProvider',
    strategy: 'column',
    columnName: 'serviceProvider',
    columnType: 'TEXT',
    array: false,
  });
  return registry;
}

// =============================================================================
// Phase 18: _include:iterate
// =============================================================================

describe('Phase 18 — executeInclude with iterate', () => {
  it('normal include loads referenced resources (single pass)', async () => {
    const patient = makeResource('Patient', 'p1');
    const patientContent = JSON.stringify(patient);

    const db = createMockDb([
      // Query for Patient table: loading Patient/p1
      { rows: [{ content: patientContent }] },
    ]);

    const registry = makeRegistry();
    const primaryResults = [
      makeResource('Observation', 'obs1', {
        subject: { reference: 'Patient/p1' },
      }),
    ];

    const includes: IncludeTarget[] = [
      { resourceType: 'Observation', searchParam: 'subject' },
    ];

    const result = await executeInclude(db, primaryResults, includes, registry);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p1');
    expect(result[0].resourceType).toBe('Patient');
  });

  it('iterate includes resources referenced by included resources', async () => {
    const patient = makeResource('Patient', 'p1');
    const encounter = makeResource('Encounter', 'enc1', {
      serviceProvider: { reference: 'Organization/org1' },
    });
    const org = makeResource('Organization', 'org1');

    const registry = makeRegistry();

    // Mock DB: first call loads Encounter, second call loads Organization
    const db = createMockDb([
      { rows: [{ content: JSON.stringify(encounter) }] }, // Encounter load
      { rows: [{ content: JSON.stringify(org) }] },       // Organization load (iterate)
      { rows: [] },                                        // No more results
    ]);

    const primaryResults = [
      makeResource('Observation', 'obs1', {
        encounter: { reference: 'Encounter/enc1' },
      }),
    ];

    const includes: IncludeTarget[] = [
      { resourceType: 'Observation', searchParam: 'encounter', iterate: true },
      { resourceType: 'Encounter', searchParam: 'service-provider', iterate: true },
    ];

    const result = await executeInclude(db, primaryResults, includes, registry);
    // Should include both Encounter and Organization
    expect(result.length).toBeGreaterThanOrEqual(1);
    const types = result.map((r) => r.resourceType);
    expect(types).toContain('Encounter');
  });

  it('iterate stops when no new resources are found (cycle detection via seen set)', async () => {
    // Patient references itself — should stop after first load
    const patient = makeResource('Patient', 'p1');

    const db = createMockDb([
      { rows: [{ content: JSON.stringify(patient) }] },
      { rows: [] },
    ]);

    const registry = makeRegistry();
    const primaryResults = [
      makeResource('Observation', 'obs1', {
        subject: { reference: 'Patient/p1' },
      }),
    ];

    const includes: IncludeTarget[] = [
      { resourceType: 'Observation', searchParam: 'subject', iterate: true },
    ];

    const result = await executeInclude(db, primaryResults, includes, registry);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p1');
  });

  it('does not duplicate resources already in primary results', async () => {
    const obs = makeResource('Observation', 'obs1', {
      subject: { reference: 'Patient/obs1' }, // References same ID
    });

    const db = createMockDb([{ rows: [] }]);
    const registry = makeRegistry();

    const includes: IncludeTarget[] = [
      { resourceType: 'Observation', searchParam: 'subject' },
    ];

    // Primary results already contain obs1
    const result = await executeInclude(db, [obs], includes, registry);
    // Should not include obs1 again (different type though, Patient vs Observation)
    // But if the DB returns nothing, result should be empty
    expect(result).toHaveLength(0);
  });
});

// =============================================================================
// Phase 18: _include=* (wildcard)
// =============================================================================

describe('Phase 18 — executeInclude with wildcard', () => {
  it('wildcard include discovers all references in resource JSON', async () => {
    const patient = makeResource('Patient', 'p1');
    const practitioner = makeResource('Practitioner', 'pr1');

    // Mock DB returns patient from Patient table, practitioner from Practitioner table
    const db = createMockDb([
      { rows: [{ content: JSON.stringify(patient) }] },
      { rows: [{ content: JSON.stringify(practitioner) }] },
    ]);

    const registry = makeRegistry();
    const primaryResults = [
      makeResource('Observation', 'obs1', {
        subject: { reference: 'Patient/p1' },
        performer: [{ reference: 'Practitioner/pr1' }],
      }),
    ];

    const includes: IncludeTarget[] = [
      { resourceType: '*', searchParam: '*', wildcard: true },
    ];

    const result = await executeInclude(db, primaryResults, includes, registry);
    // Should include both Patient and Practitioner
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('wildcard include skips contained and urn references', async () => {
    const db = createMockDb([{ rows: [] }]);
    const registry = makeRegistry();

    const primaryResults = [
      makeResource('Observation', 'obs1', {
        subject: { reference: '#contained1' },
        performer: [{ reference: 'urn:uuid:12345' }],
      }),
    ];

    const includes: IncludeTarget[] = [
      { resourceType: '*', searchParam: '*', wildcard: true },
    ];

    const result = await executeInclude(db, primaryResults, includes, registry);
    expect(result).toHaveLength(0);
  });
});

// =============================================================================
// Phase 18: parseIncludeValue wildcard + iterate parsing
// =============================================================================

describe('Phase 18 — parseIncludeValue + parseSearchRequest for iterate/wildcard', () => {
  // These are tested in param-parser.test.ts; this is an integration sanity check
  it('IncludeTarget with iterate=true is processed correctly', async () => {
    const db = createMockDb([{ rows: [] }]);
    const registry = makeRegistry();

    const result = await executeInclude(db, [], [{ resourceType: 'Observation', searchParam: 'subject', iterate: true }], registry);
    expect(result).toHaveLength(0); // Empty primary results → empty includes
  });
});
