/**
 * FhirRuntimeProvider — Real fhir-runtime Integration
 *
 * Wraps the actual `fhir-runtime` package's `extractSearchValues`,
 * `extractAllSearchValues`, and `extractReferences` functions into
 * the `RuntimeProvider` interface used by `IndexingPipeline`.
 *
 * This replaces the approximate `PropertyPathRuntimeProvider` with
 * real FHIRPath evaluation for precise search value extraction.
 *
 * ADR-01 §4.1b: RuntimeProvider wraps fhir-runtime, never exposing
 * fhir-runtime types to the rest of fhir-persistence.
 *
 * @module fhir-persistence/providers
 */

import type { SearchParameterDef } from './definition-provider.js';
import type { RuntimeProvider, ExtractedReference } from './runtime-provider.js';

// =============================================================================
// Section 1: fhir-runtime types (structural, not imported)
// =============================================================================

/**
 * Structural type matching fhir-runtime's SearchParameter.
 * We use structural typing to avoid importing fhir-runtime types directly.
 */
interface FhirRuntimeSearchParameter {
  resourceType: 'SearchParameter';
  url: string;
  name: string;
  status: 'draft' | 'active' | 'retired' | 'unknown';
  code: string;
  base: string[];
  type: string;
  expression?: string;
  target?: string[];
}

/**
 * Structural type matching fhir-runtime's SearchIndexValue.
 * Used internally for normalizing extracted values.
 */
type FhirRuntimeSearchIndexValue =
  | { type: 'string'; value: string }
  | { type: 'token'; system?: string; code: string; display?: string }
  | { type: 'reference'; reference: string; resourceType?: string; id?: string }
  | { type: 'date'; value: string }
  | { type: 'number'; value: number }
  | { type: 'quantity'; value: number; unit?: string; system?: string; code?: string }
  | { type: 'uri'; value: string };

// =============================================================================
// Section 2: FhirRuntimeProvider
// =============================================================================

/**
 * Options for creating a FhirRuntimeProvider.
 *
 * Uses `any` for function signatures to bridge between fhir-runtime's
 * narrow union types (e.g., SearchParamType) and our structural types.
 * The conversion is handled internally by FhirRuntimeProvider.
 */
export interface FhirRuntimeProviderOptions {
  /**
   * The `extractSearchValues` function from fhir-runtime.
   * Signature: (resource: Resource, searchParam: SearchParameter) => SearchIndexEntry
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractSearchValues: (resource: any, searchParam: any) => any;

  /**
   * The `extractAllSearchValues` function from fhir-runtime.
   * Signature: (resource: Resource, searchParams: SearchParameter[]) => SearchIndexEntry[]
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractAllSearchValues: (resource: any, searchParams: any[]) => any[];

  /**
   * The `extractReferences` function from fhir-runtime.
   * Signature: (resource: Resource) => ReferenceInfo[]
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractReferences: (resource: any) => any[];
}

export class FhirRuntimeProvider implements RuntimeProvider {
  private readonly opts: FhirRuntimeProviderOptions;

  constructor(options: FhirRuntimeProviderOptions) {
    this.opts = options;
  }

  // ---------------------------------------------------------------------------
  // extractSearchValues
  // ---------------------------------------------------------------------------

  extractSearchValues(
    resource: Record<string, unknown>,
    params: SearchParameterDef[],
  ): Record<string, unknown[]> {
    const result: Record<string, unknown[]> = {};

    // Convert SearchParameterDef → fhir-runtime SearchParameter shape
    const runtimeParams = params
      .filter(p => p.expression)
      .map(p => this.toRuntimeSearchParameter(p));

    // Use extractAllSearchValues for batch extraction
    const entries = this.opts.extractAllSearchValues(
      resource,
      runtimeParams,
    );

    for (const entry of entries) {
      if (entry.values.length === 0) continue;

      const normalized = this.normalizeSearchValues(entry.values, entry.type);
      if (normalized.length > 0) {
        result[entry.code] = normalized;
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

    const runtimeRefs = this.opts.extractReferences(resource);

    // Build a map from path → SP code for reference params
    const pathToCode = new Map<string, string>();
    const resourceType = resource.resourceType as string;
    for (const p of params) {
      if (p.type !== 'reference' || !p.expression) continue;
      // expression might be like "Observation.subject" or "Observation.subject | Observation.focus"
      const parts = p.expression.split('|').map(s => s.trim());
      for (const part of parts) {
        pathToCode.set(part, p.code);
      }
    }

    for (const ref of runtimeRefs) {
      // Skip contained and urn references
      if (ref.referenceType === 'contained' || ref.referenceType === 'urn') continue;
      if (!ref.targetType || !ref.targetId) continue;

      // Try to find the SP code from the path
      let code = pathToCode.get(ref.path);
      if (!code) {
        // Try without the resource type prefix
        const pathWithType = `${resourceType}.${ref.path.split('.').slice(1).join('.')}`;
        code = pathToCode.get(pathWithType) ?? ref.path.split('.').pop() ?? 'unknown';
      }

      refs.push({
        code: code as string,
        reference: ref.reference,
        targetType: ref.targetType,
        targetId: ref.targetId,
      });
    }

    return refs;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Convert our minimal SearchParameterDef to fhir-runtime's SearchParameter shape.
   */
  private toRuntimeSearchParameter(param: SearchParameterDef): FhirRuntimeSearchParameter {
    return {
      resourceType: 'SearchParameter',
      url: param.url ?? `urn:sp:${param.code}`,
      name: param.name ?? param.code,
      status: 'active',
      code: param.code,
      base: param.base,
      type: param.type,
      expression: param.expression,
      target: param.target,
    };
  }

