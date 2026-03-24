# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.10.0] - 2025-03-24

### Added

#### PERS-01: PUT-as-Create (Upsert)

- **`FhirStore.updateResource`** and **`FhirPersistence.updateResource`** — new `upsert` option; when `true` and resource does not exist, creates it instead of throwing `ResourceNotFoundError`
- Return type changed to `UpdateResourceResult<T>` with `{ resource, created }` — `created: true` for upsert-created resources, `false` for normal updates
- **`FhirPersistence.createResource`** — return type changed to `CreateResourceResult<T>` with `{ resource, created }` for consistency

#### PERS-02: Conditional Create (ifNoneExist)

- **`FhirPersistence.createResource`** — new `ifNoneExist` option accepting `ParsedSearchParam[]`; searches first, returns existing resource if exactly one match, throws `PreconditionFailedError` if multiple matches, creates new resource if no matches

#### PERS-06: Type-Level History

- **`FhirStore.readTypeHistory`** and **`FhirPersistence.readTypeHistory`** — new method for `GET /<ResourceType>/_history` queries with `_since`, `_count`, and cursor pagination support

#### Exports

- **`ConditionalService`** + types (`ConditionalCreateResult`, `ConditionalUpdateResult`, `ConditionalDeleteResult`) now exported from package entry point
- **`processTransactionV2`**, **`processBatchV2`** + bundle types (`Bundle`, `BundleEntry`, `BundleResponse`, `BundleResponseEntry`) now exported
- **`buildUrnMap`**, **`deepResolveUrns`** + `UrnTarget` type now exported
- **`FhirStore`** option/result types (`StoreUpdateResourceResult`, `StoreUpdateResourceOptions`) now exported
- **`FhirPersistence`** option/result types (`PersistenceCreateResourceOptions`, `CreateResourceResult`, `PersistenceUpdateResourceOptions`, `UpdateResourceResult`) now exported

### Fixed

#### PERS-07: String `:exact` Search Modifier on HumanName

- **`where-builder.ts`** — `name:exact` search now matches against individual `family` and `given` columns in the HumanName lookup table instead of the concatenated `name` column
- Previously `name:exact=Smith` would fail to match because the `name` column contains `"Smith John"` (concatenated); now correctly matches if `family = "Smith"` OR `given = "Smith"`
- Fix applied to both v1 (PostgreSQL `$N`) and v2 (SQLite `?`) WHERE builders

#### Bundle Processor PUT Compatibility

- **`bundle-processor.ts`** — `processBatchEntry` PUT handler updated to extract `.resource` from `UpdateResourceResult` and use `upsert: true` for PUT-as-Create semantics; response status now correctly returns `201` for created resources

### Changed

- **`FhirStore.updateResource`** — return type changed from `T & PersistedResource` to `UpdateResourceResult<T>` (breaking change for direct callers)
- **`FhirPersistence.createResource`** — return type changed from `T & PersistedResource` to `CreateResourceResult<T>` (breaking change for direct callers)
- **`FhirPersistence.updateResource`** — return type changed from `T & PersistedResource` to `UpdateResourceResult<T>` (breaking change for direct callers)

### Test Coverage

- **1057 passing tests**, 8 skipped, across 63 test files — no regressions
- All existing tests updated for new `UpdateResourceResult` / `CreateResourceResult` return types
- PERS-07 test assertions updated to verify per-component HumanName matching

## [0.9.0] - 2025-03-20

### Fixed

#### Bug-3: Token WHERE clause code-only / empty-system matching failure (P0)

- **`buildTokenColumnFragmentV2()`** (v2, SQLite) and **`buildTokenColumnFragment()`** (v1, PostgreSQL) — corrected token value resolution logic per FHIR spec:
  - `system|code` → exact match against stored `"system|code"` ✅
  - `|code` → exact match against stored `"|code"` (empty system, keep pipe) ✅
  - `system|` → `LIKE "system|%"` (any code within system) ✅
  - `code` (bare, no pipe) → `LIKE "%|code"` (any system, match code) ✅
- **Root cause**: Previous logic stripped leading `|` from `|code` values and used exact match for bare codes, causing zero results for `gender=male` (stored as `"|male"`) and `gender=|male`
- **Impact**: All token searches using bare code or `|code` format now correctly match stored values
- New helper: `arrayContainsLikeV2()` generates dialect-aware `LIKE` subqueries (SQLite `json_each` / PostgreSQL `unnest`)

