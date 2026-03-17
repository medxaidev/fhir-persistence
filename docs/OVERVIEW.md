# fhir-persistence — Overview

Version: 0.6.1

---

## What is fhir-persistence?

`fhir-persistence` is an **embedded FHIR R4 persistence layer** that provides:

- CRUD operations on FHIR resources with optimistic locking and soft delete
- Automatic search parameter indexing (column, token-column, lookup-table strategies)
- FHIR search with chain search, `_include`, `_revinclude`, `_include:iterate`
- Schema generation from StructureDefinitions + SearchParameters
- Automatic schema migration when IGs change (diff → DDL → apply)
- **Dual-backend support**: SQLite (native via better-sqlite3) and PostgreSQL (via pg)
- Dialect-aware SQL generation (`SqlDialect` abstraction)

It is designed to be the **storage engine** behind `fhir-engine`, which bootstraps the full FHIR stack.

---

## Architecture Position

```
┌──────────────────────────────────────────────┐
│              fhir-engine                     │
│       (bootstrap + lifecycle + plugins)      │
└──────────┬───────────────────────────────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
fhir-runtime   fhir-persistence  ◄── this package
     │
     ▼
fhir-definition
```

- **fhir-definition** — provides StructureDefinitions, SearchParameters, ValueSets
- **fhir-runtime** — provides FHIRPath evaluation, validation, search value extraction
- **fhir-persistence** — stores resources, indexes search parameters, generates schema DDL
- **fhir-engine** — assembles all three into a running FHIR system

---

## Core Design Principles

### 1. StorageAdapter Abstraction

All database access goes through the `StorageAdapter` interface. No code in fhir-persistence directly imports `better-sqlite3` or `pg`. This allows:

- Swapping databases without changing application code
- Running tests with in-memory SQLite
- Production with native SQLite or PostgreSQL

### 2. Three-Table-Per-Resource Pattern

Each FHIR resource type gets three tables:

| Table                  | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `"Patient"`            | Main table with current resource + search columns     |
| `"Patient_History"`    | All historical versions (auto-increment `versionSeq`) |
| `"Patient_References"` | Extracted resource references                         |

Plus shared lookup tables for complex types:

- `"HumanName_Lookup"` — name search
- `"Address_Lookup"` — address search
- `"ContactPoint_Lookup"` — telecom search
- `"Identifier_Lookup"` — identifier search

### 3. IG-Driven Schema

Schema is generated from FHIR StructureDefinitions and SearchParameters — not hand-written:

```
StructureDefinition → resource type → table name
SearchParameter     → search columns → indexes
```

When an IG is upgraded, `IGPersistenceManager` computes a diff and applies only the delta.

### 4. Parameterized SQL (`?` Placeholders)

All generated SQL uses `?` positional placeholders. The `PostgresAdapter` automatically rewrites `?` → `$1, $2, ...` for PostgreSQL compatibility. Application code never needs to handle placeholder syntax differences.

### 5. SqlDialect Abstraction

SQL syntax differences are encapsulated in the `SqlDialect` interface:

| Concern           | SQLite (`SQLiteDialect`) | PostgreSQL (`PostgresDialect`) |
| ----------------- | ------------------------ | ------------------------------ |
| Array containment | `json_each()` subquery   | `@>` / `&&` ARRAY operators    |
| Identity column   | `AUTOINCREMENT`          | `GENERATED ALWAYS AS IDENTITY` |
| Timestamp type    | `TEXT`                   | `TIMESTAMPTZ`                  |
| Boolean type      | `INTEGER`                | `BOOLEAN`                      |
| Upsert            | `INSERT OR REPLACE`      | `ON CONFLICT ... DO UPDATE`    |

### 6. Provider Bridge Pattern

`fhir-persistence` defines its own minimal interfaces (`DefinitionProvider`, `RuntimeProvider`) and provides bridge classes that wrap the real `fhir-definition` and `fhir-runtime` packages:

