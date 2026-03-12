/**
 * Full-Stack Validation Test
 *
 * Comprehensive test covering 15 FHIR R4 resource types with:
 * - Cross-resource references (Patient → Encounter → Observation → Condition etc.)
 * - Rich field coverage (HumanName, Address, ContactPoint, Identifier, meta.tag, etc.)
 * - ≥5 instances per resource type
 * - Content integrity: write → read-back → JSON comparison
 * - SQL-layer verification: main table columns, lookup tables, reference tables
 * - Generates a FHIR Transaction Bundle for Medplum comparison
 *
 * Requires `npm run db:init` (or `--reset`) to have been run first.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DatabaseClient } from '../../db/client.js';
import { FhirRepository } from '../../repo/fhir-repo.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import type { SearchParameterBundle } from '../../registry/search-parameter-registry.js';
import type { FhirResource, PersistedResource } from '../../repo/types.js';

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

// Unique prefix for this test run
const RUN = randomUUID().slice(0, 8);

// Resource type list — used for cleanup
const RESOURCE_TYPES = [
  'Organization', 'Practitioner', 'PractitionerRole', 'Patient',
  'Encounter', 'Condition', 'Observation', 'DiagnosticReport',
  'MedicationRequest', 'Medication', 'AllergyIntolerance',
  'Procedure', 'ServiceRequest', 'CarePlan', 'Immunization',
] as const;

// Store created resource IDs for cross-referencing and cleanup
const created: Record<string, Array<{ id: string; resource: FhirResource & PersistedResource }>> = {};

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

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const specDir = resolve(scriptDir, '..', '..', '..', '..', '..', 'spec', 'fhir', 'r4');
  const spBundlePath = resolve(specDir, 'search-parameters.json');
  if (!existsSync(spBundlePath)) {
    throw new Error(`search-parameters.json not found at ${spBundlePath}`);
  }

  const spBundle = JSON.parse(readFileSync(spBundlePath, 'utf8')) as SearchParameterBundle;
  spRegistry = new SearchParameterRegistry();
  spRegistry.indexBundle(spBundle);
  repo = new FhirRepository(db, spRegistry);

  // Initialize created arrays
  for (const rt of RESOURCE_TYPES) {
    created[rt] = [];
  }
}, 30_000);

afterAll(async () => {
  // Clean up all test resources (in reverse order to respect references)
  for (const rt of [...RESOURCE_TYPES].reverse()) {
    try {
      await db.query(`DELETE FROM "${rt}_References" WHERE "resourceId" IN (SELECT "id" FROM "${rt}" WHERE "content"::text LIKE $1)`, [`%${RUN}%`]).catch(() => { });
      await db.query(`DELETE FROM "${rt}_History" WHERE "id" IN (SELECT "id" FROM "${rt}" WHERE "content"::text LIKE $1)`, [`%${RUN}%`]).catch(() => { });
      await db.query(`DELETE FROM "${rt}" WHERE "content"::text LIKE $1`, [`%${RUN}%`]).catch(() => { });
    } catch { /* ignore */ }
  }
  // Clean lookup tables
  for (const lt of ['HumanName', 'Address', 'ContactPoint', 'Identifier']) {
    try {
      const ids = Object.values(created).flat().map(c => c.id);
      if (ids.length > 0) {
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
        await db.query(`DELETE FROM "${lt}" WHERE "resourceId" IN (${placeholders})`, ids).catch(() => { });
      }
    } catch { /* ignore */ }
  }

  if (db && !db.isClosed) {
    await db.close();
  }
}, 30_000);

// =============================================================================
// Helpers
// =============================================================================

async function create<T extends FhirResource>(resource: T): Promise<T & PersistedResource> {
  const result = await repo.createResource(resource);
  const rt = resource.resourceType;
  if (!created[rt]) created[rt] = [];
  created[rt].push({ id: result.id, resource: result });
  return result;
}

function ref(type: string, idx: number): string {
  return `${type}/${created[type][idx].id}`;
}

/**
 * Deep-compare two FHIR resources, ignoring meta fields that the server sets.
 * Returns list of differences.
 */
function diffResources(original: FhirResource, readBack: FhirResource): string[] {
  const diffs: string[] = [];

  function compare(path: string, a: unknown, b: unknown): void {
    // Skip server-managed meta fields
    if (path === '.meta.versionId' || path === '.meta.lastUpdated') return;

    if (a === b) return;
    if (a === null && b === undefined) return;
    if (a === undefined && b === null) return;

    if (typeof a !== typeof b) {
      diffs.push(`${path}: type mismatch ${typeof a} vs ${typeof b}`);
      return;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        diffs.push(`${path}: array length ${a.length} vs ${b.length}`);
        return;
      }
      for (let i = 0; i < a.length; i++) {
        compare(`${path}[${i}]`, a[i], b[i]);
      }
      return;
    }

    if (typeof a === 'object' && a !== null && b !== null) {
      const aObj = a as Record<string, unknown>;
      const bObj = b as Record<string, unknown>;
      const allKeys = Array.from(new Set([...Object.keys(aObj), ...Object.keys(bObj)]));
      for (const key of allKeys) {
        compare(`${path}.${key}`, aObj[key], bObj[key]);
      }
      return;
    }

    diffs.push(`${path}: "${String(a)}" vs "${String(b)}"`);
  }

  compare('', original, readBack);
  return diffs;
}

// =============================================================================
// Phase A: Create Test Data (15 resource types, ≥5 each, with cross-references)
// =============================================================================

