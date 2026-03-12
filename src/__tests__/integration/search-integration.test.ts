/**
 * Search Integration Tests — Real PostgreSQL (Task 14.3)
 *
 * End-to-end tests that:
 * 1. Create resources via FhirRepository (WITH SearchParameterRegistry)
 * 2. Search via executeSearch() against real PostgreSQL
 * 3. Verify correct results
 *
 * Requires `npm run db:init` to have been run first.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DatabaseClient } from '../../db/client.js';
import { FhirRepository } from '../../repo/fhir-repo.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import type { SearchParameterBundle } from '../../registry/search-parameter-registry.js';
import { executeSearch } from '../../search/search-executor.js';
import type { SearchRequest, IncludeTarget } from '../../search/types.js';
import type { FhirResource } from '../../repo/types.js';

// =============================================================================
// Setup
// =============================================================================

function loadEnv(): void {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(scriptDir, '..', '..', '..', '.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

let db: DatabaseClient;
let repo: FhirRepository;
let spRegistry: SearchParameterRegistry;

// Unique test run prefix to avoid cross-test interference
const RUN_ID = randomUUID().slice(0, 8);

beforeAll(async () => {
  loadEnv();
  db = new DatabaseClient({
    host: process.env['DB_HOST'] ?? 'localhost',
    port: parseInt(process.env['DB_PORT'] ?? '5433', 10),
    database: process.env['DB_NAME'] ?? 'medxai_dev',
    user: process.env['DB_USER'] ?? 'postgres',
    password: process.env['DB_PASSWORD'] ?? 'assert',
  });

  const alive = await db.ping();
  if (!alive) {
    throw new Error('Cannot connect to PostgreSQL. Run `npm run db:init` first.');
  }

  // Load SearchParameterRegistry from spec
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const specDir = resolve(scriptDir, '..', '..', '..', '..', '..', 'spec', 'fhir', 'r4');
  const spBundlePath = resolve(specDir, 'search-parameters.json');

  if (!existsSync(spBundlePath)) {
    throw new Error(`search-parameters.json not found at ${spBundlePath}`);
  }

  const spBundle = JSON.parse(readFileSync(spBundlePath, 'utf8')) as SearchParameterBundle;
  spRegistry = new SearchParameterRegistry();
  spRegistry.indexBundle(spBundle);

  // Create repo WITH registry so search columns are populated
  repo = new FhirRepository(db, spRegistry);
}, 30_000);

afterAll(async () => {
  // Clean up test resources
  try {
    await db.query(
      `DELETE FROM "Patient_History" WHERE "id" IN (SELECT "id" FROM "Patient" WHERE "content"::text LIKE $1)`,
      [`%${RUN_ID}%`],
    );
    await db.query(
      `DELETE FROM "Patient" WHERE "content"::text LIKE $1`,
      [`%${RUN_ID}%`],
    );
    await db.query(
      `DELETE FROM "Observation_History" WHERE "id" IN (SELECT "id" FROM "Observation" WHERE "content"::text LIKE $1)`,
      [`%${RUN_ID}%`],
    );
    await db.query(
      `DELETE FROM "Observation" WHERE "content"::text LIKE $1`,
      [`%${RUN_ID}%`],
    );
    // Clean up reference rows
    await db.query(
      `DELETE FROM "Patient_References" WHERE "resourceId" IN (SELECT "id" FROM "Patient" WHERE "content"::text LIKE $1)`,
      [`%${RUN_ID}%`],
    ).catch(() => { });
    await db.query(
      `DELETE FROM "Observation_References" WHERE "resourceId" IN (SELECT "id" FROM "Observation" WHERE "content"::text LIKE $1)`,
      [`%${RUN_ID}%`],
    ).catch(() => { });
  } catch {
    // ignore cleanup errors
  }

  if (db && !db.isClosed) {
    await db.close();
  }
});

// =============================================================================
// Helpers
// =============================================================================

function makePatient(overrides?: Partial<FhirResource>): FhirResource {
  return {
    resourceType: 'Patient',
    name: [{ family: `TestFamily-${RUN_ID}`, given: ['TestGiven'] }],
    birthDate: '1990-01-15',
    gender: 'male',
    active: true,
    ...overrides,
  };
}

function makeObservation(subjectRef: string, overrides?: Partial<FhirResource>): FhirResource {
  return {
    resourceType: 'Observation',
    status: 'final',
    code: {
      coding: [
        { system: 'http://loinc.org', code: '29463-7', display: 'Body Weight' },
      ],
    },
    subject: { reference: subjectRef },
    valueQuantity: { value: 70, unit: 'kg' },
    ...overrides,
  };
}

async function search(
  resourceType: string,
  params: SearchRequest['params'],
  options?: {
    count?: number;
    offset?: number;
    sort?: SearchRequest['sort'];
    total?: SearchRequest['total'];
    include?: IncludeTarget[];
    revinclude?: IncludeTarget[];
  },
): Promise<import('../../search/search-executor.js').SearchResult> {
  const request: SearchRequest = {
    resourceType,
    params,
    count: options?.count,
    offset: options?.offset,
    sort: options?.sort,
    total: options?.total,
    include: options?.include,
    revinclude: options?.revinclude,
  };
  return executeSearch(db, request, spRegistry, { total: options?.total });
}

// =============================================================================
// Section 1: Basic Search by Type
// =============================================================================

describe('Search Integration — basic parameter types', () => {
  let patientId1: string;
  let patientId2: string;
  let patientId3: string;

  beforeAll(async () => {
    // Create 3 patients with different attributes
    const p1 = await repo.createResource(makePatient({
      gender: 'male',
      birthDate: '1990-01-15',
      name: [{ family: `Alpha-${RUN_ID}`, given: ['John'] }],
    }));
    patientId1 = p1.id;

    const p2 = await repo.createResource(makePatient({
      gender: 'female',
      birthDate: '1985-06-20',
      name: [{ family: `Beta-${RUN_ID}`, given: ['Jane'] }],
    }));
    patientId2 = p2.id;

    const p3 = await repo.createResource(makePatient({
      gender: 'male',
      birthDate: '2000-12-01',
      name: [{ family: `Gamma-${RUN_ID}`, given: ['Bob'] }],
    }));
    patientId3 = p3.id;
  });

  it('search by _id returns exact match', async () => {
    const result = await search('Patient', [
      { code: '_id', values: [patientId1] },
    ]);
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].id).toBe(patientId1);
  });

  it('search by gender (token) returns matching resources', async () => {
    const result = await search('Patient', [
      { code: '_id', values: [patientId1, patientId2, patientId3] },
      { code: 'gender', values: ['male'] },
    ]);
    // patientId1 and patientId3 are male
    expect(result.resources.length).toBeGreaterThanOrEqual(2);
    const ids = result.resources.map((r) => r.id);
    expect(ids).toContain(patientId1);
    expect(ids).toContain(patientId3);
    expect(ids).not.toContain(patientId2);
  });

  it('search by birthdate with ge prefix', async () => {
    const result = await search('Patient', [
      { code: '_id', values: [patientId1, patientId2, patientId3] },
      { code: 'birthdate', prefix: 'ge', values: ['1990-01-01'] },
    ]);
    // p1 (1990-01-15) and p3 (2000-12-01) match
    const ids = result.resources.map((r) => r.id);
    expect(ids).toContain(patientId1);
    expect(ids).toContain(patientId3);
    expect(ids).not.toContain(patientId2);
  });

  it('search by birthdate with lt prefix', async () => {
    const result = await search('Patient', [
      { code: '_id', values: [patientId1, patientId2, patientId3] },
      { code: 'birthdate', prefix: 'lt', values: ['1990-01-01'] },
    ]);
    // Only p2 (1985-06-20) matches
    const ids = result.resources.map((r) => r.id);
    expect(ids).toContain(patientId2);
    expect(ids).not.toContain(patientId1);
    expect(ids).not.toContain(patientId3);
  });

  it('search by reference (Observation.subject)', async () => {
    // Create an observation referencing patient 1
    const obs = await repo.createResource(makeObservation(`Patient/${patientId1}`, {
      status: 'final',
      code: { coding: [{ system: 'http://loinc.org', code: `test-${RUN_ID}` }] },
    }));

    const result = await search('Observation', [
      { code: 'subject', values: [`Patient/${patientId1}`] },
      { code: '_id', values: [obs.id] },
    ]);
    expect(result.resources.length).toBeGreaterThanOrEqual(1);
    expect(result.resources[0].id).toBe(obs.id);
  });
});

// =============================================================================
// Section 2: Pagination and Sort
// =============================================================================

describe('Search Integration — pagination and sort', () => {
  const patientIds: string[] = [];

  beforeAll(async () => {
    // Create 5 patients with sequential birth dates
    for (let i = 0; i < 5; i++) {
      const p = await repo.createResource(makePatient({
        birthDate: `199${i}-01-01`,
        name: [{ family: `Page-${RUN_ID}-${i}`, given: ['Test'] }],
        gender: 'other',
      }));
      patientIds.push(p.id);
    }
  });

  it('_count limits results', async () => {
    const result = await search('Patient', [
      { code: '_id', values: patientIds },
    ], { count: 2 });
    expect(result.resources.length).toBeLessThanOrEqual(2);
  });

  it('_offset skips results', async () => {
    const all = await search('Patient', [
      { code: '_id', values: patientIds },
    ], { count: 100 });

    const offset = await search('Patient', [
      { code: '_id', values: patientIds },
    ], { count: 100, offset: 2 });

    expect(offset.resources.length).toBe(all.resources.length - 2);
  });

  it('_sort=birthdate orders ascending', async () => {
    const result = await search('Patient', [
      { code: '_id', values: patientIds },
    ], { sort: [{ code: 'birthdate', descending: false }], count: 100 });

    const dates = result.resources.map((r) => (r as Record<string, unknown>).birthDate as string);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] >= dates[i - 1]).toBe(true);
    }
  });

  it('_sort=-birthdate orders descending', async () => {
    const result = await search('Patient', [
      { code: '_id', values: patientIds },
    ], { sort: [{ code: 'birthdate', descending: true }], count: 100 });

    const dates = result.resources.map((r) => (r as Record<string, unknown>).birthDate as string);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] <= dates[i - 1]).toBe(true);
    }
  });

  it('_total=accurate returns correct count', async () => {
    const result = await search('Patient', [
      { code: '_id', values: patientIds },
    ], { total: 'accurate', count: 2 });

    expect(result.total).toBe(5);
    expect(result.resources.length).toBeLessThanOrEqual(2);
  });
});

// =============================================================================
// Section 3: Multiple params, OR/AND, empty results
// =============================================================================

describe('Search Integration — AND/OR and edge cases', () => {
  let maleId: string;
  let femaleId: string;

  beforeAll(async () => {
    const m = await repo.createResource(makePatient({
      gender: 'male',
      birthDate: '1995-03-10',
      name: [{ family: `AndOr-${RUN_ID}-M`, given: ['Test'] }],
    }));
    maleId = m.id;

    const f = await repo.createResource(makePatient({
      gender: 'female',
      birthDate: '1995-07-20',
      name: [{ family: `AndOr-${RUN_ID}-F`, given: ['Test'] }],
    }));
    femaleId = f.id;
  });

  it('multiple values for same param (OR): gender=male,female', async () => {
    const result = await search('Patient', [
      { code: '_id', values: [maleId, femaleId] },
      { code: 'gender', values: ['male', 'female'] },
    ]);
    expect(result.resources).toHaveLength(2);
  });

  it('multiple params (AND): gender=male AND birthdate=ge1995-01-01', async () => {
    const result = await search('Patient', [
      { code: '_id', values: [maleId, femaleId] },
      { code: 'gender', values: ['male'] },
      { code: 'birthdate', prefix: 'ge', values: ['1995-01-01'] },
    ]);
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].id).toBe(maleId);
  });

  it('search on empty result returns empty array', async () => {
    const result = await search('Patient', [
      { code: '_id', values: [randomUUID()] },
    ]);
    expect(result.resources).toHaveLength(0);
  });

  it('deleted resource NOT in search results', async () => {
    const p = await repo.createResource(makePatient({
      name: [{ family: `Deleted-${RUN_ID}`, given: ['Ghost'] }],
    }));
    const id = p.id;

    // Verify it exists in search
    const before = await search('Patient', [{ code: '_id', values: [id] }]);
    expect(before.resources).toHaveLength(1);

    // Delete it
    await repo.deleteResource('Patient', id);

    // Verify it's gone from search
    const after = await search('Patient', [{ code: '_id', values: [id] }]);
    expect(after.resources).toHaveLength(0);
  });

  it('update resource reflects new values in search', async () => {
    const p = await repo.createResource(makePatient({
      gender: 'male',
      name: [{ family: `Update-${RUN_ID}`, given: ['Before'] }],
    }));

    // Search by gender=male → found
    const before = await search('Patient', [
      { code: '_id', values: [p.id] },
      { code: 'gender', values: ['male'] },
    ]);
    expect(before.resources).toHaveLength(1);

    // Update gender to female
    await repo.updateResource({
      ...p,
      gender: 'female',
    });

    // Search by gender=male → NOT found
    const afterMale = await search('Patient', [
      { code: '_id', values: [p.id] },
      { code: 'gender', values: ['male'] },
    ]);
    expect(afterMale.resources).toHaveLength(0);

    // Search by gender=female → found
    const afterFemale = await search('Patient', [
      { code: '_id', values: [p.id] },
      { code: 'gender', values: ['female'] },
    ]);
    expect(afterFemale.resources).toHaveLength(1);
  });
});

// =============================================================================
// Phase 15: Metadata Search & Token Enhancements
// =============================================================================

describe('Phase 15 — metadata search params', () => {
  it('_tag search finds resource by meta.tag', async () => {
    const p = await repo.createResource(makePatient({
      meta: {
        tag: [{ system: 'http://example.com/tags', code: `phase15-${RUN_ID}` }],
      },
    }));

    const result = await search('Patient', [
      { code: '_tag', values: [`http://example.com/tags|phase15-${RUN_ID}`] },
    ]);
    const ids = result.resources.map((r: FhirResource) => r.id);
    expect(ids).toContain(p.id);
  });

  it('_tag search does NOT find resource without matching tag', async () => {
    await repo.createResource(makePatient({
      meta: {
        tag: [{ system: 'http://example.com/tags', code: `other-${RUN_ID}` }],
      },
    }));

    const result = await search('Patient', [
      { code: '_tag', values: [`http://example.com/tags|nonexistent-${RUN_ID}`] },
    ]);
    expect(result.resources).toHaveLength(0);
  });

  it('_security search finds resource by meta.security', async () => {
    const p = await repo.createResource(makePatient({
      meta: {
        security: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'R' }],
      },
      name: [{ family: `Sec-${RUN_ID}` }],
    }));

    const result = await search('Patient', [
      { code: '_id', values: [p.id] },
      { code: '_security', values: ['http://terminology.hl7.org/CodeSystem/v3-Confidentiality|R'] },
    ]);
    expect(result.resources).toHaveLength(1);
    expect((result.resources[0] as FhirResource).id).toBe(p.id);
  });

  it('_profile search finds resource by meta.profile', async () => {
    const profileUrl = `http://example.com/fhir/StructureDefinition/test-${RUN_ID}`;
    const p = await repo.createResource(makePatient({
      meta: { profile: [profileUrl] },
    }));

    const result = await search('Patient', [
      { code: '_profile', values: [profileUrl] },
    ]);
    const ids = result.resources.map((r: FhirResource) => r.id);
    expect(ids).toContain(p.id);
  });

  it('_source search finds resource by meta.source', async () => {
    const sourceUrl = `http://example.com/source-${RUN_ID}`;
    const p = await repo.createResource(makePatient({
      meta: { source: sourceUrl },
    }));

    const result = await search('Patient', [
      { code: '_source', values: [sourceUrl] },
    ]);
    const ids = result.resources.map((r: FhirResource) => r.id);
    expect(ids).toContain(p.id);
  });

  it('_tag with multiple tags — finds by any', async () => {
    const p = await repo.createResource(makePatient({
      meta: {
        tag: [
          { system: 'http://a.com', code: `multi1-${RUN_ID}` },
          { system: 'http://b.com', code: `multi2-${RUN_ID}` },
        ],
      },
    }));

    // Search by second tag
    const result = await search('Patient', [
      { code: '_tag', values: [`http://b.com|multi2-${RUN_ID}`] },
    ]);
    const ids = result.resources.map((r: FhirResource) => r.id);
    expect(ids).toContain(p.id);
  });
});

describe('Phase 15 — token enhancements', () => {
  it('system|code search on identifier', async () => {
    const p = await repo.createResource(makePatient({
      identifier: [{ system: 'http://hospital.example.com/mrn', value: `MRN-${RUN_ID}` }],
    }));

    const result = await search('Patient', [
      { code: 'identifier', values: [`http://hospital.example.com/mrn|MRN-${RUN_ID}`] },
    ]);
    const ids = result.resources.map((r: FhirResource) => r.id);
    expect(ids).toContain(p.id);
  });

  it('|code search on identifier (no system)', async () => {
    const p = await repo.createResource(makePatient({
      identifier: [{ system: 'http://hospital.example.com/mrn', value: `PIPE-${RUN_ID}` }],
    }));

    // |code strips the pipe and searches for plain code
    const result = await search('Patient', [
      { code: '_id', values: [p.id] },
      { code: 'identifier', values: [`|PIPE-${RUN_ID}`] },
    ]);
    // This should NOT match because the stored text is "http://hospital.example.com/mrn|PIPE-xxx"
    // and we're searching for just "PIPE-xxx" (no system prefix)
    expect(result.resources).toHaveLength(0);
  });

  it(':text modifier on code searches sort column', async () => {
    const obs = await repo.createResource(makeObservation('Patient/dummy', {
      code: {
        coding: [{ system: 'http://loinc.org', code: '29463-7', display: `BodyWeight-${RUN_ID}` }],
      },
    }));

    const result = await search('Observation', [
      { code: 'code', modifier: 'text', values: [`bodyweight-${RUN_ID.toLowerCase()}`] },
    ]);
    const ids = result.resources.map((r: FhirResource) => r.id);
    expect(ids).toContain(obs.id);
  });

  it('_tag:not excludes matching resources', async () => {
    const p = await repo.createResource(makePatient({
      meta: {
        tag: [{ system: 'http://example.com', code: `exclude-${RUN_ID}` }],
      },
    }));

    const result = await search('Patient', [
      { code: '_id', values: [p.id] },
      { code: '_tag', modifier: 'not', values: [`http://example.com|exclude-${RUN_ID}`] },
    ]);
    expect(result.resources).toHaveLength(0);
  });
});

// =============================================================================
// Section 6: Phase 16 — _include / _revinclude
// =============================================================================

describe('Phase 16 — _include and _revinclude', () => {
  let patientId: string;
  let observationId: string;

  beforeAll(async () => {
    // Create a Patient, then an Observation referencing it
    const patient = await repo.createResource(makePatient({
      name: [{ family: `IncludeTest-${RUN_ID}`, given: ['Phase16'] }],
    }));
    patientId = patient.id;

    const obs = await repo.createResource(makeObservation(`Patient/${patientId}`, {
      code: {
        coding: [{ system: 'http://loinc.org', code: '29463-7', display: `P16Weight-${RUN_ID}` }],
      },
    }));
    observationId = obs.id;
  }, 15_000);

  it('_include loads referenced Patient from Observation search', async () => {
    const result = await search('Observation', [
      { code: '_id', values: [observationId] },
    ], {
      include: [{ resourceType: 'Observation', searchParam: 'subject' }],
    });

    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].id).toBe(observationId);
    expect(result.included).toBeDefined();
    expect(result.included!.length).toBeGreaterThanOrEqual(1);
    const includedIds = result.included!.map((r: FhirResource) => r.id);
    expect(includedIds).toContain(patientId);
  });

  it('_revinclude loads Observations referencing Patient', async () => {
    const result = await search('Patient', [
      { code: '_id', values: [patientId] },
    ], {
      revinclude: [{ resourceType: 'Observation', searchParam: 'subject' }],
    });

    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].id).toBe(patientId);
    expect(result.included).toBeDefined();
    expect(result.included!.length).toBeGreaterThanOrEqual(1);
    const includedIds = result.included!.map((r: FhirResource) => r.id);
    expect(includedIds).toContain(observationId);
  });

  it('_include with no matching references returns only primary results', async () => {
    // Patient has no outgoing "subject" reference
    const result = await search('Patient', [
      { code: '_id', values: [patientId] },
    ], {
      include: [{ resourceType: 'Patient', searchParam: 'organization' }],
    });

    expect(result.resources).toHaveLength(1);
    expect(result.included).toBeUndefined();
  });

  it('_revinclude with no reverse references returns only primary results', async () => {
    // Search for the Observation — no other resource references it
    const result = await search('Observation', [
      { code: '_id', values: [observationId] },
    ], {
      revinclude: [{ resourceType: 'Patient', searchParam: 'link' }],
    });

    expect(result.resources).toHaveLength(1);
    expect(result.included).toBeUndefined();
  });

  it('included resources are not duplicated with primary results', async () => {
    const result = await search('Observation', [
      { code: '_id', values: [observationId] },
    ], {
      include: [{ resourceType: 'Observation', searchParam: 'subject' }],
    });

    // Primary result is the Observation, included is the Patient
    // They should not overlap
    const primaryIds = result.resources.map((r: FhirResource) => r.id!);
    const includedIds = (result.included ?? []).map((r: FhirResource) => r.id!);
    const overlap = primaryIds.filter((id) => includedIds.includes(id));
    expect(overlap).toHaveLength(0);
  });

  it('reference rows are written on create (verified via _revinclude)', async () => {
    // Create a new Observation referencing the same Patient
    const obs2 = await repo.createResource(makeObservation(`Patient/${patientId}`, {
      code: {
        coding: [{ system: 'http://loinc.org', code: '8867-4', display: `P16HR-${RUN_ID}` }],
      },
    }));

    const result = await search('Patient', [
      { code: '_id', values: [patientId] },
    ], {
      revinclude: [{ resourceType: 'Observation', searchParam: 'subject' }],
    });

    const includedIds = (result.included ?? []).map((r: FhirResource) => r.id);
    expect(includedIds).toContain(obs2.id);
    expect(includedIds).toContain(observationId);
  });

  it('delete resource cleans up reference rows', async () => {
    // Create and then delete an Observation
    const obs3 = await repo.createResource(makeObservation(`Patient/${patientId}`, {
      code: {
        coding: [{ system: 'http://loinc.org', code: '9999-9', display: `P16Del-${RUN_ID}` }],
      },
    }));
    await repo.deleteResource('Observation', obs3.id);

    // Verify the deleted obs is NOT in _revinclude results
    const result = await search('Patient', [
      { code: '_id', values: [patientId] },
    ], {
      revinclude: [{ resourceType: 'Observation', searchParam: 'subject' }],
    });

    const includedIds = (result.included ?? []).map((r: FhirResource) => r.id);
    expect(includedIds).not.toContain(obs3.id);
  });

  it('update resource updates reference rows', async () => {
    // Create a second patient
    const patient2 = await repo.createResource(makePatient({
      name: [{ family: `IncludeTest2-${RUN_ID}`, given: ['Phase16b'] }],
    }));

    // Create an Observation referencing patient2
    const obs4 = await repo.createResource(makeObservation(`Patient/${patient2.id}`, {
      code: {
        coding: [{ system: 'http://loinc.org', code: '8888-8', display: `P16Upd-${RUN_ID}` }],
      },
    }));

    // Update the Observation to reference the original patient instead
    await repo.updateResource({
      ...obs4,
      subject: { reference: `Patient/${patientId}` },
    } as any);

    // _revinclude on original patient should now include obs4
    const result = await search('Patient', [
      { code: '_id', values: [patientId] },
    ], {
      revinclude: [{ resourceType: 'Observation', searchParam: 'subject' }],
    });

    const includedIds = (result.included ?? []).map((r: FhirResource) => r.id);
    expect(includedIds).toContain(obs4.id);
  });
});

// =============================================================================
// Section 7: Phase 17 — lookup-table search (name, address)
// =============================================================================

describe('Phase 17 — lookup-table search', () => {
  let namedPatientId: string;

  beforeAll(async () => {
    const p = await repo.createResource(makePatient({
      name: [{ family: `Lookupfam-${RUN_ID}`, given: ['Giventest'] }],
      address: [{ line: ['789 Elm St'], city: `LookupCity-${RUN_ID}`, state: 'CA', postalCode: '90210', country: 'US' }],
    }));
    namedPatientId = p.id;
  }, 15_000);

  it('search by name (prefix) finds patient', async () => {
    const result = await search('Patient', [
      { code: 'name', values: [`Lookupfam-${RUN_ID}`] },
    ]);
    const ids = result.resources.map((r: FhirResource) => r.id);
    expect(ids).toContain(namedPatientId);
  });

  it('search by name :contains finds substring match', async () => {
    const result = await search('Patient', [
      { code: 'name', modifier: 'contains', values: [`lookupfam-${RUN_ID.toLowerCase()}`] },
    ]);
    const ids = result.resources.map((r: FhirResource) => r.id);
    expect(ids).toContain(namedPatientId);
  });

  it('search by name :exact matches exactly', async () => {
    // The sort column stores "Lookupfam-<RUN_ID> Giventest"
    const result = await search('Patient', [
      { code: 'name', modifier: 'exact', values: [`Lookupfam-${RUN_ID} Giventest`] },
    ]);
    const ids = result.resources.map((r: FhirResource) => r.id);
    expect(ids).toContain(namedPatientId);
  });

  it('search by address finds patient by city', async () => {
    const result = await search('Patient', [
      { code: 'address', modifier: 'contains', values: [`LookupCity-${RUN_ID}`] },
    ]);
    const ids = result.resources.map((r: FhirResource) => r.id);
    expect(ids).toContain(namedPatientId);
  });
});
