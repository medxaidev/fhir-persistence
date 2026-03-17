# fhir-persistence — API 完整参考文档 (Complete API Reference)

**文档版本 (Document Version):** 1.0.0  
**适用产品版本 (Product Version):** fhir-persistence v0.6.0+  
**最后更新 (Last Updated):** 2024-03

---

## 版本要求 (Version Requirements)

| 组件 | 最低版本 | 说明 |
|------|---------|------|
| fhir-persistence | 0.6.0 | 本包 |
| Node.js | 18.0.0 | 运行时环境 |
| TypeScript | 5.0.0 | 开发依赖（可选） |
| fhir-definition | 0.5.0 | FHIR 定义 |
| fhir-runtime | 0.8.1 | FHIRPath 运行时 |
| better-sqlite3 | 12.6.2 | SQLite 适配器 |
| pg | 8.0.0 | PostgreSQL 适配器（可选） |

---

## 目录 (Table of Contents)

1. [核心门面 (Core Facades)](#核心门面-core-facades)
2. [存储适配器 (Storage Adapters)](#存储适配器-storage-adapters)
3. [SQL 方言 (SQL Dialects)](#sql-方言-sql-dialects)
4. [注册表 (Registries)](#注册表-registries)
5. [Schema 和 DDL](#schema-和-ddl)
6. [搜索 API (Search API)](#搜索-api-search-api)
7. [迁移引擎 (Migration Engine)](#迁移引擎-migration-engine)
8. [索引管道 (Indexing Pipeline)](#索引管道-indexing-pipeline)
9. [条件操作 (Conditional Operations)](#条件操作-conditional-operations)
10. [Bundle 处理 (Bundle Processing)](#bundle-处理-bundle-processing)
11. [术语服务 (Terminology)](#术语服务-terminology)
12. [启动编排器 (Startup Orchestrator)](#启动编排器-startup-orchestrator)
13. [生产工具 (Production Utilities)](#生产工具-production-utilities)
14. [类型定义 (Type Definitions)](#类型定义-type-definitions)

---

## 核心门面 (Core Facades)

### FhirPersistence

端到端 FHIR 持久化门面，提供自动搜索索引。

**版本要求**: v0.6.0+

#### 构造函数

```typescript
import { FhirPersistence } from 'fhir-persistence';

const persistence = new FhirPersistence(options: FhirPersistenceOptions);
```

#### FhirPersistenceOptions

| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `adapter` | `StorageAdapter` | 是 | 数据库适配器 |
| `searchParameterRegistry` | `SearchParameterRegistry` | 是 | 搜索参数注册表 |
| `runtimeProvider` | `RuntimeProvider` | 否 | FHIRPath 提取器（来自 fhir-runtime） |

#### 方法

##### createResource()

创建资源并自动索引。

```typescript
async createResource<T extends FhirResource>(
  resourceType: string,
  resource: T,
  options?: CreateResourceOptions
): Promise<PersistedResource<T>>
```

**参数**:
- `resourceType`: FHIR 资源类型（如 'Patient'）
- `resource`: 资源内容
- `options`: 可选配置
  - `context`: 操作上下文（用于审计）

**返回**: 持久化的资源（包含 id, versionId, lastUpdated）

**抛出**:
- `RepositoryError`: 数据库错误

**示例**:
```typescript
const patient = await persistence.createResource('Patient', {
  resourceType: 'Patient',
  name: [{ family: 'Smith', given: ['John'] }],
  birthDate: '1990-01-15',
});
```

##### readResource()

根据 ID 读取资源。

```typescript
async readResource<T extends FhirResource>(
  resourceType: string,
  id: string
): Promise<PersistedResource<T>>
```

**抛出**:
- `ResourceNotFoundError`: 资源不存在
- `ResourceGoneError`: 资源已被删除

##### updateResource()

更新资源并重新索引。

```typescript
async updateResource<T extends FhirResource>(
  resourceType: string,
  resource: T,
  options?: UpdateResourceOptions
): Promise<PersistedResource<T>>
```

**UpdateResourceOptions**:
- `ifMatch`: 版本号（乐观锁定）
- `context`: 操作上下文

**抛出**:
- `ResourceVersionConflictError`: 版本冲突（ifMatch 不匹配）

##### deleteResource()

软删除资源。

```typescript
async deleteResource(
  resourceType: string,
  id: string
): Promise<void>
```

##### searchResources()

搜索资源并返回分页结果。

```typescript
async searchResources(
  request: SearchOptions
): Promise<SearchResult>
```

**SearchOptions**:
```typescript
interface SearchOptions {
  resourceType: string;
  queryParams: Record<string, string | string[]>;
  context?: OperationContext;
}
```

**SearchResult**:
```typescript
interface SearchResult {
  resources: PersistedResource[];
  total: number;
  hasMore: boolean;
  nextPageToken?: string;
}
```

##### searchStream()

流式搜索（适用于大数据量）。

```typescript
searchStream(
  request: SearchOptions
): AsyncIterable<PersistedResource>
```

**示例**:
```typescript
for await (const resource of persistence.searchStream({
  resourceType: 'Patient',
  queryParams: { active: 'true' },
})) {
  console.log('Processing:', resource.id);
}
```

##### readHistory()

读取资源历史记录。

```typescript
async readHistory(
  resourceType: string,
  id: string,
  options?: HistoryOptions
): Promise<HistoryEntry[]>
```

**HistoryOptions**:
- `count`: 返回条目数（默认 10）
- `since`: 起始时间戳

##### readVersion()

读取特定版本（vread）。

```typescript
async readVersion<T extends FhirResource>(
  resourceType: string,
  id: string,
  versionId: string
): Promise<PersistedResource<T>>
```

---

### FhirStore

基础 CRUD，不包含搜索索引（低级 API）。

**版本要求**: v0.1.0+

```typescript
import { FhirStore } from 'fhir-persistence';

const store = new FhirStore(adapter: StorageAdapter);
```

**方法**: 与 `FhirPersistence` 相同的 CRUD 方法，但不执行自动索引。

**使用场景**: 需要完全控制索引过程，或不需要搜索功能。

---

## 存储适配器 (Storage Adapters)

### StorageAdapter (接口)

数据库抽象接口。

**版本要求**: v0.1.0+

```typescript
interface StorageAdapter {
  execute(sql: string, params?: unknown[]): Promise<{ changes: number }>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | undefined>;
  queryStream<T>(sql: string, params?: unknown[]): AsyncIterable<T>;
  prepare<T>(sql: string): PreparedStatement<T>;
  transaction<R>(fn: (tx: TransactionContext) => Promise<R>): Promise<R>;
  close(): Promise<void>;
}
```

---

### BetterSqlite3Adapter

原生 SQLite 适配器（生产推荐）。

**版本要求**: v0.1.0+

```typescript
import { BetterSqlite3Adapter } from 'fhir-persistence';

const adapter = new BetterSqlite3Adapter(options: BetterSqlite3Options);
```

#### BetterSqlite3Options

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `path` | `string` | `':memory:'` | 数据库文件路径 |

**示例**:
```typescript
// 文件数据库
const adapter = new BetterSqlite3Adapter({ path: './data/fhir.db' });

// 内存数据库（测试用）
const adapter = new BetterSqlite3Adapter({ path: ':memory:' });
```

**特性**:
- 同步 API 包装为异步
- 自动 WAL 模式
- 事务支持
- 预编译语句缓存

---

### PostgresAdapter

PostgreSQL 适配器（生产推荐）。

**版本要求**: v0.4.0+

```typescript
import { PostgresAdapter } from 'fhir-persistence';
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'fhir_db',
  user: 'postgres',
  password: 'secret',
  max: 20,
});

const adapter = new PostgresAdapter(pool);
```

**特性**:
- 自动 `?` → `$1, $2, ...` 占位符重写
- 事务支持（BEGIN/COMMIT/ROLLBACK）
- 序列化失败重试（40001 错误码）
- 流式查询（逐行迭代）
- 关闭保护（防止使用已关闭的适配器）

**连接池配置建议**:
```typescript
const pool = new Pool({
  // 连接参数
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // 池配置
  max: 20,                        // 最大连接数
  min: 5,                         // 最小连接数
  idleTimeoutMillis: 30000,       // 空闲超时
  connectionTimeoutMillis: 2000,  // 连接超时
  
  // SSL（生产环境）
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./ca-cert.pem').toString(),
  } : false,
});
```

---

## SQL 方言 (SQL Dialects)

### SqlDialect (接口)

SQL 语法差异抽象。

**版本要求**: v0.4.0+

```typescript
interface SqlDialect {
  placeholder(index: number): string;
  textArrayContains(column: string, param: string): string;
  timestampType: string;
  identityColumn: string;
  upsertSuffix(table: string, conflictColumns: string[], updateColumns: string[]): string;
}
```

---

### SQLiteDialect

SQLite 方言实现。

**版本要求**: v0.4.0+

```typescript
import { SQLiteDialect } from 'fhir-persistence';

const dialect = new SQLiteDialect();
```

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `placeholder(n)` | `'?'` | 位置占位符 |
| `textArrayContains(col, param)` | `json_each()` 子查询 | 数组包含检查 |
| `timestampType` | `'TEXT'` | 时间戳类型 |
| `identityColumn` | `'AUTOINCREMENT'` | 自增列 |

---

### PostgresDialect

PostgreSQL 方言实现。

**版本要求**: v0.4.0+

```typescript
import { PostgresDialect } from 'fhir-persistence';

const dialect = new PostgresDialect();
```

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `placeholder(n)` | `'$n'` | 编号占位符 |
| `textArrayContains(col, param)` | `col @> ARRAY[param]` | 数组操作符 |
| `timestampType` | `'TIMESTAMPTZ'` | 时区时间戳 |
| `identityColumn` | `'GENERATED ALWAYS AS IDENTITY'` | 标识列 |

---

## 注册表 (Registries)

### SearchParameterRegistry

搜索参数注册表。

**版本要求**: v0.1.0+

```typescript
import { SearchParameterRegistry } from 'fhir-persistence';

const registry = new SearchParameterRegistry();
```

#### 方法

##### index()

索引单个搜索参数。

```typescript
index(searchParameter: SearchParameterResource): void
```

##### indexBundle()

批量索引搜索参数。

```typescript
indexBundle(bundle: SearchParameterBundle): void
```

**SearchParameterBundle**:
```typescript
interface SearchParameterBundle {
  resourceType: 'Bundle';
  entry: Array<{
    resource: SearchParameterResource;
  }>;
}
```

##### get()

获取搜索参数。

```typescript
get(resourceType: string, code: string): SearchParameterImpl | undefined
```

##### getForResource()

获取资源类型的所有搜索参数。

```typescript
getForResource(resourceType: string): SearchParameterImpl[]
```

**示例**:
```typescript
const spRegistry = new SearchParameterRegistry();

// 索引单个参数
spRegistry.index({
  resourceType: 'SearchParameter',
  code: 'birthdate',
  base: ['Patient'],
  type: 'date',
  expression: 'Patient.birthDate',
});

// 批量索引
spRegistry.indexBundle(searchParameterBundle);

// 查询
const param = spRegistry.get('Patient', 'birthdate');
const allParams = spRegistry.getForResource('Patient');
```

---

### StructureDefinitionRegistry

结构定义注册表。

**版本要求**: v0.1.0+

```typescript
import { StructureDefinitionRegistry } from 'fhir-persistence';

const sdRegistry = new StructureDefinitionRegistry();
```

#### 方法

##### index()

```typescript
index(structureDefinition: StructureDefinition): void
```

##### get()

```typescript
get(url: string): StructureDefinition | undefined
```

##### getAll()

```typescript
getAll(): StructureDefinition[]
```

---

## Schema 和 DDL

### Schema 构建器

**版本要求**: v0.1.0+

#### buildResourceTableSet()

为单个资源类型构建表结构。

```typescript
import { buildResourceTableSet } from 'fhir-persistence';

const tableSet = buildResourceTableSet(
  resourceType: string,
  sdRegistry: StructureDefinitionRegistry,
  spRegistry: SearchParameterRegistry
): ResourceTableSet
```

**ResourceTableSet**:
```typescript
interface ResourceTableSet {
  resourceType: string;
  main: MainTableSchema;
  history: HistoryTableSchema;
  references: ReferencesTableSchema;
}
```

#### buildAllResourceTableSets()

为所有注册的资源类型构建表结构。

```typescript
import { buildAllResourceTableSets } from 'fhir-persistence';

const allSets = buildAllResourceTableSets(
  sdRegistry: StructureDefinitionRegistry,
  spRegistry: SearchParameterRegistry
): ResourceTableSet[]
```

#### buildSchemaDefinition()

构建完整 Schema 定义。

```typescript
import { buildSchemaDefinition } from 'fhir-persistence';

const schema = buildSchemaDefinition(
  tableSets: ResourceTableSet[]
): SchemaDefinition
```

---

### DDL 生成器

**版本要求**: v0.1.0+, 方言支持: v0.4.0+

#### generateCreateMainTable()

生成主表 DDL。

```typescript
import { generateCreateMainTable } from 'fhir-persistence';

const ddl = generateCreateMainTable(
  tableSchema: MainTableSchema,
  dialect: 'sqlite' | 'postgres'
): string
```

#### generateCreateHistoryTable()

生成历史表 DDL。

```typescript
import { generateCreateHistoryTable } from 'fhir-persistence';

const ddl = generateCreateHistoryTable(
  tableSchema: HistoryTableSchema,
  dialect: 'sqlite' | 'postgres'
): string
```

#### generateCreateReferencesTable()

生成引用表 DDL。

```typescript
import { generateCreateReferencesTable } from 'fhir-persistence';

const ddl = generateCreateReferencesTable(
  tableSchema: ReferencesTableSchema,
  dialect: 'sqlite' | 'postgres'
): string
```

#### generateCreateIndex()

生成索引 DDL。

```typescript
import { generateCreateIndex } from 'fhir-persistence';

const ddl = generateCreateIndex(
  indexSchema: IndexSchema,
  dialect: 'sqlite' | 'postgres'
): string
```

#### generateResourceDDL()

生成资源类型的所有 DDL（表 + 索引）。

```typescript
import { generateResourceDDL } from 'fhir-persistence';

const statements = generateResourceDDL(
  tableSet: ResourceTableSet,
  dialect: 'sqlite' | 'postgres'
): string[]
```

#### generateSchemaDDL()

生成完整 Schema 的所有 DDL。

```typescript
import { generateSchemaDDL } from 'fhir-persistence';

const statements = generateSchemaDDL(
  tableSets: ResourceTableSet[],
  dialect: 'sqlite' | 'postgres'
): string[]
```

#### generateSchemaDDLString()

生成 DDL 字符串（用分号分隔）。

```typescript
import { generateSchemaDDLString } from 'fhir-persistence';

const ddlString = generateSchemaDDLString(
  tableSets: ResourceTableSet[],
  dialect: 'sqlite' | 'postgres'
): string
```

**示例**:
```typescript
// SQLite DDL
const sqliteDDL = generateResourceDDL(tableSet, 'sqlite');
for (const stmt of sqliteDDL) {
  await adapter.execute(stmt);
}

// PostgreSQL DDL
const pgDDL = generateResourceDDL(tableSet, 'postgres');
for (const stmt of pgDDL) {
  await adapter.execute(stmt);
}
```

---

## 搜索 API (Search API)

### 搜索解析

**版本要求**: v0.2.0+

#### parseSearchRequest()

解析 FHIR 搜索参数。

```typescript
import { parseSearchRequest } from 'fhir-persistence';

const request = parseSearchRequest(
  resourceType: string,
  queryParams: Record<string, string | string[]>,
  registry: SearchParameterRegistry
): SearchRequest
```

**SearchRequest**:
```typescript
interface SearchRequest {
  resourceType: string;
  params: ParsedSearchParam[];
  sort: SortRule[];
  count: number;
  offset: number;
  include: string[];
  revinclude: string[];
}
```

**示例**:
```typescript
const request = parseSearchRequest(
  'Patient',
  {
    birthdate: 'ge1990-01-01',
    active: 'true',
    _sort: '-birthdate',
    _count: '50',
    _include: 'Patient:organization',
  },
  registry
);
```

---

### 搜索 SQL 构建

**版本要求**: v0.2.0+, 方言支持: v0.4.0+

#### buildSearchSQLv2()

构建搜索 SQL（单阶段）。

```typescript
import { buildSearchSQLv2 } from 'fhir-persistence';

const { sql, params } = buildSearchSQLv2(
  request: SearchRequest,
  registry: SearchParameterRegistry,
  dialect?: SqlDialect  // 可选，默认 SQLiteDialect
): SearchSQL
```

#### buildCountSQLv2()

构建计数 SQL。

```typescript
import { buildCountSQLv2 } from 'fhir-persistence';

const { sql, params } = buildCountSQLv2(
  request: SearchRequest,
  registry: SearchParameterRegistry,
  dialect?: SqlDialect
): CountSQL
```

#### buildTwoPhaseSearchSQLv2()

构建两阶段搜索 SQL（大表优化）。

```typescript
import { buildTwoPhaseSearchSQLv2 } from 'fhir-persistence';

const { phase1, phase2Template } = buildTwoPhaseSearchSQLv2(
  request: SearchRequest,
  registry: SearchParameterRegistry,
  dialect?: SqlDialect
): TwoPhaseSearchSQL
```

**TwoPhaseSearchSQL**:
```typescript
interface TwoPhaseSearchSQL {
  phase1: { sql: string; params: unknown[] };  // 只获取 ID
  phase2Template: string;                       // 获取完整资源的模板
}
```

---

### 搜索规划器

**版本要求**: v0.5.0+

#### planSearch()

优化搜索计划（过滤器重排序、两阶段推荐）。

```typescript
import { planSearch } from 'fhir-persistence';

const plan = planSearch(
  request: SearchRequest,
  registry: SearchParameterRegistry,
  options?: SearchPlannerOptions
): SearchPlan
```

**SearchPlannerOptions**:
```typescript
interface SearchPlannerOptions {
  estimatedRowCount?: number;  // 估计行数
  twoPhaseThreshold?: number;  // 两阶段阈值（默认 10000）
}
```

**SearchPlan**:
```typescript
interface SearchPlan {
  request: SearchRequest;       // 优化后的请求
  useTwoPhase: boolean;         // 是否推荐两阶段
  estimatedCost: number;        // 估计成本
  warnings: string[];           // 警告信息
}
```

---

### 搜索执行

**版本要求**: v0.2.0+

#### executeSearch()

执行搜索（包含 _include/_revinclude）。

```typescript
import { executeSearch } from 'fhir-persistence';

const result = await executeSearch(
  adapter: StorageAdapter,
  request: SearchRequest,
  registry: SearchParameterRegistry,
  dialect?: SqlDialect
): Promise<SearchResult>
```

#### mapRowsToResources()

将数据库行映射为资源。

```typescript
import { mapRowsToResources } from 'fhir-persistence';

const resources = mapRowsToResources(
  rows: any[]
): PersistedResource[]
```

---

### 搜索 Bundle 构建

**版本要求**: v0.2.0+

#### buildSearchBundle()

构建 FHIR 搜索 Bundle。

```typescript
import { buildSearchBundle } from 'fhir-persistence';

const bundle = buildSearchBundle(
  resources: PersistedResource[],
  options: BuildSearchBundleOptions
): SearchBundle
```

**BuildSearchBundleOptions**:
```typescript
interface BuildSearchBundleOptions {
  resourceType: string;
  queryParams: Record<string, string | string[]>;
  total: number;
  baseUrl?: string;
}
```

---

### 搜索辅助函数

#### parseParamKey()

解析搜索参数键（支持修饰符和链式搜索）。

```typescript
import { parseParamKey } from 'fhir-persistence';

const { code, modifier, chain } = parseParamKey('subject:Patient.birthdate');
// code: 'subject', modifier: undefined, chain: ['Patient', 'birthdate']
```

#### splitSearchValues()

分割搜索值（逗号分隔 = OR，多个参数 = AND）。

```typescript
import { splitSearchValues } from 'fhir-persistence';

const values = splitSearchValues('value1,value2');
// ['value1', 'value2']
```

#### extractPrefix()

提取搜索前缀。

```typescript
import { extractPrefix } from 'fhir-persistence';

const { prefix, value } = extractPrefix('ge1990-01-01');
// prefix: 'ge', value: '1990-01-01'
```

#### prefixToOperator()

前缀转 SQL 操作符。

```typescript
import { prefixToOperator } from 'fhir-persistence';

const operator = prefixToOperator('ge');
// '>='
```

---

## 迁移引擎 (Migration Engine)

### IGPersistenceManager

IG 持久化管理器（自动迁移）。

**版本要求**: v0.3.0+

```typescript
import { IGPersistenceManager } from 'fhir-persistence';

const igManager = new IGPersistenceManager(
  adapter: StorageAdapter,
  dialect: 'sqlite' | 'postgres'
);
```

#### initialize()

初始化或升级 IG。

```typescript
async initialize(input: {
  name: string;
  version: string;
  checksum: string;
  tableSets: ResourceTableSet[];
}): Promise<IGInitResult>
```

**IGInitResult**:
```typescript
interface IGInitResult {
  action: 'new' | 'upgrade' | 'consistent';
  ddlCount: number;
  reindexCount: number;
}
```

**示例**:
```typescript
const result = await igManager.initialize({
  name: 'hl7.fhir.r4.core',
  version: '4.0.1',
  checksum: computeChecksum(tableSets),
  tableSets: tableSets,
});

console.log('Action:', result.action);
console.log('DDL executed:', result.ddlCount);
console.log('Resources to reindex:', result.reindexCount);
```

---

### Schema 比较

**版本要求**: v0.3.0+

#### compareSchemas()

比较新旧 Schema。

```typescript
import { compareSchemas } from 'fhir-persistence';

const deltas = compareSchemas(
  oldTableSets: ResourceTableSet[],
  newTableSets: ResourceTableSet[]
): SchemaDelta[]
```

**SchemaDelta**:
```typescript
interface SchemaDelta {
  kind: DeltaKind;
  resourceType: string;
  tableName: string;
  columnName?: string;
  indexName?: string;
  oldValue?: any;
  newValue?: any;
}

type DeltaKind =
  | 'table-added'
  | 'table-removed'
  | 'column-added'
  | 'column-removed'
  | 'column-type-changed'
  | 'index-added'
  | 'index-removed';
```

---

### 迁移生成器

**版本要求**: v0.3.0+

#### generateMigration()

生成迁移 DDL。

```typescript
import { generateMigration } from 'fhir-persistence';

const migration = generateMigration(
  deltas: SchemaDelta[],
  dialect: 'sqlite' | 'postgres'
): GeneratedMigration
```

**GeneratedMigration**:
```typescript
interface GeneratedMigration {
  up: string[];              // 升级 DDL 语句
  down: string[];            // 回滚 DDL 语句
  reindexDeltas: SchemaDelta[];  // 需要重新索引的变更
}
```

---

### 迁移运行器

**版本要求**: v0.3.0+

#### MigrationRunnerV2

```typescript
import { MigrationRunnerV2 } from 'fhir-persistence';

const runner = new MigrationRunnerV2(adapter: StorageAdapter);
```

##### applyIGMigration()

应用 IG 迁移。

```typescript
async applyIGMigration(migration: MigrationV2): Promise<MigrationResultV2>
```

**MigrationV2**:
```typescript
interface MigrationV2 {
  version: string;
  up: string[];
  down: string[];
}
```

---

### Package 注册表仓库

**版本要求**: v0.3.0+

#### PackageRegistryRepo

```typescript
import { PackageRegistryRepo } from 'fhir-persistence';

const repo = new PackageRegistryRepo(adapter: StorageAdapter);
```

##### checkStatus()

检查包状态。

```typescript
async checkStatus(
  name: string,
  checksum: string
): Promise<'new' | 'consistent' | 'upgrade'>
```

##### getPackage()

获取包信息。

```typescript
async getPackage(name: string): Promise<PackageRecord | undefined>
```

##### savePackage()

保存包信息。

```typescript
async savePackage(record: PackageRecord): Promise<void>
```

---

### 重新索引调度器

**版本要求**: v0.3.0+

#### ReindexScheduler

```typescript
import { ReindexScheduler } from 'fhir-persistence';

const scheduler = new ReindexScheduler(adapter: StorageAdapter);
```

##### schedule()

调度重新索引任务。

```typescript
async schedule(deltas: SchemaDelta[]): Promise<void>
```

---

## 索引管道 (Indexing Pipeline)

### IndexingPipeline

自动搜索参数索引。

**版本要求**: v0.1.0+

```typescript
import { IndexingPipeline } from 'fhir-persistence';

const pipeline = new IndexingPipeline(options: IndexingPipelineOptions);
```

#### IndexingPipelineOptions

```typescript
interface IndexingPipelineOptions {
  adapter: StorageAdapter;
  searchParameterRegistry: SearchParameterRegistry;
  runtimeProvider?: RuntimeProvider;  // 可选，启用 FHIRPath 提取
}
```

#### index()

索引资源。

```typescript
async index(
  resourceType: string,
  resource: FhirResource,
  tableSet: ResourceTableSet
): Promise<IndexResult>
```

**IndexResult**:
```typescript
interface IndexResult {
  searchColumns: Record<string, any>;
  references: ReferenceRowV2[];
  lookupRows: LookupTableRow[];
}
```

---

### LookupTableWriter

查找表写入器（HumanName, Address, ContactPoint, Identifier）。

**版本要求**: v0.1.0+

```typescript
import { LookupTableWriter } from 'fhir-persistence';

const writer = new LookupTableWriter(adapter: StorageAdapter);
```

#### write()

写入查找表行。

```typescript
async write(
  resourceType: string,
  resourceId: string,
  rows: LookupTableRow[]
): Promise<void>
```

---

### 引用索引器

**版本要求**: v0.1.0+

#### extractReferencesV2()

提取资源引用。

```typescript
import { extractReferencesV2 } from 'fhir-persistence';

const references = extractReferencesV2(
  resource: FhirResource,
  searchParams: SearchParameterImpl[]
): ReferenceRowV2[]
```

**ReferenceRowV2**:
```typescript
interface ReferenceRowV2 {
  searchParam: string;
  targetType: string;
  targetId: string;
  targetVersionId?: string;
  targetUrl?: string;
}
```

---

### 行索引器

**版本要求**: v0.1.0+

#### buildLookupTableRows()

构建查找表行。

```typescript
import { buildLookupTableRows } from 'fhir-persistence';

const rows = buildLookupTableRows(
  resource: FhirResource,
  searchParams: SearchParameterImpl[]
): LookupTableRow[]
```

---

### 搜索列构建器

**版本要求**: v0.1.0+

#### buildSearchColumns()

构建搜索列值（回退方式，不使用 FHIRPath）。

```typescript
import { buildSearchColumns } from 'fhir-persistence';

const columns = buildSearchColumns(
  resource: FhirResource,
  searchParams: SearchParameterImpl[]
): SearchColumnValues
```

#### buildResourceRowWithSearch()

构建包含搜索列的资源行。

```typescript
import { buildResourceRowWithSearch } from 'fhir-persistence';

const row = buildResourceRowWithSearch(
  resource: PersistedResource,
  searchColumns: SearchColumnValues
): any
```

---

## 条件操作 (Conditional Operations)

### ConditionalService

FHIR R4 条件 CRUD 操作。

**版本要求**: v0.6.0+

```typescript
import { ConditionalService } from 'fhir-persistence';

const service = new ConditionalService(
  adapter: StorageAdapter,
  registry: SearchParameterRegistry
);
```

#### conditionalCreate()

条件创建（0 匹配 → 创建，1 匹配 → 返回已存在，2+ 匹配 → 错误）。

```typescript
async conditionalCreate<T extends FhirResource>(
  resourceType: string,
  resource: T,
  searchParams: Record<string, string>
): Promise<ConditionalCreateResult<T>>
```

**ConditionalCreateResult**:
```typescript
interface ConditionalCreateResult<T> {
  outcome: 'created' | 'existing';
  resource: PersistedResource<T>;
}
```

**抛出**:
- `PreconditionFailedError`: 匹配 2+ 资源（HTTP 412）

#### conditionalUpdate()

条件更新（0 匹配 → 创建，1 匹配 → 更新，2+ 匹配 → 错误）。

```typescript
async conditionalUpdate<T extends FhirResource>(
  resourceType: string,
  resource: T,
  searchParams: Record<string, string>
): Promise<ConditionalUpdateResult<T>>
```

**ConditionalUpdateResult**:
```typescript
interface ConditionalUpdateResult<T> {
  outcome: 'created' | 'updated';
  resource: PersistedResource<T>;
}
```

#### conditionalDelete()

条件删除（删除所有匹配的资源）。

```typescript
async conditionalDelete(
  resourceType: string,
  searchParams: Record<string, string>
): Promise<ConditionalDeleteResult>
```

**ConditionalDeleteResult**:
```typescript
interface ConditionalDeleteResult {
  count: number;
}
```

---

## Bundle 处理 (Bundle Processing)

### BundleProcessorV2

事务和批处理 Bundle 处理器。

**版本要求**: v0.5.0+

```typescript
import { BundleProcessorV2 } from 'fhir-persistence';

const processor = new BundleProcessorV2(persistence: FhirPersistence);
```

#### processBundle()

处理 Bundle。

```typescript
async processBundle(bundle: Bundle): Promise<Bundle>
```

**支持的 Bundle 类型**:
- `transaction`: 原子性事务（全部成功或全部失败）
- `batch`: 批处理（独立执行每个请求）

**支持的请求方法**:
- `POST`: 创建资源
- `PUT`: 更新资源
- `GET`: 读取资源
- `DELETE`: 删除资源

**示例**:
```typescript
const transactionBundle = {
  resourceType: 'Bundle',
  type: 'transaction',
  entry: [
    {
      request: { method: 'POST', url: 'Patient' },
      resource: { resourceType: 'Patient', name: [{ family: 'Smith' }] },
      fullUrl: 'urn:uuid:patient-temp-id',
    },
    {
      request: { method: 'POST', url: 'Observation' },
      resource: {
        resourceType: 'Observation',
        status: 'final',
        subject: { reference: 'urn:uuid:patient-temp-id' },
      },
    },
  ],
};

const result = await processor.processBundle(transactionBundle);
```

---

## 术语服务 (Terminology)

### TerminologyCodeRepo

术语代码仓库。

**版本要求**: v0.2.0+

```typescript
import { TerminologyCodeRepo } from 'fhir-persistence';

const repo = new TerminologyCodeRepo(adapter: StorageAdapter);
```

#### 方法

- `saveCode()`: 保存代码
- `getCode()`: 获取代码
- `searchCodes()`: 搜索代码

---

### ValueSetRepo

值集仓库。

**版本要求**: v0.2.0+

```typescript
import { ValueSetRepo } from 'fhir-persistence';

const repo = new ValueSetRepo(adapter: StorageAdapter);
```

#### 方法

- `saveValueSet()`: 保存值集
- `getValueSet()`: 获取值集
- `expandValueSet()`: 展开值集

---

## 启动编排器 (Startup Orchestrator)

### FhirSystem

端到端启动编排器。

**版本要求**: v0.5.0+

```typescript
import { FhirSystem } from 'fhir-persistence';

const system = new FhirSystem(
  adapter: StorageAdapter,
  options: FhirSystemOptions
);
```

#### FhirSystemOptions

```typescript
interface FhirSystemOptions {
  dialect: 'sqlite' | 'postgres';
  runtimeProvider?: RuntimeProvider;
  packageName?: string;
  packageVersion?: string;
  features?: {
    fullTextSearch?: boolean;
  };
}
```

#### initialize()

初始化系统。

```typescript
async initialize(
  definitionBridge: DefinitionProvider
): Promise<FhirSystemReady>
```

**FhirSystemReady**:
```typescript
interface FhirSystemReady {
  persistence: FhirPersistence;
  sdRegistry: StructureDefinitionRegistry;
  spRegistry: SearchParameterRegistry;
  igResult: IGInitResult;
}
```

**示例**:
```typescript
const system = new FhirSystem(adapter, {
  dialect: 'sqlite',
  packageName: 'my-app',
  packageVersion: '1.0.0',
});

const { persistence, sdRegistry, spRegistry, igResult } = 
  await system.initialize(definitionBridge);
```

---

## 生产工具 (Production Utilities)

### ResourceCacheV2

内存资源缓存（TTL）。

**版本要求**: v0.5.0+

```typescript
import { ResourceCacheV2 } from 'fhir-persistence';

const cache = new ResourceCacheV2(options?: {
  maxSize?: number;  // 默认 1000
  ttlMs?: number;    // 默认 60000 (60秒)
});
```

#### 方法

- `get(key: string)`: 获取缓存
- `set(key: string, value: any)`: 设置缓存
- `delete(key: string)`: 删除缓存
- `clear()`: 清空缓存
- `size()`: 缓存大小

---

### SearchLogger

搜索日志记录器。

**版本要求**: v0.5.0+

```typescript
import { SearchLogger } from 'fhir-persistence';

const logger = new SearchLogger();
```

#### 方法

- `logSearch(entry: SearchLogEntry)`: 记录搜索
- `getStats()`: 获取统计信息
- `clear()`: 清空日志

---

### 重新索引工具

**版本要求**: v0.3.0+

#### reindexResourceTypeV2()

重新索引单个资源类型。

```typescript
import { reindexResourceTypeV2 } from 'fhir-persistence';

const result = await reindexResourceTypeV2(
  adapter: StorageAdapter,
  resourceType: string,
  onProgress?: ReindexProgressCallbackV2
): Promise<ReindexResult>
```

**ReindexProgressCallbackV2**:
```typescript
type ReindexProgressCallbackV2 = (progress: {
  resourceType: string;
  processed: number;
  total: number;
}) => void;
```

#### reindexAllV2()

重新索引所有资源类型。

```typescript
import { reindexAllV2 } from 'fhir-persistence';

const result = await reindexAllV2(
  adapter: StorageAdapter,
  resourceTypes: string[],
  onProgress?: ReindexProgressCallbackV2
): Promise<ReindexResult>
```

**示例**:
```typescript
await reindexResourceTypeV2(adapter, 'Patient', (progress) => {
  console.log(`${progress.resourceType}: ${progress.processed}/${progress.total}`);
});
```

---

## 类型定义 (Type Definitions)

### 核心类型

**版本要求**: v0.1.0+

#### FhirResource

```typescript
interface FhirResource {
  resourceType: string;
  id?: string;
  meta?: FhirMeta;
  [key: string]: any;
}
```

#### PersistedResource

```typescript
interface PersistedResource<T extends FhirResource = FhirResource> extends T {
  id: string;
  meta: {
    versionId: string;
    lastUpdated: string;
  };
}
```

#### FhirMeta

```typescript
interface FhirMeta {
  versionId?: string;
  lastUpdated?: string;
  source?: string;
  profile?: string[];
  security?: Coding[];
  tag?: Coding[];
}
```

---

### 搜索类型

#### SearchRequest

```typescript
interface SearchRequest {
  resourceType: string;
  params: ParsedSearchParam[];
  sort: SortRule[];
  count: number;
  offset: number;
  include: string[];
  revinclude: string[];
}
```

#### ParsedSearchParam

```typescript
interface ParsedSearchParam {
  code: string;
  modifier?: SearchModifier;
  values: string[];
  chain?: string[];
}
```

#### SearchResult

```typescript
interface SearchResult {
  resources: PersistedResource[];
  total: number;
  hasMore: boolean;
  nextPageToken?: string;
}
```

---

### Schema 类型

#### ResourceTableSet

```typescript
interface ResourceTableSet {
  resourceType: string;
  main: MainTableSchema;
  history: HistoryTableSchema;
  references: ReferencesTableSchema;
}
```

#### MainTableSchema

```typescript
interface MainTableSchema {
  tableName: string;
  columns: ColumnSchema[];
  indexes: IndexSchema[];
  constraints: ConstraintSchema[];
}
```

---

### 错误类型

**版本要求**: v0.1.0+

#### RepositoryError

基础仓库错误。

```typescript
class RepositoryError extends Error {
  constructor(message: string, cause?: Error);
}
```

#### ResourceNotFoundError

资源不存在错误（HTTP 404）。

```typescript
class ResourceNotFoundError extends RepositoryError {
  constructor(resourceType: string, id: string);
}
```

#### ResourceGoneError

资源已删除错误（HTTP 410）。

```typescript
class ResourceGoneError extends RepositoryError {
  constructor(resourceType: string, id: string);
}
```

#### ResourceVersionConflictError

版本冲突错误（HTTP 409）。

```typescript
class ResourceVersionConflictError extends RepositoryError {
  constructor(resourceType: string, id: string, expected: string, actual: string);
}
```

#### PreconditionFailedError

前置条件失败错误（HTTP 412）。

**版本要求**: v0.6.0+

```typescript
class PreconditionFailedError extends RepositoryError {
  constructor(message: string);
}
```

---

## 常量 (Constants)

### SCHEMA_VERSION

当前 Schema 版本。

```typescript
import { SCHEMA_VERSION } from 'fhir-persistence';

console.log(SCHEMA_VERSION); // '2'
```

### SEARCH_PREFIXES

支持的搜索前缀。

```typescript
import { SEARCH_PREFIXES } from 'fhir-persistence';

// ['eq', 'ne', 'gt', 'lt', 'ge', 'le', 'sa', 'eb', 'ap']
```

### DEFAULT_SEARCH_COUNT

默认搜索结果数量。

```typescript
import { DEFAULT_SEARCH_COUNT } from 'fhir-persistence';

console.log(DEFAULT_SEARCH_COUNT); // 20
```

### MAX_SEARCH_COUNT

最大搜索结果数量。

```typescript
import { MAX_SEARCH_COUNT } from 'fhir-persistence';

console.log(MAX_SEARCH_COUNT); // 1000
```

---

## 版本兼容性矩阵 (Version Compatibility Matrix)

| 功能 | 引入版本 | 最新版本 | 破坏性变更 |
|------|---------|---------|-----------|
| 基础 CRUD | v0.1.0 | v0.6.0 | 无 |
| 搜索引擎 | v0.2.0 | v0.6.0 | v0.5.0 (executeSearchV2) |
| Schema 迁移 | v0.3.0 | v0.6.0 | 无 |
| PostgreSQL 支持 | v0.4.0 | v0.6.0 | 无 |
| FhirSystem | v0.5.0 | v0.6.0 | 无 |
| 条件操作 | v0.6.0 | v0.6.0 | 无 |
| 全文搜索 | v0.6.0 | v0.6.0 | 无 |

---

## 弃用警告 (Deprecation Warnings)

### v0.5.0

- `executeSearchV1` → `executeSearchV2` (已移除)
- `mapRowsToResourcesV1` → `mapRowsToResourcesV2` (已移除)

### v0.6.0

- 无新的弃用

---

## 技术支持 (Technical Support)

- **GitHub**: https://github.com/medxaidev/fhir-persistence
- **Issues**: https://github.com/medxaidev/fhir-persistence/issues
- **Email**: fangjun20208@gmail.com

---

**文档版本历史 (Document Version History)**

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2024-03 | 初始版本，完整 API 参考 |
