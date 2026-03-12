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