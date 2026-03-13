/**
 * Providers — Bridge interfaces for upstream packages
 *
 * @module fhir-persistence/providers
 */

// DefinitionProvider (fhir-definition bridge)
export type {
  DefinitionProvider,
  StructureDefinitionDef,
  ValueSetDef,
  CodeSystemDef,
  SearchParameterDef,
  LoadedPackageDef,
} from './definition-provider.js';

export { InMemoryDefinitionProvider } from './in-memory-definition-provider.js';

// RuntimeProvider (fhir-runtime bridge)
export type {
  RuntimeProvider,
  ExtractedReference,
  ValidationResult,
  ValidationIssue,
} from './runtime-provider.js';

export { PropertyPathRuntimeProvider } from './property-path-runtime-provider.js';

// FhirRuntimeProvider (real fhir-runtime integration)
export { FhirRuntimeProvider, createFhirRuntimeProvider } from './fhir-runtime-provider.js';
export type { FhirRuntimeProviderOptions } from './fhir-runtime-provider.js';

// FhirDefinitionBridge (real fhir-definition integration)
export { FhirDefinitionBridge } from './fhir-definition-provider.js';
