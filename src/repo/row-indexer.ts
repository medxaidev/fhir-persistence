/**
 * Row Indexer
 *
 * Extracts search parameter values from FHIR resource JSON and produces
 * column name → value pairs for the main table's search columns.
 *
 * Phase 14: Uses simplified property path extraction (not full FHIRPath).
 * Full FHIRPath evaluation can be added in a future phase.
 *
 * @module fhir-persistence/repo
 */

import { createHash } from "node:crypto";
import type { SearchParameterImpl } from "../registry/search-parameter-registry.js";
import type { LookupTableType } from "../schema/table-schema.js";
import type { FhirResource } from "./types.js";

// =============================================================================
// Section 1: Types
// =============================================================================

/**
 * Search column values to merge into the main table row.
 */
export interface SearchColumnValues {
  [columnName: string]: unknown;
}

// =============================================================================
// Section 2: Token Hashing
// =============================================================================

/**
 * Generate a deterministic UUID-like hash for a token value.
 *
 * Produces a v4-format UUID string from the SHA-256 hash of `system|code`.
 * This matches Medplum's approach of using a deterministic hash for token
 * search columns (UUID[] type).
 */
export function hashToken(system: string, code: string): string {
  const input = `${system}|${code}`;
  const hash = createHash("sha256").update(input).digest("hex");
  // Format as UUID: 8-4-4-4-12
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

// =============================================================================
// Section 3: Expression Path Parsing
// =============================================================================

/**
 * Extract the property path for a given resource type from a FHIRPath expression.
 *
 * Handles:
 * - Simple: `"Patient.birthDate"` → `["birthDate"]`
 * - Union: `"Patient.name | Practitioner.name"` → `["name"]` (for Patient)
 * - .where(): `"Account.subject.where(resolve() is Patient)"` → `["subject"]`
 * - Nested: `"Observation.value.as(Quantity)"` → `["valueQuantity"]` (special)
 * - Deep: `"Patient.contact.name"` → `["contact", "name"]`
 *
 * @returns Array of path segments, or null if no matching path found.
 */
export function extractPropertyPath(
  expression: string,
  resourceType: string,
): string[] | null {
  if (!expression) return null;

  // Split by union operator and find the path for this resource type
  const parts = expression.split("|").map((p) => p.trim());
  let matchedPath: string | null = null;

  for (const part of parts) {
    if (part.startsWith(`${resourceType}.`)) {
      matchedPath = part;
      break;
    }
  }

  if (!matchedPath) return null;

  // Strip resource type prefix
  let path = matchedPath.slice(resourceType.length + 1);

  // Strip .where(...) clauses (handles nested parens like .where(resolve() is Patient))
  // Use greedy match to consume all content including nested parens
  path = path.replace(/\.where\(.*\)/g, "");

  // Strip .as(...) type casts
  path = path.replace(/\.as\([^)]*\)/g, "");

  // Strip .resolve() calls
  path = path.replace(/\.resolve\(\)/g, "");

  // Strip trailing dots
  path = path.replace(/\.+$/, "");

  if (!path) return null;

  return path.split(".");
}

// =============================================================================
// Section 4: Value Extraction
// =============================================================================

/**
 * Navigate a resource object using a property path and return the value(s).
 *
 * Handles arrays at any level — if a path segment hits an array,
 * the remaining path is applied to each element.
 *
 * @returns Array of extracted values (may be empty).
 */
export function getNestedValues(
  obj: unknown,
  pathSegments: string[],
): unknown[] {
  if (obj === null || obj === undefined) return [];

  if (Array.isArray(obj)) {
    // Flatten: apply remaining path to each array element
    const results: unknown[] = [];
    for (const item of obj) {
      results.push(...getNestedValues(item, pathSegments));
    }
    return results;
  }

  if (pathSegments.length === 0) return [obj];

  const [head, ...rest] = pathSegments;

  if (typeof obj === "object") {
    const record = obj as Record<string, unknown>;
    const value = record[head];
    if (value === undefined || value === null) return [];
    return getNestedValues(value, rest);
  }

  return [];
}

/**
 * Extract a reference string from a FHIR Reference object.
 *
 * Input: `{ reference: "Patient/123", display: "John" }`
 * Output: `"Patient/123"`
 */
function extractReferenceValue(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const ref = (value as Record<string, unknown>).reference;
    if (typeof ref === "string") return ref;
  }
  return null;
}

