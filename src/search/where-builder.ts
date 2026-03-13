/**
 * WHERE Clause Builder
 *
 * Generates parameterized SQL WHERE clause fragments from parsed
 * FHIR search parameters. Each fragment is composable — multiple
 * fragments are joined with AND/OR as needed.
 *
 * ## Design Principles
 *
 * 1. **Parameterized only** — all user values use `$N` placeholders (SQL injection safe)
 * 2. **Column names from registry** — never from user input
 * 3. **Composable fragments** — each function returns `{ sql, values }`
 * 4. **Strategy-aware** — handles column, token-column, and lookup-table differently
 *
 * Reference: https://hl7.org/fhir/R4/search.html
 *
 * @module fhir-persistence/search
 */

import type { SearchParameterImpl } from '../registry/search-parameter-registry.js';
import type { SearchParameterRegistry } from '../registry/search-parameter-registry.js';
import type { ParsedSearchParam, WhereFragment, SearchPrefix, ChainedSearchTarget } from './types.js';

// =============================================================================
// Section 1: Prefix → SQL Operator Mapping
// =============================================================================

/**
 * Map a FHIR search prefix to a SQL comparison operator.
 */
export function prefixToOperator(prefix?: SearchPrefix): string {
  switch (prefix) {
    case 'eq':
    case undefined:
      return '=';
    case 'ne':
      return '<>';
    case 'lt':
      return '<';
    case 'gt':
      return '>';
    case 'le':
      return '<=';
    case 'ge':
      return '>=';
    case 'sa':
      return '>'; // starts after
    case 'eb':
      return '<'; // ends before
    case 'ap':
      return 'ap'; // approximately — handled by type-specific builders
    default:
      return '=';
  }
}

// =============================================================================
// Section 2: Core WHERE Fragment Builder
// =============================================================================

/**
 * Build a WHERE clause fragment for a single parsed search parameter.
 *
 * Dispatches to type-specific builders based on the SearchParameterImpl type
 * and the parameter's modifier.
 *
 * @param impl - The search parameter implementation from the registry.
 * @param param - The parsed search parameter from the URL.
 * @param startIndex - The starting `$N` parameter index (1-based).
 * @returns A WhereFragment with SQL and values, or null if the parameter
 *   cannot be converted (e.g., lookup-table strategy).
 */
export function buildWhereFragment(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
  startIndex: number,
): WhereFragment | null {
  // Handle :missing modifier (any type)
  if (param.modifier === 'missing') {
    return buildMissingFragment(impl, param, startIndex);
  }

  // Lookup-table strategy — search the __<name>Sort column
  if (impl.strategy === 'lookup-table') {
    return buildLookupTableFragment(impl, param, startIndex);
  }

  // Dispatch by strategy
  if (impl.strategy === 'token-column') {
    return buildTokenColumnFragment(impl, param, startIndex);
  }

  // Column strategy — dispatch by FHIR type
  switch (impl.type) {
    case 'string':
      return buildStringFragment(impl, param, startIndex);
    case 'date':
      return buildDateFragment(impl, param, startIndex);
    case 'number':
    case 'quantity':
      return buildNumberFragment(impl, param, startIndex);
    case 'reference':
      return buildReferenceFragment(impl, param, startIndex);
    case 'uri':
      return buildUriFragment(impl, param, startIndex);
    case 'token':
      return buildTokenColumnFragment(impl, param, startIndex);
    default:
      return buildDefaultFragment(impl, param, startIndex);
  }
}

// =============================================================================
// Section 2b: Chained Search Fragment
// =============================================================================

/**
 * Build a WHERE fragment for a chained search parameter.
 *
 * Chained search: `subject:Patient.name=Smith`
 * - Source param: `subject` (reference on source resource type)
 * - Target type: `Patient`
 * - Target param: `name` (search param on target type)
 * - Value: `Smith`
 *
 * Generated SQL:
 * ```sql
 * EXISTS (
 *   SELECT 1 FROM "Observation_References" __ref
 *   JOIN "Patient" __target ON __ref."targetId" = __target."id"
 *   WHERE __ref."resourceId" = "Observation"."id"
 *     AND __ref."code" = 'subject'
 *     AND __target."deleted" = false
 *     AND <target param condition>
 * )
 * ```
 */
function buildChainedFragment(
  param: ParsedSearchParam,
  chain: ChainedSearchTarget,
  registry: SearchParameterRegistry,
  sourceResourceType: string,
  startIndex: number,
): WhereFragment | null {
  // Resolve the target param implementation on the TARGET resource type
  const targetImpl = resolveImpl(
    { code: chain.targetParam, values: param.values, modifier: param.modifier, prefix: param.prefix },
    registry,
    chain.targetType,
  );
  if (!targetImpl) return null;

  // Build the inner WHERE condition for the target table
  // We use a temporary param that represents the target search
  const innerParam: ParsedSearchParam = {
    code: chain.targetParam,
    values: param.values,
    modifier: param.modifier,
    prefix: param.prefix,
  };

  const innerFragment = buildWhereFragment(targetImpl, innerParam, startIndex);
  if (!innerFragment) return null;

  // Rewrite the inner SQL to prefix column names with __target.
  // The inner fragment produces SQL like: "name" = $1
  // We need: __target."name" = $1
  const innerSql = rewriteColumnRefsForAlias(innerFragment.sql, '__target');

  const refTable = `${sourceResourceType}_References`;
  const sql = [
    `EXISTS (`,
    `  SELECT 1 FROM "${refTable}" __ref`,
    `  JOIN "${chain.targetType}" __target ON __ref."targetId" = __target."id"`,
    `  WHERE __ref."resourceId" = "${sourceResourceType}"."id"`,
    `    AND __ref."code" = '${param.code}'`,
    `    AND __target."deleted" = false`,
    `    AND ${innerSql}`,
    `)`,
  ].join('\n');

  return { sql, values: innerFragment.values };
}

