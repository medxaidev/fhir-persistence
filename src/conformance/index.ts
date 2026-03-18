/**
 * Conformance Module — Barrel Export
 *
 * Provides IG-related conformance resource storage:
 * - IG → Resource mapping (P1)
 * - StructureDefinition index (P2)
 * - Element index (P3)
 * - ValueSet expansion cache (P4)
 * - CodeSystem concept hierarchy (P5)
 * - SearchParameter index (B1)
 * - IG import orchestrator (B2)
 *
 * @module fhir-persistence/conformance
 */

// P1 — IG Resource Map
export { IGResourceMapRepo } from './ig-resource-map-repo.js';
export type { IGResourceMapEntry, IGIndex } from './ig-resource-map-repo.js';

// P2 — StructureDefinition Index
export { SDIndexRepo } from './sd-index-repo.js';
export type { SDIndexEntry } from './sd-index-repo.js';

// P3 — Element Index
export { ElementIndexRepo } from './element-index-repo.js';
export type { ElementIndexEntry } from './element-index-repo.js';

// P4 — Expansion Cache
export { ExpansionCacheRepo } from './expansion-cache-repo.js';
export type { CachedExpansion } from './expansion-cache-repo.js';

// P5 — Concept Hierarchy
export { ConceptHierarchyRepo } from './concept-hierarchy-repo.js';
export type { ConceptHierarchyEntry } from './concept-hierarchy-repo.js';

// B1 — SearchParameter Index
export { SearchParamIndexRepo } from './search-param-index-repo.js';
export type { SearchParamIndexEntry } from './search-param-index-repo.js';

// B2 — IG Import Orchestrator
export { IGImportOrchestrator } from './ig-import-orchestrator.js';
export type { IGImportOptions, IGImportResult } from './ig-import-orchestrator.js';
