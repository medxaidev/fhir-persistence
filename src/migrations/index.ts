/**
 * Schema Migration Module
 *
 * @module fhir-persistence/migrations
 */

export { MigrationRunner } from './migration-runner.js';
export type {
  Migration,
  MigrationRecord,
  MigrationResult,
  MigrationStatus,
} from './types.js';
