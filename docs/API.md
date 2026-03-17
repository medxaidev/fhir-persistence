# fhir-persistence — API Reference

Version: 0.6.1

---

## Core Facade

### `FhirPersistence`

End-to-end FHIR persistence facade with automatic search indexing.

```typescript
import { FhirPersistence } from 'fhir-persistence';

const persistence = new FhirPersistence(options: FhirPersistenceOptions);
```

**Options:**

| Property                  | Type                      | Required | Description                             |
| ------------------------- | ------------------------- | -------- | --------------------------------------- |
| `adapter`                 | `StorageAdapter`          | Yes      | Database adapter (SQLite or PostgreSQL) |
| `searchParameterRegistry` | `SearchParameterRegistry` | Yes      | Indexed search parameters               |
| `runtimeProvider`         | `RuntimeProvider`         | No       | FHIRPath extraction (from fhir-runtime) |

**Methods:**

| Method                           | Returns                            | Description               |
| -------------------------------- | ---------------------------------- | ------------------------- |
| `createResource(type, resource)` | `Promise<PersistedResource>`       | Create with auto-indexing |
| `readResource(type, id)`         | `Promise<PersistedResource>`       | Read by ID                |
| `updateResource(type, resource)` | `Promise<PersistedResource>`       | Update with re-indexing   |
| `deleteResource(type, id)`       | `Promise<void>`                    | Soft delete               |
| `searchResources(request)`       | `Promise<SearchResult>`            | Search with pagination    |
| `searchStream(request)`          | `AsyncIterable<PersistedResource>` | Streaming search results  |

---

### `FhirStore`

Basic CRUD without search indexing (lower-level).

```typescript
import { FhirStore } from 'fhir-persistence';

const store = new FhirStore(adapter: StorageAdapter);
```

**Methods:**

| Method                                     | Returns                      | Description                                             |
| ------------------------------------------ | ---------------------------- | ------------------------------------------------------- |
| `createResource(type, resource, options?)` | `Promise<PersistedResource>` | Insert resource                                         |
| `readResource(type, id)`                   | `Promise<PersistedResource>` | Read by ID                                              |
| `updateResource(type, resource, options?)` | `Promise<PersistedResource>` | Update resource (supports `ifMatch` optimistic locking) |
| `deleteResource(type, id)`                 | `Promise<void>`              | Soft delete (content preserved)                         |
| `readHistory(type, id, options?)`          | `Promise<HistoryEntry[]>`    | Instance history (newest first)                         |
| `readVersion(type, id, versionId)`         | `Promise<PersistedResource>` | Read specific version (vread)                           |

---

## Storage Adapters

### `StorageAdapter` (interface)

```typescript
import type { StorageAdapter } from "fhir-persistence";
```

| Method        | Signature                                                           |
| ------------- | ------------------------------------------------------------------- |
| `execute`     | `(sql: string, params?: unknown[]) => Promise<{ changes: number }>` |
| `query`       | `<T>(sql: string, params?: unknown[]) => Promise<T[]>`              |
| `queryOne`    | `<T>(sql: string, params?: unknown[]) => Promise<T \| undefined>`   |
| `queryStream` | `<T>(sql: string, params?: unknown[]) => AsyncIterable<T>`          |
| `prepare`     | `<T>(sql: string) => PreparedStatement<T>`                          |
| `transaction` | `<R>(fn: (tx: TransactionContext) => Promise<R>) => Promise<R>`     |
| `close`       | `() => Promise<void>`                                               |

### `BetterSqlite3Adapter`

Native SQLite via better-sqlite3. **Recommended for production Node.js.**

```typescript
import { BetterSqlite3Adapter } from "fhir-persistence";

const adapter = new BetterSqlite3Adapter({ path: "./fhir.db" });
// or in-memory:
const adapter = new BetterSqlite3Adapter({ path: ":memory:" });
```

**Options (`BetterSqlite3Options`):**

| Property | Type     | Default      | Description        |
| -------- | -------- | ------------ | ------------------ |
| `path`   | `string` | `':memory:'` | Database file path |

### `PostgresAdapter`

