/**
 * TableSchemaBuilder v2 Tests — 12 tests covering v2 upgrades.
 *
 * Tests that the schema builder produces correct v2 columns:
 * - versionId in main table
 * - No projectId, no __version, no UUID types
 * - 2-col token strategy (TEXT + TEXT sort)
 * - targetType + referenceRaw in references
 * - versionSeq in history
 * - searchParams metadata
 */
import { describe, it, expect } from 'vitest';
import { buildResourceTableSet } from '../../schema/table-schema-builder.js';
import type { StructureDefinitionRegistry } from '../../registry/structure-definition-registry.js';
import type { SearchParameterRegistry, SearchParameterImpl } from '../../registry/search-parameter-registry.js';

// ---------------------------------------------------------------------------
// Mock registries
// ---------------------------------------------------------------------------

function mockSdRegistry(resourceType: string): StructureDefinitionRegistry {
  return {
    get: (rt: string) => {
      if (rt === resourceType) {
        return { type: resourceType, kind: 'resource', abstract: false } as any;
      }
      return undefined;
    },
    has: (rt: string) => rt === resourceType,
    getTableResourceTypes: () => [resourceType],
    getAllTypes: () => [resourceType],
    size: 1,
    clear: () => {},
    index: () => {},
    indexAll: () => {},
  } as any;
}

function mockSpRegistry(impls: SearchParameterImpl[]): SearchParameterRegistry {
  return {
    getForResource: () => impls,
  } as any;
}

function mockImpl(overrides: Partial<SearchParameterImpl>): SearchParameterImpl {
  return {
    code: 'test',
    type: 'string',
    resourceTypes: ['Patient'],
    expression: 'Patient.test',
    strategy: 'column',
    columnName: 'test',
    columnType: 'TEXT',
    array: false,
    ...overrides,
  };
}

describe('TableSchemaBuilder v2', () => {
  // =========================================================================
  // 1. Fixed columns include versionId
  // =========================================================================
  it('main table includes versionId column', () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry([]);
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    const colNames = tableSet.main.columns.map(c => c.name);
    expect(colNames).toContain('versionId');
  });

  // =========================================================================
  // 2. No projectId column
  // =========================================================================
  it('main table does NOT include projectId', () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry([]);
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    const colNames = tableSet.main.columns.map(c => c.name);
    expect(colNames).not.toContain('projectId');
  });

  // =========================================================================
  // 3. No __version column
  // =========================================================================
  it('main table does NOT include __version', () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry([]);
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    const colNames = tableSet.main.columns.map(c => c.name);
    expect(colNames).not.toContain('__version');
  });

  // =========================================================================
  // 4. No UUID types anywhere
  // =========================================================================
  it('no UUID or UUID[] types in any columns', () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry([
      mockImpl({ code: 'gender', type: 'token', strategy: 'token-column', columnName: 'gender', columnType: 'TEXT' }),
    ]);
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    const allCols = [
      ...tableSet.main.columns,
      ...tableSet.history.columns,
      ...tableSet.references.columns,
    ];
    for (const col of allCols) {
      expect(col.type).not.toContain('UUID');
    }
  });

  // =========================================================================
  // 5. Token produces 2 columns (not 3)
  // =========================================================================
  it('token-column strategy produces exactly 2 columns (__X + __XSort)', () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry([
      mockImpl({ code: 'gender', type: 'token', strategy: 'token-column', columnName: 'gender', columnType: 'TEXT' }),
    ]);
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    const tokenCols = tableSet.main.columns.filter(c => c.searchParamCode === 'gender');
    expect(tokenCols).toHaveLength(2);
    expect(tokenCols[0].name).toBe('__gender');
    expect(tokenCols[1].name).toBe('__genderSort');
    // No __genderText column
    const textCol = tableSet.main.columns.find(c => c.name === '__genderText');
    expect(textCol).toBeUndefined();
  });

  // =========================================================================
  // 6. Token column type is TEXT (not UUID[])
  // =========================================================================
  it('token column type is TEXT', () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry([
      mockImpl({ code: 'gender', type: 'token', strategy: 'token-column', columnName: 'gender', columnType: 'TEXT' }),
    ]);
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    const genderCol = tableSet.main.columns.find(c => c.name === '__gender');
    expect(genderCol).toBeDefined();
    expect(genderCol!.type).toBe('TEXT');
  });

  // =========================================================================
  // 7. History table has versionSeq as PK
  // =========================================================================
  it('history table has versionSeq INTEGER as primary key', () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry([]);
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    const seqCol = tableSet.history.columns.find(c => c.name === 'versionSeq');
    expect(seqCol).toBeDefined();
    expect(seqCol!.type).toBe('INTEGER');
    expect(seqCol!.primaryKey).toBe(true);
  });

  // =========================================================================
  // 8. History table has both id and versionId
  // =========================================================================
  it('history table has id and versionId columns', () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry([]);
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    const colNames = tableSet.history.columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('versionId');
    expect(colNames).toContain('versionSeq');
  });

  // =========================================================================
  // 9. References table has targetType + targetId + referenceRaw
  // =========================================================================
  it('references table has targetType, targetId, and referenceRaw', () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry([]);
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    const colNames = tableSet.references.columns.map(c => c.name);
    expect(colNames).toContain('targetType');
    expect(colNames).toContain('targetId');
    expect(colNames).toContain('referenceRaw');
    expect(colNames).toContain('resourceId');
    expect(colNames).toContain('code');
  });

  // =========================================================================
  // 10. searchParams metadata is populated
  // =========================================================================
  it('searchParams metadata is populated in ResourceTableSet', () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry([
      mockImpl({ code: 'birthdate', type: 'date', strategy: 'column', columnName: 'birthdate', columnType: 'TIMESTAMPTZ' }),
      mockImpl({ code: 'gender', type: 'token', strategy: 'token-column', columnName: 'gender', columnType: 'TEXT' }),
    ]);
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    expect(tableSet.searchParams).toBeDefined();
    expect(tableSet.searchParams).toHaveLength(2);
    expect(tableSet.searchParams![0].code).toBe('birthdate');
    expect(tableSet.searchParams![1].code).toBe('gender');
  });

  // =========================================================================
  // 11. Metadata token columns (_tag, _security) are 2-col
  // =========================================================================
  it('metadata token columns ___tag and ___security are present (2-col)', () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry([]);
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    const colNames = tableSet.main.columns.map(c => c.name);
    // Present
    expect(colNames).toContain('___tag');
    expect(colNames).toContain('___tagSort');
    expect(colNames).toContain('___security');
    expect(colNames).toContain('___securitySort');
    // Removed v1 columns
    expect(colNames).not.toContain('___tagText');
    expect(colNames).not.toContain('___securityText');
    expect(colNames).not.toContain('__sharedTokens');
    expect(colNames).not.toContain('__sharedTokensText');
  });

  // =========================================================================
  // 12. deleted column is INTEGER with default 0
  // =========================================================================
  it('deleted column is INTEGER NOT NULL DEFAULT 0', () => {
    const sd = mockSdRegistry('Patient');
    const sp = mockSpRegistry([]);
    const tableSet = buildResourceTableSet('Patient', sd, sp);
    const deleted = tableSet.main.columns.find(c => c.name === 'deleted');
    expect(deleted).toBeDefined();
    expect(deleted!.type).toBe('INTEGER');
    expect(deleted!.notNull).toBe(true);
    expect(deleted!.defaultValue).toBe('0');
  });
});
