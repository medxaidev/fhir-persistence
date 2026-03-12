/**
 * Row Builder
 *
 * Converts a FHIR resource into a database row for the main table
 * and history table. Handles fixed columns and (future) search columns.
 *
 * Phase 9 MVP: populates fixed columns + content JSON only.
 * Search column population will be added incrementally.
 *
 * @module fhir-persistence/repo
 */

import type { PersistedResource, ResourceRow, HistoryRow, OperationContext } from "./types.js";
import { SCHEMA_VERSION, DELETED_SCHEMA_VERSION } from "./types.js";
import type { SearchParameterImpl } from "../registry/search-parameter-registry.js";
import {
  buildSearchColumns,
  buildMetadataColumns,
  buildSharedTokenColumns,
  extractPropertyPath,
  getNestedValues,
} from "./row-indexer.js";

// =============================================================================
// Section 1: Main Table Row
// =============================================================================

/**
 * Build a main table row from a persisted FHIR resource.
 *
 * Populates:
 * - Fixed columns: `id`, `content`, `lastUpdated`, `deleted`, `__version`
 * - Meta columns: `_source`, `_profile`
 * - (Future) Search columns via SearchParameterRegistry + FHIRPath
 *
 * @param resource - The persisted resource (must have `id` and `meta`).
 * @returns A `ResourceRow` ready for SQL insertion.
 */
export function buildResourceRow(resource: PersistedResource, context?: OperationContext): ResourceRow {
  const row: ResourceRow = {
    id: resource.id,
    content: JSON.stringify(resource),
    lastUpdated: resource.meta.lastUpdated,
    deleted: false,
    projectId: resolveProjectId(resource, context),
    __version: SCHEMA_VERSION,
    compartments:
      resource.resourceType === "Binary"
        ? undefined
        : buildCompartments(resource),
  };

  // Optional meta columns
  if (resource.meta.source) {
    row._source = resource.meta.source;
  }

  if (resource.meta.profile && resource.meta.profile.length > 0) {
    row._profile = resource.meta.profile;
  }

  return row;
}

/**
 * Build a main table row with search column values populated.
 *
 * Extends `buildResourceRow()` by extracting search parameter values
 * from the resource JSON and merging them into the row.
 *
 * @param resource - The persisted resource.
 * @param searchImpls - SearchParameterImpl list for this resource type.
 * @returns A `ResourceRow` with both fixed and search columns.
 */
export function buildResourceRowWithSearch(
  resource: PersistedResource,
  searchImpls: SearchParameterImpl[],
  context?: OperationContext,
): ResourceRow {
  const fixedRow = buildResourceRow(resource, context);
  const searchCols = buildSearchColumns(resource, searchImpls);
  const metadataCols = buildMetadataColumns(resource);
  const sharedTokenCols = buildSharedTokenColumns(searchCols, metadataCols);

  // Override compartments with full extraction (using search impls)
  const compartments =
    resource.resourceType === "Binary"
      ? undefined
      : buildCompartments(resource, searchImpls);

  return {
    ...fixedRow,
    ...searchCols,
    ...metadataCols,
    ...sharedTokenCols,
    compartments,
  };
}

// =============================================================================
// Section 1b: Compartment Extraction
// =============================================================================

/**
 * Build compartments array for a resource.
 *
 * Phase 18: Full compartment extraction.
 * - Patient resources: compartment = [own ID]
 * - Other resources: scan all reference-type search params for Patient references,
 *   extract the Patient IDs as compartment members.
 *
 * @param resource - The persisted resource.
 * @param searchImpls - Optional SearchParameterImpl list for reference extraction.
 * @returns Array of compartment UUIDs (Patient IDs).
 */
export function buildCompartments(
  resource: PersistedResource,
  searchImpls?: SearchParameterImpl[],
): string[] {
  // Patient resources belong to their own compartment
  if (resource.resourceType === "Patient") {
    return [resource.id];
  }

  if (!searchImpls || searchImpls.length === 0) {
    return [];
  }

  // Scan all reference-type search params for Patient references
  const patientIds = new Set<string>();
  const resourceType = resource.resourceType;

  for (const impl of searchImpls) {
    if (impl.type !== "reference") continue;

    const path = extractPropertyPath(impl.expression, resourceType);
    if (!path) continue;

    const values = getNestedValues(resource, path);
    for (const val of values) {
      const patientId = extractPatientReferenceId(val);
      if (patientId) {
        patientIds.add(patientId);
      }
    }
  }

  // Filter to valid UUIDs only (compartments column is UUID[])
  return [...patientIds].filter(isValidUuid);
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Resolve the projectId for a resource row.
 *
 * Priority:
 * 1. context.project (from OperationContext — multi-tenant scoping)
 * 2. resource.meta.project (legacy/direct injection)
 * 3. Nil UUID fallback (no project context)
 */
function resolveProjectId(resource: PersistedResource, context?: OperationContext): string {
  if (context?.project) {
    return context.project;
  }
  return (
    ((resource.meta as Record<string, unknown>)["project"] as string) ??
    "00000000-0000-0000-0000-000000000000"
  );
}

function extractPatientReferenceId(value: unknown): string | null {
  let refString: string | null = null;

  if (typeof value === "string") {
    refString = value;
  } else if (typeof value === "object" && value !== null) {
    const ref = (value as Record<string, unknown>).reference;
    if (typeof ref === "string") {
      refString = ref;
    }
  }

  if (!refString) return null;

  // Skip contained and URN references
  if (refString.startsWith("#") || refString.startsWith("urn:")) return null;

  // Check if this is a Patient reference
  // Handle both "Patient/id" and "http://example.com/fhir/Patient/id"
  const segments = refString.split("/");
  if (segments.length < 2) return null;

  const id = segments[segments.length - 1];
  const type = segments[segments.length - 2];

  if (type === "Patient" && id) {
    return id;
  }

  return null;
}

// =============================================================================
// Section 2: Delete Row
// =============================================================================

/**
 * Build a main table row for a soft-deleted resource.
 *
 * Sets `deleted=true`, `content=''`, `__version=-1`.
 * All search columns will be null (not populated).
 *
 * @param resourceType - The resource type.
 * @param id - The resource ID.
 * @param lastUpdated - The deletion timestamp.
 * @returns A `ResourceRow` representing the deleted state.
 */
export function buildDeleteRow(
  resourceType: string,
  id: string,
  lastUpdated: string,
  context?: OperationContext,
): ResourceRow {
  return {
    id,
    content: "",
    lastUpdated,
    deleted: true,
    projectId: context?.project ?? "00000000-0000-0000-0000-000000000000",
    __version: DELETED_SCHEMA_VERSION,
    compartments: resourceType === "Binary" ? undefined : [],
  };
}

// =============================================================================
// Section 3: History Table Row
// =============================================================================

/**
 * Build a history table row from a persisted FHIR resource.
 *
 * @param resource - The persisted resource.
 * @returns A `HistoryRow` for the history table.
 */
export function buildHistoryRow(resource: PersistedResource): HistoryRow {
  return {
    id: resource.id,
    versionId: resource.meta.versionId,
    lastUpdated: resource.meta.lastUpdated,
    content: JSON.stringify(resource),
  };
}

/**
 * Build a history table row for a delete event.
 *
 * @param id - The resource ID.
 * @param versionId - The versionId for this delete event.
 * @param lastUpdated - The deletion timestamp.
 * @returns A `HistoryRow` with empty content.
 */
export function buildDeleteHistoryRow(
  id: string,
  versionId: string,
  lastUpdated: string,
): HistoryRow {
  return {
    id,
    versionId,
    lastUpdated,
    content: "",
  };
}
