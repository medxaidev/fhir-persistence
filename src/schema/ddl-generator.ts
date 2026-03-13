/**
 * DDL Generator
 *
 * Converts `ResourceTableSet` / `SchemaDefinition` to SQL DDL strings.
 * All functions are pure — no database dependency.
 *
 * v2 upgrade: Now supports both SQLite and PostgreSQL dialects.
 * The `dialect` parameter controls type mapping and syntax differences.
 *
 * ## Output Format
 *
 * - All identifiers are double-quoted for safety
 * - Uses `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`
 * - Generates all CREATE TABLEs first, then all CREATE INDEXes
 * - Idempotent — safe to run multiple times
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
  LookupTableSchema,
  GlobalLookupTableSchema,
  ResourceTableSet,
  SchemaDefinition,
  SqlColumnType,
} from './table-schema.js';

// =============================================================================
// Section 0: Dialect Type
// =============================================================================

export type DDLDialect = 'sqlite' | 'postgres';

/**
 * Map a logical SqlColumnType to the dialect-specific type string.
 *
 * SQLite mappings:
 * - BOOLEAN → INTEGER
 * - TIMESTAMPTZ → TEXT
 * - TEXT[] → TEXT (JSON array)
 * - DOUBLE PRECISION → REAL
 * - DATE → TEXT
 * - NUMERIC → REAL
 * - BIGINT → INTEGER
 *
 * PostgreSQL: types pass through unchanged.
 */
function mapColumnType(type: SqlColumnType, dialect: DDLDialect): string {
  if (dialect === 'postgres') return type;

  // SQLite type mapping
  switch (type) {
    case 'BOOLEAN': return 'INTEGER';
    case 'TIMESTAMPTZ': return 'TEXT';
    case 'TIMESTAMPTZ[]': return 'TEXT';
    case 'TEXT[]': return 'TEXT';
    case 'DOUBLE PRECISION': return 'REAL';
    case 'DOUBLE PRECISION[]': return 'TEXT';
    case 'DATE': return 'TEXT';
    case 'DATE[]': return 'TEXT';
    case 'NUMERIC': return 'REAL';
    case 'BIGINT': return 'INTEGER';
    default: return type;
  }
}

// =============================================================================
// Section 1: Column DDL
// =============================================================================

/**
 * Generate the DDL fragment for a single column definition.
 *
 * Example: `"id" TEXT NOT NULL`
 */
function columnDDL(col: ColumnSchema, dialect: DDLDialect = 'postgres'): string {
  const mappedType = mapColumnType(col.type, dialect);
  const parts: string[] = [`"${col.name}"`, mappedType];

  if (col.notNull) {
    parts.push('NOT NULL');
  }

  if (col.defaultValue !== undefined) {
    parts.push(`DEFAULT ${col.defaultValue}`);
  }

  return '  ' + parts.join(' ');
}

// =============================================================================
// Section 2: Constraint DDL
// =============================================================================

/**
 * Generate the DDL fragment for a table constraint.
 *
 * Example: `CONSTRAINT "Patient_pk" PRIMARY KEY ("id")`
 */
function constraintDDL(constraint: ConstraintSchema): string {
  switch (constraint.type) {
    case 'primary_key':
      return `  CONSTRAINT "${constraint.name}" PRIMARY KEY (${constraint.columns!.map((c) => `"${c}"`).join(', ')})`;

    case 'unique':
      return `  CONSTRAINT "${constraint.name}" UNIQUE (${constraint.columns!.map((c) => `"${c}"`).join(', ')})`;

    case 'check':
      return `  CONSTRAINT "${constraint.name}" CHECK (${constraint.expression})`;
  }
}

// =============================================================================
// Section 3: CREATE TABLE
// =============================================================================

/**
 * Generate a `CREATE TABLE IF NOT EXISTS` statement for a main table.
 */
export function generateCreateMainTable(table: MainTableSchema, dialect: DDLDialect = 'postgres'): string {
  const lines: string[] = [];

  lines.push(`CREATE TABLE IF NOT EXISTS "${table.tableName}" (`);

  const entries: string[] = [];
  for (const col of table.columns) {
    entries.push(columnDDL(col, dialect));
  }
  for (const constraint of table.constraints) {
    entries.push(constraintDDL(constraint));
  }

  lines.push(entries.join(',\n'));
  lines.push(');');

  return lines.join('\n');
}

/**
 * Generate a `CREATE TABLE IF NOT EXISTS` statement for a history table.
 *
 * v2: Handles versionSeq AUTOINCREMENT for SQLite and GENERATED ALWAYS for PG.
 */
