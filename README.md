# @medxai/fhir-persistence

Embedded FHIR R4 persistence layer with SQLite and PostgreSQL support.

## Features

- **StorageAdapter abstraction** — unified interface for SQLite (sql.js) and PostgreSQL
- **3-table-per-resource pattern** — Main + History + References tables
- **Automatic search indexing** — column, token-column, and lookup-table strategies
- **Chain search** — `subject:Patient.birthdate=1990-01-15`
- **Search planner** — filter reordering, chain depth validation, two-phase SQL recommendation
- **Two-phase SQL** — id-first query for large table performance
- **IG-driven schema** — StructureDefinition + SearchParameter → DDL
- **Migration engine** — SchemaDiff → MigrationGenerator → MigrationRunnerV2
- **Platform IG** — built-in User/Bot/Project/Agent/ClientApplication resources
- **Terminology** — TerminologyCodeRepo + ValueSetRepo
- **Production hardening** — ResourceCacheV2, SearchLogger, ReindexCLI

## Quick Start (v2)

```typescript
import {
  SQLiteAdapter,
  SearchParameterRegistry,
  FhirPersistence,
} from "@medxai/fhir-persistence";

// 1. Create adapter
const adapter = new SQLiteAdapter(); // in-memory SQLite
await adapter.initialize();

// 2. Create registry with search parameters
const registry = new SearchParameterRegistry();
registry.indexBundle(searchParameterBundle);

// 3. Create persistence facade
const persistence = new FhirPersistence({ adapter, registry });

// 4. CRUD with automatic indexing
const patient = await persistence.createResource("Patient", {
  resourceType: "Patient",
  birthDate: "1990-01-15",
  active: true,
});

const read = await persistence.readResource("Patient", patient.id);

await persistence.updateResource("Patient", {
  ...read,
  birthDate: "1991-02-02",
});

await persistence.deleteResource("Patient", patient.id);
```

## Architecture

```
StorageAdapter (SQLite / PostgreSQL)
  └── FhirPersistence (end-to-end facade)
        ├── FhirStore (basic CRUD)
        ├── IndexingPipeline
        │     ├── buildSearchColumns (row indexer)
        │     ├── extractReferencesV2 (reference indexer)
        │     └── LookupTableWriter (HumanName/Address/ContactPoint/Identifier)
        ├── SearchParameterRegistry
        └── Search Engine
              ├── WhereBuilder v2 (chain search, ? placeholders)
              ├── SearchPlanner (filter reorder, two-phase recommendation)
              ├── SearchSQLBuilder v2 (single-phase + two-phase)
              └── SearchBundleBuilder
```

## Search

```typescript
import {
  parseSearchRequest,
  buildSearchSQLv2,
  planSearch,
  buildTwoPhaseSearchSQLv2,
} from "@medxai/fhir-persistence";

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

// Option A: Single-phase SQL
const sql = buildSearchSQLv2(request, registry);
// → SELECT "id","versionId","content","lastUpdated","deleted"
//   FROM "Patient" WHERE "deleted" = 0 AND ... ORDER BY ... LIMIT ?

// Option B: Use planner for optimization
const plan = planSearch(request, registry, { estimatedRowCount: 100_000 });
if (plan.useTwoPhase) {
  const { phase1, phase2Template } = buildTwoPhaseSearchSQLv2(
    plan.request,
    registry,
  );
  // Phase 1: SELECT "id" FROM "Patient" WHERE ... LIMIT ?
  // Phase 2: SELECT ... FROM "Patient" WHERE "id" IN (?, ?, ...)
}

// Chain search
const chainRequest = parseSearchRequest(
  "Observation",
  {
    "subject:Patient.birthdate": "ge1990-01-01",
  },
  registry,
);
const chainSql = buildSearchSQLv2(chainRequest, registry);
// → EXISTS (SELECT 1 FROM "Observation_References" __ref
//     JOIN "Patient" __target ON __ref."targetId" = __target."id"
//     WHERE __ref."resourceId" = "Observation"."id" AND ...)
```

## Migration from v1

| v1 API                                | v2 Replacement                                                |
| ------------------------------------- | ------------------------------------------------------------- |
| `DatabaseClient`                      | `SQLiteAdapter` / `PostgresAdapter`                           |
| `FhirRepository`                      | `FhirPersistence` (with indexing) or `FhirStore` (basic CRUD) |
| `MigrationRunner`                     | `MigrationRunnerV2`                                           |
| `buildWhereFragment`                  | `buildWhereFragmentV2` (? placeholders)                       |
| `buildWhereClause`                    | `buildWhereClauseV2` (? placeholders, chain search)           |
| `buildSearchSQL`                      | `buildSearchSQLv2` (? placeholders, no projectId)             |
| `buildCountSQL`                       | `buildCountSQLv2` (? placeholders)                            |
| `processTransaction` / `processBatch` | `BundleProcessorV2` (via FhirPersistence)                     |

### Key differences

- **Placeholders**: v1 uses `$N` (PostgreSQL), v2 uses `?` (SQLite-compatible)
- **No projectId**: v2 removes multi-tenant projectId scoping
- **Soft delete**: v2 uses `deleted INTEGER 0/1` instead of `deleted BOOLEAN`
- **Automatic indexing**: `FhirPersistence` automatically populates search columns, references, and lookup tables on CRUD
- **Chain search**: v2 `buildWhereClauseV2` supports chained search parameters

## Test Suite

```
Stage 1-9:    295 tests (StorageAdapter → Production Hardening)
Compliance:    60 tests (ADR compliance verification)
Phase A:       37 tests (IndexingPipeline, LookupTableWriter, FhirPersistence)
Phase B:       23 tests (Chain search, SearchPlanner, Two-phase SQL)
Total:        415 v2 tests
```

## License

See [LICENSE](./LICENSE).