describe('Phase A: Create all test resources (≥5 per type, cross-referenced)', () => {

  // --- 1. Organization (5) ---
  it('creates 5 Organizations', async () => {
    const orgs = [
      { resourceType: 'Organization', name: `Central Hospital-${RUN}`, identifier: [{ system: 'http://example.com/org', value: `ORG-001-${RUN}` }], type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/organization-type', code: 'prov' }] }], telecom: [{ system: 'phone', value: '555-0100' }], address: [{ line: ['100 Main St'], city: 'Springfield', state: 'IL', postalCode: '62701', country: 'US' }] },
      { resourceType: 'Organization', name: `East Wing Lab-${RUN}`, identifier: [{ system: 'http://example.com/org', value: `ORG-002-${RUN}` }], type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/organization-type', code: 'dept' }] }] },
      { resourceType: 'Organization', name: `Pharmacy Services-${RUN}`, identifier: [{ system: 'http://example.com/org', value: `ORG-003-${RUN}` }] },
      { resourceType: 'Organization', name: `Insurance Corp-${RUN}`, identifier: [{ system: 'http://example.com/org', value: `ORG-004-${RUN}` }], type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/organization-type', code: 'ins' }] }] },
      { resourceType: 'Organization', name: `Specialty Clinic-${RUN}`, identifier: [{ system: 'http://example.com/org', value: `ORG-005-${RUN}` }], address: [{ line: ['200 Oak Ave'], city: 'Shelbyville', state: 'IL', postalCode: '62702', country: 'US' }] },
    ];
    for (const org of orgs) {
      await create(org as FhirResource);
    }
    expect(created['Organization']).toHaveLength(5);
  });

  // --- 2. Practitioner (5) ---
  it('creates 5 Practitioners', async () => {
    const pracs = [
      { resourceType: 'Practitioner', name: [{ family: `Smith-${RUN}`, given: ['John', 'A'], prefix: ['Dr.'] }], identifier: [{ system: 'http://example.com/npi', value: `NPI-001-${RUN}` }], gender: 'male', birthDate: '1975-03-15', telecom: [{ system: 'email', value: `john.smith-${RUN}@hospital.com` }], address: [{ line: ['100 Main St'], city: 'Springfield', state: 'IL', postalCode: '62701', country: 'US' }] },
      { resourceType: 'Practitioner', name: [{ family: `Johnson-${RUN}`, given: ['Emily'] }], identifier: [{ system: 'http://example.com/npi', value: `NPI-002-${RUN}` }], gender: 'female' },
      { resourceType: 'Practitioner', name: [{ family: `Williams-${RUN}`, given: ['Robert'] }], identifier: [{ system: 'http://example.com/npi', value: `NPI-003-${RUN}` }], gender: 'male' },
      { resourceType: 'Practitioner', name: [{ family: `Brown-${RUN}`, given: ['Sarah'] }], identifier: [{ system: 'http://example.com/npi', value: `NPI-004-${RUN}` }], gender: 'female' },
      { resourceType: 'Practitioner', name: [{ family: `Davis-${RUN}`, given: ['Michael', 'J'] }], identifier: [{ system: 'http://example.com/npi', value: `NPI-005-${RUN}` }], gender: 'male', telecom: [{ system: 'phone', value: '555-0200' }, { system: 'email', value: `michael.davis-${RUN}@hospital.com` }] },
    ];
    for (const p of pracs) {
      await create(p as FhirResource);
    }
    expect(created['Practitioner']).toHaveLength(5);
  });

  // --- 3. PractitionerRole (5) — references Practitioner + Organization ---
  it('creates 5 PractitionerRoles referencing Practitioners and Organizations', async () => {
    const roles = [
      { resourceType: 'PractitionerRole', practitioner: { reference: ref('Practitioner', 0) }, organization: { reference: ref('Organization', 0) }, code: [{ coding: [{ system: 'http://snomed.info/sct', code: '59058001', display: `GP-${RUN}` }] }], active: true },
      { resourceType: 'PractitionerRole', practitioner: { reference: ref('Practitioner', 1) }, organization: { reference: ref('Organization', 1) }, code: [{ coding: [{ system: 'http://snomed.info/sct', code: '61246008', display: `Lab-${RUN}` }] }] },
      { resourceType: 'PractitionerRole', practitioner: { reference: ref('Practitioner', 2) }, organization: { reference: ref('Organization', 0) }, code: [{ coding: [{ system: 'http://snomed.info/sct', code: '304292004', display: `Surgeon-${RUN}` }] }] },
      { resourceType: 'PractitionerRole', practitioner: { reference: ref('Practitioner', 3) }, organization: { reference: ref('Organization', 2) }, code: [{ coding: [{ system: 'http://snomed.info/sct', code: '46255001', display: `Pharmacist-${RUN}` }] }] },
      { resourceType: 'PractitionerRole', practitioner: { reference: ref('Practitioner', 4) }, organization: { reference: ref('Organization', 4) }, code: [{ coding: [{ system: 'http://snomed.info/sct', code: '309343006', display: `Specialist-${RUN}` }] }] },
    ];
    for (const r of roles) {
      await create(r as FhirResource);
    }
    expect(created['PractitionerRole']).toHaveLength(5);
  });

  // --- 4. Patient (7 — extra to test variety) — references Organization + Practitioner ---
  it('creates 7 Patients with rich data (names, addresses, identifiers, contacts)', async () => {
    const patients = [
      {
        resourceType: 'Patient', active: true, gender: 'male', birthDate: '1985-06-15',
        name: [{ use: 'official', family: `Doe-${RUN}`, given: ['John', 'Michael'] }, { use: 'nickname', given: ['Johnny'] }],
        identifier: [{ system: 'http://example.com/mrn', value: `MRN-001-${RUN}` }, { system: 'http://example.com/ssn', value: `SSN-001-${RUN}` }],
        telecom: [{ system: 'phone', value: '555-1001', use: 'home' }, { system: 'email', value: `john.doe-${RUN}@example.com`, use: 'work' }],
        address: [{ use: 'home', line: ['123 Elm St', 'Apt 4B'], city: 'Springfield', state: 'IL', postalCode: '62701', country: 'US' }],
        managingOrganization: { reference: ref('Organization', 0) },
        generalPractitioner: [{ reference: ref('Practitioner', 0) }],
        meta: { tag: [{ system: 'http://example.com/tags', code: `vip-${RUN}` }] },
        maritalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus', code: 'M', display: 'Married' }] },
        communication: [{ language: { coding: [{ system: 'urn:ietf:bcp:47', code: 'en' }] } }],
      },
      {
        resourceType: 'Patient', active: true, gender: 'female', birthDate: '1990-11-22',
        name: [{ use: 'official', family: `Smith-${RUN}`, given: ['Jane', 'Elizabeth'] }],
        identifier: [{ system: 'http://example.com/mrn', value: `MRN-002-${RUN}` }],
        telecom: [{ system: 'phone', value: '555-1002' }],
        address: [{ use: 'home', line: ['456 Oak Ave'], city: 'Chicago', state: 'IL', postalCode: '60601', country: 'US' }],
        managingOrganization: { reference: ref('Organization', 0) },
      },
      {
        resourceType: 'Patient', active: true, gender: 'male', birthDate: '1978-01-30',
        name: [{ use: 'official', family: `Williams-${RUN}`, given: ['Robert'] }],
        identifier: [{ system: 'http://example.com/mrn', value: `MRN-003-${RUN}` }],
        address: [{ line: ['789 Pine Rd'], city: 'Shelbyville', state: 'IL', postalCode: '62702', country: 'US' }, { use: 'work', line: ['100 Main St'], city: 'Springfield', state: 'IL' }],
        generalPractitioner: [{ reference: ref('Practitioner', 2) }],
        meta: { tag: [{ system: 'http://example.com/tags', code: `urgent-${RUN}` }, { system: 'http://example.com/tags', code: `flagged-${RUN}` }], security: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'R' }] },
      },
      {
        resourceType: 'Patient', active: false, gender: 'female', birthDate: '2005-08-10',
        name: [{ use: 'official', family: `Davis-${RUN}`, given: ['Alice'] }],
        identifier: [{ system: 'http://example.com/mrn', value: `MRN-004-${RUN}` }],
        deceasedBoolean: false,
      },
      {
        resourceType: 'Patient', active: true, gender: 'other', birthDate: '2000-03-01',
        name: [{ use: 'official', family: `Garcia-${RUN}`, given: ['Alex', 'M'] }],
        identifier: [{ system: 'http://example.com/mrn', value: `MRN-005-${RUN}` }],
        telecom: [{ system: 'email', value: `alex.garcia-${RUN}@example.com` }],
      },
      {
        resourceType: 'Patient', active: true, gender: 'male', birthDate: '1960-12-25',
        name: [{ use: 'official', family: `Wilson-${RUN}`, given: ['George'] }],
        identifier: [{ system: 'http://example.com/mrn', value: `MRN-006-${RUN}` }],
        deceasedDateTime: '2025-01-15T10:30:00Z',
      },
      {
        resourceType: 'Patient', active: true, gender: 'female', birthDate: '1995-07-04',
        name: [{ use: 'official', family: `Martinez-${RUN}`, given: ['Sofia', 'Isabella'] }, { use: 'maiden', family: `Lopez-${RUN}` }],
        identifier: [{ system: 'http://example.com/mrn', value: `MRN-007-${RUN}` }, { system: 'http://example.com/passport', value: `PP-007-${RUN}` }],
        telecom: [{ system: 'phone', value: '555-1007', use: 'mobile' }, { system: 'phone', value: '555-1008', use: 'home' }, { system: 'email', value: `sofia-${RUN}@example.com` }],
        address: [{ use: 'home', line: ['1000 Maple Dr'], city: 'Capital City', state: 'CA', postalCode: '90001', country: 'US' }, { use: 'temp', city: 'TempCity', state: 'NY' }],
        contact: [{ relationship: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0131', code: 'N' }] }], name: { family: `EmergencyContact-${RUN}`, given: ['Carlos'] }, telecom: [{ system: 'phone', value: '555-9999' }] }],
      },
    ];
    for (const p of patients) {
      await create(p as FhirResource);
    }
    expect(created['Patient']).toHaveLength(7);
  });

  // --- 5. Medication (5) ---
  it('creates 5 Medications', async () => {
    const meds = [
      { resourceType: 'Medication', code: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '1049502', display: `Acetaminophen-${RUN}` }] }, status: 'active' },
      { resourceType: 'Medication', code: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '197361', display: `Amoxicillin-${RUN}` }] }, status: 'active', manufacturer: { reference: ref('Organization', 2) } },
      { resourceType: 'Medication', code: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '310965', display: `Lisinopril-${RUN}` }] }, status: 'active' },
      { resourceType: 'Medication', code: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '860975', display: `Metformin-${RUN}` }] }, status: 'active' },
      { resourceType: 'Medication', code: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '198440', display: `Omeprazole-${RUN}` }] }, status: 'inactive' },
    ];
    for (const m of meds) {
      await create(m as FhirResource);
    }
    expect(created['Medication']).toHaveLength(5);
  });

  // --- 6. Encounter (6) — references Patient + Organization + Practitioner ---
  it('creates 6 Encounters referencing Patients, Organizations, Practitioners', async () => {
    const encounters = [
      { resourceType: 'Encounter', status: 'finished', class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: `Ambulatory-${RUN}` }, subject: { reference: ref('Patient', 0) }, serviceProvider: { reference: ref('Organization', 0) }, participant: [{ individual: { reference: ref('Practitioner', 0) } }], period: { start: '2025-01-10T08:00:00Z', end: '2025-01-10T09:00:00Z' }, type: [{ coding: [{ system: 'http://snomed.info/sct', code: '308335008', display: `OPD-${RUN}` }] }] },
      { resourceType: 'Encounter', status: 'finished', class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'IMP' }, subject: { reference: ref('Patient', 0) }, serviceProvider: { reference: ref('Organization', 0) }, period: { start: '2025-02-01T10:00:00Z', end: '2025-02-05T14:00:00Z' } },
      { resourceType: 'Encounter', status: 'finished', class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB' }, subject: { reference: ref('Patient', 1) }, serviceProvider: { reference: ref('Organization', 0) }, participant: [{ individual: { reference: ref('Practitioner', 1) } }], period: { start: '2025-03-15T14:00:00Z' } },
      { resourceType: 'Encounter', status: 'in-progress', class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'EMER' }, subject: { reference: ref('Patient', 2) }, serviceProvider: { reference: ref('Organization', 0) }, period: { start: '2026-02-25T10:00:00Z' } },
      { resourceType: 'Encounter', status: 'planned', class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB' }, subject: { reference: ref('Patient', 3) }, period: { start: '2026-03-01T09:00:00Z' } },
      { resourceType: 'Encounter', status: 'finished', class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB' }, subject: { reference: ref('Patient', 6) }, serviceProvider: { reference: ref('Organization', 4) }, participant: [{ individual: { reference: ref('Practitioner', 4) } }], period: { start: '2025-06-01T11:00:00Z', end: '2025-06-01T12:00:00Z' } },
    ];
    for (const e of encounters) {
      await create(e as FhirResource);
    }
    expect(created['Encounter']).toHaveLength(6);
  });

  // --- 7. Observation (8) — references Patient + Encounter ---
  it('creates 8 Observations with different value types', async () => {
    const observations = [
      { resourceType: 'Observation', status: 'final', code: { coding: [{ system: 'http://loinc.org', code: '29463-7', display: `BodyWeight-${RUN}` }] }, subject: { reference: ref('Patient', 0) }, encounter: { reference: ref('Encounter', 0) }, valueQuantity: { value: 75.5, unit: 'kg', system: 'http://unitsofmeasure.org', code: 'kg' }, effectiveDateTime: '2025-01-10T08:30:00Z', category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }] },
      { resourceType: 'Observation', status: 'final', code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: `HeartRate-${RUN}` }] }, subject: { reference: ref('Patient', 0) }, encounter: { reference: ref('Encounter', 0) }, valueQuantity: { value: 72, unit: '/min', system: 'http://unitsofmeasure.org', code: '/min' }, effectiveDateTime: '2025-01-10T08:30:00Z' },
      { resourceType: 'Observation', status: 'final', code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: `BP-${RUN}` }] }, subject: { reference: ref('Patient', 0) }, encounter: { reference: ref('Encounter', 1) }, component: [{ code: { coding: [{ system: 'http://loinc.org', code: '8480-6' }] }, valueQuantity: { value: 120, unit: 'mmHg' } }, { code: { coding: [{ system: 'http://loinc.org', code: '8462-4' }] }, valueQuantity: { value: 80, unit: 'mmHg' } }], effectiveDateTime: '2025-02-01T10:30:00Z' },
      { resourceType: 'Observation', status: 'final', code: { coding: [{ system: 'http://loinc.org', code: '2339-0', display: `Glucose-${RUN}` }] }, subject: { reference: ref('Patient', 1) }, encounter: { reference: ref('Encounter', 2) }, valueQuantity: { value: 95, unit: 'mg/dL' }, effectiveDateTime: '2025-03-15T14:30:00Z', interpretation: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: 'N', display: 'Normal' }] }] },
      { resourceType: 'Observation', status: 'final', code: { coding: [{ system: 'http://loinc.org', code: '718-7', display: `Hemoglobin-${RUN}` }] }, subject: { reference: ref('Patient', 2) }, valueQuantity: { value: 14.2, unit: 'g/dL' }, effectiveDateTime: '2025-04-01' },
      { resourceType: 'Observation', status: 'preliminary', code: { coding: [{ system: 'http://loinc.org', code: '6690-2', display: `WBC-${RUN}` }] }, subject: { reference: ref('Patient', 2) }, encounter: { reference: ref('Encounter', 3) }, valueQuantity: { value: 8500, unit: '/uL' }, effectiveDateTime: '2026-02-25T10:30:00Z' },
      { resourceType: 'Observation', status: 'final', code: { coding: [{ system: 'http://loinc.org', code: '39156-5', display: `BMI-${RUN}` }] }, subject: { reference: ref('Patient', 6) }, encounter: { reference: ref('Encounter', 5) }, valueQuantity: { value: 22.1, unit: 'kg/m2' }, effectiveDateTime: '2025-06-01T11:30:00Z' },
      { resourceType: 'Observation', status: 'final', code: { coding: [{ system: 'http://loinc.org', code: '8310-5', display: `BodyTemp-${RUN}` }] }, subject: { reference: ref('Patient', 6) }, valueQuantity: { value: 37.2, unit: 'Cel' }, effectiveDateTime: '2025-06-01T11:35:00Z' },
    ];
    for (const o of observations) {
      await create(o as FhirResource);
    }
    expect(created['Observation']).toHaveLength(8);
  });

  // --- 8. Condition (5) — references Patient + Encounter ---
  it('creates 5 Conditions', async () => {
    const conditions = [
      { resourceType: 'Condition', clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] }, verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }] }, code: { coding: [{ system: 'http://snomed.info/sct', code: '44054006', display: `Type2DM-${RUN}` }] }, subject: { reference: ref('Patient', 0) }, encounter: { reference: ref('Encounter', 0) }, onsetDateTime: '2020-01-01' },
      { resourceType: 'Condition', clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] }, verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }] }, code: { coding: [{ system: 'http://snomed.info/sct', code: '38341003', display: `Hypertension-${RUN}` }] }, subject: { reference: ref('Patient', 0) }, onsetDateTime: '2018-06-15' },
      { resourceType: 'Condition', clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'resolved' }] }, code: { coding: [{ system: 'http://snomed.info/sct', code: '195662009', display: `Pneumonia-${RUN}` }] }, subject: { reference: ref('Patient', 1) }, encounter: { reference: ref('Encounter', 2) }, onsetDateTime: '2025-03-10', abatementDateTime: '2025-03-25' },
      { resourceType: 'Condition', clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] }, code: { coding: [{ system: 'http://snomed.info/sct', code: '73211009', display: `DiabetesI-${RUN}` }] }, subject: { reference: ref('Patient', 2) }, onsetDateTime: '2010-05-01' },
      { resourceType: 'Condition', clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] }, code: { coding: [{ system: 'http://snomed.info/sct', code: '195967001', display: `Asthma-${RUN}` }] }, subject: { reference: ref('Patient', 6) }, encounter: { reference: ref('Encounter', 5) }, onsetDateTime: '2015-08-20' },
    ];
    for (const c of conditions) {
      await create(c as FhirResource);
    }
    expect(created['Condition']).toHaveLength(5);
  });

  // --- 9. DiagnosticReport (5) — references Patient + Encounter + Observation ---
  it('creates 5 DiagnosticReports referencing Observations', async () => {
    const reports = [
      { resourceType: 'DiagnosticReport', status: 'final', code: { coding: [{ system: 'http://loinc.org', code: '58410-2', display: `CBC-${RUN}` }] }, subject: { reference: ref('Patient', 0) }, encounter: { reference: ref('Encounter', 0) }, result: [{ reference: ref('Observation', 0) }, { reference: ref('Observation', 1) }], effectiveDateTime: '2025-01-10T09:00:00Z', issued: '2025-01-10T10:00:00Z' },
      { resourceType: 'DiagnosticReport', status: 'final', code: { coding: [{ system: 'http://loinc.org', code: '24323-8', display: `CMP-${RUN}` }] }, subject: { reference: ref('Patient', 0) }, encounter: { reference: ref('Encounter', 1) }, result: [{ reference: ref('Observation', 2) }], effectiveDateTime: '2025-02-01T11:00:00Z' },
      { resourceType: 'DiagnosticReport', status: 'final', code: { coding: [{ system: 'http://loinc.org', code: '2339-0', display: `GlucoseReport-${RUN}` }] }, subject: { reference: ref('Patient', 1) }, result: [{ reference: ref('Observation', 3) }], effectiveDateTime: '2025-03-15T15:00:00Z' },
      { resourceType: 'DiagnosticReport', status: 'preliminary', code: { coding: [{ system: 'http://loinc.org', code: '58410-2', display: `CBC2-${RUN}` }] }, subject: { reference: ref('Patient', 2) }, result: [{ reference: ref('Observation', 4) }, { reference: ref('Observation', 5) }], effectiveDateTime: '2026-02-25T11:00:00Z' },
      { resourceType: 'DiagnosticReport', status: 'final', code: { coding: [{ system: 'http://loinc.org', code: '55399-0', display: `Vitals-${RUN}` }] }, subject: { reference: ref('Patient', 6) }, encounter: { reference: ref('Encounter', 5) }, result: [{ reference: ref('Observation', 6) }, { reference: ref('Observation', 7) }], effectiveDateTime: '2025-06-01T12:00:00Z' },
    ];
    for (const r of reports) {
      await create(r as FhirResource);
    }
    expect(created['DiagnosticReport']).toHaveLength(5);
  });

  // --- 10. MedicationRequest (5) — references Patient + Encounter + Practitioner + Medication ---
  it('creates 5 MedicationRequests', async () => {
    const requests = [
      { resourceType: 'MedicationRequest', status: 'active', intent: 'order', medicationReference: { reference: ref('Medication', 0) }, subject: { reference: ref('Patient', 0) }, encounter: { reference: ref('Encounter', 0) }, requester: { reference: ref('Practitioner', 0) }, authoredOn: '2025-01-10', dosageInstruction: [{ text: `Take 500mg PRN-${RUN}`, timing: { repeat: { frequency: 3, period: 1, periodUnit: 'd' } } }] },
      { resourceType: 'MedicationRequest', status: 'active', intent: 'order', medicationReference: { reference: ref('Medication', 1) }, subject: { reference: ref('Patient', 0) }, requester: { reference: ref('Practitioner', 0) }, authoredOn: '2025-02-01', dosageInstruction: [{ text: `250mg TID-${RUN}` }] },
      { resourceType: 'MedicationRequest', status: 'active', intent: 'order', medicationReference: { reference: ref('Medication', 2) }, subject: { reference: ref('Patient', 1) }, requester: { reference: ref('Practitioner', 1) }, authoredOn: '2025-03-15' },
      { resourceType: 'MedicationRequest', status: 'stopped', intent: 'order', medicationReference: { reference: ref('Medication', 3) }, subject: { reference: ref('Patient', 2) }, requester: { reference: ref('Practitioner', 2) }, authoredOn: '2025-04-01' },
      { resourceType: 'MedicationRequest', status: 'active', intent: 'plan', medicationReference: { reference: ref('Medication', 4) }, subject: { reference: ref('Patient', 6) }, encounter: { reference: ref('Encounter', 5) }, requester: { reference: ref('Practitioner', 4) }, authoredOn: '2025-06-01' },
    ];
    for (const r of requests) {
      await create(r as FhirResource);
    }
    expect(created['MedicationRequest']).toHaveLength(5);
  });

  // --- 11. AllergyIntolerance (5) — references Patient ---
  it('creates 5 AllergyIntolerances', async () => {
    const allergies = [
      { resourceType: 'AllergyIntolerance', clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }] }, verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'confirmed' }] }, type: 'allergy', category: ['medication'], code: { coding: [{ system: 'http://snomed.info/sct', code: '387458008', display: `Aspirin-${RUN}` }] }, patient: { reference: ref('Patient', 0) }, onsetDateTime: '2015-01-01', reaction: [{ manifestation: [{ coding: [{ system: 'http://snomed.info/sct', code: '271807003', display: 'Rash' }] }], severity: 'moderate' }] },
      { resourceType: 'AllergyIntolerance', clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }] }, type: 'allergy', category: ['food'], code: { coding: [{ system: 'http://snomed.info/sct', code: '91935009', display: `Peanut-${RUN}` }] }, patient: { reference: ref('Patient', 0) } },
      { resourceType: 'AllergyIntolerance', clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }] }, type: 'intolerance', category: ['medication'], code: { coding: [{ system: 'http://snomed.info/sct', code: '372687004', display: `Penicillin-${RUN}` }] }, patient: { reference: ref('Patient', 1) } },
      { resourceType: 'AllergyIntolerance', clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'resolved' }] }, code: { coding: [{ system: 'http://snomed.info/sct', code: '264295007', display: `Latex-${RUN}` }] }, patient: { reference: ref('Patient', 2) } },
      { resourceType: 'AllergyIntolerance', clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }] }, type: 'allergy', category: ['environment'], code: { coding: [{ system: 'http://snomed.info/sct', code: '256259004', display: `Pollen-${RUN}` }] }, patient: { reference: ref('Patient', 6) } },
    ];
    for (const a of allergies) {
      await create(a as FhirResource);
    }
    expect(created['AllergyIntolerance']).toHaveLength(5);
  });

  // --- 12. Procedure (5) — references Patient + Encounter + Practitioner ---
  it('creates 5 Procedures', async () => {
    const procedures = [
      { resourceType: 'Procedure', status: 'completed', code: { coding: [{ system: 'http://snomed.info/sct', code: '80146002', display: `Appendectomy-${RUN}` }] }, subject: { reference: ref('Patient', 0) }, encounter: { reference: ref('Encounter', 1) }, performedDateTime: '2025-02-03T14:00:00Z', performer: [{ actor: { reference: ref('Practitioner', 2) } }] },
      { resourceType: 'Procedure', status: 'completed', code: { coding: [{ system: 'http://snomed.info/sct', code: '232717009', display: `Coronography-${RUN}` }] }, subject: { reference: ref('Patient', 0) }, performedPeriod: { start: '2025-02-04T08:00:00Z', end: '2025-02-04T10:00:00Z' } },
      { resourceType: 'Procedure', status: 'completed', code: { coding: [{ system: 'http://snomed.info/sct', code: '36969009', display: `BloodDraw-${RUN}` }] }, subject: { reference: ref('Patient', 1) }, encounter: { reference: ref('Encounter', 2) }, performedDateTime: '2025-03-15T14:15:00Z' },
      { resourceType: 'Procedure', status: 'in-progress', code: { coding: [{ system: 'http://snomed.info/sct', code: '418891003', display: `Dressing-${RUN}` }] }, subject: { reference: ref('Patient', 2) }, encounter: { reference: ref('Encounter', 3) }, performedDateTime: '2026-02-25T11:00:00Z' },
      { resourceType: 'Procedure', status: 'completed', code: { coding: [{ system: 'http://snomed.info/sct', code: '274025005', display: `EKG-${RUN}` }] }, subject: { reference: ref('Patient', 6) }, encounter: { reference: ref('Encounter', 5) }, performedDateTime: '2025-06-01T11:45:00Z' },
    ];
    for (const p of procedures) {
      await create(p as FhirResource);
    }
    expect(created['Procedure']).toHaveLength(5);
  });

  // --- 13. ServiceRequest (5) — references Patient + Encounter + Practitioner ---
  it('creates 5 ServiceRequests', async () => {
    const requests = [
      { resourceType: 'ServiceRequest', status: 'active', intent: 'order', code: { coding: [{ system: 'http://snomed.info/sct', code: '26604007', display: `FBC-${RUN}` }] }, subject: { reference: ref('Patient', 0) }, encounter: { reference: ref('Encounter', 0) }, requester: { reference: ref('Practitioner', 0) }, authoredOn: '2025-01-10' },
      { resourceType: 'ServiceRequest', status: 'completed', intent: 'order', code: { coding: [{ system: 'http://snomed.info/sct', code: '77477000', display: `CTScan-${RUN}` }] }, subject: { reference: ref('Patient', 0) }, encounter: { reference: ref('Encounter', 1) }, authoredOn: '2025-02-01' },
      { resourceType: 'ServiceRequest', status: 'active', intent: 'order', code: { coding: [{ system: 'http://snomed.info/sct', code: '104001', display: `Excision-${RUN}` }] }, subject: { reference: ref('Patient', 1) }, authoredOn: '2025-03-15' },
      { resourceType: 'ServiceRequest', status: 'active', intent: 'order', code: { coding: [{ system: 'http://snomed.info/sct', code: '252275004', display: `Imaging-${RUN}` }] }, subject: { reference: ref('Patient', 2) }, encounter: { reference: ref('Encounter', 3) }, authoredOn: '2026-02-25' },
      { resourceType: 'ServiceRequest', status: 'active', intent: 'plan', code: { coding: [{ system: 'http://snomed.info/sct', code: '409063005', display: `Counseling-${RUN}` }] }, subject: { reference: ref('Patient', 6) }, authoredOn: '2025-06-01' },
    ];
    for (const r of requests) {
      await create(r as FhirResource);
    }
    expect(created['ServiceRequest']).toHaveLength(5);
  });

  // --- 14. CarePlan (5) — references Patient + Encounter + Condition ---
  it('creates 5 CarePlans', async () => {
    const plans = [
      { resourceType: 'CarePlan', status: 'active', intent: 'plan', title: `DM Management-${RUN}`, subject: { reference: ref('Patient', 0) }, encounter: { reference: ref('Encounter', 0) }, addresses: [{ reference: ref('Condition', 0) }], category: [{ coding: [{ system: 'http://hl7.org/fhir/us/core/CodeSystem/careplan-category', code: 'assess-plan' }] }] },
      { resourceType: 'CarePlan', status: 'active', intent: 'plan', title: `HTN Management-${RUN}`, subject: { reference: ref('Patient', 0) }, addresses: [{ reference: ref('Condition', 1) }] },
      { resourceType: 'CarePlan', status: 'completed', intent: 'plan', title: `Pneumonia Recovery-${RUN}`, subject: { reference: ref('Patient', 1) }, addresses: [{ reference: ref('Condition', 2) }] },
      { resourceType: 'CarePlan', status: 'active', intent: 'plan', title: `DM1 Care-${RUN}`, subject: { reference: ref('Patient', 2) }, addresses: [{ reference: ref('Condition', 3) }] },
      { resourceType: 'CarePlan', status: 'active', intent: 'plan', title: `Asthma Action-${RUN}`, subject: { reference: ref('Patient', 6) }, encounter: { reference: ref('Encounter', 5) }, addresses: [{ reference: ref('Condition', 4) }] },
    ];
    for (const p of plans) {
      await create(p as FhirResource);
    }
    expect(created['CarePlan']).toHaveLength(5);
  });

  // --- 15. Immunization (5) — references Patient + Encounter ---
  it('creates 5 Immunizations', async () => {
    const immunizations = [
      { resourceType: 'Immunization', status: 'completed', vaccineCode: { coding: [{ system: 'http://hl7.org/fhir/sid/cvx', code: '208', display: `COVID19-${RUN}` }] }, patient: { reference: ref('Patient', 0) }, occurrenceDateTime: '2025-01-15T09:00:00Z', encounter: { reference: ref('Encounter', 0) } },
      { resourceType: 'Immunization', status: 'completed', vaccineCode: { coding: [{ system: 'http://hl7.org/fhir/sid/cvx', code: '141', display: `Influenza-${RUN}` }] }, patient: { reference: ref('Patient', 0) }, occurrenceDateTime: '2025-10-01' },
      { resourceType: 'Immunization', status: 'completed', vaccineCode: { coding: [{ system: 'http://hl7.org/fhir/sid/cvx', code: '08', display: `HepB-${RUN}` }] }, patient: { reference: ref('Patient', 1) }, occurrenceDateTime: '2025-04-01' },
      { resourceType: 'Immunization', status: 'not-done', vaccineCode: { coding: [{ system: 'http://hl7.org/fhir/sid/cvx', code: '03', display: `MMR-${RUN}` }] }, patient: { reference: ref('Patient', 3) }, occurrenceDateTime: '2025-05-01', statusReason: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason', code: 'MEDPREC' }] } },
      { resourceType: 'Immunization', status: 'completed', vaccineCode: { coding: [{ system: 'http://hl7.org/fhir/sid/cvx', code: '113', display: `Tdap-${RUN}` }] }, patient: { reference: ref('Patient', 6) }, occurrenceDateTime: '2025-06-01', encounter: { reference: ref('Encounter', 5) } },
    ];
    for (const i of immunizations) {
      await create(i as FhirResource);
    }
    expect(created['Immunization']).toHaveLength(5);
  });

  it('summary: total resources created', () => {
    const total = Object.values(created).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`\n[Full-Stack] Created ${total} resources across ${RESOURCE_TYPES.length} types (run=${RUN})`);
    expect(total).toBeGreaterThanOrEqual(76); // 5+5+5+7+5+6+8+5+5+5+5+5+5+5+5=86
  });
}, 120_000);