PostgreSQL via `pg` connection pool. **Recommended for production servers.**

```typescript
import { PostgresAdapter } from "fhir-persistence";
import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "fhir_db",
  user: "postgres",
  password: "secret",
});
const adapter = new PostgresAdapter(pool);
```

**Features:**

- Automatic `?` → `$1, $2, ...` placeholder rewriting
- Transaction support via pool client + `BEGIN`/`COMMIT`/`ROLLBACK`
- Serialization failure retry (code 40001) with exponential backoff
- `queryStream` via row-by-row iteration
- `close()` guard preventing use-after-close

---

## SQL Dialect

### `SqlDialect` (interface)

Abstracts SQL syntax differences between SQLite and PostgreSQL.

```typescript
import type { SqlDialect } from "fhir-persistence";
import { SQLiteDialect, PostgresDialect } from "fhir-persistence";

const sqliteDialect = new SQLiteDialect();
const pgDialect = new PostgresDialect();
```

| Method                          | SQLite                    | PostgreSQL                     |
| ------------------------------- | ------------------------- | ------------------------------ |
| `placeholder(n)`                | `?`                       | `$n`                           |
| `textArrayContains(col, param)` | `json_each(col)` subquery | `col @> ARRAY[param]`          |
| `timestampType`                 | `TEXT`                    | `TIMESTAMPTZ`                  |
| `identityColumn`                | `AUTOINCREMENT`           | `GENERATED ALWAYS AS IDENTITY` |
| `upsertSuffix(...)`             | `INSERT OR REPLACE`       | `ON CONFLICT ... DO UPDATE`    |

---

## Registries

### `SearchParameterRegistry`

```typescript
import { SearchParameterRegistry } from "fhir-persistence";

const registry = new SearchParameterRegistry();
registry.indexBundle(searchParameterBundle); // bulk index
registry.index(searchParam); // single index

const params = registry.getForResource("Patient");
const param = registry.get("Patient", "birthdate");
```

### `StructureDefinitionRegistry`

```typescript
import { StructureDefinitionRegistry } from "fhir-persistence";

const sdRegistry = new StructureDefinitionRegistry();
sdRegistry.index(structureDefinition);

const sd = sdRegistry.get("Patient");
const all = sdRegistry.getAll();
```

---

## Schema & DDL

### Schema Builder

```typescript
import {
  buildResourceTableSet,
  buildAllResourceTableSets,
} from "fhir-persistence";

// Single resource type
const tableSet = buildResourceTableSet("Patient", sdRegistry, spRegistry);

// All registered resource types
const allSets = buildAllResourceTableSets(sdRegistry, spRegistry);
```

### DDL Generator

Generates dialect-aware DDL statements. The `dialect` parameter accepts `'sqlite'` or `'postgres'`.

```typescript
import {
  generateCreateMainTable,
  generateCreateHistoryTable,
  generateCreateReferencesTable,
  generateResourceDDL,
} from "fhir-persistence";

// SQLite DDL
const mainDDL = generateCreateMainTable(tableSet.main, "sqlite");

// PostgreSQL DDL
const pgDDL = generateCreateMainTable(tableSet.main, "postgres");

// Full DDL for a resource type (CREATE TABLE + CREATE INDEX)
const allStmts = generateResourceDDL(tableSet, "postgres");
for (const stmt of allStmts) {
  await adapter.execute(stmt);
}
```

---

## Search

### Parse & Build

```typescript
import {
  parseSearchRequest,
  buildSearchSQLv2,
  buildCountSQLv2,
} from "fhir-persistence";

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

// Optional dialect parameter for PostgreSQL-compatible SQL
const { sql, params } = buildSearchSQLv2(request, registry);
const { sql: countSql, params: countParams } = buildCountSQLv2(
  request,
  registry,
);
```

### Chain Search

```typescript
const request = parseSearchRequest(
  "Observation",
  {
    "subject:Patient.birthdate": "ge1990-01-01",
  },
  registry,
);
```

### Search Planner

