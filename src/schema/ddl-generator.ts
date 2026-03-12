/**
 * DDL Generator
 *
 * Converts `ResourceTableSet` / `SchemaDefinition` to PostgreSQL DDL strings.
 * All functions are pure — no database dependency.
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
} from './table-schema.js';

// =============================================================================
// Section 1: Column DDL
// =============================================================================

/**
 * Generate the DDL fragment for a single column definition.
 *
 * Example: `"id" UUID NOT NULL`
 */
function columnDDL(col: ColumnSchema): string {
  const parts: string[] = [`"${col.name}"`, col.type];

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
export function generateCreateMainTable(table: MainTableSchema): string {
  const lines: string[] = [];

  lines.push(`CREATE TABLE IF NOT EXISTS "${table.tableName}" (`);

  const entries: string[] = [];
  for (const col of table.columns) {
    entries.push(columnDDL(col));
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
 */
export function generateCreateHistoryTable(table: HistoryTableSchema): string {
  const lines: string[] = [];

  lines.push(`CREATE TABLE IF NOT EXISTS "${table.tableName}" (`);

  const entries: string[] = [];
  for (const col of table.columns) {
    entries.push(columnDDL(col));
  }

  // History table PK is on versionId
  const pkCol = table.columns.find((c) => c.primaryKey);
  if (pkCol) {
    entries.push(`  CONSTRAINT "${table.tableName}_pk" PRIMARY KEY ("${pkCol.name}")`);
  }

  lines.push(entries.join(',\n'));
  lines.push(');');

  return lines.join('\n');
}

/**
 * Generate a `CREATE TABLE IF NOT EXISTS` statement for a references table.
 */
export function generateCreateReferencesTable(table: ReferencesTableSchema): string {
  const lines: string[] = [];

  lines.push(`CREATE TABLE IF NOT EXISTS "${table.tableName}" (`);

  const entries: string[] = [];
  for (const col of table.columns) {
    entries.push(columnDDL(col));
  }

  // Composite primary key
  if (table.compositePrimaryKey.length > 0) {
    const pkCols = table.compositePrimaryKey.map((c) => `"${c}"`).join(', ');
    entries.push(`  CONSTRAINT "${table.tableName}_pk" PRIMARY KEY (${pkCols})`);
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
export function generateCreateIndex(index: IndexSchema, tableName: string): string {
  const unique = index.unique ? 'UNIQUE ' : '';

  let indexExpr: string;
  if (index.expression) {
    indexExpr = index.expression;
  } else if (index.opClass) {
    indexExpr = index.columns.map((c) => `"${c}" ${index.opClass}`).join(', ');
  } else {
    indexExpr = index.columns.map((c) => `"${c}"`).join(', ');
  }

  let sql = `CREATE ${unique}INDEX IF NOT EXISTS "${index.name}"\n  ON "${tableName}" USING ${index.indexType} (${indexExpr})`;

  if (index.include && index.include.length > 0) {
    const includeCols = index.include.map((c) => `"${c}"`).join(', ');
    sql += `\n  INCLUDE (${includeCols})`;
  }

  if (index.where) {
    sql += `\n  WHERE ${index.where}`;
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
export function generateResourceDDL(tableSet: ResourceTableSet): string[] {
  const statements: string[] = [];

  // Tables
  statements.push(generateCreateMainTable(tableSet.main));
  statements.push(generateCreateHistoryTable(tableSet.history));
  statements.push(generateCreateReferencesTable(tableSet.references));

  // Indexes — main table
  for (const idx of tableSet.main.indexes) {
    statements.push(generateCreateIndex(idx, tableSet.main.tableName));
  }

  // Indexes — history table
  for (const idx of tableSet.history.indexes) {
    statements.push(generateCreateIndex(idx, tableSet.history.tableName));
  }

  // Indexes — references table
  for (const idx of tableSet.references.indexes) {
    statements.push(generateCreateIndex(idx, tableSet.references.tableName));
  }

  return statements;
}

/**
 * Generate a `CREATE TABLE IF NOT EXISTS` statement for a lookup sub-table.
 */
export function generateCreateLookupTable(table: LookupTableSchema): string {
  const lines: string[] = [];

  lines.push(`CREATE TABLE IF NOT EXISTS "${table.tableName}" (`);

  const entries: string[] = [];
  for (const col of table.columns) {
    entries.push(columnDDL(col));
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
export function generateCreateGlobalLookupTable(table: GlobalLookupTableSchema): string {
  const lines: string[] = [];

  lines.push(`CREATE TABLE IF NOT EXISTS "${table.tableName}" (`);

  const entries: string[] = [];
  for (const col of table.columns) {
    entries.push(columnDDL(col));
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
export function generateSchemaDDL(schema: SchemaDefinition): string[] {
  const tableStatements: string[] = [];
  const indexStatements: string[] = [];

  // Extensions required for trigram and btree_gin indexes (matches Medplum)
  tableStatements.push('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
  tableStatements.push('CREATE EXTENSION IF NOT EXISTS btree_gin;');

  // Helper function used by trigram indexes on token text arrays (matches Medplum)
  tableStatements.push(
    `CREATE OR REPLACE FUNCTION token_array_to_text(arr text[]) RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT array_to_string(arr, ' ') $$;`,
  );

  // Global lookup tables first
  if (schema.globalLookupTables) {
    for (const lookup of schema.globalLookupTables) {
      tableStatements.push(generateCreateGlobalLookupTable(lookup));
    }
    for (const lookup of schema.globalLookupTables) {
      for (const idx of lookup.indexes) {
        indexStatements.push(generateCreateIndex(idx, lookup.tableName));
      }
    }
  }

  // Resource tables
  for (const tableSet of schema.tableSets) {
    tableStatements.push(generateCreateMainTable(tableSet.main));
    tableStatements.push(generateCreateHistoryTable(tableSet.history));
    tableStatements.push(generateCreateReferencesTable(tableSet.references));

    for (const idx of tableSet.main.indexes) {
      indexStatements.push(generateCreateIndex(idx, tableSet.main.tableName));
    }
    for (const idx of tableSet.history.indexes) {
      indexStatements.push(generateCreateIndex(idx, tableSet.history.tableName));
    }
    for (const idx of tableSet.references.indexes) {
      indexStatements.push(generateCreateIndex(idx, tableSet.references.tableName));
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
export function generateSchemaDDLString(schema: SchemaDefinition): string {
  const header = [
    `-- MedXAI FHIR Schema DDL`,
    `-- Version: ${schema.version}`,
    `-- Generated: ${schema.generatedAt}`,
    `-- Resource types: ${schema.tableSets.length}`,
    `--`,
    `-- This file is auto-generated. Do not edit manually.`,
    '',
  ].join('\n');

  const statements = generateSchemaDDL(schema);
  return header + statements.join('\n\n') + '\n';
}