### Test Coverage

- **1065 total tests** (1057 passing, 8 skipped) across 63 test files — no regressions
- **5 new Bug-3 regression tests** in v2 and v1 test suites verifying all four token formats

## [0.8.0] - 2025-03-20

### Fixed

#### Bug-1 + Bug-2: Token-column WHERE clause column name mismatch (P0)

- **`buildTokenColumnFragment()`** (v1, PostgreSQL `$N` placeholders) — changed `__${columnName}Text` → `__${columnName}` to match DDL column name
- **`buildTokenColumnFragmentV2()`** (v2, SQLite `?` placeholders) — same fix, aligning with DDL `__<name>` column
- **Root cause**: WHERE clause referenced a non-existent `__genderText` column while DDL only creates `__gender` (TEXT, JSON array of `system|code` strings) and `__genderSort` (TEXT, display)
- **Impact**: All token search queries (`GET /Patient?gender=male`) previously failed with `no such column: __genderText`
- DDL / INSERT / WHERE column names now fully aligned: `__<name>` for token array, `__<name>Sort` for display text

### Changed

- **`search-parameter-registry.ts`** — Corrected `SearchStrategy` documentation: token-column uses 2 columns (not 3)

### Confirmed

- **Enh-1**: R4 standard SP loading (`name`, `identifier`, etc.) depends on external `DefinitionProvider` — not a persistence-layer issue
- **Enh-2**: `ifMatch` optimistic locking is fully implemented in both `FhirStore` and `FhirPersistence` with test coverage

### Test Coverage

- **1062 total tests** (1054 passing, 8 skipped) across 63 test files — no regressions
- **1 new regression test** for Bug-1: verifies token column references `__<name>` not `__<name>Text`

## [0.7.0] - 2025-03-18

### Added

#### Conformance Storage Module (`src/conformance/`)

New module for IG-related conformance resource management, unblocking IG Explorer (Phase-fhir-server-004):

- **`IGResourceMapRepo`** (P1) — `ig_resource_map` table tracking IG → resource mappings with grouped index queries
- **`SDIndexRepo`** (P2) — `structure_definition_index` table for fast SD queries by type, kind, base definition
- **`ElementIndexRepo`** (P3) — `structure_element_index` table for element-level queries across SDs (dialect-aware: SQLite INTEGER vs PostgreSQL BOOLEAN/JSONB)
- **`ExpansionCacheRepo`** (P4) — `value_set_expansion` cache table for ValueSet expansion results (dialect-aware timestamps)
- **`ConceptHierarchyRepo`** (P5) — `code_system_concept` hierarchical table with parent-child relationships and level queries
- **`SearchParamIndexRepo`** (B1) — `search_parameter_index` table for IG-scoped SearchParameter tracking
- **`IGImportOrchestrator`** (B2) — Coordinates all repos for complete IG import pipeline; accepts optional fhir-runtime extraction functions (`extractElementIndex`, `flattenConcepts`, `extractDependencies`)

All repos follow existing patterns: `StorageAdapter` + `DDLDialect`, `?` placeholders, SQLite/PostgreSQL dual-backend support.

### Changed

- **`fhir-runtime` dependency** — Upgraded from `^0.10.0` to `^0.11.0` (IG extraction API: `extractSDDependencies`, `extractElementIndexRows`, `flattenConceptHierarchy`)
- **`src/index.ts`** — Added conformance module exports (7 classes + 9 types)

### Test Coverage

- **1061 total tests** (1053 passing, 8 skipped) across 63 test files — no regressions
- **47 new conformance tests** covering all 6 repos + orchestrator (SQLite in-memory)

## [0.6.1] - 2025-03-18

### Changed

- **`fhir-runtime` dependency** — Upgraded from `^0.8.1` to `^0.10.0` to align with fhir-runtime v0.10.0 (STAGE-7: Profile Slicing & Choice Type utilities)
- No code changes required — `FhirRuntimeProvider` uses structural typing and is fully compatible with the new fhir-runtime API surface

### Notes

