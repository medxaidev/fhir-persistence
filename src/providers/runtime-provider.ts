/**
 * RuntimeProvider — Bridge Interface for fhir-runtime
 *
 * Abstracts the `fhir-runtime` capabilities so that `fhir-persistence`
 * never imports `fhir-runtime` types directly. This enables:
 *
 * - Testing with property-path approximation (no FHIRPath engine)
 * - Swapping to real fhir-runtime when available
 * - Structural typing compatibility (duck typing)
 *
 * ADR-01 §4.1b: RuntimeProvider interface contract.
 *
 * @module fhir-persistence/providers
 */

import type { SearchParameterDef } from './definition-provider.js';

// =============================================================================
// Section 1: Types
// =============================================================================

/**
 * A reference extracted from a FHIR resource.
 */
export interface ExtractedReference {
  /** The SearchParameter code (e.g., 'subject', 'performer'). */
  code: string;
  /** The full reference string (e.g., 'Patient/123'). */
  reference: string;
  /** The target resource type (e.g., 'Patient'). */
  targetType: string;
  /** The target resource ID (e.g., '123'). */
  targetId: string;
}

/**
 * Result of resource validation.
 */
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * A single validation issue.
 */
export interface ValidationIssue {
  severity: 'error' | 'warning' | 'information';
  message: string;
  path?: string;
}

// =============================================================================
// Section 2: RuntimeProvider Interface
// =============================================================================

/**
 * Bridge interface for fhir-runtime.
 *
 * fhir-persistence depends only on this interface, never on
 * fhir-runtime internal types. Implementations may wrap
 * a real `FhirRuntimeInstance` or provide test-only approximations.
 *
 * ADR-01 §4.1b — structural typing, no `implements` required.
 */
export interface RuntimeProvider {
  /**
   * Extract search parameter values from a resource.
   *
   * Real implementation uses FHIRPath evaluation via fhir-runtime.
   * Test implementation uses extractPropertyPath approximation.
   *
   * @param resource - The FHIR resource to extract values from.
   * @param params - SearchParameter definitions to extract.
   * @returns Map of param code → extracted values.
   */
  extractSearchValues(
    resource: Record<string, unknown>,
    params: SearchParameterDef[],
  ): Record<string, unknown[]>;

  /**
   * Extract all outgoing references from a resource.
   *
   * Real implementation uses fhir-runtime's reference extractor
   * based on StructureDefinition knowledge.
   * Test implementation scans JSON for `.reference` fields.
   *
   * @param resource - The FHIR resource to scan.
   * @param params - Reference-type SearchParameters (used for code mapping).
   * @returns Array of extracted references with targetType/targetId.
   */
  extractReferences(
    resource: Record<string, unknown>,
    params: SearchParameterDef[],
  ): ExtractedReference[];

  /**
   * Validate a resource against a profile (optional capability).
   *
   * Not all implementations support validation. Check existence before calling.
   */
  validate?(
    resource: Record<string, unknown>,
    profileUrl?: string,
  ): Promise<ValidationResult>;
}