```
fhir-definition DefinitionRegistry
    └── FhirDefinitionBridge → DefinitionProvider

fhir-runtime FhirRuntimeInstance
    └── FhirRuntimeProvider → RuntimeProvider
```

This keeps `fhir-persistence` loosely coupled — it can run without `fhir-runtime` (using fallback property-path extraction).

---

## Module Map

```
src/
  index.ts                     ← public API barrel

  db/
    adapter.ts                 ← StorageAdapter interface
    dialect.ts                 ← SqlDialect interface
    better-sqlite3-adapter.ts  ← native SQLite adapter (production)
    sqlite-dialect.ts          ← SQLiteDialect implementation
    postgres-adapter.ts        ← PostgreSQL adapter (production)
    postgres-dialect.ts        ← PostgresDialect implementation

  store/
    fhir-persistence.ts        ← FhirPersistence (main facade)
    fhir-store.ts              ← FhirStore (basic CRUD + optimistic locking)
    conditional-service.ts     ← Conditional CRUD operations

  repo/
    indexing-pipeline.ts       ← Automatic search column population
    lookup-table-writer.ts     ← HumanName/Address/etc. lookup tables
    reference-indexer.ts       ← Reference extraction
    row-indexer.ts             ← Search column value extraction
    sql-builder.ts             ← INSERT/UPDATE/SELECT SQL generation

  search/
    search-parser.ts           ← Parse FHIR search URL params
    where-builder.ts           ← WHERE clause + chain search (dialect-aware)
    search-sql-builder.ts      ← Full SELECT query generation (dialect-aware)
    search-planner.ts          ← Optimization (filter reorder, two-phase)
    search-executor.ts         ← _include/_revinclude resolution (dialect-aware)

  schema/
    table-schema-builder.ts    ← SD + SP → ResourceTableSet
    ddl-generator.ts           ← ResourceTableSet → CREATE TABLE DDL (sqlite/postgres)

  migration/
    schema-diff.ts             ← Compare old/new schemas → SchemaDelta[]
    migration-generator.ts     ← Diff → dialect-aware DDL statements
    ig-persistence-manager.ts  ← Three-way branch: new/upgrade/consistent
    reindex-scheduler.ts       ← Schedule reindex for SP changes

  migrations/
    migration-runner.ts        ← MigrationRunnerV2 (execute migrations)

  registry/
    search-parameter-registry.ts    ← SP indexing and lookup
    structure-definition-registry.ts ← SD registration
    package-registry-repo.ts        ← Package version tracking

  providers/
    definition-provider.ts     ← DefinitionProvider interface
    runtime-provider.ts        ← RuntimeProvider interface
    fhir-definition-provider.ts ← Bridge: DefinitionRegistry → DefinitionProvider
    fhir-runtime-provider.ts   ← Bridge: FhirRuntimeInstance → RuntimeProvider

  startup/
    fhir-system.ts             ← End-to-end startup orchestrator

  terminology/
    terminology-code-repo.ts   ← Code system storage
    valueset-repo.ts           ← Value set storage

  cache/
    resource-cache.ts          ← In-memory TTL cache

  observability/
    search-logger.ts           ← Search diagnostics

  cli/
    reindex.ts                 ← Reindex utilities

  platform/
    platform-ig-definitions.ts ← Built-in platform resource types
    platform-ig-loader.ts      ← Platform IG initialization
```

---

## Data Flow

### Create Resource

```
createResource('Patient', resource)
    │
    ▼
FhirStore.createResource()
    │  INSERT INTO "Patient" (id, versionId, content, lastUpdated, deleted, ...)
    │  INSERT INTO "Patient_History" (id, versionId, content, ...)
    │
    ▼
IndexingPipeline.index()
    ├── RuntimeProvider.extractSearchValues()     (if available)
    │   or buildSearchColumns()                   (fallback)
    │   → populate __birthDate, __active, __name, ... columns
    │
    ├── extractReferencesV2()
    │   → INSERT INTO "Patient_References"
    │
    └── LookupTableWriter.write()
        → INSERT INTO "HumanName_Lookup", "Identifier_Lookup", ...
```

