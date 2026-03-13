/**
 * Table Schema Builder
 *
 * Core of Phase 8. Pure functions that derive `ResourceTableSet`
 * (3 tables per resource) from `StructureDefinitionRegistry` and
 * `SearchParameterRegistry`.
 *
 * ## Design
 *
 * Each FHIR resource type gets:
 * - **Main table** — fixed columns + search columns
 * - **History table** — fixed structure (no search columns)
 * - **References table** — fixed structure with composite PK
 *
 * Search columns are generated from `SearchParameterImpl`:
 * - `column` strategy → one column per param
 * - `token-column` strategy → three columns per param (__X, __XText, __XSort)
 * - `lookup-table` strategy → sort column only (__XSort)
 *
 * All functions are pure — no global state, no database dependency.
 *
 * @module fhir-persistence/schema
 */

import type {
  ColumnSchema,
  IndexSchema,
  ConstraintSchema,
  MainTableSchema,
  HistoryTableSchema,
  ReferencesTableSchema,
  GlobalLookupTableSchema,
  LookupTableType,
  ResourceTableSet,
  SchemaDefinition,
} from './table-schema.js';
import type { StructureDefinitionRegistry } from '../registry/structure-definition-registry.js';
import type { SearchParameterRegistry } from '../registry/search-parameter-registry.js';
import type { SearchParameterImpl } from '../registry/search-parameter-registry.js';

// =============================================================================
// Section 1: Fixed Column Definitions
// =============================================================================

/**
 * Fixed columns present on every main resource table.
 *
 * v2 changes:
 * - Removed `projectId` (no multi-tenancy)
 * - Removed `__version` (schema version, not resource version)
 * - Added `versionId` (UUID for ETag / optimistic locking)
 * - Changed `deleted` from BOOLEAN to INTEGER (SQLite compat)
 * - Changed `lastUpdated` from TIMESTAMPTZ to TEXT (dialect-neutral; DDL maps to TIMESTAMPTZ for PG)
 * - Token columns: UUID[] → TEXT[], removed Text middle column (2-col: __X + __XSort)
 * - compartments: UUID[] → TEXT (JSON array)
 */
function buildFixedMainColumns(): ColumnSchema[] {
  return [
    { name: 'id', type: 'TEXT', notNull: true, primaryKey: true, strategy: 'skip' },
    { name: 'versionId', type: 'TEXT', notNull: true, primaryKey: false, strategy: 'skip' },
    { name: 'content', type: 'TEXT', notNull: true, primaryKey: false, strategy: 'skip' },
    { name: 'lastUpdated', type: 'TEXT', notNull: true, primaryKey: false, strategy: 'skip' },
    { name: 'deleted', type: 'INTEGER', notNull: true, primaryKey: false, defaultValue: '0', strategy: 'skip' },
    { name: '_source', type: 'TEXT', notNull: false, primaryKey: false, strategy: 'skip' },
    { name: '_profile', type: 'TEXT', notNull: false, primaryKey: false, strategy: 'skip' },  // JSON array
    // Metadata token columns — _tag (meta.tag) — 2-col: TEXT[] + Sort TEXT
    { name: '___tag', type: 'TEXT', notNull: false, primaryKey: false, strategy: 'token-column', searchParamCode: '_tag' },
    { name: '___tagSort', type: 'TEXT', notNull: false, primaryKey: false, strategy: 'token-column' },
    // Metadata token columns — _security (meta.security) — 2-col: TEXT[] + Sort TEXT
    { name: '___security', type: 'TEXT', notNull: false, primaryKey: false, strategy: 'token-column', searchParamCode: '_security' },
    { name: '___securitySort', type: 'TEXT', notNull: false, primaryKey: false, strategy: 'token-column' },
  ];
}

/**
 * The `compartments` column — present on all resources except Binary.
 */
function buildCompartmentsColumn(): ColumnSchema {
  return { name: 'compartments', type: 'TEXT', notNull: false, primaryKey: false, strategy: 'skip' };
}

/**
 * Fixed columns for the history table.
 */
function buildHistoryColumns(): ColumnSchema[] {
  return [
    { name: 'versionSeq', type: 'INTEGER', notNull: true, primaryKey: true },  // AUTOINCREMENT in DDL
    { name: 'id', type: 'TEXT', notNull: true, primaryKey: false },
    { name: 'versionId', type: 'TEXT', notNull: true, primaryKey: false },
    { name: 'content', type: 'TEXT', notNull: true, primaryKey: false },
    { name: 'lastUpdated', type: 'TEXT', notNull: true, primaryKey: false },
    { name: 'deleted', type: 'INTEGER', notNull: true, primaryKey: false, defaultValue: '0' },
  ];
}

