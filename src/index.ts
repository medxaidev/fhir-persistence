/**
 * `@medxai/fhir-persistence` — Public API
 *
 * Provides schema generation from FHIR StructureDefinitions and
 * SearchParameters to PostgreSQL DDL. No database dependency —
 * all functions are pure and fully unit-testable.
 *
 * @packageDocumentation
 */

// ─── Schema Types ────────────────────────────────────────────────────────────
export type {
  SqlColumnType,
  ColumnSchema,
  IndexSchema,
  ConstraintSchema,
  MainTableSchema,
  HistoryTableSchema,
  ReferencesTableSchema,
  ResourceTableSet,
  SchemaDefinition,
} from './schema/index.js';

// ─── Registry ────────────────────────────────────────────────────────────────
export { StructureDefinitionRegistry } from './registry/index.js';
export { SearchParameterRegistry } from './registry/index.js';
export type {
  SearchParamType,
  SearchStrategy,
  SearchColumnType,
  SearchParameterImpl,
  SearchParameterResource,
  SearchParameterBundle,
} from './registry/index.js';

// ─── Schema Builder ──────────────────────────────────────────────────────────
export {
  buildResourceTableSet,
  buildAllResourceTableSets,
  buildSchemaDefinition,
} from './schema/table-schema-builder.js';

// ─── DDL Generator ───────────────────────────────────────────────────────────
export {
  generateCreateMainTable,
  generateCreateHistoryTable,
  generateCreateReferencesTable,
  generateCreateIndex,
  generateResourceDDL,
  generateSchemaDDL,
  generateSchemaDDLString,
} from './schema/ddl-generator.js';

// ─── Database ───────────────────────────────────────────────────────────────
export type { DatabaseConfig } from './db/index.js';
export { loadDatabaseConfig } from './db/index.js';
export { DatabaseClient } from './db/index.js';

// ─── Repository ─────────────────────────────────────────────────────────────
export type {
  FhirResource,
  FhirMeta,
  PersistedResource,
  ResourceRepository,
  CreateResourceOptions,
  UpdateResourceOptions,
  HistoryOptions,
  HistoryEntry,
  SearchOptions,
  SearchResult,
  HistoryBundle,
  HistoryBundleEntry,
  BuildHistoryBundleOptions,
  OperationContext,
} from './repo/index.js';
export {
  SCHEMA_VERSION,
  DELETED_SCHEMA_VERSION,
  PLATFORM_RESOURCE_TYPES,
  PROTECTED_RESOURCE_TYPES,
  PROJECT_ADMIN_RESOURCE_TYPES,
} from './repo/index.js';
export {
  RepositoryError,
  ResourceNotFoundError,
  ResourceGoneError,
  ResourceVersionConflictError,
} from './repo/index.js';
export { FhirRepository } from './repo/index.js';
export { buildHistoryBundle } from './repo/index.js';
export type { SearchColumnValues } from './repo/index.js';
export {
  buildSearchColumns,
  buildResourceRowWithSearch,
  hashToken,
  extractPropertyPath,
  getNestedValues,
} from './repo/index.js';

// ─── Search ─────────────────────────────────────────────────────────────────
export type {
  SearchPrefix,
  SearchModifier,
  ParsedSearchParam,
  SortRule,
  SearchRequest,
  WhereFragment,
  SearchSQL,
  CountSQL,
  SearchBundle,
  SearchBundleEntry,
  BuildSearchBundleOptions,
  PaginationContext,
} from './search/index.js';
export {
  SEARCH_PREFIXES,
  PREFIX_TYPES,
  DEFAULT_SEARCH_COUNT,
  MAX_SEARCH_COUNT,
  parseSearchRequest,
  parseParamKey,
  splitSearchValues,
  extractPrefix,
  parseSortParam,
  prefixToOperator,
  buildWhereFragment,
  buildWhereClause,
  buildSearchSQL,
  buildCountSQL,
  buildSearchBundle,
  buildSelfLink,
  buildNextLink,
  hasNextPage,
  buildPaginationContext,
  executeSearch,
  mapRowsToResources,
} from './search/index.js';

