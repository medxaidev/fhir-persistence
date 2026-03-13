/**
 * URN Resolver — v2
 *
 * Builds a mapping from `urn:uuid:` references to actual resource IDs,
 * and deep-resolves those references within FHIR resources.
 *
 * Key differences from v1 (src/repo/bundle-processor.ts inline logic):
 * - Extracted into a dedicated module for testability
 * - `UrnTarget` carries `resourceType` (not just the string "Type/id")
 * - `deepResolveUrns` is iterative (no recursion depth limit needed)
 * - Only replaces `.reference` fields (FHIR Reference type)
 *
 * @module fhir-persistence/transaction
 */

import { randomUUID } from 'node:crypto';
import type { FhirResource } from '../repo/types.js';

// =============================================================================
// Section 1: Types
// =============================================================================

/**
 * A resolved URN target with explicit resourceType.
 */
export interface UrnTarget {
  /** The assigned resource ID. */
  id: string;
  /** The FHIR resource type (e.g., "Patient"). */
  resourceType: string;
}

/**
 * A single entry in a FHIR Bundle (minimal shape for URN resolution).
 */
export interface BundleEntryForUrn {
  fullUrl?: string;
  resource?: FhirResource;
  request?: {
    method: string;
    url: string;
  };
}

// =============================================================================
// Section 2: buildUrnMap
// =============================================================================

/**
 * Build a mapping from `urn:uuid:` fullUrls to assigned IDs + resourceTypes.
 *
 * Only processes POST entries with `urn:uuid:` fullUrl.
 * Each matching entry gets a newly generated UUID as its assigned ID.
 *
 * The returned map has two key formats for each entry:
 * - `"urn:uuid:<uuid>"` → `UrnTarget` (for fullUrl-based lookup)
 *
 * @param entries - Bundle entries to scan.
 * @returns Map from urn:uuid string to UrnTarget.
 */
export function buildUrnMap(entries: BundleEntryForUrn[]): Map<string, UrnTarget> {
  const map = new Map<string, UrnTarget>();

  for (const entry of entries) {
    if (
      entry.request?.method === 'POST' &&
      entry.fullUrl?.startsWith('urn:uuid:') &&
      entry.resource?.resourceType
    ) {
      const newId = randomUUID();
      map.set(entry.fullUrl, {
        id: newId,
        resourceType: entry.resource.resourceType,
      });
    }
  }

  return map;
}

// =============================================================================
// Section 3: deepResolveUrns
// =============================================================================

/**
 * Replace `urn:uuid:` references in a resource with actual `Type/id` references.
 *
 * Only replaces values in `.reference` fields (FHIR Reference type)
 * to avoid accidental replacement in narratives or identifiers.
 *
 * Uses structured deep-walk (iterative stack, not recursive).
 *
 * @param resource - The FHIR resource to resolve (will be cloned).
 * @param urnMap - Map from urn:uuid strings to UrnTarget.
 * @returns A new resource with resolved references.
 */
export function deepResolveUrns<T extends FhirResource>(
  resource: T,
  urnMap: Map<string, UrnTarget>,
): T {
  if (urnMap.size === 0) return resource;

  const clone = structuredClone(resource);
  const stack: unknown[] = [clone];

  while (stack.length > 0) {
    const current = stack.pop();

    if (current === null || current === undefined || typeof current !== 'object') {
      continue;
    }

    if (Array.isArray(current)) {
      for (const item of current) {
        if (typeof item === 'object' && item !== null) {
          stack.push(item);
        }
      }
      continue;
    }

    const record = current as Record<string, unknown>;

    // Replace .reference field if it matches a urn:uuid
    if (typeof record.reference === 'string') {
      const target = urnMap.get(record.reference);
      if (target) {
        record.reference = `${target.resourceType}/${target.id}`;
      }
    }

    // Recurse into all object/array fields
    for (const key of Object.keys(record)) {
      const value = record[key];
      if (typeof value === 'object' && value !== null) {
        stack.push(value);
      }
    }
  }

  return clone;
}
