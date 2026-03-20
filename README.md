# fhir-persistence

Embedded FHIR R4 persistence layer — CRUD, search, indexing, and schema migration over SQLite and PostgreSQL.

[![npm version](https://img.shields.io/npm/v/fhir-persistence)](https://www.npmjs.com/package/fhir-persistence)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

> **v0.9.0** — Token search fix: FHIR-correct code-only / empty-system matching (`|code`, `code`)

## Features

- **StorageAdapter abstraction** — unified async interface for SQLite and PostgreSQL
- **Dual-backend support** — `BetterSqlite3Adapter` (native SQLite) + `PostgresAdapter` (pg)
- **SqlDialect abstraction** — dialect-aware SQL generation for array operators, DDL, upsert
- **3-table-per-resource pattern** — Main + History + References tables per FHIR resource type
- **Automatic search indexing** — column, token-column, and lookup-table strategies
- **FHIRPath-driven extraction** — optional `RuntimeProvider` bridge for `fhir-runtime` powered indexing
- **Chain search** — `subject:Patient.birthdate=1990-01-15`
- **\_include / \_revinclude** — with recursive `_include:iterate` support (max depth 3)
- **Search planner** — filter reordering, chain depth validation, two-phase SQL recommendation
- **Two-phase SQL** — id-first query for large table performance
- **IG-driven schema** — StructureDefinition + SearchParameter → DDL (SQLite + PostgreSQL dialects)
- **Migration engine** — SchemaDiff → MigrationGenerator → MigrationRunnerV2
- **Full-text search** — SQLite FTS5 + PostgreSQL tsvector/GIN for string search parameters
- **Conditional operations** — conditionalCreate / conditionalUpdate / conditionalDelete via `ConditionalService`
- **Reindex progress** — `onProgress` callback for CLI and UI progress reporting
- **Bundle processing** — transaction and batch bundle support
- **Terminology** — TerminologyCodeRepo + ValueSetRepo
- **FhirSystem orchestrator** — end-to-end startup flow for `fhir-engine` integration
- **Provider bridges** — `FhirDefinitionBridge` + `FhirRuntimeProvider` for `fhir-definition` / `fhir-runtime`

## Install

```bash
npm install fhir-persistence
```

**Peer dependencies:**

```bash
npm install fhir-definition fhir-runtime

# For PostgreSQL support (optional):
npm install pg
```

## Quick Start

### SQLite (standalone)

```typescript
import {
  BetterSqlite3Adapter,
  FhirPersistence,
  SearchParameterRegistry,
} from "fhir-persistence";

// 1. Create storage adapter
const adapter = new BetterSqlite3Adapter({ path: "./fhir.db" });

// 2. Create search parameter registry
const spRegistry = new SearchParameterRegistry();
spRegistry.indexBundle(searchParameterBundle);

// 3. Create persistence facade
const persistence = new FhirPersistence({
  adapter,
  searchParameterRegistry: spRegistry,
});

// 4. CRUD with automatic indexing
const patient = await persistence.createResource("Patient", {
  resourceType: "Patient",
  name: [{ family: "Smith", given: ["John"] }],
  birthDate: "1990-01-15",
  active: true,
});

const result = await persistence.searchResources({
  resourceType: "Patient",
  queryParams: {
    birthdate: "ge1990-01-01",
    active: "true",
    _sort: "-birthdate",
  },
});
```

### PostgreSQL

```typescript
import { PostgresAdapter, FhirStore } from "fhir-persistence";
import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "fhir_db",
  user: "postgres",
  password: "secret",
});
const adapter = new PostgresAdapter(pool);
const store = new FhirStore(adapter);

// Same CRUD API as SQLite — no code changes needed
const patient = await store.createResource("Patient", {
  resourceType: "Patient",
  name: [{ family: "Smith" }],
});
```

### With FhirSystem (recommended for fhir-engine)

```typescript
import { BetterSqlite3Adapter, FhirSystem, FhirDefinitionBridge } from 'fhir-persistence';
import { loadDefinitionPackages } from 'fhir-definition';
import { createRuntime } from 'fhir-runtime';

// 1. Load FHIR definitions
const { registry } = loadDefinitionPackages('./fhir-packages');

// 2. Create runtime with definitions
const runtime = await createRuntime({ definitions: registry });

// 3. Create adapter + bridges
const adapter = new BetterSqlite3Adapter({ path: './fhir.db' });
const definitionBridge = new FhirDefinitionBridge(registry);

// 4. Bootstrap via FhirSystem
const system = new FhirSystem(adapter, { dialect: 'sqlite' });  // or 'postgres'
const { persistence, sdRegistry, spRegistry, igResult } =
  await system.initialize(definitionBridge);

// 5. Use persistence
const patient = await persistence.createResource('Patient', { resourceType: 'Patient', ... });
```

## Architecture

```
StorageAdapter (BetterSqlite3Adapter / PostgresAdapter)
  │
  ├── SqlDialect (SQLiteDialect / PostgresDialect)
  │     └── Dialect-aware: DDL, array operators, upsert, timestamps
  │
  └── FhirPersistence (end-to-end facade)
        ├── FhirStore (basic CRUD + soft delete + optimistic locking + versioning)
        ├── IndexingPipeline
        │     ├── RuntimeProvider (FHIRPath extraction, optional)
        │     ├── buildSearchColumns (fallback row indexer)
        │     ├── extractReferencesV2 (reference indexer)
        │     └── LookupTableWriter (HumanName/Address/ContactPoint/Identifier)
        ├── ConditionalService (conditional CRUD)
        ├── BundleProcessorV2 (transaction / batch)
        ├── SearchParameterRegistry
        └── Search Engine
              ├── WhereBuilder v2 (chain search, dialect-aware)
              ├── SearchPlanner (filter reorder, two-phase recommendation)
              ├── SearchSQLBuilder v2 (single-phase + two-phase)
              ├── SearchExecutor (_include / _revinclude / _include:iterate)
              └── SearchBundleBuilder
```

## Storage Adapters

| Adapter                | Backend                 | Use Case                          |
| ---------------------- | ----------------------- | --------------------------------- |
| `BetterSqlite3Adapter` | better-sqlite3 (native) | Production Node.js, CLI, Electron |
| `PostgresAdapter`      | pg (connection pool)    | Production server                 |

## Search

```typescript
import {
  parseSearchRequest,
  buildSearchSQLv2,
  planSearch,
} from "fhir-persistence";

// Parse search URL
const request = parseSearchRequest(
  "Patient",
  {
    birthdate: "ge1990-01-01",
    active: "true",
    _sort: "-birthdate",
    _count: "50",
  },
  registry,
);

// Single-phase SQL (dialect-aware)
const sql = buildSearchSQLv2(request, registry);

// Two-phase SQL for large tables
const plan = planSearch(request, registry, { estimatedRowCount: 100_000 });
if (plan.useTwoPhase) {
  const { phase1, phase2Template } = buildTwoPhaseSearchSQLv2(
    plan.request,
    registry,
  );
}

// Chain search
const chainRequest = parseSearchRequest(
  "Observation",
  {
    "subject:Patient.birthdate": "ge1990-01-01",
  },
  registry,
);
```

## Schema Migration

The IG persistence manager automatically handles schema evolution:

```typescript
import { IGPersistenceManager } from "fhir-persistence";

// Dialect: 'sqlite' or 'postgres'
const igManager = new IGPersistenceManager(adapter, "postgres");
const result = await igManager.initialize({
  name: "hl7.fhir.r4.core",
  version: "4.0.1",
  checksum: contentChecksum,
  tableSets: generatedTableSets,
});
// result.action: 'new' | 'upgrade' | 'consistent'
```

## Integration with fhir-engine

`fhir-persistence` is designed to be bootstrapped by `fhir-engine`:

```typescript
import { createFhirEngine } from "fhir-engine";

const engine = await createFhirEngine({
  database: { type: "sqlite", url: "./fhir.db" }, // or { type: 'postgres', ... }
  packages: { path: "./fhir-packages" },
});

// engine.persistence — FhirPersistence instance
// engine.definitions — DefinitionRegistry
// engine.runtime — FhirRuntimeInstance
```

## Dependencies

| Package           | Role                                                                   |
| ----------------- | ---------------------------------------------------------------------- |
| `fhir-definition` | StructureDefinition, SearchParameter, ValueSet, CodeSystem definitions |
| `fhir-runtime`    | FHIRPath evaluation, validation, search value extraction               |
| `better-sqlite3`  | Native SQLite bindings (production)                                    |
| `pg`              | PostgreSQL client (optional peer dependency)                           |

## License

[MIT](./LICENSE)
