/**
 * Schema Migration Types
 *
 * Defines the contract for database schema migrations.
 * Each migration has a version number, description, and up/down SQL.
 *
 * @module fhir-persistence/migrations
 */

// =============================================================================
// Section 1: Migration Definition
// =============================================================================

/**
 * A single database migration.
 *
 * Migrations are ordered by version number and executed sequentially.
 * Each migration must provide both `up` (apply) and `down` (revert) SQL.
 */
export interface Migration {
  /** Unique version number (e.g., 1, 2, 3). Must be positive integer. */
  version: number;
  /** Human-readable description of what this migration does. */
  description: string;
  /** SQL statements to apply this migration. */
  up: string[];
  /** SQL statements to revert this migration. */
  down: string[];
}

// =============================================================================
// Section 2: Migration Record (DB row)
// =============================================================================

/**
 * A row in the `_migrations` tracking table.
 */
export interface MigrationRecord {
  /** The migration version number. */
  version: number;
  /** Description from the migration definition. */
  description: string;
  /** When this migration was applied. */
  applied_at: Date;
}

// =============================================================================
// Section 3: Migration Result
// =============================================================================

/**
 * Result of a migration operation.
 */
export interface MigrationResult {
  /** The action performed. */
  action: "up" | "down" | "none";
  /** Migrations that were applied or reverted. */
  applied: number[];
  /** Current version after the operation. */
  currentVersion: number;
  /** Any errors encountered. */
  errors: Array<{ version: number; error: string }>;
}

/**
 * Status of the migration system.
 */
export interface MigrationStatus {
  /** Current applied version (0 if none). */
  currentVersion: number;
  /** All applied migration versions. */
  appliedVersions: number[];
  /** Available migration versions (from code). */
  availableVersions: number[];
  /** Pending migrations (available but not applied). */
  pendingVersions: number[];
}