### Search

```
searchResources({ resourceType: 'Patient', queryParams: { birthdate: 'ge1990-01-01' } })
    │
    ▼
parseSearchRequest('Patient', params, spRegistry)
    │
    ▼
buildSearchSQLv2(request, spRegistry, dialect?)
    │  SELECT id, versionId, content, lastUpdated, deleted
    │  FROM "Patient"
    │  WHERE deleted = 0 AND "__birthDate" >= ?
    │  ORDER BY ... LIMIT ? OFFSET ?
    │
    ▼
adapter.query(sql, params)   ← PostgresAdapter auto-rewrites ? → $1, $2, ...
    │
    ▼
SearchExecutor: resolve _include / _revinclude
    │
    ▼
buildSearchBundle() → FHIR Bundle response
```

### Schema Migration

```
IGPersistenceManager.initialize(input)
    │
    ▼
PackageRegistryRepo.checkStatus(name, checksum)
    │
    ├── 'consistent' → no-op (return immediately)
    ├── 'new'        → apply full DDL (dialect-aware)
    └── 'upgrade'    → diff + apply delta
            │
            ▼
        compareSchemas(old, new) → SchemaDelta[]
            │
            ▼
        generateMigration(deltas, dialect) → { up: string[], reindexDeltas }
            │                                  ↑ 'sqlite' or 'postgres'
            ▼
        MigrationRunnerV2.applyIGMigration(migration)
            │
            ▼
        ReindexScheduler.schedule(reindexDeltas)
```

---

## Test Coverage

```
1014 tests (1006 passing, 8 skipped) across 56 test files

Key test suites:
- Dual-backend validation:  41 tests  (DDL + IG lifecycle + CRUD on SQLite & PostgreSQL)
- PostgreSQL integration:   23 tests  (CRUD, transactions, DDL, migrations, search SQL)
- Storage adapters:         ~40 tests  (BetterSqlite3Adapter, PostgresAdapter)
- CRUD & versioning:       ~80 tests  (FhirStore, FhirPersistence, soft delete, history)
- Search engine:           ~120 tests  (all SP types, chain search, planner, two-phase)
- Schema & migration:      ~60 tests  (DDL generation, schema diff, migration runner)
- Indexing pipeline:        ~50 tests  (column, token, lookup table strategies)
- Bundle processing:        ~30 tests  (transaction, batch, conditional CRUD)
- Provider bridges:         ~20 tests  (FhirDefinitionBridge, FhirRuntimeProvider)
```

---

## Compatibility

| Environment | Adapter                | Status                              |
| ----------- | ---------------------- | ----------------------------------- |
| Node.js 18+ | `BetterSqlite3Adapter` | Production recommended (SQLite)     |
| Node.js 18+ | `PostgresAdapter`      | Production recommended (PostgreSQL) |
| Electron    | `BetterSqlite3Adapter` | Supported                           |

---

## What's New in v0.6.0

- **Full-text search** — SQLite FTS5 virtual tables + PostgreSQL tsvector/GIN expression indexes for HumanName, Address lookup tables
- **Reindex progress callbacks** — `ReindexProgressCallbackV2` in `cli/reindex.ts` with `onProgress` reporting per batch
- **Conditional operations** — `ConditionalService` with `conditionalCreate` / `conditionalUpdate` / `conditionalDelete` (FHIR R4 semantics, transactional TOCTOU protection)
- **FhirSystem fullTextSearch config** — `features.fullTextSearch` option for enabling FTS query paths

## What's Next

`fhir-persistence` v0.6.0 is the foundation for:

- **fhir-engine** — central orchestrator that bootstraps definition + runtime + persistence
- **fhir-server** — HTTP FHIR R4 REST API
- **fhir-cli** — migration and reindex CLI tools with progress display
- **fhir-studio** — GUI for FHIR resource browsing and editing
