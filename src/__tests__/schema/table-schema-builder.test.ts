/**
 * Tests for TableSchemaBuilder — Task 8.4
 *
 * Covers:
 * - Fixed columns on all main tables
 * - Binary has no compartments column/index
 * - History table structure
 * - References table structure
 * - Search column generation (column, token-column, lookup-table)
 * - Error handling (unknown type, abstract type, non-resource type)
 * - buildAllResourceTableSets with real spec files
 * - buildSchemaDefinition
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildResourceTableSet,
  buildAllResourceTableSets,
  buildSchemaDefinition,
} from '../../schema/table-schema-builder.js';
import { StructureDefinitionRegistry } from '../../registry/structure-definition-registry.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import { loadBundleFromFile } from '@medxai/fhir-core';
import type { CanonicalProfile } from '@medxai/fhir-core';
import type { SearchParameterBundle } from '../../registry/search-parameter-registry.js';

// =============================================================================
// Helpers
// =============================================================================

function specPath(filename: string): string {
  return resolve(__dirname, '..', '..', '..', '..', '..', 'spec', 'fhir', 'r4', filename);
}

function makeProfile(overrides: Partial<CanonicalProfile> = {}): CanonicalProfile {
  return {
    url: 'http://hl7.org/fhir/StructureDefinition/Patient',
    name: 'Patient',
    kind: 'resource',
    type: 'Patient',
    abstract: false,
    elements: new Map(),
    ...overrides,
  };
}

function setupRegistries(): { sdRegistry: StructureDefinitionRegistry; spRegistry: SearchParameterRegistry } {
  const sdRegistry = new StructureDefinitionRegistry();
  const spRegistry = new SearchParameterRegistry();

  // Index a few profiles
  sdRegistry.indexAll([
    makeProfile({ type: 'Patient', kind: 'resource', abstract: false }),
    makeProfile({ type: 'Observation', kind: 'resource', abstract: false, url: 'http://hl7.org/fhir/StructureDefinition/Observation' }),
    makeProfile({ type: 'Binary', kind: 'resource', abstract: false, url: 'http://hl7.org/fhir/StructureDefinition/Binary' }),
    makeProfile({ type: 'Resource', kind: 'resource', abstract: true, url: 'http://hl7.org/fhir/StructureDefinition/Resource' }),
    makeProfile({ type: 'HumanName', kind: 'complex-type', abstract: false, url: 'http://hl7.org/fhir/StructureDefinition/HumanName' }),
  ]);

  // Index some search params for Patient
  spRegistry.indexImpl('Patient', {
    code: 'birthdate', type: 'date', resourceTypes: ['Patient'],
    expression: 'Patient.birthDate', strategy: 'column',
    columnName: 'birthdate', columnType: 'TIMESTAMPTZ', array: false,
  });
  spRegistry.indexImpl('Patient', {
    code: 'gender', type: 'token', resourceTypes: ['Patient'],
    expression: 'Patient.gender', strategy: 'token-column',
    columnName: 'gender', columnType: 'UUID[]', array: true,
  });
  spRegistry.indexImpl('Patient', {
    code: 'name', type: 'string', resourceTypes: ['Patient'],
    expression: 'Patient.name', strategy: 'lookup-table',
    columnName: 'name', columnType: 'TEXT', array: false,
  });
  spRegistry.indexImpl('Patient', {
    code: 'active', type: 'token', resourceTypes: ['Patient'],
    expression: 'Patient.active', strategy: 'token-column',
    columnName: 'active', columnType: 'UUID[]', array: true,
  });

  // Index some search params for Observation
  spRegistry.indexImpl('Observation', {
    code: 'code', type: 'token', resourceTypes: ['Observation'],
    expression: 'Observation.code', strategy: 'token-column',
    columnName: 'code', columnType: 'UUID[]', array: true,
  });
  spRegistry.indexImpl('Observation', {
    code: 'subject', type: 'reference', resourceTypes: ['Observation'],
    expression: 'Observation.subject', strategy: 'column',
    columnName: 'subject', columnType: 'TEXT', array: false,
  });
  spRegistry.indexImpl('Observation', {
    code: 'date', type: 'date', resourceTypes: ['Observation'],
    expression: 'Observation.effective', strategy: 'column',
    columnName: 'date', columnType: 'TIMESTAMPTZ', array: false,
  });

  return { sdRegistry, spRegistry };
}

// =============================================================================
// Section 1: Fixed Columns
// =============================================================================

describe('TableSchemaBuilder — Fixed Columns', () => {
  let sdRegistry: StructureDefinitionRegistry;
  let spRegistry: SearchParameterRegistry;

  beforeEach(() => {
    ({ sdRegistry, spRegistry } = setupRegistries());
  });

  it('main table has all 9 fixed columns for non-Binary', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const colNames = tableSet.main.columns.map((c) => c.name);

    expect(colNames).toContain('id');
    expect(colNames).toContain('content');
    expect(colNames).toContain('lastUpdated');
    expect(colNames).toContain('deleted');
    expect(colNames).toContain('projectId');
    expect(colNames).toContain('__version');
    expect(colNames).toContain('_source');
    expect(colNames).toContain('_profile');
    expect(colNames).toContain('compartments');
  });

  it('id column is UUID PK NOT NULL', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const idCol = tableSet.main.columns.find((c) => c.name === 'id')!;
    expect(idCol.type).toBe('UUID');
    expect(idCol.primaryKey).toBe(true);
    expect(idCol.notNull).toBe(true);
  });

  it('content column is TEXT NOT NULL', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const col = tableSet.main.columns.find((c) => c.name === 'content')!;
    expect(col.type).toBe('TEXT');
    expect(col.notNull).toBe(true);
  });

  it('deleted column has default value false', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const col = tableSet.main.columns.find((c) => c.name === 'deleted')!;
    expect(col.type).toBe('BOOLEAN');
    expect(col.notNull).toBe(true);
    expect(col.defaultValue).toBe('false');
  });

  it('compartments column is UUID[] NOT NULL', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const col = tableSet.main.columns.find((c) => c.name === 'compartments')!;
    expect(col.type).toBe('UUID[]');
    expect(col.notNull).toBe(true);
  });

  it('_profile column is TEXT[] nullable', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const col = tableSet.main.columns.find((c) => c.name === '_profile')!;
    expect(col.type).toBe('TEXT[]');
    expect(col.notNull).toBe(false);
  });
});

// =============================================================================
// Section 2: Binary Special Case
// =============================================================================

describe('TableSchemaBuilder — Binary', () => {
  let sdRegistry: StructureDefinitionRegistry;
  let spRegistry: SearchParameterRegistry;

  beforeEach(() => {
    ({ sdRegistry, spRegistry } = setupRegistries());
  });

  it('Binary has NO compartments column', () => {
    const tableSet = buildResourceTableSet('Binary', sdRegistry, spRegistry);
    const colNames = tableSet.main.columns.map((c) => c.name);
    expect(colNames).not.toContain('compartments');
  });

  it('Binary has NO compartments index', () => {
    const tableSet = buildResourceTableSet('Binary', sdRegistry, spRegistry);
    const idxNames = tableSet.main.indexes.map((i) => i.name);
    expect(idxNames).not.toContain('Binary_compartments_idx');
  });

  it('Binary still has all other fixed columns', () => {
    const tableSet = buildResourceTableSet('Binary', sdRegistry, spRegistry);
    const colNames = tableSet.main.columns.map((c) => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('content');
    expect(colNames).toContain('lastUpdated');
    expect(colNames).toContain('deleted');
    expect(colNames).toContain('projectId');
    expect(colNames).toContain('__version');
    expect(colNames).toContain('_source');
    expect(colNames).toContain('_profile');
  });
});

// =============================================================================
// Section 3: Fixed Indexes
// =============================================================================

describe('TableSchemaBuilder — Fixed Indexes', () => {
  let sdRegistry: StructureDefinitionRegistry;
  let spRegistry: SearchParameterRegistry;

  beforeEach(() => {
    ({ sdRegistry, spRegistry } = setupRegistries());
  });

  it('main table has all fixed indexes', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const idxNames = tableSet.main.indexes.map((i) => i.name);

    expect(idxNames).toContain('Patient_lastUpdated_idx');
    expect(idxNames).toContain('Patient_projectId_lastUpdated_idx');
    expect(idxNames).toContain('Patient_projectId_idx');
    expect(idxNames).toContain('Patient__source_idx');
    expect(idxNames).toContain('Patient_profile_idx');
    expect(idxNames).toContain('Patient___version_idx');
    expect(idxNames).toContain('Patient_reindex_idx');
    expect(idxNames).toContain('Patient_compartments_idx');
  });

  it('reindex_idx has WHERE clause', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const reindexIdx = tableSet.main.indexes.find((i) => i.name === 'Patient_reindex_idx')!;
    expect(reindexIdx.where).toBe('deleted = false');
    expect(reindexIdx.columns).toEqual(['lastUpdated', '__version']);
    expect(reindexIdx.indexType).toBe('btree');
  });

  it('_profile index is gin', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const profileIdx = tableSet.main.indexes.find((i) => i.name === 'Patient_profile_idx')!;
    expect(profileIdx.indexType).toBe('gin');
  });

  it('compartments index is gin', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const compIdx = tableSet.main.indexes.find((i) => i.name === 'Patient_compartments_idx')!;
    expect(compIdx.indexType).toBe('gin');
  });

  it('main table has PK constraint', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    expect(tableSet.main.constraints).toContainEqual({
      name: 'Patient_pk',
      type: 'primary_key',
      columns: ['id'],
    });
  });
});

// =============================================================================
// Section 4: Search Columns
// =============================================================================

describe('TableSchemaBuilder — Search Columns', () => {
  let sdRegistry: StructureDefinitionRegistry;
  let spRegistry: SearchParameterRegistry;

  beforeEach(() => {
    ({ sdRegistry, spRegistry } = setupRegistries());
  });

  it('column strategy: Patient has birthdate TIMESTAMPTZ', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const col = tableSet.main.columns.find((c) => c.name === 'birthdate');
    expect(col).toBeDefined();
    expect(col!.type).toBe('TIMESTAMPTZ');
    expect(col!.notNull).toBe(false);
    expect(col!.searchParamCode).toBe('birthdate');
  });

  it('column strategy: birthdate has btree index', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const idx = tableSet.main.indexes.find((i) => i.name === 'Patient_birthdate_idx');
    expect(idx).toBeDefined();
    expect(idx!.indexType).toBe('btree');
    expect(idx!.columns).toEqual(['birthdate']);
  });

  it('token-column strategy: Patient has __gender, __genderText, __genderSort', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const colNames = tableSet.main.columns.map((c) => c.name);
    expect(colNames).toContain('__gender');
    expect(colNames).toContain('__genderText');
    expect(colNames).toContain('__genderSort');

    const hashCol = tableSet.main.columns.find((c) => c.name === '__gender')!;
    expect(hashCol.type).toBe('UUID[]');
    const textCol = tableSet.main.columns.find((c) => c.name === '__genderText')!;
    expect(textCol.type).toBe('TEXT[]');
    const sortCol = tableSet.main.columns.find((c) => c.name === '__genderSort')!;
    expect(sortCol.type).toBe('TEXT');
  });

  it('token-column strategy: __gender has gin index', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const idx = tableSet.main.indexes.find((i) => i.name === 'Patient___gender_idx');
    expect(idx).toBeDefined();
    expect(idx!.indexType).toBe('gin');
    expect(idx!.columns).toEqual(['__gender']);
  });

  it('lookup-table strategy: Patient has __nameSort column only', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const colNames = tableSet.main.columns.map((c) => c.name);
    expect(colNames).toContain('__nameSort');
    // Should NOT have __name or __nameText (those are in the lookup table)
    expect(colNames).not.toContain('__name');
    expect(colNames).not.toContain('__nameText');
  });

  it('lookup-table strategy: __nameSort has btree index', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const idx = tableSet.main.indexes.find((i) => i.name === 'Patient___nameSort_idx');
    expect(idx).toBeDefined();
    expect(idx!.indexType).toBe('btree');
  });

  it('Observation has subject TEXT column', () => {
    const tableSet = buildResourceTableSet('Observation', sdRegistry, spRegistry);
    const col = tableSet.main.columns.find((c) => c.name === 'subject');
    expect(col).toBeDefined();
    expect(col!.type).toBe('TEXT');
  });

  it('Observation has __code UUID[] column', () => {
    const tableSet = buildResourceTableSet('Observation', sdRegistry, spRegistry);
    const col = tableSet.main.columns.find((c) => c.name === '__code');
    expect(col).toBeDefined();
    expect(col!.type).toBe('UUID[]');
  });
});

// =============================================================================
// Section 5: History Table
// =============================================================================

describe('TableSchemaBuilder — History Table', () => {
  let sdRegistry: StructureDefinitionRegistry;
  let spRegistry: SearchParameterRegistry;

  beforeEach(() => {
    ({ sdRegistry, spRegistry } = setupRegistries());
  });

  it('history table has correct name', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    expect(tableSet.history.tableName).toBe('Patient_History');
  });

  it('history table has 4 fixed columns', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    expect(tableSet.history.columns).toHaveLength(4);
    const colNames = tableSet.history.columns.map((c) => c.name);
    expect(colNames).toEqual(['versionId', 'id', 'content', 'lastUpdated']);
  });

  it('history table versionId is UUID PK', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const col = tableSet.history.columns.find((c) => c.name === 'versionId')!;
    expect(col.type).toBe('UUID');
    expect(col.primaryKey).toBe(true);
    expect(col.notNull).toBe(true);
  });

  it('history table has 2 indexes', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    expect(tableSet.history.indexes).toHaveLength(2);
    const idxNames = tableSet.history.indexes.map((i) => i.name);
    expect(idxNames).toContain('Patient_History_id_idx');
    expect(idxNames).toContain('Patient_History_lastUpdated_idx');
  });
});

// =============================================================================
// Section 6: References Table
// =============================================================================

describe('TableSchemaBuilder — References Table', () => {
  let sdRegistry: StructureDefinitionRegistry;
  let spRegistry: SearchParameterRegistry;

  beforeEach(() => {
    ({ sdRegistry, spRegistry } = setupRegistries());
  });

  it('references table has correct name', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    expect(tableSet.references.tableName).toBe('Patient_References');
  });

  it('references table has 3 columns', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    expect(tableSet.references.columns).toHaveLength(3);
    const colNames = tableSet.references.columns.map((c) => c.name);
    expect(colNames).toEqual(['resourceId', 'targetId', 'code']);
  });

  it('references table has composite PK', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    expect(tableSet.references.compositePrimaryKey).toEqual(['resourceId', 'targetId', 'code']);
  });

  it('references table has covering index', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const idx = tableSet.references.indexes.find((i) => i.name === 'Patient_References_targetId_code_idx')!;
    expect(idx.columns).toEqual(['targetId', 'code']);
    expect(idx.include).toEqual(['resourceId']);
    expect(idx.indexType).toBe('btree');
  });
});

// =============================================================================
// Section 7: Error Handling
// =============================================================================

describe('TableSchemaBuilder — Error Handling', () => {
  let sdRegistry: StructureDefinitionRegistry;
  let spRegistry: SearchParameterRegistry;

  beforeEach(() => {
    ({ sdRegistry, spRegistry } = setupRegistries());
  });

  it('throws for unknown resource type', () => {
    expect(() => buildResourceTableSet('Unknown', sdRegistry, spRegistry))
      .toThrow('Resource type "Unknown" not found');
  });

  it('throws for abstract resource type', () => {
    expect(() => buildResourceTableSet('Resource', sdRegistry, spRegistry))
      .toThrow('Cannot build table for abstract resource type "Resource"');
  });

  it('throws for non-resource type', () => {
    expect(() => buildResourceTableSet('HumanName', sdRegistry, spRegistry))
      .toThrow('Cannot build table for non-resource type "HumanName"');
  });
});

// =============================================================================
// Section 8: buildAllResourceTableSets
// =============================================================================

describe('TableSchemaBuilder — buildAllResourceTableSets', () => {
  let sdRegistry: StructureDefinitionRegistry;
  let spRegistry: SearchParameterRegistry;

  beforeEach(() => {
    ({ sdRegistry, spRegistry } = setupRegistries());
  });

  it('builds table sets for all non-abstract resource types', () => {
    const tableSets = buildAllResourceTableSets(sdRegistry, spRegistry);
    // Should have Patient, Observation, Binary (not Resource, not HumanName)
    expect(tableSets).toHaveLength(3);
    const types = tableSets.map((ts) => ts.resourceType);
    expect(types).toEqual(['Binary', 'Observation', 'Patient']); // sorted
  });

  it('each table set has 3 tables', () => {
    const tableSets = buildAllResourceTableSets(sdRegistry, spRegistry);
    for (const ts of tableSets) {
      expect(ts.main).toBeDefined();
      expect(ts.history).toBeDefined();
      expect(ts.references).toBeDefined();
    }
  });
});

// =============================================================================
// Section 9: buildSchemaDefinition
// =============================================================================

describe('TableSchemaBuilder — buildSchemaDefinition', () => {
  let sdRegistry: StructureDefinitionRegistry;
  let spRegistry: SearchParameterRegistry;

  beforeEach(() => {
    ({ sdRegistry, spRegistry } = setupRegistries());
  });

  it('returns SchemaDefinition with version and timestamp', () => {
    const schema = buildSchemaDefinition(sdRegistry, spRegistry);
    expect(schema.version).toBe('fhir-r4-v4.0.1');
    expect(schema.generatedAt).toBeTruthy();
    expect(schema.tableSets).toHaveLength(3);
  });

  it('accepts custom version', () => {
    const schema = buildSchemaDefinition(sdRegistry, spRegistry, 'custom-v1');
    expect(schema.version).toBe('custom-v1');
  });
});

// =============================================================================
// Section 10: Integration Tests (real spec files)
// =============================================================================

describe('TableSchemaBuilder — Integration', () => {
  let sdRegistry: StructureDefinitionRegistry;
  let spRegistry: SearchParameterRegistry;

  beforeEach(() => {
    sdRegistry = new StructureDefinitionRegistry();
    spRegistry = new SearchParameterRegistry();

    const profiles = loadBundleFromFile(specPath('profiles-resources.json'));
    sdRegistry.indexAll(profiles.profiles);

    const spBundle = JSON.parse(
      readFileSync(specPath('search-parameters.json'), 'utf8'),
    ) as SearchParameterBundle;
    spRegistry.indexBundle(spBundle);
  });

  it('buildAllResourceTableSets returns ~140+ table sets', () => {
    const tableSets = buildAllResourceTableSets(sdRegistry, spRegistry);
    expect(tableSets.length).toBeGreaterThanOrEqual(140);
  });

  it('Patient table has expected search columns', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const colNames = tableSet.main.columns.map((c) => c.name);

    // Fixed columns
    expect(colNames).toContain('id');
    expect(colNames).toContain('content');
    expect(colNames).toContain('compartments');

    // Search columns (date → column)
    expect(colNames).toContain('birthdate');

    // Token columns
    expect(colNames).toContain('__gender');
    expect(colNames).toContain('__genderText');
    expect(colNames).toContain('__genderSort');

    // Lookup-table sort columns
    expect(colNames).toContain('__nameSort');
  });

  it('Observation table has expected search columns', () => {
    const tableSet = buildResourceTableSet('Observation', sdRegistry, spRegistry);
    const colNames = tableSet.main.columns.map((c) => c.name);

    expect(colNames).toContain('__code');
    expect(colNames).toContain('subject');
    expect(colNames).toContain('date');
  });

  it('Binary table has no compartments', () => {
    const tableSet = buildResourceTableSet('Binary', sdRegistry, spRegistry);
    const colNames = tableSet.main.columns.map((c) => c.name);
    expect(colNames).not.toContain('compartments');
  });

  it('all table sets have valid 3-table structure', () => {
    const tableSets = buildAllResourceTableSets(sdRegistry, spRegistry);
    for (const ts of tableSets) {
      expect(ts.main.tableName).toBe(ts.resourceType);
      expect(ts.history.tableName).toBe(`${ts.resourceType}_History`);
      expect(ts.references.tableName).toBe(`${ts.resourceType}_References`);
      expect(ts.main.columns.length).toBeGreaterThanOrEqual(8); // at least fixed columns
      expect(ts.history.columns).toHaveLength(4);
      expect(ts.references.columns).toHaveLength(3);
      expect(ts.references.compositePrimaryKey).toEqual(['resourceId', 'targetId', 'code']);
    }
  });

  it('buildSchemaDefinition produces complete schema', () => {
    const schema = buildSchemaDefinition(sdRegistry, spRegistry);
    expect(schema.version).toBe('fhir-r4-v4.0.1');
    expect(schema.tableSets.length).toBeGreaterThanOrEqual(140);
    expect(schema.generatedAt).toBeTruthy();
  });
});

// =============================================================================
// Section 11: Schema Correctness Verification (reference array + lookup-table)
// =============================================================================

describe('TableSchemaBuilder — Schema Correctness (reference array & lookup-table)', () => {
  let sdRegistry: StructureDefinitionRegistry;
  let spRegistry: SearchParameterRegistry;

  beforeEach(() => {
    sdRegistry = new StructureDefinitionRegistry();
    spRegistry = new SearchParameterRegistry();

    const profiles = loadBundleFromFile(specPath('profiles-resources.json'));
    sdRegistry.indexAll(profiles.profiles);

    const spBundle = JSON.parse(
      readFileSync(specPath('search-parameters.json'), 'utf8'),
    ) as SearchParameterBundle;
    spRegistry.indexBundle(spBundle);
  });

  // ---------------------------------------------------------------------------
  // Account: plain-string name vs HumanName name
  // ---------------------------------------------------------------------------

  it('Account: name uses lookup-table (expression contains .name suffix)', () => {
    const impl = spRegistry.getImpl('Account', 'name');
    expect(impl).toBeDefined();
    // Account.name expression is "Account.name" — contains .name → lookup-table
    expect(impl!.strategy).toBe('lookup-table');
    const tableSet = buildResourceTableSet('Account', sdRegistry, spRegistry);
    const colNames = tableSet.main.columns.map((c) => c.name);
    expect(colNames).toContain('__nameSort');
    expect(colNames).not.toContain('name'); // no direct column
  });

  it('Account: patient is TEXT[] (array — Account.subject is max=* and .where() is properly stripped)', () => {
    const impl = spRegistry.getImpl('Account', 'patient');
    expect(impl).toBeDefined();
    expect(impl!.strategy).toBe('column');
    expect(impl!.columnType).toBe('TEXT[]');
    expect(impl!.array).toBe(true);
    const tableSet = buildResourceTableSet('Account', sdRegistry, spRegistry);
    const col = tableSet.main.columns.find((c) => c.name === 'patient');
    expect(col).toBeDefined();
    expect(col!.type).toBe('TEXT[]');
    const idx = tableSet.main.indexes.find((i) => i.name === 'Account_patient_idx');
    expect(idx!.indexType).toBe('gin');
  });

  it('Account: subject is TEXT[] (multi-target reference)', () => {
    const impl = spRegistry.getImpl('Account', 'subject');
    expect(impl).toBeDefined();
    expect(impl!.strategy).toBe('column');
    expect(impl!.columnType).toBe('TEXT[]');
    expect(impl!.array).toBe(true);
    const tableSet = buildResourceTableSet('Account', sdRegistry, spRegistry);
    const col = tableSet.main.columns.find((c) => c.name === 'subject');
    expect(col).toBeDefined();
    expect(col!.type).toBe('TEXT[]');
    const idx = tableSet.main.indexes.find((i) => i.name === 'Account_subject_idx');
    expect(idx!.indexType).toBe('gin');
  });

  it('Account: owner is TEXT (single-target reference, no .where())', () => {
    const impl = spRegistry.getImpl('Account', 'owner');
    expect(impl).toBeDefined();
    expect(impl!.strategy).toBe('column');
    expect(impl!.columnType).toBe('TEXT');
    expect(impl!.array).toBe(false);
    const tableSet = buildResourceTableSet('Account', sdRegistry, spRegistry);
    const col = tableSet.main.columns.find((c) => c.name === 'owner');
    expect(col!.type).toBe('TEXT');
    const idx = tableSet.main.indexes.find((i) => i.name === 'Account_owner_idx');
    expect(idx!.indexType).toBe('btree');
  });

  // ---------------------------------------------------------------------------
  // Patient: HumanName name → lookup-table (correct)
  // ---------------------------------------------------------------------------

  it('Patient: name uses lookup-table (expression Patient.name targets HumanName)', () => {
    const impl = spRegistry.getImpl('Patient', 'name');
    expect(impl).toBeDefined();
    expect(impl!.strategy).toBe('lookup-table');
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const colNames = tableSet.main.columns.map((c) => c.name);
    expect(colNames).toContain('__nameSort');
    expect(colNames).not.toContain('name');
  });

  it('Patient: general-practitioner is TEXT[] (3 targets: Practitioner/Organization/PractitionerRole)', () => {
    const impl = spRegistry.getImpl('Patient', 'general-practitioner');
    expect(impl).toBeDefined();
    expect(impl!.columnType).toBe('TEXT[]');
    expect(impl!.array).toBe(true);
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const col = tableSet.main.columns.find((c) => c.name === 'generalPractitioner');
    expect(col!.type).toBe('TEXT[]');
    const idx = tableSet.main.indexes.find((i) => i.name === 'Patient_generalPractitioner_idx');
    expect(idx!.indexType).toBe('gin');
  });

  it('Patient: link is TEXT[] (2 targets: Patient/RelatedPerson)', () => {
    const impl = spRegistry.getImpl('Patient', 'link');
    expect(impl).toBeDefined();
    expect(impl!.columnType).toBe('TEXT[]');
    expect(impl!.array).toBe(true);
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const col = tableSet.main.columns.find((c) => c.name === 'link');
    expect(col!.type).toBe('TEXT[]');
  });

  it('Patient: organization is TEXT (single-target reference)', () => {
    const impl = spRegistry.getImpl('Patient', 'organization');
    expect(impl).toBeDefined();
    expect(impl!.columnType).toBe('TEXT');
    expect(impl!.array).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Observation: multi-target references
  // ---------------------------------------------------------------------------

  it('Observation: subject is TEXT (max=1, despite multi-target: Patient/Group/Device/Location)', () => {
    const impl = spRegistry.getImpl('Observation', 'subject');
    expect(impl).toBeDefined();
    expect(impl!.columnType).toBe('TEXT');
    expect(impl!.array).toBe(false);
    const tableSet = buildResourceTableSet('Observation', sdRegistry, spRegistry);
    const col = tableSet.main.columns.find((c) => c.name === 'subject');
    expect(col!.type).toBe('TEXT');
    const idx = tableSet.main.indexes.find((i) => i.name === 'Observation_subject_idx');
    expect(idx!.indexType).toBe('btree');
  });

  it('Observation: specimen is TEXT (single-target: Specimen)', () => {
    const impl = spRegistry.getImpl('Observation', 'specimen');
    expect(impl).toBeDefined();
    expect(impl!.columnType).toBe('TEXT');
    expect(impl!.array).toBe(false);
    const tableSet = buildResourceTableSet('Observation', sdRegistry, spRegistry);
    const col = tableSet.main.columns.find((c) => c.name === 'specimen');
    expect(col!.type).toBe('TEXT');
    const idx = tableSet.main.indexes.find((i) => i.name === 'Observation_specimen_idx');
    expect(idx!.indexType).toBe('btree');
  });

  // ---------------------------------------------------------------------------
  // Practitioner: address → lookup-table (expression contains .address)
  // ---------------------------------------------------------------------------

  it('Practitioner: address uses lookup-table (expression contains .address)', () => {
    const impl = spRegistry.getImpl('Practitioner', 'address');
    expect(impl).toBeDefined();
    expect(impl!.strategy).toBe('lookup-table');
    const tableSet = buildResourceTableSet('Practitioner', sdRegistry, spRegistry);
    const colNames = tableSet.main.columns.map((c) => c.name);
    expect(colNames).toContain('__addressSort');
    expect(colNames).not.toContain('address');
  });

  it('Practitioner: name uses lookup-table (expression contains .name)', () => {
    const impl = spRegistry.getImpl('Practitioner', 'name');
    expect(impl).toBeDefined();
    expect(impl!.strategy).toBe('lookup-table');
  });

  // ---------------------------------------------------------------------------
  // Organization: name is column (expression Organization.name, no HumanName)
  // ---------------------------------------------------------------------------

  it('Organization: name uses lookup-table (expression contains .name suffix)', () => {
    const impl = spRegistry.getImpl('Organization', 'name');
    expect(impl).toBeDefined();
    // Organization.name expression is "Organization.name | Organization.alias"
    // contains .name → lookup-table (same as Account.name — acceptable conservative behavior)
    expect(impl!.strategy).toBe('lookup-table');
  });

  // ---------------------------------------------------------------------------
  // DiagnosticReport: multi-target references
  // ---------------------------------------------------------------------------

  it('DiagnosticReport: subject is TEXT (max=1, despite multi-target reference)', () => {
    const impl = spRegistry.getImpl('DiagnosticReport', 'subject');
    expect(impl).toBeDefined();
    expect(impl!.columnType).toBe('TEXT');
    expect(impl!.array).toBe(false);
  });

  it('DiagnosticReport: encounter is TEXT (max=1, despite 2 targets: Encounter/EpisodeOfCare)', () => {
    const impl = spRegistry.getImpl('DiagnosticReport', 'encounter');
    expect(impl).toBeDefined();
    expect(impl!.columnType).toBe('TEXT');
    expect(impl!.array).toBe(false);
  });
});
