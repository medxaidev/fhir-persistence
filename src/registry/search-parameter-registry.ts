/**
 * SearchParameter Registry
 *
 * Indexes FHIR SearchParameter definitions and determines the physical
 * storage strategy for each parameter. Drives search column generation
 * in `TableSchemaBuilder`.
 *
 * ## Strategy Mapping (from WF-MIG-003)
 *
 * | SearchParam.type | Strategy       | Column Type                          |
 * |------------------|----------------|--------------------------------------|
 * | date             | column         | TIMESTAMPTZ (or DATE)                |
 * | string           | column         | TEXT                                 |
 * | reference        | column         | TEXT                                 |
 * | number           | column         | DOUBLE PRECISION                     |
 * | quantity         | column         | DOUBLE PRECISION                     |
 * | uri              | column         | TEXT                                 |
 * | boolean          | column         | BOOLEAN (not used in practice)       |
 * | token            | token-column   | UUID[] + TEXT[] + TEXT (3 cols)       |
 * | special          | skipped        | —                                    |
 * | composite        | skipped        | —                                    |
 *
 * Lookup-table strategy is determined by matching specific search param
 * codes (name, address, etc.) — generates a sort column only in the
 * main table; actual data is written by the Repository layer (Phase 9).
 *
 * @module fhir-persistence/registry
 */

import type { SqlColumnType } from '../schema/table-schema.js';
import { ARRAY_ELEMENT_PATHS } from './element-cardinality.js';

// =============================================================================
// Section 1: Types
// =============================================================================

/**
 * FHIR SearchParameter type codes.
 */
export type SearchParamType =
  | 'number'
  | 'date'
  | 'string'
  | 'token'
  | 'reference'
  | 'composite'
  | 'quantity'
  | 'uri'
  | 'special';

/**
 * Physical storage strategy for a search parameter.
 *
 * - `column` — single column in the main table
 * - `token-column` — three columns (UUID[], TEXT[], TEXT) for token search
 * - `lookup-table` — separate lookup table; only a sort column in main table
 */
export type SearchStrategy = 'column' | 'token-column' | 'lookup-table';

/**
 * Column type for search parameter columns.
 */
export type SearchColumnType = SqlColumnType;

/**
 * Resolved implementation details for a single search parameter
 * on a specific resource type.
 */
export interface SearchParameterImpl {
  /** SearchParameter.code (e.g., `'birthdate'`). */
  code: string;

  /** FHIR search parameter type. */
  type: SearchParamType;

  /** Resource types this parameter applies to. */
  resourceTypes: string[];

  /** FHIRPath expression for value extraction. */
  expression: string;

  /** Physical storage strategy. */
  strategy: SearchStrategy;

  /** Column name in the main table (for `column` strategy). */
  columnName: string;

  /** PostgreSQL column type (for `column` strategy). */
  columnType: SearchColumnType;

  /** Whether the column stores an array of values. */
  array: boolean;
}

/**
 * Raw FHIR SearchParameter shape (subset of fields we need).
 */
export interface SearchParameterResource {
  resourceType: 'SearchParameter';
  code: string;
  type: SearchParamType;
  base: string[];
  expression?: string;
  url?: string;
  name?: string;
  target?: string[];
}

/**
 * Shape of a FHIR Bundle containing SearchParameter entries.
 */
export interface SearchParameterBundle {
  resourceType: 'Bundle';
  entry?: Array<{
    resource?: SearchParameterResource;
  }>;
}

// =============================================================================
// Section 2: Constants
// =============================================================================

/**
 * SearchParameter codes that are already handled by fixed columns
 * and should NOT generate additional search columns.
 */
const IGNORED_SEARCH_PARAMS = new Set([
  '_id',
  '_lastUpdated',
  '_profile',
  '_compartment',
  '_source',
  '_version',
]);

/**
 * Search parameters that should override the default strategy.
 *
 * `version` is type=token in FHIR R4, but Medplum stores it as a plain
 * TEXT column (not token-column) because canonical versions are simple
 * strings like "1.0.0". Also avoids name collision with the internal
 * `__version INTEGER` fixed column.
 */
const STRATEGY_OVERRIDES = new Map<string, { strategy: SearchStrategy; type: SearchParamType }>([
  ['version', { strategy: 'column', type: 'string' }],
]);

/**
 * SearchParameter types that are skipped entirely.
 */
const SKIPPED_TYPES = new Set<SearchParamType>(['composite', 'special']);

