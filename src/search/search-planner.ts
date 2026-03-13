/**
 * Search Planner
 *
 * Analyzes and optimizes a parsed SearchRequest before SQL generation.
 * Responsibilities:
 *
 * 1. **Filter reordering** — moves high-selectivity params first
 *    (_id > token > reference > date > string > lookup-table)
 * 2. **Chain depth validation** — rejects chains deeper than maxChainDepth
 * 3. **Index strategy hints** — annotates whether two-phase SQL is beneficial
 *
 * ## Design Principles
 *
 * - Pure function — no side effects or database access
 * - Non-destructive — returns a new SearchRequest, original is unchanged
 * - Graceful degradation — unknown params are left in place
 *
 * @module fhir-persistence/search
 */

import type { SearchParameterRegistry } from '../registry/search-parameter-registry.js';
import type { SearchParameterImpl } from '../registry/search-parameter-registry.js';
import type { ParsedSearchParam, SearchRequest } from './types.js';

// =============================================================================
// Section 1: Types
// =============================================================================

/**
 * Search plan produced by the planner.
 */
export interface SearchPlan {
  /** The optimized search request (params reordered). */
  request: SearchRequest;
  /** Whether two-phase SQL is recommended for this query. */
  useTwoPhase: boolean;
  /** Whether any chained search params are present. */
  hasChainedSearch: boolean;
  /** Estimated selectivity: 'high' (few results), 'medium', 'low' (many results). */
  estimatedSelectivity: 'high' | 'medium' | 'low';
  /** Warnings produced during planning (e.g., deep chain rejected). */
  warnings: string[];
}

/**
 * Options for the search planner.
 */
export interface SearchPlannerOptions {
  /** Maximum allowed chain depth (default: 1, i.e., single-level chain). */
  maxChainDepth?: number;
  /** Row count threshold above which two-phase SQL is recommended. Default: 10000. */
  twoPhaseThreshold?: number;
  /** Estimated table row count (from stats or hint). Default: 0 (unknown). */
  estimatedRowCount?: number;
}

// =============================================================================
// Section 2: Selectivity Priority
// =============================================================================

/**
 * Priority map for filter reordering.
 * Lower number = higher selectivity = evaluated first.
 */
function getSelectivityPriority(
  param: ParsedSearchParam,
  registry: SearchParameterRegistry,
  resourceType: string,
): number {
  // _id is the most selective (unique PK)
  if (param.code === '_id') return 0;

  // Chained search — always evaluated last (expensive EXISTS subquery)
  if (param.chain) return 90;

  // Resolve impl for strategy-based ordering
  const impl = registry.getImpl(resourceType, param.code);
  if (!impl) return 50; // Unknown → middle priority

  return getStrategyPriority(impl);
}

/**
 * Map search strategy + type to selectivity priority.
 */
function getStrategyPriority(impl: SearchParameterImpl): number {
  // token-column: high selectivity (system|code matching)
  if (impl.strategy === 'token-column') return 10;

  // reference: high selectivity (specific target)
  if (impl.type === 'reference') return 15;

  // date: medium-high selectivity (range queries)
  if (impl.type === 'date') return 20;

  // number/quantity: medium selectivity
  if (impl.type === 'number' || impl.type === 'quantity') return 25;

  // uri: medium selectivity
  if (impl.type === 'uri') return 30;

  // string (column strategy): medium-low (prefix match)
  if (impl.strategy === 'column' && impl.type === 'string') return 40;

  // lookup-table: low selectivity (expensive JOIN)
  if (impl.strategy === 'lookup-table') return 70;

  return 50; // default
}

// =============================================================================
// Section 3: Chain Depth Validation
// =============================================================================

/**
 * Validate chain depth. Currently only single-level chains are supported.
 * Returns warnings for rejected chains.
 */
function validateChainDepth(
  params: ParsedSearchParam[],
  maxDepth: number,
): { valid: ParsedSearchParam[]; warnings: string[] } {
  const valid: ParsedSearchParam[] = [];
  const warnings: string[] = [];

  for (const param of params) {
    if (param.chain) {
      // Currently only depth-1 chains are supported (subject:Patient.name)
      // Future: nested chains like subject:Patient.generalPractitioner:Practitioner.name
      const depth = 1; // Single-level chain = depth 1
      if (depth > maxDepth) {
        warnings.push(
          `Chain search "${param.code}:${param.chain.targetType}.${param.chain.targetParam}" rejected: ` +
          `depth ${depth} exceeds max ${maxDepth}`,
        );
        continue;
      }
    }
    valid.push(param);
  }

  return { valid, warnings };
}