export function generateCreateHistoryTable(table: HistoryTableSchema, dialect: DDLDialect = 'postgres'): string {
  const lines: string[] = [];

  lines.push(`CREATE TABLE IF NOT EXISTS "${table.tableName}" (`);

  const entries: string[] = [];
  for (const col of table.columns) {
    if (col.name === 'versionSeq' && col.primaryKey) {
      // Special handling for auto-increment PK
      if (dialect === 'sqlite') {
        entries.push('  "versionSeq" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT');
      } else {
        entries.push('  "versionSeq" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY');
      }
      continue;
    }
    entries.push(columnDDL(col, dialect));
  }

  // Add UNIQUE constraint on (id, versionId)
  entries.push(`  UNIQUE ("id", "versionId")`);

  lines.push(entries.join(',\n'));
  lines.push(');');

  return lines.join('\n');
}

/**
 * Generate a `CREATE TABLE IF NOT EXISTS` statement for a references table.
 */
export function generateCreateReferencesTable(table: ReferencesTableSchema, dialect: DDLDialect = 'postgres'): string {
  const lines: string[] = [];

  lines.push(`CREATE TABLE IF NOT EXISTS "${table.tableName}" (`);

  const entries: string[] = [];
  for (const col of table.columns) {
    entries.push(columnDDL(col, dialect));
  }

  // v2: References tables no longer use composite PK (rows are not unique per (resourceId, target, code))
  // Keeping the constraint generation for backward compatibility if set
  if (table.compositePrimaryKey && table.compositePrimaryKey.length > 0) {
    // Skip composite PK for v2 — references can have duplicates
    // const pkCols = table.compositePrimaryKey.map((c) => `"${c}"`).join(', ');
    // entries.push(`  CONSTRAINT "${table.tableName}_pk" PRIMARY KEY (${pkCols})`);
  }

  lines.push(entries.join(',\n'));
  lines.push(');');

  return lines.join('\n');
}

// =============================================================================
// Section 4: CREATE INDEX
// =============================================================================

/**
 * Generate a `CREATE INDEX IF NOT EXISTS` statement.
 *
 * Supports:
 * - `opClass` — operator class appended to each column key (e.g., `gin_trgm_ops`)
 * - `expression` — functional expression to index instead of plain columns
 *   (e.g., `to_tsvector('simple'::regconfig, family)`)
 */
export function generateCreateIndex(index: IndexSchema, tableName: string, dialect: DDLDialect = 'postgres'): string | null {
  // SQLite: skip GIN indexes (not supported)
  if (dialect === 'sqlite' && (index.indexType === 'gin' || index.indexType === 'gist')) {
    return null;
  }
  // SQLite: skip expression indexes and opClass indexes (PG-only features)
  if (dialect === 'sqlite' && (index.expression || index.opClass)) {
    return null;
  }

  const unique = index.unique ? 'UNIQUE ' : '';

  let indexExpr: string;
  if (index.expression) {
    indexExpr = index.expression;
  } else if (index.opClass) {
    indexExpr = index.columns.map((c) => `"${c}" ${index.opClass}`).join(', ');
  } else {
    indexExpr = index.columns.map((c) => `"${c}"`).join(', ');
  }

  let sql: string;
  if (dialect === 'sqlite') {
    // SQLite doesn't support USING clause
    sql = `CREATE ${unique}INDEX IF NOT EXISTS "${index.name}" ON "${tableName}" (${indexExpr})`;
  } else {
    sql = `CREATE ${unique}INDEX IF NOT EXISTS "${index.name}"\n  ON "${tableName}" USING ${index.indexType} (${indexExpr})`;
  }

  if (index.include && index.include.length > 0 && dialect === 'postgres') {
    const includeCols = index.include.map((c) => `"${c}"`).join(', ');
    sql += `\n  INCLUDE (${includeCols})`;
  }

  if (index.where) {
    if (dialect === 'sqlite') {
      // SQLite supports WHERE in partial indexes
      sql += ` WHERE ${index.where}`;
    } else {
      sql += `\n  WHERE ${index.where}`;
    }
  }

  sql += ';';
  return sql;
}

// =============================================================================
// Section 5: Resource DDL (3 tables + all indexes)
// =============================================================================

/**
 * Generate all DDL statements for a single resource type (3 tables + indexes).
 *
 * Returns an array of SQL statements in order:
 * 1. CREATE TABLE for main table
 * 2. CREATE TABLE for history table
 * 3. CREATE TABLE for references table
 * 4. All CREATE INDEX statements
 */
export function generateResourceDDL(tableSet: ResourceTableSet, dialect: DDLDialect = 'postgres'): string[] {
  const statements: string[] = [];

  // Tables
  statements.push(generateCreateMainTable(tableSet.main, dialect));
  statements.push(generateCreateHistoryTable(tableSet.history, dialect));
  statements.push(generateCreateReferencesTable(tableSet.references, dialect));

  // Indexes — main table
  for (const idx of tableSet.main.indexes) {
    const sql = generateCreateIndex(idx, tableSet.main.tableName, dialect);
    if (sql) statements.push(sql);
  }

  // Indexes — history table
  for (const idx of tableSet.history.indexes) {
    const sql = generateCreateIndex(idx, tableSet.history.tableName, dialect);
    if (sql) statements.push(sql);
  }

  // Indexes — references table
  for (const idx of tableSet.references.indexes) {
    const sql = generateCreateIndex(idx, tableSet.references.tableName, dialect);
    if (sql) statements.push(sql);
  }

  return statements;
}