- fhir-runtime v0.10.0 adds: Slicing API (`matchSlice`, `countSliceInstances`, `generateSliceSkeleton`), Choice Type utilities, BackboneElement helpers, and `inferComplexType` bug fix
- These new APIs are available to consumers via fhir-runtime but do not affect fhir-persistence internals

## [0.6.0] - 2025-03-17

### Added

#### Full-Text Search (SQLite FTS5 + PostgreSQL tsvector/GIN)

- **`table-schema-builder.ts`** — HumanName and Address lookup tables now include tsvector GIN expression indexes (`to_tsvector('simple'::regconfig, column)`) for PostgreSQL full-text search
- **`where-builder.ts`** — Lookup table string search supports FTS query paths: SQLite FTS5 MATCH and PostgreSQL `to_tsvector @@ plainto_tsquery` with automatic fallback to LIKE
- **`fhir-system.ts`** — `FhirSystemConfig.features.fullTextSearch` option to enable FTS query paths (default: `false` for backward compatibility)
- SQLite FTS5 virtual tables generated via `MigrationGenerator` for HumanName/Address lookup columns

#### Reindex Progress Callbacks

- **`cli/reindex.ts`** — `ReindexProgressCallbackV2` type with `onProgress` callback reporting `{ resourceType, processed, total }` per batch
- **`reindexResourceTypeV2`** and **`reindexAllV2`** accept optional `onProgress` parameter for CLI and UI progress display

#### Conditional Operations API

- **`store/conditional-service.ts`** — `ConditionalService` class with full FHIR R4 conditional semantics:
  - `conditionalCreate`: 0 match → create, 1 match → return existing, 2+ → `PreconditionFailedError`
  - `conditionalUpdate`: 0 match → create, 1 match → update, 2+ → `PreconditionFailedError`
  - `conditionalDelete`: delete all matching resources, return count
- **`repo/errors.ts`** — `PreconditionFailedError` (HTTP 412) for multiple-match conditional operations
- All conditional operations execute within transactions (TOCTOU protection)

### Changed

- **`table-schema-builder.ts`** — HumanName lookup table adds `pg_trgm` GIN indexes (`gin_trgm_ops`) alongside tsvector indexes for trigram fuzzy matching
- **`migration-generator.ts`** — Automatically creates `pg_trgm` and `btree_gin` extensions on PostgreSQL before GIN index generation

## [0.5.0] - 2025-03-16

### Fixed

#### PostgreSQL Migration Path Fixes

- **`migration-generator.ts`** — IG migration path now creates PostgreSQL extensions (`pg_trgm`, `btree_gin`) and helper function (`token_array_to_text`) before generating GIN indexes, fixing "no default operator class for access method gin" error
- **`where-builder.ts`** — Lookup table EXISTS subqueries now use fully-qualified `"ResourceType"."id"` instead of ambiguous `"id"`, fixing PostgreSQL "operator does not exist: text = integer" error in name/address/telecom searches

### Changed

- **`buildWhereFragment` (v1)** — Added optional `resourceType` parameter, passed to `buildLookupTableFragment`
- **`buildWhereFragmentV2` (v2)** — Added optional `resourceType` parameter, passed to `buildLookupTableFragmentV2`
- Both `buildLookupTableFragment*` functions now generate `outerIdRef = "ResourceType"."id"` to eliminate column name ambiguity in PostgreSQL

### Test Coverage

- **1014 total tests** (1006 passing, 8 skipped) across 56 test files — no regressions
- Updated 7 lookup table test assertions to use qualified column references

## [0.4.0] - 2025-03-15

### Fixed

#### PostgreSQL DDL Compatibility (Phase D)

- **`migration-runner.ts`** — Tracking table `_migrations` now uses `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP` on PostgreSQL instead of SQLite-only `datetime('now')`
- **`package-registry-repo.ts`** — `_packages` and `_schema_version` tables use dialect-aware timestamp defaults; `INSERT OR REPLACE` replaced with `INSERT ... ON CONFLICT ... DO UPDATE` on PostgreSQL
- **`reindex-scheduler.ts`** — `_reindex_jobs` table uses `SERIAL PRIMARY KEY` on PostgreSQL instead of `AUTOINCREMENT`; `datetime('now')` replaced with `CURRENT_TIMESTAMP`
- **`valueset-repo.ts`** — `terminology_valuesets` table uses dialect-aware timestamp defaults; `INSERT OR REPLACE` replaced with `INSERT ... ON CONFLICT ... DO UPDATE` on PostgreSQL
- **`lookup-table-writer.ts`** — 4 global lookup tables (`HumanName`, `Address`, `ContactPoint`, `Identifier`) use `SERIAL PRIMARY KEY` on PostgreSQL instead of `AUTOINCREMENT`

