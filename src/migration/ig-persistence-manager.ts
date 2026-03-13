/**
 * IG Persistence Manager — v2
 *
 * Orchestrates the initialization flow when an IG package is loaded:
 * 1. Check PackageRegistry for existing installation (checksum compare)
 * 2. Three-way branch: new / upgrade / consistent
 * 3. For new/upgrade: SchemaDiff → MigrationGenerator → MigrationRunnerV2
 * 4. Schedule reindex jobs for SP expression changes
 *
 * @module fhir-persistence/migration
 */

import type { StorageAdapter } from '../db/adapter.js';
import type { ResourceTableSet } from '../schema/table-schema.js';
import type { DDLDialect } from '../schema/ddl-generator.js';
import { PackageRegistryRepo } from '../registry/package-registry-repo.js';
import { compareSchemas } from './schema-diff.js';
import { generateMigration } from './migration-generator.js';
import { MigrationRunnerV2 } from '../migrations/migration-runner.js';
import { ReindexScheduler } from './reindex-scheduler.js';

// =============================================================================
// Section 1: Types
// =============================================================================

export interface IGPackageInput {
  /** Package name (e.g., "hl7.fhir.r4.core"). */
  name: string;
  /** Package version (e.g., "4.0.1"). */
  version: string;
  /** Content checksum for change detection. */
  checksum: string;
  /** The new schema table sets generated from this package. */
  tableSets: ResourceTableSet[];
}

export type IGInitAction = 'new' | 'upgrade' | 'consistent';

export interface IGInitResult {
  /** What action was taken. */
  action: IGInitAction;
  /** Package name. */
  packageName: string;
  /** Package version. */
  packageVersion: string;
  /** Number of DDL statements applied (0 for 'consistent'). */
  ddlCount: number;
  /** Number of reindex jobs scheduled. */
  reindexCount: number;
  /** Error message if any step failed. */
  error?: string;
}

// =============================================================================
// Section 2: IGPersistenceManager
// =============================================================================

export class IGPersistenceManager {
  private readonly adapter: StorageAdapter;
  private readonly dialect: DDLDialect;
  private readonly packageRepo: PackageRegistryRepo;
  private readonly migrationRunner: MigrationRunnerV2;
  private readonly reindexScheduler: ReindexScheduler;

  constructor(adapter: StorageAdapter, dialect: DDLDialect = 'sqlite') {
    this.adapter = adapter;
    this.dialect = dialect;
    this.packageRepo = new PackageRegistryRepo(adapter);
    this.migrationRunner = new MigrationRunnerV2(adapter);
    this.reindexScheduler = new ReindexScheduler(adapter);
  }

  /**
   * Initialize an IG package — the main entry point.
   *
   * Three-way branch based on checksum comparison:
   * - **new**: Fresh install → apply full schema DDL
   * - **upgrade**: Checksum changed → diff + apply migration
   * - **consistent**: Checksum matches → no-op
   */
  async initialize(input: IGPackageInput): Promise<IGInitResult> {
    const { name, version, checksum, tableSets } = input;

    try {
      // Step 1: Check package status
      const status = await this.packageRepo.checkStatus(name, checksum);

      if (status === 'consistent') {
        return {
          action: 'consistent',
          packageName: name,
          packageVersion: version,
          ddlCount: 0,
          reindexCount: 0,
        };
      }

      // Step 2: Get old schema (empty for 'new', from snapshot for 'upgrade')
      let oldTableSets: ResourceTableSet[] = [];
      if (status === 'upgrade') {
        const existing = await this.packageRepo.getPackage(name);
        if (existing?.schemaSnapshot) {
          try {
            oldTableSets = JSON.parse(existing.schemaSnapshot) as ResourceTableSet[];
          } catch {
            // Corrupted snapshot → treat as fresh install
            oldTableSets = [];
          }
        }
      }

      // Step 3: Diff schemas
      const deltas = compareSchemas(oldTableSets, tableSets);

      // Step 4: Generate migration DDL
      const migration = generateMigration(deltas, this.dialect);

      // Step 5: Apply migration
      let ddlCount = 0;
      if (migration.up.length > 0) {
        const result = await this.migrationRunner.applyIGMigration(migration);
        if (result.errors.length > 0) {
          return {
            action: status,
            packageName: name,
            packageVersion: version,
            ddlCount: 0,
            reindexCount: 0,
            error: result.errors[0].error,
          };
        }
        ddlCount = migration.up.length;
      }

      // Step 6: Schedule reindex jobs
      let reindexCount = 0;
      if (migration.reindexDeltas.length > 0) {
        reindexCount = await this.reindexScheduler.schedule(migration.reindexDeltas);
      }

      // Step 7: Update package registry with new snapshot
      await this.packageRepo.upsertPackage({
        name,
        version,
        checksum,
        schemaSnapshot: JSON.stringify(tableSets),
      });

      return {
        action: status,
        packageName: name,
        packageVersion: version,
        ddlCount,
        reindexCount,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        action: 'new',
        packageName: name,
        packageVersion: version,
        ddlCount: 0,
        reindexCount: 0,
        error: message,
      };
    }
  }
}