  /**
   * Normalize fhir-runtime SearchIndexValue[] to persistence-friendly unknown[].
   */
  private normalizeSearchValues(
    values: FhirRuntimeSearchIndexValue[],
    type: string,
  ): unknown[] {
    switch (type) {
      case 'token':
        return this.normalizeTokenValues(values);
      case 'reference':
        return values
          .filter((v): v is Extract<FhirRuntimeSearchIndexValue, { type: 'reference' }> => v.type === 'reference')
          .map(v => v.reference);
      case 'date':
      case 'string':
      case 'uri':
        return values
          .filter(v => 'value' in v && typeof (v as Record<string, unknown>).value === 'string')
          .map(v => (v as { value: string }).value);
      case 'number':
        return values
          .filter((v): v is { type: 'number'; value: number } => v.type === 'number')
          .map(v => v.value);
      case 'quantity':
        return values
          .filter((v): v is Extract<FhirRuntimeSearchIndexValue, { type: 'quantity' }> => v.type === 'quantity')
          .map(v => v.value);
      default:
        return values.map(v => 'value' in v ? (v as any).value : v);
    }
  }

  /**
   * Normalize token values to "system|code" strings.
   */
  private normalizeTokenValues(values: FhirRuntimeSearchIndexValue[]): string[] {
    const tokens: string[] = [];
    for (const v of values) {
      if (v.type === 'token') {
        const system = v.system ?? '';
        tokens.push(`${system}|${v.code}`);
      } else if (v.type === 'string') {
        tokens.push(v.value);
      }
    }
    return tokens;
  }
}

// =============================================================================
// Section 3: Factory function
// =============================================================================

/**
 * Create a FhirRuntimeProvider from the fhir-runtime package.
 *
 * Usage:
 * ```typescript
 * import { extractSearchValues, extractAllSearchValues, extractReferences } from 'fhir-runtime';
 *
 * const provider = createFhirRuntimeProvider({
 *   extractSearchValues,
 *   extractAllSearchValues,
 *   extractReferences,
 * });
 * ```
 */
export function createFhirRuntimeProvider(
  options: FhirRuntimeProviderOptions,
): FhirRuntimeProvider {
  return new FhirRuntimeProvider(options);
}