// =============================================================================
// Phase B: Read-Back & Content Integrity
// =============================================================================

describe('Phase B: Read-back and JSON content integrity', () => {

  it('every created resource can be read back by id', async () => {
    let passed = 0;
    let failed = 0;
    const failures: string[] = [];

    for (const [rt, resources] of Object.entries(created)) {
      for (const { id } of resources) {
        try {
          const readBack = await repo.readResource(rt, id);
          expect(readBack).toBeDefined();
          expect(readBack.id).toBe(id);
          expect(readBack.resourceType).toBe(rt);
          passed++;
        } catch (err) {
          failed++;
          failures.push(`${rt}/${id}: ${String(err)}`);
        }
      }
    }

    console.log(`[Read-Back] ${passed} passed, ${failed} failed`);
    if (failures.length > 0) {
      console.log('[Read-Back] Failures:', failures.join('\n'));
    }
    expect(failed).toBe(0);
  }, 60_000);

  it('read-back JSON preserves all resource fields (ignoring server-generated meta)', async () => {
    let totalDiffs = 0;
    const allDiffs: string[] = [];

    for (const [rt, resources] of Object.entries(created)) {
      for (const { id, resource: original } of resources) {
        const readBack = await repo.readResource(rt, id);
        const diffs = diffResources(original as FhirResource, readBack as FhirResource);
        if (diffs.length > 0) {
          totalDiffs += diffs.length;
          allDiffs.push(`${rt}/${id}:\n  ${diffs.join('\n  ')}`);
        }
      }
    }

    console.log(`[Content Integrity] ${totalDiffs} field differences found`);
    if (allDiffs.length > 0) {
      console.log('[Content Integrity] Diffs:', allDiffs.join('\n'));
    }
    expect(totalDiffs).toBe(0);
  }, 60_000);

}, 120_000);

