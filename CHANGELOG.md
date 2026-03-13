# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- `sql.js` ^1.14.1
