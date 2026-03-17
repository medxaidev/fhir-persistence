# fhir-persistence — 接入指南 (Integration Guide)

**文档版本 (Document Version):** 1.0.0  
**适用产品版本 (Product Version):** fhir-persistence v0.6.0+  
**最后更新 (Last Updated):** 2024-03

---

## 版本要求 (Version Requirements)

### 运行环境 (Runtime Environment)

| 依赖项 | 最低版本 | 推荐版本 | 说明 |
|--------|---------|---------|------|
| **Node.js** | 18.0.0 | 20.x LTS | 必需，支持 ES Modules |
| **npm** | 9.0.0 | 10.x | 包管理器 |
| **TypeScript** | 5.0.0 | 5.9.3 | 开发时依赖（可选） |

### 核心依赖 (Core Dependencies)

| 包名 | 版本要求 | 类型 | 说明 |
|------|---------|------|------|
| `fhir-persistence` | ^0.6.0 | 必需 | 本包 |
| `fhir-definition` | ^0.5.0 | 必需 | FHIR 定义（StructureDefinition, SearchParameter） |
| `fhir-runtime` | ^0.8.1 | 必需 | FHIRPath 评估和验证 |
| `better-sqlite3` | ^12.6.2 | 必需 | SQLite 原生适配器（生产环境推荐） |
| `pg` | ^8.0.0 | 可选 | PostgreSQL 支持（peerDependency） |

### 数据库版本 (Database Versions)

| 数据库 | 最低版本 | 推荐版本 | 说明 |
|--------|---------|---------|------|
| **SQLite** | 3.35.0 | 3.45.0+ | 支持 JSON 函数和 FTS5 |
| **PostgreSQL** | 12.0 | 15.x / 16.x | 支持 JSONB、数组操作符、tsvector |

---

## 快速开始 (Quick Start)

### 1. 安装依赖 (Installation)

```bash
# 安装核心包
npm install fhir-persistence fhir-definition fhir-runtime

# SQLite 支持（推荐用于开发和嵌入式场景）
npm install better-sqlite3

# PostgreSQL 支持（推荐用于生产服务器）
npm install pg
```

### 2. 基础配置 - SQLite (Basic Setup - SQLite)

```typescript
import {
  BetterSqlite3Adapter,
  FhirPersistence,
  SearchParameterRegistry,
  StructureDefinitionRegistry,
  buildAllResourceTableSets,
  generateSchemaDDL,
} from 'fhir-persistence';
import { loadDefinitionPackages } from 'fhir-definition';

// 步骤 1: 加载 FHIR 定义
const { registry: definitionRegistry } = loadDefinitionPackages('./fhir-packages');

// 步骤 2: 创建存储适配器
const adapter = new BetterSqlite3Adapter({ 
  path: './data/fhir.db' 
});

// 步骤 3: 创建注册表
const sdRegistry = new StructureDefinitionRegistry();
const spRegistry = new SearchParameterRegistry();

// 从 definitionRegistry 加载定义
for (const sd of definitionRegistry.getAllStructureDefinitions()) {
  sdRegistry.index(sd);
}
for (const sp of definitionRegistry.getAllSearchParameters()) {
  spRegistry.index(sp);
}

// 步骤 4: 生成并执行 DDL
const tableSets = buildAllResourceTableSets(sdRegistry, spRegistry);
const ddlStatements = generateSchemaDDL(tableSets, 'sqlite');

for (const stmt of ddlStatements) {
  await adapter.execute(stmt);
}

// 步骤 5: 创建持久化实例
const persistence = new FhirPersistence({
  adapter,
  searchParameterRegistry: spRegistry,
});

// 步骤 6: 开始使用
const patient = await persistence.createResource('Patient', {
  resourceType: 'Patient',
  name: [{ family: '张', given: ['三'] }],
  birthDate: '1990-01-15',
  active: true,
});

console.log('Created patient:', patient.id);
```

### 3. 基础配置 - PostgreSQL (Basic Setup - PostgreSQL)

```typescript
import { PostgresAdapter, FhirPersistence } from 'fhir-persistence';
import { Pool } from 'pg';

// 步骤 1: 创建 PostgreSQL 连接池
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'fhir_db',
  user: 'fhir_user',
  password: process.env.DB_PASSWORD,
  max: 20,                    // 最大连接数
  idleTimeoutMillis: 30000,   // 空闲超时
  connectionTimeoutMillis: 2000,
});

// 步骤 2: 创建适配器
const adapter = new PostgresAdapter(pool);

// 步骤 3-6: 与 SQLite 相同，但 DDL 生成时使用 'postgres' 方言
const ddlStatements = generateSchemaDDL(tableSets, 'postgres');

// 使用完毕后关闭
await adapter.close();
await pool.end();
```