/**
 * Extract token values (system|code pairs) from a FHIR value.
 *
 * Handles:
 * - Coding: `{ system, code, display }`
 * - CodeableConcept: `{ coding: [{ system, code }], text }`
 * - code (string): plain string value
 * - boolean: `"true"` or `"false"`
 * - Identifier: `{ system, value }`
 */
function extractTokenValues(
  value: unknown,
): Array<{ system: string; code: string; display: string }> {
  if (value === null || value === undefined) return [];

  // Boolean
  if (typeof value === "boolean") {
    return [{ system: "", code: String(value), display: String(value) }];
  }

  // Plain string (code)
  if (typeof value === "string") {
    return [{ system: "", code: value, display: value }];
  }

  if (typeof value !== "object") return [];

  const obj = value as Record<string, unknown>;

  // CodeableConcept: has `coding` array
  if (Array.isArray(obj.coding)) {
    const results: Array<{ system: string; code: string; display: string }> =
      [];
    for (const coding of obj.coding) {
      if (typeof coding === "object" && coding !== null) {
        const c = coding as Record<string, unknown>;
        const system = typeof c.system === "string" ? c.system : "";
        const code = typeof c.code === "string" ? c.code : "";
        const display = typeof c.display === "string" ? c.display : "";
        if (code) {
          results.push({ system, code, display });
        }
      }
    }
    // Also include text if present
    if (typeof obj.text === "string" && results.length === 0) {
      results.push({ system: "", code: obj.text, display: obj.text });
    }
    return results;
  }

  // Coding: has `code` field (but not `coding` array)
  if (typeof obj.code === "string") {
    const system = typeof obj.system === "string" ? obj.system : "";
    const display = typeof obj.display === "string" ? obj.display : "";
    return [{ system, code: obj.code, display }];
  }

  // Identifier: has `value` field
  if (typeof obj.value === "string") {
    const system = typeof obj.system === "string" ? obj.system : "";
    return [{ system, code: obj.value, display: obj.value }];
  }

  return [];
}

/**
 * Extract a sort-friendly string from a HumanName or Address value.
 *
 * HumanName: family + " " + given.join(" ")
 * Address: line.join(" ") + " " + city + " " + state + " " + postalCode
 * String: as-is
 */
function extractSortString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value !== "object" || value === null) return null;

  const obj = value as Record<string, unknown>;

  // HumanName
  if (typeof obj.family === "string" || Array.isArray(obj.given)) {
    const parts: string[] = [];
    if (typeof obj.family === "string") parts.push(obj.family);
    if (Array.isArray(obj.given)) {
      for (const g of obj.given) {
        if (typeof g === "string") parts.push(g);
      }
    }
    return parts.join(" ") || null;
  }

  // Address
  if (Array.isArray(obj.line) || typeof obj.city === "string") {
    const parts: string[] = [];
    if (Array.isArray(obj.line)) {
      for (const l of obj.line) {
        if (typeof l === "string") parts.push(l);
      }
    }
    if (typeof obj.city === "string") parts.push(obj.city);
    if (typeof obj.state === "string") parts.push(obj.state);
    if (typeof obj.postalCode === "string") parts.push(obj.postalCode);
    if (typeof obj.country === "string") parts.push(obj.country);
    return parts.join(" ") || null;
  }

  // ContactPoint (telecom)
  if (typeof obj.value === "string") {
    return obj.value;
  }

  return null;
}

// =============================================================================
// Section 5: Main Entry Point
// =============================================================================

/**
 * Build search column values for a FHIR resource.
 *
 * Given a resource and its applicable SearchParameterImpl list,
 * extracts values from the resource JSON and returns a map of
 * column name → value pairs ready for SQL insertion.
 *
 * @param resource - The FHIR resource to index.
 * @param impls - SearchParameterImpl list for this resource type.
 * @returns Column name → value map for search columns.
 */
export function buildSearchColumns(
  resource: FhirResource,
  impls: SearchParameterImpl[],
): SearchColumnValues {
  const columns: SearchColumnValues = {};
  const resourceType = resource.resourceType;

  for (const impl of impls) {
    const path = extractPropertyPath(impl.expression, resourceType);
    if (!path) continue;

    switch (impl.strategy) {
      case "column":
        populateColumnStrategy(resource, impl, path, columns);
        break;
      case "token-column":
        populateTokenColumnStrategy(resource, impl, path, columns);
        break;
      case "lookup-table":
        populateLookupTableStrategy(resource, impl, path, columns);
        break;
    }
  }

  return columns;
}

