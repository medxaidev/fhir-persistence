/**
 * SearchParameter Index Repository (B1)
 *
 * Manages the `search_parameter_index` table for tracking which
 * SearchParameters are defined within an IG.
 *
 * @module fhir-persistence/conformance
 */

import type { StorageAdapter } from '../db/adapter.js';
import type { DDLDialect } from '../schema/ddl-generator.js';

// =============================================================================
// Section 1: Types
// =============================================================================

export interface SearchParamIndexEntry {
  id: string;
  igId: string;
  url?: string;
  code: string;
  type: string;
  base: string[];
  expression?: string;
}

// =============================================================================
// Section 2: DDL
// =============================================================================

const TABLE = 'search_parameter_index';

function createTableDDL(dialect: DDLDialect): string {
  const baseType = dialect === 'postgres' ? 'JSONB' : 'TEXT';
  return `
CREATE TABLE IF NOT EXISTS "${TABLE}" (
  "id"          TEXT PRIMARY KEY,
  "ig_id"       TEXT NOT NULL,
  "url"         TEXT,
  "code"        TEXT NOT NULL,
  "type"        TEXT NOT NULL,
  "base"        ${baseType},
  "expression"  TEXT
);
`;
}

const CREATE_INDEX_IG = `CREATE INDEX IF NOT EXISTS idx_spi_ig ON "${TABLE}"("ig_id")`;
const CREATE_INDEX_CODE = `CREATE INDEX IF NOT EXISTS idx_spi_code ON "${TABLE}"("code")`;

// =============================================================================
// Section 3: SearchParamIndexRepo
// =============================================================================

export class SearchParamIndexRepo {
  constructor(
    private readonly adapter: StorageAdapter,
    private readonly dialect: DDLDialect = 'sqlite',
  ) { }

  async ensureTable(): Promise<void> {
    await this.adapter.execute(createTableDDL(this.dialect));
    await this.adapter.execute(CREATE_INDEX_IG);
    await this.adapter.execute(CREATE_INDEX_CODE);
  }

  async upsert(entry: SearchParamIndexEntry): Promise<void> {
    await this.ensureTable();
    const baseJson = JSON.stringify(entry.base);
    const sql = this.dialect === 'postgres'
      ? `INSERT INTO "${TABLE}" ("id", "ig_id", "url", "code", "type", "base", "expression") VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT ("id") DO UPDATE SET "url" = EXCLUDED."url", "code" = EXCLUDED."code", "type" = EXCLUDED."type", "base" = EXCLUDED."base", "expression" = EXCLUDED."expression"`
      : `INSERT OR REPLACE INTO "${TABLE}" ("id", "ig_id", "url", "code", "type", "base", "expression") VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await this.adapter.execute(sql, [
      entry.id, entry.igId, entry.url ?? null, entry.code,
      entry.type, baseJson, entry.expression ?? null,
    ]);
  }

  async batchUpsert(entries: SearchParamIndexEntry[]): Promise<number> {
    let count = 0;
    for (const entry of entries) {
      await this.upsert(entry);
      count++;
    }
    return count;
  }

  async getByIG(igId: string): Promise<SearchParamIndexEntry[]> {
    await this.ensureTable();
    const rows = await this.adapter.query<Record<string, unknown>>(
      `SELECT "id", "ig_id", "url", "code", "type", "base", "expression" FROM "${TABLE}" WHERE "ig_id" = ? ORDER BY "code"`,
      [igId],
    );
    return rows.map(r => this.mapRow(r));
  }

  async getByCode(code: string): Promise<SearchParamIndexEntry[]> {
    await this.ensureTable();
    const rows = await this.adapter.query<Record<string, unknown>>(
      `SELECT "id", "ig_id", "url", "code", "type", "base", "expression" FROM "${TABLE}" WHERE "code" = ? ORDER BY "ig_id"`,
      [code],
    );
    return rows.map(r => this.mapRow(r));
  }

  async remove(id: string): Promise<void> {
    await this.ensureTable();
    await this.adapter.execute(`DELETE FROM "${TABLE}" WHERE "id" = ?`, [id]);
  }

  async removeByIG(igId: string): Promise<void> {
    await this.ensureTable();
    await this.adapter.execute(`DELETE FROM "${TABLE}" WHERE "ig_id" = ?`, [igId]);
  }

  private mapRow(r: Record<string, unknown>): SearchParamIndexEntry {
    const base = r.base
      ? (typeof r.base === 'string' ? JSON.parse(r.base) : r.base)
      : [];
    return {
      id: r.id as string,
      igId: r.ig_id as string,
      url: (r.url as string | null) ?? undefined,
      code: r.code as string,
      type: r.type as string,
      base,
      expression: (r.expression as string | null) ?? undefined,
    };
  }
}
