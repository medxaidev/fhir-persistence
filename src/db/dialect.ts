/**
 * SqlDialect — Database-Specific SQL Generation Strategy
 *
 * Encapsulates syntax differences between SQLite and PostgreSQL.
 * Injected into query builders (WhereBuilder, SearchSQLBuilder)
 * so business logic remains dialect-agnostic.
 *
 * v2 upgrade: New file. v1 hardcoded PostgreSQL syntax everywhere.
 *
 * @module fhir-persistence/db
 */

/**
 * Strategy object for generating database-specific SQL fragments.
 *
 * Each adapter implementation provides a matching dialect instance.
 */
export interface SqlDialect {
  /** Dialect identifier for branching where needed. */
  readonly name: 'sqlite' | 'postgres';

  /**
   * Positional parameter placeholder.
   * - SQLite: always `?` (index ignored)
   * - PostgreSQL: `$1`, `$2`, ... (1-based index)
   */
  placeholder(index: number): string;

  /**
   * Generate a TEXT[] array-contains check.
   *
   * Checks if any element of a TEXT[] column matches any of the given values.
   * - SQLite:      `EXISTS (SELECT 1 FROM json_each("col") WHERE value IN (?,?))`
   * - PostgreSQL:  `"col" && ARRAY[$1,$2]::text[]`
   */
  textArrayContains(column: string, paramCount: number, paramStartIndex: number): {
    sql: string;
    values: unknown[];
  };

  /**
   * LIKE expression for string prefix / contains search.
   * - SQLite:      `"col" LIKE ? ESCAPE '\'`
   * - PostgreSQL:  `"col" LIKE $1`
   */
  like(column: string, paramIndex: number): string;

  /**
   * LIMIT / OFFSET clause.
   * - SQLite:      `LIMIT ? OFFSET ?`
   * - PostgreSQL:  `LIMIT $1 OFFSET $2`
   */
  limitOffset(paramStartIndex: number): { sql: string };

  /**
   * TEXT[] array literal for INSERT/UPDATE values.
   * - SQLite:      JSON array string, e.g. `'["system|code","|code"]'`
   * - PostgreSQL:  `ARRAY['system|code','|code']::text[]`
   */
  arrayLiteral(values: string[]): string;

  /**
   * Timestamp column type.
   * - SQLite:      `TEXT` (ISO 8601 strings)
   * - PostgreSQL:  `TIMESTAMPTZ`
   */
  timestampType(): string;

  /**
   * Boolean column type.
   * - SQLite:      `INTEGER` (0/1)
   * - PostgreSQL:  `BOOLEAN`
   */
  booleanType(): string;

  /**
   * Array column type for TEXT arrays.
   * - SQLite:      `TEXT` (JSON serialized)
   * - PostgreSQL:  `TEXT[]` (native)
   */
  textArrayType(): string;

  /**
   * UPSERT suffix for ON CONFLICT handling.
   * Both dialects support `ON CONFLICT ... DO UPDATE SET ...`
   */
  upsertSuffix(conflictColumn: string, updateColumns: string[]): string;

  /**
   * Auto-increment primary key type.
   * - SQLite:      `INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT`
   * - PostgreSQL:  `SERIAL PRIMARY KEY` or `INTEGER GENERATED ALWAYS AS IDENTITY`
   */
  autoIncrementPK(): string;
}