```typescript
import { planSearch, buildTwoPhaseSearchSQLv2 } from "fhir-persistence";

const plan = planSearch(request, registry, { estimatedRowCount: 100_000 });
if (plan.useTwoPhase) {
  const { phase1, phase2Template } = buildTwoPhaseSearchSQLv2(
    plan.request,
    registry,
  );
}
```

### Where Builder

Dialect-aware WHERE clause generation.

```typescript
import { buildWhereFragmentV2, buildWhereClauseV2 } from "fhir-persistence";
import { PostgresDialect } from "fhir-persistence";

// SQLite (default)
const fragment = buildWhereFragmentV2(parsedParam, registry);

// PostgreSQL
const pgFragment = buildWhereFragmentV2(
  parsedParam,
  registry,
  new PostgresDialect(),
);
```

---

## Migration Engine

### `IGPersistenceManager`

```typescript
import { IGPersistenceManager } from "fhir-persistence";

// Dialect: 'sqlite' or 'postgres'
const igManager = new IGPersistenceManager(adapter, "postgres");

const result = await igManager.initialize({
  name: "hl7.fhir.r4.core",
  version: "4.0.1",
  checksum: computedChecksum,
  tableSets: generatedTableSets,
});

// result: { action: 'new'|'upgrade'|'consistent', ddlCount, reindexCount }
```

### Schema Diff

```typescript
import { compareSchemas, generateMigration } from "fhir-persistence";

const deltas = compareSchemas(oldTableSets, newTableSets);

// Generate dialect-specific migration DDL
const sqliteMigration = generateMigration(deltas, "sqlite");
const pgMigration = generateMigration(deltas, "postgres");
// migration.up: string[] — DDL statements to apply
```

### Package Registry

```typescript
import { PackageRegistryRepo } from "fhir-persistence";

const repo = new PackageRegistryRepo(adapter);
const status = await repo.checkStatus("hl7.fhir.r4.core", checksum);
const pkg = await repo.getPackage("hl7.fhir.r4.core");
```

---

## Indexing

### `IndexingPipeline`

```typescript
import { IndexingPipeline } from "fhir-persistence";

const pipeline = new IndexingPipeline({
  adapter,
  searchParameterRegistry: spRegistry,
  runtimeProvider, // optional — enables FHIRPath extraction
});

const result = await pipeline.index("Patient", resource, tableSet);
```

---

## Provider Bridges

### `FhirDefinitionBridge`

Wraps `fhir-definition`'s `DefinitionRegistry` into `fhir-persistence`'s `DefinitionProvider`.

```typescript
import { FhirDefinitionBridge } from "fhir-persistence";
import { loadDefinitionPackages } from "fhir-definition";

const { registry } = loadDefinitionPackages("./fhir-packages");
const bridge = new FhirDefinitionBridge(registry);
// bridge satisfies DefinitionProvider
```

### `FhirRuntimeProvider`

Wraps `fhir-runtime`'s `FhirRuntimeInstance` into `fhir-persistence`'s `RuntimeProvider`.

```typescript
import { FhirRuntimeProvider } from "fhir-persistence";
import { createRuntime } from "fhir-runtime";

const runtime = await createRuntime({ definitions: registry });
const provider = new FhirRuntimeProvider({ runtime });
// provider satisfies RuntimeProvider
```

---

## Startup Orchestrator

### `FhirSystem`

End-to-end bootstrap: definitions → registries → schema → persistence.

```typescript
import {
  FhirSystem,
  BetterSqlite3Adapter,
  FhirDefinitionBridge,
} from "fhir-persistence";

const adapter = new BetterSqlite3Adapter({ path: "./fhir.db" });
const system = new FhirSystem(adapter, {
  dialect: "sqlite", // or 'postgres'
  runtimeProvider, // optional
  packageName: "my-app",
  packageVersion: "1.0.0",
});

const result = await system.initialize(definitionBridge);
// result.persistence: FhirPersistence
// result.sdRegistry: StructureDefinitionRegistry
// result.spRegistry: SearchParameterRegistry
// result.igResult: IGInitResult
```

---

## Terminology

