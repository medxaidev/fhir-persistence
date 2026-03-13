/**
 * Database module — Public API
 *
 * v1 exports: DatabaseClient (PostgreSQL-only)
 * v2 exports: StorageAdapter / SqlDialect / SQLiteAdapter / SQLiteDialect
 *
 * @module fhir-persistence/db
 */

// v1 (preserved)
export type { DatabaseConfig } from './config.js';
export { loadDatabaseConfig } from './config.js';
export { DatabaseClient } from './client.js';

// v2 — Interfaces
export type { StorageAdapter, PreparedStatement, TransactionContext } from './adapter.js';
export type { SqlDialect } from './dialect.js';

// v2 — SQLite implementation
export { SQLiteAdapter } from './sqlite-adapter.js';
export { SQLiteDialect } from './sqlite-dialect.js';
