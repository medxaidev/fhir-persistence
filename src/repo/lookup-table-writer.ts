/**
 * Lookup Table Writer — v2
 *
 * Manages the 4 global lookup tables (HumanName, Address, ContactPoint, Identifier)
 * using StorageAdapter v2. Handles DDL creation, row insertion (replace strategy),
 * and deletion.
 *
 * Design decisions:
 * - Uses StorageAdapter interface (not DatabaseClient directly)
 * - All writes use `?` placeholders (SQLite-compatible, rewritten for PG)
 * - Replace strategy: DELETE existing rows for resourceId, then INSERT new ones
 * - Each lookup table has a `resourceId` column + type-specific columns
 * - Batch insert per table type for efficiency
 *
 * @module fhir-persistence/repo
 */

import type { StorageAdapter } from '../db/adapter.js';
import type { DDLDialect } from '../schema/ddl-generator.js';
import type { LookupTableRow } from './row-indexer.js';

// =============================================================================
// Section 1: DDL
// =============================================================================

function buildLookupTableDDL(dialect: DDLDialect): Record<string, string> {
  const pk = dialect === 'postgres' ? '"id" SERIAL PRIMARY KEY' : '"id" INTEGER PRIMARY KEY AUTOINCREMENT';
  return {
    HumanName: `CREATE TABLE IF NOT EXISTS "HumanName" (
  ${pk},
  "resourceId" TEXT NOT NULL,
  "name" TEXT,
  "given" TEXT,
  "family" TEXT
)`,
    Address: `CREATE TABLE IF NOT EXISTS "Address" (
  ${pk},
  "resourceId" TEXT NOT NULL,
  "address" TEXT,
  "city" TEXT,
  "country" TEXT,
  "postalCode" TEXT,
  "state" TEXT,
  "use" TEXT
)`,
    ContactPoint: `CREATE TABLE IF NOT EXISTS "ContactPoint" (
  ${pk},
  "resourceId" TEXT NOT NULL,
  "system" TEXT,
  "value" TEXT,
  "use" TEXT
)`,
    Identifier: `CREATE TABLE IF NOT EXISTS "Identifier" (
  ${pk},
  "resourceId" TEXT NOT NULL,
  "system" TEXT,
  "value" TEXT
)`,
  };
}

const LOOKUP_TABLE_INDEXES: Record<string, string[]> = {
  HumanName: [
    'CREATE INDEX IF NOT EXISTS "HumanName_resourceId_idx" ON "HumanName" ("resourceId")',
    'CREATE INDEX IF NOT EXISTS "HumanName_name_idx" ON "HumanName" ("name")',
  ],
  Address: [
    'CREATE INDEX IF NOT EXISTS "Address_resourceId_idx" ON "Address" ("resourceId")',
    'CREATE INDEX IF NOT EXISTS "Address_address_idx" ON "Address" ("address")',
  ],
  ContactPoint: [
    'CREATE INDEX IF NOT EXISTS "ContactPoint_resourceId_idx" ON "ContactPoint" ("resourceId")',
    'CREATE INDEX IF NOT EXISTS "ContactPoint_value_idx" ON "ContactPoint" ("value")',
  ],
  Identifier: [
    'CREATE INDEX IF NOT EXISTS "Identifier_resourceId_idx" ON "Identifier" ("resourceId")',
    'CREATE INDEX IF NOT EXISTS "Identifier_system_value_idx" ON "Identifier" ("system", "value")',
  ],
};

// Column definitions per table (order matters for INSERT)
const LOOKUP_COLUMNS: Record<string, string[]> = {
  HumanName: ['resourceId', 'name', 'given', 'family'],
  Address: ['resourceId', 'address', 'city', 'country', 'postalCode', 'state', 'use'],
  ContactPoint: ['resourceId', 'system', 'value', 'use'],
  Identifier: ['resourceId', 'system', 'value'],
};

// =============================================================================
// Section 2: LookupTableWriter Class
// =============================================================================

export class LookupTableWriter {
  private initialized = false;
  private readonly ddl: Record<string, string>;

  constructor(private readonly adapter: StorageAdapter, dialect: DDLDialect = 'sqlite') {
    this.ddl = buildLookupTableDDL(dialect);
  }

  // ---------------------------------------------------------------------------
  // DDL
  // ---------------------------------------------------------------------------

  /**
   * Create all 4 lookup tables + indexes if they don't exist.
   */
  async ensureTables(): Promise<void> {
    if (this.initialized) return;

    for (const table of Object.keys(this.ddl)) {
      await this.adapter.execute(this.ddl[table]);
      for (const idx of LOOKUP_TABLE_INDEXES[table]) {
        await this.adapter.execute(idx);
      }
    }
    this.initialized = true;
  }

  // ---------------------------------------------------------------------------
  // Write (replace strategy)
  // ---------------------------------------------------------------------------

  /**
   * Write lookup table rows for a resource (replace strategy).
   *
   * 1. Deletes all existing rows for the resourceId across all 4 tables
   * 2. Inserts new rows grouped by table type
   *
   * @param resourceId - The resource ID to index.
   * @param rows - LookupTableRow[] from `buildLookupTableRows()`.
   */
  async writeRows(resourceId: string, rows: LookupTableRow[]): Promise<void> {
    await this.ensureTables();

    // Delete existing rows for this resource across all tables
    await this.deleteRows(resourceId);

    if (rows.length === 0) return;

    // Group rows by table type
    const grouped = new Map<string, LookupTableRow[]>();
    for (const row of rows) {
      const existing = grouped.get(row.table) ?? [];
      existing.push(row);
      grouped.set(row.table, existing);
    }

    // Insert per table type
    for (const [table, tableRows] of grouped) {
      const columns = LOOKUP_COLUMNS[table];
      if (!columns) continue;

      for (const row of tableRows) {
        const values: unknown[] = columns.map(col => row.values[col] ?? null);
        const placeholders = columns.map(() => '?').join(', ');
        const colList = columns.map(c => `"${c}"`).join(', ');
        const sql = `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`;
        await this.adapter.execute(sql, values);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  /**
   * Delete all lookup table rows for a given resourceId.
   */
  async deleteRows(resourceId: string): Promise<void> {
    await this.ensureTables();

    for (const table of Object.keys(this.ddl)) {
      await this.adapter.execute(
        `DELETE FROM "${table}" WHERE "resourceId" = ?`,
        [resourceId],
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Query (for testing / debugging)
  // ---------------------------------------------------------------------------

  /**
   * Get all lookup rows for a given resourceId and table type.
   */
  async getRows<T = Record<string, unknown>>(
    table: string,
    resourceId: string,
  ): Promise<T[]> {
    await this.ensureTables();
    return this.adapter.query<T>(
      `SELECT * FROM "${table}" WHERE "resourceId" = ?`,
      [resourceId],
    );
  }
}