// =============================================================================
// Section 4: Two-Phase SQL Recommendation
// =============================================================================

/**
 * Determine if two-phase SQL is beneficial.
 *
 * Two-phase SQL:
 * - Phase 1: SELECT id FROM ... WHERE ... ORDER BY ... LIMIT N
 * - Phase 2: SELECT content FROM ... WHERE id IN (...)
 *
 * Beneficial when:
 * - Table has many rows (> threshold)
 * - Query has complex WHERE conditions (lookup-table JOINs, chains)
 * - Content column is large (avoids reading content for non-matching rows)
 */
function shouldUseTwoPhase(
  params: ParsedSearchParam[],
  registry: SearchParameterRegistry,
  resourceType: string,
  estimatedRowCount: number,
  threshold: number,
): boolean {
  // Always use two-phase for large tables
  if (estimatedRowCount > threshold) return true;

  // Use two-phase if there are chain searches (expensive)
  if (params.some(p => p.chain)) return true;

  // Use two-phase if there are lookup-table searches (expensive JOIN)
  for (const param of params) {
    if (param.chain) continue;
    const impl = registry.getImpl(resourceType, param.code);
    if (impl?.strategy === 'lookup-table') return true;
  }

  return false;
}

// =============================================================================
// Section 5: Estimated Selectivity
// =============================================================================

/**
 * Estimate overall query selectivity based on parameter types.
 */
function estimateSelectivity(
  params: ParsedSearchParam[],
  registry: SearchParameterRegistry,
  resourceType: string,
): 'high' | 'medium' | 'low' {
  if (params.length === 0) return 'low';

  // _id search is always high selectivity
  if (params.some(p => p.code === '_id')) return 'high';

  // Multiple token/reference params → high
  let highSelectivityCount = 0;
  for (const param of params) {
    if (param.chain) continue;
    const impl = registry.getImpl(resourceType, param.code);
    if (impl && (impl.strategy === 'token-column' || impl.type === 'reference')) {
      highSelectivityCount++;
    }
  }
  if (highSelectivityCount >= 2) return 'high';
  if (highSelectivityCount >= 1 && params.length >= 2) return 'high';

  // Single filter or string-only → low-medium
  if (params.length >= 2) return 'medium';
  return 'low';
}

// =============================================================================
// Section 6: Main Planner Function
// =============================================================================

/**
 * Plan and optimize a search request.
 *
 * @param request - The parsed search request.
 * @param registry - The SearchParameterRegistry for resolving implementations.
 * @param options - Optional planner configuration.
 * @returns A SearchPlan with the optimized request and metadata.
 */
export function planSearch(
  request: SearchRequest,
  registry: SearchParameterRegistry,
  options?: SearchPlannerOptions,
): SearchPlan {
  const maxChainDepth = options?.maxChainDepth ?? 1;
  const twoPhaseThreshold = options?.twoPhaseThreshold ?? 10_000;
  const estimatedRowCount = options?.estimatedRowCount ?? 0;

  // Step 1: Validate chain depth
  const { valid, warnings } = validateChainDepth(request.params, maxChainDepth);

  // Step 2: Reorder filters by selectivity
  const sorted = [...valid].sort((a, b) => {
    const pa = getSelectivityPriority(a, registry, request.resourceType);
    const pb = getSelectivityPriority(b, registry, request.resourceType);
    return pa - pb;
  });

  // Step 3: Determine two-phase recommendation
  const useTwoPhase = shouldUseTwoPhase(
    sorted, registry, request.resourceType, estimatedRowCount, twoPhaseThreshold,
  );

  // Step 4: Estimate selectivity
  const estimatedSelectivity = estimateSelectivity(sorted, registry, request.resourceType);

  // Step 5: Build optimized request
  const optimizedRequest: SearchRequest = {
    ...request,
    params: sorted,
  };

  return {
    request: optimizedRequest,
    useTwoPhase,
    hasChainedSearch: sorted.some(p => p.chain),
    estimatedSelectivity,
    warnings,
  };
}