// =============================================================================
// Phase C: SQL-Layer Verification
// =============================================================================

describe('Phase C: SQL-layer verification', () => {

  // C1: Main table row exists with correct fixed columns
  it('C1: every resource has a main table row with correct fixed columns', async () => {
    let passed = 0;
    const failures: string[] = [];

    for (const [rt, resources] of Object.entries(created)) {
      for (const { id, resource: original } of resources) {
        try {
          const result = await db.query<{
            id: string;
            deleted: boolean;
            __version: number;
            projectId: string;
            content: string;
          }>(
            `SELECT "id", "deleted", "__version", "projectId", "content" FROM "${rt}" WHERE "id" = $1`,
            [id],
          );
          expect(result.rows).toHaveLength(1);
          const row = result.rows[0];
          expect(row.deleted).toBe(false);
          expect(row.__version).toBe(1);
          // content JSON should parse to same resource
          const parsed = JSON.parse(row.content);
          expect(parsed.id).toBe(id);
          expect(parsed.resourceType).toBe(rt);
          passed++;
        } catch (err) {
          failures.push(`${rt}/${id}: ${String(err)}`);
        }
      }
    }

    console.log(`[C1: Main Table] ${passed} passed, ${failures.length} failed`);
    expect(failures).toHaveLength(0);
  }, 60_000);

  // C2: History table has exactly 1 row per resource (since only created, not updated)
  it('C2: history table has exactly 1 row per resource', async () => {
    let passed = 0;
    const failures: string[] = [];

    for (const [rt, resources] of Object.entries(created)) {
      for (const { id } of resources) {
        try {
          const result = await db.query<{ cnt: string }>(
            `SELECT COUNT(*) as cnt FROM "${rt}_History" WHERE "id" = $1`,
            [id],
          );
          expect(Number(result.rows[0].cnt)).toBe(1);
          passed++;
        } catch (err) {
          failures.push(`${rt}/${id}: ${String(err)}`);
        }
      }
    }

    console.log(`[C2: History] ${passed} passed, ${failures.length} failed`);
    expect(failures).toHaveLength(0);
  }, 60_000);

  // C3: Reference table rows exist for resources with references
  it('C3: reference rows are written for resources with outgoing references', async () => {
    // Check Encounter -> Patient references (all encounters have subject)
    let totalRefRows = 0;
    const failures: string[] = [];

    for (const { id } of created['Encounter'] ?? []) {
      try {
        const result = await db.query<{ cnt: string }>(
          `SELECT COUNT(*) as cnt FROM "Encounter_References" WHERE "resourceId" = $1`,
          [id],
        );
        const cnt = Number(result.rows[0].cnt);
        expect(cnt).toBeGreaterThan(0);
        totalRefRows += cnt;
      } catch (err) {
        failures.push(`Encounter/${id}: ${String(err)}`);
      }
    }

    // Check Observation -> Patient references
    for (const { id } of created['Observation'] ?? []) {
      try {
        const result = await db.query<{ cnt: string }>(
          `SELECT COUNT(*) as cnt FROM "Observation_References" WHERE "resourceId" = $1`,
          [id],
        );
        const cnt = Number(result.rows[0].cnt);
        expect(cnt).toBeGreaterThan(0);
        totalRefRows += cnt;
      } catch (err) {
        failures.push(`Observation/${id}: ${String(err)}`);
      }
    }

    console.log(`[C3: References] ${totalRefRows} reference rows verified`);
    expect(failures).toHaveLength(0);
  }, 60_000);

  // C4: Lookup table rows exist for resources with HumanName, Address, ContactPoint, Identifier
  it('C4: HumanName lookup rows for Patients', async () => {
    let totalRows = 0;
    const failures: string[] = [];

    for (const { id } of created['Patient'] ?? []) {
      try {
        const result = await db.query<{ cnt: string }>(
          `SELECT COUNT(*) as cnt FROM "HumanName" WHERE "resourceId" = $1`,
          [id],
        );
        const cnt = Number(result.rows[0].cnt);
        expect(cnt).toBeGreaterThan(0); // Every patient has at least one name
        totalRows += cnt;
      } catch (err) {
        failures.push(`Patient/${id}: ${String(err)}`);
      }
    }

    // Also check Practitioner HumanName rows
    for (const { id } of created['Practitioner'] ?? []) {
      try {
        const result = await db.query<{ cnt: string }>(
          `SELECT COUNT(*) as cnt FROM "HumanName" WHERE "resourceId" = $1`,
          [id],
        );
        const cnt = Number(result.rows[0].cnt);
        expect(cnt).toBeGreaterThan(0);
        totalRows += cnt;
      } catch (err) {
        failures.push(`Practitioner/${id}: ${String(err)}`);
      }
    }

    console.log(`[C4: HumanName] ${totalRows} lookup rows verified`);
    expect(failures).toHaveLength(0);
  }, 30_000);

  it('C4b: Address lookup rows for Patients with addresses', async () => {
    let totalRows = 0;
    // Patient indices with addresses: 0, 1, 2, 6
    const patientsWithAddress = [0, 1, 2, 6];
    for (const idx of patientsWithAddress) {
      const { id } = created['Patient'][idx];
      const result = await db.query<{ cnt: string }>(
        `SELECT COUNT(*) as cnt FROM "Address" WHERE "resourceId" = $1`,
        [id],
      );
      const cnt = Number(result.rows[0].cnt);
      expect(cnt).toBeGreaterThan(0);
      totalRows += cnt;
    }
    console.log(`[C4b: Address] ${totalRows} lookup rows verified`);
    expect(totalRows).toBeGreaterThanOrEqual(4);
  }, 15_000);

  it('C4c: ContactPoint lookup rows for resources with telecom', async () => {
    let totalRows = 0;
    // Patient 0 has 2 telecoms, Patient 6 has 3 telecoms
    for (const idx of [0, 6]) {
      const { id } = created['Patient'][idx];
      const result = await db.query<{ cnt: string }>(
        `SELECT COUNT(*) as cnt FROM "ContactPoint" WHERE "resourceId" = $1`,
        [id],
      );
      const cnt = Number(result.rows[0].cnt);
      expect(cnt).toBeGreaterThan(0);
      totalRows += cnt;
    }
    console.log(`[C4c: ContactPoint] ${totalRows} lookup rows verified`);
    expect(totalRows).toBeGreaterThanOrEqual(5);
  }, 15_000);

  it('C4d: Identifier token columns populated for Patients with identifiers', async () => {
    // NOTE: Identifier uses token-column strategy (stored in main table as __identifier UUID[],
    // __identifierText TEXT[]), NOT the Identifier lookup table. This matches Medplum's design.
    let passed = 0;
    for (const { id } of created['Patient'] ?? []) {
      const result = await db.query<{ '__identifierText': string[] }>(
        `SELECT "__identifierText" FROM "Patient" WHERE "id" = $1`,
        [id],
      );
      const texts = result.rows[0]['__identifierText'];
      expect(texts).toBeDefined();
      expect(texts.length).toBeGreaterThan(0);
      passed++;
    }
    console.log(`[C4d: Identifier tokens] ${passed} patients verified with identifier token columns`);
  }, 15_000);

  // C5: Metadata columns — ___tag / ___security
  it('C5: metadata columns (___tag, ___security) for tagged patients', async () => {
    // Patient 0 has 1 tag, Patient 2 has 2 tags + 1 security
    const p0 = created['Patient'][0];
    const result0 = await db.query<{ '___tagText': string[] }>(
      `SELECT "___tagText" FROM "Patient" WHERE "id" = $1`,
      [p0.id],
    );
    expect(result0.rows[0]['___tagText']).toContain(`http://example.com/tags|vip-${RUN}`);

    const p2 = created['Patient'][2];
    const result2 = await db.query<{ '___tagText': string[]; '___securityText': string[] }>(
      `SELECT "___tagText", "___securityText" FROM "Patient" WHERE "id" = $1`,
      [p2.id],
    );
    expect(result2.rows[0]['___tagText']).toHaveLength(2);
    expect(result2.rows[0]['___securityText']).toContain('http://terminology.hl7.org/CodeSystem/v3-Confidentiality|R');
  }, 15_000);

  // C6: Compartments — patients have own ID as compartment, observations have patient ID
  it('C6: compartment column is correctly populated', async () => {
    // Patient's compartment = [own id]
    const p0 = created['Patient'][0];
    const pResult = await db.query<{ compartments: string[] }>(
      `SELECT "compartments" FROM "Patient" WHERE "id" = $1`,
      [p0.id],
    );
    expect(pResult.rows[0].compartments).toContain(p0.id);

    // Observation's compartment should contain the patient ID
    const obs0 = created['Observation'][0];
    const oResult = await db.query<{ compartments: string[] }>(
      `SELECT "compartments" FROM "Observation" WHERE "id" = $1`,
      [obs0.id],
    );
    expect(oResult.rows[0].compartments).toContain(created['Patient'][0].id);
  }, 15_000);

  // C7: Token columns — search column values exist
  it('C7: token search columns are populated (identifier, status, code)', async () => {
    // Patient identifier token column
    const p0 = created['Patient'][0];
    const result = await db.query<{ '__identifierText': string[] }>(
      `SELECT "__identifierText" FROM "Patient" WHERE "id" = $1`,
      [p0.id],
    );
    const idTexts = result.rows[0]['__identifierText'];
    expect(idTexts).toBeDefined();
    expect(idTexts.length).toBeGreaterThanOrEqual(2);
    expect(idTexts.some((t: string) => t.includes(`MRN-001-${RUN}`))).toBe(true);

    // Observation status token column
    const obs0 = created['Observation'][0];
    const obsResult = await db.query<{ '__statusText': string[] }>(
      `SELECT "__statusText" FROM "Observation" WHERE "id" = $1`,
      [obs0.id],
    );
    expect(obsResult.rows[0]['__statusText']).toBeDefined();
  }, 15_000);

}, 300_000);