/**
 * Rewrite quoted column references in SQL to use a table alias prefix.
 *
 * Transforms `"columnName"` → `__alias."columnName"`
 * but avoids rewriting `$N` parameters or already-aliased references.
 *
 * This is needed because buildWhereFragment generates column references
 * without table qualification, but inside an EXISTS subquery we need
 * to qualify them with the target table alias.
 */
function rewriteColumnRefsForAlias(sql: string, alias: string): string {
  // Match quoted identifiers that are NOT preceded by a dot or another quote
  // Pattern: a standalone "identifier" at the start or after whitespace/operators
  return sql.replace(/(?<![."a-zA-Z])"([^"]+)"/g, `${alias}."$1"`);
}

// =============================================================================
// Section 3: :missing Modifier
// =============================================================================

/**
 * Build a WHERE fragment for the `:missing` modifier.
 *
 * - `?active:missing=true` → `"active" IS NULL`
 * - `?active:missing=false` → `"active" IS NOT NULL`
 */
function buildMissingFragment(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
  _startIndex: number,
): WhereFragment {
  const isMissing = param.values[0] === 'true';
  const columnName = quoteColumn(impl.columnName);
  const sql = isMissing ? `${columnName} IS NULL` : `${columnName} IS NOT NULL`;
  return { sql, values: [] };
}

// =============================================================================
// Section 3b: Lookup-Table Strategy (global table JOIN search)
// =============================================================================

/**
 * Map search param codes to their global lookup table and column.
 *
 * Matches Medplum's production design:
 * - HumanName: name/given/family columns
 * - Address: address/city/country/postalCode/state/use columns
 * - ContactPoint: system/value columns
 */
const LOOKUP_TABLE_MAP: Record<string, { table: string; column: string }> = {
  // HumanName
  name: { table: 'HumanName', column: 'name' },
  given: { table: 'HumanName', column: 'given' },
  family: { table: 'HumanName', column: 'family' },
  phonetic: { table: 'HumanName', column: 'name' },
  // Address
  address: { table: 'Address', column: 'address' },
  'address-city': { table: 'Address', column: 'city' },
  'address-country': { table: 'Address', column: 'country' },
  'address-postalcode': { table: 'Address', column: 'postalCode' },
  'address-state': { table: 'Address', column: 'state' },
  'address-use': { table: 'Address', column: 'use' },
  // ContactPoint
  telecom: { table: 'ContactPoint', column: 'value' },
  email: { table: 'ContactPoint', column: 'value' },
  phone: { table: 'ContactPoint', column: 'value' },
};

/**
 * Build a WHERE fragment for lookup-table strategy parameters.
 *
 * Generates an EXISTS subquery against the appropriate global lookup table:
 * ```sql
 * EXISTS (SELECT 1 FROM "HumanName" __lookup
 *   WHERE __lookup."resourceId" = "id" AND LOWER(__lookup."family") LIKE $1)
 * ```
 *
 * Falls back to `__<name>Sort` column search if no mapping exists.
 *
 * Supports string modifiers:
 * - No modifier → case-insensitive prefix match (ILIKE 'value%')
 * - `:exact` → exact match (`= $N`)
 * - `:contains` → contains match (ILIKE '%value%')
 */
function buildLookupTableFragment(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
  startIndex: number,
): WhereFragment {
  const mapping = LOOKUP_TABLE_MAP[impl.code];

  // Fallback to sort-column search if no global table mapping
  if (!mapping) {
    const sortColumn = quoteColumn(`__${impl.columnName}Sort`);
    if (param.modifier === 'exact') {
      return buildOrFragment(sortColumn, '=', param.values, startIndex);
    }
    if (param.modifier === 'contains') {
      return buildLikeFragment(sortColumn, param.values, startIndex, '%', '%');
    }
    return buildLikeFragment(sortColumn, param.values, startIndex, '', '%');
  }

  // Build EXISTS subquery against global lookup table
  const { table, column } = mapping;
  const colRef = `__lookup."${column}"`;

  if (param.modifier === 'exact') {
    // Exact: direct equality
    if (param.values.length === 1) {
      const sql = `EXISTS (SELECT 1 FROM "${table}" __lookup WHERE __lookup."resourceId" = "id" AND ${colRef} = $${startIndex})`;
      return { sql, values: [param.values[0]] };
    }
    const conditions = param.values.map((_, i) => `${colRef} = $${startIndex + i}`);
    const sql = `EXISTS (SELECT 1 FROM "${table}" __lookup WHERE __lookup."resourceId" = "id" AND (${conditions.join(' OR ')}))`;
    return { sql, values: [...param.values] };
  }

  if (param.modifier === 'contains') {
    // Contains: ILIKE '%value%'
    if (param.values.length === 1) {
      const sql = `EXISTS (SELECT 1 FROM "${table}" __lookup WHERE __lookup."resourceId" = "id" AND LOWER(${colRef}) LIKE $${startIndex})`;
      return { sql, values: [`%${param.values[0].toLowerCase()}%`] };
    }
    const conditions = param.values.map((_, i) => `LOWER(${colRef}) LIKE $${startIndex + i}`);
    const sql = `EXISTS (SELECT 1 FROM "${table}" __lookup WHERE __lookup."resourceId" = "id" AND (${conditions.join(' OR ')}))`;
    return { sql, values: param.values.map(v => `%${v.toLowerCase()}%`) };
  }

  // Default: prefix match (ILIKE 'value%')
  if (param.values.length === 1) {
    const sql = `EXISTS (SELECT 1 FROM "${table}" __lookup WHERE __lookup."resourceId" = "id" AND LOWER(${colRef}) LIKE $${startIndex})`;
    return { sql, values: [`${param.values[0].toLowerCase()}%`] };
  }
  const conditions = param.values.map((_, i) => `LOWER(${colRef}) LIKE $${startIndex + i}`);
  const sql = `EXISTS (SELECT 1 FROM "${table}" __lookup WHERE __lookup."resourceId" = "id" AND (${conditions.join(' OR ')}))`;
  return { sql, values: param.values.map(v => `${v.toLowerCase()}%`) };
}

// =============================================================================
// Section 4: String Type
// =============================================================================

/**
 * Build a WHERE fragment for string search parameters.
 *
 * Default behavior: case-insensitive prefix match (ILIKE 'value%').
 * - `:exact` modifier → exact match (`= $N`)
 * - `:contains` modifier → contains match (`ILIKE '%value%'`)
 * - No modifier → prefix match (`ILIKE 'value%'`)
 */
function buildStringFragment(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
  startIndex: number,
): WhereFragment {
  const columnName = quoteColumn(impl.columnName);

  if (param.modifier === 'exact') {
    return buildOrFragment(columnName, '=', param.values, startIndex);
  }

  if (param.modifier === 'contains') {
    return buildLikeFragment(columnName, param.values, startIndex, '%', '%');
  }

  // Default: prefix match
  return buildLikeFragment(columnName, param.values, startIndex, '', '%');
}

/**
 * Build an ILIKE fragment with optional prefix/suffix wildcards.
 */
function buildLikeFragment(
  columnName: string,
  values: string[],
  startIndex: number,
  prefix: string,
  suffix: string,
): WhereFragment {
  if (values.length === 1) {
    const sql = `LOWER(${columnName}) LIKE $${startIndex}`;
    const escapedValue = escapeLikeString(values[0]).toLowerCase();
    return { sql, values: [`${prefix}${escapedValue}${suffix}`] };
  }

  // Multiple values → OR
  const conditions: string[] = [];
  const allValues: unknown[] = [];
  let idx = startIndex;

  for (const value of values) {
    conditions.push(`LOWER(${columnName}) LIKE $${idx}`);
    const escapedValue = escapeLikeString(value).toLowerCase();
    allValues.push(`${prefix}${escapedValue}${suffix}`);
    idx++;
  }

  const sql = `(${conditions.join(' OR ')})`;
  return { sql, values: allValues };
}

// =============================================================================
// Section 5: Date Type
// =============================================================================

/**
 * Build a WHERE fragment for date search parameters.
 *
 * Supports prefixes: eq, ne, lt, gt, le, ge, ap.
 * For `ap`, uses a ±1 day range around the target date.
 */
function buildDateFragment(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
  startIndex: number,
): WhereFragment {
  const columnName = quoteColumn(impl.columnName);

  // ap (approximately) → BETWEEN (date - 1 day) AND (date + 1 day)
  if (param.prefix === 'ap') {
    return buildApproximateDateFragment(columnName, param.values, startIndex);
  }

  const operator = prefixToOperator(param.prefix);
  return buildOrFragment(columnName, operator, param.values, startIndex);
}

/**
 * Build a BETWEEN fragment for approximate date matching.
 * Uses ±1 day range for each value.
 */
function buildApproximateDateFragment(
  columnName: string,
  values: string[],
  startIndex: number,
): WhereFragment {
  if (values.length === 1) {
    const sql = `${columnName} BETWEEN $${startIndex} AND $${startIndex + 1}`;
    const d = new Date(values[0]);
    const lo = new Date(d.getTime() - 86_400_000).toISOString();
    const hi = new Date(d.getTime() + 86_400_000).toISOString();
    return { sql, values: [lo, hi] };
  }

  const conditions: string[] = [];
  const allValues: unknown[] = [];
  let idx = startIndex;
  for (const value of values) {
    conditions.push(`${columnName} BETWEEN $${idx} AND $${idx + 1}`);
    const d = new Date(value);
    allValues.push(new Date(d.getTime() - 86_400_000).toISOString());
    allValues.push(new Date(d.getTime() + 86_400_000).toISOString());
    idx += 2;
  }
  return { sql: `(${conditions.join(' OR ')})`, values: allValues };
}

// =============================================================================
// Section 6: Number / Quantity Type
// =============================================================================

/**
 * Build a WHERE fragment for number and quantity search parameters.
 *
 * Supports prefixes: eq, ne, lt, gt, le, ge, ap.
 * For `ap`, uses a ±10% range around the target value.
 */
function buildNumberFragment(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
  startIndex: number,
): WhereFragment {
  const columnName = quoteColumn(impl.columnName);

  // ap (approximately) → BETWEEN (value * 0.9) AND (value * 1.1)
  if (param.prefix === 'ap') {
    return buildApproximateNumberFragment(columnName, param.values, startIndex);
  }

  const operator = prefixToOperator(param.prefix);

  // Convert values to numbers
  const numericValues = param.values.map((v) => {
    const n = parseFloat(v);
    return isNaN(n) ? v : n;
  });

  return buildOrFragmentRaw(columnName, operator, numericValues, startIndex);
}

/**
 * Build a BETWEEN fragment for approximate number matching.
 * Uses ±10% range for each value (FHIR spec).
 */
function buildApproximateNumberFragment(
  columnName: string,
  values: string[],
  startIndex: number,
): WhereFragment {
  if (values.length === 1) {
    const n = parseFloat(values[0]);
    const lo = n * 0.9;
    const hi = n * 1.1;
    const sql = `${columnName} BETWEEN $${startIndex} AND $${startIndex + 1}`;
    return { sql, values: [lo, hi] };
  }

  const conditions: string[] = [];
  const allValues: unknown[] = [];
  let idx = startIndex;
  for (const value of values) {
    const n = parseFloat(value);
    conditions.push(`${columnName} BETWEEN $${idx} AND $${idx + 1}`);
    allValues.push(n * 0.9);
    allValues.push(n * 1.1);
    idx += 2;
  }
  return { sql: `(${conditions.join(' OR ')})`, values: allValues };
}

// =============================================================================
// Section 7: Reference Type
// =============================================================================

/**
 * Build a WHERE fragment for reference search parameters.
 *
 * Reference values can be:
 * - Full reference: `"Patient/123"`
 * - Just the ID: `"123"` (for subject/patient columns, auto-prefixed)
 */
function buildReferenceFragment(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
  startIndex: number,
): WhereFragment {
  const columnName = quoteColumn(impl.columnName);

  // For array reference columns (TEXT[]), use array overlap operator
  if (impl.array) {
    if (param.values.length === 1) {
      const sql = `${columnName} && ARRAY[$${startIndex}]::text[]`;
      return { sql, values: [param.values[0]] };
    }
    const placeholders = param.values.map((_, i) => `$${startIndex + i}`);
    const sql = `${columnName} && ARRAY[${placeholders.join(', ')}]::text[]`;
    return { sql, values: [...param.values] };
  }

  // Scalar reference column — simple equality
  return buildOrFragment(columnName, '=', param.values, startIndex);
}

// =============================================================================
// Section 8: URI Type
// =============================================================================

/**
 * Build a WHERE fragment for URI search parameters.
 *
 * Exact match by default.
 */
function buildUriFragment(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
  startIndex: number,
): WhereFragment {
  const columnName = quoteColumn(impl.columnName);

  // For array URI columns (e.g., _profile TEXT[]), use array overlap
  if (impl.array) {
    const placeholders = param.values.map((_, i) => `$${startIndex + i}`);
    const sql = `${columnName} && ARRAY[${placeholders.join(', ')}]::text[]`;
    return { sql, values: [...param.values] };
  }

  return buildOrFragment(columnName, '=', param.values, startIndex);
}

// =============================================================================
// Section 9: Token Type (column strategy)
// =============================================================================

/**
 * Build a WHERE fragment for token search parameters.
 *
 * Token values can be:
 * - `"code"` → match code only
 * - `"system|code"` → match system and code
 * - `"system|"` → match system only
 * - `"|code"` → match code with no system
 *
 * For token-column strategy, we use ARRAY overlap operators.
 * For column strategy (simple tokens like gender), we use equality.
 */
function buildTokenColumnFragment(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
  startIndex: number,
): WhereFragment {
  // For token-column strategy, the actual DB columns are:
  //   __<name>     UUID[]  (hash column)
  //   __<name>Text TEXT[]  (system|code text column)
  //   __<name>Sort TEXT    (first display/text value for sorting)
  const textColumnName = quoteColumn(`__${impl.columnName}Text`);
  const sortColumnName = quoteColumn(`__${impl.columnName}Sort`);

  // :text modifier — search display text via sort column with ILIKE prefix match
  if (param.modifier === 'text') {
    if (param.values.length === 1) {
      const sql = `LOWER(${sortColumnName}) LIKE $${startIndex}`;
      return { sql, values: [param.values[0].toLowerCase() + '%'] };
    }
    const conditions: string[] = [];
    const allValues: unknown[] = [];
    for (let i = 0; i < param.values.length; i++) {
      conditions.push(`LOWER(${sortColumnName}) LIKE $${startIndex + i}`);
      allValues.push(param.values[i].toLowerCase() + '%');
    }
    return { sql: `(${conditions.join(' OR ')})`, values: allValues };
  }

  // Check for system| pattern (system with any code) — needs LIKE-based search
  const needsLike = param.values.some((v) => v.endsWith('|'));
  if (needsLike) {
    const conditions: string[] = [];
    const allValues: unknown[] = [];
    let idx = startIndex;
    for (const value of param.values) {
      if (value.endsWith('|')) {
        // system| → match any entry starting with "system|"
        conditions.push(
          `EXISTS (SELECT 1 FROM unnest(${textColumnName}) __t WHERE __t LIKE $${idx})`,
        );
        allValues.push(value + '%');
      } else {
        // Normal value — array overlap
        conditions.push(`${textColumnName} && ARRAY[$${idx}]::text[]`);
        allValues.push(value.startsWith('|') ? value.slice(1) : value);
      }
      idx++;
    }
    const sql = param.modifier === 'not'
      ? `NOT (${conditions.join(' OR ')})`
      : conditions.length === 1
        ? conditions[0]
        : `(${conditions.join(' OR ')})`;
    return { sql, values: allValues };
  }

  // For |code pattern, strip the leading pipe and search for plain code
  const resolvedValues = param.values.map((v) => (v.startsWith('|') ? v.slice(1) : v));

  if (param.modifier === 'not') {
    // NOT: none of the values should be in the array
    if (resolvedValues.length === 1) {
      const sql = `NOT (${textColumnName} && ARRAY[$${startIndex}]::text[])`;
      return { sql, values: [resolvedValues[0]] };
    }
    const placeholders = resolvedValues.map((_, i) => `$${startIndex + i}`);
    const sql = `NOT (${textColumnName} && ARRAY[${placeholders.join(', ')}]::text[])`;
    return { sql, values: [...resolvedValues] };
  }

  // Default: array overlap — any of the values match
  if (resolvedValues.length === 1) {
    const sql = `${textColumnName} && ARRAY[$${startIndex}]::text[]`;
    return { sql, values: [resolvedValues[0]] };
  }

  const placeholders = resolvedValues.map((_, i) => `$${startIndex + i}`);
  const sql = `${textColumnName} && ARRAY[${placeholders.join(', ')}]::text[]`;
  return { sql, values: [...resolvedValues] };
}

// =============================================================================
// Section 10: Default / Fallback
// =============================================================================

/**
 * Build a WHERE fragment for unknown or unsupported parameter types.
 * Falls back to simple equality.
 */
function buildDefaultFragment(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
  startIndex: number,
): WhereFragment {
  const columnName = quoteColumn(impl.columnName);
  const operator = prefixToOperator(param.prefix);
  return buildOrFragment(columnName, operator, param.values, startIndex);
}

// =============================================================================
// Section 11: Shared Helpers
// =============================================================================

/**
 * Build an OR fragment for multiple values with the same operator.
 *
 * Single value: `"col" = $1`
 * Multiple values: `("col" = $1 OR "col" = $2)`
 */
function buildOrFragment(
  columnName: string,
  operator: string,
  values: string[],
  startIndex: number,
): WhereFragment {
  return buildOrFragmentRaw(columnName, operator, values, startIndex);
}

/**
 * Build an OR fragment with raw (non-string) values.
 */
function buildOrFragmentRaw(
  columnName: string,
  operator: string,
  values: unknown[],
  startIndex: number,
): WhereFragment {
  if (values.length === 1) {
    const sql = `${columnName} ${operator} $${startIndex}`;
    return { sql, values: [values[0]] };
  }

  const conditions: string[] = [];
  const allValues: unknown[] = [];
  let idx = startIndex;

  for (const value of values) {
    conditions.push(`${columnName} ${operator} $${idx}`);
    allValues.push(value);
    idx++;
  }

  const sql = `(${conditions.join(' OR ')})`;
  return { sql, values: allValues };
}

/**
 * Double-quote a column name for safe SQL usage.
 */
function quoteColumn(name: string): string {
  return `"${name}"`;
}

/**
 * Escape special characters in a LIKE pattern.
 *
 * Escapes `%`, `_`, and `\` with a backslash.
 */
function escapeLikeString(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

// =============================================================================
// Section 12: Composite WHERE Builder
// =============================================================================

/**
 * Build a complete WHERE clause from multiple parsed search parameters.
 *
 * Multiple parameters are joined with AND.
 * Returns null if no valid fragments are produced.
 *
 * @param params - The parsed search parameters.
 * @param registry - The SearchParameterRegistry for looking up implementations.
 * @param resourceType - The FHIR resource type.
 * @returns A WhereFragment with the combined WHERE clause, or null.
 */
export function buildWhereClause(
  params: ParsedSearchParam[],
  registry: SearchParameterRegistry,
  resourceType: string,
): WhereFragment | null {
  const fragments: WhereFragment[] = [];
  let paramIndex = 1;

  for (const param of params) {
    // Handle chained search parameters
    if (param.chain) {
      const fragment = buildChainedFragment(param, param.chain, registry, resourceType, paramIndex);
      if (fragment) {
        fragments.push(fragment);
        paramIndex += fragment.values.length;
      }
      continue;
    }

    // Handle special parameters
    const impl = resolveImpl(param, registry, resourceType);
    if (!impl) {
      continue;
    }

    const fragment = buildWhereFragment(impl, param, paramIndex);
    if (fragment) {
      fragments.push(fragment);
      paramIndex += fragment.values.length;
    }
  }

  if (fragments.length === 0) {
    return null;
  }

  const sql = fragments.map((f) => f.sql).join(' AND ');
  const values = fragments.flatMap((f) => f.values);
  return { sql, values };
}

/**
 * Resolve a SearchParameterImpl for a parsed parameter.
 *
 * Handles special parameters (_id, _lastUpdated) with synthetic impls.
 */
function resolveImpl(
  param: ParsedSearchParam,
  registry: SearchParameterRegistry,
  resourceType: string,
): SearchParameterImpl | null {
  // Special parameters with fixed columns
  switch (param.code) {
    case '_id':
      return {
        code: '_id',
        type: 'uri',
        resourceTypes: [resourceType],
        expression: 'id',
        strategy: 'column',
        columnName: 'id',
        columnType: 'TEXT',
        array: false,
      };
    case '_lastUpdated':
      return {
        code: '_lastUpdated',
        type: 'date',
        resourceTypes: [resourceType],
        expression: 'meta.lastUpdated',
        strategy: 'column',
        columnName: 'lastUpdated',
        columnType: 'TIMESTAMPTZ',
        array: false,
      };
    case '_tag':
      return {
        code: '_tag',
        type: 'token',
        resourceTypes: [resourceType],
        expression: 'meta.tag',
        strategy: 'token-column',
        columnName: '_tag',
        columnType: 'TEXT[]',
        array: true,
      };
    case '_security':
      return {
        code: '_security',
        type: 'token',
        resourceTypes: [resourceType],
        expression: 'meta.security',
        strategy: 'token-column',
        columnName: '_security',
        columnType: 'TEXT[]',
        array: true,
      };
    case '_profile':
      return {
        code: '_profile',
        type: 'uri',
        resourceTypes: [resourceType],
        expression: 'meta.profile',
        strategy: 'column',
        columnName: '_profile',
        columnType: 'TEXT[]',
        array: true,
      };
    case '_source':
      return {
        code: '_source',
        type: 'uri',
        resourceTypes: [resourceType],
        expression: 'meta.source',
        strategy: 'column',
        columnName: '_source',
        columnType: 'TEXT',
        array: false,
      };
    default:
      return registry.getImpl(resourceType, param.code) ?? null;
  }
}

// =============================================================================
// Section 13: v2 WHERE Builder (SQLite ? placeholders)
// =============================================================================

/**
 * v2: Build a WHERE clause fragment using ? placeholders (SQLite).
 *
 * Dispatches to type-specific v2 builders. Key differences from v1:
 * - Uses `?` instead of `$N`
 * - Token search uses `json_each()` instead of `ARRAY[]::text[]`
 * - Array columns use `json_each()` instead of PG array operators
 */
export function buildWhereFragmentV2(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
): WhereFragment | null {
  if (param.modifier === 'missing') {
    return buildMissingFragmentV2(impl, param);
  }

  if (impl.strategy === 'lookup-table') {
    return buildLookupTableFragmentV2(impl, param);
  }

  if (impl.strategy === 'token-column') {
    return buildTokenColumnFragmentV2(impl, param);
  }

  switch (impl.type) {
    case 'string':
      return buildStringFragmentV2(impl, param);
    case 'date':
      return buildDateFragmentV2(impl, param);
    case 'number':
    case 'quantity':
      return buildNumberFragmentV2(impl, param);
    case 'reference':
      return buildReferenceFragmentV2(impl, param);
    case 'uri':
      return buildUriFragmentV2(impl, param);
    case 'token':
      return buildTokenColumnFragmentV2(impl, param);
    default:
      return buildDefaultFragmentV2(impl, param);
  }
}

// -- v2 :missing --
function buildMissingFragmentV2(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
): WhereFragment {
  const isMissing = param.values[0] === 'true';
  const col = quoteColumn(impl.columnName);
  return { sql: isMissing ? `${col} IS NULL` : `${col} IS NOT NULL`, values: [] };
}

// -- v2 lookup-table --
function buildLookupTableFragmentV2(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
): WhereFragment {
  const mapping = LOOKUP_TABLE_MAP[impl.code];
  if (!mapping) {
    const sortCol = quoteColumn(`__${impl.columnName}Sort`);
    if (param.modifier === 'exact') return buildOrFragmentV2(sortCol, '=', param.values);
    if (param.modifier === 'contains') return buildLikeFragmentV2(sortCol, param.values, '%', '%');
    return buildLikeFragmentV2(sortCol, param.values, '', '%');
  }
  const { table, column } = mapping;
  const colRef = `__lookup."${column}"`;
  if (param.modifier === 'exact') {
    if (param.values.length === 1) {
      return { sql: `EXISTS (SELECT 1 FROM "${table}" __lookup WHERE __lookup."resourceId" = "id" AND ${colRef} = ?)`, values: [param.values[0]] };
    }
    const conds = param.values.map(() => `${colRef} = ?`);
    return { sql: `EXISTS (SELECT 1 FROM "${table}" __lookup WHERE __lookup."resourceId" = "id" AND (${conds.join(' OR ')}))`, values: [...param.values] };
  }
  if (param.modifier === 'contains') {
    if (param.values.length === 1) {
      return { sql: `EXISTS (SELECT 1 FROM "${table}" __lookup WHERE __lookup."resourceId" = "id" AND LOWER(${colRef}) LIKE ?)`, values: [`%${param.values[0].toLowerCase()}%`] };
    }
    const conds = param.values.map(() => `LOWER(${colRef}) LIKE ?`);
    return { sql: `EXISTS (SELECT 1 FROM "${table}" __lookup WHERE __lookup."resourceId" = "id" AND (${conds.join(' OR ')}))`, values: param.values.map(v => `%${v.toLowerCase()}%`) };
  }
  // default prefix match
  if (param.values.length === 1) {
    return { sql: `EXISTS (SELECT 1 FROM "${table}" __lookup WHERE __lookup."resourceId" = "id" AND LOWER(${colRef}) LIKE ?)`, values: [`${param.values[0].toLowerCase()}%`] };
  }
  const conds = param.values.map(() => `LOWER(${colRef}) LIKE ?`);
  return { sql: `EXISTS (SELECT 1 FROM "${table}" __lookup WHERE __lookup."resourceId" = "id" AND (${conds.join(' OR ')}))`, values: param.values.map(v => `${v.toLowerCase()}%`) };
}

// -- v2 string --
function buildStringFragmentV2(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
): WhereFragment {
  const col = quoteColumn(impl.columnName);
  if (param.modifier === 'exact') return buildOrFragmentV2(col, '=', param.values);
  if (param.modifier === 'contains') return buildLikeFragmentV2(col, param.values, '%', '%');
  return buildLikeFragmentV2(col, param.values, '', '%');
}

// -- v2 date --
function buildDateFragmentV2(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
): WhereFragment {
  const col = quoteColumn(impl.columnName);
  if (param.prefix === 'ap') {
    if (param.values.length === 1) {
      const d = new Date(param.values[0]);
      const lo = new Date(d.getTime() - 86_400_000).toISOString();
      const hi = new Date(d.getTime() + 86_400_000).toISOString();
      return { sql: `${col} BETWEEN ? AND ?`, values: [lo, hi] };
    }
    const conds: string[] = [];
    const vals: unknown[] = [];
    for (const v of param.values) {
      conds.push(`${col} BETWEEN ? AND ?`);
      const d = new Date(v);
      vals.push(new Date(d.getTime() - 86_400_000).toISOString());
      vals.push(new Date(d.getTime() + 86_400_000).toISOString());
    }
    return { sql: `(${conds.join(' OR ')})`, values: vals };
  }
  const op = prefixToOperator(param.prefix);
  return buildOrFragmentV2(col, op, param.values);
}

// -- v2 number/quantity --
function buildNumberFragmentV2(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
): WhereFragment {
  const col = quoteColumn(impl.columnName);
  if (param.prefix === 'ap') {
    if (param.values.length === 1) {
      const n = parseFloat(param.values[0]);
      return { sql: `${col} BETWEEN ? AND ?`, values: [n * 0.9, n * 1.1] };
    }
    const conds: string[] = [];
    const vals: unknown[] = [];
    for (const v of param.values) {
      const n = parseFloat(v);
      conds.push(`${col} BETWEEN ? AND ?`);
      vals.push(n * 0.9, n * 1.1);
    }
    return { sql: `(${conds.join(' OR ')})`, values: vals };
  }
  const op = prefixToOperator(param.prefix);
  const numVals = param.values.map(v => { const n = parseFloat(v); return isNaN(n) ? v : n; });
  return buildOrFragmentV2Raw(col, op, numVals);
}

// -- v2 reference --
function buildReferenceFragmentV2(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
): WhereFragment {
  const col = quoteColumn(impl.columnName);
  // For array reference columns in SQLite, use json_each
  if (impl.array) {
    if (param.values.length === 1) {
      return { sql: `EXISTS (SELECT 1 FROM json_each(${col}) WHERE json_each.value = ?)`, values: [param.values[0]] };
    }
    const placeholders = param.values.map(() => '?').join(', ');
    return { sql: `EXISTS (SELECT 1 FROM json_each(${col}) WHERE json_each.value IN (${placeholders}))`, values: [...param.values] };
  }
  return buildOrFragmentV2(col, '=', param.values);
}

// -- v2 uri --
function buildUriFragmentV2(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
): WhereFragment {
  const col = quoteColumn(impl.columnName);
  if (impl.array) {
    if (param.values.length === 1) {
      return { sql: `EXISTS (SELECT 1 FROM json_each(${col}) WHERE json_each.value = ?)`, values: [param.values[0]] };
    }
    const placeholders = param.values.map(() => '?').join(', ');
    return { sql: `EXISTS (SELECT 1 FROM json_each(${col}) WHERE json_each.value IN (${placeholders}))`, values: [...param.values] };
  }
  return buildOrFragmentV2(col, '=', param.values);
}

// -- v2 token (json_each for SQLite) --
function buildTokenColumnFragmentV2(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
): WhereFragment {
  // v2 token columns: __<name>Text is a JSON array string (TEXT), __<name>Sort is TEXT
  const textCol = quoteColumn(`__${impl.columnName}Text`);
  const sortCol = quoteColumn(`__${impl.columnName}Sort`);

  // :text modifier — search display text via sort column
  if (param.modifier === 'text') {
    return buildLikeFragmentV2(sortCol, param.values, '', '%');
  }

  // system| pattern
  const needsLike = param.values.some(v => v.endsWith('|'));
  if (needsLike) {
    const conds: string[] = [];
    const vals: unknown[] = [];
    for (const value of param.values) {
      if (value.endsWith('|')) {
        conds.push(`EXISTS (SELECT 1 FROM json_each(${textCol}) WHERE json_each.value LIKE ?)`);
        vals.push(value + '%');
      } else {
        conds.push(`EXISTS (SELECT 1 FROM json_each(${textCol}) WHERE json_each.value = ?)`);
        vals.push(value.startsWith('|') ? value.slice(1) : value);
      }
    }
    const inner = conds.length === 1 ? conds[0] : `(${conds.join(' OR ')})`;
    const sql = param.modifier === 'not' ? `NOT (${inner})` : inner;
    return { sql, values: vals };
  }

  const resolvedValues = param.values.map(v => v.startsWith('|') ? v.slice(1) : v);

  if (param.modifier === 'not') {
    if (resolvedValues.length === 1) {
      return { sql: `NOT EXISTS (SELECT 1 FROM json_each(${textCol}) WHERE json_each.value = ?)`, values: [resolvedValues[0]] };
    }
    const placeholders = resolvedValues.map(() => '?').join(', ');
    return { sql: `NOT EXISTS (SELECT 1 FROM json_each(${textCol}) WHERE json_each.value IN (${placeholders}))`, values: [...resolvedValues] };
  }

  // Default: any value matches
  if (resolvedValues.length === 1) {
    return { sql: `EXISTS (SELECT 1 FROM json_each(${textCol}) WHERE json_each.value = ?)`, values: [resolvedValues[0]] };
  }
  const placeholders = resolvedValues.map(() => '?').join(', ');
  return { sql: `EXISTS (SELECT 1 FROM json_each(${textCol}) WHERE json_each.value IN (${placeholders}))`, values: [...resolvedValues] };
}

// -- v2 default --
function buildDefaultFragmentV2(
  impl: SearchParameterImpl,
  param: ParsedSearchParam,
): WhereFragment {
  const col = quoteColumn(impl.columnName);
  const op = prefixToOperator(param.prefix);
  return buildOrFragmentV2(col, op, param.values);
}

// -- v2 shared helpers --
function buildOrFragmentV2(col: string, op: string, values: string[]): WhereFragment {
  return buildOrFragmentV2Raw(col, op, values);
}

function buildOrFragmentV2Raw(col: string, op: string, values: unknown[]): WhereFragment {
  if (values.length === 1) {
    return { sql: `${col} ${op} ?`, values: [values[0]] };
  }
  const conds = values.map(() => `${col} ${op} ?`);
  return { sql: `(${conds.join(' OR ')})`, values: [...values] };
}

function buildLikeFragmentV2(col: string, values: string[], prefix: string, suffix: string): WhereFragment {
  if (values.length === 1) {
    const escaped = escapeLikeString(values[0]).toLowerCase();
    return { sql: `LOWER(${col}) LIKE ?`, values: [`${prefix}${escaped}${suffix}`] };
  }
  const conds: string[] = [];
  const vals: unknown[] = [];
  for (const v of values) {
    conds.push(`LOWER(${col}) LIKE ?`);
    vals.push(`${prefix}${escapeLikeString(v).toLowerCase()}${suffix}`);
  }
  return { sql: `(${conds.join(' OR ')})`, values: vals };
}

/**
 * v2: Build a WHERE fragment for chained search using ? placeholders.
 *
 * Chained search: `subject:Patient.name=Smith`
 * Generated SQL (SQLite):
 * ```sql
 * EXISTS (
 *   SELECT 1 FROM "Observation_References" __ref
 *   JOIN "Patient" __target ON __ref."targetId" = __target."id"
 *   WHERE __ref."resourceId" = "Observation"."id"
 *     AND __ref."code" = ?
 *     AND __target."deleted" = 0
 *     AND <target param condition>
 * )
 * ```
 */
function buildChainedFragmentV2(
  param: ParsedSearchParam,
  chain: ChainedSearchTarget,
  registry: SearchParameterRegistry,
  sourceResourceType: string,
): WhereFragment | null {
  // Resolve the target param implementation on the TARGET resource type
  const targetImpl = resolveImplV2(
    { code: chain.targetParam, values: param.values, modifier: param.modifier, prefix: param.prefix },
    registry,
    chain.targetType,
  );
  if (!targetImpl) return null;

  // Build the inner WHERE condition for the target table
  const innerParam: ParsedSearchParam = {
    code: chain.targetParam,
    values: param.values,
    modifier: param.modifier,
    prefix: param.prefix,
  };

  const innerFragment = buildWhereFragmentV2(targetImpl, innerParam);
  if (!innerFragment) return null;

  // Rewrite the inner SQL to prefix column names with __target.
  const innerSql = rewriteColumnRefsForAlias(innerFragment.sql, '__target');

  const refTable = `${sourceResourceType}_References`;
  const sql = [
    `EXISTS (`,
    `  SELECT 1 FROM "${refTable}" __ref`,
    `  JOIN "${chain.targetType}" __target ON __ref."targetId" = __target."id"`,
    `  WHERE __ref."resourceId" = "${sourceResourceType}"."id"`,
    `    AND __ref."code" = ?`,
    `    AND __ref."targetType" = ?`,
    `    AND __target."deleted" = 0`,
    `    AND ${innerSql}`,
    `)`,
  ].join('\n');

  return { sql, values: [param.code, chain.targetType, ...innerFragment.values] };
}

/**
 * v2: Build a complete WHERE clause from parsed search params using ? placeholders.
 */
export function buildWhereClauseV2(
  params: ParsedSearchParam[],
  registry: SearchParameterRegistry,
  resourceType: string,
): WhereFragment | null {
  const fragments: WhereFragment[] = [];

  for (const param of params) {
    // Handle chained search parameters (subject:Patient.name=Smith)
    if (param.chain) {
      const fragment = buildChainedFragmentV2(param, param.chain, registry, resourceType);
      if (fragment) {
        fragments.push(fragment);
      }
      continue;
    }

    const impl = resolveImplV2(param, registry, resourceType);
    if (!impl) continue;

    const fragment = buildWhereFragmentV2(impl, param);
    if (fragment) {
      fragments.push(fragment);
    }
  }

  if (fragments.length === 0) return null;

  const sql = fragments.map(f => f.sql).join(' AND ');
  const values = fragments.flatMap(f => f.values);
  return { sql, values };
}

/**
 * v2: Resolve a SearchParameterImpl for special + registry params.
 */
function resolveImplV2(
  param: ParsedSearchParam,
  registry: SearchParameterRegistry,
  resourceType: string,
): SearchParameterImpl | null {
  switch (param.code) {
    case '_id':
      return { code: '_id', type: 'uri', resourceTypes: [resourceType], expression: 'id', strategy: 'column', columnName: 'id', columnType: 'TEXT', array: false };
    case '_lastUpdated':
      return { code: '_lastUpdated', type: 'date', resourceTypes: [resourceType], expression: 'meta.lastUpdated', strategy: 'column', columnName: 'lastUpdated', columnType: 'TEXT', array: false };
    case '_tag':
      return { code: '_tag', type: 'token', resourceTypes: [resourceType], expression: 'meta.tag', strategy: 'token-column', columnName: '_tag', columnType: 'TEXT', array: true };
    case '_security':
      return { code: '_security', type: 'token', resourceTypes: [resourceType], expression: 'meta.security', strategy: 'token-column', columnName: '_security', columnType: 'TEXT', array: true };
    case '_profile':
      return { code: '_profile', type: 'uri', resourceTypes: [resourceType], expression: 'meta.profile', strategy: 'column', columnName: '_profile', columnType: 'TEXT', array: true };
    case '_source':
      return { code: '_source', type: 'uri', resourceTypes: [resourceType], expression: 'meta.source', strategy: 'column', columnName: '_source', columnType: 'TEXT', array: false };
    default:
      return registry.getImpl(resourceType, param.code) ?? null;
  }
}
