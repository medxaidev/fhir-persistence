/**
 * SQL Builder
 *
 * Generates parameterized SQL statements for FHIR resource persistence.
 * All queries use `$1, $2, ...` placeholders — no string interpolation
 * of user data (SQL injection safe).
 *
 * Table and column names are double-quoted for safety but are NOT
 * parameterized (they come from the schema, not user input).
 *
 * @module fhir-persistence/repo
 */

// =============================================================================
// Section 1: Upsert (Main Table)
// =============================================================================

/**
 * Build an UPSERT statement for the main resource table.
 *
 * Generates:
 * ```sql
 * INSERT INTO "Patient" ("id", "content", ...)
 * VALUES ($1, $2, ...)
 * ON CONFLICT ("id") DO UPDATE SET
 *   "content" = EXCLUDED."content", ...
 * ```
 *
 * @param tableName - The table name (e.g., `'Patient'`).
 * @param columns - Column name → value map. Order is preserved.
 * @returns `{ sql, values }` ready for `client.query()`.
 */
export function buildUpsertSQL(
  tableName: string,
  columns: Record<string, unknown>,
): { sql: string; values: unknown[] } {
  const keys = Object.keys(columns);
  const values = Object.values(columns);

  const colList = keys.map((k) => `"${k}"`).join(', ');
  const paramList = keys.map((_, i) => `$${i + 1}`).join(', ');

  // ON CONFLICT — update all columns except "id"
  const updateCols = keys
    .filter((k) => k !== 'id')
    .map((k) => `"${k}" = EXCLUDED."${k}"`)
    .join(', ');

  const sql =
    `INSERT INTO "${tableName}" (${colList})\n` +
    `VALUES (${paramList})\n` +
    `ON CONFLICT ("id") DO UPDATE SET\n` +
    `  ${updateCols}`;

  return { sql, values };
}

// =============================================================================
// Section 2: Insert (History Table)
// =============================================================================

/**
 * Build a plain INSERT statement (no conflict handling).
 *
 * Used for history table writes where each row is unique
 * (keyed by `versionId`).
 *
 * @param tableName - The table name (e.g., `'Patient_History'`).
 * @param columns - Column name → value map.
 * @returns `{ sql, values }` ready for `client.query()`.
 */
export function buildInsertSQL(
  tableName: string,
  columns: Record<string, unknown>,
): { sql: string; values: unknown[] } {
  const keys = Object.keys(columns);
  const values = Object.values(columns);

  const colList = keys.map((k) => `"${k}"`).join(', ');
  const paramList = keys.map((_, i) => `$${i + 1}`).join(', ');

  const sql = `INSERT INTO "${tableName}" (${colList})\nVALUES (${paramList})`;

  return { sql, values };
}

// =============================================================================
// Section 3: Select
// =============================================================================

/**
 * Build a SELECT statement to read a resource by ID.
 *
 * Returns `content` and `deleted` columns.
 *
 * @param tableName - The table name (e.g., `'Patient'`).
 * @returns `{ sql }` — use with `values: [id]`.
 */
export function buildSelectByIdSQL(tableName: string): string {
  return `SELECT "content", "deleted", "projectId" FROM "${tableName}" WHERE "id" = $1`;
}

/**
 * Build a SELECT statement to read history entries for a resource.
 *
 * Returns all history rows ordered by `lastUpdated` descending (newest first).
 *
 * @param tableName - The history table name (e.g., `'Patient_History'`).
 * @returns `{ sql }` — use with `values: [id]`.
 */
export function buildSelectHistorySQL(tableName: string): string {
  return (
    `SELECT "content" FROM "${tableName}"\n` +
    `WHERE "id" = $1\n` +
    `ORDER BY "lastUpdated" DESC`
  );
}

// =============================================================================
// Section 4: History with Options
// =============================================================================

/**
 * Options for building history SQL with filtering and pagination.
 */
export interface HistorySQLOptions {
  since?: string;
  count?: number;
  cursor?: string;
}

/**
 * Build a SELECT for instance history with optional _since, _count, cursor.
 *
 * Returns `id`, `versionId`, `lastUpdated`, `content` columns.
 *
 * @param tableName - The history table name.
 * @returns `{ sql, values }`.
 */
export function buildInstanceHistorySQL(
  tableName: string,
  resourceId: string,
  options?: HistorySQLOptions,
): { sql: string; values: unknown[] } {
  const conditions: string[] = ['"id" = $1'];
  const values: unknown[] = [resourceId];
  let paramIdx = 2;

  if (options?.since) {
    conditions.push(`"lastUpdated" >= $${paramIdx}`);
    values.push(options.since);
    paramIdx++;
  }

  if (options?.cursor) {
    conditions.push(`"lastUpdated" < $${paramIdx}`);
    values.push(options.cursor);
    paramIdx++;
  }

  let sql =
    `SELECT "id", "versionId", "lastUpdated", "content" FROM "${tableName}"\n` +
    `WHERE ${conditions.join(' AND ')}\n` +
    `ORDER BY "lastUpdated" DESC`;

  if (options?.count !== undefined && options.count > 0) {
    sql += `\nLIMIT $${paramIdx}`;
    values.push(options.count);
  }

  return { sql, values };
}

/**
 * Build a SELECT for type-level history (all resources of a type).
 *
 * @param tableName - The history table name.
 * @returns `{ sql, values }`.
 */
export function buildTypeHistorySQL(
  tableName: string,
  options?: HistorySQLOptions,
): { sql: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (options?.since) {
    conditions.push(`"lastUpdated" >= $${paramIdx}`);
    values.push(options.since);
    paramIdx++;
  }

  if (options?.cursor) {
    conditions.push(`"lastUpdated" < $${paramIdx}`);
    values.push(options.cursor);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `\nWHERE ${conditions.join(' AND ')}` : '';

  let sql =
    `SELECT "id", "versionId", "lastUpdated", "content" FROM "${tableName}"` +
    whereClause +
    `\nORDER BY "lastUpdated" DESC`;

  if (options?.count !== undefined && options.count > 0) {
    sql += `\nLIMIT $${paramIdx}`;
    values.push(options.count);
  }

  return { sql, values };
}

/**
 * Build a SELECT statement to read a specific version from the history table.
 *
 * @param tableName - The history table name (e.g., `'Patient_History'`).
 * @returns `{ sql }` — use with `values: [id, versionId]`.
 */
export function buildSelectVersionSQL(tableName: string): string {
  return (
    `SELECT "content" FROM "${tableName}"\n` +
    `WHERE "id" = $1 AND "versionId" = $2`
  );
}