// =============================================================================
// Section 6: Strategy Handlers
// =============================================================================

/**
 * Populate a direct column value (string, date, reference, number, uri).
 */
function populateColumnStrategy(
  resource: FhirResource,
  impl: SearchParameterImpl,
  path: string[],
  columns: SearchColumnValues,
): void {
  const values = getNestedValues(resource, path);
  if (values.length === 0) return;

  if (impl.type === "reference") {
    const refs = values
      .map(extractReferenceValue)
      .filter((r): r is string => r !== null);
    if (refs.length === 0) return;

    if (impl.array) {
      columns[impl.columnName] = refs;
    } else {
      columns[impl.columnName] = refs[0];
    }
    return;
  }

  // For date, number, string, uri — take the first primitive value
  const primitives = values.filter(
    (v) =>
      typeof v === "string" || typeof v === "number" || typeof v === "boolean",
  );
  if (primitives.length === 0) return;

  if (impl.array) {
    columns[impl.columnName] = primitives;
  } else {
    columns[impl.columnName] = primitives[0];
  }
}

/**
 * Populate token-column values (3 columns: hash UUID[], text TEXT[], sort TEXT).
 */
function populateTokenColumnStrategy(
  resource: FhirResource,
  impl: SearchParameterImpl,
  path: string[],
  columns: SearchColumnValues,
): void {
  const values = getNestedValues(resource, path);
  if (values.length === 0) return;

  const allTokens: Array<{ system: string; code: string; display: string }> =
    [];
  for (const val of values) {
    allTokens.push(...extractTokenValues(val));
  }

  if (allTokens.length === 0) return;

  // Hash column: __<name> UUID[]
  const hashes = allTokens.map((t) => hashToken(t.system, t.code));
  columns[`__${impl.columnName}`] = hashes;

  // Text column: __<name>Text TEXT[]
  const texts = allTokens.map((t) =>
    t.system ? `${t.system}|${t.code}` : t.code,
  );
  columns[`__${impl.columnName}Text`] = texts;

  // Sort column: __<name>Sort TEXT — stores display text for :text modifier search
  // Falls back to system|code if no display is available
  const sortValue = allTokens[0].display || texts[0] || null;
  columns[`__${impl.columnName}Sort`] = sortValue;
}

/**
 * Populate lookup-table sort column only (__<name>Sort TEXT).
 *
 * The actual lookup table data is written separately (future phase).
 */
function populateLookupTableStrategy(
  resource: FhirResource,
  impl: SearchParameterImpl,
  path: string[],
  columns: SearchColumnValues,
): void {
  const values = getNestedValues(resource, path);
  if (values.length === 0) return;

  // Extract sort string from first value
  const sortStr = extractSortString(values[0]);
  if (sortStr) {
    columns[`__${impl.columnName}Sort`] = sortStr;
  }
}

// =============================================================================
// Section 6b: Shared Token Aggregation
// =============================================================================

/**
 * Build shared token columns by aggregating token values from
 * `identifier`, `_tag`, and `_security` into unified arrays.
 *
 * Called after buildSearchColumns() and buildMetadataColumns()
 * to merge their token values.
 */
export function buildSharedTokenColumns(
  searchCols: SearchColumnValues,
  metadataCols: SearchColumnValues,
): SearchColumnValues {
  const allHashes: string[] = [];
  const allTexts: string[] = [];

  // Collect from identifier token columns (search columns)
  if (Array.isArray(searchCols["__identifier"])) {
    allHashes.push(...(searchCols["__identifier"] as string[]));
  }
  if (Array.isArray(searchCols["__identifierText"])) {
    allTexts.push(...(searchCols["__identifierText"] as string[]));
  }

  // Collect from _tag (metadata columns — triple underscore)
  if (Array.isArray(metadataCols["___tag"])) {
    allHashes.push(...(metadataCols["___tag"] as string[]));
  }
  if (Array.isArray(metadataCols["___tagText"])) {
    allTexts.push(...(metadataCols["___tagText"] as string[]));
  }

  // Collect from _security (metadata columns — triple underscore)
  if (Array.isArray(metadataCols["___security"])) {
    allHashes.push(...(metadataCols["___security"] as string[]));
  }
  if (Array.isArray(metadataCols["___securityText"])) {
    allTexts.push(...(metadataCols["___securityText"] as string[]));
  }

  const result: SearchColumnValues = {};
  if (allHashes.length > 0) {
    result["__sharedTokens"] = allHashes;
  }
  if (allTexts.length > 0) {
    result["__sharedTokensText"] = allTexts;
  }
  return result;
}