/**
 * Generate a `CREATE TABLE IF NOT EXISTS` statement for a lookup sub-table.
 */
export function generateCreateLookupTable(table: LookupTableSchema, dialect: DDLDialect = 'postgres'): string {
  const lines: string[] = [];

  lines.push(`CREATE TABLE IF NOT EXISTS "${table.tableName}" (`);

  const entries: string[] = [];
  for (const col of table.columns) {
    entries.push(columnDDL(col, dialect));
  }

  if (table.compositePrimaryKey.length > 0) {
    const pkCols = table.compositePrimaryKey.map((c) => `"${c}"`).join(', ');
    entries.push(`  CONSTRAINT "${table.tableName}_pk" PRIMARY KEY (${pkCols})`);
  }

  lines.push(entries.join(',\n'));
  lines.push(');');

  return lines.join('\n');
}

// =============================================================================
// Section 6: Full Schema DDL
// =============================================================================

/**
 * Generate a `CREATE TABLE IF NOT EXISTS` statement for a global lookup table.
 */
export function generateCreateGlobalLookupTable(table: GlobalLookupTableSchema, dialect: DDLDialect = 'postgres'): string {
  const lines: string[] = [];

  lines.push(`CREATE TABLE IF NOT EXISTS "${table.tableName}" (`);

  const entries: string[] = [];
  for (const col of table.columns) {
    entries.push(columnDDL(col, dialect));
  }

  lines.push(entries.join(',\n'));
  lines.push(');');

  return lines.join('\n');
}

/**
 * Generate all DDL statements for a complete schema definition.
 *
 * Order:
 * 1. Global lookup tables (HumanName, Address, ContactPoint, Identifier)
 * 2. Resource tables (main, history, references)
 * 3. All indexes (global lookup + resource tables)
 *
 * @param schema - The complete schema definition.
 * @returns Array of SQL DDL statements.
 */
export function generateSchemaDDL(schema: SchemaDefinition, dialect: DDLDialect = 'postgres'): string[] {
  const tableStatements: string[] = [];
  const indexStatements: string[] = [];

  // PG-only extensions
  if (dialect === 'postgres') {
    tableStatements.push('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    tableStatements.push('CREATE EXTENSION IF NOT EXISTS btree_gin;');
    tableStatements.push(
      `CREATE OR REPLACE FUNCTION token_array_to_text(arr text[]) RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT array_to_string(arr, ' ') $$;`,
    );
  }

  // Global lookup tables first
  if (schema.globalLookupTables) {
    for (const lookup of schema.globalLookupTables) {
      tableStatements.push(generateCreateGlobalLookupTable(lookup, dialect));
    }
    for (const lookup of schema.globalLookupTables) {
      for (const idx of lookup.indexes) {
        const sql = generateCreateIndex(idx, lookup.tableName, dialect);
        if (sql) indexStatements.push(sql);
      }
    }
  }

  // Resource tables
  for (const tableSet of schema.tableSets) {
    tableStatements.push(generateCreateMainTable(tableSet.main, dialect));
    tableStatements.push(generateCreateHistoryTable(tableSet.history, dialect));
    tableStatements.push(generateCreateReferencesTable(tableSet.references, dialect));

    for (const idx of tableSet.main.indexes) {
      const sql = generateCreateIndex(idx, tableSet.main.tableName, dialect);
      if (sql) indexStatements.push(sql);
    }
    for (const idx of tableSet.history.indexes) {
      const sql = generateCreateIndex(idx, tableSet.history.tableName, dialect);
      if (sql) indexStatements.push(sql);
    }
    for (const idx of tableSet.references.indexes) {
      const sql = generateCreateIndex(idx, tableSet.references.tableName, dialect);
      if (sql) indexStatements.push(sql);
    }
  }

  return [...tableStatements, ...indexStatements];
}

/**
 * Generate the complete DDL as a single string, with statements
 * separated by double newlines.
 *
 * Includes a header comment with version and generation timestamp.
 */
export function generateSchemaDDLString(schema: SchemaDefinition, dialect: DDLDialect = 'postgres'): string {
  const header = [
    `-- MedXAI FHIR Schema DDL`,
    `-- Version: ${schema.version}`,
    `-- Dialect: ${dialect}`,
    `-- Generated: ${schema.generatedAt}`,
    `-- Resource types: ${schema.tableSets.length}`,
    `--`,
    `-- This file is auto-generated. Do not edit manually.`,
    '',
  ].join('\n');

  const statements = generateSchemaDDL(schema, dialect);
  return header + statements.join('\n\n') + '\n';
}
