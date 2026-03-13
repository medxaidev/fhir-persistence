/**
 * Package Registry Repository — v2
 *
 * Tracks installed FHIR IG packages (name, version, checksum) in
 * the `_packages` table. Used by IGPersistenceManager to detect
 * new/upgrade/consistent state via checksum comparison.
 *
 * Key design decisions:
 * - Uses StorageAdapter (not DatabaseClient)
 * - `?` placeholders for SQLite compatibility
 * - Stores serialized ResourceTableSet[] as `schema_snapshot` for SchemaDiff
 * - Checksum is a hash of the package content (e.g., SHA-256)
 *
 * @module fhir-persistence/registry
 */

import type { StorageAdapter } from '../db/adapter.js';

// =============================================================================
// Section 1: Types
// =============================================================================

export type PackageStatus = 'active' | 'superseded';

export interface InstalledPackage {
  /** Package name (e.g., "hl7.fhir.r4.core"). */
  name: string;
  /** Package version (e.g., "4.0.1"). */
  version: string;
  /** Content checksum for change detection. */
  checksum: string;
  /** Serialized ResourceTableSet[] JSON for SchemaDiff. */
  schemaSnapshot: string | null;
  /** When this package was installed/updated. */
  installedAt: string;
  /** Package status: active or superseded. */
  status: PackageStatus;
}

export interface SchemaVersionRecord {
  /** Auto-incrementing version number. */
  version: number;
  /** JSON snapshot of active package names+versions at this schema version. */
  packageList: string;
  /** Description of the schema change. */
  description: string;
  /** When this schema version was applied. */
  appliedAt: string;
}

// =============================================================================
// Section 2: DDL
// =============================================================================

const PACKAGES_TABLE = '_packages';

const CREATE_PACKAGES_TABLE = `
CREATE TABLE IF NOT EXISTS "${PACKAGES_TABLE}" (
  "name" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "checksum" TEXT NOT NULL,
  "schemaSnapshot" TEXT,
  "installedAt" TEXT NOT NULL DEFAULT (datetime('now')),
  "status" TEXT NOT NULL DEFAULT 'active',
  PRIMARY KEY ("name", "version")
);
`;

const SCHEMA_VERSION_TABLE = '_schema_version';

