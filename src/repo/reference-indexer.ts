/**
 * Reference Indexer
 *
 * Extracts outgoing reference relationships from FHIR resource JSON
 * and produces rows for the `{ResourceType}_References` table.
 *
 * Used by `FhirRepository` on create/update to populate the references
 * table, which is required for `_revinclude` support.
 *
 * @module fhir-persistence/repo
 */

import type { SearchParameterImpl } from '../registry/search-parameter-registry.js';
import type { FhirResource } from './types.js';
import { extractPropertyPath, getNestedValues } from './row-indexer.js';

// =============================================================================
// Section 1: Types
// =============================================================================

/**
 * A single row for the `{ResourceType}_References` table.
 */
export interface ReferenceRow {
  /** The source resource ID. */
  resourceId: string;
  /** The target resource ID (extracted from the reference string). */
  targetId: string;
  /** The search parameter code (e.g., "subject", "patient"). */
  code: string;
}

// =============================================================================
// Section 2: Reference Extraction
// =============================================================================

/**
 * Extract all outgoing reference rows from a FHIR resource.
 *
 * Iterates over all reference-type search parameters and extracts
 * target resource IDs from the resource JSON.
 *
 * @param resource - The FHIR resource (must have `id`).
 * @param impls - SearchParameterImpl list for this resource type.
 * @returns Array of ReferenceRow ready for SQL insertion.
 */
export function extractReferences(
  resource: FhirResource,
  impls: SearchParameterImpl[],
): ReferenceRow[] {
  const resourceId = resource.id;
  if (!resourceId) return [];

  const rows: ReferenceRow[] = [];
  const resourceType = resource.resourceType;

  for (const impl of impls) {
    if (impl.type !== 'reference') continue;

    const path = extractPropertyPath(impl.expression, resourceType);
    if (!path) continue;

    const values = getNestedValues(resource, path);
    for (const val of values) {
      const targetId = extractTargetId(val);
      if (targetId) {
        rows.push({ resourceId, targetId, code: impl.code });
      }
    }
  }

  return rows;
}

// =============================================================================
// Section 3: Target ID Extraction
// =============================================================================

/**
 * Extract a target resource ID from a FHIR Reference value.
 *
 * Handles:
 * - Reference object: `{ reference: "Patient/123" }` → `"123"`
 * - Reference object with absolute URL: `{ reference: "http://example.com/Patient/123" }` → `"123"`
 * - String value: `"Patient/123"` → `"123"`
 * - Display-only: `{ display: "Dr. Smith" }` → null (skipped)
 */
function extractTargetId(value: unknown): string | null {
  let refString: string | null = null;

  if (typeof value === 'string') {
    refString = value;
  } else if (typeof value === 'object' && value !== null) {
    const ref = (value as Record<string, unknown>).reference;
    if (typeof ref === 'string') {
      refString = ref;
    }
  }

  if (!refString) return null;

  return parseReferenceId(refString);
}

/**
 * Parse a FHIR reference string to extract the target resource ID.
 *
 * - `"Patient/123"` → `"123"`
 * - `"http://example.com/fhir/Patient/123"` → `"123"`
 * - `"urn:uuid:abc-def"` → null (URN references not indexed)
 * - `"#contained"` → null (contained references not indexed)
 */
function parseReferenceId(ref: string): string | null {
  // Skip contained references
  if (ref.startsWith('#')) return null;

  // Skip URN references
  if (ref.startsWith('urn:')) return null;

  // Handle relative or absolute references: take the last segment after "/"
  const slashIdx = ref.lastIndexOf('/');
  if (slashIdx === -1) return null;

  const id = ref.slice(slashIdx + 1);
  if (!id) return null;

  return id;
}
