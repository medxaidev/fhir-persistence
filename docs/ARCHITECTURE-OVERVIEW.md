# fhir-persistence — 架构概览 (Architecture Overview)

**文档版本 (Document Version):** 1.0.0  
**适用产品版本 (Product Version):** fhir-persistence v0.6.0+  
**最后更新 (Last Updated):** 2024-03

---

## 版本要求 (Version Requirements)

| 组件 | 最低版本 | 说明 |
|------|---------|------|
| fhir-persistence | 0.6.0 | 本包 |
| Node.js | 18.0.0 | 运行时环境（ES Modules 支持） |
| SQLite | 3.35.0 | 数据库（JSON 函数 + FTS5） |
| PostgreSQL | 12.0 | 数据库（JSONB + 数组操作符） |

---

## 目录 (Table of Contents)

1. [系统定位](#系统定位-system-position)
2. [核心设计原则](#核心设计原则-core-design-principles)
3. [架构分层](#架构分层-architecture-layers)
4. [数据模型](#数据模型-data-model)
5. [模块组织](#模块组织-module-organization)
6. [数据流](#数据流-data-flow)
7. [扩展点](#扩展点-extension-points)
8. [性能考量](#性能考量-performance-considerations)
9. [安全架构](#安全架构-security-architecture)

---

## 系统定位 (System Position)

### 在 FHIR 生态中的位置

```
┌──────────────────────────────────────────────┐
│              fhir-engine                     │
│       (引导 + 生命周期 + 插件)                 │
│    Bootstrap + Lifecycle + Plugins           │
└──────────┬───────────────────────────────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
fhir-runtime   fhir-persistence  ◄── 本包 (This Package)
     │           │
     ▼           ▼
fhir-definition  Database (SQLite/PostgreSQL)
```

### 职责边界 (Responsibility Boundaries)

| 包 | 职责 | 版本要求 |
|---|------|---------|
| **fhir-definition** | 提供 StructureDefinitions, SearchParameters, ValueSets | v0.5.0+ |
| **fhir-runtime** | FHIRPath 评估、验证、搜索值提取 | v0.8.1+ |
| **fhir-persistence** | 存储资源、索引搜索参数、生成 Schema DDL | v0.6.0+ |
| **fhir-engine** | 组装所有组件为运行中的 FHIR 系统 | 未来版本 |

---

## 核心设计原则 (Core Design Principles)

### 1. StorageAdapter 抽象

**版本引入**: v0.1.0

所有数据库访问通过 `StorageAdapter` 接口。代码中不直接导入 `better-sqlite3` 或 `pg`。

**优势**:
- 无需修改应用代码即可切换数据库
- 使用内存 SQLite 进行测试
- 生产环境使用原生 SQLite 或 PostgreSQL

```typescript
interface StorageAdapter {
  execute(sql: string, params?: unknown[]): Promise<{ changes: number }>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | undefined>;
  queryStream<T>(sql: string, params?: unknown[]): AsyncIterable<T>;
  transaction<R>(fn: (tx: TransactionContext) => Promise<R>): Promise<R>;
  close(): Promise<void>;
}
```

### 2. 三表模式 (Three-Table-Per-Resource Pattern)

**版本引入**: v0.1.0

每个 FHIR 资源类型对应三张表：

| 表 | 用途 | Schema 版本 |
|----|------|------------|
| `"Patient"` | 主表，存储当前资源 + 搜索列 | v2 |
| `"Patient_History"` | 所有历史版本（自增 `versionSeq`） | v2 |
| `"Patient_References"` | 提取的资源引用 | v2 |

**共享查找表** (Shared Lookup Tables):
- `"HumanName_Lookup"` — 名称搜索（FTS5/tsvector）
- `"Address_Lookup"` — 地址搜索（FTS5/tsvector）
- `"ContactPoint_Lookup"` — 联系方式搜索
- `"Identifier_Lookup"` — 标识符搜索

### 3. IG 驱动的 Schema

**版本引入**: v0.1.0, 迁移引擎: v0.3.0

Schema 从 FHIR StructureDefinitions 和 SearchParameters 生成，而非手写：

```
StructureDefinition → 资源类型 → 表名
SearchParameter     → 搜索列   → 索引
```

当 IG 升级时，`IGPersistenceManager` 计算差异并仅应用增量。

### 4. 参数化 SQL (`?` 占位符)

**版本引入**: v0.1.0, PostgreSQL 支持: v0.4.0

所有生成的 SQL 使用 `?` 位置占位符。`PostgresAdapter` 自动重写 `?` → `$1, $2, ...`。

应用代码无需处理占位符语法差异。

### 5. SqlDialect 抽象

**版本引入**: v0.4.0

SQL 语法差异封装在 `SqlDialect` 接口中：

| 关注点 | SQLite (`SQLiteDialect`) | PostgreSQL (`PostgresDialect`) |
|--------|-------------------------|-------------------------------|
| 数组包含 | `json_each()` 子查询 | `@>` / `&&` ARRAY 操作符 |
| 自增列 | `AUTOINCREMENT` | `GENERATED ALWAYS AS IDENTITY` |
| 时间戳类型 | `TEXT` | `TIMESTAMPTZ` |
| 布尔类型 | `INTEGER` | `BOOLEAN` |
| Upsert | `INSERT OR REPLACE` | `ON CONFLICT ... DO UPDATE` |

### 6. Provider 桥接模式

**版本引入**: v0.5.0

`fhir-persistence` 定义自己的最小接口（`DefinitionProvider`, `RuntimeProvider`）并提供桥接类：

```
fhir-definition DefinitionRegistry
    └── FhirDefinitionBridge → DefinitionProvider

fhir-runtime FhirRuntimeInstance
    └── FhirRuntimeProvider → RuntimeProvider
```

保持 `fhir-persistence` 松耦合 — 可以在没有 `fhir-runtime` 的情况下运行（使用回退属性路径提取）。

---

## 架构分层 (Architecture Layers)

### 层次结构 (Layer Hierarchy)

```
┌─────────────────────────────────────────────────────────┐
│  应用层 (Application Layer)                              │
│  - fhir-engine                                          │
│  - fhir-server (HTTP REST API)                          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  门面层 (Facade Layer)                                   │
│  - FhirPersistence (端到端持久化)                        │
│  - FhirSystem (启动编排器)                               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  服务层 (Service Layer)                                  │
│  - FhirStore (基础 CRUD)                                 │
│  - ConditionalService (条件操作)                         │
│  - BundleProcessorV2 (Bundle 处理)                       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  核心层 (Core Layer)                                     │
│  - IndexingPipeline (索引管道)                           │
│  - SearchEngine (搜索引擎)                               │
│  - MigrationEngine (迁移引擎)                            │
│  - Registry (注册表)                                     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  数据访问层 (Data Access Layer)                          │
│  - StorageAdapter (SQLite / PostgreSQL)                 │
│  - SqlDialect (方言抽象)                                 │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  数据库层 (Database Layer)                               │
│  - SQLite (better-sqlite3)                              │
│  - PostgreSQL (pg)                                      │
└─────────────────────────────────────────────────────────┘
```

### 层次职责 (Layer Responsibilities)

#### 1. 应用层 (Application Layer)

**职责**: 业务逻辑、HTTP 路由、认证授权

**组件**:
- `fhir-engine`: 中央编排器
- `fhir-server`: REST API 服务器

#### 2. 门面层 (Facade Layer)

**职责**: 简化 API、端到端流程编排

**组件**:
- `FhirPersistence`: 自动索引的 CRUD + 搜索
- `FhirSystem`: 启动时初始化所有组件

#### 3. 服务层 (Service Layer)

**职责**: 业务规则、事务管理

**组件**:
- `FhirStore`: 基础 CRUD（无索引）
- `ConditionalService`: FHIR 条件操作
- `BundleProcessorV2`: 事务/批处理 Bundle

#### 4. 核心层 (Core Layer)

**职责**: 索引、搜索、迁移、注册表

**组件**:
- `IndexingPipeline`: 搜索参数索引
- `SearchEngine`: 搜索解析、SQL 构建、执行
- `MigrationEngine`: Schema 差异、DDL 生成
- `Registry`: StructureDefinition、SearchParameter 注册

#### 5. 数据访问层 (Data Access Layer)

**职责**: 数据库抽象、SQL 方言

**组件**:
- `StorageAdapter`: 统一数据库接口
- `SqlDialect`: SQL 语法差异抽象

#### 6. 数据库层 (Database Layer)

**职责**: 数据持久化

**实现**:
- SQLite (better-sqlite3)
- PostgreSQL (pg)

---

## 数据模型 (Data Model)

### 主表结构 (Main Table Schema)

**版本**: Schema v2 (since v0.1.0)

```sql
CREATE TABLE "Patient" (
  -- 核心字段
  id TEXT PRIMARY KEY,
  versionId TEXT NOT NULL,
  lastUpdated TEXT NOT NULL,  -- TIMESTAMPTZ in PostgreSQL
  deleted INTEGER NOT NULL DEFAULT 0,  -- BOOLEAN in PostgreSQL
  content TEXT NOT NULL,  -- JSON/JSONB
  
  -- 搜索列（动态生成）
  __birthDate TEXT,           -- date 类型搜索参数
  __active INTEGER,           -- boolean 类型
  __gender TEXT,              -- token 类型
  __identifier_system TEXT,   -- token 类型（系统）
  __identifier_value TEXT,    -- token 类型（值）
  
  -- 索引
  INDEX idx_patient_birthdate ON __birthDate,
  INDEX idx_patient_active ON __active,
  INDEX idx_patient_identifier ON (__identifier_system, __identifier_value)
);
```

### 历史表结构 (History Table Schema)

```sql
CREATE TABLE "Patient_History" (
  versionSeq INTEGER PRIMARY KEY AUTOINCREMENT,  -- IDENTITY in PostgreSQL
  id TEXT NOT NULL,
  versionId TEXT NOT NULL,
  lastUpdated TEXT NOT NULL,
  deleted INTEGER NOT NULL,
  content TEXT NOT NULL,
  
  INDEX idx_patient_history_id ON (id, versionSeq DESC)
);
```

### 引用表结构 (References Table Schema)

```sql
CREATE TABLE "Patient_References" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sourceId TEXT NOT NULL,
  searchParam TEXT NOT NULL,
  targetType TEXT NOT NULL,
  targetId TEXT NOT NULL,
  targetVersionId TEXT,
  targetUrl TEXT,
  
  INDEX idx_patient_refs_source ON sourceId,
  INDEX idx_patient_refs_target ON (targetType, targetId)
);
```

### 查找表结构 (Lookup Table Schema)

**版本引入**: v0.1.0, 全文搜索: v0.6.0

#### HumanName_Lookup (SQLite FTS5)

```sql
CREATE VIRTUAL TABLE "HumanName_Lookup" USING fts5(
  resourceType,
  resourceId,
  family,
  given,
  text,
  content='',
  tokenize='porter unicode61'
);
```

#### HumanName_Lookup (PostgreSQL)

```sql
CREATE TABLE "HumanName_Lookup" (
  id SERIAL PRIMARY KEY,
  resourceType TEXT NOT NULL,
  resourceId TEXT NOT NULL,
  family TEXT,
  given TEXT,
  text TEXT,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(family, '') || ' ' || coalesce(given, '') || ' ' || coalesce(text, ''))
  ) STORED
);

CREATE INDEX idx_humanname_search ON "HumanName_Lookup" USING GIN(search_vector);
```

### 包注册表 (Package Registry)

**版本引入**: v0.3.0

```sql
CREATE TABLE "PackageRegistry" (
  name TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  checksum TEXT NOT NULL,
  installedAt TEXT NOT NULL,
  metadata TEXT  -- JSON
);
```

### 迁移历史 (Migration History)

**版本引入**: v0.3.0

```sql
CREATE TABLE "MigrationHistory" (
  version TEXT PRIMARY KEY,
  appliedAt TEXT NOT NULL,
  description TEXT
);
```

---

## 模块组织 (Module Organization)

### 源代码结构 (Source Code Structure)

```
src/
├── index.ts                          # 公共 API 导出
│
├── db/                               # 数据访问层 (v0.1.0+)
│   ├── adapter.ts                    # StorageAdapter 接口
│   ├── dialect.ts                    # SqlDialect 接口 (v0.4.0+)
│   ├── better-sqlite3-adapter.ts     # SQLite 适配器
│   ├── sqlite-dialect.ts             # SQLite 方言 (v0.4.0+)
│   ├── postgres-adapter.ts           # PostgreSQL 适配器 (v0.4.0+)
│   └── postgres-dialect.ts           # PostgreSQL 方言 (v0.4.0+)
│
├── store/                            # 服务层 (v0.1.0+)
│   ├── fhir-persistence.ts           # FhirPersistence 门面
│   ├── fhir-store.ts                 # FhirStore (基础 CRUD)
│   └── conditional-service.ts        # 条件操作 (v0.6.0+)
│
├── repo/                             # 仓库层 (v0.1.0+)
│   ├── indexing-pipeline.ts          # 索引管道
│   ├── lookup-table-writer.ts        # 查找表写入器
│   ├── reference-indexer.ts          # 引用索引器
│   ├── row-indexer.ts                # 行索引器
│   ├── sql-builder.ts                # SQL 构建器
│   ├── errors.ts                     # 错误定义
│   └── types.ts                      # 类型定义
│
├── search/                           # 搜索引擎 (v0.2.0+)
│   ├── search-parser.ts              # 搜索参数解析
│   ├── where-builder.ts              # WHERE 子句构建 (方言感知 v0.4.0+)
│   ├── search-sql-builder.ts         # SELECT 查询生成 (方言感知 v0.4.0+)
│   ├── search-planner.ts             # 搜索优化 (v0.5.0+)
│   ├── search-executor.ts            # _include/_revinclude (方言感知 v0.4.0+)
│   └── pagination.ts                 # 分页
│
├── schema/                           # Schema 层 (v0.1.0+)
│   ├── table-schema-builder.ts       # SD + SP → ResourceTableSet
│   ├── ddl-generator.ts              # DDL 生成 (方言感知 v0.4.0+)
│   └── table-schema.ts               # Schema 类型定义
│
├── migration/                        # 迁移引擎 (v0.3.0+)
│   ├── schema-diff.ts                # Schema 比较
│   ├── migration-generator.ts        # DDL 生成 (方言感知)
│   ├── ig-persistence-manager.ts     # IG 管理器
│   └── reindex-scheduler.ts          # 重新索引调度
│
├── migrations/                       # 迁移运行器 (v0.3.0+)
│   ├── migration-runner.ts           # MigrationRunnerV2
│   └── index.ts
│
├── registry/                         # 注册表 (v0.1.0+)
│   ├── search-parameter-registry.ts  # SearchParameter 注册
│   ├── structure-definition-registry.ts # StructureDefinition 注册
│   └── package-registry-repo.ts      # 包版本跟踪 (v0.3.0+)
│
├── providers/                        # Provider 桥接 (v0.5.0+)
│   ├── definition-provider.ts        # DefinitionProvider 接口
│   ├── runtime-provider.ts           # RuntimeProvider 接口
│   ├── fhir-definition-provider.ts   # DefinitionRegistry 桥接
│   └── fhir-runtime-provider.ts      # FhirRuntimeInstance 桥接
│
├── startup/                          # 启动编排 (v0.5.0+)
│   └── fhir-system.ts                # FhirSystem
│
├── terminology/                      # 术语服务 (v0.2.0+)
│   ├── terminology-code-repo.ts      # 代码系统存储
│   └── valueset-repo.ts              # 值集存储
│
├── cache/                            # 缓存 (v0.5.0+)
│   └── resource-cache.ts             # 内存 TTL 缓存
│
├── observability/                    # 可观测性 (v0.5.0+)
│   └── search-logger.ts              # 搜索日志
│
├── cli/                              # CLI 工具 (v0.3.0+)
│   └── reindex.ts                    # 重新索引工具
│
└── platform/                         # 平台 IG (v0.5.0+)
    ├── platform-ig-definitions.ts    # 内置平台资源类型
    └── platform-ig-loader.ts         # 平台 IG 初始化
```

### 模块依赖图 (Module Dependency Graph)

```
FhirSystem
    ├── FhirPersistence
    │   ├── FhirStore
    │   │   └── StorageAdapter
    │   ├── IndexingPipeline
    │   │   ├── RuntimeProvider (可选)
    │   │   ├── LookupTableWriter
    │   │   └── ReferenceIndexer
    │   └── SearchEngine
    │       ├── SearchParser
    │       ├── SearchPlanner
    │       ├── SearchSQLBuilder
    │       └── SearchExecutor
    ├── IGPersistenceManager
    │   ├── PackageRegistryRepo
    │   ├── SchemaDiff
    │   ├── MigrationGenerator
    │   └── MigrationRunnerV2
    └── Registry
        ├── StructureDefinitionRegistry
        └── SearchParameterRegistry
```

---

## 数据流 (Data Flow)

### 创建资源流程 (Create Resource Flow)

**版本**: v0.1.0+

```
createResource('Patient', resource)
    │
    ▼
FhirPersistence.createResource()
    │
    ├─► FhirStore.createResource()
    │   │
    │   ├─► 生成 id, versionId, lastUpdated
    │   │
    │   ├─► INSERT INTO "Patient" (id, versionId, content, ...)
    │   │
    │   └─► INSERT INTO "Patient_History" (id, versionId, content, ...)
    │
    └─► IndexingPipeline.index()
        │
        ├─► RuntimeProvider.extractSearchValues()  (如果可用)
        │   或 buildSearchColumns()                (回退)
        │   │
        │   └─► UPDATE "Patient" SET __birthDate = ?, __active = ?, ...
        │
        ├─► extractReferencesV2()
        │   │
        │   └─► INSERT INTO "Patient_References" (sourceId, targetType, ...)
        │
        └─► LookupTableWriter.write()
            │
            └─► INSERT INTO "HumanName_Lookup" (resourceType, resourceId, family, ...)
                INSERT INTO "Identifier_Lookup" (...)
```

### 搜索流程 (Search Flow)

**版本**: v0.2.0+, 方言支持: v0.4.0+

```
searchResources({ resourceType: 'Patient', queryParams: { birthdate: 'ge1990-01-01' } })
    │
    ▼
parseSearchRequest('Patient', params, spRegistry)
    │
    ├─► 解析搜索参数
    ├─► 解析排序规则
    ├─► 解析分页参数
    └─► 解析 _include/_revinclude
    │
    ▼
planSearch(request, spRegistry, options)  (v0.5.0+)
    │
    ├─► 过滤器重排序（选择性优先）
    ├─► 链式搜索深度验证
    └─► 两阶段推荐（大表优化）
    │
    ▼
buildSearchSQLv2(request, spRegistry, dialect)  (v0.4.0+)
    │
    ├─► buildWhereClauseV2()
    │   │
    │   ├─► 处理每个搜索参数
    │   ├─► 链式搜索 JOIN
    │   └─► 方言感知（数组操作符）
    │
    ├─► 构建 ORDER BY
    └─► 构建 LIMIT/OFFSET
    │
    ▼
adapter.query(sql, params)
    │
    ├─► PostgresAdapter: 重写 ? → $1, $2, ...  (v0.4.0+)
    └─► 执行查询
    │
    ▼
SearchExecutor: 解析 _include / _revinclude
    │
    ├─► 获取引用的资源
    └─► 递归 _include:iterate (最大深度 3)
    │
    ▼
buildSearchBundle()
    │
    └─► 构建 FHIR Bundle 响应
```

### Schema 迁移流程 (Schema Migration Flow)

**版本**: v0.3.0+

```
IGPersistenceManager.initialize(input)
    │
    ▼
PackageRegistryRepo.checkStatus(name, checksum)
    │
    ├─► 'consistent' → 无操作（立即返回）
    │
    ├─► 'new' → 应用完整 DDL
    │   │
    │   ├─► generateSchemaDDL(tableSets, dialect)  (v0.4.0+)
    │   │
    │   └─► 执行所有 DDL 语句
    │
    └─► 'upgrade' → 差异 + 应用增量
        │
        ▼
    compareSchemas(old, new)
        │
        └─► 生成 SchemaDelta[]
            │
            ▼
    generateMigration(deltas, dialect)  (v0.4.0+)
        │
        ├─► 生成 ALTER TABLE 语句
        ├─► 生成 CREATE INDEX 语句
        └─► 标记需要重新索引的变更
        │
        ▼
    MigrationRunnerV2.applyIGMigration(migration)
        │
        ├─► 在事务中执行所有 DDL
        └─► 记录到 MigrationHistory
        │
        ▼
    ReindexScheduler.schedule(reindexDeltas)
        │
        └─► 调度后台重新索引任务
```

---

## 扩展点 (Extension Points)

### 1. 自定义 StorageAdapter

**版本**: v0.1.0+

实现 `StorageAdapter` 接口以支持新的数据库后端。

```typescript
class CustomAdapter implements StorageAdapter {
  async execute(sql: string, params?: unknown[]): Promise<{ changes: number }> {
    // 实现
  }
  
  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    // 实现
  }
  
  // ... 其他方法
}
```

### 2. 自定义 SqlDialect

**版本**: v0.4.0+

实现 `SqlDialect` 接口以支持新的 SQL 方言。

```typescript
class CustomDialect implements SqlDialect {
  placeholder(index: number): string {
    return `$${index}`;
  }
  
  textArrayContains(column: string, param: string): string {
    return `${column} @> ARRAY[${param}]`;
  }
  
  // ... 其他方法
}
```

### 3. 自定义 RuntimeProvider

**版本**: v0.5.0+

实现 `RuntimeProvider` 接口以自定义 FHIRPath 提取逻辑。

```typescript
class CustomRuntimeProvider implements RuntimeProvider {
  extractSearchValues(
    resource: FhirResource,
    searchParam: SearchParameterImpl
  ): any[] {
    // 自定义提取逻辑
  }
}
```

### 4. 自定义索引策略

**版本**: v0.1.0+

扩展 `IndexingPipeline` 以添加自定义索引逻辑。

```typescript
class CustomIndexingPipeline extends IndexingPipeline {
  async index(
    resourceType: string,
    resource: FhirResource,
    tableSet: ResourceTableSet
  ): Promise<IndexResult> {
    const result = await super.index(resourceType, resource, tableSet);
    
    // 添加自定义索引逻辑
    
    return result;
  }
}
```

---

## 性能考量 (Performance Considerations)

### 1. 索引策略

**版本**: v0.1.0+

#### 列索引 (Column Index)

适用于简单类型（date, number, boolean, token）。

**优势**:
- 查询速度快
- 索引开销低

**劣势**:
- 每个搜索参数需要一列

#### 查找表索引 (Lookup Table Index)

适用于复杂类型（HumanName, Address, Identifier）。

**优势**:
- 支持多值
- 支持全文搜索（v0.6.0+）

**劣势**:
- JOIN 开销
- 存储开销

### 2. 两阶段搜索

**版本**: v0.5.0+

对于大表（>10,000 行），使用两阶段搜索：

1. **阶段 1**: 只获取 ID（使用索引）
2. **阶段 2**: 根据 ID 获取完整资源

**优势**:
- 减少数据传输
- 更好的缓存利用

### 3. 连接池配置

**版本**: v0.4.0+ (PostgreSQL)

```typescript
const pool = new Pool({
  max: 20,                        // 最大连接数
  min: 5,                         // 最小连接数
  idleTimeoutMillis: 30000,       // 空闲超时
  connectionTimeoutMillis: 2000,  // 连接超时
});
```

### 4. 查询优化

#### 使用预编译语句

```typescript
const stmt = adapter.prepare<Patient>('SELECT * FROM "Patient" WHERE id = ?');
const patient = await stmt.get(patientId);
```

#### 批量操作

```typescript
await adapter.transaction(async (tx) => {
  for (const resource of resources) {
    await persistence.createResource('Patient', resource);
  }
});
```

### 5. 缓存策略

**版本**: v0.5.0+

```typescript
const cache = new ResourceCacheV2({
  maxSize: 1000,
  ttlMs: 60_000,
});

// 缓存热点资源
cache.set(`Patient/${id}`, patient);
```

---

## 安全架构 (Security Architecture)

### 1. SQL 注入防护

**版本**: v0.1.0+

所有 SQL 使用参数化查询，自动防止 SQL 注入。

```typescript
// ✅ 安全
const results = await adapter.query(
  'SELECT * FROM "Patient" WHERE name = ?',
  [userInput]
);

// ❌ 不安全（框架不允许）
const results = await adapter.query(
  `SELECT * FROM "Patient" WHERE name = '${userInput}'`
);
```

### 2. 数据库凭证管理

**最佳实践**:

```typescript
// ✅ 使用环境变量
const pool = new Pool({
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
});

// ❌ 硬编码凭证
const pool = new Pool({
  password: 'my-secret-password',
});
```

### 3. SSL/TLS 连接

**版本**: v0.4.0+ (PostgreSQL)

```typescript
const pool = new Pool({
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./ca-cert.pem').toString(),
  } : false,
});
```

### 4. 访问控制

框架不提供内置访问控制，应在应用层实现：

```typescript
async function secureReadResource(
  type: string,
  id: string,
  userId: string
) {
  const resource = await persistence.readResource(type, id);
  
  if (!hasAccess(userId, resource)) {
    throw new Error('Access denied');
  }
  
  return resource;
}
```

### 5. 审计日志

使用 `OperationContext` 记录操作：

```typescript
await persistence.createResource('Patient', patient, {
  context: {
    userId: 'user-123',
    requestId: 'req-456',
    timestamp: new Date().toISOString(),
  },
});
```

---

## 版本演进 (Version Evolution)

### Schema 版本历史

| Schema 版本 | 产品版本 | 主要变更 |
|------------|---------|---------|
| v1 | v0.1.0 - v0.2.x | 初始 Schema |
| v2 | v0.3.0+ | 添加 PackageRegistry, MigrationHistory |

### 功能版本历史

| 功能 | 引入版本 | 主要变更 |
|------|---------|---------|
| 基础 CRUD | v0.1.0 | 初始实现 |
| 搜索引擎 | v0.2.0 | 搜索参数解析、SQL 构建 |
| 迁移引擎 | v0.3.0 | Schema 差异、自动迁移 |
| PostgreSQL | v0.4.0 | 双后端支持、方言抽象 |
| FhirSystem | v0.5.0 | 启动编排器、Provider 桥接 |
| 条件操作 | v0.6.0 | 条件 CRUD、全文搜索 |

---

## 测试策略 (Testing Strategy)

### 测试覆盖

**版本**: v0.1.0+

```
1014 tests (1006 passing, 8 skipped) across 56 test files

测试套件分布:
- 双后端验证:   41 tests  (DDL + IG 生命周期 + CRUD on SQLite & PostgreSQL)
- PostgreSQL 集成: 23 tests  (CRUD, 事务, DDL, 迁移, 搜索 SQL)
- 存储适配器:    ~40 tests  (BetterSqlite3Adapter, PostgresAdapter)
- CRUD & 版本:   ~80 tests  (FhirStore, FhirPersistence, 软删除, 历史)
- 搜索引擎:     ~120 tests  (所有 SP 类型, 链式搜索, 规划器, 两阶段)
- Schema & 迁移: ~60 tests  (DDL 生成, schema diff, 迁移运行器)
- 索引管道:      ~50 tests  (列, token, 查找表策略)
- Bundle 处理:   ~30 tests  (事务, 批处理, 条件 CRUD)
- Provider 桥接: ~20 tests  (FhirDefinitionBridge, FhirRuntimeProvider)
```

### 测试环境

- **单元测试**: 内存 SQLite (`:memory:`)
- **集成测试**: 文件 SQLite + PostgreSQL (Docker)
- **性能测试**: 大数据集 (100k+ 资源)

---

## 部署拓扑 (Deployment Topology)

### 单机部署 (Single Node)

```
┌─────────────────────────────────┐
│      Node.js Application        │
│  ┌───────────────────────────┐  │
│  │   fhir-persistence        │  │
│  │   (BetterSqlite3Adapter)  │  │
│  └───────────┬───────────────┘  │
│              │                   │
│  ┌───────────▼───────────────┐  │
│  │   SQLite Database         │  │
│  │   (fhir.db)               │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### 分布式部署 (Distributed)

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Node.js App 1  │  │  Node.js App 2  │  │  Node.js App 3  │
│  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │
│  │ fhir-     │  │  │  │ fhir-     │  │  │  │ fhir-     │  │
│  │persistence│  │  │  │persistence│  │  │  │persistence│  │
│  │(Postgres) │  │  │  │(Postgres) │  │  │  │(Postgres) │  │
│  └─────┬─────┘  │  │  └─────┬─────┘  │  │  └─────┬─────┘  │
└────────┼────────┘  └────────┼────────┘  └────────┼────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                   ┌──────────▼──────────┐
                   │  PostgreSQL Cluster │
                   │  (Primary + Replica)│
                   └─────────────────────┘
```

---

## 监控和可观测性 (Monitoring & Observability)

### 关键指标 (Key Metrics)

**版本**: v0.5.0+

1. **搜索性能**
   - 平均搜索时间
   - 慢查询（>1s）
   - 搜索结果数分布

2. **CRUD 性能**
   - 创建/更新/删除延迟
   - 事务成功率
   - 版本冲突率

3. **数据库指标**
   - 连接池使用率
   - 查询队列长度
   - 死锁次数

4. **缓存指标**
   - 缓存命中率
   - 缓存大小
   - TTL 过期率

### 日志记录

```typescript
import { SearchLogger } from 'fhir-persistence';

const logger = new SearchLogger();

logger.logSearch({
  resourceType: 'Patient',
  queryParams: { birthdate: 'ge1990-01-01' },
  executionTimeMs: 45,
  resultCount: 123,
});

const stats = logger.getStats();
console.log('Average search time:', stats.averageExecutionTimeMs);
```

---

## 未来路线图 (Future Roadmap)

### 计划功能 (Planned Features)

1. **读副本支持** (Read Replica Support)
   - 读写分离
   - 负载均衡

2. **分片支持** (Sharding Support)
   - 水平扩展
   - 跨分片查询

3. **GraphQL API**
   - GraphQL 查询支持
   - 订阅（实时更新）

4. **增量备份**
   - 时间点恢复
   - 增量快照

5. **高级搜索**
   - 地理空间搜索
   - 模糊匹配

---

## 技术支持 (Technical Support)

- **GitHub**: https://github.com/medxaidev/fhir-persistence
- **Issues**: https://github.com/medxaidev/fhir-persistence/issues
- **Email**: fangjun20208@gmail.com

---

**文档版本历史 (Document Version History)**

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2024-03 | 初始版本，完整架构概览 |
