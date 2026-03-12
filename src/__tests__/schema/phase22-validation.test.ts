/**
 * Phase 22 — Comprehensive Validation & Hardening Tests
 *
 * Task 22.1: DDL cross-validation for all 146 resource types
 * Task 22.2: Repo API completeness audit
 * Task 22.3: Edge case testing
 */

import { describe, it, expect } from 'vitest';
import { StructureDefinitionRegistry } from '../../registry/structure-definition-registry.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import type { SearchParameterBundle } from '../../registry/search-parameter-registry.js';
import { buildAllResourceTableSets, buildSchemaDefinition } from '../../schema/table-schema-builder.js';
import { generateResourceDDL, generateSchemaDDL } from '../../schema/ddl-generator.js';
import { loadBundleFromFile } from '@medxai/fhir-core';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// =============================================================================
// Registry Setup (reuse spec files)
// =============================================================================

const __dirname = dirname(fileURLToPath(import.meta.url));
const specDir = resolve(__dirname, '../../../../../spec/fhir/r4');

function loadRegistries() {
  const profiles = loadBundleFromFile(resolve(specDir, 'profiles-resources.json'));
  const sdRegistry = new StructureDefinitionRegistry();
  sdRegistry.indexAll(profiles.profiles);

  const spBundle = JSON.parse(
    readFileSync(resolve(specDir, 'search-parameters.json'), 'utf8'),
  ) as SearchParameterBundle;
  const spRegistry = new SearchParameterRegistry();
  spRegistry.indexBundle(spBundle);

  return { sdRegistry, spRegistry };
}

// =============================================================================
// Task 22.1: Full DDL Cross-Validation
// =============================================================================

describe('Phase 22 — DDL cross-validation for all resource types', () => {
  const { sdRegistry, spRegistry } = loadRegistries();
  const tableSets = buildAllResourceTableSets(sdRegistry, spRegistry);

  it('generates table sets for all concrete resource types (140+)', () => {
    expect(tableSets.length).toBeGreaterThanOrEqual(140);
  });

  it('every table set has main, history, and references tables', () => {
    for (const ts of tableSets) {
      expect(ts.main).toBeDefined();
      expect(ts.main.tableName).toBe(ts.resourceType);
      expect(ts.history).toBeDefined();
      expect(ts.history.tableName).toBe(`${ts.resourceType}_History`);
      expect(ts.references).toBeDefined();
      expect(ts.references.tableName).toBe(`${ts.resourceType}_References`);
    }
  });

  it('every main table has required fixed columns', () => {
    const requiredCols = ['id', 'content', 'lastUpdated', 'deleted', 'projectId', '__version'];
    for (const ts of tableSets) {
      const colNames = ts.main.columns.map(c => c.name);
      for (const req of requiredCols) {
        expect(colNames, `${ts.resourceType} missing ${req}`).toContain(req);
      }
    }
  });

  it('every main table has __sharedTokens and __sharedTokensText columns', () => {
    for (const ts of tableSets) {
      const colNames = ts.main.columns.map(c => c.name);
      expect(colNames, `${ts.resourceType} missing __sharedTokens`).toContain('__sharedTokens');
      expect(colNames, `${ts.resourceType} missing __sharedTokensText`).toContain('__sharedTokensText');
    }
  });

  it('non-Binary resources have compartments column', () => {
    for (const ts of tableSets) {
      const colNames = ts.main.columns.map(c => c.name);
      if (ts.resourceType === 'Binary') {
        expect(colNames).not.toContain('compartments');
      } else {
        expect(colNames, `${ts.resourceType} missing compartments`).toContain('compartments');
      }
    }
  });

  it('every history table has required columns', () => {
    const requiredCols = ['versionId', 'id', 'content', 'lastUpdated'];
    for (const ts of tableSets) {
      const colNames = ts.history.columns.map(c => c.name);
      for (const req of requiredCols) {
        expect(colNames, `${ts.resourceType}_History missing ${req}`).toContain(req);
      }
    }
  });

  it('every references table has required columns', () => {
    const requiredCols = ['resourceId', 'targetId', 'code'];
    for (const ts of tableSets) {
      const colNames = ts.references.columns.map(c => c.name);
      for (const req of requiredCols) {
        expect(colNames, `${ts.resourceType}_References missing ${req}`).toContain(req);
      }
    }
  });

  it('DDL generation succeeds for all resource types without errors', () => {
    for (const ts of tableSets) {
      const ddl = generateResourceDDL(ts);
      expect(ddl.length, `${ts.resourceType} DDL empty`).toBeGreaterThan(0);
      for (const stmt of ddl) {
        expect(stmt).toBeTruthy();
      }
    }
  });

  it('full schema DDL generates valid SQL statements', () => {
    const schema = buildSchemaDefinition(sdRegistry, spRegistry);
    const stmts = generateSchemaDDL(schema);
    expect(stmts.length).toBeGreaterThan(0);

    // Every statement should be a CREATE TABLE or CREATE INDEX
    for (const stmt of stmts) {
      expect(
        stmt.startsWith('CREATE TABLE') || stmt.startsWith('CREATE INDEX') || stmt.startsWith('CREATE UNIQUE INDEX') || stmt.startsWith('CREATE EXTENSION') || stmt.startsWith('CREATE OR REPLACE FUNCTION'),
        `Invalid DDL: ${stmt.slice(0, 80)}`,
      ).toBe(true);
    }
  });

  it('Patient table has expected search columns', () => {
    const patient = tableSets.find(ts => ts.resourceType === 'Patient');
    expect(patient).toBeDefined();
    const colNames = patient!.main.columns.map(c => c.name);
    // These are key search params for Patient
    expect(colNames).toContain('birthdate');
  });

  it('Observation table has expected search columns', () => {
    const obs = tableSets.find(ts => ts.resourceType === 'Observation');
    expect(obs).toBeDefined();
    const colNames = obs!.main.columns.map(c => c.name);
    expect(colNames).toContain('subject');
  });
});

