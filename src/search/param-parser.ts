/**
 * Search Parameter Parser
 *
 * Parses FHIR search URL query strings into structured `ParsedSearchParam[]`.
 * Handles prefixes, modifiers, comma-separated OR values, and special
 * parameters (_count, _sort, _offset, _total).
 *
 * Reference: https://hl7.org/fhir/R4/search.html
 *
 * @module fhir-persistence/search
 */

import type { SearchParameterRegistry } from '../registry/search-parameter-registry.js';
import type {
  ChainedSearchTarget,
  IncludeTarget,
  ParsedSearchParam,
  SearchModifier,
  SearchPrefix,
  SearchRequest,
  SortRule,
} from './types.js';
import {
  SEARCH_PREFIXES,
  PREFIX_TYPES,
  MAX_SEARCH_COUNT,
} from './types.js';

// =============================================================================
// Section 1: Special Parameter Names
// =============================================================================

/**
 * FHIR search result parameters that are NOT search filters.
 * These control pagination, sorting, and result format.
 */
const RESULT_PARAMS = new Set([
  '_count',
  '_offset',
  '_sort',
  '_total',
  '_include',
  '_revinclude',
  '_summary',
  '_elements',
  '_contained',
  '_containedType',
]);

/**
 * Special search parameters handled by fixed columns.
 * These bypass the SearchParameterRegistry lookup.
 */
const SPECIAL_PARAMS = new Set([
  '_id',
  '_lastUpdated',
  '_profile',
  '_source',
  '_tag',
  '_security',
]);

// =============================================================================
// Section 2: Main Parser
// =============================================================================

/**
 * Parse a FHIR search URL query string into a `SearchRequest`.
 *
 * @param resourceType - The FHIR resource type being searched.
 * @param queryParams - The URL query parameters as a key-value record.
 *   For repeated keys, values should be joined with `&` or passed as arrays.
 * @param registry - Optional SearchParameterRegistry for parameter validation.
 *   If provided, unknown parameter codes will be rejected.
 * @returns A fully parsed SearchRequest.
 * @throws Error if a parameter code is unknown and registry is provided.
 */
export function parseSearchRequest(
  resourceType: string,
  queryParams: Record<string, string | string[] | undefined>,
  registry?: SearchParameterRegistry,
): SearchRequest {
  const request: SearchRequest = {
    resourceType,
    params: [],
  };

  for (const [rawKey, rawValue] of Object.entries(queryParams)) {
    if (rawValue === undefined || rawValue === '') {
      continue;
    }

    // Normalize array values to individual entries
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];

    for (const value of values) {
      if (value === '') continue;
      processQueryParam(request, rawKey, value, registry);
    }
  }

  return request;
}

// =============================================================================
// Section 3: Query Parameter Processing
// =============================================================================

/**
 * Process a single query parameter key-value pair.
 */
function processQueryParam(
  request: SearchRequest,
  key: string,
  value: string,
  registry?: SearchParameterRegistry,
): void {
  // Handle result parameters
  if (key === '_count') {
    const count = parseInt(value, 10);
    if (!isNaN(count) && count >= 0) {
      request.count = Math.min(count, MAX_SEARCH_COUNT);
    }
    return;
  }

  if (key === '_offset') {
    const offset = parseInt(value, 10);
    if (!isNaN(offset) && offset >= 0) {
      request.offset = offset;
    }
    return;
  }

  if (key === '_sort') {
    request.sort = parseSortParam(value);
    return;
  }

  if (key === '_total') {
    if (value === 'none' || value === 'estimate' || value === 'accurate') {
      request.total = value;
    }
    return;
  }

  if (key === '_include' || key === '_include:iterate') {
    const target = parseIncludeValue(value);
    if (target) {
      if (key === '_include:iterate') target.iterate = true;
      if (!request.include) request.include = [];
      request.include.push(target);
    }
    return;
  }

  if (key === '_revinclude' || key === '_revinclude:iterate') {
    const target = parseIncludeValue(value);
    if (target) {
      if (key === '_revinclude:iterate') target.iterate = true;
      if (!request.revinclude) request.revinclude = [];
      request.revinclude.push(target);
    }
    return;
  }

  // Skip other result parameters
  if (RESULT_PARAMS.has(key)) {
    return;
  }

  // Parse the parameter code, optional modifier, and optional chain
  const { code, modifier, chain } = parseParamKey(key);

  // Validate against registry if provided (skip special params and chained params)
  if (registry && !SPECIAL_PARAMS.has(code) && !chain) {
    const impl = registry.getImpl(request.resourceType, code);
    if (!impl) {
      throw new Error(`Unknown search parameter: ${code} for ${request.resourceType}`);
    }
  }

  // Determine the FHIR search parameter type for prefix detection
  // For chained params, detect prefix based on the TARGET param type
  let paramType: string | undefined;
  if (chain && registry) {
    const targetImpl = registry.getImpl(chain.targetType, chain.targetParam);
    paramType = targetImpl?.type;
  } else if (registry && !SPECIAL_PARAMS.has(code)) {
    const impl = registry.getImpl(request.resourceType, code);
    paramType = impl?.type;
  } else if (code === '_lastUpdated') {
    paramType = 'date';
  }

  // Parse values (comma-separated → OR)
  const parsedValues = splitSearchValues(value);

  // Extract prefix if applicable
  const { prefix, cleanValues } = extractPrefix(parsedValues, paramType);

  const param: ParsedSearchParam = {
    code,
    values: cleanValues,
  };

  if (modifier) {
    param.modifier = modifier;
  }

  if (prefix) {
    param.prefix = prefix;
  }

  if (chain) {
    param.chain = chain;
  }

  request.params.push(param);
}