/**
 * Fixed columns for the references table.
 */
function buildReferencesColumns(): ColumnSchema[] {
  return [
    { name: 'resourceId', type: 'TEXT', notNull: true, primaryKey: false },
    { name: 'targetType', type: 'TEXT', notNull: true, primaryKey: false },
    { name: 'targetId', type: 'TEXT', notNull: true, primaryKey: false },
    { name: 'code', type: 'TEXT', notNull: true, primaryKey: false },
    { name: 'referenceRaw', type: 'TEXT', notNull: false, primaryKey: false },
  ];
}

// =============================================================================
// Section 2: Fixed Index Definitions
// =============================================================================

/**
 * Fixed indexes for the main table.
 */
function buildFixedMainIndexes(resourceType: string): IndexSchema[] {
  return [
    {
      name: `${resourceType}_lastUpdated_idx`,
      columns: ['lastUpdated'],
      indexType: 'btree',
      unique: false,
    },
    {
      name: `${resourceType}__source_idx`,
      columns: ['_source'],
      indexType: 'btree',
      unique: false,
    },
  ];
}

/**
 * Compartments index — present on all resources except Binary.
 */
function buildCompartmentsIndex(resourceType: string): IndexSchema {
  return {
    name: `${resourceType}_compartments_idx`,
    columns: ['compartments'],
    indexType: 'gin',
    unique: false,
  };
}

/**
 * Fixed indexes for the history table.
 */
function buildHistoryIndexes(resourceType: string): IndexSchema[] {
  return [
    {
      name: `${resourceType}_History_id_seq_idx`,
      columns: ['id', 'versionSeq'],
      indexType: 'btree',
      unique: false,
    },
  ];
}

/**
 * Fixed indexes for the references table.
 */
function buildReferencesIndexes(resourceType: string): IndexSchema[] {
  return [
    {
      name: `${resourceType}_References_target_idx`,
      columns: ['targetType', 'targetId', 'code'],
      indexType: 'btree',
      unique: false,
    },
    {
      name: `${resourceType}_References_resourceId_idx`,
      columns: ['resourceId'],
      indexType: 'btree',
      unique: false,
    },
  ];
}

// =============================================================================
// Section 3: Search Column Generation
// =============================================================================

/**
 * Generate search columns for a resource type based on its SearchParameterImpls.
 */
function buildSearchColumns(impls: SearchParameterImpl[]): ColumnSchema[] {
  const columns: ColumnSchema[] = [];

  for (const impl of impls) {
    switch (impl.strategy) {
      case 'column':
        columns.push({
          name: impl.columnName,
          type: impl.columnType,
          notNull: false,
          primaryKey: false,
          searchParamCode: impl.code,
        });
        break;

      case 'token-column':
        // v2: Two columns per token param (not three):
        // __code TEXT (JSON array of "system|code" strings in SQLite, TEXT[] in PG)
        // __codeSort TEXT — display text for :text modifier
        columns.push(
          {
            name: `__${impl.columnName}`,
            type: 'TEXT',
            notNull: false,
            primaryKey: false,
            searchParamCode: impl.code,
            strategy: 'token-column',
          },
          {
            name: `__${impl.columnName}Sort`,
            type: 'TEXT',
            notNull: false,
            primaryKey: false,
            searchParamCode: impl.code,
            strategy: 'token-column',
          },
        );
        break;

      case 'lookup-table':
        // Only a sort column in the main table
        columns.push({
          name: `__${impl.columnName}Sort`,
          type: 'TEXT',
          notNull: false,
          primaryKey: false,
          searchParamCode: impl.code,
        });
        break;
    }
  }

  return columns;
}

/**
 * Generate search indexes for a resource type based on its SearchParameterImpls.
 */