// =============================================================================
// Task 22.3: Edge Case Testing
// =============================================================================

describe('Phase 22 — edge case testing', () => {
  it('buildSearchColumns handles empty resource gracefully', async () => {
    const { buildSearchColumns } = await import('../../repo/row-indexer.js');
    const result = buildSearchColumns({ resourceType: 'Patient' } as any, []);
    expect(result).toEqual({});
  });

  it('buildSearchColumns handles null/undefined nested values', async () => {
    const { buildSearchColumns } = await import('../../repo/row-indexer.js');
    const result = buildSearchColumns(
      { resourceType: 'Patient', name: null } as any,
      [{
        code: 'name',
        type: 'string',
        resourceTypes: ['Patient'],
        expression: 'Patient.name',
        strategy: 'lookup-table',
        columnName: 'name',
        columnType: 'TEXT',
        array: false,
      }],
    );
    // Should not throw, just return empty or partial
    expect(result).toBeDefined();
  });

  it('buildSearchColumns handles deeply nested resources', async () => {
    const { buildSearchColumns } = await import('../../repo/row-indexer.js');
    const resource = {
      resourceType: 'Observation',
      code: {
        coding: [
          { system: 'http://loinc.org', code: '12345-6', display: 'Blood pressure' },
        ],
        text: 'Blood pressure',
      },
      subject: { reference: 'Patient/123' },
    };

    const result = buildSearchColumns(resource as any, [
      {
        code: 'code',
        type: 'token',
        resourceTypes: ['Observation'],
        expression: 'Observation.code',
        strategy: 'token-column',
        columnName: 'code',
        columnType: 'UUID[]',
        array: true,
      },
      {
        code: 'subject',
        type: 'reference',
        resourceTypes: ['Observation'],
        expression: 'Observation.subject',
        strategy: 'column',
        columnName: 'subject',
        columnType: 'TEXT',
        array: false,
      },
    ]);

    expect(result['__code']).toBeDefined();
    expect(result['__codeText']).toBeDefined();
    expect(result['subject']).toBe('Patient/123');
  });

  it('buildSearchColumns handles unicode/CJK characters', async () => {
    const { buildSearchColumns } = await import('../../repo/row-indexer.js');
    const resource = {
      resourceType: 'Patient',
      name: [{ family: '张', given: ['三'] }],
    };

    const result = buildSearchColumns(resource as any, [
      {
        code: 'name',
        type: 'string',
        resourceTypes: ['Patient'],
        expression: 'Patient.name',
        strategy: 'lookup-table',
        columnName: 'name',
        columnType: 'TEXT',
        array: false,
      },
    ]);

    expect(result['__nameSort']).toBe('张 三');
  });

  it('buildSearchColumns handles empty arrays', async () => {
    const { buildSearchColumns } = await import('../../repo/row-indexer.js');
    const resource = {
      resourceType: 'Patient',
      name: [],
      identifier: [],
    };

    const result = buildSearchColumns(resource as any, [
      {
        code: 'name',
        type: 'string',
        resourceTypes: ['Patient'],
        expression: 'Patient.name',
        strategy: 'lookup-table',
        columnName: 'name',
        columnType: 'TEXT',
        array: false,
      },
      {
        code: 'identifier',
        type: 'token',
        resourceTypes: ['Patient'],
        expression: 'Patient.identifier',
        strategy: 'token-column',
        columnName: 'identifier',
        columnType: 'UUID[]',
        array: true,
      },
    ]);

    // Empty arrays → no columns populated
    expect(result['__nameSort']).toBeUndefined();
    expect(result['__identifier']).toBeUndefined();
  });

  it('buildSearchColumns handles boolean token values', async () => {
    const { buildSearchColumns } = await import('../../repo/row-indexer.js');
    const resource = {
      resourceType: 'Patient',
      active: true,
    };

    const result = buildSearchColumns(resource as any, [
      {
        code: 'active',
        type: 'token',
        resourceTypes: ['Patient'],
        expression: 'Patient.active',
        strategy: 'token-column',
        columnName: 'active',
        columnType: 'UUID[]',
        array: true,
      },
    ]);

    expect(result['__activeText']).toEqual(['true']);
  });
});

