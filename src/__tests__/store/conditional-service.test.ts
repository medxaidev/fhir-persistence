/**
 * B6: ConditionalService v2 Tests
 *
 * Verifies conditional create/update/delete using StorageAdapter + ? placeholders.
 * ADR-07: No projectId, transactional TOCTOU protection.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConditionalService } from '../../store/conditional-service.js';
import { FhirStore } from '../../store/fhir-store.js';
import { BetterSqlite3Adapter } from '../../db/better-sqlite3-adapter.js';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import { StructureDefinitionRegistry } from '../../registry/structure-definition-registry.js';
import { buildResourceTableSet } from '../../schema/table-schema-builder.js';
import { IGPersistenceManager } from '../../migration/ig-persistence-manager.js';
import { PreconditionFailedError } from '../../repo/errors.js';
import type { ParsedSearchParam } from '../../search/types.js';

// =============================================================================
// Helpers
// =============================================================================

function makeProfile(type: string) {
  return {
    url: `http://hl7.org/fhir/StructureDefinition/${type}`,
    name: type,
    kind: 'resource' as const,
    type,
    abstract: false,
    elements: new Map(),
  };
}

async function setupDB(): Promise<{
  adapter: BetterSqlite3Adapter;
  registry: SearchParameterRegistry;
  service: ConditionalService;
  store: FhirStore;
}> {
  const adapter = new BetterSqlite3Adapter({ path: ':memory:' });
  await adapter.execute('SELECT 1');

  const sdReg = new StructureDefinitionRegistry();
  sdReg.indexAll([makeProfile('Patient'), makeProfile('Observation')]);

  const spReg = new SearchParameterRegistry();
  spReg.indexBundle({
    resourceType: 'Bundle',
    entry: [
      {
        resource: {
          resourceType: 'SearchParameter',
          code: 'gender',
          type: 'token',
          base: ['Patient'],
          expression: 'Patient.gender',
        },
      },
      {
        resource: {
          resourceType: 'SearchParameter',
          code: 'birthdate',
          type: 'date',
          base: ['Patient'],
          expression: 'Patient.birthDate',
        },
      },
      {
        resource: {
          resourceType: 'SearchParameter',
          code: 'active',
          type: 'token',
          base: ['Patient'],
          expression: 'Patient.active',
        },
      },
      {
        resource: {
          resourceType: 'SearchParameter',
          code: 'status',
          type: 'token',
          base: ['Observation'],
          expression: 'Observation.status',
        },
      },
    ],
  });

  // Create tables
  const igManager = new IGPersistenceManager(adapter, 'sqlite');
  const tableSets = [
    buildResourceTableSet('Patient', sdReg, spReg),
    buildResourceTableSet('Observation', sdReg, spReg),
  ];
  await igManager.initialize({
    name: 'test',
    version: '1.0.0',
    checksum: 'sha256:test',
    tableSets,
  });

  const store = new FhirStore(adapter);
  const service = new ConditionalService(adapter, spReg);

  return { adapter, registry: spReg, service, store };
}

// =============================================================================
// Tests
// =============================================================================

describe('B6: ConditionalService v2', () => {
  let adapter: BetterSqlite3Adapter;
  let service: ConditionalService;
  let store: FhirStore;

  beforeEach(async () => {
    const setup = await setupDB();
    adapter = setup.adapter;
    service = setup.service;
    store = setup.store;
  });

  afterEach(async () => {
    await adapter.close();
  });

  // ---------------------------------------------------------------------------
  // conditionalCreate
  // ---------------------------------------------------------------------------

  describe('conditionalCreate', () => {
    it('creates resource when no match found (0 matches)', async () => {
      const result = await service.conditionalCreate(
        'Patient',
        { resourceType: 'Patient', gender: 'male' } as any,
        [{ code: '_id', values: ['non-existent-id'] }] as ParsedSearchParam[],
      );

      expect(result.outcome).toBe('created');
      expect(result.resource.id).toBeDefined();
      expect(result.resource.meta?.versionId).toBeDefined();
    });

    it('returns existing resource when 1 match found', async () => {
      const created = await store.createResource('Patient', {
        resourceType: 'Patient',
        gender: 'male',
      });

      // Conditional create with _id of existing resource â†?should return existing
      const result = await service.conditionalCreate(
        'Patient',
        { resourceType: 'Patient', gender: 'female' } as any,
        [{ code: '_id', values: [created.id!] }] as ParsedSearchParam[],
      );

      expect(result.outcome).toBe('existing');
      expect(result.resource.id).toBe(created.id);
    });

    it('throws PreconditionFailedError when 2+ matches found', async () => {
      const p1 = await store.createResource('Patient', { resourceType: 'Patient' });
      const p2 = await store.createResource('Patient', { resourceType: 'Patient' });

      // _id with OR semantics (two IDs)
      await expect(
        service.conditionalCreate(
          'Patient',
          { resourceType: 'Patient' } as any,
          [{ code: '_id', values: [p1.id!, p2.id!] }] as ParsedSearchParam[],
        ),
      ).rejects.toThrow(PreconditionFailedError);
    });
  });

  // ---------------------------------------------------------------------------
  // conditionalUpdate
  // ---------------------------------------------------------------------------

  describe('conditionalUpdate', () => {
    it('creates resource when no match found (0 matches)', async () => {
      const result = await service.conditionalUpdate(
        'Patient',
        { resourceType: 'Patient', gender: 'male' } as any,
        [{ code: '_id', values: ['non-existent'] }] as ParsedSearchParam[],
      );

      expect(result.outcome).toBe('created');
      expect(result.resource.id).toBeDefined();
    });

    it('updates existing resource when 1 match found', async () => {
      const created = await store.createResource('Patient', {
        resourceType: 'Patient',
        gender: 'male',
      });

      const result = await service.conditionalUpdate(
        'Patient',
        { resourceType: 'Patient', gender: 'female' } as any,
        [{ code: '_id', values: [created.id!] }] as ParsedSearchParam[],
      );

      expect(result.outcome).toBe('updated');
      expect(result.resource.id).toBe(created.id);
      expect(result.resource.meta?.versionId).not.toBe(created.meta?.versionId);
    });

    it('throws PreconditionFailedError when 2+ matches found', async () => {
      const p1 = await store.createResource('Patient', { resourceType: 'Patient' });
      const p2 = await store.createResource('Patient', { resourceType: 'Patient' });

      await expect(
        service.conditionalUpdate(
          'Patient',
          { resourceType: 'Patient', gender: 'other' } as any,
          [{ code: '_id', values: [p1.id!, p2.id!] }] as ParsedSearchParam[],
        ),
      ).rejects.toThrow(PreconditionFailedError);
    });
  });

  // ---------------------------------------------------------------------------
  // conditionalDelete
  // ---------------------------------------------------------------------------

  describe('conditionalDelete', () => {
    it('returns count=0 when no matches', async () => {
      const result = await service.conditionalDelete(
        'Patient',
        [{ code: '_id', values: ['non-existent'] }] as ParsedSearchParam[],
      );
      expect(result.count).toBe(0);
    });

    it('deletes single matching resource', async () => {
      const created = await store.createResource('Patient', {
        resourceType: 'Patient',
      });

      const result = await service.conditionalDelete(
        'Patient',
        [{ code: '_id', values: [created.id!] }] as ParsedSearchParam[],
      );

      expect(result.count).toBe(1);

      // Verify resource is soft-deleted
      const row = await adapter.queryOne<{ deleted: number }>(
        'SELECT "deleted" FROM "Patient" WHERE "id" = ?',
        [created.id],
      );
      expect(row?.deleted).toBe(1);
    });

    it('deletes multiple matching resources', async () => {
      const p1 = await store.createResource('Patient', { resourceType: 'Patient' });
      const p2 = await store.createResource('Patient', { resourceType: 'Patient' });
      const p3 = await store.createResource('Patient', { resourceType: 'Patient' });

      // Delete p1 and p2 only
      const result = await service.conditionalDelete(
        'Patient',
        [{ code: '_id', values: [p1.id!, p2.id!] }] as ParsedSearchParam[],
      );

      expect(result.count).toBe(2);

      // Verify p3 is still active
      const remaining = await adapter.query<{ id: string; deleted: number }>(
        'SELECT "id", "deleted" FROM "Patient" WHERE "deleted" = 0',
      );
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(p3.id);
    });

    it('creates history entries for deleted resources', async () => {
      const p1 = await store.createResource('Patient', { resourceType: 'Patient' });

      await service.conditionalDelete(
        'Patient',
        [{ code: '_id', values: [p1.id!] }] as ParsedSearchParam[],
      );

      // Should have 2 history entries: 1 from create + 1 from delete
      const history = await adapter.query<{ deleted: number }>(
        'SELECT "deleted" FROM "Patient_History"',
      );
      expect(history).toHaveLength(2);
      expect(history.some(h => h.deleted === 1)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Uses ? placeholders (ADR-07)
  // ---------------------------------------------------------------------------

  describe('ADR-07: ? placeholders', () => {
    it('all SQL uses ? placeholders (no $N)', async () => {
      // Verified by passing with BetterSqlite3Adapter which only supports ? placeholders
      const result = await service.conditionalCreate(
        'Patient',
        { resourceType: 'Patient' } as any,
        [{ code: '_id', values: ['no-match'] }] as ParsedSearchParam[],
      );
      expect(result.outcome).toBe('created');
    });
  });
});