function buildSearchIndexes(resourceType: string, impls: SearchParameterImpl[]): IndexSchema[] {
  const indexes: IndexSchema[] = [];

  for (const impl of impls) {
    switch (impl.strategy) {
      case 'column': {
        const isArray = impl.array;
        indexes.push({
          name: `${resourceType}_${impl.columnName}_idx`,
          columns: [impl.columnName],
          indexType: isArray ? 'gin' : 'btree',
          unique: false,
        });
        break;
      }

      case 'token-column':
        // v2: btree index on token column (GIN only for PG TEXT[])
        indexes.push({
          name: `${resourceType}___${impl.columnName}_idx`,
          columns: [`__${impl.columnName}`],
          indexType: 'btree',
          unique: false,
        });
        break;

      case 'lookup-table':
        // Sort column gets a btree index
        indexes.push({
          name: `${resourceType}___${impl.columnName}Sort_idx`,
          columns: [`__${impl.columnName}Sort`],
          indexType: 'btree',
          unique: false,
        });
        break;
    }
  }

  return indexes;
}

// =============================================================================
// Section 3b: Global Lookup Table Generation (Medplum-style)
// =============================================================================

/**
 * Build the 4 global shared lookup tables matching Medplum's production design.
 *
 * These tables are shared across ALL resource types and store decomposed
 * complex FHIR types for precise search via JOINs:
 * - `HumanName` — name/given/family from Patient.name, Practitioner.name, etc.
 * - `Address` — address/city/country/postalCode/state/use
 * - `ContactPoint` — system/value/use from telecom fields
 * - `Identifier` — system/value from identifier fields
 *
 * Each table has Medplum-style indexes: btree + trigram (gin_trgm_ops)
 * for efficient prefix, exact, and substring search.
 */
export function buildGlobalLookupTables(): GlobalLookupTableSchema[] {
  return [
    buildHumanNameTable(),
    buildAddressTable(),
    buildContactPointTable(),
    buildIdentifierTable(),
  ];
}

function buildHumanNameTable(): GlobalLookupTableSchema {
  const tableName: LookupTableType = 'HumanName';
  return {
    tableName,
    columns: [
      { name: 'resourceId', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'resourceType', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'name', type: 'TEXT', notNull: false, primaryKey: false },
      { name: 'given', type: 'TEXT', notNull: false, primaryKey: false },
      { name: 'family', type: 'TEXT', notNull: false, primaryKey: false },
    ],
    indexes: [
      { name: `${tableName}_resourceId_idx`, columns: ['resourceId'], indexType: 'btree', unique: false },
      { name: `${tableName}_name_idx`, columns: ['name'], indexType: 'btree', unique: false },
      { name: `${tableName}_given_idx`, columns: ['given'], indexType: 'btree', unique: false },
      { name: `${tableName}_family_idx`, columns: ['family'], indexType: 'btree', unique: false },
      { name: `${tableName}_nameTrgm_idx`, columns: ['name'], indexType: 'gin', unique: false, opClass: 'gin_trgm_ops' },
      { name: `${tableName}_givenTrgm_idx`, columns: ['given'], indexType: 'gin', unique: false, opClass: 'gin_trgm_ops' },
      { name: `${tableName}_familyTrgm_idx`, columns: ['family'], indexType: 'gin', unique: false, opClass: 'gin_trgm_ops' },
      { name: `${tableName}_name_idx_tsv`, columns: ['name'], indexType: 'gin', unique: false, expression: `to_tsvector('simple'::regconfig, name)` },
      { name: `${tableName}_given_idx_tsv`, columns: ['given'], indexType: 'gin', unique: false, expression: `to_tsvector('simple'::regconfig, given)` },
      { name: `${tableName}_family_idx_tsv`, columns: ['family'], indexType: 'gin', unique: false, expression: `to_tsvector('simple'::regconfig, family)` },
    ],
  };
}

