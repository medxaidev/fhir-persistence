/**
 * Element Index Repository (P3)
 *
 * Manages the `structure_element_index` table for fast element-level
 * queries across StructureDefinitions. Supports batch insertion,
 * path-based search, and SD-level cleanup.
 *
 * @module fhir-persistence/conformance
 */

import type { StorageAdapter } from '../db/adapter.js';
import type { DDLDialect } from '../schema/ddl-generator.js';

// =============================================================================
// Section 1: Types
// =============================================================================

export interface ElementIndexEntry {
  id: string;
  structureId: string;
  path: string;
  min?: number;
  max?: string;
  typeCodes?: string[];
  isSlice?: boolean;
  sliceName?: string;
  isExtension?: boolean;
  bindingValueSet?: string;
  mustSupport?: boolean;
}

// =============================================================================
// Section 2: DDL
// =============================================================================

const TABLE = 'structure_element_index';

function createTableDDL(dialect: DDLDialect): string {
  if (dialect === 'postgres') {
    return `
CREATE TABLE IF NOT EXISTS "${TABLE}" (
  "id"                TEXT PRIMARY KEY,
  "structure_id"      TEXT NOT NULL,
  "path"              TEXT NOT NULL,
  "min"               INTEGER,
  "max"               TEXT,
  "type_codes"        JSONB,
  "is_slice"          BOOLEAN DEFAULT FALSE,
  "slice_name"        TEXT,
  "is_extension"      BOOLEAN DEFAULT FALSE,
  "binding_value_set" TEXT,
  "must_support"      BOOLEAN DEFAULT FALSE
);
`;
  }
  return `
CREATE TABLE IF NOT EXISTS "${TABLE}" (
  "id"                TEXT PRIMARY KEY,
  "structure_id"      TEXT NOT NULL,
  "path"              TEXT NOT NULL,
  "min"               INTEGER,
  "max"               TEXT,
  "type_codes"        TEXT,
  "is_slice"          INTEGER DEFAULT 0,
  "slice_name"        TEXT,
  "is_extension"      INTEGER DEFAULT 0,
  "binding_value_set" TEXT,
  "must_support"      INTEGER DEFAULT 0
);
`;
}

const CREATE_INDEX_STRUCTURE = `CREATE INDEX IF NOT EXISTS idx_sei_structure ON "${TABLE}"("structure_id")`;
const CREATE_INDEX_PATH = `CREATE INDEX IF NOT EXISTS idx_sei_path ON "${TABLE}"("path")`;
const CREATE_INDEX_SLICE = `CREATE INDEX IF NOT EXISTS idx_sei_slice ON "${TABLE}"("structure_id", "is_slice")`;

// =============================================================================
// Section 3: ElementIndexRepo
// =============================================================================

export class ElementIndexRepo {
  constructor(
    private readonly adapter: StorageAdapter,
    private readonly dialect: DDLDialect = 'sqlite',
  ) { }

  async ensureTable(): Promise<void> {
    await this.adapter.execute(createTableDDL(this.dialect));
    await this.adapter.execute(CREATE_INDEX_STRUCTURE);
    await this.adapter.execute(CREATE_INDEX_PATH);
    await this.adapter.execute(CREATE_INDEX_SLICE);
  }

  /** Batch insert element index entries for a StructureDefinition. */
  async batchInsert(structureId: string, elements: Omit<ElementIndexEntry, 'structureId'>[]): Promise<number> {
    await this.ensureTable();
    let count = 0;
    const sql = this.dialect === 'postgres'
      ? `INSERT INTO "${TABLE}" ("id", "structure_id", "path", "min", "max", "type_codes", "is_slice", "slice_name", "is_extension", "binding_value_set", "must_support") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT ("id") DO UPDATE SET "path" = EXCLUDED."path", "min" = EXCLUDED."min", "max" = EXCLUDED."max", "type_codes" = EXCLUDED."type_codes", "is_slice" = EXCLUDED."is_slice", "slice_name" = EXCLUDED."slice_name", "is_extension" = EXCLUDED."is_extension", "binding_value_set" = EXCLUDED."binding_value_set", "must_support" = EXCLUDED."must_support"`
      : `INSERT OR REPLACE INTO "${TABLE}" ("id", "structure_id", "path", "min", "max", "type_codes", "is_slice", "slice_name", "is_extension", "binding_value_set", "must_support") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    for (const e of elements) {
      const typeCodes = e.typeCodes
        ? (this.dialect === 'postgres' ? JSON.stringify(e.typeCodes) : JSON.stringify(e.typeCodes))
        : null;
      const isSlice = this.dialect === 'postgres' ? (e.isSlice ?? false) : (e.isSlice ? 1 : 0);
      const isExtension = this.dialect === 'postgres' ? (e.isExtension ?? false) : (e.isExtension ? 1 : 0);
      const mustSupport = this.dialect === 'postgres' ? (e.mustSupport ?? false) : (e.mustSupport ? 1 : 0);
      await this.adapter.execute(sql, [
        e.id, structureId, e.path, e.min ?? null, e.max ?? null,
        typeCodes, isSlice, e.sliceName ?? null, isExtension,
        e.bindingValueSet ?? null, mustSupport,
      ]);
      count++;
    }
    return count;
  }

  /** Get all elements for a StructureDefinition. */
  async getByStructureId(structureId: string): Promise<ElementIndexEntry[]> {
    await this.ensureTable();
    const rows = await this.adapter.query<Record<string, unknown>>(
      `SELECT "id", "structure_id", "path", "min", "max", "type_codes", "is_slice", "slice_name", "is_extension", "binding_value_set", "must_support" FROM "${TABLE}" WHERE "structure_id" = ? ORDER BY "id"`,
      [structureId],
    );
    return rows.map(r => this.mapRow(r));
  }

  /** Search elements by path pattern (LIKE). */
  async searchByPath(pathPattern: string): Promise<ElementIndexEntry[]> {
    await this.ensureTable();
    const rows = await this.adapter.query<Record<string, unknown>>(
      `SELECT "id", "structure_id", "path", "min", "max", "type_codes", "is_slice", "slice_name", "is_extension", "binding_value_set", "must_support" FROM "${TABLE}" WHERE "path" LIKE ? ORDER BY "structure_id", "path"`,
      [pathPattern],
    );
    return rows.map(r => this.mapRow(r));
  }

  /** Remove all element indexes for a StructureDefinition. */
  async removeByStructureId(structureId: string): Promise<void> {
    await this.ensureTable();
    await this.adapter.execute(`DELETE FROM "${TABLE}" WHERE "structure_id" = ?`, [structureId]);
  }

  private mapRow(r: Record<string, unknown>): ElementIndexEntry {
    const typeCodes = r.type_codes
      ? (typeof r.type_codes === 'string' ? JSON.parse(r.type_codes) : r.type_codes)
      : undefined;
    return {
      id: r.id as string,
      structureId: r.structure_id as string,
      path: r.path as string,
      min: r.min != null ? Number(r.min) : undefined,
      max: r.max as string | undefined ?? undefined,
      typeCodes,
      isSlice: Boolean(r.is_slice),
      sliceName: (r.slice_name as string | null) ?? undefined,
      isExtension: Boolean(r.is_extension),
      bindingValueSet: (r.binding_value_set as string | null) ?? undefined,
      mustSupport: Boolean(r.must_support),
    };
  }
}