/**
 * Search parameter codes that use the lookup-table strategy.
 *
 * These parameters target complex FHIR types (HumanName, Address, etc.)
 * that require multi-column storage in separate lookup tables.
 * Only a sort column is generated in the main table.
 *
 * NOTE: Matching is done by code AND expression pattern to avoid false
 * positives (e.g. Account.name is a plain string, not HumanName).
 */
const LOOKUP_TABLE_PARAMS = new Set([
  // HumanName-related
  'name',
  'given',
  'family',
  'phonetic',
  // Address-related
  'address',
  'address-city',
  'address-country',
  'address-postalcode',
  'address-state',
  'address-use',
  // Contact-related
  'email',
  'phone',
  'telecom',
]);

/**
 * FHIRPath expression suffixes that indicate a complex lookup-table type.
 *
 * A search parameter uses lookup-table strategy only when its code is in
 * LOOKUP_TABLE_PARAMS AND its expression ends with one of these suffixes
 * (i.e. it actually targets a HumanName, Address, or ContactPoint element).
 */
const LOOKUP_TABLE_EXPRESSION_SUFFIXES = [
  '.name',
  '.given',
  '.family',
  '.address',
  '.telecom',
];

// =============================================================================
// Section 3: Strategy Resolution
// =============================================================================

/**
 * Determine the search strategy for a given search parameter.
 *
 * Lookup-table strategy requires BOTH:
 * 1. The param code is in LOOKUP_TABLE_PARAMS
 * 2. The expression targets a known complex type path (HumanName, Address, ContactPoint)
 *
 * This prevents plain-string fields named 'name' (e.g. Account.name) from
 * incorrectly using the lookup-table strategy.
 */
function resolveStrategy(code: string, type: SearchParamType, expression: string): SearchStrategy {
  if (LOOKUP_TABLE_PARAMS.has(code)) {
    // Only use lookup-table if the expression actually targets a complex type
    const exprLower = expression.toLowerCase();
    const targetsComplexType = LOOKUP_TABLE_EXPRESSION_SUFFIXES.some(
      (suffix) => exprLower.includes(suffix),
    );
    if (targetsComplexType) {
      return 'lookup-table';
    }
  }
  if (type === 'token') {
    return 'token-column';
  }
  return 'column';
}

/**
 * Convert a hyphenated search parameter code to a camelCase column name.
 *
 * Examples:
 * - `'birth-date'` → `'birthDate'`
 * - `'address-city'` → `'addressCity'`
 * - `'active'` → `'active'`
 */
