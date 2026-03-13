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
}

// =============================================================================
// Section 2: DDL
// =============================================================================

const PACKAGES_TABLE = '_packages';

const CREATE_PACKAGES_TABLE = `
CREATE TABLE IF NOT EXISTS "${PACKAGES_TABLE}" (
  "name" TEXT NOT NULL PRIMARY KEY,
  "version" TEXT NOT NULL,
  "checksum" TEXT NOT NULL,
  "schemaSnapshot" TEXT,
  "installedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

// =============================================================================
// Section 3: PackageRegistryRepo
// =============================================================================

export class PackageRegistryRepo {
  constructor(private readonly adapter: StorageAdapter) {}

  /**
   * Ensure the packages tracking table exists.
   */
  async ensureTable(): Promise<void> {
    await this.adapter.execute(CREATE_PACKAGES_TABLE);
  }

  /**
   * Get an installed package by name.
   */
  async getPackage(name: string): Promise<InstalledPackage | undefined> {
    await this.ensureTable();
    return this.adapter.queryOne<InstalledPackage>(
      `SELECT "name", "version", "checksum", "schemaSnapshot", "installedAt" FROM "${PACKAGES_TABLE}" WHERE "name" = ?`,
      [name],
    );
  }

  /**
   * Get all installed packages.
   */
  async getInstalledPackages(): Promise<InstalledPackage[]> {
    await this.ensureTable();
    return this.adapter.query<InstalledPackage>(
      `SELECT "name", "version", "checksum", "schemaSnapshot", "installedAt" FROM "${PACKAGES_TABLE}" ORDER BY "name"`,
    );
  }

  /**
   * Insert or update a package record.
   *
   * Uses INSERT OR REPLACE (SQLite UPSERT) to handle both new and upgraded packages.
   */
  async upsertPackage(pkg: Omit<InstalledPackage, 'installedAt'>): Promise<void> {
    await this.ensureTable();
    await this.adapter.execute(
      `INSERT OR REPLACE INTO "${PACKAGES_TABLE}" ("name", "version", "checksum", "schemaSnapshot") VALUES (?, ?, ?, ?)`,
      [pkg.name, pkg.version, pkg.checksum, pkg.schemaSnapshot ?? null],
    );
  }

  /**
   * Remove a package record.
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
   * - 'new' if the package is not installed
   * - 'upgrade' if the checksum differs
   * - 'consistent' if the checksum matches
   */
  async checkStatus(name: string, checksum: string): Promise<'new' | 'upgrade' | 'consistent'> {
    const existing = await this.getPackage(name);
    if (!existing) return 'new';
    if (existing.checksum !== checksum) return 'upgrade';
    return 'consistent';
  }
}
