/**
 * PropertyPathRuntimeProvider — Approximate RuntimeProvider Implementation
 *
 * Uses `extractPropertyPath` + `getNestedValues` from row-indexer to
 * approximate FHIRPath evaluation. This is the v1-compatible fallback
 * when a real fhir-runtime instance is not available.
 *
 * Limitations (compared to real FHIRPath):
 * - Cannot evaluate `.as(X)` polymorphic type casts correctly
 * - Cannot evaluate `.where(resolve() is X)` predicates
 * - Cannot evaluate complex FHIRPath functions (iif, ofType, etc.)
 * - Reference path detection is heuristic-based
 *
 * @module fhir-persistence/providers
 */

import type { SearchParameterDef } from './definition-provider.js';
import type { RuntimeProvider, ExtractedReference } from './runtime-provider.js';
import { extractPropertyPath, getNestedValues } from '../repo/row-indexer.js';

// =============================================================================
// Section 1: PropertyPathRuntimeProvider
// =============================================================================

export class PropertyPathRuntimeProvider implements RuntimeProvider {

  // ---------------------------------------------------------------------------
  // extractSearchValues
  // ---------------------------------------------------------------------------

  extractSearchValues(
    resource: Record<string, unknown>,
    params: SearchParameterDef[],
  ): Record<string, unknown[]> {
    const result: Record<string, unknown[]> = {};
    const resourceType = resource.resourceType as string;
    if (!resourceType) return result;

    for (const param of params) {
      if (!param.expression) continue;

      const path = extractPropertyPath(param.expression, resourceType);
      if (!path) continue;

      const values = getNestedValues(resource, path);
      if (values.length === 0) continue;

      // Normalize values based on parameter type
      const normalized = this.normalizeValues(values, param.type);
      if (normalized.length > 0) {
        result[param.code] = normalized;
      }
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // extractReferences
  // ---------------------------------------------------------------------------

  extractReferences(
    resource: Record<string, unknown>,
    params: SearchParameterDef[],
  ): ExtractedReference[] {
    const refs: ExtractedReference[] = [];
    const resourceType = resource.resourceType as string;
    if (!resourceType) return refs;

    for (const param of params) {
      if (param.type !== 'reference') continue;
      if (!param.expression) continue;

      const path = extractPropertyPath(param.expression, resourceType);
      if (!path) continue;

      const values = getNestedValues(resource, path);
      for (const val of values) {
        const ref = this.extractReferenceFromValue(val);
        if (!ref) continue;

        const parsed = parseReferenceString(ref);
        if (!parsed) continue;

        refs.push({
          code: param.code,
          reference: ref,
          targetType: parsed.targetType,
          targetId: parsed.targetId,
        });
      }
    }

    return refs;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Normalize extracted values based on the SearchParameter type.
   */
  private normalizeValues(values: unknown[], type: string): unknown[] {
    switch (type) {
      case 'reference':
        return values
          .map(v => this.extractReferenceFromValue(v))
          .filter((v): v is string => v !== null);

      case 'token':
        return this.extractTokenValues(values);

      case 'date':
      case 'string':
      case 'uri':
      case 'number':
      case 'quantity':
        return values.filter(
          v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean',
        );

      default:
        return values;
    }
  }

  /**
   * Extract a reference string from a FHIR Reference value.
   */
  private extractReferenceFromValue(value: unknown): string | null {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      const ref = (value as Record<string, unknown>).reference;
      if (typeof ref === 'string') return ref;
    }
    return null;
  }

  /**
   * Extract token values as system|code strings from various FHIR structures.
   */
  private extractTokenValues(values: unknown[]): string[] {
    const tokens: string[] = [];

    for (const val of values) {
      if (typeof val === 'string') {
        // Plain string (e.g., gender = 'male')
        tokens.push(val);
        continue;
      }
      if (typeof val === 'boolean') {
        tokens.push(String(val));
        continue;
      }
      if (typeof val !== 'object' || val === null) continue;

      const obj = val as Record<string, unknown>;

      // CodeableConcept: { coding: [{ system, code }] }
      if (Array.isArray(obj.coding)) {
        for (const coding of obj.coding) {
          if (typeof coding === 'object' && coding !== null) {
            const c = coding as Record<string, unknown>;
            const system = typeof c.system === 'string' ? c.system : '';
            const code = typeof c.code === 'string' ? c.code : '';
            if (code) {
              tokens.push(`${system}|${code}`);
            }
          }
        }
        continue;
      }

      // Coding: { system, code }
      if (typeof obj.system === 'string' || typeof obj.code === 'string') {
        const system = typeof obj.system === 'string' ? obj.system : '';
        const code = typeof obj.code === 'string' ? obj.code : '';
        if (code) {
          tokens.push(`${system}|${code}`);
        }
        continue;
      }

      // Identifier: { system, value }
      if (typeof obj.value === 'string' && (typeof obj.system === 'string' || obj.system === undefined)) {
        const system = typeof obj.system === 'string' ? obj.system : '';
        tokens.push(`${system}|${obj.value}`);
      }
    }

    return tokens;
  }
}

// =============================================================================
// Section 2: Reference Parsing Utility
// =============================================================================

/**
 * Parse a FHIR reference string into targetType and targetId.
 *
 * Handles:
 * - Relative: "Patient/123" → { targetType: "Patient", targetId: "123" }
 * - Absolute: "https://server/fhir/Patient/123" → { targetType: "Patient", targetId: "123" }
 * - Contained: "#id" → null (skipped)
 */
function parseReferenceString(ref: string): { targetType: string; targetId: string } | null {
  // Skip contained references
  if (ref.startsWith('#')) return null;

  // Relative: "Patient/123"
  const relMatch = ref.match(/^([A-Za-z]+)\/([^/]+)$/);
  if (relMatch) return { targetType: relMatch[1], targetId: relMatch[2] };

  // Absolute URL: "https://server/fhir/Patient/123"
  const absMatch = ref.match(/\/([A-Za-z]+)\/([^/]+)$/);
  if (absMatch) return { targetType: absMatch[1], targetId: absMatch[2] };

  return null;
}
