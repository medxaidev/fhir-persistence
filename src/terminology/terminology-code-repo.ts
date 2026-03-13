/**
 * Terminology Code Repository
 *
 * Persists CodeSystem codes as a display cache in `terminology_codes`.
 * Provides fast lookup by (system, code) and by code alone.
 *
 * Key design decisions:
 * - Uses StorageAdapter (not DatabaseClient)
 * - `?` placeholders for SQLite compatibility
 * - `INSERT OR IGNORE` for idempotent batch inserts
 * - PRIMARY KEY (system, code) — composite
 * - INDEX (code) for lookupByCode without system
 *
 * @module fhir-persistence/terminology
 */

import type { StorageAdapter } from '../db/adapter.js';

// =============================================================================
// Section 1: Types
// =============================================================================

export interface TerminologyCode {
  /** Code system URI (e.g., "http://loinc.org"). */
  system: string;
  /** Code value (e.g., "8480-6"). */
  code: string;
  /** Human-readable display text. */
  display: string;
}

// =============================================================================
// Section 2: DDL
// =============================================================================

const CODES_TABLE = 'terminology_codes';

const CREATE_CODES_TABLE = `
CREATE TABLE IF NOT EXISTS "${CODES_TABLE}" (
  "system" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "display" TEXT NOT NULL,
  PRIMARY KEY ("system", "code")
);
`;

const CREATE_CODE_INDEX = `
CREATE INDEX IF NOT EXISTS "terminology_codes_code_idx" ON "${CODES_TABLE}" ("code");
`;

// =============================================================================
// Section 3: TerminologyCodeRepo
// =============================================================================

export class TerminologyCodeRepo {
  constructor(private readonly adapter: StorageAdapter) {}

  /**
   * Ensure the terminology_codes table and indexes exist.
   */
  async ensureTable(): Promise<void> {
    await this.adapter.execute(CREATE_CODES_TABLE);
    await this.adapter.execute(CREATE_CODE_INDEX);
  }

  /**
   * Batch insert codes. Duplicates are silently ignored (INSERT OR IGNORE).
   *
   * @param codes - Array of codes to insert.
   * @returns Number of codes actually inserted (excluding duplicates).
   */
  async batchInsert(codes: TerminologyCode[]): Promise<number> {
    if (codes.length === 0) return 0;

    await this.ensureTable();

    let inserted = 0;
    // Process in chunks of 100 to avoid SQLite variable limits
    const chunkSize = 100;
    for (let i = 0; i < codes.length; i += chunkSize) {
      const chunk = codes.slice(i, i + chunkSize);
      const result = await this.adapter.transaction((tx) => {
        let count = 0;
        for (const c of chunk) {
          const r = tx.execute(
            `INSERT OR IGNORE INTO "${CODES_TABLE}" ("system", "code", "display") VALUES (?, ?, ?)`,
            [c.system, c.code, c.display],
          );
          count += r.changes;
        }
        return count;
      });
      inserted += result;
    }

    return inserted;
  }

  /**
   * Lookup display text for a specific (system, code) pair.
   *
   * @returns Display text, or undefined if not found.
   */
  async lookup(system: string, code: string): Promise<string | undefined> {
    await this.ensureTable();
    const row = await this.adapter.queryOne<{ display: string }>(
      `SELECT "display" FROM "${CODES_TABLE}" WHERE "system" = ? AND "code" = ?`,
      [system, code],
    );
    return row?.display;
  }

  /**
   * Lookup all codes matching a code value (any system).
   * Useful for code-only search without specifying system.
   *
   * @returns Array of matching TerminologyCode entries.
   */
  async lookupByCode(code: string): Promise<TerminologyCode[]> {
    await this.ensureTable();
    return this.adapter.query<TerminologyCode>(
      `SELECT "system", "code", "display" FROM "${CODES_TABLE}" WHERE "code" = ?`,
      [code],
    );
  }

  /**
   * Get the total number of codes in the table.
   */
  async getCodeCount(): Promise<number> {
    await this.ensureTable();
    const row = await this.adapter.queryOne<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM "${CODES_TABLE}"`,
    );
    return row?.cnt ?? 0;
  }

  /**
   * Remove all codes from the table.
   */
  async clear(): Promise<void> {
    await this.ensureTable();
    await this.adapter.execute(`DELETE FROM "${CODES_TABLE}"`);
  }
}
