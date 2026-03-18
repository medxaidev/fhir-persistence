/**
 * IG Resource Map Repository (P1)
 *
 * Manages the `ig_resource_map` table which tracks which FHIR resources
 * belong to which Implementation Guide. Supports batch insertion,
 * grouped queries, and IG-level cleanup.
 *
 * @module fhir-persistence/conformance
 */

import type { StorageAdapter } from '../db/adapter.js';
import type { DDLDialect } from '../schema/ddl-generator.js';

// =============================================================================
// Section 1: Types
// =============================================================================

export interface IGResourceMapEntry {
  igId: string;
  resourceType: string;
  resourceId: string;
  resourceUrl?: string;
  resourceName?: string;
  baseType?: string;
}

export interface IGIndex {
  profiles: IGResourceMapEntry[];
  extensions: IGResourceMapEntry[];
  valueSets: IGResourceMapEntry[];
  codeSystems: IGResourceMapEntry[];
  searchParameters: IGResourceMapEntry[];
}

// =============================================================================
// Section 2: DDL
// =============================================================================

const TABLE = 'ig_resource_map';

const CREATE_TABLE_DDL = `
CREATE TABLE IF NOT EXISTS "${TABLE}" (
  "ig_id"           TEXT NOT NULL,
  "resource_type"   TEXT NOT NULL,
  "resource_id"     TEXT NOT NULL,
  "resource_url"    TEXT,
  "resource_name"   TEXT,
  "base_type"       TEXT,
  PRIMARY KEY ("ig_id", "resource_type", "resource_id")
);
`;

const CREATE_INDEX_IG = `CREATE INDEX IF NOT EXISTS idx_ig_resource_map_ig ON "${TABLE}"("ig_id")`;
const CREATE_INDEX_TYPE = `CREATE INDEX IF NOT EXISTS idx_ig_resource_map_type ON "${TABLE}"("ig_id", "resource_type")`;

// =============================================================================
// Section 3: IGResourceMapRepo
// =============================================================================

export class IGResourceMapRepo {
  constructor(
    private readonly adapter: StorageAdapter,
    private readonly dialect: DDLDialect = 'sqlite',
  ) { }

  async ensureTable(): Promise<void> {
    await this.adapter.execute(CREATE_TABLE_DDL);
    await this.adapter.execute(CREATE_INDEX_IG);
    await this.adapter.execute(CREATE_INDEX_TYPE);
  }

  /** Batch insert resource map entries for an IG. */
  async batchInsert(igId: string, entries: Omit<IGResourceMapEntry, 'igId'>[]): Promise<number> {
    await this.ensureTable();
    let count = 0;
    const sql = this.dialect === 'postgres'
      ? `INSERT INTO "${TABLE}" ("ig_id", "resource_type", "resource_id", "resource_url", "resource_name", "base_type") VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT ("ig_id", "resource_type", "resource_id") DO UPDATE SET "resource_url" = EXCLUDED."resource_url", "resource_name" = EXCLUDED."resource_name", "base_type" = EXCLUDED."base_type"`
      : `INSERT OR REPLACE INTO "${TABLE}" ("ig_id", "resource_type", "resource_id", "resource_url", "resource_name", "base_type") VALUES (?, ?, ?, ?, ?, ?)`;
    for (const e of entries) {
      await this.adapter.execute(sql, [
        igId, e.resourceType, e.resourceId,
        e.resourceUrl ?? null, e.resourceName ?? null, e.baseType ?? null,
      ]);
      count++;
    }
    return count;
  }

  /** Get grouped IG index. */
  async getIGIndex(igId: string): Promise<IGIndex> {
    await this.ensureTable();
    const rows = await this.adapter.query<{
      ig_id: string; resource_type: string; resource_id: string;
      resource_url: string | null; resource_name: string | null; base_type: string | null;
    }>(
      `SELECT "ig_id", "resource_type", "resource_id", "resource_url", "resource_name", "base_type" FROM "${TABLE}" WHERE "ig_id" = ? ORDER BY "resource_type", "resource_id"`,
      [igId],
    );

    const index: IGIndex = {
      profiles: [], extensions: [], valueSets: [], codeSystems: [], searchParameters: [],
    };

    for (const r of rows) {
      const entry: IGResourceMapEntry = {
        igId: r.ig_id,
        resourceType: r.resource_type,
        resourceId: r.resource_id,
        resourceUrl: r.resource_url ?? undefined,
        resourceName: r.resource_name ?? undefined,
        baseType: r.base_type ?? undefined,
      };
      switch (r.resource_type) {
        case 'StructureDefinition':
          if (r.base_type === 'Extension') {
            index.extensions.push(entry);
          } else {
            index.profiles.push(entry);
          }
          break;
        case 'ValueSet':
          index.valueSets.push(entry);
          break;
        case 'CodeSystem':
          index.codeSystems.push(entry);
          break;
        case 'SearchParameter':
          index.searchParameters.push(entry);
          break;
        default:
          // Other resource types are not grouped
          break;
      }
    }

    return index;
  }

  /** Get resources of a specific type within an IG. */
  async getByType(igId: string, resourceType: string): Promise<IGResourceMapEntry[]> {
    await this.ensureTable();
    const rows = await this.adapter.query<{
      ig_id: string; resource_type: string; resource_id: string;
      resource_url: string | null; resource_name: string | null; base_type: string | null;
    }>(
      `SELECT "ig_id", "resource_type", "resource_id", "resource_url", "resource_name", "base_type" FROM "${TABLE}" WHERE "ig_id" = ? AND "resource_type" = ? ORDER BY "resource_id"`,
      [igId, resourceType],
    );
    return rows.map(r => ({
      igId: r.ig_id,
      resourceType: r.resource_type,
      resourceId: r.resource_id,
      resourceUrl: r.resource_url ?? undefined,
      resourceName: r.resource_name ?? undefined,
      baseType: r.base_type ?? undefined,
    }));
  }

  /** Remove all resource mappings for an IG. */
  async removeIG(igId: string): Promise<void> {
    await this.ensureTable();
    await this.adapter.execute(`DELETE FROM "${TABLE}" WHERE "ig_id" = ?`, [igId]);
  }
}
