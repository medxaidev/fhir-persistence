/**
 * Database module — Public API
 *
 * @module fhir-persistence/db
 */

export type { DatabaseConfig } from './config.js';
export { loadDatabaseConfig } from './config.js';
export { DatabaseClient } from './client.js';
