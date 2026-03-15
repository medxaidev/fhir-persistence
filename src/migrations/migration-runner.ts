/**
 * Schema Migration Runner (v2)
 *
 * Manages incremental database schema migrations with version tracking
 * using StorageAdapter (SQLite / PostgreSQL).
 *
 * Features:
 * - Automatic `_migrations` tracking table creation
 * - Sequential up/down migration execution
 * - Idempotent: skips already-applied migrations
 * - Transaction-per-migration for safety
 * - IG migrations (forward-only, auto-versioned)
 * - Status reporting (current version, pending migrations)
 *
 * @module fhir-persistence/migrations
 */

import type { StorageAdapter } from '../db/adapter.js';
import type { GeneratedMigration } from '../migration/migration-generator.js';

/**
 * v2 migration types — adds `type` field for IG vs file distinction.
 */
export interface MigrationV2 {
  /** Unique version number. Must be positive integer. */
  version: number;
  /** Human-readable description. */
  description: string;
  /** SQL statements to apply this migration. */
  up: string[];
  /** SQL statements to revert this migration. Empty for IG migrations (forward-only). */
  down: string[];
  /** Migration source type: 'ig' for IG-driven, 'file' for manual file-based. */
  type: 'ig' | 'file';
}

export interface MigrationRecordV2 {
  version: number;
  description: string;
  type: string;
  applied_at: string;
}

export interface MigrationResultV2 {
  action: 'up' | 'down' | 'none';
  applied: number[];
  currentVersion: number;
  errors: Array<{ version: number; error: string }>;
}

export interface MigrationStatusV2 {
  currentVersion: number;
  appliedVersions: number[];
  availableVersions: number[];
  pendingVersions: number[];
}

const TRACKING_TABLE_V2 = '_migrations';

const CREATE_TRACKING_TABLE_V2_SQLITE = `
CREATE TABLE IF NOT EXISTS "${TRACKING_TABLE_V2}" (
  "version" INTEGER PRIMARY KEY,
  "description" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'file',
  "applied_at" TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

/**
 * v2: Manages schema migrations using StorageAdapter (SQLite / PG).
 *
 * Key differences from v1:
 * - Uses `StorageAdapter` instead of `DatabaseClient`
 * - `?` placeholders instead of `$1`
 * - Supports `type` field: 'ig' | 'file'
 * - IG migrations are forward-only (no down/revert)
 * - Tracking table uses `datetime('now')` for SQLite
 */
export class MigrationRunnerV2 {
  private readonly adapter: StorageAdapter;
  private readonly migrations: MigrationV2[];

  constructor(adapter: StorageAdapter, migrations: MigrationV2[] = []) {
    this.adapter = adapter;
    this.migrations = [...migrations].sort((a, b) => a.version - b.version);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Ensure the tracking table exists.
   */
  async ensureTrackingTable(): Promise<void> {
    await this.adapter.execute(CREATE_TRACKING_TABLE_V2_SQLITE);
  }

  /**
   * Apply all pending migrations (or up to a target version).
   */
  async up(targetVersion?: number): Promise<MigrationResultV2> {
    await this.ensureTrackingTable();

    const applied = await this.getAppliedVersions();
    const target = targetVersion ?? Math.max(...this.migrations.map((m) => m.version), 0);

    const pending = this.migrations.filter(
      (m) => !applied.has(m.version) && m.version <= target,
    );

    if (pending.length === 0) {
      return {
        action: 'none',
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
        break;
      }
    }

    const finalApplied = await this.getAppliedVersions();
    return {
      action: 'up',
      applied: appliedVersions,
      currentVersion: this.maxApplied(finalApplied),
      errors,
    };
  }

  /**
   * Revert migrations down to a target version.
   * IG migrations (type='ig') cannot be reverted — they are skipped.
   */
  async down(targetVersion: number = 0): Promise<MigrationResultV2> {
    await this.ensureTrackingTable();

    const applied = await this.getAppliedVersions();

    const toRevert = this.migrations
      .filter((m) => applied.has(m.version) && m.version > targetVersion)
      .filter((m) => m.type !== 'ig') // IG migrations are forward-only
      .sort((a, b) => b.version - a.version);

    if (toRevert.length === 0) {
      return {
        action: 'none',
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
        break;
      }
    }

    const finalApplied = await this.getAppliedVersions();
    return {
      action: 'down',
      applied: revertedVersions,
      currentVersion: this.maxApplied(finalApplied),
      errors,
    };
  }

  /**
   * Get the current migration status.
   */
  async status(): Promise<MigrationStatusV2> {
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
  async getRecords(): Promise<MigrationRecordV2[]> {
    await this.ensureTrackingTable();
    return this.adapter.query<MigrationRecordV2>(
      `SELECT "version", "description", "type", "applied_at" FROM "${TRACKING_TABLE_V2}" ORDER BY "version"`,
    );
  }

  /**
   * Apply an IG-generated migration directly.
   *
   * Assigns the next available version number automatically.
   * This is the primary entry point for IGPersistenceManager.
   */
  async applyIGMigration(generated: GeneratedMigration): Promise<MigrationResultV2> {
    await this.ensureTrackingTable();

    const applied = await this.getAppliedVersions();
    const maxVersion = this.maxApplied(applied);
    const nextVersion = maxVersion + 1;

    const migration: MigrationV2 = {
      version: nextVersion,
      description: generated.description,
      up: generated.up,
      down: [], // IG migrations are forward-only
      type: 'ig',
    };

    try {
      await this.applyMigration(migration);
      return {
        action: 'up',
        applied: [nextVersion],
        currentVersion: nextVersion,
        errors: [],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        action: 'up',
        applied: [],
        currentVersion: maxVersion,
        errors: [{ version: nextVersion, error: message }],
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private async getAppliedVersions(): Promise<Set<number>> {
    const rows = await this.adapter.query<{ version: number }>(
      `SELECT "version" FROM "${TRACKING_TABLE_V2}"`,
    );
    return new Set(rows.map((r) => r.version));
  }

  private async applyMigration(migration: MigrationV2): Promise<void> {
    await this.adapter.transaction(async (tx) => {
      for (const sql of migration.up) {
        await tx.execute(sql);
      }
      await tx.execute(
        `INSERT INTO "${TRACKING_TABLE_V2}" ("version", "description", "type") VALUES (?, ?, ?)`,
        [migration.version, migration.description, migration.type],
      );
    });
  }

  private async revertMigration(migration: MigrationV2): Promise<void> {
    await this.adapter.transaction(async (tx) => {
      for (const sql of migration.down) {
        await tx.execute(sql);
      }
      await tx.execute(
        `DELETE FROM "${TRACKING_TABLE_V2}" WHERE "version" = ?`,
        [migration.version],
      );
    });
  }

  private maxApplied(versions: Set<number>): number {
    if (versions.size === 0) return 0;
    return Math.max(...versions);
  }
}