// =============================================================================
// Task 22.2: Repo API Completeness
// =============================================================================

describe('Phase 22 — Repo API completeness audit', () => {
  it('FhirRepository exports all required methods', async () => {
    const { FhirRepository } = await import('../../repo/fhir-repo.js');
    const methods = Object.getOwnPropertyNames(FhirRepository.prototype).filter(
      m => m !== 'constructor',
    );

    // Core CRUD
    expect(methods).toContain('createResource');
    expect(methods).toContain('readResource');
    expect(methods).toContain('updateResource');
    expect(methods).toContain('deleteResource');

    // History
    expect(methods).toContain('readHistory');
    expect(methods).toContain('readTypeHistory');
    expect(methods).toContain('readVersion');

    // Search
    expect(methods).toContain('searchResources');

    // Phase 20 — Conditional operations
    expect(methods).toContain('conditionalCreate');
    expect(methods).toContain('conditionalUpdate');
    expect(methods).toContain('conditionalDelete');

    // Phase 20 — $everything
    expect(methods).toContain('everything');
  });

  it('bundle-processor exports transaction and batch processors', async () => {
    const bp = await import('../../repo/bundle-processor.js');
    expect(typeof bp.processTransaction).toBe('function');
    expect(typeof bp.processBatch).toBe('function');
  });

  it('ResourceCache exports with expected API', async () => {
    const { ResourceCache } = await import('../../cache/resource-cache.js');
    const cache = new ResourceCache({ enabled: true });

    expect(typeof cache.get).toBe('function');
    expect(typeof cache.set).toBe('function');
    expect(typeof cache.invalidate).toBe('function');
    expect(typeof cache.clear).toBe('function');
    expect(typeof cache.size).toBe('number');
    expect(typeof cache.stats).toBe('object');
    expect(typeof cache.isEnabled).toBe('boolean');
  });

  it('error classes export correctly', async () => {
    const errors = await import('../../repo/errors.js');
    expect(errors.ResourceNotFoundError).toBeDefined();
    expect(errors.ResourceGoneError).toBeDefined();
    expect(errors.ResourceVersionConflictError).toBeDefined();
    expect(errors.PreconditionFailedError).toBeDefined();
    expect(errors.RepositoryError).toBeDefined();
  });

  it('reindex tool exports correctly', async () => {
    const reindex = await import('../../repo/reindex.js');
    expect(typeof reindex.reindexResourceType).toBe('function');
    expect(typeof reindex.reindexAll).toBe('function');
  });

  it('DatabaseClient has explain method', async () => {
    const { DatabaseClient } = await import('../../db/client.js');
    expect(DatabaseClient.prototype.explain).toBeDefined();
  });
});
