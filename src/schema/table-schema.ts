/**
 * Table Schema — Type Definitions
 *
 * Intermediate data model representing PostgreSQL table structure.
 * These types are the output of `TableSchemaBuilder` and the input
 * to `DDLGenerator`. They are pure data — no behavior, no DB dependency.
 *
 * ## Design
 *
 * Each FHIR resource type maps to a `ResourceTableSet` containing
 * exactly 3 tables:
 * - **Main table** (`Patient`) — current version + search columns
 * - **History table** (`Patient_History`) — all versions
 * - **References table** (`Patient_References`) — outgoing references
 *
 * This mirrors Medplum's 3-table-per-resource strategy (WF-MIG-002).
 *
 * @module fhir-persistence/schema
 */

// =============================================================================
// Section 1: Column Types
// =============================================================================

/**
 * SQL column types used in FHIR resource tables.
 *
 * v2: Removed UUID / UUID[]. Token columns now use TEXT / TEXT[].
 * PostgreSQL-specific types (TIMESTAMPTZ, TEXT[]) are still here
 * for PG DDL generation. SQLite adapter maps them to TEXT.
 */
export type SqlColumnType =
  | 'TEXT'
  | 'TEXT[]'
  | 'BOOLEAN'
  | 'INTEGER'
  | 'BIGINT'
  | 'TIMESTAMPTZ'
  | 'TIMESTAMPTZ[]'
  | 'DATE'
  | 'DATE[]'
  | 'NUMERIC'
  | 'DOUBLE PRECISION'
  | 'DOUBLE PRECISION[]'
  | 'REAL';

// =============================================================================
// Section 2: Column Schema
// =============================================================================

/**
 * Definition of a single database column.
 *
 * v2: Dialect-neutral. DDLGenerator maps types to dialect-specific
 * equivalents (e.g., BOOLEAN → INTEGER for SQLite).
 */
export interface ColumnSchema {
  /** Column name (e.g., `id`, `content`, `birthdate`). */
  name: string;

  /** Logical SQL data type (mapped to dialect-specific type in DDL). */
  type: SqlColumnType;

  /** Whether the column has a NOT NULL constraint. */
  notNull: boolean;

  /** Whether this column is the primary key. */
  primaryKey: boolean;

  /** SQL default value expression (e.g., `'false'`, `'0'`). */
  defaultValue?: string;

  /** Source FHIRPath expression (documentation only). */
  fhirPath?: string;

  /** Source SearchParameter.code (documentation only). */
  searchParamCode?: string;

  /**
   * v2: Search parameter storage strategy.
   * Enables SchemaDiff to understand column purpose.
   */
  strategy?: 'column' | 'token-column' | 'lookup-table' | 'skip';
}

// =============================================================================
// Section 3: Index Schema
// =============================================================================

/**
 * Definition of a PostgreSQL index.
 */
export interface IndexSchema {
  /** Index name (e.g., `Patient_lastUpdated_idx`). */
  name: string;

  /** Columns included in the index key. */
  columns: string[];

  /** Index type. */
  indexType: 'btree' | 'gin' | 'gist';

  /** Whether this is a unique index. */
  unique: boolean;

  /** Partial index WHERE clause (e.g., `'deleted = false'`). */
  where?: string;

  /** INCLUDE columns for covering indexes. */
  include?: string[];

  /**
   * Operator class for the index (e.g., `'gin_trgm_ops'` for trigram GIN).
   * Applied to all columns in the index.
   */
  opClass?: string;

  /**
   * Functional expression to index instead of a plain column.
   * When set, `columns` is ignored and this SQL expression is used directly.
   * Example: `"to_tsvector('simple'::regconfig, family)"`
   */
  expression?: string;
}

// =============================================================================
// Section 4: Constraint Schema
// =============================================================================

/**
 * Definition of a PostgreSQL table constraint.
 */
export interface ConstraintSchema {
  /** Constraint name (e.g., `Patient_pk`). */
  name: string;

  /** Constraint type. */
  type: 'primary_key' | 'unique' | 'check';

  /** Columns involved (for primary_key and unique). */
  columns?: string[];

  /** SQL expression (for check constraints). */
  expression?: string;
}

// =============================================================================
// Section 5: Table Schemas
// =============================================================================

/**
 * Schema for a FHIR resource main table (current version).
 *
 * Contains fixed columns (id, content, lastUpdated, etc.) plus
 * dynamic search columns derived from SearchParameters.
 */
export interface MainTableSchema {
  /** Table name (e.g., `'Patient'`). */
  tableName: string;

