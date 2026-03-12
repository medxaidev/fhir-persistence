/**
 * Search module — Public API
 *
 * @module fhir-persistence/search
 */

// Types
export type {
  SearchPrefix,
  SearchModifier,
  ParsedSearchParam,
  SortRule,
  IncludeTarget,
  SearchRequest,
  WhereFragment,
  SearchSQL,
  CountSQL,
} from './types.js';
export {
  SEARCH_PREFIXES,
  PREFIX_TYPES,
  DEFAULT_SEARCH_COUNT,
  MAX_SEARCH_COUNT,
} from './types.js';

// Parser
export {
  parseSearchRequest,
  parseParamKey,
  splitSearchValues,
  extractPrefix,
  parseSortParam,
  parseIncludeValue,
} from './param-parser.js';

// WHERE Builder
export {
  prefixToOperator,
  buildWhereFragment,
  buildWhereClause,
} from './where-builder.js';

// Search SQL Builder
export {
  buildSearchSQL,
  buildCountSQL,
} from './search-sql-builder.js';

// Search Bundle Builder
export type {
  SearchBundle,
  SearchBundleEntry,
  BuildSearchBundleOptions,
} from './search-bundle.js';
export { buildSearchBundle } from './search-bundle.js';

// Pagination
export type { PaginationContext } from './pagination.js';
export {
  buildSelfLink,
  buildNextLink,
  hasNextPage,
  buildPaginationContext,
} from './pagination.js';

// Search Executor
export type { SearchOptions, SearchResult } from './search-executor.js';
export { executeSearch, mapRowsToResources } from './search-executor.js';