function codeToColumnName(code: string): string {
  return code.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Determine the PostgreSQL column type for a search parameter.
 *
 * @param type - FHIR search parameter type
 * @param array - Whether the column stores multiple values
 * @returns The PostgreSQL column type
 */
function resolveColumnType(type: SearchParamType, array: boolean): SearchColumnType {
  switch (type) {
    case 'date':
      return array ? 'TIMESTAMPTZ[]' : 'TIMESTAMPTZ';
    case 'number':
    case 'quantity':
      return array ? 'DOUBLE PRECISION[]' : 'DOUBLE PRECISION';
    case 'string':
    case 'uri':
    case 'reference':
      return array ? 'TEXT[]' : 'TEXT';
    case 'token':
      // Token columns use UUID[] for the hash column;
      // the actual column type is set by the token-column strategy
      return 'UUID[]';
    default:
      return 'TEXT';
  }
}

/**
 * Extract the expression fragment relevant to a specific resource type.
 *
 * Given "AllergyIntolerance.patient | CarePlan.subject.where(resolve() is Patient)",
 * for resourceType "AllergyIntolerance" returns "AllergyIntolerance.patient".
 */
function getExpressionsForResourceType(resourceType: string, expression: string): string[] {
  const results: string[] = [];
  const parts = expression.split('|').map(s => s.trim());
  for (const part of parts) {
    if (part.startsWith(resourceType + '.') || part.startsWith('(' + resourceType + '.')) {
      // Only strip matching outer parentheses (not unbalanced ones)
      let result = part;
      if (result.startsWith('(') && result.endsWith(')')) {
        result = result.slice(1, -1);
      }
      results.push(result);
    }
  }
  // Single expression without union
  if (results.length === 0 && !expression.includes('|') && expression.startsWith(resourceType + '.')) {
    results.push(expression);
  }
  return results;
}

/**
 * Strip a balanced function call from an expression string.
 *
 * Handles nested parentheses correctly, e.g.:
 * - `.where(resolve() is Patient)` → removed entirely
 * - `.ofType(CodeableConcept)` → removed entirely
 *
 * @param input - The expression string
 * @param funcName - The function prefix to strip (e.g. '.where', '.as')
 * @returns The expression with all occurrences of funcName(...) removed
 */
function stripBalancedCall(input: string, funcName: string): string {
  let result = input;
  let idx: number;
  while ((idx = result.indexOf(funcName + '(')) !== -1) {
    // Find the matching closing paren
    let depth = 0;
    let end = idx + funcName.length; // points to '('
    for (let i = end; i < result.length; i++) {
      if (result[i] === '(') depth++;
      else if (result[i] === ')') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    result = result.slice(0, idx) + result.slice(end);
  }
  return result;
}

/**
 * Determine whether a search parameter produces an array column.
 *
 * Uses FHIR R4 element cardinality (from StructureDefinitions) to determine
 * whether any element along the FHIRPath expression path has max != '1'.
 *
 * This matches Medplum's `crawlSearchParameterDetails` logic which sets
 * `builder.array = true` when `elementDefinition.isArray` is true.
 *
 * Rules:
 * - token-column / lookup-table: always array (UUID[] hash column / sort only)
 * - Walk each segment of the expression path for the specific resource type
 * - If ANY segment has max != '1' in FHIR R4 → array
 * - [0] indexer makes result NOT array
 * - .where() / .as() / .resolve() / .ofType() are stripped
 */
function resolveIsArray(
  type: SearchParamType,
  strategy: SearchStrategy,
  expression: string,
  _targets: string[],
  resourceType?: string,
): boolean {
  if (strategy === 'token-column') {
    return true; // Token columns are always arrays
  }

  // If no resource type provided, fall back to old heuristic
  if (!resourceType) {
    return false;
  }

  // Get ALL expression fragments for this specific resource type
  // (e.g., combo-value-quantity has both Observation.value and Observation.component.value)
  const rtExprs = getExpressionsForResourceType(resourceType, expression);
  if (rtExprs.length === 0) {
    return false;
  }

  // If ANY expression fragment traverses an array path, the column is array
  for (const rtExpr of rtExprs) {
    // Strip FHIRPath functions with potentially nested parentheses:
    // .where(resolve() is Patient), .as(Type), .resolve(), .ofType(Type)
    let cleaned = stripBalancedCall(rtExpr, '.where');
    cleaned = stripBalancedCall(cleaned, '.as');
    cleaned = stripBalancedCall(cleaned, '.ofType');
    cleaned = cleaned.replace(/\.resolve\(\)/g, '');
    // Strip FHIRPath infix 'as Type' syntax: (Observation.value as Quantity)
    cleaned = cleaned.replace(/\s+as\s+\w+/g, '');

    // Check for [0] indexer — makes result NOT array
    const hasIndexer = cleaned.includes('[0]');
    cleaned = cleaned.replace(/\[0\]/g, '');

    // Walk each segment of the path
    const segments = cleaned.split('.');
    if (segments.length < 2) continue;

    let currentPath = segments[0]; // ResourceType
    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      if (!seg) continue;
      currentPath += '.' + seg;

      if (ARRAY_ELEMENT_PATHS.has(currentPath)) {
        // If the expression had [0] indexer, this fragment is not array
        if (hasIndexer) break;
        return true;
      }
    }
  }

  return false;
}

// =============================================================================
// Section 4: SearchParameterRegistry
// =============================================================================

/**
 * Indexes SearchParameter definitions by resource type.
 *
 * ## Usage
 *
 * ```typescript
 * const registry = new SearchParameterRegistry();
 * const bundle = JSON.parse(fs.readFileSync('search-parameters.json', 'utf8'));
 * registry.indexBundle(bundle);
 *
 * const patientParams = registry.getForResource('Patient');
 * ```
 */
export class SearchParameterRegistry {
  /**
   * Map from resource type → Map from param code → SearchParameterImpl.
   */
  private readonly byResource = new Map<string, Map<string, SearchParameterImpl>>();

  /**
   * Total number of indexed implementations (across all resource types).
   */
  private _totalCount = 0;

  /**
   * Number of skipped parameters (composite, special, ignored).
   */
  private _skippedCount = 0;

  /**
   * Index all SearchParameter entries from a FHIR Bundle.
   *
   * Skips entries that are:
   * - Not a SearchParameter resource
   * - Of type `composite` or `special`
   * - In the ignored list (`_id`, `_lastUpdated`, etc.)
   *
   * @returns Stats about the indexing operation.
   */
  indexBundle(bundle: SearchParameterBundle): { indexed: number; skipped: number } {
    let indexed = 0;
    let skipped = 0;

    if (!bundle.entry) {
      return { indexed: 0, skipped: 0 };
    }

    for (const entry of bundle.entry) {
      const resource = entry.resource;
      if (!resource || resource.resourceType !== 'SearchParameter') {
        skipped++;
        continue;
      }

      if (SKIPPED_TYPES.has(resource.type)) {
        skipped++;
        continue;
      }

      if (IGNORED_SEARCH_PARAMS.has(resource.code)) {
        skipped++;
        continue;
      }

      if (!resource.base || resource.base.length === 0) {
        skipped++;
        continue;
      }

      // Build a per-resource-type impl (array determination depends on resource type)
      let builtAny = false;
      for (const base of resource.base) {
        // Skip abstract base types — they don't have tables
        if (base === 'Resource' || base === 'DomainResource') {
          continue;
        }

        const impl = this.buildImpl(resource, base);
        if (!impl) {
          continue;
        }

        let resourceMap = this.byResource.get(base);
        if (!resourceMap) {
          resourceMap = new Map();
          this.byResource.set(base, resourceMap);
        }
        resourceMap.set(impl.code, impl);
        builtAny = true;
      }

      if (!builtAny) {
        skipped++;
        continue;
      }

      indexed++;
    }

    this._totalCount += indexed;
    this._skippedCount += skipped;

    return { indexed, skipped };
  }

  /**
   * Index a single SearchParameterImpl directly.
   *
   * Useful for adding platform-specific or custom search parameters.
   */
  indexImpl(resourceType: string, impl: SearchParameterImpl): void {
    let resourceMap = this.byResource.get(resourceType);
    if (!resourceMap) {
      resourceMap = new Map();
      this.byResource.set(resourceType, resourceMap);
    }
    resourceMap.set(impl.code, impl);
    this._totalCount++;
  }

  /**
   * Get all search parameter implementations for a resource type.
   *
   * @returns Array of SearchParameterImpl, sorted by code for deterministic output.
   */
  getForResource(resourceType: string): SearchParameterImpl[] {
    const resourceMap = this.byResource.get(resourceType);
    if (!resourceMap) {
      return [];
    }
    return Array.from(resourceMap.values()).sort((a, b) => a.code.localeCompare(b.code));
  }

  /**
   * Get a specific search parameter implementation for a resource type.
   */
  getImpl(resourceType: string, code: string): SearchParameterImpl | undefined {
    return this.byResource.get(resourceType)?.get(code);
  }

  /**
   * Check if a resource type has any indexed search parameters.
   */
  hasResource(resourceType: string): boolean {
    return this.byResource.has(resourceType);
  }

  /**
   * Get all resource types that have indexed search parameters.
   */
  getResourceTypes(): string[] {
    return Array.from(this.byResource.keys()).sort();
  }

  /**
   * Get the total number of indexed implementations.
   */
  get totalCount(): number {
    return this._totalCount;
  }

  /**
   * Get the number of skipped parameters.
   */
  get skippedCount(): number {
    return this._skippedCount;
  }

  /**
   * Get the number of resource types with indexed parameters.
   */
  get resourceTypeCount(): number {
    return this.byResource.size;
  }

  /**
   * Remove all indexed parameters.
   */
  clear(): void {
    this.byResource.clear();
    this._totalCount = 0;
    this._skippedCount = 0;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /**
   * Build a SearchParameterImpl from a raw SearchParameter resource.
   */
  private buildImpl(resource: SearchParameterResource, resourceType: string): SearchParameterImpl | null {
    const { code, type, base, expression } = resource;

    if (!code || !type || !base) {
      return null;
    }

    const expr = expression ?? '';
    const targets = resource.target ?? [];

    // Check for strategy override (e.g., 'version' → column/string)
    const override = STRATEGY_OVERRIDES.get(code);
    const effectiveType = override?.type ?? type;
    const strategy = override?.strategy ?? resolveStrategy(code, effectiveType, expr);
    const columnName = codeToColumnName(code);
    const array = resolveIsArray(effectiveType, strategy, expr, targets, resourceType);
    const columnType = resolveColumnType(effectiveType, array);

    return {
      code,
      type: effectiveType,
      resourceTypes: [...base],
      expression: expression ?? '',
      strategy,
      columnName,
      columnType,
      array,
    };
  }
}
