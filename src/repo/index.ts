/**
 * Repository module — Public API
 *
 * @module fhir-persistence/repo
 */

// Types
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
  ResourceRow,
  HistoryRow,
  OperationContext,
} from './types.js';
export {
  SCHEMA_VERSION,
  DELETED_SCHEMA_VERSION,
  PLATFORM_RESOURCE_TYPES,
  PROTECTED_RESOURCE_TYPES,
  PROJECT_ADMIN_RESOURCE_TYPES,
} from './types.js';

// Errors
export {
  RepositoryError,
  ResourceNotFoundError,
  ResourceGoneError,
  ResourceVersionConflictError,
} from './errors.js';

// Implementation
export { FhirRepository } from './fhir-repo.js';
export type { TransactionClient } from './fhir-repo.js';

// Builders (for advanced usage / testing)
export {
  buildResourceRow,
  buildResourceRowWithSearch,
  buildDeleteRow,
  buildHistoryRow,
  buildDeleteHistoryRow,
} from './row-builder.js';

// Reference Indexer
export type { ReferenceRow } from './reference-indexer.js';
export { extractReferences } from './reference-indexer.js';

// Row Indexer
export type { SearchColumnValues } from './row-indexer.js';
export {
  buildSearchColumns,
  buildMetadataColumns,
  hashToken,
  extractPropertyPath,
  getNestedValues,
} from './row-indexer.js';

export {
  buildUpsertSQL,
  buildInsertSQL,
  buildSelectByIdSQL,
  buildSelectHistorySQL,
  buildSelectVersionSQL,
  buildInstanceHistorySQL,
  buildTypeHistorySQL,
} from './sql-builder.js';

// History Bundle
export type {
  HistoryBundle,
  HistoryBundleEntry,
  BundleLink,
  BuildHistoryBundleOptions,
} from './history-bundle.js';
export { buildHistoryBundle } from './history-bundle.js';

// Bundle Processor
export type {
  BundleEntry,
  Bundle as PersistenceBundle,
  BundleResponseEntry,
  BundleResponse,
} from './bundle-processor.js';
export { processTransaction, processBatch } from './bundle-processor.js';
