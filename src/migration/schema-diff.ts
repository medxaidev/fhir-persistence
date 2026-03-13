/**
 * Schema Diff — v2
 *
 * Compares old vs new ResourceTableSet[] to produce SchemaDelta[].
 * Used by IGPersistenceManager to detect what changed when an IG
 * package is upgraded.
 *
 * Key design decisions:
 * - Compares by column name + type (not by position)
 * - Compares indexes by name
 * - Detects SP expression changes for reindex scheduling
 * - Works from in-memory schema objects (no DB introspection)
 *
 * @module fhir-persistence/migration
 */

import type {
  ResourceTableSet,
  ColumnSchema,
  IndexSchema,
  SearchParamMeta,
} from '../schema/table-schema.js';

// =============================================================================
// Section 1: Delta Types
// =============================================================================

export type DeltaKind =
  | 'ADD_TABLE'
  | 'DROP_TABLE'
  | 'ADD_COLUMN'
  | 'DROP_COLUMN'
  | 'ALTER_COLUMN'
  | 'ADD_INDEX'
  | 'DROP_INDEX'
  | 'REINDEX';

export interface SchemaDelta {
  /** The type of schema change. */
  kind: DeltaKind;
  /** The resource type affected (e.g., "Patient"). */
  resourceType: string;
  /** The table name affected (e.g., "Patient", "Patient_History"). */
  tableName: string;
  /** Column details (for ADD_COLUMN, DROP_COLUMN, ALTER_COLUMN). */
  column?: ColumnSchema;
  /** Previous column details (for ALTER_COLUMN). */
  oldColumn?: ColumnSchema;
  /** Index details (for ADD_INDEX, DROP_INDEX). */
  index?: IndexSchema;
  /** Search parameter details (for REINDEX). */
  searchParam?: SearchParamMeta;
  /** The full ResourceTableSet (for ADD_TABLE). */
  tableSet?: ResourceTableSet;
}

// =============================================================================
// Section 2: Compare Function
// =============================================================================

/**
 * Compare two sets of ResourceTableSets and produce a list of deltas.
 *
 * @param oldSets - The previously installed schema (from PackageRegistry).
 * @param newSets - The newly generated schema (from current IG).
 * @returns Array of SchemaDelta describing all changes.
 */
export function compareSchemas(
  oldSets: ResourceTableSet[],
  newSets: ResourceTableSet[],
): SchemaDelta[] {
  const deltas: SchemaDelta[] = [];

  const oldMap = new Map<string, ResourceTableSet>();
  for (const ts of oldSets) {
    oldMap.set(ts.resourceType, ts);
  }

  const newMap = new Map<string, ResourceTableSet>();
  for (const ts of newSets) {
    newMap.set(ts.resourceType, ts);
  }

  // Detect new tables (ADD_TABLE)
  for (const [rt, newTs] of newMap) {
    if (!oldMap.has(rt)) {
      deltas.push({
        kind: 'ADD_TABLE',
        resourceType: rt,
        tableName: rt,
        tableSet: newTs,
      });
    }
  }

  // Detect removed tables (DROP_TABLE)
  for (const [rt] of oldMap) {
    if (!newMap.has(rt)) {
      deltas.push({
        kind: 'DROP_TABLE',
        resourceType: rt,
        tableName: rt,
      });
    }
  }

  // Detect column/index changes for tables that exist in both
  for (const [rt, newTs] of newMap) {
    const oldTs = oldMap.get(rt);
    if (!oldTs) continue;

    // Compare main table columns
    const colDeltas = compareColumns(rt, newTs.main.tableName, oldTs.main.columns, newTs.main.columns);
    deltas.push(...colDeltas);

    // Compare main table indexes
    const idxDeltas = compareIndexes(rt, newTs.main.tableName, oldTs.main.indexes, newTs.main.indexes);
    deltas.push(...idxDeltas);

    // Compare search param expressions for REINDEX detection
    const reindexDeltas = compareSearchParams(rt, newTs.main.tableName, oldTs.searchParams ?? [], newTs.searchParams ?? []);
    deltas.push(...reindexDeltas);
  }

  return deltas;
}

// =============================================================================
// Section 3: Column Comparison
// =============================================================================

function compareColumns(
  resourceType: string,
  tableName: string,
  oldCols: ColumnSchema[],
  newCols: ColumnSchema[],
): SchemaDelta[] {
  const deltas: SchemaDelta[] = [];

  const oldByName = new Map<string, ColumnSchema>();
  for (const col of oldCols) {
    oldByName.set(col.name, col);
  }

  const newByName = new Map<string, ColumnSchema>();
  for (const col of newCols) {
    newByName.set(col.name, col);
  }

  // New columns
  for (const [name, col] of newByName) {
    if (!oldByName.has(name)) {
      deltas.push({ kind: 'ADD_COLUMN', resourceType, tableName, column: col });
    }
  }

  // Removed columns
  for (const [name, col] of oldByName) {
    if (!newByName.has(name)) {
      deltas.push({ kind: 'DROP_COLUMN', resourceType, tableName, column: col });
    }
  }

  // Changed columns (type changed)
  for (const [name, newCol] of newByName) {
    const oldCol = oldByName.get(name);
    if (oldCol && oldCol.type !== newCol.type) {
      deltas.push({ kind: 'ALTER_COLUMN', resourceType, tableName, column: newCol, oldColumn: oldCol });
    }
  }

  return deltas;
}

// =============================================================================
// Section 4: Index Comparison
// =============================================================================

function compareIndexes(
  resourceType: string,
  tableName: string,
  oldIdxs: IndexSchema[],
  newIdxs: IndexSchema[],
): SchemaDelta[] {
  const deltas: SchemaDelta[] = [];

  const oldByName = new Map<string, IndexSchema>();
  for (const idx of oldIdxs) {
    oldByName.set(idx.name, idx);
  }

  const newByName = new Map<string, IndexSchema>();
  for (const idx of newIdxs) {
    newByName.set(idx.name, idx);
  }

  // New indexes
  for (const [name, idx] of newByName) {
    if (!oldByName.has(name)) {
      deltas.push({ kind: 'ADD_INDEX', resourceType, tableName, index: idx });
    }
  }

  // Removed indexes
  for (const [name, idx] of oldByName) {
    if (!newByName.has(name)) {
      deltas.push({ kind: 'DROP_INDEX', resourceType, tableName, index: idx });
    }
  }

  return deltas;
}

// =============================================================================
// Section 5: Search Param Expression Comparison (REINDEX detection)
// =============================================================================

function compareSearchParams(
  resourceType: string,
  tableName: string,
  oldParams: SearchParamMeta[],
  newParams: SearchParamMeta[],
): SchemaDelta[] {
  const deltas: SchemaDelta[] = [];

  const oldByCode = new Map<string, SearchParamMeta>();
  for (const sp of oldParams) {
    oldByCode.set(sp.code, sp);
  }

  for (const newSp of newParams) {
    const oldSp = oldByCode.get(newSp.code);
    if (oldSp && oldSp.expression !== newSp.expression) {
      deltas.push({
        kind: 'REINDEX',
        resourceType,
        tableName,
        searchParam: newSp,
      });
    }
  }

  return deltas;
}
