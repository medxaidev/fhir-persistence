/**
 * Phase 19 — Lookup Tables, Trigram Indexes, Shared Tokens — Schema Tests
 */

import { describe, it, expect } from 'vitest';
import { SearchParameterRegistry } from '../../registry/search-parameter-registry.js';
import type { SearchParameterImpl } from '../../registry/search-parameter-registry.js';
import { buildResourceTableSet, buildGlobalLookupTables } from '../../schema/table-schema-builder.js';
import { generateCreateGlobalLookupTable } from '../../schema/ddl-generator.js';
import { StructureDefinitionRegistry } from '../../registry/structure-definition-registry.js';

// =============================================================================
// Helpers
// =============================================================================

function makeImpl(overrides: Partial<SearchParameterImpl> & { code: string; type: SearchParameterImpl['type'] }): SearchParameterImpl {
  return {
    resourceTypes: ['Patient'],
    expression: '',
    strategy: 'column',
    columnName: overrides.code,
    columnType: 'TEXT',
    array: false,
    ...overrides,
  };
}

function makeMinimalRegistries() {
  const sdRegistry = new StructureDefinitionRegistry();
  sdRegistry.index({
    resourceType: 'StructureDefinition',
    id: 'Patient',
    url: 'http://hl7.org/fhir/StructureDefinition/Patient',
    name: 'Patient',
    status: 'active',
    kind: 'resource',
    abstract: false,
    type: 'Patient',
    snapshot: { element: [{ id: 'Patient', path: 'Patient' }] },
  } as any);

  const spRegistry = new SearchParameterRegistry();
  return { sdRegistry, spRegistry };
}

// =============================================================================
// Lookup Table Schema
// =============================================================================

describe('Phase 19 — lookup table schema generation', () => {
  it('generates 4 global shared lookup tables (Medplum-style)', () => {
    const tables = buildGlobalLookupTables();
    expect(tables).toHaveLength(4);

    const names = tables.map(t => t.tableName);
    expect(names).toContain('HumanName');
    expect(names).toContain('Address');
    expect(names).toContain('ContactPoint');
    expect(names).toContain('Identifier');

    // HumanName has name/given/family columns
    const hn = tables.find(t => t.tableName === 'HumanName')!;
    const hnCols = hn.columns.map(c => c.name);
    expect(hnCols).toContain('resourceId');
    expect(hnCols).toContain('name');
    expect(hnCols).toContain('given');
    expect(hnCols).toContain('family');

    // Address has address/city/country/postalCode/state/use columns
    const addr = tables.find(t => t.tableName === 'Address')!;
    const addrCols = addr.columns.map(c => c.name);
    expect(addrCols).toContain('resourceId');
    expect(addrCols).toContain('address');
    expect(addrCols).toContain('city');
    expect(addrCols).toContain('country');
    expect(addrCols).toContain('postalCode');
    expect(addrCols).toContain('state');
    expect(addrCols).toContain('use');

    // ContactPoint has system/value/use columns
    const cp = tables.find(t => t.tableName === 'ContactPoint')!;
    const cpCols = cp.columns.map(c => c.name);
    expect(cpCols).toContain('resourceId');
    expect(cpCols).toContain('system');
    expect(cpCols).toContain('value');
    expect(cpCols).toContain('use');

    // Identifier has system/value columns
    const id = tables.find(t => t.tableName === 'Identifier')!;
    const idCols = id.columns.map(c => c.name);
    expect(idCols).toContain('resourceId');
    expect(idCols).toContain('system');
    expect(idCols).toContain('value');
  });

  it('does not generate lookup tables for non-lookup-table strategy', () => {
    const { sdRegistry, spRegistry } = makeMinimalRegistries();
    spRegistry.indexImpl('Patient', makeImpl({
      code: 'gender',
      type: 'token',
      strategy: 'token-column',
      columnName: 'gender',
    }));

    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    expect(tableSet.lookupTables).toBeUndefined();
  });

  it('generates valid DDL for global lookup tables', () => {
    const tables = buildGlobalLookupTables();
    const hn = tables.find(t => t.tableName === 'HumanName')!;
    const ddl = generateCreateGlobalLookupTable(hn);
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS "HumanName"');
    expect(ddl).toContain('"resourceId" UUID NOT NULL');
    expect(ddl).toContain('"name" TEXT');
    expect(ddl).toContain('"given" TEXT');
    expect(ddl).toContain('"family" TEXT');
    // No PRIMARY KEY on global lookup tables (matches Medplum)
    expect(ddl).not.toContain('PRIMARY KEY');
  });
});

// =============================================================================
// Shared Token Columns
// =============================================================================

describe('Phase 19 — shared token columns in schema', () => {
  it('main table includes __sharedTokens and __sharedTokensText columns', () => {
    const { sdRegistry, spRegistry } = makeMinimalRegistries();
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);

    const colNames = tableSet.main.columns.map(c => c.name);
    expect(colNames).toContain('__sharedTokens');
    expect(colNames).toContain('__sharedTokensText');
  });

  it('main table includes GIN index on __sharedTokens', () => {
    const { sdRegistry, spRegistry } = makeMinimalRegistries();
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);

    const indexNames = tableSet.main.indexes.map(i => i.name);
    expect(indexNames).toContain('Patient___sharedTokens_idx');
  });
});

// =============================================================================
// Trigram Indexes
// =============================================================================

describe('Phase 19 — trigram indexes in schema', () => {
  it('generates trigram indexes for token-column text columns', () => {
    const { sdRegistry, spRegistry } = makeMinimalRegistries();
    spRegistry.indexImpl('Patient', makeImpl({
      code: 'identifier',
      type: 'token',
      strategy: 'token-column',
      columnName: 'identifier',
    }));

    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
    const indexNames = tableSet.main.indexes.map(i => i.name);
    expect(indexNames).toContain('Patient___identifierText_trgm_idx');
  });

  it('generates trigram indexes for fixed metadata text columns', () => {
    const { sdRegistry, spRegistry } = makeMinimalRegistries();
    const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);

    const indexNames = tableSet.main.indexes.map(i => i.name);
    expect(indexNames).toContain('Patient____tagText_trgm_idx');
    expect(indexNames).toContain('Patient___sharedTokensText_trgm_idx');
  });
});