// =============================================================================
// Phase D: Generate Medplum Transaction Bundle
// =============================================================================

describe('Phase D: Generate Medplum Transaction Bundle', () => {
  it('generates FHIR Transaction Bundle JSON for Medplum import', () => {
    const entries: Array<{
      fullUrl: string;
      resource: FhirResource;
      request: { method: string; url: string };
    }> = [];

    // Use a consistent mapping from MedXAI IDs to urn:uuid for Medplum
    const idToUrn = new Map<string, string>();

    // First pass: assign urn:uuid for all resources
    for (const [rt, resources] of Object.entries(created)) {
      for (const { resource } of resources) {
        const urn = `urn:uuid:${resource.id}`;
        idToUrn.set(`${rt}/${resource.id}`, urn);
      }
    }

    // Second pass: build entries with reference rewriting
    for (const [rt, resources] of Object.entries(created)) {
      for (const { resource } of resources) {
        // Deep clone and strip server-generated fields
        const clean = JSON.parse(JSON.stringify(resource));
        delete clean.id;
        delete clean.meta?.versionId;
        delete clean.meta?.lastUpdated;
        if (clean.meta && Object.keys(clean.meta).length === 0) {
          delete clean.meta;
        }

        // Rewrite references to urn:uuid
        const json = JSON.stringify(clean);
        let rewritten = json;
        for (const [refStr, urn] of Array.from(idToUrn.entries())) {
          rewritten = rewritten.split(refStr).join(urn);
        }

        const urn = idToUrn.get(`${rt}/${resource.id}`)!;
        entries.push({
          fullUrl: urn,
          resource: JSON.parse(rewritten),
          request: { method: 'POST', url: rt },
        });
      }
    }

    const bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: entries,
    };

    // Write to file
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const outPath = resolve(scriptDir, '..', 'pgdata', 'medplum-test-bundle.json');
    writeFileSync(outPath, JSON.stringify(bundle, null, 2), 'utf-8');

    console.log(`[Medplum Bundle] ${entries.length} entries written to ${outPath}`);
    expect(entries.length).toBeGreaterThanOrEqual(76);
  });
});
