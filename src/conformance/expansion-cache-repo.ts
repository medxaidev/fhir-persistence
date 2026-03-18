/**
 * ValueSet Expansion Cache Repository (P4)
 *
 * Manages the `value_set_expansion` table for caching ValueSet expansion
 * results. Supports upsert, lookup, invalidation, and bulk clear.
 *
 * @module fhir-persistence/conformance
 */

import type { StorageAdapter } from '../db/adapter.js';
import type { DDLDialect } from '../schema/ddl-generator.js';

// =============================================================================
// Section 1: Types
// =============================================================================

export interface CachedExpansion {
  valuesetUrl: string;
  version: string;
  expandedAt: string;
  codeCount: number;
  expansionJson: string;
}

// =============================================================================
// Section 2: DDL
// =============================================================================

const TABLE = 'value_set_expansion';

function createTableDDL(dialect: DDLDialect): string {
  const ts = dialect === 'postgres'
    ? 'TIMESTAMPTZ DEFAULT NOW()'
    : "TEXT DEFAULT (datetime('now'))";
  const jsonType = dialect === 'postgres' ? 'JSONB NOT NULL' : 'TEXT NOT NULL';
  return `
CREATE TABLE IF NOT EXISTS "${TABLE}" (
  "valueset_url"    TEXT NOT NULL,
  "version"         TEXT NOT NULL DEFAULT '',
  "expanded_at"     ${ts},
  "code_count"      INTEGER,
  "expansion_json"  ${jsonType},
  PRIMARY KEY ("valueset_url", "version")
);
`;
}

// =============================================================================
// Section 3: ExpansionCacheRepo
// =============================================================================

export class ExpansionCacheRepo {
  constructor(
    private readonly adapter: StorageAdapter,
    private readonly dialect: DDLDialect = 'sqlite',
  ) {}

  async ensureTable(): Promise<void> {
    await this.adapter.execute(createTableDDL(this.dialect));
  }

  /** Write or update an expansion cache entry. */
  async upsert(url: string, version: string, expansionJson: string, codeCount: number): Promise<void> {
    await this.ensureTable();
    const sql = this.dialect === 'postgres'
      ? `INSERT INTO "${TABLE}" ("valueset_url", "version", "expansion_json", "code_count") VALUES (?, ?, ?, ?) ON CONFLICT ("valueset_url", "version") DO UPDATE SET "expansion_json" = EXCLUDED."expansion_json", "code_count" = EXCLUDED."code_count", "expanded_at" = NOW()`
      : `INSERT OR REPLACE INTO "${TABLE}" ("valueset_url", "version", "expansion_json", "code_count") VALUES (?, ?, ?, ?)`;
    await this.adapter.execute(sql, [url, version, expansionJson, codeCount]);
  }

  /** Get a cached expansion by URL and version. */
  async get(url: string, version: string): Promise<CachedExpansion | undefined> {
    await this.ensureTable();
    const row = await this.adapter.queryOne<{
      valueset_url: string; version: string; expanded_at: string;
      code_count: number; expansion_json: string;
    }>(
      `SELECT "valueset_url", "version", "expanded_at", "code_count", "expansion_json" FROM "${TABLE}" WHERE "valueset_url" = ? AND "version" = ?`,
      [url, version],
    );
    if (!row) return undefined;
    return {
      valuesetUrl: row.valueset_url,
      version: row.version,
      expandedAt: row.expanded_at,
      codeCount: row.code_count,
      expansionJson: row.expansion_json,
    };
  }

  /** Invalidate a specific expansion cache entry. */
  async invalidate(url: string, version: string): Promise<void> {
    await this.ensureTable();
    await this.adapter.execute(
      `DELETE FROM "${TABLE}" WHERE "valueset_url" = ? AND "version" = ?`,
      [url, version],
    );
  }

  /** Clear all expansion caches. */
  async clear(): Promise<void> {
    await this.ensureTable();
    await this.adapter.execute(`DELETE FROM "${TABLE}"`);
  }
}
