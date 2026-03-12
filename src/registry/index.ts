/**
 * Registry module — barrel exports
 *
 * @module fhir-persistence/registry
 */

// (Task 8.2) StructureDefinitionRegistry
export { StructureDefinitionRegistry } from './structure-definition-registry.js';

// (Task 8.3) SearchParameterRegistry
export { SearchParameterRegistry } from './search-parameter-registry.js';
export type {
  SearchParamType,
  SearchStrategy,
  SearchColumnType,
  SearchParameterImpl,
  SearchParameterResource,
  SearchParameterBundle,
} from './search-parameter-registry.js';