```typescript
import { TerminologyCodeRepo, ValueSetRepo } from "fhir-persistence";

const termRepo = new TerminologyCodeRepo(adapter);
const vsRepo = new ValueSetRepo(adapter);
```

---

## Conditional Operations

### `ConditionalService`

FHIR R4 conditional create/update/delete with transactional TOCTOU protection.

```typescript
import { ConditionalService } from "fhir-persistence";

const conditionalService = new ConditionalService(adapter, spRegistry);
```

**Methods:**

| Method                                            | Returns                            | Description                                |
| ------------------------------------------------- | ---------------------------------- | ------------------------------------------ |
| `conditionalCreate(type, resource, searchParams)` | `Promise<ConditionalCreateResult>` | 0 match → create, 1 → existing, 2+ → error |
| `conditionalUpdate(type, resource, searchParams)` | `Promise<ConditionalUpdateResult>` | 0 match → create, 1 → update, 2+ → error   |
| `conditionalDelete(type, searchParams)`           | `Promise<ConditionalDeleteResult>` | Delete all matching, return count          |

**Result Types:**

```typescript
interface ConditionalCreateResult<T> {
  outcome: "created" | "existing";
  resource: T;
}

interface ConditionalUpdateResult<T> {
  outcome: "created" | "updated";
  resource: T;
}

interface ConditionalDeleteResult {
  count: number;
}
```

**Errors:**

- `PreconditionFailedError` (HTTP 412) — thrown when conditional create/update matches 2+ resources

---

## Reindex Utilities

```typescript
import { reindexResourceTypeV2, reindexAllV2 } from "fhir-persistence";
import type { ReindexProgressCallbackV2 } from "fhir-persistence";

// Reindex a single resource type with progress
const onProgress: ReindexProgressCallbackV2 = ({
  resourceType,
  processed,
  total,
}) => {
  console.log(`${resourceType}: ${processed}/${total}`);
};

const result = await reindexResourceTypeV2(adapter, "Patient", onProgress);
// result: { processed: number, updated: number, errors: number }

// Reindex all resource types
const allResult = await reindexAllV2(
  adapter,
  ["Patient", "Observation"],
  onProgress,
);
```

---

## Production Utilities

```typescript
import { ResourceCacheV2, SearchLogger } from "fhir-persistence";

// In-memory cache
const cache = new ResourceCacheV2({ maxSize: 1000, ttlMs: 60_000 });

// Search logging
const logger = new SearchLogger();
```

---

## Types

Key exported types:

| Type                        | Module     | Description                              |
| --------------------------- | ---------- | ---------------------------------------- |
| `StorageAdapter`            | db         | Database abstraction                     |
| `TransactionContext`        | db         | Async transaction callback context       |
| `SqlDialect`                | db         | SQL syntax abstraction interface         |
| `BetterSqlite3Options`      | db         | better-sqlite3 config                    |
| `FhirPersistenceOptions`    | store      | Persistence facade config                |
| `FhirResource`              | repo       | Base FHIR resource shape                 |
| `PersistedResource`         | repo       | Resource with id/versionId/lastUpdated   |
| `SearchRequest`             | search     | Parsed search parameters                 |
| `SearchResult`              | repo       | Search result with pagination            |
| `SearchBundle`              | search     | FHIR Bundle search response              |
| `ResourceTableSet`          | schema     | Main + History + References schema       |
| `SearchParameterImpl`       | registry   | Indexed search parameter                 |
| `SchemaDelta`               | migration  | Schema diff entry                        |
| `GeneratedMigration`        | migration  | Migration DDL statements                 |
| `MigrationV2`               | migrations | Migration definition (version, up, down) |
| `IGInitResult`              | migration  | IG initialization result                 |
| `IndexResult`               | repo       | Indexing pipeline result                 |
| `ConditionalCreateResult`   | store      | Conditional create outcome               |
| `ConditionalUpdateResult`   | store      | Conditional update outcome               |
| `ConditionalDeleteResult`   | store      | Conditional delete outcome               |
| `PreconditionFailedError`   | repo       | Multiple-match conditional error         |
| `ReindexProgressCallbackV2` | cli        | Reindex progress callback type           |