---

## 推荐集成方式 (Recommended Integration)

### 使用 FhirSystem 一站式启动 (Using FhirSystem)

`FhirSystem` 是推荐的集成方式，它自动处理定义加载、注册表初始化、Schema 迁移等流程。

```typescript
import {
  FhirSystem,
  BetterSqlite3Adapter,
  FhirDefinitionBridge,
  FhirRuntimeProvider,
} from 'fhir-persistence';
import { loadDefinitionPackages } from 'fhir-definition';
import { createRuntime } from 'fhir-runtime';

// 1. 加载 FHIR 定义
const { registry } = loadDefinitionPackages('./fhir-packages');

// 2. 创建运行时（用于 FHIRPath 评估）
const runtime = await createRuntime({ definitions: registry });

// 3. 创建适配器
const adapter = new BetterSqlite3Adapter({ path: './fhir.db' });

// 4. 创建桥接器
const definitionBridge = new FhirDefinitionBridge(registry);
const runtimeProvider = new FhirRuntimeProvider({ runtime });

// 5. 创建并初始化 FhirSystem
const system = new FhirSystem(adapter, {
  dialect: 'sqlite',              // 或 'postgres'
  runtimeProvider,                // 可选，启用 FHIRPath 索引
  packageName: 'my-fhir-app',
  packageVersion: '1.0.0',
});

const result = await system.initialize(definitionBridge);

// 6. 使用持久化实例
const { persistence, sdRegistry, spRegistry, igResult } = result;

console.log('IG initialization:', igResult.action); // 'new' | 'upgrade' | 'consistent'

// 开始使用
const patient = await persistence.createResource('Patient', {
  resourceType: 'Patient',
  name: [{ family: 'Smith', given: ['John'] }],
});
```

---

## 核心 API 使用 (Core API Usage)

### CRUD 操作 (CRUD Operations)

```typescript
// 创建 (Create)
const created = await persistence.createResource('Patient', {
  resourceType: 'Patient',
  name: [{ family: 'Smith', given: ['John'] }],
  birthDate: '1990-01-15',
});

// 读取 (Read)
const patient = await persistence.readResource('Patient', created.id);

// 更新 (Update)
patient.active = true;
const updated = await persistence.updateResource('Patient', patient);

// 删除 (Delete - 软删除)
await persistence.deleteResource('Patient', patient.id);

// 读取历史版本 (Read Version)
const version = await persistence.readVersion('Patient', patient.id, '1');

// 读取历史记录 (Read History)
const history = await persistence.readHistory('Patient', patient.id);
```

### 搜索操作 (Search Operations)

```typescript
// 基础搜索
const searchResult = await persistence.searchResources({
  resourceType: 'Patient',
  queryParams: {
    birthdate: 'ge1990-01-01',
    active: 'true',
    _sort: '-birthdate',
    _count: '50',
  },
});

console.log('Total:', searchResult.total);
console.log('Resources:', searchResult.resources);

// 链式搜索 (Chain Search)
const observations = await persistence.searchResources({
  resourceType: 'Observation',
  queryParams: {
    'subject:Patient.birthdate': 'ge1990-01-01',
  },
});

// 包含引用 (_include)
const withPatients = await persistence.searchResources({
  resourceType: 'Observation',
  queryParams: {
    code: 'http://loinc.org|8867-4',
    _include: 'Observation:subject',
  },
});

// 反向包含 (_revinclude)
const patientsWithObs = await persistence.searchResources({
  resourceType: 'Patient',
  queryParams: {
    _id: 'patient-123',
    _revinclude: 'Observation:subject',
  },
});

// 流式搜索（大数据量）
for await (const resource of persistence.searchStream({
  resourceType: 'Patient',
  queryParams: { active: 'true' },
})) {
  console.log('Processing:', resource.id);
}
```

### 条件操作 (Conditional Operations)

