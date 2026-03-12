/**
 * Search Types
 *
 * Defines the data structures for FHIR search request parsing
 * and SQL WHERE clause generation.
 *
 * ## FHIR Search Semantics
 *
 * - Multiple values for the same parameter → OR (comma-separated)
 * - Multiple different parameters → AND (separate query params)
 * - Prefixes (eq, ne, lt, gt, le, ge) → comparison operators
 * - Modifiers (:exact, :contains, :missing, :not) → behavior modifiers
 *
 * Reference: https://hl7.org/fhir/R4/search.html
 *
 * @module fhir-persistence/search
 */

// =============================================================================
// Section 1: Search Prefix
// =============================================================================

/**
 * FHIR search prefix for number, date, and quantity parameters.
 *
 * See: https://hl7.org/fhir/R4/search.html#prefix
 */
export type SearchPrefix = 'eq' | 'ne' | 'lt' | 'gt' | 'le' | 'ge' | 'sa' | 'eb' | 'ap';

/**
 * All valid search prefixes.
 */
export const SEARCH_PREFIXES: ReadonlySet<string> = new Set<SearchPrefix>([
  'eq', 'ne', 'lt', 'gt', 'le', 'ge', 'sa', 'eb', 'ap',
]);

/**
 * FHIR search parameter types that support prefixes.
 */
export const PREFIX_TYPES: ReadonlySet<string> = new Set(['number', 'date', 'quantity']);

// =============================================================================
// Section 2: Search Modifier
// =============================================================================

/**
 * FHIR search modifier.
 *
 * See: https://hl7.org/fhir/R4/search.html#modifiers
 */
export type SearchModifier =
  | 'exact'
  | 'contains'
  | 'missing'
  | 'not'
  | 'text'
  | 'above'
  | 'below'
  | 'in'
  | 'not-in'
  | 'of-type';

// =============================================================================
// Section 3: Parsed Search Parameter
// =============================================================================

/**
 * A single parsed search parameter from a FHIR search URL.
 *
 * Examples:
 * - `?gender=male`           → `{ code: "gender", values: ["male"] }`
 * - `?gender=male,female`    → `{ code: "gender", values: ["male", "female"] }`
 * - `?birthdate=ge1990-01-01`→ `{ code: "birthdate", prefix: "ge", values: ["1990-01-01"] }`
 * - `?name:exact=Smith`      → `{ code: "name", modifier: "exact", values: ["Smith"] }`
 */
export interface ParsedSearchParam {
  /** The search parameter code (e.g., `"gender"`, `"birthdate"`). */
  code: string;

  /** Optional modifier (e.g., `"exact"`, `"contains"`, `"missing"`). */
  modifier?: SearchModifier;

  /** Optional prefix for number/date/quantity (e.g., `"ge"`, `"lt"`). */
  prefix?: SearchPrefix;

  /**
   * The search values (OR semantics within a single parameter).
   * Comma-separated values in the URL are split into this array.
   */
  values: string[];

  /**
   * Chained search info (single-level).
   *
   * Present when the param uses chained syntax:
   * `subject:Patient.name=Smith` →
   *   code = "subject", chain = { targetType: "Patient", targetParam: "name" }
   */
  chain?: ChainedSearchTarget;
}

/**
 * Target information for a chained search parameter.
 *
 * Example: `subject:Patient.name=Smith`
 * - `targetType` = `"Patient"`
 * - `targetParam` = `"name"`
 */
export interface ChainedSearchTarget {
  /** The target resource type (e.g., `"Patient"`). */
  targetType: string;
  /** The search parameter on the target resource (e.g., `"name"`). */
  targetParam: string;
}

// =============================================================================
// Section 4: Sort Rule
// =============================================================================

/**
 * A single sort rule from the `_sort` parameter.
 *
 * Examples:
 * - `_sort=birthdate`  → `{ code: "birthdate", descending: false }`
 * - `_sort=-birthdate` → `{ code: "birthdate", descending: true }`
 */
export interface SortRule {
  /** The search parameter code to sort by. */
  code: string;

