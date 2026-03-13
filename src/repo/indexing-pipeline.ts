/**
 * Indexing Pipeline — v2
 *
 * Unified orchestrator that combines three indexing concerns into
 * a single `indexResource()` call:
 *
 * 1. **Search columns** — Extract values from resource JSON via
 *    `buildSearchColumns()` and merge into the main table row.
 * 2. **References** — Extract outgoing references via
 *    `extractReferencesV2()` and write to `{RT}_References` table.
 * 3. **Lookup tables** — Extract HumanName/Address/ContactPoint/Identifier
 *    rows via `buildLookupTableRows()` and write to global lookup tables.
 *
 * Design decisions:
 * - Accepts SearchParameterImpl[] (resolved by caller from registry)
 * - All writes use StorageAdapter v2 (? placeholders)
 * - Replace strategy for references and lookup rows (delete + insert)
 * - Search columns are returned (not written) — caller merges into main row
 * - Pipeline is stateless; dependencies injected via constructor
 *
 * @module fhir-persistence/repo
 */

import type { StorageAdapter } from '../db/adapter.js';
import type { SearchParameterImpl } from '../registry/search-parameter-registry.js';
import type { FhirResource } from './types.js';
import type { SearchColumnValues, LookupTableRow } from './row-indexer.js';
import { buildSearchColumns, buildLookupTableRows } from './row-indexer.js';
import type { ReferenceRowV2 } from './reference-indexer.js';
import { extractReferencesV2 } from './reference-indexer.js';
import { buildDeleteReferencesSQLv2, buildInsertReferencesSQLv2 } from './sql-builder.js';
import { LookupTableWriter } from './lookup-table-writer.js';
import type { RuntimeProvider } from '../providers/runtime-provider.js';
import type { SearchParameterDef } from '../providers/definition-provider.js';

// =============================================================================
// Section 1: Types
// =============================================================================

/**
 * Result of indexing a single resource.
 */
export interface IndexResult {
  /** Search column values to merge into the main table row. */
  searchColumns: SearchColumnValues;
  /** Reference rows written to {RT}_References table. */
  referenceCount: number;
  /** Lookup table rows written to global lookup tables. */
  lookupRowCount: number;
}

/**
 * Options for the indexing pipeline.
 */
export interface IndexingPipelineOptions {
  /** Enable lookup table writes (default: true). */
  enableLookupTables?: boolean;
  /** Enable reference indexing (default: true). */
  enableReferences?: boolean;
  /** Optional RuntimeProvider for FHIRPath-driven extraction (B3). */
  runtimeProvider?: RuntimeProvider;
}

// =============================================================================
// Section 2: IndexingPipeline Class
// =============================================================================

export class IndexingPipeline {
  private readonly lookupWriter: LookupTableWriter;
  private readonly options: Required<Omit<IndexingPipelineOptions, 'runtimeProvider'>>;
  private readonly runtimeProvider: RuntimeProvider | undefined;

  constructor(
    private readonly adapter: StorageAdapter,
    options?: IndexingPipelineOptions,
  ) {
    this.lookupWriter = new LookupTableWriter(adapter);
    this.runtimeProvider = options?.runtimeProvider;
    this.options = {
      enableLookupTables: options?.enableLookupTables ?? true,
      enableReferences: options?.enableReferences ?? true,
    };
  }

  // ---------------------------------------------------------------------------
  // Core: Index a single resource
  // ---------------------------------------------------------------------------

  /**
   * Index a resource: extract search columns, write references, write lookup rows.
   *
   * @param resourceType - The FHIR resource type (e.g., "Patient").
   * @param resource - The FHIR resource (must have `id`).
   * @param impls - SearchParameterImpl list for this resource type.
   * @returns IndexResult with search columns and write counts.
   */
  async indexResource(
    resourceType: string,
    resource: FhirResource,
    impls: SearchParameterImpl[],
  ): Promise<IndexResult> {
    const resourceId = resource.id;
    if (!resourceId) {
      return { searchColumns: {}, referenceCount: 0, lookupRowCount: 0 };
    }

    // 1. Extract search column values (returned, not written)
    const searchColumns = this.runtimeProvider
      ? this.extractViaRuntime(resource, impls)
      : buildSearchColumns(resource, impls);

    // 2. Write references (replace strategy)
    let referenceCount = 0;
    if (this.options.enableReferences) {
      referenceCount = await this.writeReferences(resourceType, resource, impls);
    }

    // 3. Write lookup table rows (replace strategy)
    let lookupRowCount = 0;
    if (this.options.enableLookupTables) {
      lookupRowCount = await this.writeLookupRows(resource, impls);
    }

    return { searchColumns, referenceCount, lookupRowCount };
  }

  // ---------------------------------------------------------------------------
  // Delete all index data for a resource
  // ---------------------------------------------------------------------------

  /**
   * Remove all index data for a deleted resource.
   *
   * @param resourceType - The FHIR resource type.
   * @param resourceId - The resource ID.
   */
  async deleteIndex(resourceType: string, resourceId: string): Promise<void> {
    // Delete references
    if (this.options.enableReferences) {
      const delSQL = buildDeleteReferencesSQLv2(`${resourceType}_References`);
      await this.adapter.execute(delSQL, [resourceId]);
    }

    // Delete lookup rows
    if (this.options.enableLookupTables) {
      await this.lookupWriter.deleteRows(resourceId);
    }
  }

  // ---------------------------------------------------------------------------
  // Search columns only (no side effects)
  // ---------------------------------------------------------------------------

