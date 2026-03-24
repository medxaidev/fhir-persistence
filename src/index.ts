/**
 * `fhir-persistence` — Embedded FHIR R4 Persistence Layer
 *
 * Provides CRUD, search, indexing, schema migration, and terminology
 * for FHIR R4 resources over SQLite (sql.js / better-sqlite3) and PostgreSQL.
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
export type { CanonicalProfile } from './registry/index.js';
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
  buildSearchBundle,
  buildSelfLink,
  buildNextLink,
  hasNextPage,
  buildPaginationContext,
  executeSearchV2 as executeSearch,
  mapRowsToResourcesV2 as mapRowsToResources,
} from './search/index.js';

// ─── Storage Adapter ────────────────────────────────────────────────────────
export type { StorageAdapter, TransactionContext } from './db/adapter.js';
export { BetterSqlite3Adapter } from './db/better-sqlite3-adapter.js';
export type { BetterSqlite3Options } from './db/better-sqlite3-adapter.js';
export { PostgresAdapter } from './db/postgres-adapter.js';

// ─── SQL Dialect ────────────────────────────────────────────────────────────
export type { SqlDialect } from './db/dialect.js';
export { SQLiteDialect } from './db/sqlite-dialect.js';
export { PostgresDialect } from './db/postgres-dialect.js';

// ─── FhirStore (basic CRUD) ─────────────────────────────────────────────────
export { FhirStore } from './store/fhir-store.js';
export type {
  UpdateResourceResult as StoreUpdateResourceResult,
  UpdateResourceOptions as StoreUpdateResourceOptions,
} from './store/fhir-store.js';

// ─── FhirPersistence (end-to-end facade with indexing) ──────────────────────
export { FhirPersistence } from './store/fhir-persistence.js';
export type {
  FhirPersistenceOptions,
  CreateResourceOptions as PersistenceCreateResourceOptions,
  CreateResourceResult,
  UpdateResourceOptions as PersistenceUpdateResourceOptions,
  UpdateResourceResult,
} from './store/fhir-persistence.js';

// ─── Conditional Service (PERS-03/04) ───────────────────────────────────────
export { ConditionalService } from './store/conditional-service.js';
export type {
  ConditionalCreateResult,
  ConditionalUpdateResult,
  ConditionalDeleteResult,
} from './store/conditional-service.js';

// ─── Transaction / Batch Bundle (PERS-05) ───────────────────────────────────
export { processTransactionV2, processBatchV2 } from './transaction/bundle-processor.js';
export type {
  Bundle,
  BundleEntry,
  BundleResponse,
  BundleResponseEntry,
} from './transaction/bundle-processor.js';
export { buildUrnMap, deepResolveUrns } from './transaction/urn-resolver.js';
export type { UrnTarget } from './transaction/urn-resolver.js';

// ─── Indexing Pipeline ──────────────────────────────────────────────────────
export { IndexingPipeline } from './repo/indexing-pipeline.js';
export type { IndexResult, IndexingPipelineOptions } from './repo/indexing-pipeline.js';

// ─── Lookup Table Writer ────────────────────────────────────────────────────
export { LookupTableWriter } from './repo/lookup-table-writer.js';

// ─── Reference Indexer ──────────────────────────────────────────────────────
export type { ReferenceRowV2 } from './repo/reference-indexer.js';
export { extractReferencesV2 } from './repo/reference-indexer.js';

// ─── Lookup Table Rows ──────────────────────────────────────────────────────
export type { LookupTableRow } from './repo/row-indexer.js';
export { buildLookupTableRows } from './repo/row-indexer.js';

// ─── SQL Builders ──────────────────────────────────────────────────────────
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

// ─── Migration Engine ───────────────────────────────────────────────────────
export type { SchemaDelta, DeltaKind } from './migration/schema-diff.js';
export { compareSchemas } from './migration/schema-diff.js';
export type { GeneratedMigration } from './migration/migration-generator.js';
export { generateMigration } from './migration/migration-generator.js';
export { PackageRegistryRepo } from './registry/package-registry-repo.js';
export { IGPersistenceManager } from './migration/ig-persistence-manager.js';
export { ReindexScheduler } from './migration/reindex-scheduler.js';
export { MigrationRunnerV2 } from './migrations/index.js';
export type { MigrationV2, MigrationResultV2 } from './migrations/index.js';

// ─── Terminology ────────────────────────────────────────────────────────────
export { TerminologyCodeRepo } from './terminology/terminology-code-repo.js';
export { ValueSetRepo } from './terminology/valueset-repo.js';

// ─── Platform IG ────────────────────────────────────────────────────────────
export { PLATFORM_SEARCH_PARAMETERS, PLATFORM_PACKAGE_NAME, PLATFORM_PACKAGE_VERSION } from './platform/platform-ig-definitions.js';
export { buildPlatformTableSets, initializePlatformIG } from './platform/platform-ig-loader.js';

// ─── Search Enhancement ────────────────────────────────────────────────────
export { buildWhereFragmentV2, buildWhereClauseV2 } from './search/where-builder.js';
export { buildSearchSQLv2, buildCountSQLv2, buildTwoPhaseSearchSQLv2 } from './search/search-sql-builder.js';
export type { TwoPhaseSearchSQL } from './search/search-sql-builder.js';
export type { SearchPlan, SearchPlannerOptions } from './search/search-planner.js';
export { planSearch } from './search/search-planner.js';

// ─── Production Hardening ───────────────────────────────────────────────────
export { ResourceCacheV2 } from './cache/resource-cache.js';
export { SearchLogger } from './observability/search-logger.js';
export { reindexResourceTypeV2, reindexAllV2 } from './cli/reindex.js';

// ─── FhirSystem (startup orchestrator for fhir-engine) ──────────────────────
export { FhirSystem } from './startup/fhir-system.js';
export type { FhirSystemOptions, FhirSystemReady } from './startup/fhir-system.js';

// ─── Provider bridges (for fhir-engine integration) ─────────────────────────
export { FhirDefinitionBridge } from './providers/fhir-definition-provider.js';
export { FhirRuntimeProvider, createFhirRuntimeProvider } from './providers/fhir-runtime-provider.js';
export type { FhirRuntimeProviderOptions } from './providers/fhir-runtime-provider.js';

// ─── Conformance Module (IG resource management) ────────────────────────────
export { IGResourceMapRepo } from './conformance/ig-resource-map-repo.js';
export { SDIndexRepo } from './conformance/sd-index-repo.js';
export { ElementIndexRepo } from './conformance/element-index-repo.js';
export { ExpansionCacheRepo } from './conformance/expansion-cache-repo.js';
export { ConceptHierarchyRepo } from './conformance/concept-hierarchy-repo.js';
export { SearchParamIndexRepo } from './conformance/search-param-index-repo.js';
export { IGImportOrchestrator } from './conformance/ig-import-orchestrator.js';
export type {
  IGResourceMapEntry, IGIndex, SDIndexEntry, ElementIndexEntry,
  CachedExpansion, ConceptHierarchyEntry, SearchParamIndexEntry,
  IGImportOptions, IGImportResult,
} from './conformance/index.js';