// =============================================================================
// Section 7: Metadata Column Population
// =============================================================================

/**
 * Build metadata search column values from a FHIR resource's `meta` element.
 *
 * Extracts `meta.tag` and `meta.security` into the fixed metadata columns:
 * - `___tag UUID[]`, `___tagText TEXT[]`, `___tagSort TEXT` (triple underscore — matches Medplum)
 * - `___security UUID[]`, `___securityText TEXT[]`, `___securitySort TEXT`
 *
 * These columns exist on every main table and are independent of the
 * SearchParameterRegistry (they apply to all resource types).
 *
 * @param resource - The FHIR resource to extract metadata from.
 * @returns Column name → value map for metadata search columns.
 */
export function buildMetadataColumns(
  resource: FhirResource,
): SearchColumnValues {
  const columns: SearchColumnValues = {};
  const meta = (resource as Record<string, unknown>).meta as
    | Record<string, unknown>
    | undefined;
  if (!meta) return columns;

  // _tag — meta.tag (array of Coding)
  if (Array.isArray(meta.tag)) {
    const tokens: Array<{ system: string; code: string; display: string }> = [];
    for (const tag of meta.tag) {
      tokens.push(...extractTokenValues(tag));
    }
    if (tokens.length > 0) {
      columns["___tag"] = tokens.map((t) => hashToken(t.system, t.code));
      columns["___tagText"] = tokens.map((t) =>
        t.system ? `${t.system}|${t.code}` : t.code,
      );
      columns["___tagSort"] = (columns["___tagText"] as string[])[0] ?? null;
    }
  }

  // _security — meta.security (array of Coding)
  if (Array.isArray(meta.security)) {
    const tokens: Array<{ system: string; code: string; display: string }> = [];
    for (const sec of meta.security) {
      tokens.push(...extractTokenValues(sec));
    }
    if (tokens.length > 0) {
      columns["___security"] = tokens.map((t) => hashToken(t.system, t.code));
      columns["___securityText"] = tokens.map((t) =>
        t.system ? `${t.system}|${t.code}` : t.code,
      );
      columns["___securitySort"] =
        (columns["___securityText"] as string[])[0] ?? null;
    }
  }

  return columns;
}

// =============================================================================
// Section 8: Global Lookup Table Row Extraction
// =============================================================================

/**
 * A row to be inserted into one of the 4 global lookup tables.
 */
export interface LookupTableRow {
  /** Which global table: HumanName, Address, ContactPoint, or Identifier. */
  table: LookupTableType;

  /** Column name → value map for the lookup table row. */
  values: Record<string, unknown>;
}

/**
 * Extract rows for global lookup tables from a FHIR resource.
 *
 * Scans the resource for HumanName, Address, ContactPoint, and Identifier
 * values and decomposes them into individual rows matching Medplum's schema:
 *
 * - `HumanName` → { resourceId, name, given, family }
 * - `Address`   → { resourceId, address, city, country, postalCode, state, use }
 * - `ContactPoint` → { resourceId, system, value, use }
 * - `Identifier` → { resourceId, system, value }
 *
 * @param resource - The FHIR resource (must have `id`).
 * @param impls - SearchParameterImpl list for this resource type.
 * @returns Array of LookupTableRow to insert into global tables.
 */
export function buildLookupTableRows(
  resource: FhirResource & { id: string },
  impls: SearchParameterImpl[],
): LookupTableRow[] {
  const rows: LookupTableRow[] = [];
  const resourceId = resource.id;
  const resourceType = resource.resourceType;

  for (const impl of impls) {
    if (impl.strategy !== "lookup-table") continue;

    const path = extractPropertyPath(impl.expression, resourceType);
    if (!path) continue;

    const values = getNestedValues(resource, path);
    if (values.length === 0) continue;

    for (const val of values) {
      if (val === null || val === undefined) continue;
      const lookupRows = extractLookupRows(resourceId, impl.code, val);
      rows.push(...lookupRows);
    }
  }

  return rows;
}

