/**
 * StorageAdapter — Database Abstraction Interface
 *
 * Provides a unified interface for database operations across
 * SQLite and PostgreSQL. All business logic interacts with
 * the database exclusively through this interface.
 *
 * v2 upgrade: Replaces direct `pg.Pool` usage in v1's `DatabaseClient`.
 * The existing `DatabaseClient` is preserved for backward compatibility.
 *
 * @module fhir-persistence/db
 */

// =============================================================================
// Section 1: PreparedStatement
// =============================================================================

/**
 * A prepared (precompiled) SQL statement for high-frequency operations.
 *
 * Prepared statements avoid repeated SQL parsing overhead.
 * The caller is responsible for calling `finalize()` when done.
 */
export interface PreparedStatement<T = Record<string, unknown>> {
  /** Execute as a read query, returning all matching rows. */
  query(params?: unknown[]): T[];

  /** Execute as a write operation, returning change count. */
  execute(params?: unknown[]): { changes: number; lastInsertRowid?: number | bigint };

  /** Release the prepared statement resources. */
  finalize(): void;
}

// =============================================================================
// Section 2: TransactionContext
// =============================================================================

/**
 * A restricted adapter interface available inside a transaction callback.
 *
 * All operations within a transaction use this context to ensure
 * they execute on the same database connection/transaction.
 */
export interface TransactionContext {
  /** Execute a write operation within the transaction. */
  execute(sql: string, params?: unknown[]): { changes: number };

  /** Execute a read query within the transaction. */
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[];

  /** Execute a read query returning the first row or undefined. */
  queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): T | undefined;
}

// =============================================================================
// Section 3: StorageAdapter
// =============================================================================

/**
 * Unified database access interface for SQLite and PostgreSQL.
 *
 * All methods are async to support both synchronous (SQLite via sql.js)
 * and asynchronous (PostgreSQL via pg) database drivers.
 *
 * ## Transaction Semantics
 * - SQLite: `BEGIN IMMEDIATE ... COMMIT / ROLLBACK`
 * - PostgreSQL: `BEGIN ... COMMIT / ROLLBACK` with `SELECT FOR UPDATE`
 */
export interface StorageAdapter {
  /** Execute a write operation (INSERT / UPDATE / DELETE / DDL). */
  execute(sql: string, params?: unknown[]): Promise<{ changes: number }>;

  /** Execute a read query, returning all matching rows. */
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;

  /** Execute a read query, returning the first row or undefined. */
  queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>;

  /** Stream rows for large result sets (avoids full memory load). */
  queryStream<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): AsyncIterable<T>;

  /** Prepare a SQL statement for repeated execution. */
  prepare<T = Record<string, unknown>>(sql: string): PreparedStatement<T>;

  /**
   * Execute a function within a single database transaction.
   *
   * - On success (fn returns normally): COMMIT
   * - On failure (fn throws): ROLLBACK and re-throw
   */
  transaction<R>(fn: (tx: TransactionContext) => R | Promise<R>): Promise<R>;

  /** Close the database connection and release resources. */
  close(): Promise<void>;
}
