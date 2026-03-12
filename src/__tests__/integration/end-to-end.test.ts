/**
 * End-to-End Integration Tests — Task 8.7
 *
 * Verifies the complete pipeline:
 *   spec files → registries → schema builder → DDL generator
 *
 * Covers:
 * - Full pipeline produces valid DDL for all ~140+ resource types
 * - CLI `run()` function produces output
 * - Table count: 3 tables per resource type
 * - Index count sanity checks
 * - DDL string format validation
 * - Cross-resource consistency (all have fixed columns, PK, etc.)
 * - Specific resource spot-checks (Patient, Observation, Binary, Encounter)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { loadBundleFromFile } from '@medxai/fhir-core';

import { StructureDefinitionRegistry } from '../../registry/structure-definition-registry.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import type { SearchParameterBundle } from '../../registry/search-parameter-registry.js';
import {
  buildAllResourceTableSets,
  buildSchemaDefinition,
} from '../../schema/table-schema-builder.js';
import {
  generateSchemaDDL,
  generateSchemaDDLString,
} from '../../schema/ddl-generator.js';
import { run } from '../../cli/generate-schema.js';
import type { ResourceTableSet, SchemaDefinition } from '../../schema/table-schema.js';

// =============================================================================
// Setup
// =============================================================================

function specPath(filename: string): string {
  return resolve(__dirname, '..', '..', '..', '..', '..', 'spec', 'fhir', 'r4', filename);
}

let sdRegistry: StructureDefinitionRegistry;
let spRegistry: SearchParameterRegistry;
let tableSets: ResourceTableSet[];
let schema: SchemaDefinition;
let ddlStatements: string[];
let ddlString: string;

beforeAll(() => {
  // 1. Load profiles
  const profiles = loadBundleFromFile(specPath('profiles-resources.json'));
  sdRegistry = new StructureDefinitionRegistry();
  sdRegistry.indexAll(profiles.profiles);

  // 2. Load search parameters
  const spBundle = JSON.parse(
    readFileSync(specPath('search-parameters.json'), 'utf8'),
  ) as SearchParameterBundle;
  spRegistry = new SearchParameterRegistry();
  spRegistry.indexBundle(spBundle);

  // 3. Build schema
  tableSets = buildAllResourceTableSets(sdRegistry, spRegistry);
  schema = buildSchemaDefinition(sdRegistry, spRegistry);
  ddlStatements = generateSchemaDDL(schema);
  ddlString = generateSchemaDDLString(schema);
});

// =============================================================================
// Section 1: Pipeline Completeness
// =============================================================================

describe('E2E — Pipeline Completeness', () => {
  it('produces table sets for all concrete resource types', () => {
    const tableTypes = sdRegistry.getTableResourceTypes();
    expect(tableSets).toHaveLength(tableTypes.length);
    expect(tableSets.length).toBeGreaterThanOrEqual(140);
  });

  it('each resource type has exactly 3 tables', () => {
    for (const ts of tableSets) {
      expect(ts.main).toBeDefined();
      expect(ts.history).toBeDefined();
      expect(ts.references).toBeDefined();
      expect(ts.main.tableName).toBe(ts.resourceType);
      expect(ts.history.tableName).toBe(`${ts.resourceType}_History`);
      expect(ts.references.tableName).toBe(`${ts.resourceType}_References`);
    }
  });

  it('total DDL statements > 400 (tables + indexes)', () => {
    expect(ddlStatements.length).toBeGreaterThan(400);
  });

  it('DDL string is non-empty and has header', () => {
    expect(ddlString.length).toBeGreaterThan(10000);
    expect(ddlString).toContain('-- MedXAI FHIR Schema DDL');
    expect(ddlString).toContain('-- Version: fhir-r4-v4.0.1');
  });

  it('schema definition has correct metadata', () => {
    expect(schema.version).toBe('fhir-r4-v4.0.1');
    expect(schema.generatedAt).toBeTruthy();
    expect(schema.tableSets.length).toBeGreaterThanOrEqual(140);
  });
});

// =============================================================================
// Section 2: Cross-Resource Consistency
// =============================================================================

describe('E2E — Cross-Resource Consistency', () => {
  it('all main tables have id UUID PK', () => {
    for (const ts of tableSets) {
      const idCol = ts.main.columns.find((c) => c.name === 'id');
      expect(idCol, `${ts.resourceType} missing id column`).toBeDefined();
      expect(idCol!.type).toBe('UUID');
      expect(idCol!.primaryKey).toBe(true);
      expect(idCol!.notNull).toBe(true);
    }
  });

  it('all main tables have content TEXT NOT NULL', () => {
    for (const ts of tableSets) {
      const col = ts.main.columns.find((c) => c.name === 'content');
      expect(col, `${ts.resourceType} missing content column`).toBeDefined();
      expect(col!.type).toBe('TEXT');
      expect(col!.notNull).toBe(true);
    }
  });

  it('all main tables have lastUpdated TIMESTAMPTZ NOT NULL', () => {
    for (const ts of tableSets) {
      const col = ts.main.columns.find((c) => c.name === 'lastUpdated');
      expect(col, `${ts.resourceType} missing lastUpdated column`).toBeDefined();
      expect(col!.type).toBe('TIMESTAMPTZ');
    }
  });

  it('all main tables have PK constraint', () => {
    for (const ts of tableSets) {
      const pk = ts.main.constraints.find((c) => c.type === 'primary_key');
      expect(pk, `${ts.resourceType} missing PK constraint`).toBeDefined();
      expect(pk!.columns).toEqual(['id']);
    }
  });

  it('all non-Binary main tables have compartments column', () => {
    for (const ts of tableSets) {
      if (ts.resourceType === 'Binary') continue;
      const col = ts.main.columns.find((c) => c.name === 'compartments');
      expect(col, `${ts.resourceType} missing compartments column`).toBeDefined();
      expect(col!.type).toBe('UUID[]');
    }
  });

  it('Binary has NO compartments column', () => {
    const binary = tableSets.find((ts) => ts.resourceType === 'Binary')!;
    const col = binary.main.columns.find((c) => c.name === 'compartments');
    expect(col).toBeUndefined();
  });

  it('all history tables have exactly 4 columns', () => {
    for (const ts of tableSets) {
      expect(ts.history.columns, `${ts.resourceType}_History`).toHaveLength(4);
    }
  });

  it('all references tables have composite PK', () => {
    for (const ts of tableSets) {
      expect(ts.references.compositePrimaryKey).toEqual(['resourceId', 'targetId', 'code']);
    }
  });

  it('all main tables have at least 7 fixed indexes', () => {
    for (const ts of tableSets) {
      // 7 fixed + compartments (for non-Binary) + search indexes
      const minIndexes = ts.resourceType === 'Binary' ? 7 : 8;
      expect(
        ts.main.indexes.length,
        `${ts.resourceType} has only ${ts.main.indexes.length} indexes`,
      ).toBeGreaterThanOrEqual(minIndexes);
    }
  });
});

// =============================================================================
// Section 3: Specific Resource Spot-Checks
// =============================================================================

describe('E2E — Resource Spot-Checks', () => {
  it('Patient: has birthdate, gender, name, identifier columns', () => {
    const patient = tableSets.find((ts) => ts.resourceType === 'Patient')!;
    const colNames = patient.main.columns.map((c) => c.name);

    expect(colNames).toContain('birthdate');
    expect(colNames).toContain('__gender');
    expect(colNames).toContain('__genderText');
    expect(colNames).toContain('__genderSort');
    expect(colNames).toContain('__nameSort');
    expect(colNames).toContain('__identifier');
    expect(colNames).toContain('__identifierText');
    expect(colNames).toContain('__identifierSort');
  });

  it('Observation: has code, subject, date columns', () => {
    const obs = tableSets.find((ts) => ts.resourceType === 'Observation')!;
    const colNames = obs.main.columns.map((c) => c.name);

    expect(colNames).toContain('__code');
    expect(colNames).toContain('subject');
    expect(colNames).toContain('date');
  });

  it('Encounter: has date, status, class columns', () => {
    const enc = tableSets.find((ts) => ts.resourceType === 'Encounter')!;
    const colNames = enc.main.columns.map((c) => c.name);

    expect(colNames).toContain('date');
    expect(colNames).toContain('__status');
    expect(colNames).toContain('__class');
  });

  it('MedicationRequest: has search columns', () => {
    const mr = tableSets.find((ts) => ts.resourceType === 'MedicationRequest')!;
    expect(mr.main.columns.length).toBeGreaterThan(8); // fixed + search
  });
});

// =============================================================================
// Section 4: DDL Format Validation
// =============================================================================

describe('E2E — DDL Format Validation', () => {
  it('all CREATE TABLE statements are well-formed', () => {
    const tableStmts = ddlStatements.filter((s) => s.startsWith('CREATE TABLE'));
    expect(tableStmts.length).toBeGreaterThanOrEqual(tableSets.length * 3);

    for (const stmt of tableStmts) {
      expect(stmt).toMatch(/^CREATE TABLE IF NOT EXISTS "/);
      expect(stmt).toMatch(/\);$/);
    }
  });

  it('all CREATE INDEX statements are well-formed', () => {
    const indexStmts = ddlStatements.filter((s) => s.includes('INDEX'));
    expect(indexStmts.length).toBeGreaterThan(0);

    for (const stmt of indexStmts) {
      expect(stmt).toMatch(/^CREATE (UNIQUE )?INDEX IF NOT EXISTS "/);
      expect(stmt).toMatch(/;$/);
    }
  });

  it('tables come before indexes in DDL output', () => {
    let lastTableIdx = -1;
    let firstIndexIdx = ddlStatements.length;

    for (let i = 0; i < ddlStatements.length; i++) {
      if (ddlStatements[i].startsWith('CREATE TABLE')) {
        lastTableIdx = i;
      }
      if (ddlStatements[i].includes('INDEX') && firstIndexIdx === ddlStatements.length) {
        firstIndexIdx = i;
      }
    }

    expect(lastTableIdx).toBeLessThan(firstIndexIdx);
  });

  it('no duplicate table names', () => {
    const tableNames = new Set<string>();
    for (const ts of tableSets) {
      expect(tableNames.has(ts.main.tableName)).toBe(false);
      expect(tableNames.has(ts.history.tableName)).toBe(false);
      expect(tableNames.has(ts.references.tableName)).toBe(false);
      tableNames.add(ts.main.tableName);
      tableNames.add(ts.history.tableName);
      tableNames.add(ts.references.tableName);
    }
  });

  it('no duplicate index names', () => {
    const indexNames = new Set<string>();
    for (const ts of tableSets) {
      for (const idx of [...ts.main.indexes, ...ts.history.indexes, ...ts.references.indexes]) {
        expect(indexNames.has(idx.name), `Duplicate index: ${idx.name}`).toBe(false);
        indexNames.add(idx.name);
      }
    }
  });
});

// =============================================================================
// Section 5: CLI Integration
// =============================================================================

describe('E2E — CLI run()', () => {
  it('run() with --resource Patient produces DDL', () => {
    const specDir = resolve(__dirname, '..', '..', '..', '..', '..', 'spec', 'fhir', 'r4');
    const output = run(['--spec-dir', specDir, '--resource', 'Patient']);
    expect(output).toContain('CREATE TABLE IF NOT EXISTS "Patient"');
    expect(output).toContain('CREATE TABLE IF NOT EXISTS "Patient_History"');
    expect(output).toContain('CREATE TABLE IF NOT EXISTS "Patient_References"');
  });

  it('run() with --resource Patient --format json produces JSON', () => {
    const specDir = resolve(__dirname, '..', '..', '..', '..', '..', 'spec', 'fhir', 'r4');
    const output = run(['--spec-dir', specDir, '--resource', 'Patient', '--format', 'json']);
    const parsed = JSON.parse(output);
    expect(parsed.resourceType).toBe('Patient');
    expect(parsed.main).toBeDefined();
    expect(parsed.history).toBeDefined();
    expect(parsed.references).toBeDefined();
  });

  it('run() without --resource produces full schema DDL', () => {
    const specDir = resolve(__dirname, '..', '..', '..', '..', '..', 'spec', 'fhir', 'r4');
    const output = run(['--spec-dir', specDir]);
    expect(output).toContain('-- MedXAI FHIR Schema DDL');
    expect(output).toContain('CREATE TABLE IF NOT EXISTS "Patient"');
    expect(output).toContain('CREATE TABLE IF NOT EXISTS "Observation"');
    expect(output.length).toBeGreaterThan(50000);
  });
});
