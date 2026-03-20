# fhir-persistence — 自定义表格清单

**版本：** 0.7.0  
**日期：** 2026-03-18

---

## 一、表格分类

fhir-persistence 中的自定义表格分为以下几类：

### 1. 系统管理表（System Management）

| 表名 | 用途 | 主键 | 索引 | 位置 |
|------|------|------|------|------|
| `_migrations` | Schema 迁移版本跟踪 | `version` (INTEGER) | 无 | `src/migrations/migration-runner.ts` |
| `_packages` | IG 包注册表（name, version, checksum） | `(name, version)` | 无 | `src/registry/package-registry-repo.ts` |
| `_schema_version` | Schema 版本快照（packageList JSON） | `version` (INTEGER) | 无 | `src/registry/package-registry-repo.ts` |

**说明：**
- `_migrations`：记录已应用的 schema 迁移（file 或 ig 类型）
- `_packages`：跟踪已安装的 IG 包，用于 checksum 变更检测
- `_schema_version`：记录每次 schema 变更时的包列表快照

---

### 2. 术语表（Terminology）

| 表名 | 用途 | 主键 | 索引 | 位置 |
|------|------|------|------|------|
| `terminology_codes` | 平铺码表 (system, code, display) | `(system, code)` | `code` | `src/terminology/terminology-code-repo.ts` |
| `terminology_valuesets` | ValueSet 原始资源存储 | `(url, version)` | 无 | `src/terminology/valueset-repo.ts` |

**说明：**
- `terminology_codes`：用于快速 (system, code) → display 查询
- `terminology_valuesets`：存储完整 ValueSet JSON

---

### 3. Conformance 模块（v0.7.0 新增）

| 表名 | 用途 | 主键 | 索引 | 位置 |
|------|------|------|------|------|
| `ig_resource_map` | IG → 资源映射关系 | `(ig_id, resource_type, resource_id)` | `ig_id`, `(ig_id, resource_type)` | `src/conformance/ig-resource-map-repo.ts` |
| `structure_definition_index` | SD 快速查询索引 | `id` | `type`, `kind`, `base_definition` | `src/conformance/sd-index-repo.ts` |
| `structure_element_index` | Element tree 加速索引 | `id` | `structure_id`, `path`, `(structure_id, is_slice)` | `src/conformance/element-index-repo.ts` |
| `value_set_expansion` | ValueSet expansion 缓存 | `(valueset_url, version)` | 无 | `src/conformance/expansion-cache-repo.ts` |
| `code_system_concept` | CodeSystem 层级表 | `id` | `code_system_url`, `(code_system_url, code)`, `(code_system_url, parent_code)` | `src/conformance/concept-hierarchy-repo.ts` |
| `search_parameter_index` | IG 内 SearchParameter 索引 | `id` | `ig_id`, `code` | `src/conformance/search-param-index-repo.ts` |

**说明：**
- 这些表专门用于 IG 管理、索引加速、术语缓存
- 与 per-resource-type 表（Patient, Observation 等）共存，互不干扰
- 支持 SQLite 和 PostgreSQL 双后端（方言感知 DDL）

---

### 4. Per-Resource-Type 表（动态生成）

每个 FHIR 资源类型（Patient, Observation, Practitioner 等）都有 3 张表：

| 表名模式 | 用途 | 主键 | 索引 |
|---------|------|------|------|
| `{ResourceType}` | 主表（当前版本 + 搜索列） | `id` | `lastUpdated`, `_profile`, 搜索参数列 |
| `{ResourceType}_History` | 历史版本表 | `versionSeq` (AUTOINCREMENT) | `(id, versionId)` |
| `{ResourceType}_References` | 引用索引表 | 无 | `(resourceId, targetType)`, `(targetType, targetId)` |

**说明：**
- 这些表由 `buildResourceTableSet()` 根据 SearchParameter 定义动态生成
- 不属于"自定义表"，而是 FHIR 标准资源表
- DDL 生成位置：`src/schema/ddl-generator.ts`

---

## 二、是否对外公布？

### 建议：**部分公开，部分内部**

| 表类型 | 公开程度 | 理由 |
|--------|---------|------|
| **系统管理表** (`_migrations`, `_packages`, `_schema_version`) | 🔒 **内部使用** | 这些是 fhir-persistence 的内部实现细节，用户不应直接操作 |
| **术语表** (`terminology_codes`, `terminology_valuesets`) | 📖 **文档说明** | 用户可能需要了解如何查询术语，但不应直接写入 |
| **Conformance 模块** | ✅ **完全公开** | 这是 v0.7.0 的核心功能，专门为 IG Explorer 设计，应该在 API 文档中详细说明 |
| **Per-Resource-Type 表** | 📖 **Schema 文档** | 用户需要了解表结构以便理解搜索索引策略，但不应直接操作（应通过 FhirPersistence API） |

### 建议的文档策略

1. **API 文档**（`docs/API.md`）
   - 完整记录 Conformance 模块的 7 个 Repo 类及其 API
   - 说明每个表的用途、查询方法、索引策略