const CREATE_SCHEMA_VERSION_TABLE = `
CREATE TABLE IF NOT EXISTS "${SCHEMA_VERSION_TABLE}" (
  "version" INTEGER NOT NULL PRIMARY KEY,
  "packageList" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "appliedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

// =============================================================================
// Section 3: PackageRegistryRepo
// =============================================================================

export class PackageRegistryRepo {
  constructor(private readonly adapter: StorageAdapter) { }

  /**
   * Ensure the packages tracking table exists.
   */
  async ensureTable(): Promise<void> {
    await this.adapter.execute(CREATE_PACKAGES_TABLE);
  }

  /**
   * Get the active version of a package by name.
   */
  async getPackage(name: string): Promise<InstalledPackage | undefined> {
    await this.ensureTable();
    return this.adapter.queryOne<InstalledPackage>(
      `SELECT "name", "version", "checksum", "schemaSnapshot", "installedAt", "status" FROM "${PACKAGES_TABLE}" WHERE "name" = ? AND "status" = 'active'`,
      [name],
    );
  }

  /**
   * Get all installed packages (all statuses).
   */
  async getInstalledPackages(): Promise<InstalledPackage[]> {
    await this.ensureTable();
    return this.adapter.query<InstalledPackage>(
      `SELECT "name", "version", "checksum", "schemaSnapshot", "installedAt", "status" FROM "${PACKAGES_TABLE}" ORDER BY "name", "version"`,
    );
  }

  /**
   * Get only active packages.
   */
  async getActivePackages(): Promise<InstalledPackage[]> {
    await this.ensureTable();
    return this.adapter.query<InstalledPackage>(
      `SELECT "name", "version", "checksum", "schemaSnapshot", "installedAt", "status" FROM "${PACKAGES_TABLE}" WHERE "status" = 'active' ORDER BY "name"`,
    );
  }

  /**
   * Register a package version.
   *
   * When a new version is registered for the same package name:
   * 1. Previous active versions are marked as 'superseded'
   * 2. The new version is inserted as 'active'
   * 3. A schema_version record is created with the package_list snapshot
   */
  async registerPackage(
    pkg: Omit<InstalledPackage, 'installedAt' | 'status'>,
    description?: string,
  ): Promise<void> {
    await this.ensureTable();

    // Supersede old active versions of this package
    await this.adapter.execute(
      `UPDATE "${PACKAGES_TABLE}" SET "status" = 'superseded' WHERE "name" = ? AND "status" = 'active'`,
      [pkg.name],
    );

    // Insert the new version as active
    await this.adapter.execute(
      `INSERT OR REPLACE INTO "${PACKAGES_TABLE}" ("name", "version", "checksum", "schemaSnapshot", "status") VALUES (?, ?, ?, ?, 'active')`,
      [pkg.name, pkg.version, pkg.checksum, pkg.schemaSnapshot ?? null],
    );

    // Record schema version with active package list snapshot
    await this.recordSchemaVersion(description ?? `Register ${pkg.name}@${pkg.version}`);
  }

  /**
   * Insert or update a package record (backward-compatible).
   *
   * Uses INSERT OR REPLACE (SQLite UPSERT) to handle both new and upgraded packages.
   */
  async upsertPackage(pkg: Omit<InstalledPackage, 'installedAt' | 'status'>): Promise<void> {
    await this.ensureTable();

    // Supersede old active versions
    await this.adapter.execute(
      `UPDATE "${PACKAGES_TABLE}" SET "status" = 'superseded' WHERE "name" = ? AND "status" = 'active'`,
      [pkg.name],
    );

    await this.adapter.execute(
      `INSERT OR REPLACE INTO "${PACKAGES_TABLE}" ("name", "version", "checksum", "schemaSnapshot", "status") VALUES (?, ?, ?, ?, 'active')`,
      [pkg.name, pkg.version, pkg.checksum, pkg.schemaSnapshot ?? null],
    );
  }

  /**
   * Remove all versions of a package.
   */
  async removePackage(name: string): Promise<void> {
    await this.ensureTable();
    await this.adapter.execute(
      `DELETE FROM "${PACKAGES_TABLE}" WHERE "name" = ?`,
      [name],
    );
  }

  /**
   * Check if a package needs update by comparing checksums.
   *
   * Returns:
   * - 'new' if the package is not installed (no active version)
   * - 'upgrade' if the checksum differs
   * - 'consistent' if the checksum matches
   */
  async checkStatus(name: string, checksum: string): Promise<'new' | 'upgrade' | 'consistent'> {
    const existing = await this.getPackage(name);
    if (!existing) return 'new';
    if (existing.checksum !== checksum) return 'upgrade';
    return 'consistent';
  }

  // ---------------------------------------------------------------------------
  // Schema Version Management
  // ---------------------------------------------------------------------------

  /**
   * Ensure the schema version table exists.
   */
  async ensureSchemaVersionTable(): Promise<void> {
    await this.adapter.execute(CREATE_SCHEMA_VERSION_TABLE);
  }

  /**
   * Record a schema version with the current active package list.
   */
  async recordSchemaVersion(description: string): Promise<void> {
    await this.ensureSchemaVersionTable();

    // Get next version number
    const row = await this.adapter.queryOne<{ maxV: number | null }>(
      `SELECT MAX("version") as "maxV" FROM "${SCHEMA_VERSION_TABLE}"`,
    );
    const nextVersion = (row?.maxV ?? 0) + 1;

    // Build package list snapshot from active packages
    const active = await this.getActivePackages();
    const packageList = JSON.stringify(
      active.map(p => ({ name: p.name, version: p.version })),
    );

    await this.adapter.execute(
      `INSERT INTO "${SCHEMA_VERSION_TABLE}" ("version", "packageList", "description") VALUES (?, ?, ?)`,
      [nextVersion, packageList, description],
    );
  }

  /**
   * Get all schema version records.
   */
  async getSchemaVersions(): Promise<SchemaVersionRecord[]> {
    await this.ensureSchemaVersionTable();
    return this.adapter.query<SchemaVersionRecord>(
      `SELECT "version", "packageList", "description", "appliedAt" FROM "${SCHEMA_VERSION_TABLE}" ORDER BY "version"`,
    );
  }

  /**
   * Get the latest schema version record.
   */
  async getLatestSchemaVersion(): Promise<SchemaVersionRecord | undefined> {
    await this.ensureSchemaVersionTable();
    return this.adapter.queryOne<SchemaVersionRecord>(
      `SELECT "version", "packageList", "description", "appliedAt" FROM "${SCHEMA_VERSION_TABLE}" ORDER BY "version" DESC LIMIT 1`,
    );
  }
}