  /** Whether to sort in descending order. */
  descending: boolean;
}

// =============================================================================
// Section 5: Include Target
// =============================================================================

/**
 * A parsed `_include` or `_revinclude` target.
 *
 * Syntax: `{sourceType}:{searchParam}` or `{sourceType}:{searchParam}:{targetType}`
 *
 * Examples:
 * - `_include=MedicationRequest:patient` → `{ resourceType: "MedicationRequest", searchParam: "patient" }`
 * - `_include=Observation:subject:Patient` → `{ resourceType: "Observation", searchParam: "subject", targetType: "Patient" }`
 */
export interface IncludeTarget {
  /** Source resource type (e.g., "MedicationRequest"). */
  resourceType: string;
  /** Search parameter code (e.g., "patient", "subject"). */
  searchParam: string;
  /** Optional target type filter (e.g., "Patient"). */
  targetType?: string;
  /**
   * If true, this is an `_include:iterate` — recursively include
   * resources referenced by included resources (max depth 3, with cycle detection).
   */
  iterate?: boolean;
  /**
   * If true, this is a wildcard `_include=*` — include ALL referenced resources.
   */
  wildcard?: boolean;
}

// =============================================================================
// Section 6: Search Request
// =============================================================================

/**
 * A fully parsed FHIR search request.
 *
 * Produced by `parseSearchRequest()` from a URL query string.
 * Consumed by `buildSearchSQL()` to generate a SQL query.
 */
export interface SearchRequest {
  /** The FHIR resource type to search. */
  resourceType: string;

  /** Parsed search parameters (AND semantics between parameters). */
  params: ParsedSearchParam[];

  /**
   * Maximum number of results to return.
   * Corresponds to `_count`. Default: 20.
   */
  count?: number;

  /**
   * Offset for pagination.
   * Corresponds to `_offset`.
   */
  offset?: number;

  /**
   * Sort rules.
   * Corresponds to `_sort`.
   */
  sort?: SortRule[];

  /**
   * Total count mode.
   * Corresponds to `_total`.
   */
  total?: 'none' | 'estimate' | 'accurate';

  /**
   * Resources to include (forward references).
   * Corresponds to `_include`.
   */
  include?: IncludeTarget[];

  /**
   * Resources to reverse-include (reverse references).
   * Corresponds to `_revinclude`.
   */
  revinclude?: IncludeTarget[];

  /**
   * Compartment filter for compartment search.
   * Set when the URL is `/:compartmentType/:compartmentId/:resourceType`.
   *
   * Example: `GET /Patient/123/Observation` →
   *   `{ resourceType: "Patient", id: "123" }`
   */
  compartment?: {
    resourceType: string;
    id: string;
  };

  /**
   * Project ID for multi-tenant scoping.
   * When set, search results are restricted to resources with matching `projectId`.
   *
   * Injected by the server layer from OperationContext.project.
   */
  project?: string;
}

/**
 * Default page size for search results.
 */
export const DEFAULT_SEARCH_COUNT = 20;

/**
 * Maximum allowed page size.
 */
export const MAX_SEARCH_COUNT = 1000;

// =============================================================================
// Section 6: SQL Fragment Types
// =============================================================================

/**
 * A SQL WHERE clause fragment with parameterized values.
 *
 * Used by `buildWhereFragment()` to produce composable SQL pieces.
 */
export interface WhereFragment {
  /** The SQL expression (e.g., `'"gender" = $1'`). */
  sql: string;

  /** The parameter values (e.g., `['male']`). */
  values: unknown[];
}

/**
 * A complete search SQL query with parameterized values.
 *
 * Produced by `buildSearchSQL()`.
 */
export interface SearchSQL {
  /** The full SQL query string. */
  sql: string;

  /** The parameter values for the query. */
  values: unknown[];
}

/**
 * Result of a count query.
 */
export interface CountSQL {
  /** The SQL COUNT query string. */
  sql: string;

  /** The parameter values for the query. */
  values: unknown[];
}