### Changed

- **`ig-persistence-manager.ts`** — Now passes `dialect` to `PackageRegistryRepo`, `MigrationRunnerV2`, and `ReindexScheduler` constructors
- **`indexing-pipeline.ts`** — `IndexingPipelineOptions` accepts `dialect` parameter, passed to `LookupTableWriter`
- **`fhir-system.ts`** — Passes `dialect` through to `IndexingPipeline` via `FhirPersistence` options
- All new `dialect` parameters default to `'sqlite'` — fully backward-compatible

### Test Coverage

- **1014 total tests** (1006 passing, 8 skipped) across 56 test files — no regressions

## [0.3.0] - 2025-03-15

### Added

#### Dual-Backend Validation

- Comprehensive dual-backend test suite (`dual-backend-validation.test.ts`) — 41 tests covering SQLite and PostgreSQL
  - **Schema DDL correctness** — generate and execute DDL on both backends, verify tables/columns/indexes
  - **IG lifecycle validation** — `compareSchemas` → `generateMigration` → apply migration on both backends
  - **CRUD correctness** — `FhirStore` create/read/update/delete/history/vread on both SQLite and PostgreSQL
  - Transaction atomicity verification on PostgreSQL
  - Optimistic locking (`ifMatch`) verification on both backends
  - History auto-increment `versionSeq` verification on PostgreSQL

#### PostgreSQL Integration Tests

- 23 PostgreSQL integration tests (`postgres-adapter.integration.test.ts`) covering CRUD, transactions, DDL generation, migrations, search SQL generation, concurrency, streaming, and NULL handling

### Changed

- `buildTableSet` helper now accepts parameterized `resourceType` for test isolation (unique constraint/index names per test run)
- Schema DDL comparison tests verify CREATE TABLE count parity rather than exact statement count (SQLite generates extra AUTOINCREMENT index)

### Fixed

- PostgreSQL test isolation — unique resource type names per run prevent constraint/index name collisions across test runs

### Test Coverage

- **1014 total tests** (1006 passing, 8 skipped) across 56 test files
- Full CRUD verified on both SQLite (in-memory) and PostgreSQL (localhost:5433)

## [0.2.0] - 2025-03-15

### Added

#### PostgreSQL Support

- `PostgresAdapter` — full `StorageAdapter` implementation for PostgreSQL via `pg` Pool
  - Automatic `?` → `$1, $2, ...` placeholder rewriting
  - Transaction support via pool client + BEGIN/COMMIT/ROLLBACK
  - `queryStream` via cursor-like row iteration
  - Serialization failure retry (40001) with exponential backoff
  - `close()` guard preventing use-after-close
- `PostgresDialect` — `SqlDialect` implementation for PostgreSQL
  - Native `TEXT[]` array operators (`&&`, `@>`) instead of `json_each()`
  - `GENERATED ALWAYS AS IDENTITY` for history sequence columns
  - PostgreSQL-native type mappings (TIMESTAMPTZ, TEXT[], BOOLEAN, etc.)
- 23 PostgreSQL integration tests covering CRUD, transactions, DDL, migrations, search SQL, concurrency, streaming, and NULL handling

#### SQL Dialect Abstraction

- `SqlDialect` interface — abstracts SQL syntax differences between SQLite and PostgreSQL
- `SQLiteDialect` — `SqlDialect` implementation for SQLite (json_each, AUTOINCREMENT)
- Dialect-aware WHERE builders: `arrayContainsV2`, `arrayNotContainsV2`, `arrayContainsLikeV2`
- `buildWhereFragmentV2`, `buildWhereClauseV2` now accept optional `dialect` parameter
- `buildSearchSQLv2`, `buildCountSQLv2`, `buildTwoPhaseSearchSQLv2` accept optional `dialect`
- `executeSearchV2` accepts `dialect` via options
- Compartment filters are dialect-aware (json_each for SQLite, ARRAY operators for PostgreSQL)