  /**
   * Extract search column values without writing references or lookup rows.
   * Useful for re-indexing or testing.
   */
  extractSearchColumns(
    resource: FhirResource,
    impls: SearchParameterImpl[],
  ): SearchColumnValues {
    return this.runtimeProvider
      ? this.extractViaRuntime(resource, impls)
      : buildSearchColumns(resource, impls);
  }

  /**
   * Extract reference rows without writing them.
   * Useful for re-indexing or testing.
   */
  extractReferences(
    resource: FhirResource,
    impls: SearchParameterImpl[],
  ): ReferenceRowV2[] {
    return this.runtimeProvider
      ? this.extractRefsViaRuntime(resource, impls)
      : extractReferencesV2(resource, impls);
  }

  /**
   * Extract lookup table rows without writing them.
   * Useful for re-indexing or testing.
   */
  extractLookupRows(
    resource: FhirResource,
    impls: SearchParameterImpl[],
  ): LookupTableRow[] {
    if (!resource.id) return [];
    return buildLookupTableRows(resource as FhirResource & { id: string }, impls);
  }

  // ---------------------------------------------------------------------------
  // Access to inner LookupTableWriter
  // ---------------------------------------------------------------------------

  /**
   * Get the underlying LookupTableWriter for direct access.
   */
  getLookupWriter(): LookupTableWriter {
    return this.lookupWriter;
  }

  // ---------------------------------------------------------------------------
  // Private: Write references
  // ---------------------------------------------------------------------------

  private async writeReferences(
    resourceType: string,
    resource: FhirResource,
    impls: SearchParameterImpl[],
  ): Promise<number> {
    const resourceId = resource.id!;
    const tableName = `${resourceType}_References`;

    // Delete existing references
    const delSQL = buildDeleteReferencesSQLv2(tableName);
    await this.adapter.execute(delSQL, [resourceId]);

    // Extract new references (prefer RuntimeProvider if available)
    const refs = this.runtimeProvider
      ? this.extractRefsViaRuntime(resource, impls)
      : extractReferencesV2(resource, impls);
    if (refs.length === 0) return 0;

    // Insert new references
    const insertSQL = buildInsertReferencesSQLv2(tableName, refs.length);
    const values: unknown[] = [];
    for (const ref of refs) {
      values.push(ref.resourceId, ref.targetType, ref.targetId, ref.code, ref.referenceRaw);
    }
    await this.adapter.execute(insertSQL, values);

    return refs.length;
  }

  // ---------------------------------------------------------------------------
  // Private: Write lookup rows
  // ---------------------------------------------------------------------------

  private async writeLookupRows(
    resource: FhirResource,
    impls: SearchParameterImpl[],
  ): Promise<number> {
    const resourceId = resource.id!;
    const rows = buildLookupTableRows(resource as FhirResource & { id: string }, impls);
    await this.lookupWriter.writeRows(resourceId, rows);
    return rows.length;
  }

  // ---------------------------------------------------------------------------
  // Private: RuntimeProvider-based extraction (B3)
  // ---------------------------------------------------------------------------

  /**
   * Convert SearchParameterImpl[] to SearchParameterDef[] for RuntimeProvider.
   */
  private implsToDefs(impls: SearchParameterImpl[]): SearchParameterDef[] {
    return impls.map(impl => ({
      resourceType: 'SearchParameter' as const,
      code: impl.code,
      type: impl.type,
      base: impl.resourceTypes,
      expression: impl.expression,
    }));
  }

  /**
   * Extract search column values via RuntimeProvider.
   */
  private extractViaRuntime(
    resource: FhirResource,
    impls: SearchParameterImpl[],
  ): SearchColumnValues {
    const defs = this.implsToDefs(impls);
    const raw = this.runtimeProvider!.extractSearchValues(
      resource as Record<string, unknown>,
      defs,
    );

    // Map RuntimeProvider output to SearchColumnValues keyed by columnName
    const columns: SearchColumnValues = {};
    for (const impl of impls) {
      const values = raw[impl.code];
      if (!values || values.length === 0) continue;

      // Map to the correct DDL column names per strategy
      switch (impl.strategy) {
        case 'column':
          columns[impl.columnName] = values.length === 1 ? values[0] : values;
          break;
        case 'token-column': {
          // v2 DDL: __<name> TEXT (JSON array), __<name>Sort TEXT
          columns[`__${impl.columnName}`] = JSON.stringify(values);
          // Sort column — first token value as display text
          const sortVal = typeof values[0] === 'string' ? values[0] : String(values[0]);
          columns[`__${impl.columnName}Sort`] = sortVal;
          break;
        }
        case 'lookup-table':
          // v2 DDL: __<name>Sort TEXT
          if (typeof values[0] === 'string') {
            columns[`__${impl.columnName}Sort`] = values[0];
          }
          break;
      }
    }

    return columns;
  }

  /**
   * Extract references via RuntimeProvider → ReferenceRowV2[].
   */
  private extractRefsViaRuntime(
    resource: FhirResource,
    impls: SearchParameterImpl[],
  ): ReferenceRowV2[] {
    const resourceId = resource.id;
    if (!resourceId) return [];

    const refDefs = this.implsToDefs(impls.filter(i => i.type === 'reference'));
    const extracted = this.runtimeProvider!.extractReferences(
      resource as Record<string, unknown>,
      refDefs,
    );

    return extracted.map(ref => ({
      resourceId,
      targetType: ref.targetType,
      targetId: ref.targetId,
      code: ref.code,
      referenceRaw: ref.reference,
    }));
  }
}