function buildAddressTable(): GlobalLookupTableSchema {
  const tableName: LookupTableType = 'Address';
  return {
    tableName,
    columns: [
      { name: 'resourceId', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'resourceType', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'address', type: 'TEXT', notNull: false, primaryKey: false },
      { name: 'city', type: 'TEXT', notNull: false, primaryKey: false },
      { name: 'country', type: 'TEXT', notNull: false, primaryKey: false },
      { name: 'postalCode', type: 'TEXT', notNull: false, primaryKey: false },
      { name: 'state', type: 'TEXT', notNull: false, primaryKey: false },
      { name: 'use', type: 'TEXT', notNull: false, primaryKey: false },
    ],
    indexes: [
      { name: `${tableName}_resourceId_idx`, columns: ['resourceId'], indexType: 'btree', unique: false },
      { name: `${tableName}_address_idx`, columns: ['address'], indexType: 'btree', unique: false },
      { name: `${tableName}_address_idx_tsv`, columns: ['address'], indexType: 'gin', unique: false, expression: `to_tsvector('simple'::regconfig, address)` },
      { name: `${tableName}_city_idx`, columns: ['city'], indexType: 'btree', unique: false },
      { name: `${tableName}_city_idx_tsv`, columns: ['city'], indexType: 'gin', unique: false, expression: `to_tsvector('simple'::regconfig, city)` },
      { name: `${tableName}_country_idx`, columns: ['country'], indexType: 'btree', unique: false },
      { name: `${tableName}_country_idx_tsv`, columns: ['country'], indexType: 'gin', unique: false, expression: `to_tsvector('simple'::regconfig, country)` },
      { name: `${tableName}_postalCode_idx`, columns: ['postalCode'], indexType: 'btree', unique: false },
      { name: `${tableName}_postalCode_idx_tsv`, columns: ['postalCode'], indexType: 'gin', unique: false, expression: `to_tsvector('simple'::regconfig, "postalCode")` },
      { name: `${tableName}_state_idx`, columns: ['state'], indexType: 'btree', unique: false },
      { name: `${tableName}_state_idx_tsv`, columns: ['state'], indexType: 'gin', unique: false, expression: `to_tsvector('simple'::regconfig, state)` },
      { name: `${tableName}_use_idx`, columns: ['use'], indexType: 'btree', unique: false },
      { name: `${tableName}_use_idx_tsv`, columns: ['use'], indexType: 'gin', unique: false, expression: `to_tsvector('simple'::regconfig, use)` },
    ],
  };
}

function buildContactPointTable(): GlobalLookupTableSchema {
  const tableName: LookupTableType = 'ContactPoint';
  return {
    tableName,
    columns: [
      { name: 'resourceId', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'resourceType', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'system', type: 'TEXT', notNull: false, primaryKey: false },
      { name: 'value', type: 'TEXT', notNull: false, primaryKey: false },
      { name: 'use', type: 'TEXT', notNull: false, primaryKey: false },
    ],
    indexes: [
      { name: `${tableName}_resourceId_idx`, columns: ['resourceId'], indexType: 'btree', unique: false },
      { name: `${tableName}_system_idx`, columns: ['system'], indexType: 'btree', unique: false },
      { name: `${tableName}_value_idx`, columns: ['value'], indexType: 'btree', unique: false },
    ],
  };
}

function buildIdentifierTable(): GlobalLookupTableSchema {
  const tableName: LookupTableType = 'Identifier';
  return {
    tableName,
    columns: [
      { name: 'resourceId', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'resourceType', type: 'TEXT', notNull: true, primaryKey: false },
      { name: 'system', type: 'TEXT', notNull: false, primaryKey: false },
      { name: 'value', type: 'TEXT', notNull: false, primaryKey: false },
    ],
    indexes: [
      { name: `${tableName}_resourceId_idx`, columns: ['resourceId'], indexType: 'btree', unique: false },
      { name: `${tableName}_value_idx`, columns: ['value'], indexType: 'btree', unique: false },
    ],
  };
}

// =============================================================================
// Section 3c: Shared Token Columns
// =============================================================================

/**
 * v2: Shared token columns removed.
 * In v2, each token column stores "system|code" strings directly.
 * No need for a unified shared token column.
 *
 * @deprecated Kept as empty function for backward compatibility.
 */
function buildSharedTokenColumns(): ColumnSchema[] {
  return [];
}

/**
 * @deprecated Shared token indexes removed in v2.
 */
function buildSharedTokenIndexes(_resourceType: string): IndexSchema[] {
  return [];
}

// =============================================================================
// Section 3d: Trigram Indexes
// =============================================================================

/**
 * v2: Trigram indexes simplified.
 * In v2, token columns store "system|code" strings directly in TEXT/TEXT[].
 * Trigram indexes are only needed for PG TEXT[] columns.
 * For SQLite, these are skipped (no GIN support).
 */
function buildTrigramIndexes(_resourceType: string, _impls: SearchParameterImpl[]): IndexSchema[] {
  // v2: Trigram indexes are PG-only and will be added by PostgresDialect
  // in the DDL generation phase, not in the schema builder.
  return [];
}

// =============================================================================
// Section 4: Public API
// =============================================================================

