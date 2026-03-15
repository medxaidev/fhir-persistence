/**
 * Database module — Public API
 *
 * v1 exports: DatabaseClient (PostgreSQL-only)
 * v2 exports: StorageAdapter / SqlDialect / SQLiteAdapter / SQLiteDialect
 *
 * @module fhir-persistence/db
 */

// v2 — Interfaces
export type { StorageAdapter, PreparedStatement, TransactionContext } from './adapter.js';
export type { SqlDialect } from './dialect.js';

// v2 — SQLite implementation (better-sqlite3 — native, production)
export { BetterSqlite3Adapter } from './better-sqlite3-adapter.js';
export type { BetterSqlite3Options } from './better-sqlite3-adapter.js';
export { SQLiteDialect } from './sqlite-dialect.js';

// v2 — PostgreSQL implementation
export { PostgresAdapter, rewritePlaceholders } from './postgres-adapter.js';
export type { PgPoolLike, PgClientLike, AsyncTransactionContext } from './postgres-adapter.js';
export { PostgresDialect } from './postgres-dialect.js';