2. **架构文档**（`docs/ARCHITECTURE.md` 或新建 `docs/SCHEMA.md`）
   - 列出所有自定义表的 DDL
   - 说明系统管理表的作用（但标注为"内部使用"）
   - 解释 per-resource-type 表的生成逻辑

3. **README.md**
   - 在 Features 中增加一条：
     ```markdown
     - **Conformance storage module** — IG resource indexing (6 repos + orchestrator)
     ```

---

## 三、维护和升级策略

### 3.1 系统管理表

**维护方式：**
- `_migrations` 表由 `MigrationRunnerV2` 自动管理，无需手动维护
- `_packages` 表由 `PackageRegistryRepo` 管理，通过 `IGPersistenceManager` 自动更新
- `_schema_version` 表在每次 schema 变更时自动记录快照

**升级策略：**
- 如果需要修改这些表的结构，必须通过 **schema migration** 实现
- 在 `src/migrations/` 中创建新的 migration 文件
- 示例：
  ```typescript
  {
    version: 15,
    description: 'add-canonical-to-packages',
    type: 'file',
    up: [`ALTER TABLE "_packages" ADD COLUMN "canonical" TEXT`],
    down: [`ALTER TABLE "_packages" DROP COLUMN "canonical"`],
  }
  ```

---

### 3.2 术语表

**维护方式：**
- `TerminologyCodeRepo.batchInsert()` — 批量插入码表
- `ValueSetRepo.upsert()` — 插入/更新 ValueSet

**升级策略：**
- 如果需要增加字段（如 `terminology_codes` 增加 `definition` 列）：
  1. 创建 migration 文件
  2. 更新 `TerminologyCodeRepo` 的 DDL 和类型定义
  3. 更新相关 API

---

### 3.3 Conformance 模块

**维护方式：**
- 通过 `IGImportOrchestrator.importIG()` 批量导入
- 各个 Repo 提供独立的 CRUD API

**升级策略：**

#### 场景 1：新增字段
例如：`ig_resource_map` 需要增加 `canonical` 字段

1. **创建 migration**
   ```typescript
   {
     version: 16,
     description: 'add-canonical-to-ig-resource-map',
     type: 'file',
     up: [`ALTER TABLE "ig_resource_map" ADD COLUMN "canonical" TEXT`],
     down: [`ALTER TABLE "ig_resource_map" DROP COLUMN "canonical"`],
   }
   ```

2. **更新 Repo**
   - 修改 `IGResourceMapEntry` 接口
   - 修改 `batchInsert()` SQL
   - 更新测试

3. **更新文档**
   - `docs/API.md` 中更新接口定义
   - `CHANGELOG.md` 中记录变更

#### 场景 2：新增表
例如：需要新增 `ig_dependency` 表

1. **创建新 Repo**
   ```typescript
   // src/conformance/ig-dependency-repo.ts
   export class IGDependencyRepo {
     async ensureTable() { ... }
     async batchInsert() { ... }
   }
   ```

2. **更新 Orchestrator**
   - 在 `IGImportOrchestrator` 中集成新 Repo
   - 更新 `importIG()` 流程

3. **导出**
   - `src/conformance/index.ts` 中导出
   - `src/index.ts` 中导出

4. **测试 + 文档**
   - 创建 `__tests__/conformance/ig-dependency-repo.test.ts`
   - 更新 API 文档

#### 场景 3：修改索引
例如：`structure_element_index` 需要增加 `(path, is_extension)` 复合索引

1. **创建 migration**
   ```typescript
   {
     version: 17,
     description: 'add-path-extension-index-to-element-index',
     type: 'file',
     up: [`CREATE INDEX IF NOT EXISTS idx_sei_path_ext ON "structure_element_index"("path", "is_extension")`],
     down: [`DROP INDEX IF EXISTS idx_sei_path_ext`],
   }
   ```

2. **更新 Repo DDL**
   - 在 `element-index-repo.ts` 中增加 `CREATE_INDEX_PATH_EXT` 常量
   - 在 `ensureTable()` 中调用

---

### 3.4 版本兼容性

**向后兼容原则：**
- 新增字段必须有 `DEFAULT` 值或允许 `NULL`
- 新增表不影响现有功能
- 索引变更不破坏现有查询

**Breaking Changes 处理：**
- 如果必须删除字段或修改主键，必须：
  1. 在 CHANGELOG 中标注 `BREAKING CHANGE`
  2. 提供数据迁移脚本
  3. 升级 major 版本（如 0.7.0 → 1.0.0）

---

## 四、总结

### 当前自定义表格总览

| 类别 | 表数量 | 公开程度 | 维护方式 |
|------|--------|---------|---------|
| 系统管理表 | 3 | 内部使用 | 自动管理 + migration |
| 术语表 | 2 | 文档说明 | Repo API + migration |
| Conformance 模块 | 6 | 完全公开 | Repo API + Orchestrator + migration |
| **总计** | **11** | — | — |

### 维护建议

1. **所有 schema 变更必须通过 migration 实现**
2. **Conformance 模块应在 API 文档中详细说明**
3. **系统管理表标注为"内部使用"，不建议用户直接操作**
4. **每次新增表/字段都要更新此文档**

---

_CUSTOM_TABLES v1.0 — fhir-persistence 自定义表格清单_