### Changed

- `TransactionContext` methods (`execute`, `query`, `queryOne`) are now `async` (Promise-based)
- All transaction callers updated to `await` transaction operations
- `BetterSqlite3Adapter` transaction wraps sync operations in async interface

### Removed

- `sql.js` WASM adapter (`SQLiteAdapter`) — replaced by `BetterSqlite3Adapter`
- `sql.js` dependency removed from `package.json`

### Dependencies

- `pg` ^8.0.0 added as optional peer dependency
- `pg` ^8.20.0, `@types/pg` ^8.18.0 added as dev dependencies

## [0.1.0] - 2025-03-13

### Added

#### Storage Layer

- `StorageAdapter` interface — unified async database abstraction
- `SQLiteAdapter` — sql.js (WASM) implementation for cross-platform use
- `BetterSqlite3Adapter` — native better-sqlite3 implementation for production Node.js
- `SQLiteDialect` / PostgreSQL dialect support for DDL generation

#### CRUD & Persistence

- `FhirStore` — basic CRUD with soft delete and version tracking
- `FhirPersistence` — end-to-end facade with automatic search indexing
- `ConditionalService` — conditionalCreate / conditionalUpdate / conditionalDelete
- `BundleProcessorV2` — FHIR transaction and batch bundle processing
- Resource versioning with `versionId` auto-increment
- History tracking via dedicated `_History` tables

#### Search

- `SearchParameterRegistry` — index FHIR SearchParameter bundles
- `parseSearchRequest` — parse FHIR search URL query parameters
- `buildSearchSQLv2` — generate SQL with `?` placeholders (SQLite + PG compatible)
- `buildWhereClauseV2` — chain search support (`subject:Patient.birthdate=...`)
- `SearchPlanner` — filter reordering, chain depth validation, two-phase recommendation
- `buildTwoPhaseSearchSQLv2` — id-first query for large table performance
- `SearchExecutor` — `_include`, `_revinclude`, recursive `_include:iterate` (max depth 3)
- `SearchBundleBuilder` — FHIR Bundle response construction with pagination

#### Indexing

- `IndexingPipeline` — automatic search column population on CRUD
- `RuntimeProvider` bridge — FHIRPath-driven extraction via `fhir-runtime`
- `buildSearchColumns` — fallback property-path extraction
- `extractReferencesV2` — reference extraction and indexing
- `LookupTableWriter` — HumanName, Address, ContactPoint, Identifier lookup tables
- Column strategy, token-column strategy, lookup-table strategy

#### Schema & Migration

- `StructureDefinitionRegistry` — register and resolve FHIR StructureDefinitions
- `buildResourceTableSet` — StructureDefinition + SearchParameter → table schema
- DDL generators for Main, History, References tables + indexes
- `compareSchemas` — schema diff between old and new table sets
- `generateMigration` — diff → DDL migration statements
- `MigrationRunnerV2` — execute migrations with `StorageAdapter`
- `IGPersistenceManager` — three-way branch (new / upgrade / consistent)
- `PackageRegistryRepo` — multi-version package tracking with checksum
- `ReindexScheduler` — schedule reindex jobs for SP expression changes

#### Terminology

- `TerminologyCodeRepo` — code system concept storage
- `ValueSetRepo` — value set expansion storage

#### Platform IG

- Built-in platform resource types: User, Bot, Project, Agent, ClientApplication
- `initializePlatformIG` — auto-register platform search parameters

#### Provider Bridges (for fhir-engine)

- `FhirDefinitionBridge` — wraps `fhir-definition` `DefinitionRegistry` → `DefinitionProvider`
- `FhirRuntimeProvider` — wraps `fhir-runtime` `FhirRuntimeInstance` → `RuntimeProvider`
- `FhirSystem` — end-to-end startup orchestrator

#### Production

- `ResourceCacheV2` — in-memory resource cache with TTL
- `SearchLogger` — search query logging and diagnostics
- `reindexResourceTypeV2` / `reindexAllV2` — CLI reindex utilities

### Dependencies

- `fhir-definition` ^0.5.0
- `fhir-runtime` ^0.8.1
- `better-sqlite3` ^12.6.2
