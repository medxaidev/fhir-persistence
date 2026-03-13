/**
 * B4: FhirSystem End-to-End Startup Tests
 *
 * Verifies the complete startup flow:
 * DefinitionProvider → Registries → IGPersistenceManager → FhirPersistence ready
 *
 * ADR-01 §4.1, ADR-03, ADR-04
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FhirSystem } from '../../startup/fhir-system.js';
import { InMemoryDefinitionProvider } from '../../providers/in-memory-definition-provider.js';
import { PropertyPathRuntimeProvider } from '../../providers/property-path-runtime-provider.js';
import { SQLiteAdapter } from '../../db/sqlite-adapter.js';
import type { DefinitionProvider, SearchParameterDef, StructureDefinitionDef } from '../../providers/definition-provider.js';

// =============================================================================
// Helpers
// =============================================================================

function buildTestProvider(): InMemoryDefinitionProvider {
  const dp = new InMemoryDefinitionProvider();

  // Register resource SDs
  dp.addStructureDefinition({
    resourceType: 'StructureDefinition',
    url: 'http://hl7.org/fhir/StructureDefinition/Patient',
    name: 'Patient',
    type: 'Patient',
    kind: 'resource',
  });
  dp.addStructureDefinition({
    resourceType: 'StructureDefinition',
    url: 'http://hl7.org/fhir/StructureDefinition/Observation',
    name: 'Observation',
    type: 'Observation',
    kind: 'resource',
  });

  // Register SearchParameters
  dp.addSearchParameter({
    resourceType: 'SearchParameter',
    code: 'birthdate',
    type: 'date',
    base: ['Patient'],
    expression: 'Patient.birthDate',
  });
  dp.addSearchParameter({
    resourceType: 'SearchParameter',
    code: 'gender',
    type: 'token',
    base: ['Patient'],
    expression: 'Patient.gender',
  });
  dp.addSearchParameter({
    resourceType: 'SearchParameter',
    code: 'active',
    type: 'token',
    base: ['Patient'],
    expression: 'Patient.active',
  });
  dp.addSearchParameter({
    resourceType: 'SearchParameter',
    code: 'subject',
    type: 'reference',
    base: ['Observation'],
    expression: 'Observation.subject',
    target: ['Patient', 'Group'],
  });
  dp.addSearchParameter({
    resourceType: 'SearchParameter',
    code: 'status',
    type: 'token',
    base: ['Observation'],
    expression: 'Observation.status',
  });
  dp.addSearchParameter({
    resourceType: 'SearchParameter',
    code: 'code',
    type: 'token',
    base: ['Observation'],
    expression: 'Observation.code',
  });

  return dp;
}

// =============================================================================
// Tests
// =============================================================================

describe('B4: FhirSystem Startup Flow', () => {
  let adapter: SQLiteAdapter;

  beforeEach(async () => {
    adapter = new SQLiteAdapter(':memory:');
    await adapter.execute('SELECT 1'); // warm up
  });

  afterEach(async () => {
    await adapter.close();
  });

  // ---------------------------------------------------------------------------
  // Fresh install
  // ---------------------------------------------------------------------------

  describe('Fresh install', () => {
    it('initializes with DefinitionProvider and returns ready state', async () => {
      const dp = buildTestProvider();
      const system = new FhirSystem(adapter);
      const result = await system.initialize(dp);

      expect(result.persistence).toBeDefined();
      expect(result.sdRegistry).toBeDefined();
      expect(result.spRegistry).toBeDefined();
      expect(result.igResult).toBeDefined();
      expect(result.resourceTypes).toContain('Patient');
      expect(result.resourceTypes).toContain('Observation');
    });

    it('IG result is "new" on fresh install', async () => {
      const dp = buildTestProvider();
      const system = new FhirSystem(adapter);
      const result = await system.initialize(dp);

      expect(result.igResult.action).toBe('new');
      expect(result.igResult.ddlCount).toBeGreaterThan(0);
    });

    it('SD registry is populated from DefinitionProvider', async () => {
      const dp = buildTestProvider();
      const system = new FhirSystem(adapter);
      const result = await system.initialize(dp);

      expect(result.sdRegistry.has('Patient')).toBe(true);
      expect(result.sdRegistry.has('Observation')).toBe(true);
    });

    it('SP registry is populated from DefinitionProvider', async () => {
      const dp = buildTestProvider();
      const system = new FhirSystem(adapter);
      const result = await system.initialize(dp);

      const patientSPs = result.spRegistry.getForResource('Patient');
      expect(patientSPs.length).toBeGreaterThanOrEqual(2);
      expect(patientSPs.some(sp => sp.code === 'birthdate')).toBe(true);
      expect(patientSPs.some(sp => sp.code === 'gender')).toBe(true);

      const obsSPs = result.spRegistry.getForResource('Observation');
      expect(obsSPs.length).toBeGreaterThanOrEqual(2);
      expect(obsSPs.some(sp => sp.code === 'subject')).toBe(true);
    });

    it('creates database tables for all resource types', async () => {
      const dp = buildTestProvider();
      const system = new FhirSystem(adapter);
      await system.initialize(dp);

      // Verify Patient table exists
      const patientRows = await adapter.query<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='Patient'",
      );
      expect(patientRows).toHaveLength(1);

      // Verify Patient_History table exists
      const historyRows = await adapter.query<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='Patient_History'",
      );
      expect(historyRows).toHaveLength(1);

      // Verify Patient_References table exists
      const refRows = await adapter.query<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='Patient_References'",
      );
      expect(refRows).toHaveLength(1);

      // Verify Observation table exists
      const obsRows = await adapter.query<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='Observation'",
      );
      expect(obsRows).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Consistent (second init with same definitions)
  // ---------------------------------------------------------------------------

  describe('Consistent (idempotent)', () => {
    it('returns "consistent" on second init with same definitions', async () => {
      const dp = buildTestProvider();
      const system = new FhirSystem(adapter);

      // First init
      const r1 = await system.initialize(dp);
      expect(r1.igResult.action).toBe('new');

      // Second init — same definitions → consistent
      const r2 = await system.initialize(dp);
      expect(r2.igResult.action).toBe('consistent');
      expect(r2.igResult.ddlCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // With RuntimeProvider
  // ---------------------------------------------------------------------------

  describe('With RuntimeProvider', () => {
    it('passes RuntimeProvider to FhirPersistence pipeline', async () => {
      const dp = buildTestProvider();
      const runtimeProvider = new PropertyPathRuntimeProvider();
      const system = new FhirSystem(adapter, { runtimeProvider });

      const result = await system.initialize(dp);
      expect(result.persistence).toBeDefined();

      // The persistence facade should be able to create resources
      // (this indirectly verifies the pipeline is wired correctly)
      const pipeline = result.persistence.getPipeline();
      expect(pipeline).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // CRUD after initialization
  // ---------------------------------------------------------------------------

  describe('CRUD after initialization', () => {
    it('can create and read a Patient after init', async () => {
      const dp = buildTestProvider();
      const runtimeProvider = new PropertyPathRuntimeProvider();
      const system = new FhirSystem(adapter, {
        enableLookupTables: false,
        runtimeProvider,
      });
      const { persistence } = await system.initialize(dp);

      const created = await persistence.createResource('Patient', {
        resourceType: 'Patient',
        birthDate: '1990-01-15',
        gender: 'male',
      });

      expect(created.id).toBeDefined();
      expect(created.meta?.versionId).toBeDefined();

      const read = await persistence.readResource('Patient', created.id!);
      expect(read.resourceType).toBe('Patient');
      expect((read as any).birthDate).toBe('1990-01-15');
    });

    it('can create and read an Observation after init', async () => {
      const dp = buildTestProvider();
      const runtimeProvider = new PropertyPathRuntimeProvider();
      const system = new FhirSystem(adapter, {
        enableLookupTables: false,
        runtimeProvider,
      });
      const { persistence } = await system.initialize(dp);

      // Create Patient first
      const patient = await persistence.createResource('Patient', {
        resourceType: 'Patient',
        gender: 'female',
      });

      // Create Observation referencing Patient
      const obs = await persistence.createResource('Observation', {
        resourceType: 'Observation',
        status: 'final',
        subject: { reference: `Patient/${patient.id}` },
      });

      expect(obs.id).toBeDefined();
      const readObs = await persistence.readResource('Observation', obs.id!);
      expect((readObs as any).status).toBe('final');
    });
  });

  // ---------------------------------------------------------------------------
  // Options
  // ---------------------------------------------------------------------------

  describe('Options', () => {
    it('uses custom packageName and version', async () => {
      const dp = buildTestProvider();
      const system = new FhirSystem(adapter, {
        packageName: 'my-app.fhir',
        packageVersion: '2.0.0',
      });

      const result = await system.initialize(dp);
      expect(result.igResult.packageName).toBe('my-app.fhir');
      expect(result.igResult.packageVersion).toBe('2.0.0');
    });

    it('handles empty DefinitionProvider gracefully', async () => {
      const dp = new InMemoryDefinitionProvider();
      const system = new FhirSystem(adapter);

      const result = await system.initialize(dp);
      expect(result.resourceTypes).toHaveLength(0);
      expect(result.persistence).toBeDefined();
    });
  });
});