// ─── Bundle Processor ────────────────────────────────────────────────────────
export type {
  BundleEntry,
  PersistenceBundle,
  BundleResponseEntry,
  BundleResponse,
} from './repo/index.js';
export { processTransaction, processBatch } from './repo/index.js';

// ─── Migrations ─────────────────────────────────────────────────────────────
export { MigrationRunner } from './migrations/index.js';
export type {
  Migration,
  MigrationRecord,
  MigrationResult,
  MigrationStatus,
} from './migrations/index.js';

// ─── v2: Storage Adapter ────────────────────────────────────────────────────
export type { StorageAdapter, TransactionContext } from './db/adapter.js';
export { SQLiteAdapter } from './db/sqlite-adapter.js';

// ─── v2: FhirStore (basic CRUD) ─────────────────────────────────────────────
export { FhirStore } from './store/fhir-store.js';

// ─── v2: FhirPersistence (end-to-end facade with indexing) ──────────────────
export { FhirPersistence } from './store/fhir-persistence.js';
export type {
  FhirPersistenceOptions,
} from './store/fhir-persistence.js';

// ─── v2: Indexing Pipeline ──────────────────────────────────────────────────
export { IndexingPipeline } from './repo/indexing-pipeline.js';
export type {
  IndexResult,
  IndexingPipelineOptions,
} from './repo/indexing-pipeline.js';

// ─── v2: Lookup Table Writer ────────────────────────────────────────────────
export { LookupTableWriter } from './repo/lookup-table-writer.js';

// ─── v2: Reference Indexer ──────────────────────────────────────────────────
export type { ReferenceRowV2 } from './repo/reference-indexer.js';
export { extractReferencesV2 } from './repo/reference-indexer.js';

// ─── v2: Lookup Table Rows ──────────────────────────────────────────────────
export type { LookupTableRow } from './repo/row-indexer.js';
export { buildLookupTableRows } from './repo/row-indexer.js';

// ─── v2: SQL Builders ──────────────────────────────────────────────────────
export {
  buildInsertMainSQLv2,
  buildUpdateMainSQLv2,
  buildInsertHistorySQLv2,
  buildSelectByIdSQLv2,
  buildSelectVersionSQLv2,
  buildDeleteReferencesSQLv2,
  buildInsertReferencesSQLv2,
  buildInstanceHistorySQLv2,
  buildTypeHistorySQLv2,
} from './repo/sql-builder.js';

// ─── v2: Migration Engine ───────────────────────────────────────────────────
export type { SchemaDelta, DeltaKind } from './migration/schema-diff.js';
export { compareSchemas } from './migration/schema-diff.js';
export type { GeneratedMigration } from './migration/migration-generator.js';
export { generateMigration } from './migration/migration-generator.js';
export { PackageRegistryRepo } from './registry/package-registry-repo.js';
export { IGPersistenceManager } from './migration/ig-persistence-manager.js';
export { ReindexScheduler } from './migration/reindex-scheduler.js';

// ─── v2: Terminology ────────────────────────────────────────────────────────
export { TerminologyCodeRepo } from './terminology/terminology-code-repo.js';
export { ValueSetRepo } from './terminology/valueset-repo.js';

// ─── v2: Platform IG ────────────────────────────────────────────────────────
export { PLATFORM_SEARCH_PARAMETERS, PLATFORM_PACKAGE_NAME, PLATFORM_PACKAGE_VERSION } from './platform/platform-ig-definitions.js';
export { buildPlatformTableSets, initializePlatformIG } from './platform/platform-ig-loader.js';

// ─── v2: Production Hardening ───────────────────────────────────────────────
export { ResourceCacheV2 } from './cache/resource-cache.js';
export { SearchLogger } from './observability/search-logger.js';
export { reindexResourceTypeV2, reindexAllV2 } from './cli/reindex.js';