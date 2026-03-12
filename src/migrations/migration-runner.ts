/**
 * Schema Migration Runner
 *
 * Manages incremental database schema migrations with version tracking.
 *
 * Features:
 * - Automatic `_migrations` tracking table creation
 * - Sequential up/down migration execution
 * - Idempotent: skips already-applied migrations
 * - Transaction-per-migration for safety
 * - Status reporting (current version, pending migrations)
 *
 * @module fhir-persistence/migrations
 */

import type { DatabaseClient } from "../db/client.js";
import type {
  Migration,
  MigrationRecord,
  MigrationResult,
  MigrationStatus,
} from "./types.js";

// =============================================================================
// Section 1: Tracking Table DDL
// =============================================================================

const TRACKING_TABLE = "_migrations";

const CREATE_TRACKING_TABLE = `
CREATE TABLE IF NOT EXISTS "${TRACKING_TABLE}" (
  version INTEGER PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

// =============================================================================
// Section 2: MigrationRunner
// =============================================================================

/**
 * Manages schema migrations against a PostgreSQL database.
 *
 * @example
 * ```ts
 * const runner = new MigrationRunner(db, [migration001, migration002]);
 * const result = await runner.up();      // Apply all pending
 * const status = await runner.status();  // Check current state
 * await runner.down(1);                  // Revert to version 1
 * ```
 */
export class MigrationRunner {
  private readonly db: DatabaseClient;
  private readonly migrations: Migration[];

  constructor(db: DatabaseClient, migrations: Migration[]) {
    this.db = db;
    // Sort migrations by version ascending
    this.migrations = [...migrations].sort((a, b) => a.version - b.version);
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Ensure the tracking table exists.
   */
  async ensureTrackingTable(): Promise<void> {
    await this.db.query(CREATE_TRACKING_TABLE);
  }

  /**
   * Apply all pending migrations (or up to a target version).
   *
   * @param targetVersion - Optional max version to migrate to.
   * @returns Migration result with applied versions.
   */
  async up(targetVersion?: number): Promise<MigrationResult> {
    await this.ensureTrackingTable();

    const applied = await this.getAppliedVersions();
    const target = targetVersion ?? Math.max(...this.migrations.map((m) => m.version), 0);

    const pending = this.migrations.filter(
      (m) => !applied.has(m.version) && m.version <= target,
    );

    if (pending.length === 0) {
      return {
        action: "none",
        applied: [],
        currentVersion: this.maxApplied(applied),
        errors: [],
      };
    }

    const appliedVersions: number[] = [];
    const errors: Array<{ version: number; error: string }> = [];

    for (const migration of pending) {
      try {
        await this.applyMigration(migration);
        appliedVersions.push(migration.version);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ version: migration.version, error: message });
        break; // Stop on first error
      }
    }

    const finalApplied = await this.getAppliedVersions();
    return {
      action: "up",
      applied: appliedVersions,
      currentVersion: this.maxApplied(finalApplied),
      errors,
    };
  }

  /**
   * Revert migrations down to a target version.
   *
   * @param targetVersion - The version to revert to (exclusive).
   *   Pass 0 to revert all migrations.
   * @returns Migration result with reverted versions.
   */
  async down(targetVersion: number = 0): Promise<MigrationResult> {
    await this.ensureTrackingTable();

    const applied = await this.getAppliedVersions();

    // Find migrations to revert (in reverse order)
    const toRevert = this.migrations
      .filter((m) => applied.has(m.version) && m.version > targetVersion)
      .sort((a, b) => b.version - a.version);

    if (toRevert.length === 0) {
      return {
        action: "none",
        applied: [],
        currentVersion: this.maxApplied(applied),
        errors: [],
      };
    }

    const revertedVersions: number[] = [];
    const errors: Array<{ version: number; error: string }> = [];

    for (const migration of toRevert) {
      try {
        await this.revertMigration(migration);
        revertedVersions.push(migration.version);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ version: migration.version, error: message });
        break; // Stop on first error
      }
    }

    const finalApplied = await this.getAppliedVersions();
    return {
      action: "down",
      applied: revertedVersions,
      currentVersion: this.maxApplied(finalApplied),
      errors,
    };
  }

  /**
   * Get the current migration status.
   */
  async status(): Promise<MigrationStatus> {
    await this.ensureTrackingTable();

    const applied = await this.getAppliedVersions();
    const availableVersions = this.migrations.map((m) => m.version);
    const pendingVersions = availableVersions.filter((v) => !applied.has(v));

    return {
      currentVersion: this.maxApplied(applied),
      appliedVersions: [...applied].sort((a, b) => a - b),
      availableVersions,
      pendingVersions,
    };
  }

  /**
   * Get all applied migration records.
   */
  async getRecords(): Promise<MigrationRecord[]> {
    await this.ensureTrackingTable();
    const result = await this.db.query<MigrationRecord>(
      `SELECT version, description, applied_at FROM "${TRACKING_TABLE}" ORDER BY version`,
    );
    return result.rows;
  }

  // ===========================================================================
  // Private
  // ===========================================================================

  private async getAppliedVersions(): Promise<Set<number>> {
    const result = await this.db.query<{ version: number }>(
      `SELECT version FROM "${TRACKING_TABLE}"`,
    );
    return new Set(result.rows.map((r) => r.version));
  }

  private async applyMigration(migration: Migration): Promise<void> {
    // Execute all up statements
    for (const sql of migration.up) {
      await this.db.query(sql);
    }
    // Record the migration
    await this.db.query(
      `INSERT INTO "${TRACKING_TABLE}" (version, description) VALUES ($1, $2)`,
      [migration.version, migration.description],
    );
  }

  private async revertMigration(migration: Migration): Promise<void> {
    // Execute all down statements
    for (const sql of migration.down) {
      await this.db.query(sql);
    }
    // Remove the record
    await this.db.query(
      `DELETE FROM "${TRACKING_TABLE}" WHERE version = $1`,
      [migration.version],
    );
  }

  private maxApplied(versions: Set<number>): number {
    if (versions.size === 0) return 0;
    return Math.max(...versions);
  }
}
