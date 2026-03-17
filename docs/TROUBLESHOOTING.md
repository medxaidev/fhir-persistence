# fhir-persistence — 故障排除指南 (Troubleshooting Guide)

**文档版本 (Document Version):** 1.0.0  
**适用产品版本 (Product Version):** fhir-persistence v0.6.0+  
**最后更新 (Last Updated):** 2024-03

---

## 版本要求 (Version Requirements)

| 组件 | 最低版本 | 说明 |
|------|---------|------|
| fhir-persistence | 0.6.0 | 本包 |
| Node.js | 18.0.0 | 运行时环境 |
| better-sqlite3 | 12.6.2 | SQLite 适配器 |
| pg | 8.0.0 | PostgreSQL 适配器（可选） |

---

## 目录 (Table of Contents)

1. [安装问题](#安装问题-installation-issues)
2. [数据库连接问题](#数据库连接问题-database-connection-issues)
3. [Schema 和迁移问题](#schema-和迁移问题-schema-and-migration-issues)
4. [CRUD 操作问题](#crud-操作问题-crud-operation-issues)
5. [搜索问题](#搜索问题-search-issues)
6. [性能问题](#性能问题-performance-issues)
7. [错误代码参考](#错误代码参考-error-code-reference)
8. [调试技巧](#调试技巧-debugging-tips)
9. [常见错误模式](#常见错误模式-common-error-patterns)

---

## 安装问题 (Installation Issues)

### 问题 1: better-sqlite3 安装失败

**症状**:
```
npm ERR! gyp ERR! build error
npm ERR! node-gyp rebuild failed
```

**原因**: better-sqlite3 需要编译原生模块，缺少构建工具。

**解决方案**:

#### Windows
```powershell
# 安装 Windows Build Tools
npm install --global windows-build-tools

# 或使用 Visual Studio
# 安装 "Desktop development with C++" workload
```

#### macOS
```bash
# 安装 Xcode Command Line Tools
xcode-select --install
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install build-essential python3
```

**验证**:
```bash
npm install better-sqlite3
node -e "console.log(require('better-sqlite3'))"
```

---

### 问题 2: 版本不兼容

**症状**:
```
Error: Cannot find module 'fhir-definition'
```

**原因**: 缺少 peer dependencies。

**解决方案**:
```bash
# 安装所有必需依赖
npm install fhir-persistence fhir-definition fhir-runtime

# 检查版本兼容性
npm list fhir-persistence fhir-definition fhir-runtime
```

**版本要求**:
- fhir-persistence: ^0.6.0
- fhir-definition: ^0.5.0
- fhir-runtime: ^0.8.1

---

### 问题 3: TypeScript 类型错误

**症状**:
```typescript
error TS2307: Cannot find module 'fhir-persistence' or its corresponding type declarations.
```

**原因**: TypeScript 配置问题。

**解决方案**:

检查 `tsconfig.json`:
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": false,
    "types": ["node"]
  }
}
```

---

## 数据库连接问题 (Database Connection Issues)

### 问题 4: SQLite 文件权限错误

**症状**:
```
Error: SQLITE_CANTOPEN: unable to open database file
```

**原因**: 数据库文件或目录权限不足。

**解决方案**:

```bash
# 检查目录权限
ls -la ./data/

# 创建目录并设置权限
mkdir -p ./data
chmod 755 ./data

# 检查文件权限
chmod 644 ./data/fhir.db
```

**代码修复**:
```typescript
import { BetterSqlite3Adapter } from 'fhir-persistence';
import fs from 'fs';
import path from 'path';

const dbPath = './data/fhir.db';
const dbDir = path.dirname(dbPath);

// 确保目录存在
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const adapter = new BetterSqlite3Adapter({ path: dbPath });
```

---

### 问题 5: PostgreSQL 连接超时

**症状**:
```
Error: connect ETIMEDOUT
Error: Connection terminated unexpectedly
```

**原因**: 网络问题、防火墙、或 PostgreSQL 配置。

**解决方案**:

#### 1. 检查 PostgreSQL 是否运行
```bash
# Linux/macOS
sudo systemctl status postgresql

# 或
pg_isready -h localhost -p 5432
```

#### 2. 检查防火墙
```bash
# Linux (iptables)
sudo iptables -L -n | grep 5432

# macOS
sudo pfctl -s rules | grep 5432
```

#### 3. 检查 PostgreSQL 配置
```bash
# 编辑 postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf

# 确保监听所有地址
listen_addresses = '*'

# 编辑 pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

# 添加客户端访问规则
host    all    all    0.0.0.0/0    md5
```

#### 4. 增加连接超时
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'fhir_db',
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 5000,  // 增加到 5 秒
  idleTimeoutMillis: 30000,
});
```

---

### 问题 6: PostgreSQL 连接池耗尽

**症状**:
```
Error: timeout exceeded when trying to connect
Error: remaining connection slots are reserved
```

**原因**: 连接未正确释放或连接池配置过小。

**解决方案**:

#### 1. 增加连接池大小
```typescript
const pool = new Pool({
  max: 50,  // 增加最大连接数（默认 10）
  min: 10,  // 增加最小连接数
});
```

#### 2. 确保连接正确释放
```typescript
// ❌ 错误：未释放连接
const client = await pool.connect();
await client.query('SELECT * FROM "Patient"');
// 忘记 client.release()

// ✅ 正确：使用 try-finally
const client = await pool.connect();
try {
  await client.query('SELECT * FROM "Patient"');
} finally {
  client.release();
}

// ✅ 更好：使用适配器（自动管理）
const adapter = new PostgresAdapter(pool);
await adapter.query('SELECT * FROM "Patient"');
```

#### 3. 监控连接池
```typescript
console.log('Total connections:', pool.totalCount);
console.log('Idle connections:', pool.idleCount);
console.log('Waiting requests:', pool.waitingCount);
```

---

## Schema 和迁移问题 (Schema and Migration Issues)

### 问题 7: Schema 迁移失败

**症状**:
```
Error: SQLITE_ERROR: table "Patient" already exists
Error: relation "Patient" already exists
```

**原因**: 重复执行 DDL 或迁移状态不一致。

**解决方案**:

#### 1. 检查迁移历史
```typescript
import { PackageRegistryRepo } from 'fhir-persistence';

const repo = new PackageRegistryRepo(adapter);
const pkg = await repo.getPackage('hl7.fhir.r4.core');

console.log('Installed version:', pkg?.version);
console.log('Checksum:', pkg?.checksum);
```

#### 2. 清理并重新初始化（开发环境）
```typescript
// ⚠️ 警告：这会删除所有数据
await adapter.execute('DROP TABLE IF EXISTS "Patient"');
await adapter.execute('DROP TABLE IF EXISTS "Patient_History"');
await adapter.execute('DROP TABLE IF EXISTS "Patient_References"');
await adapter.execute('DROP TABLE IF EXISTS "PackageRegistry"');

// 重新初始化
const result = await igManager.initialize({
  name: 'hl7.fhir.r4.core',
  version: '4.0.1',
  checksum: newChecksum,
  tableSets: tableSets,
});
```

#### 3. 手动修复迁移状态（生产环境）
```typescript
// 更新包注册表
await adapter.execute(`
  UPDATE "PackageRegistry"
  SET version = ?, checksum = ?
  WHERE name = ?
`, ['4.0.1', correctChecksum, 'hl7.fhir.r4.core']);
```

---

### 问题 8: 列类型不匹配

**症状**:
```
Error: SQLITE_ERROR: datatype mismatch
Error: column "birthDate" is of type text but expression is of type integer
```

**原因**: Schema 定义与实际数据类型不匹配。

**解决方案**:

#### 1. 检查 SearchParameter 定义
```typescript
const param = spRegistry.get('Patient', 'birthdate');
console.log('Type:', param?.type);  // 应该是 'date'
console.log('Expression:', param?.expression);
```

#### 2. 重新生成 Schema
```typescript
import { buildResourceTableSet, generateResourceDDL } from 'fhir-persistence';

const tableSet = buildResourceTableSet('Patient', sdRegistry, spRegistry);
const ddl = generateResourceDDL(tableSet, 'sqlite');

console.log('Generated DDL:', ddl);
```

#### 3. 修复数据类型（需要迁移）
```sql
-- SQLite: 需要重建表
CREATE TABLE "Patient_New" AS SELECT * FROM "Patient";
DROP TABLE "Patient";
CREATE TABLE "Patient" (...);  -- 使用正确的列类型
INSERT INTO "Patient" SELECT * FROM "Patient_New";
DROP TABLE "Patient_New";

-- PostgreSQL: 可以直接修改
ALTER TABLE "Patient" ALTER COLUMN "__birthDate" TYPE TEXT;
```

---

### 问题 9: 索引创建失败

**症状**:
```
Error: index "idx_patient_birthdate" already exists
```

**原因**: 索引已存在或名称冲突。

**解决方案**:

```typescript
// 检查现有索引
const indexes = await adapter.query(`
  SELECT name FROM sqlite_master
  WHERE type = 'index' AND tbl_name = 'Patient'
`);

console.log('Existing indexes:', indexes);

// 删除冲突的索引
await adapter.execute('DROP INDEX IF EXISTS idx_patient_birthdate');

// 重新创建
await adapter.execute(`
  CREATE INDEX idx_patient_birthdate ON "Patient" ("__birthDate")
`);
```

---

## CRUD 操作问题 (CRUD Operation Issues)

### 问题 10: 资源未找到 (404)

**症状**:
```typescript
ResourceNotFoundError: Patient/unknown-id not found
```

**原因**: 资源不存在或已被删除。

**解决方案**:

#### 1. 检查资源是否存在
```typescript
const exists = await adapter.queryOne(
  'SELECT id FROM "Patient" WHERE id = ? AND deleted = 0',
  [patientId]
);

if (!exists) {
  console.log('Resource does not exist');
}
```

#### 2. 检查是否被软删除
```typescript
const deleted = await adapter.queryOne(
  'SELECT id, deleted FROM "Patient" WHERE id = ?',
  [patientId]
);

if (deleted?.deleted === 1) {
  console.log('Resource was deleted');
}
```

#### 3. 搜索资源
```typescript
const results = await persistence.searchResources({
  resourceType: 'Patient',
  queryParams: { _id: patientId },
});

console.log('Found:', results.total);
```

---

### 问题 11: 版本冲突 (409)

**症状**:
```typescript
ResourceVersionConflictError: Version conflict for Patient/123
Expected version 2, but current version is 3
```

**原因**: 乐观锁定失败，资源已被其他请求修改。

**解决方案**:

#### 1. 重新读取并合并
```typescript
async function updateWithRetry(
  resourceType: string,
  resource: any,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // 读取最新版本
      const latest = await persistence.readResource(resourceType, resource.id);
      
      // 合并更改
      const merged = { ...latest, ...resource };
      
      // 尝试更新
      return await persistence.updateResource(resourceType, merged, {
        ifMatch: latest.meta.versionId,
      });
    } catch (error) {
      if (error instanceof ResourceVersionConflictError && i < maxRetries - 1) {
        console.log(`Retry ${i + 1}/${maxRetries}`);
        continue;
      }
      throw error;
    }
  }
}
```

#### 2. 不使用乐观锁定
```typescript
// 不推荐：可能导致数据丢失
const updated = await persistence.updateResource('Patient', patient);
// 不传递 ifMatch 选项
```

---

### 问题 12: 事务回滚

**症状**:
```
Error: Transaction rolled back
Error: SQLITE_CONSTRAINT: UNIQUE constraint failed
```

**原因**: 事务中的某个操作失败。

**解决方案**:

#### 1. 检查约束违规
```typescript
try {
  await adapter.transaction(async (tx) => {
    await persistence.createResource('Patient', {
      resourceType: 'Patient',
      id: 'duplicate-id',  // 可能已存在
    });
  });
} catch (error) {
  console.error('Transaction failed:', error.message);
  
  // 检查是否是唯一约束违规
  if (error.message.includes('UNIQUE constraint')) {
    console.log('Resource with this ID already exists');
  }
}
```

#### 2. 使用条件创建
```typescript
import { ConditionalService } from 'fhir-persistence';

const conditionalService = new ConditionalService(adapter, spRegistry);

const result = await conditionalService.conditionalCreate(
  'Patient',
  patient,
  { identifier: 'http://hospital.org/mrn|12345' }
);

if (result.outcome === 'existing') {
  console.log('Resource already exists:', result.resource.id);
}
```

---

## 搜索问题 (Search Issues)

### 问题 13: 搜索返回空结果

**症状**:
```typescript
const results = await persistence.searchResources({
  resourceType: 'Patient',
  queryParams: { birthdate: '1990-01-15' },
});

console.log(results.total); // 0
```

**原因**: 搜索参数未索引、值格式错误、或数据未索引。

**解决方案**:

#### 1. 检查搜索参数是否注册
```typescript
const param = spRegistry.get('Patient', 'birthdate');
if (!param) {
  console.error('Search parameter not registered');
}
```

#### 2. 检查搜索列是否存在
```typescript
const columns = await adapter.query(`
  PRAGMA table_info("Patient")
`);

const hasBirthDate = columns.some(col => col.name === '__birthDate');
console.log('Has __birthDate column:', hasBirthDate);
```

#### 3. 检查数据是否已索引
```typescript
const row = await adapter.queryOne(
  'SELECT id, "__birthDate" FROM "Patient" WHERE id = ?',
  [patientId]
);

console.log('Indexed birthDate:', row?.__birthDate);
```

#### 4. 重新索引资源
```typescript
import { reindexResourceTypeV2 } from 'fhir-persistence';

await reindexResourceTypeV2(adapter, 'Patient', (progress) => {
  console.log(`${progress.processed}/${progress.total}`);
});
```

---

### 问题 14: 搜索语法错误

**症状**:
```
Error: Invalid search parameter: unknown-param
Error: Invalid prefix: xx
```

**原因**: 搜索参数名称错误或前缀不支持。

**解决方案**:

#### 1. 检查支持的搜索参数
```typescript
const params = spRegistry.getForResource('Patient');
console.log('Available search parameters:', params.map(p => p.code));
```

#### 2. 检查支持的前缀
```typescript
import { SEARCH_PREFIXES } from 'fhir-persistence';

console.log('Supported prefixes:', SEARCH_PREFIXES);
// ['eq', 'ne', 'gt', 'lt', 'ge', 'le', 'sa', 'eb', 'ap']
```

#### 3. 正确的搜索语法
```typescript
// ✅ 正确
const results = await persistence.searchResources({
  resourceType: 'Patient',
  queryParams: {
    birthdate: 'ge1990-01-01',  // 前缀 + 值
    active: 'true',
    name: 'John',
  },
});

// ❌ 错误
const results = await persistence.searchResources({
  resourceType: 'Patient',
  queryParams: {
    birthdate: '>=1990-01-01',  // 错误的前缀格式
    unknownParam: 'value',      // 未注册的参数
  },
});
```

---

### 问题 15: 链式搜索失败

**症状**:
```
Error: Chain search depth exceeded
Error: Invalid chain reference
```

**原因**: 链式搜索深度过大或引用类型不匹配。

**解决方案**:

#### 1. 检查链式搜索深度
```typescript
// 最大深度为 3
// ✅ 正确
queryParams: {
  'subject:Patient.organization:Organization.name': 'Hospital'
}

// ❌ 错误：深度 > 3
queryParams: {
  'a:B.c:D.e:F.g:H.name': 'value'
}
```

#### 2. 检查引用类型
```typescript
// 确保引用类型匹配
const param = spRegistry.get('Observation', 'subject');
console.log('Target types:', param?.target);  // ['Patient', 'Group', ...]

// ✅ 正确
queryParams: {
  'subject:Patient.birthdate': '1990-01-15'
}

// ❌ 错误：Observation.subject 不能引用 Organization
queryParams: {
  'subject:Organization.name': 'Hospital'
}
```

---

### 问题 16: _include/_revinclude 未返回引用资源

**症状**:
```typescript
const results = await persistence.searchResources({
  resourceType: 'Observation',
  queryParams: {
    code: '8867-4',
    _include: 'Observation:subject',
  },
});

// results.resources 只包含 Observation，没有 Patient
```

**原因**: 引用未索引或引用表为空。

**解决方案**:

#### 1. 检查引用表
```typescript
const refs = await adapter.query(
  'SELECT * FROM "Observation_References" WHERE sourceId = ?',
  [observationId]
);

console.log('References:', refs);
```

#### 2. 重新索引引用
```typescript
import { reindexResourceTypeV2 } from 'fhir-persistence';

await reindexResourceTypeV2(adapter, 'Observation');
```

#### 3. 检查引用格式
```typescript
// ✅ 正确的引用格式
{
  resourceType: 'Observation',
  subject: {
    reference: 'Patient/123'  // 或 'Patient/123/_history/1'
  }
}

// ❌ 错误：缺少 reference
{
  resourceType: 'Observation',
  subject: {
    display: 'John Smith'  // 只有 display，没有 reference
  }
}
```

---

## 性能问题 (Performance Issues)

### 问题 17: 搜索速度慢

**症状**:
```
Search took 5000ms for 100 results
```

**原因**: 缺少索引、表数据量大、或查询未优化。

**解决方案**:

#### 1. 添加索引
```typescript
// 检查查询计划（SQLite）
const plan = await adapter.query(
  'EXPLAIN QUERY PLAN SELECT * FROM "Patient" WHERE "__birthDate" >= ?',
  ['1990-01-01']
);

console.log('Query plan:', plan);

// 如果显示 SCAN（全表扫描），添加索引
await adapter.execute(
  'CREATE INDEX IF NOT EXISTS idx_patient_birthdate ON "Patient" ("__birthDate")'
);
```

#### 2. 使用两阶段搜索
```typescript
import { planSearch, buildTwoPhaseSearchSQLv2 } from 'fhir-persistence';

const request = parseSearchRequest('Patient', queryParams, spRegistry);
const plan = planSearch(request, spRegistry, {
  estimatedRowCount: 1_000_000,
});

if (plan.useTwoPhase) {
  const { phase1, phase2Template } = buildTwoPhaseSearchSQLv2(plan.request, spRegistry);
  
  // 阶段 1: 只获取 ID
  const ids = await adapter.query(phase1.sql, phase1.params);
  
  // 阶段 2: 获取完整资源
  const resources = await adapter.query(phase2Template, ids.map(r => r.id));
}
```

#### 3. 限制结果数量
```typescript
const results = await persistence.searchResources({
  resourceType: 'Patient',
  queryParams: {
    active: 'true',
    _count: '20',  // 限制结果数量
  },
});
```

---

### 问题 18: 内存使用过高

**症状**:
```
Error: JavaScript heap out of memory
```

**原因**: 一次性加载过多数据。

**解决方案**:

#### 1. 使用流式搜索
```typescript
// ❌ 错误：一次性加载所有结果
const results = await persistence.searchResources({
  resourceType: 'Patient',
  queryParams: { active: 'true' },
});

// ✅ 正确：流式处理
for await (const resource of persistence.searchStream({
  resourceType: 'Patient',
  queryParams: { active: 'true' },
})) {
  // 逐个处理
  await processResource(resource);
}
```

#### 2. 分页处理
```typescript
let offset = 0;
const count = 100;

while (true) {
  const results = await persistence.searchResources({
    resourceType: 'Patient',
    queryParams: {
      active: 'true',
      _count: count.toString(),
      _offset: offset.toString(),
    },
  });
  
  if (results.resources.length === 0) break;
  
  for (const resource of results.resources) {
    await processResource(resource);
  }
  
  offset += count;
}
```

#### 3. 增加 Node.js 堆内存
```bash
node --max-old-space-size=4096 your-app.js
```

---

### 问题 19: 数据库文件过大

**症状**:
```
SQLite database file size: 10GB
```

**原因**: 历史版本累积、未清理的删除记录。

**解决方案**:

#### 1. 清理历史版本（保留最近 N 个）
```typescript
await adapter.execute(`
  DELETE FROM "Patient_History"
  WHERE versionSeq NOT IN (
    SELECT versionSeq FROM "Patient_History"
    WHERE id = "Patient_History".id
    ORDER BY versionSeq DESC
    LIMIT 10
  )
`);
```

#### 2. 清理已删除的资源
```typescript
// ⚠️ 警告：永久删除数据
await adapter.execute(`
  DELETE FROM "Patient" WHERE deleted = 1
`);

await adapter.execute(`
  DELETE FROM "Patient_History"
  WHERE id NOT IN (SELECT id FROM "Patient")
`);
```

#### 3. 压缩数据库（SQLite）
```typescript
await adapter.execute('VACUUM');
```

#### 4. 归档旧数据
```typescript
// 导出旧数据到归档数据库
const archiveAdapter = new BetterSqlite3Adapter({ path: './archive.db' });

const oldResources = await adapter.query(`
  SELECT * FROM "Patient"
  WHERE lastUpdated < ?
`, ['2020-01-01T00:00:00Z']);

for (const resource of oldResources) {
  await archiveAdapter.execute(
    'INSERT INTO "Patient" VALUES (?, ?, ?, ?, ?)',
    [resource.id, resource.versionId, resource.lastUpdated, resource.deleted, resource.content]
  );
}

// 从主数据库删除
await adapter.execute(`
  DELETE FROM "Patient" WHERE lastUpdated < ?
`, ['2020-01-01T00:00:00Z']);
```

---

## 错误代码参考 (Error Code Reference)

### RepositoryError 系列

| 错误类 | HTTP 状态码 | 说明 | 解决方案 |
|--------|------------|------|---------|
| `RepositoryError` | 500 | 基础仓库错误 | 检查数据库连接和日志 |
| `ResourceNotFoundError` | 404 | 资源不存在 | 验证资源 ID 是否正确 |
| `ResourceGoneError` | 410 | 资源已被删除 | 检查 deleted 标志 |
| `ResourceVersionConflictError` | 409 | 版本冲突（乐观锁定） | 重新读取并合并更改 |
| `PreconditionFailedError` | 412 | 前置条件失败（条件操作） | 检查搜索条件匹配数量 |

### SQLite 错误代码

| 错误代码 | 说明 | 解决方案 |
|---------|------|---------|
| `SQLITE_CANTOPEN` | 无法打开数据库文件 | 检查文件路径和权限 |
| `SQLITE_CONSTRAINT` | 约束违规 | 检查唯一约束、外键 |
| `SQLITE_BUSY` | 数据库被锁定 | 增加超时、减少并发 |
| `SQLITE_LOCKED` | 表被锁定 | 使用事务、WAL 模式 |
| `SQLITE_NOMEM` | 内存不足 | 减少查询大小、增加内存 |

### PostgreSQL 错误代码

| 错误代码 | 说明 | 解决方案 |
|---------|------|---------|
| `08006` | 连接失败 | 检查网络、PostgreSQL 状态 |
| `23505` | 唯一约束违规 | 检查重复键 |
| `40001` | 序列化失败 | 自动重试（已内置） |
| `53300` | 连接数过多 | 增加 max_connections |
| `57014` | 查询取消 | 增加 statement_timeout |

---

## 调试技巧 (Debugging Tips)

### 1. 启用 SQL 日志

```typescript
class LoggingAdapter implements StorageAdapter {
  constructor(private inner: StorageAdapter) {}
  
  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    console.log('SQL:', sql);
    console.log('Params:', params);
    
    const start = Date.now();
    const result = await this.inner.query<T>(sql, params);
    const duration = Date.now() - start;
    
    console.log(`Duration: ${duration}ms, Rows: ${result.length}`);
    return result;
  }
  
  // ... 实现其他方法
}

const adapter = new LoggingAdapter(
  new BetterSqlite3Adapter({ path: './fhir.db' })
);
```

### 2. 检查生成的 SQL

```typescript
import { parseSearchRequest, buildSearchSQLv2 } from 'fhir-persistence';

const request = parseSearchRequest('Patient', queryParams, spRegistry);
const { sql, params } = buildSearchSQLv2(request, spRegistry);

console.log('Generated SQL:', sql);
console.log('Parameters:', params);
```

### 3. 分析查询计划

```typescript
// SQLite
const plan = await adapter.query(
  'EXPLAIN QUERY PLAN ' + sql,
  params
);
console.log('Query plan:', plan);

// PostgreSQL
const plan = await adapter.query(
  'EXPLAIN (ANALYZE, BUFFERS) ' + sql,
  params
);
console.log('Query plan:', plan);
```

### 4. 监控性能

```typescript
import { SearchLogger } from 'fhir-persistence';

const logger = new SearchLogger();

// 在搜索前后记录
const start = Date.now();
const results = await persistence.searchResources(request);
const duration = Date.now() - start;

logger.logSearch({
  resourceType: request.resourceType,
  queryParams: request.queryParams,
  executionTimeMs: duration,
  resultCount: results.total,
});

// 定期检查统计
const stats = logger.getStats();
console.log('Average search time:', stats.averageExecutionTimeMs);
console.log('Slow searches (>1s):', stats.slowSearches);
```

---

## 常见错误模式 (Common Error Patterns)

### 模式 1: 忘记等待 Promise

```typescript
// ❌ 错误
const patient = persistence.readResource('Patient', '123');
console.log(patient.name);  // undefined

// ✅ 正确
const patient = await persistence.readResource('Patient', '123');
console.log(patient.name);
```

### 模式 2: 未处理错误

```typescript
// ❌ 错误
const patient = await persistence.readResource('Patient', 'unknown-id');
// 抛出 ResourceNotFoundError，程序崩溃

// ✅ 正确
try {
  const patient = await persistence.readResource('Patient', 'unknown-id');
} catch (error) {
  if (error instanceof ResourceNotFoundError) {
    console.log('Patient not found');
  } else {
    throw error;
  }
}
```

### 模式 3: 未关闭数据库连接

```typescript
// ❌ 错误
const adapter = new BetterSqlite3Adapter({ path: './fhir.db' });
await persistence.createResource('Patient', patient);
// 程序退出，连接未关闭

// ✅ 正确
const adapter = new BetterSqlite3Adapter({ path: './fhir.db' });
try {
  await persistence.createResource('Patient', patient);
} finally {
  await adapter.close();
}
```

### 模式 4: 在循环中创建连接

```typescript
// ❌ 错误：每次循环创建新连接
for (const patient of patients) {
  const adapter = new BetterSqlite3Adapter({ path: './fhir.db' });
  await persistence.createResource('Patient', patient);
  await adapter.close();
}

// ✅ 正确：复用连接
const adapter = new BetterSqlite3Adapter({ path: './fhir.db' });
try {
  for (const patient of patients) {
    await persistence.createResource('Patient', patient);
  }
} finally {
  await adapter.close();
}
```

---

## 获取帮助 (Getting Help)

### 1. 检查文档

- **接入指南**: `INTEGRATION-GUIDE.md`
- **API 参考**: `API-REFERENCE.md`
- **架构概览**: `ARCHITECTURE-OVERVIEW.md`

### 2. 搜索已知问题

- **GitHub Issues**: https://github.com/medxaidev/fhir-persistence/issues

### 3. 报告新问题

使用 `BLOCKING-ISSUES.md` 模板报告阻塞性问题。

### 4. 联系支持

- **Email**: fangjun20208@gmail.com
- **GitHub**: https://github.com/medxaidev/fhir-persistence

---

## 诊断检查清单 (Diagnostic Checklist)

在报告问题前，请完成以下检查：

- [ ] 确认版本兼容性（Node.js >= 18.0.0）
- [ ] 检查所有依赖已安装
- [ ] 查看错误堆栈跟踪
- [ ] 启用 SQL 日志
- [ ] 检查数据库连接
- [ ] 验证 Schema 是否正确
- [ ] 测试简化的重现案例
- [ ] 查阅相关文档
- [ ] 搜索类似问题

---

**文档版本历史 (Document Version History)**

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2024-03 | 初始版本，完整故障排除指南 |