/**
 * Extract lookup table rows from a single value based on the search param code.
 */
function extractLookupRows(
  resourceId: string,
  code: string,
  value: unknown,
): LookupTableRow[] {
  if (typeof value !== "object" || value === null) {
    return [];
  }

  const obj = value as Record<string, unknown>;

  // HumanName detection: has family or given
  if (code === "name" || code === "given" || code === "family" || code === "phonetic") {
    if (typeof obj.family === "string" || Array.isArray(obj.given)) {
      return extractHumanNameRows(resourceId, obj);
    }
  }

  // Address detection
  if (
    code === "address" ||
    code === "address-city" ||
    code === "address-country" ||
    code === "address-postalcode" ||
    code === "address-state" ||
    code === "address-use"
  ) {
    if (
      Array.isArray(obj.line) ||
      typeof obj.city === "string" ||
      typeof obj.state === "string" ||
      typeof obj.postalCode === "string" ||
      typeof obj.country === "string"
    ) {
      return extractAddressRows(resourceId, obj);
    }
  }

  // ContactPoint detection (telecom)
  if (code === "telecom" || code === "email" || code === "phone") {
    if (typeof obj.value === "string") {
      return extractContactPointRows(resourceId, obj);
    }
  }

  return [];
}

/**
 * Extract HumanName rows. Each HumanName produces one row with:
 * - name: concatenation of all name parts
 * - given: given names joined
 * - family: family name
 */
function extractHumanNameRows(
  resourceId: string,
  obj: Record<string, unknown>,
): LookupTableRow[] {
  const family = typeof obj.family === "string" ? obj.family : null;
  const givenArr = Array.isArray(obj.given)
    ? (obj.given as unknown[]).filter((g): g is string => typeof g === "string")
    : [];
  const given = givenArr.length > 0 ? givenArr.join(" ") : null;

  // Build the composite "name" string (Medplum concatenates all parts)
  const nameParts: string[] = [];
  if (family) nameParts.push(family);
  if (givenArr.length > 0) nameParts.push(...givenArr);
  if (typeof obj.text === "string") nameParts.push(obj.text);
  if (Array.isArray(obj.prefix)) {
    for (const p of obj.prefix) {
      if (typeof p === "string") nameParts.push(p);
    }
  }
  if (Array.isArray(obj.suffix)) {
    for (const s of obj.suffix) {
      if (typeof s === "string") nameParts.push(s);
    }
  }
  const name = nameParts.length > 0 ? nameParts.join(" ") : null;

  return [
    {
      table: "HumanName",
      values: { resourceId, name, given, family },
    },
  ];
}

/**
 * Extract Address rows. Each Address produces one row with decomposed fields.
 */
function extractAddressRows(
  resourceId: string,
  obj: Record<string, unknown>,
): LookupTableRow[] {
  const lines = Array.isArray(obj.line)
    ? (obj.line as unknown[]).filter((l): l is string => typeof l === "string")
    : [];
  const city = typeof obj.city === "string" ? obj.city : null;
  const country = typeof obj.country === "string" ? obj.country : null;
  const postalCode = typeof obj.postalCode === "string" ? obj.postalCode : null;
  const state = typeof obj.state === "string" ? obj.state : null;
  const use = typeof obj.use === "string" ? obj.use : null;

  const addressParts: string[] = [...lines];
  if (city) addressParts.push(city);
  if (state) addressParts.push(state);
  if (postalCode) addressParts.push(postalCode);
  if (country) addressParts.push(country);
  const address = addressParts.length > 0 ? addressParts.join(" ") : null;

  return [
    {
      table: "Address",
      values: { resourceId, address, city, country, postalCode, state, use },
    },
  ];
}

/**
 * Extract ContactPoint rows. Each ContactPoint produces one row.
 */
function extractContactPointRows(
  resourceId: string,
  obj: Record<string, unknown>,
): LookupTableRow[] {
  const system = typeof obj.system === "string" ? obj.system : null;
  const value = typeof obj.value === "string" ? obj.value : null;
  const use = typeof obj.use === "string" ? obj.use : null;

  return [
    {
      table: "ContactPoint",
      values: { resourceId, system, value, use },
    },
  ];
}