// =============================================================================
// Section 4: Key Parsing
// =============================================================================

/**
 * Parse a query parameter key into code, optional modifier, and optional chain.
 *
 * Examples:
 * - `"gender"` → `{ code: "gender" }`
 * - `"name:exact"` → `{ code: "name", modifier: "exact" }`
 * - `"code:not"` → `{ code: "code", modifier: "not" }`
 * - `"subject:Patient.name"` → `{ code: "subject", chain: { targetType: "Patient", targetParam: "name" } }`
 */
export function parseParamKey(key: string): { code: string; modifier?: SearchModifier; chain?: ChainedSearchTarget } {
  const colonIdx = key.indexOf(':');
  if (colonIdx === -1) {
    return { code: key };
  }

  const code = key.substring(0, colonIdx);
  const rest = key.substring(colonIdx + 1);

  // Chained search: rest contains a dot → "Patient.name"
  const dotIdx = rest.indexOf('.');
  if (dotIdx !== -1) {
    const targetType = rest.substring(0, dotIdx);
    const targetParam = rest.substring(dotIdx + 1);
    if (targetType && targetParam) {
      return {
        code,
        chain: { targetType, targetParam },
      };
    }
  }

  const modifier = rest as SearchModifier;
  return { code, modifier };
}

// =============================================================================
// Section 5: Value Parsing
// =============================================================================

/**
 * Split a search value string on commas (OR semantics).
 *
 * Escaped commas (`\,`) are preserved as literal commas.
 *
 * Examples:
 * - `"male"` → `["male"]`
 * - `"male,female"` → `["male", "female"]`
 * - `"a\\,b"` → `["a,b"]`
 */
export function splitSearchValues(value: string): string[] {
  const results: string[] = [];
  let current = '';

  for (let i = 0; i < value.length; i++) {
    if (value[i] === '\\' && i + 1 < value.length && value[i + 1] === ',') {
      current += ',';
      i++; // skip the comma
    } else if (value[i] === ',') {
      results.push(current);
      current = '';
    } else {
      current += value[i];
    }
  }

  results.push(current);
  return results.filter((v) => v !== '');
}

/**
 * Extract a search prefix from values if the parameter type supports it.
 *
 * Prefixes are two-letter codes at the start of the first value:
 * - `"ge1990-01-01"` → prefix `"ge"`, value `"1990-01-01"`
 * - `"male"` → no prefix, value `"male"`
 *
 * Only number, date, and quantity types support prefixes.
 */
export function extractPrefix(
  values: string[],
  paramType?: string,
): { prefix?: SearchPrefix; cleanValues: string[] } {
  if (!paramType || !PREFIX_TYPES.has(paramType)) {
    return { cleanValues: values };
  }

  // Check each value for a prefix
  const cleanValues: string[] = [];
  let detectedPrefix: SearchPrefix | undefined;

  for (const value of values) {
    const candidate = value.substring(0, 2);
    if (SEARCH_PREFIXES.has(candidate) && value.length > 2) {
      if (!detectedPrefix) {
        detectedPrefix = candidate as SearchPrefix;
      }
      cleanValues.push(value.substring(2));
    } else {
      cleanValues.push(value);
    }
  }

  return { prefix: detectedPrefix, cleanValues };
}

// =============================================================================
// Section 6: Include Parsing
// =============================================================================

/**
 * Parse a `_include` or `_revinclude` value into an `IncludeTarget`.
 *
 * Syntax: `{sourceType}:{searchParam}` or `{sourceType}:{searchParam}:{targetType}`
 *
 * Examples:
 * - `"MedicationRequest:patient"` → `{ resourceType: "MedicationRequest", searchParam: "patient" }`
 * - `"Observation:subject:Patient"` → `{ resourceType: "Observation", searchParam: "subject", targetType: "Patient" }`
 *
 * @returns Parsed IncludeTarget, or null if the format is invalid.
 */
export function parseIncludeValue(value: string): IncludeTarget | null {
  // Wildcard: _include=*
  if (value === '*') {
    return { resourceType: '*', searchParam: '*', wildcard: true };
  }

  const parts = value.split(':');
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    return null;
  }

  const target: IncludeTarget = {
    resourceType: parts[0],
    searchParam: parts[1],
  };

  if (parts.length >= 3 && parts[2]) {
    target.targetType = parts[2];
  }

  return target;
}

// =============================================================================
// Section 7: Sort Parsing
// =============================================================================

/**
 * Parse the `_sort` parameter value into `SortRule[]`.
 *
 * Examples:
 * - `"birthdate"` → `[{ code: "birthdate", descending: false }]`
 * - `"-birthdate"` → `[{ code: "birthdate", descending: true }]`
 * - `"family,-birthdate"` → two rules
 */
export function parseSortParam(value: string): SortRule[] {
  return value
    .split(',')
    .filter((v) => v.trim() !== '')
    .map((v) => {
      const trimmed = v.trim();
      if (trimmed.startsWith('-')) {
        return { code: trimmed.substring(1), descending: true };
      }
      return { code: trimmed, descending: false };
    });
}
