/**
 * CodeSystem Concept Hierarchy Repository (P5)
 *
 * Manages the `code_system_concept` table for hierarchical concept
 * storage. Supports parent-child relationships, tree queries,
 * and CodeSystem-level cleanup.
 *
 * @module fhir-persistence/conformance
 */

import type { StorageAdapter } from '../db/adapter.js';
import type { DDLDialect } from '../schema/ddl-generator.js';

// =============================================================================
// Section 1: Types
// =============================================================================

export interface ConceptHierarchyEntry {
  id: string;
  codeSystemUrl: string;
  codeSystemVersion?: string;
  code: string;
  display?: string;
  parentCode?: string;
  level: number;
}

// =============================================================================
// Section 2: DDL
// =============================================================================

const TABLE = 'code_system_concept';

const CREATE_TABLE_DDL = `
CREATE TABLE IF NOT EXISTS "${TABLE}" (
  "id"                  TEXT PRIMARY KEY,
  "code_system_url"     TEXT NOT NULL,
  "code_system_version" TEXT,
  "code"                TEXT NOT NULL,
  "display"             TEXT,
  "parent_code"         TEXT,
  "level"               INTEGER DEFAULT 0
);
`;

const CREATE_INDEX_URL = `CREATE INDEX IF NOT EXISTS idx_csc_url ON "${TABLE}"("code_system_url")`;
const CREATE_INDEX_CODE = `CREATE INDEX IF NOT EXISTS idx_csc_code ON "${TABLE}"("code_system_url", "code")`;
const CREATE_INDEX_PARENT = `CREATE INDEX IF NOT EXISTS idx_csc_parent ON "${TABLE}"("code_system_url", "parent_code")`;

// =============================================================================
// Section 3: ConceptHierarchyRepo
// =============================================================================

export class ConceptHierarchyRepo {
  constructor(
    private readonly adapter: StorageAdapter,
    private readonly dialect: DDLDialect = 'sqlite',
  ) { }

  async ensureTable(): Promise<void> {
    await this.adapter.execute(CREATE_TABLE_DDL);
    await this.adapter.execute(CREATE_INDEX_URL);
    await this.adapter.execute(CREATE_INDEX_CODE);
    await this.adapter.execute(CREATE_INDEX_PARENT);
  }

  /** Batch insert hierarchical concept entries. */
  async batchInsert(entries: ConceptHierarchyEntry[]): Promise<number> {
    await this.ensureTable();
    let count = 0;
    const sql = this.dialect === 'postgres'
      ? `INSERT INTO "${TABLE}" ("id", "code_system_url", "code_system_version", "code", "display", "parent_code", "level") VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT ("id") DO UPDATE SET "display" = EXCLUDED."display", "parent_code" = EXCLUDED."parent_code", "level" = EXCLUDED."level"`
      : `INSERT OR REPLACE INTO "${TABLE}" ("id", "code_system_url", "code_system_version", "code", "display", "parent_code", "level") VALUES (?, ?, ?, ?, ?, ?, ?)`;
    for (const e of entries) {
      await this.adapter.execute(sql, [
        e.id, e.codeSystemUrl, e.codeSystemVersion ?? null,
        e.code, e.display ?? null, e.parentCode ?? null, e.level,
      ]);
      count++;
    }
    return count;
  }

  /** Get all concepts for a CodeSystem (tree order by level). */
  async getTree(codeSystemUrl: string): Promise<ConceptHierarchyEntry[]> {
    await this.ensureTable();
    const rows = await this.adapter.query<Record<string, unknown>>(
      `SELECT "id", "code_system_url", "code_system_version", "code", "display", "parent_code", "level" FROM "${TABLE}" WHERE "code_system_url" = ? ORDER BY "level", "code"`,
      [codeSystemUrl],
    );
    return rows.map(r => this.mapRow(r));
  }

  /** Get direct children of a concept. */
  async getChildren(codeSystemUrl: string, parentCode: string): Promise<ConceptHierarchyEntry[]> {
    await this.ensureTable();
    const rows = await this.adapter.query<Record<string, unknown>>(
      `SELECT "id", "code_system_url", "code_system_version", "code", "display", "parent_code", "level" FROM "${TABLE}" WHERE "code_system_url" = ? AND "parent_code" = ? ORDER BY "code"`,
      [codeSystemUrl, parentCode],
    );
    return rows.map(r => this.mapRow(r));
  }

  /** Lookup a single concept by code. */
  async lookup(codeSystemUrl: string, code: string): Promise<ConceptHierarchyEntry | undefined> {
    await this.ensureTable();
    const row = await this.adapter.queryOne<Record<string, unknown>>(
      `SELECT "id", "code_system_url", "code_system_version", "code", "display", "parent_code", "level" FROM "${TABLE}" WHERE "code_system_url" = ? AND "code" = ?`,
      [codeSystemUrl, code],
    );
    return row ? this.mapRow(row) : undefined;
  }

  /** Remove all concepts for a CodeSystem. */
  async removeByCodeSystem(codeSystemUrl: string): Promise<void> {
    await this.ensureTable();
    await this.adapter.execute(`DELETE FROM "${TABLE}" WHERE "code_system_url" = ?`, [codeSystemUrl]);
  }

  private mapRow(r: Record<string, unknown>): ConceptHierarchyEntry {
    return {
      id: r.id as string,
      codeSystemUrl: r.code_system_url as string,
      codeSystemVersion: (r.code_system_version as string | null) ?? undefined,
      code: r.code as string,
      display: (r.display as string | null) ?? undefined,
      parentCode: (r.parent_code as string | null) ?? undefined,
      level: Number(r.level),
    };
  }
}