/**
 * Build the complete 3-table schema for a single resource type.
 *
 * @param resourceType - The FHIR resource type (e.g., `'Patient'`).
 * @param sdRegistry - StructureDefinitionRegistry (used to verify the type exists).
 * @param spRegistry - SearchParameterRegistry (provides search column definitions).
 * @returns The complete `ResourceTableSet` for the resource type.
 * @throws Error if the resource type is not found or is abstract.
 */
export function buildResourceTableSet(
  resourceType: string,
  sdRegistry: StructureDefinitionRegistry,
  spRegistry: SearchParameterRegistry,
): ResourceTableSet {
  const profile = sdRegistry.get(resourceType);
  if (!profile) {
    throw new Error(`Resource type "${resourceType}" not found in StructureDefinitionRegistry`);
  }
  if (profile.abstract) {
    throw new Error(`Cannot build table for abstract resource type "${resourceType}"`);
  }
  if (profile.kind !== 'resource') {
    throw new Error(`Cannot build table for non-resource type "${resourceType}" (kind: ${profile.kind})`);
  }

  const isBinary = resourceType === 'Binary';
  const searchImpls = spRegistry.getForResource(resourceType);

  // --- Main table ---
  const mainColumns = buildFixedMainColumns();
  if (!isBinary) {
    mainColumns.push(buildCompartmentsColumn());
  }
  mainColumns.push(...buildSearchColumns(searchImpls));
  mainColumns.push(...buildSharedTokenColumns());

  const mainIndexes = buildFixedMainIndexes(resourceType);
  if (!isBinary) {
    mainIndexes.push(buildCompartmentsIndex(resourceType));
  }
  mainIndexes.push(...buildSearchIndexes(resourceType, searchImpls));
  mainIndexes.push(...buildSharedTokenIndexes(resourceType));
  mainIndexes.push(...buildTrigramIndexes(resourceType, searchImpls));

  const mainConstraints: ConstraintSchema[] = [
    {
      name: `${resourceType}_pk`,
      type: 'primary_key',
      columns: ['id'],
    },
  ];

  const main: MainTableSchema = {
    tableName: resourceType,
    resourceType,
    columns: mainColumns,
    indexes: mainIndexes,
    constraints: mainConstraints,
  };

  // --- History table ---
  const history: HistoryTableSchema = {
    tableName: `${resourceType}_History`,
    resourceType,
    columns: buildHistoryColumns(),
    indexes: buildHistoryIndexes(resourceType),
  };

  // --- References table ---
  const references: ReferencesTableSchema = {
    tableName: `${resourceType}_References`,
    resourceType,
    columns: buildReferencesColumns(),
    indexes: buildReferencesIndexes(resourceType),
    compositePrimaryKey: ['resourceId', 'targetType', 'targetId', 'code'],
  };

  // v2: Preserve SP metadata for SchemaDiff
  const searchParamsMeta = searchImpls.map(impl => ({
    code: impl.code,
    type: impl.type,
    expression: impl.expression,
  }));

  return {
    resourceType,
    main,
    history,
    references,
    searchParams: searchParamsMeta,
  };
}

/**
 * Build table schemas for ALL non-abstract resource types.
 *
 * @returns Array of `ResourceTableSet`, one per concrete resource type, sorted alphabetically.
 */
export function buildAllResourceTableSets(
  sdRegistry: StructureDefinitionRegistry,
  spRegistry: SearchParameterRegistry,
): ResourceTableSet[] {
  const resourceTypes = sdRegistry.getTableResourceTypes();
  return resourceTypes.map((rt) => buildResourceTableSet(rt, sdRegistry, spRegistry));
}

/**
 * Build a complete `SchemaDefinition` for all resource types.
 *
 * @param sdRegistry - StructureDefinitionRegistry with indexed profiles.
 * @param spRegistry - SearchParameterRegistry with indexed search params.
 * @param version - Schema version string (default: `'fhir-r4-v4.0.1'`).
 * @returns The complete `SchemaDefinition`.
 */
export function buildSchemaDefinition(
  sdRegistry: StructureDefinitionRegistry,
  spRegistry: SearchParameterRegistry,
  version: string = 'fhir-r4-v4.0.1',
): SchemaDefinition {
  return {
    version,
    generatedAt: new Date().toISOString(),
    tableSets: buildAllResourceTableSets(sdRegistry, spRegistry),
    globalLookupTables: buildGlobalLookupTables(),
  };
}
