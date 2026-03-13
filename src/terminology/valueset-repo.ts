/**
 * ValueSet Repository
 *
 * Persists FHIR ValueSet resources in `terminology_valuesets`.
 * Each ValueSet is uniquely identified by (url, version).
 *
 * Key design decisions:
 * - Uses StorageAdapter (not DatabaseClient)
 * - `?` placeholders for SQLite compatibility
 * - `INSERT OR REPLACE` for upsert semantics
 * - PRIMARY KEY (url, version) — composite
 * - Content stored as JSON text
 *
 * @module fhir-persistence/terminology
 */

import type { StorageAdapter } from '../db/adapter.js';

// =============================================================================
// Section 1: Types
// =============================================================================

export interface StoredValueSet {
  /** ValueSet canonical URL (e.g., "http://hl7.org/fhir/ValueSet/observation-codes"). */
  url: string;
  /** ValueSet version (e.g., "4.0.1"). */
  version: string;
  /** ValueSet name (human-readable). */
  name: string | null;
  /** Full ValueSet content as JSON string. */
  content: string;
  /** When this record was stored. */
  storedAt: string;
}

export interface ValueSetInput {
  url: string;
  version: string;
  name?: string;
  content: string;
}

// =============================================================================
// Section 2: DDL
// =============================================================================

const VALUESETS_TABLE = 'terminology_valuesets';

const CREATE_VALUESETS_TABLE = `
CREATE TABLE IF NOT EXISTS "${VALUESETS_TABLE}" (
  "url" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "name" TEXT,
  "content" TEXT NOT NULL,
  "storedAt" TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY ("url", "version")
);
`;

// =============================================================================
// Section 3: ValueSetRepo
// =============================================================================

export class ValueSetRepo {
  constructor(private readonly adapter: StorageAdapter) {}

  /**
   * Ensure the terminology_valuesets table exists.
   */
  async ensureTable(): Promise<void> {
    await this.adapter.execute(CREATE_VALUESETS_TABLE);
  }

  /**
   * Insert or update a ValueSet.
   * If a ValueSet with the same (url, version) exists, it is replaced.
   */
  async upsert(input: ValueSetInput): Promise<void> {
    await this.ensureTable();
    await this.adapter.execute(
      `INSERT OR REPLACE INTO "${VALUESETS_TABLE}" ("url", "version", "name", "content") VALUES (?, ?, ?, ?)`,
      [input.url, input.version, input.name ?? null, input.content],
    );
  }

  /**
   * Get a specific ValueSet by url and version.
   *
   * @returns The stored ValueSet, or undefined if not found.
   */
  async getValueSet(url: string, version: string): Promise<StoredValueSet | undefined> {
    await this.ensureTable();
    return this.adapter.queryOne<StoredValueSet>(
      `SELECT "url", "version", "name", "content", "storedAt" FROM "${VALUESETS_TABLE}" WHERE "url" = ? AND "version" = ?`,
      [url, version],
    );
  }

  /**
   * Get all versions of a ValueSet by URL.
   *
   * @returns Array of stored ValueSets, ordered by version.
   */
  async getByUrl(url: string): Promise<StoredValueSet[]> {
    await this.ensureTable();
    return this.adapter.query<StoredValueSet>(
      `SELECT "url", "version", "name", "content", "storedAt" FROM "${VALUESETS_TABLE}" WHERE "url" = ? ORDER BY "version"`,
      [url],
    );
  }

  /**
   * Get all stored ValueSets.
   */
  async getAll(): Promise<StoredValueSet[]> {
    await this.ensureTable();
    return this.adapter.query<StoredValueSet>(
      `SELECT "url", "version", "name", "content", "storedAt" FROM "${VALUESETS_TABLE}" ORDER BY "url", "version"`,
    );
  }

  /**
   * Remove a specific ValueSet by url and version.
   */
  async remove(url: string, version: string): Promise<void> {
    await this.ensureTable();
    await this.adapter.execute(
      `DELETE FROM "${VALUESETS_TABLE}" WHERE "url" = ? AND "version" = ?`,
      [url, version],
    );
  }

  /**
   * Get the total number of stored ValueSets.
   */
  async getValueSetCount(): Promise<number> {
    await this.ensureTable();
    const row = await this.adapter.queryOne<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM "${VALUESETS_TABLE}"`,
    );
    return row?.cnt ?? 0;
  }

  /**
   * Remove all stored ValueSets.
   */
  async clear(): Promise<void> {
    await this.ensureTable();
    await this.adapter.execute(`DELETE FROM "${VALUESETS_TABLE}"`);
  }
}