```typescript
import { ConditionalService } from 'fhir-persistence';

const conditionalService = new ConditionalService(adapter, spRegistry);

// 条件创建 (Conditional Create)
// 0 匹配 → 创建，1 匹配 → 返回已存在，2+ 匹配 → 错误
const createResult = await conditionalService.conditionalCreate(
  'Patient',
  {
    resourceType: 'Patient',
    identifier: [{ system: 'http://hospital.org/mrn', value: '12345' }],
    name: [{ family: 'Smith' }],
  },
  { identifier: 'http://hospital.org/mrn|12345' }
);

console.log('Outcome:', createResult.outcome); // 'created' | 'existing'

// 条件更新 (Conditional Update)
// 0 匹配 → 创建，1 匹配 → 更新，2+ 匹配 → 错误
const updateResult = await conditionalService.conditionalUpdate(
  'Patient',
  {
    resourceType: 'Patient',
    identifier: [{ system: 'http://hospital.org/mrn', value: '12345' }],
    name: [{ family: 'Johnson' }],
  },
  { identifier: 'http://hospital.org/mrn|12345' }
);

// 条件删除 (Conditional Delete)
// 删除所有匹配的资源
const deleteResult = await conditionalService.conditionalDelete(
  'Patient',
  { active: 'false', _lastUpdated: 'lt2020-01-01' }
);

console.log('Deleted count:', deleteResult.count);
```

### 事务和批处理 (Transaction & Batch)

```typescript
import { BundleProcessorV2 } from 'fhir-persistence';

const bundleProcessor = new BundleProcessorV2(persistence);

// 事务 Bundle（原子性）
const transactionBundle = {
  resourceType: 'Bundle',
  type: 'transaction',
  entry: [
    {
      request: { method: 'POST', url: 'Patient' },
      resource: { resourceType: 'Patient', name: [{ family: 'Smith' }] },
    },
    {
      request: { method: 'POST', url: 'Observation' },
      resource: {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Blood Pressure' },
        subject: { reference: 'urn:uuid:patient-temp-id' },
      },
      fullUrl: 'urn:uuid:obs-temp-id',
    },
  ],
};

const result = await bundleProcessor.processBundle(transactionBundle);

// 批处理 Bundle（非原子性）
const batchBundle = {
  resourceType: 'Bundle',
  type: 'batch',
  entry: [
    {
      request: { method: 'GET', url: 'Patient/123' },
    },
    {
      request: { method: 'POST', url: 'Patient' },
      resource: { resourceType: 'Patient', name: [{ family: 'Doe' }] },
    },
  ],
};

const batchResult = await bundleProcessor.processBundle(batchBundle);
```

---

## Schema 迁移 (Schema Migration)

### 自动迁移管理 (Automatic Migration)

```typescript
import { IGPersistenceManager } from 'fhir-persistence';

const igManager = new IGPersistenceManager(adapter, 'sqlite'); // 或 'postgres'

// 初始化或升级 IG
const result = await igManager.initialize({
  name: 'hl7.fhir.r4.core',
  version: '4.0.1',
  checksum: computeChecksum(tableSets),
  tableSets: tableSets,
});

console.log('Action:', result.action);       // 'new' | 'upgrade' | 'consistent'
console.log('DDL count:', result.ddlCount);  // 执行的 DDL 语句数
console.log('Reindex count:', result.reindexCount); // 需要重新索引的资源类型数
```

### 手动迁移 (Manual Migration)

```typescript
import { compareSchemas, generateMigration, MigrationRunnerV2 } from 'fhir-persistence';

// 1. 比较 Schema
const deltas = compareSchemas(oldTableSets, newTableSets);

// 2. 生成迁移 DDL
const migration = generateMigration(deltas, 'sqlite'); // 或 'postgres'

console.log('Migration up statements:', migration.up);
console.log('Reindex deltas:', migration.reindexDeltas);

// 3. 执行迁移
const runner = new MigrationRunnerV2(adapter);
await runner.applyIGMigration({
  version: '2',
  up: migration.up,
  down: [],
});

// 4. 重新索引（如果需要）
import { reindexResourceTypeV2 } from 'fhir-persistence';

for (const delta of migration.reindexDeltas) {
  await reindexResourceTypeV2(
    adapter,
    delta.resourceType,
    (progress) => {
      console.log(`${delta.resourceType}: ${progress.processed}/${progress.total}`);
    }
  );
}
```

---

## 高级特性 (Advanced Features)

### 全文搜索 (Full-Text Search)

```typescript
// SQLite FTS5 或 PostgreSQL tsvector/GIN 自动启用

// 搜索名称
const results = await persistence.searchResources({
  resourceType: 'Patient',
  queryParams: {
    name: 'John Smith',  // 自动使用全文搜索索引
  },
});

// 搜索地址
const byAddress = await persistence.searchResources({
  resourceType: 'Patient',
  queryParams: {
    address: 'New York',
  },
});
```

