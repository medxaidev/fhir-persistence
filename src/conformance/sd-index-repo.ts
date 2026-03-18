/**
 * StructureDefinition Index Repository (P2)
 *
 * Manages the `structure_definition_index` table for fast SD queries
 * by type, kind, base definition, etc.
 *
 * @module fhir-persistence/conformance
 */

import type { StorageAdapter } from '../db/adapter.js';
import type { DDLDialect } from '../schema/ddl-generator.js';

// =============================================================================
// Section 1: Types
// =============================================================================

export interface SDIndexEntry {
  id: string;
  url?: string;
  version?: string;
  type?: string;
  kind?: string;
  baseDefinition?: string;
  derivation?: string;
  snapshotHash?: string;
}

// =============================================================================
// Section 2: DDL
// =============================================================================

const TABLE = 'structure_definition_index';

const CREATE_TABLE_DDL = `
CREATE TABLE IF NOT EXISTS "${TABLE}" (
  "id"               TEXT PRIMARY KEY,
  "url"              TEXT,
  "version"          TEXT,
  "type"             TEXT,
  "kind"             TEXT,
  "base_definition"  TEXT,
  "derivation"       TEXT,
  "snapshot_hash"    TEXT
);
`;

const CREATE_INDEX_TYPE = `CREATE INDEX IF NOT EXISTS idx_sdi_type ON "${TABLE}"("type")`;
const CREATE_INDEX_KIND = `CREATE INDEX IF NOT EXISTS idx_sdi_kind ON "${TABLE}"("kind")`;
const CREATE_INDEX_BASE = `CREATE INDEX IF NOT EXISTS idx_sdi_base ON "${TABLE}"("base_definition")`;

// =============================================================================
// Section 3: SDIndexRepo
// =============================================================================

export class SDIndexRepo {
  constructor(
    private readonly adapter: StorageAdapter,
    private readonly dialect: DDLDialect = 'sqlite',
  ) { }

  async ensureTable(): Promise<void> {
    await this.adapter.execute(CREATE_TABLE_DDL);
    await this.adapter.execute(CREATE_INDEX_TYPE);
    await this.adapter.execute(CREATE_INDEX_KIND);
    await this.adapter.execute(CREATE_INDEX_BASE);
  }

  async upsert(entry: SDIndexEntry): Promise<void> {
    await this.ensureTable();
    const sql = this.dialect === 'postgres'
      ? `INSERT INTO "${TABLE}" ("id", "url", "version", "type", "kind", "base_definition", "derivation", "snapshot_hash") VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT ("id") DO UPDATE SET "url" = EXCLUDED."url", "version" = EXCLUDED."version", "type" = EXCLUDED."type", "kind" = EXCLUDED."kind", "base_definition" = EXCLUDED."base_definition", "derivation" = EXCLUDED."derivation", "snapshot_hash" = EXCLUDED."snapshot_hash"`
      : `INSERT OR REPLACE INTO "${TABLE}" ("id", "url", "version", "type", "kind", "base_definition", "derivation", "snapshot_hash") VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    await this.adapter.execute(sql, [
      entry.id, entry.url ?? null, entry.version ?? null, entry.type ?? null,
      entry.kind ?? null, entry.baseDefinition ?? null, entry.derivation ?? null,
      entry.snapshotHash ?? null,
    ]);
  }

  async batchUpsert(entries: SDIndexEntry[]): Promise<number> {
    let count = 0;
    for (const entry of entries) {
      await this.upsert(entry);
      count++;
    }
    return count;
  }

  async getById(id: string): Promise<SDIndexEntry | undefined> {
    await this.ensureTable();
    const row = await this.adapter.queryOne<{
      id: string; url: string | null; version: string | null; type: string | null;
      kind: string | null; base_definition: string | null; derivation: string | null;
      snapshot_hash: string | null;
    }>(
      `SELECT "id", "url", "version", "type", "kind", "base_definition", "derivation", "snapshot_hash" FROM "${TABLE}" WHERE "id" = ?`,
      [id],
    );
    return row ? this.mapRow(row) : undefined;
  }

  async getByUrl(url: string): Promise<SDIndexEntry[]> {
    await this.ensureTable();
    const rows = await this.adapter.query<{
      id: string; url: string | null; version: string | null; type: string | null;
      kind: string | null; base_definition: string | null; derivation: string | null;
      snapshot_hash: string | null;
    }>(
      `SELECT "id", "url", "version", "type", "kind", "base_definition", "derivation", "snapshot_hash" FROM "${TABLE}" WHERE "url" = ? ORDER BY "version"`,
      [url],
    );
    return rows.map(r => this.mapRow(r));
  }

  async getByType(type: string): Promise<SDIndexEntry[]> {
    await this.ensureTable();
    const rows = await this.adapter.query<{
      id: string; url: string | null; version: string | null; type: string | null;
      kind: string | null; base_definition: string | null; derivation: string | null;
      snapshot_hash: string | null;
    }>(
      `SELECT "id", "url", "version", "type", "kind", "base_definition", "derivation", "snapshot_hash" FROM "${TABLE}" WHERE "type" = ? ORDER BY "id"`,
      [type],
    );
    return rows.map(r => this.mapRow(r));
  }

  async getByBaseDefinition(baseUrl: string): Promise<SDIndexEntry[]> {
    await this.ensureTable();
    const rows = await this.adapter.query<{
      id: string; url: string | null; version: string | null; type: string | null;
      kind: string | null; base_definition: string | null; derivation: string | null;
      snapshot_hash: string | null;
    }>(
      `SELECT "id", "url", "version", "type", "kind", "base_definition", "derivation", "snapshot_hash" FROM "${TABLE}" WHERE "base_definition" = ? ORDER BY "id"`,
      [baseUrl],
    );
    return rows.map(r => this.mapRow(r));
  }

  async remove(id: string): Promise<void> {
    await this.ensureTable();
    await this.adapter.execute(`DELETE FROM "${TABLE}" WHERE "id" = ?`, [id]);
  }

  private mapRow(r: {
    id: string; url: string | null; version: string | null; type: string | null;
    kind: string | null; base_definition: string | null; derivation: string | null;
    snapshot_hash: string | null;
  }): SDIndexEntry {
    return {
      id: r.id,
      url: r.url ?? undefined,
      version: r.version ?? undefined,
      type: r.type ?? undefined,
      kind: r.kind ?? undefined,
      baseDefinition: r.base_definition ?? undefined,
      derivation: r.derivation ?? undefined,
      snapshotHash: r.snapshot_hash ?? undefined,
    };
  }
}
