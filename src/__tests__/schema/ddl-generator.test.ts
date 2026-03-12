/**
 * Tests for DDLGenerator — Task 8.5
 *
 * Covers:
 * - CREATE TABLE syntax (main, history, references)
 * - Column types and constraints
 * - Composite PK for references table
 * - CREATE INDEX syntax (btree, gin, partial, covering)
 * - generateResourceDDL ordering
 * - generateSchemaDDL ordering (tables first, then indexes)
 * - generateSchemaDDLString header
 * - Snapshot tests for Patient, Observation, Binary
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  generateCreateMainTable,
  generateCreateHistoryTable,
  generateCreateReferencesTable,
  generateCreateIndex,
  generateResourceDDL,
  generateSchemaDDL,
  generateSchemaDDLString,
} from '../../schema/ddl-generator.js';
import {
  buildResourceTableSet,
  buildSchemaDefinition,
} from '../../schema/table-schema-builder.js';
import { StructureDefinitionRegistry } from '../../registry/structure-definition-registry.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import { loadBundleFromFile } from '@medxai/fhir-core';
import type { CanonicalProfile } from '@medxai/fhir-core';
import type {
  MainTableSchema,
  HistoryTableSchema,
  ReferencesTableSchema,
  IndexSchema,
} from '../../schema/table-schema.js';
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

function minimalMainTable(): MainTableSchema {
  return {
    tableName: 'TestResource',
    resourceType: 'TestResource',
    columns: [
      { name: 'id', type: 'UUID', notNull: true, primaryKey: true },
      { name: 'content', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'deleted', type: 'BOOLEAN', notNull: true, primaryKey: false, defaultValue: 'false' },
      { name: '_source', type: 'TEXT', notNull: false, primaryKey: false },
    ],
    indexes: [],
    constraints: [
      { name: 'TestResource_pk', type: 'primary_key', columns: ['id'] },
    ],
  };
}

function minimalHistoryTable(): HistoryTableSchema {
  return {
    tableName: 'TestResource_History',
    resourceType: 'TestResource',
    columns: [
      { name: 'versionId', type: 'UUID', notNull: true, primaryKey: true },
      { name: 'id', type: 'UUID', notNull: true, primaryKey: false },
      { name: 'content', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'lastUpdated', type: 'TIMESTAMPTZ', notNull: true, primaryKey: false },
    ],
    indexes: [],
  };
}

function minimalReferencesTable(): ReferencesTableSchema {
  return {
    tableName: 'TestResource_References',
    resourceType: 'TestResource',
    columns: [
      { name: 'resourceId', type: 'UUID', notNull: true, primaryKey: false },
      { name: 'targetId', type: 'UUID', notNull: true, primaryKey: false },
      { name: 'code', type: 'TEXT', notNull: true, primaryKey: false },
    ],
    indexes: [],
    compositePrimaryKey: ['resourceId', 'targetId', 'code'],
  };
}

// =============================================================================
// Section 1: CREATE TABLE — Main Table
// =============================================================================

describe('DDLGenerator — CREATE TABLE (Main)', () => {
  it('generates CREATE TABLE IF NOT EXISTS', () => {
    const ddl = generateCreateMainTable(minimalMainTable());
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS "TestResource"');
  });

  it('quotes all column names', () => {
    const ddl = generateCreateMainTable(minimalMainTable());
    expect(ddl).toContain('"id"');
    expect(ddl).toContain('"content"');
    expect(ddl).toContain('"deleted"');
    expect(ddl).toContain('"_source"');
  });

  it('includes column types', () => {
    const ddl = generateCreateMainTable(minimalMainTable());
    expect(ddl).toContain('"id" UUID NOT NULL');
    expect(ddl).toContain('"content" TEXT NOT NULL');
    expect(ddl).toContain('"_source" TEXT');
  });

  it('includes DEFAULT clause', () => {
    const ddl = generateCreateMainTable(minimalMainTable());
    expect(ddl).toContain('"deleted" BOOLEAN NOT NULL DEFAULT false');
  });

  it('includes PK constraint', () => {
    const ddl = generateCreateMainTable(minimalMainTable());
    expect(ddl).toContain('CONSTRAINT "TestResource_pk" PRIMARY KEY ("id")');
  });

  it('nullable columns omit NOT NULL', () => {
    const ddl = generateCreateMainTable(minimalMainTable());
    // _source is nullable — should NOT have NOT NULL
    const sourceLine = ddl.split('\n').find((l) => l.includes('"_source"'))!;
    expect(sourceLine).not.toContain('NOT NULL');
  });

  it('ends with closing paren and semicolon', () => {
    const ddl = generateCreateMainTable(minimalMainTable());
    expect(ddl.trimEnd()).toMatch(/\);$/);
  });
});

// =============================================================================
// Section 2: CREATE TABLE — History Table
// =============================================================================

describe('DDLGenerator — CREATE TABLE (History)', () => {
  it('generates correct history table DDL', () => {
    const ddl = generateCreateHistoryTable(minimalHistoryTable());
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS "TestResource_History"');
    expect(ddl).toContain('"versionId" UUID NOT NULL');
    expect(ddl).toContain('CONSTRAINT "TestResource_History_pk" PRIMARY KEY ("versionId")');
  });
});

// =============================================================================
// Section 3: CREATE TABLE — References Table
// =============================================================================

describe('DDLGenerator — CREATE TABLE (References)', () => {
  it('generates correct references table DDL', () => {
    const ddl = generateCreateReferencesTable(minimalReferencesTable());
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS "TestResource_References"');
    expect(ddl).toContain('"resourceId" UUID NOT NULL');
    expect(ddl).toContain('"targetId" UUID NOT NULL');
    expect(ddl).toContain('"code" TEXT NOT NULL');
  });

  it('includes composite PK constraint', () => {
    const ddl = generateCreateReferencesTable(minimalReferencesTable());
    expect(ddl).toContain('CONSTRAINT "TestResource_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")');
  });
});

// =============================================================================
// Section 4: CREATE INDEX
// =============================================================================

describe('DDLGenerator — CREATE INDEX', () => {
  it('generates btree index', () => {
    const idx: IndexSchema = {
      name: 'Patient_lastUpdated_idx',
      columns: ['lastUpdated'],
      indexType: 'btree',
      unique: false,
    };
    const ddl = generateCreateIndex(idx, 'Patient');
    expect(ddl).toContain('CREATE INDEX IF NOT EXISTS "Patient_lastUpdated_idx"');
    expect(ddl).toContain('ON "Patient" USING btree ("lastUpdated")');
    expect(ddl).toMatch(/;$/);
  });

  it('generates gin index', () => {
    const idx: IndexSchema = {
      name: 'Patient_compartments_idx',
      columns: ['compartments'],
      indexType: 'gin',
      unique: false,
    };
    const ddl = generateCreateIndex(idx, 'Patient');
    expect(ddl).toContain('USING gin ("compartments")');
  });

  it('generates multi-column index', () => {
    const idx: IndexSchema = {
      name: 'Patient_projectId_lastUpdated_idx',
      columns: ['projectId', 'lastUpdated'],
      indexType: 'btree',
      unique: false,
    };
    const ddl = generateCreateIndex(idx, 'Patient');
    expect(ddl).toContain('("projectId", "lastUpdated")');
  });

  it('generates partial index with WHERE clause', () => {
    const idx: IndexSchema = {
      name: 'Patient_reindex_idx',
      columns: ['lastUpdated', '__version'],
      indexType: 'btree',
      unique: false,
      where: 'deleted = false',
    };
    const ddl = generateCreateIndex(idx, 'Patient');
    expect(ddl).toContain('WHERE deleted = false');
  });

  it('generates covering index with INCLUDE', () => {
    const idx: IndexSchema = {
      name: 'Patient_References_targetId_code_idx',
      columns: ['targetId', 'code'],
      indexType: 'btree',
      unique: false,
      include: ['resourceId'],
    };
    const ddl = generateCreateIndex(idx, 'Patient_References');
    expect(ddl).toContain('INCLUDE ("resourceId")');
  });

  it('generates unique index', () => {
    const idx: IndexSchema = {
      name: 'Patient_unique_idx',
      columns: ['id'],
      indexType: 'btree',
      unique: true,
    };
    const ddl = generateCreateIndex(idx, 'Patient');
    expect(ddl).toContain('CREATE UNIQUE INDEX IF NOT EXISTS');
  });
});

// =============================================================================
// Section 5: generateResourceDDL
// =============================================================================

describe('DDLGenerator — generateResourceDDL', () => {
  it('returns array of DDL statements', () => {
    const sdRegistry = new StructureDefinitionRegistry();
    const spRegistry = new SearchParameterRegistry();
    sdRegistry.index(makeProfile({ type: 'Patient' }));
    spRegistry.indexImpl('Patient', {
      code: 'birthdate', type: 'date', resourceTypes: ['Patient'],
      expression: 'Patient.birthDate', strategy: 'column',
      columnName: 'birthdate', columnType: 'TIMESTAMPTZ', array: false,
    });

    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const statements = generateResourceDDL(tableSet);

    // Should have 3 CREATE TABLEs + multiple CREATE INDEXes
    expect(statements.length).toBeGreaterThanOrEqual(3);

    // First 3 should be CREATE TABLE
    expect(statements[0]).toContain('CREATE TABLE IF NOT EXISTS "Patient"');
    expect(statements[1]).toContain('CREATE TABLE IF NOT EXISTS "Patient_History"');
    expect(statements[2]).toContain('CREATE TABLE IF NOT EXISTS "Patient_References"');

    // Rest should be CREATE INDEX
    for (let i = 3; i < statements.length; i++) {
      expect(statements[i]).toContain('CREATE');
      expect(statements[i]).toContain('INDEX');
    }
  });
});

// =============================================================================
// Section 6: generateSchemaDDL
// =============================================================================

describe('DDLGenerator — generateSchemaDDL', () => {
  it('tables come before indexes', () => {
    const sdRegistry = new StructureDefinitionRegistry();
    const spRegistry = new SearchParameterRegistry();
    sdRegistry.index(makeProfile({ type: 'Patient' }));
    sdRegistry.index(makeProfile({ type: 'Observation', url: 'http://hl7.org/fhir/StructureDefinition/Observation' }));

    const schema = buildSchemaDefinition(sdRegistry, spRegistry);
    const statements = generateSchemaDDL(schema);

    // Find the last CREATE TABLE and first CREATE INDEX
    let lastTableIdx = -1;
    let firstIndexIdx = statements.length;
    for (let i = 0; i < statements.length; i++) {
      if (statements[i].startsWith('CREATE TABLE')) {
        lastTableIdx = i;
      }
      if (statements[i].startsWith('CREATE') && statements[i].includes('INDEX') && firstIndexIdx === statements.length) {
        firstIndexIdx = i;
      }
    }

    expect(lastTableIdx).toBeLessThan(firstIndexIdx);
  });
});

// =============================================================================
// Section 7: generateSchemaDDLString
// =============================================================================

describe('DDLGenerator — generateSchemaDDLString', () => {
  it('includes header comment', () => {
    const sdRegistry = new StructureDefinitionRegistry();
    const spRegistry = new SearchParameterRegistry();
    sdRegistry.index(makeProfile({ type: 'Patient' }));

    const schema = buildSchemaDefinition(sdRegistry, spRegistry);
    const ddlString = generateSchemaDDLString(schema);

    expect(ddlString).toContain('-- MedXAI FHIR Schema DDL');
    expect(ddlString).toContain('-- Version: fhir-r4-v4.0.1');
    expect(ddlString).toContain('-- Resource types: 1');
    expect(ddlString).toContain('-- This file is auto-generated');
  });

  it('ends with newline', () => {
    const sdRegistry = new StructureDefinitionRegistry();
    const spRegistry = new SearchParameterRegistry();
    sdRegistry.index(makeProfile({ type: 'Patient' }));

    const schema = buildSchemaDefinition(sdRegistry, spRegistry);
    const ddlString = generateSchemaDDLString(schema);
    expect(ddlString).toMatch(/\n$/);
  });
});

// =============================================================================
// Section 8: Snapshot Tests (real spec files)
// =============================================================================

describe('DDLGenerator — Snapshot Tests', () => {
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

  it('Patient DDL snapshot', () => {
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const statements = generateResourceDDL(tableSet);
    const ddl = statements.join('\n\n');

    // Verify key structural elements
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS "Patient"');
    expect(ddl).toContain('"id" UUID NOT NULL');
    expect(ddl).toContain('"content" TEXT NOT NULL');
    expect(ddl).toContain('"compartments" UUID[] NOT NULL');
    expect(ddl).toContain('"birthdate" TIMESTAMPTZ');
    expect(ddl).toContain('__gender');
    expect(ddl).toContain('__nameSort');
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS "Patient_History"');
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS "Patient_References"');

    // Snapshot
    expect(ddl).toMatchSnapshot();
  });

  it('Observation DDL snapshot', () => {
    const tableSet = buildResourceTableSet('Observation', sdRegistry, spRegistry);
    const statements = generateResourceDDL(tableSet);
    const ddl = statements.join('\n\n');

    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS "Observation"');
    expect(ddl).toContain('"subject" TEXT');
    expect(ddl).toContain('__code');
    expect(ddl).toContain('"date" TIMESTAMPTZ');

    expect(ddl).toMatchSnapshot();
  });

  it('Binary DDL snapshot', () => {
    const tableSet = buildResourceTableSet('Binary', sdRegistry, spRegistry);
    const statements = generateResourceDDL(tableSet);
    const ddl = statements.join('\n\n');

    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS "Binary"');
    expect(ddl).not.toContain('compartments');

    expect(ddl).toMatchSnapshot();
  });

  it('full schema DDL is non-empty and valid', () => {
    const schema = buildSchemaDefinition(sdRegistry, spRegistry);
    const statements = generateSchemaDDL(schema);

    // Should have many statements
    expect(statements.length).toBeGreaterThan(400);

    // All should be valid SQL-ish
    for (const stmt of statements) {
      expect(stmt).toMatch(/^CREATE (EXTENSION|TABLE|UNIQUE )?INDEX IF NOT EXISTS|^CREATE TABLE IF NOT EXISTS|^CREATE EXTENSION IF NOT EXISTS|^CREATE OR REPLACE FUNCTION/);
      expect(stmt).toMatch(/;$/);
    }
  });
});