### 缓存 (Caching)

```typescript
import { ResourceCacheV2 } from 'fhir-persistence';

const cache = new ResourceCacheV2({
  maxSize: 1000,      // 最大缓存条目数
  ttlMs: 60_000,      // 60 秒 TTL
});

// 使用缓存包装读取操作
async function getCachedResource(type: string, id: string) {
  const cacheKey = `${type}/${id}`;
  
  let resource = cache.get(cacheKey);
  if (!resource) {
    resource = await persistence.readResource(type, id);
    cache.set(cacheKey, resource);
  }
  
  return resource;
}
```

### 搜索日志 (Search Logging)

```typescript
import { SearchLogger } from 'fhir-persistence';

const logger = new SearchLogger();

// 记录搜索
logger.logSearch({
  resourceType: 'Patient',
  queryParams: { birthdate: 'ge1990-01-01' },
  executionTimeMs: 45,
  resultCount: 123,
});

// 获取统计
const stats = logger.getStats();
console.log('Total searches:', stats.totalSearches);
console.log('Average time:', stats.averageExecutionTimeMs);
```

---

## 性能优化建议 (Performance Optimization)

### 1. 索引策略 (Indexing Strategy)

```typescript
// 确保常用搜索参数已索引
const spRegistry = new SearchParameterRegistry();

// 只索引需要的搜索参数
const essentialParams = [
  'Patient.birthdate',
  'Patient.name',
  'Patient.identifier',
  'Observation.code',
  'Observation.date',
  'Observation.subject',
];

for (const param of essentialParams) {
  const sp = definitionRegistry.getSearchParameter(param);
  if (sp) spRegistry.index(sp);
}
```

### 2. 两阶段搜索 (Two-Phase Search)

```typescript
import { planSearch, buildTwoPhaseSearchSQLv2 } from 'fhir-persistence';

// 对大表使用两阶段搜索
const request = parseSearchRequest('Patient', queryParams, spRegistry);
const plan = planSearch(request, spRegistry, {
  estimatedRowCount: 1_000_000,  // 估计行数
});

if (plan.useTwoPhase) {
  // 阶段 1: 只获取 ID
  const { phase1, phase2Template } = buildTwoPhaseSearchSQLv2(plan.request, spRegistry);
  const ids = await adapter.query(phase1.sql, phase1.params);
  
  // 阶段 2: 获取完整资源
  const phase2 = {
    sql: phase2Template.replace('?', ids.map(() => '?').join(',')),
    params: ids.map(row => row.id),
  };
  const resources = await adapter.query(phase2.sql, phase2.params);
}
```

### 3. 连接池配置 (Connection Pool Configuration)

```typescript
// PostgreSQL 生产环境配置
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // 连接池设置
  max: 20,                        // 最大连接数
  min: 5,                         // 最小连接数
  idleTimeoutMillis: 30000,       // 空闲连接超时
  connectionTimeoutMillis: 2000,  // 连接超时
  
  // 性能优化
  statement_timeout: 30000,       // SQL 语句超时（30秒）
  query_timeout: 30000,
});
```

### 4. 批量操作 (Batch Operations)

```typescript
// 使用事务批量创建
await adapter.transaction(async (tx) => {
  for (const resource of resources) {
    await persistence.createResource('Patient', resource);
  }
});

// 或使用 Bundle
const bundle = {
  resourceType: 'Bundle',
  type: 'transaction',
  entry: resources.map(r => ({
    request: { method: 'POST', url: r.resourceType },
    resource: r,
  })),
};

await bundleProcessor.processBundle(bundle);
```

---

## 错误处理 (Error Handling)

```typescript
import {
  RepositoryError,
  ResourceNotFoundError,
  ResourceGoneError,
  ResourceVersionConflictError,
} from 'fhir-persistence';

try {
  const patient = await persistence.readResource('Patient', 'unknown-id');
} catch (error) {
  if (error instanceof ResourceNotFoundError) {
    console.error('Resource not found:', error.message);
  } else if (error instanceof ResourceGoneError) {
    console.error('Resource was deleted:', error.message);
  } else if (error instanceof ResourceVersionConflictError) {
    console.error('Version conflict (optimistic locking):', error.message);
  } else if (error instanceof RepositoryError) {
    console.error('Repository error:', error.message);
  } else {
    throw error;
  }
}

// 乐观锁定 (Optimistic Locking)
try {
  await persistence.updateResource('Patient', patient, {
    ifMatch: '2',  // 期望版本号
  });
} catch (error) {
  if (error instanceof ResourceVersionConflictError) {
    // 版本冲突，需要重新读取并合并
    const latest = await persistence.readResource('Patient', patient.id);
    // 合并更改并重试
  }
}
```