  /** FHIR resource type name. */
  resourceType: string;

  /** All columns (fixed + search). */
  columns: ColumnSchema[];

  /** All indexes (fixed + search). */
  indexes: IndexSchema[];

  /** Table constraints (PK, unique, check). */
  constraints: ConstraintSchema[];
}

/**
 * Schema for a FHIR resource history table.
 *
 * Stores all historical versions of a resource.
 * Fixed structure — no search columns.
 */
export interface HistoryTableSchema {
  /** Table name (e.g., `'Patient_History'`). */
  tableName: string;

  /** FHIR resource type name. */
  resourceType: string;

  /** All columns (fixed). */
  columns: ColumnSchema[];

  /** All indexes (fixed). */
  indexes: IndexSchema[];
}

/**
 * Schema for a FHIR resource references table.
 *
 * Stores outgoing reference relationships for `_revinclude` support.
 * Uses a composite primary key.
 */
export interface ReferencesTableSchema {
  /** Table name (e.g., `'Patient_References'`). */
  tableName: string;

  /** FHIR resource type name. */
  resourceType: string;

  /** All columns (fixed). */
  columns: ColumnSchema[];

  /** All indexes. */
  indexes: IndexSchema[];

  /** Composite primary key column names. */
  compositePrimaryKey: string[];
}

// =============================================================================
// Section 5b: Global Lookup Table Schema (Medplum-style)
// =============================================================================

/**
 * The 4 global lookup table types, matching Medplum's production design.
 *
 * Each is a shared table across ALL resource types, storing decomposed
 * complex FHIR types for precise search via JOINs.
 */
export type LookupTableType = 'HumanName' | 'Address' | 'ContactPoint' | 'Identifier';

/**
 * Schema for a global shared lookup table (e.g., `HumanName`, `Address`).
 *
 * Matches Medplum's production-verified design where a single table
 * stores data from ALL resource types that use that complex type.
 *
 * - `HumanName` — stores name/given/family from Patient.name, Practitioner.name, etc.
 * - `Address` — stores address/city/country/postalCode/state/use
 * - `ContactPoint` — stores system/value/use from telecom fields
 * - `Identifier` — stores system/value from identifier fields
 */
export interface GlobalLookupTableSchema {
  /** Table name (e.g., `'HumanName'`, `'Address'`). */
  tableName: LookupTableType;

  /** All columns. */
  columns: ColumnSchema[];

  /** All indexes. */
  indexes: IndexSchema[];
}

/**
 * @deprecated Use GlobalLookupTableSchema instead. Kept for backward compatibility.
 */
export interface LookupTableSchema {
  tableName: string;
  resourceType: string;
  searchParamCode: string;
  columns: ColumnSchema[];
  indexes: IndexSchema[];
  compositePrimaryKey: string[];
}

// =============================================================================
// Section 6: Resource Table Set & Schema Definition
// =============================================================================

/**
 * Metadata for a search parameter, preserved for SchemaDiff.
 */
export interface SearchParamMeta {
  code: string;
  type: string;
  expression: string;
}

/**
 * Complete table set for a single FHIR resource type.
 *
 * Contains 3 core tables (main, history, references).
 * Lookup tables are now global (shared across all resource types)
 * and stored at the SchemaDefinition level.
 */
export interface ResourceTableSet {
  /** FHIR resource type (e.g., `'Patient'`). */
  resourceType: string;

  /** Main table (current version + search columns). */
  main: MainTableSchema;

  /** History table (all versions). */
  history: HistoryTableSchema;

  /** References table (outgoing references). */
  references: ReferencesTableSchema;

  /**
   * v2: Raw SP metadata for SchemaDiff to compare old vs new search params.
   */
  searchParams?: SearchParamMeta[];

  /**
   * @deprecated Per-resource lookup tables removed. Use SchemaDefinition.globalLookupTables.
   */
  lookupTables?: LookupTableSchema[];
}

/**
 * Complete schema definition for all resource types.
 *
 * This is the top-level output of the schema generation pipeline.
 */
export interface SchemaDefinition {
  /** Schema version identifier (e.g., `'fhir-r4-v4.0.1'`). */
  version: string;

  /** ISO timestamp of when the schema was generated. */
  generatedAt: string;

  /** Table sets for all resource types. */
  tableSets: ResourceTableSet[];

  /**
   * Global lookup tables shared across all resource types.
   * Matches Medplum's production design: HumanName, Address, ContactPoint, Identifier.
   */
  globalLookupTables: GlobalLookupTableSchema[];
}