---

## 安全建议 (Security Recommendations)

### 1. 数据库凭证管理

```typescript
// ❌ 不要硬编码凭证
const pool = new Pool({
  password: 'my-secret-password',  // 不安全！
});

// ✅ 使用环境变量
const pool = new Pool({
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./ca-cert.pem').toString(),
  } : false,
});
```

### 2. SQL 注入防护

```typescript
// ✅ 框架自动使用参数化查询，无需担心 SQL 注入
const results = await persistence.searchResources({
  resourceType: 'Patient',
  queryParams: {
    name: userInput,  // 自动转义
  },
});

// ❌ 不要直接拼接 SQL（框架内部已处理）
```

### 3. 访问控制

```typescript
// 实现资源级访问控制
async function secureReadResource(
  type: string,
  id: string,
  userId: string
) {
  const resource = await persistence.readResource(type, id);
  
  // 检查权限
  if (!hasAccess(userId, resource)) {
    throw new Error('Access denied');
  }
  
  return resource;
}
```

---

## 测试集成 (Testing Integration)

### 单元测试示例 (Unit Test Example)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqlite3Adapter, FhirPersistence } from 'fhir-persistence';

describe('Patient CRUD', () => {
  let adapter: BetterSqlite3Adapter;
  let persistence: FhirPersistence;
  
  beforeEach(async () => {
    // 使用内存数据库进行测试
    adapter = new BetterSqlite3Adapter({ path: ':memory:' });
    
    // 初始化 Schema
    // ... (省略 DDL 执行)
    
    persistence = new FhirPersistence({
      adapter,
      searchParameterRegistry: spRegistry,
    });
  });
  
  afterEach(async () => {
    await adapter.close();
  });
  
  it('should create and read patient', async () => {
    const created = await persistence.createResource('Patient', {
      resourceType: 'Patient',
      name: [{ family: 'Test' }],
    });
    
    expect(created.id).toBeDefined();
    
    const read = await persistence.readResource('Patient', created.id);
    expect(read.name[0].family).toBe('Test');
  });
});
```

---

## 部署检查清单 (Deployment Checklist)

### 生产环境部署前检查 (Pre-Production Checklist)

- [ ] **版本兼容性**: 确认 Node.js >= 18.0.0
- [ ] **数据库版本**: SQLite >= 3.35.0 或 PostgreSQL >= 12.0
- [ ] **依赖安装**: 所有 peer dependencies 已安装
- [ ] **环境变量**: 数据库凭证通过环境变量配置
- [ ] **连接池**: PostgreSQL 连接池参数已优化
- [ ] **Schema 迁移**: 已执行所有必要的 DDL 和重新索引
- [ ] **备份策略**: 数据库备份机制已配置
- [ ] **监控**: 日志和性能监控已启用
- [ ] **错误处理**: 所有 CRUD 操作都有适当的错误处理
- [ ] **测试覆盖**: 核心功能已通过集成测试
- [ ] **SSL/TLS**: PostgreSQL 连接已启用 SSL（生产环境）
- [ ] **索引优化**: 常用搜索参数已创建索引

---

## 下一步 (Next Steps)

1. **阅读 API 文档**: 查看 `API-REFERENCE.md` 了解完整 API
2. **理解架构**: 阅读 `ARCHITECTURE-OVERVIEW.md` 了解系统设计
3. **故障排除**: 遇到问题时参考 `TROUBLESHOOTING.md`
4. **报告问题**: 使用 `BLOCKING-ISSUES.md` 模板报告阻塞性问题

---

## 技术支持 (Technical Support)

- **GitHub Issues**: https://github.com/medxaidev/fhir-persistence/issues
- **文档**: https://github.com/medxaidev/fhir-persistence#readme
- **邮件**: fangjun20208@gmail.com

---

**版本历史 (Version History)**

| 文档版本 | 产品版本 | 更新日期 | 主要变更 |
|---------|---------|---------|---------|
| 1.0.0 | v0.6.0 | 2024-03 | 初始版本，包含完整接入指南 |
