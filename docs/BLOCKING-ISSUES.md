# fhir-persistence — 阻塞问题上报模版 (Blocking Issue Report Template)

**文档版本 (Document Version):** 1.0.0  
**适用产品版本 (Product Version):** fhir-persistence v0.6.0+  
**最后更新 (Last Updated):** 2024-03

---

## 使用说明 (Instructions)

本模版用于报告阻塞性问题（Blocking Issues），即严重影响系统正常运行或开发进度的问题。

**何时使用此模版**:
- ✅ 系统崩溃或无法启动
- ✅ 数据丢失或损坏
- ✅ 严重性能问题（响应时间 >10s）
- ✅ 安全漏洞
- ✅ 阻塞生产部署的问题

**何时不使用此模版**:
- ❌ 功能请求（Feature Requests）
- ❌ 文档改进建议
- ❌ 一般性问题咨询
- ❌ 非阻塞性 Bug

**提交方式**:
1. 复制本模版内容
2. 填写所有必填字段
3. 在 GitHub 创建 Issue: https://github.com/medxaidev/fhir-persistence/issues/new
4. 标题格式: `[BLOCKING] 简短问题描述`
5. 添加标签: `blocking`, `bug`

---

## 问题报告模版 (Issue Report Template)

```markdown
## 问题概述 (Issue Summary)

**问题标题 (Title)**: [简短描述问题，50 字以内]

**严重程度 (Severity)**: [选择一项]
- [ ] P0 - 系统完全不可用（System Down）
- [ ] P1 - 核心功能不可用（Core Feature Broken）
- [ ] P2 - 重要功能受影响（Major Feature Impacted）
- [ ] P3 - 次要功能受影响（Minor Feature Impacted）

**影响范围 (Impact Scope)**: [选择所有适用项]
- [ ] 生产环境（Production）
- [ ] 开发环境（Development）
- [ ] 测试环境（Testing）
- [ ] 所有环境（All Environments）

**受影响用户数 (Affected Users)**: [估计数量或百分比]

---

## 环境信息 (Environment Information)

### 版本信息 (Version Information)

**必填 (Required)**:
- **fhir-persistence 版本**: [例如: 0.6.0]
- **Node.js 版本**: [例如: 18.19.0]
- **操作系统**: [例如: Ubuntu 22.04 / Windows 11 / macOS 14.0]

**数据库信息 (Database)**:
- **数据库类型**: [SQLite / PostgreSQL]
- **数据库版本**: [例如: SQLite 3.45.0 / PostgreSQL 15.3]

**依赖版本 (Dependencies)**:
```bash
# 运行以下命令并粘贴输出
npm list fhir-persistence fhir-definition fhir-runtime better-sqlite3 pg
```

**输出 (Output)**:
```
[粘贴 npm list 输出]
```

### 部署信息 (Deployment Information)

- **部署方式**: [Docker / 裸机 / 云服务 (AWS/Azure/GCP)]
- **集群规模**: [单节点 / 多节点 (数量)]
- **负载均衡**: [是 / 否]

---

## 问题详情 (Issue Details)

### 问题描述 (Description)

**必填**: 详细描述问题，包括：
- 问题发生时正在执行什么操作
- 预期行为是什么
- 实际发生了什么
- 问题首次出现的时间

```
[在此处详细描述问题]
```

### 重现步骤 (Steps to Reproduce)

**必填**: 提供详细的重现步骤

1. [第一步]
2. [第二步]
3. [第三步]
4. ...

**重现频率 (Reproduction Rate)**: [选择一项]
- [ ] 100% - 每次都能重现
- [ ] 高频 (>50%) - 经常出现
- [ ] 中频 (10-50%) - 偶尔出现
- [ ] 低频 (<10%) - 很少出现
- [ ] 无法稳定重现

### 最小重现示例 (Minimal Reproduction Example)

**强烈建议提供**: 提供可独立运行的最小代码示例

```typescript
// 示例代码
import { BetterSqlite3Adapter, FhirPersistence } from 'fhir-persistence';

const adapter = new BetterSqlite3Adapter({ path: ':memory:' });
const persistence = new FhirPersistence({
  adapter,
  searchParameterRegistry: spRegistry,
});

// 导致问题的操作
const patient = await persistence.createResource('Patient', {
  resourceType: 'Patient',
  name: [{ family: 'Smith' }],
});

// 预期: 成功创建
// 实际: [描述实际发生的情况]
```

**GitHub Gist / CodeSandbox 链接**: [如果代码较长，提供链接]

---

## 错误信息 (Error Information)

### 错误消息 (Error Message)

**必填**: 完整的错误消息

```
[粘贴完整错误消息]
```

### 堆栈跟踪 (Stack Trace)

**必填**: 完整的堆栈跟踪

```
[粘贴完整堆栈跟踪]
```

### 日志输出 (Log Output)

**推荐提供**: 相关的日志输出（脱敏后）

```
[粘贴相关日志，注意移除敏感信息如密码、密钥等]
```

---

## 数据库状态 (Database State)

### Schema 信息 (Schema Information)

**如果问题与数据库相关，请提供**:

```sql
-- SQLite
.schema Patient

-- PostgreSQL
\d "Patient"
```

**输出 (Output)**:
```sql
[粘贴 schema 输出]
```

### 数据样本 (Data Sample)

**如果问题与特定数据相关，请提供脱敏样本**:

```json
{
  "resourceType": "Patient",
  "id": "example-123",
  "name": [
    {
      "family": "Smith",
      "given": ["John"]
    }
  ]
}
```

### 查询信息 (Query Information)

**如果问题与搜索相关，请提供**:

```typescript
// 搜索请求
const results = await persistence.searchResources({
  resourceType: 'Patient',
  queryParams: {
    birthdate: 'ge1990-01-01',
    active: 'true',
  },
});

// 生成的 SQL（如果可用）
console.log(sql);
```

**生成的 SQL**:
```sql
[粘贴生成的 SQL]
```

---

## 已尝试的解决方案 (Attempted Solutions)

**必填**: 列出已经尝试过的解决方案

- [ ] 重启应用
- [ ] 重启数据库
- [ ] 清理并重新安装依赖 (`rm -rf node_modules && npm install`)
- [ ] 重新生成 Schema
- [ ] 重新索引资源
- [ ] 查阅文档: [列出查阅的文档]
- [ ] 搜索类似问题: [列出搜索结果]
- [ ] 其他: [描述其他尝试]

**尝试结果**:
```
[描述每个尝试的结果]
```

---

## 业务影响 (Business Impact)

### 影响描述 (Impact Description)

**必填**: 描述问题对业务的影响

```
[描述业务影响，例如：
- 无法处理患者数据
- 生产环境搜索功能不可用
- 数据迁移被阻塞
]
```

### 紧急程度 (Urgency)

**必填**: [选择一项]
- [ ] 立即 (Immediate) - 需要在 4 小时内解决
- [ ] 紧急 (Urgent) - 需要在 24 小时内解决
- [ ] 高 (High) - 需要在 3 天内解决
- [ ] 中 (Medium) - 需要在 1 周内解决

### 临时解决方案 (Workaround)

**如果有**: 描述当前使用的临时解决方案

```
[描述临时解决方案及其限制]
```

---

## 附加信息 (Additional Information)

### 相关 Issues (Related Issues)

**如果有**: 列出相关的 GitHub Issues

- #123
- #456

### 截图/录屏 (Screenshots/Recordings)

**如果适用**: 附加截图或录屏链接

- [截图 1 描述]: [链接]
- [录屏]: [链接]

### 配置文件 (Configuration Files)

**如果相关**: 提供配置文件（脱敏后）

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "module": "ESNext",
    "target": "ES2022"
  }
}

// package.json (部分)
{
  "dependencies": {
    "fhir-persistence": "^0.6.0"
  }
}
```

### 性能指标 (Performance Metrics)

**如果是性能问题**: 提供性能数据

```
- 响应时间: [例如: 15s]
- CPU 使用率: [例如: 95%]
- 内存使用: [例如: 8GB / 16GB]
- 数据库大小: [例如: 10GB]
- 资源数量: [例如: 1,000,000 条 Patient 记录]
```

---

## 期望行为 (Expected Behavior)

**必填**: 描述期望的正确行为

```
[详细描述期望的行为]
```

---

## 联系信息 (Contact Information)

**可选但推荐**: 提供联系方式以便快速沟通

- **GitHub 用户名**: [@your-username]
- **Email**: [your-email@example.com]
- **时区**: [例如: UTC+8]
- **可联系时间**: [例如: 工作日 9:00-18:00]

---

## 检查清单 (Checklist)

**提交前请确认**:

- [ ] 已填写所有必填字段
- [ ] 已提供完整的错误消息和堆栈跟踪
- [ ] 已提供重现步骤
- [ ] 已尝试基本的故障排除步骤
- [ ] 已查阅相关文档（TROUBLESHOOTING.md）
- [ ] 已搜索类似的已知问题
- [ ] 已移除所有敏感信息（密码、密钥、个人数据）
- [ ] 已添加适当的标签（blocking, bug）

---

## 内部使用 (For Maintainers Only)

**维护者填写**:

- **分配给 (Assigned To)**: 
- **优先级 (Priority)**: 
- **里程碑 (Milestone)**: 
- **预计修复时间 (ETA)**: 
- **根本原因 (Root Cause)**: 
- **修复方案 (Fix Plan)**: 

---

## 示例问题报告 (Example Issue Report)

以下是一个完整的示例报告供参考：

```markdown
## 问题概述

**问题标题**: PostgreSQL 连接池耗尽导致所有请求超时

**严重程度**: 
- [x] P0 - 系统完全不可用

**影响范围**:
- [x] 生产环境

**受影响用户数**: 100% (所有用户)

---

## 环境信息

### 版本信息

- **fhir-persistence 版本**: 0.6.0
- **Node.js 版本**: 18.19.0
- **操作系统**: Ubuntu 22.04 LTS

**数据库信息**:
- **数据库类型**: PostgreSQL
- **数据库版本**: 15.3

**依赖版本**:
```bash
fhir-persistence@0.6.0
├── fhir-definition@0.5.0
├── fhir-runtime@0.8.1
└── pg@8.20.0
```

### 部署信息

- **部署方式**: Docker (Kubernetes)
- **集群规模**: 3 节点
- **负载均衡**: 是 (Nginx Ingress)

---

## 问题详情

### 问题描述

在生产环境中，所有 FHIR API 请求在运行约 2 小时后开始超时。查看日志发现 PostgreSQL 连接池已耗尽，所有新请求都在等待可用连接。

问题首次出现时间: 2024-03-15 14:30 UTC

### 重现步骤

1. 部署应用到生产环境
2. 配置 PostgreSQL 连接池 max=10
3. 运行负载测试（100 并发用户）
4. 约 2 小时后，所有请求开始超时

**重现频率**: 
- [x] 100% - 每次都能重现

### 最小重现示例

```typescript
import { PostgresAdapter, FhirPersistence } from 'fhir-persistence';
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'fhir_db',
  max: 10,  // 小连接池
});

const adapter = new PostgresAdapter(pool);
const persistence = new FhirPersistence({ adapter, searchParameterRegistry });

// 模拟高并发
for (let i = 0; i < 100; i++) {
  persistence.searchResources({
    resourceType: 'Patient',
    queryParams: { active: 'true' },
  }).catch(err => console.error(err));
}

// 预期: 所有搜索成功完成
// 实际: 约 2 小时后所有请求超时
```

---

## 错误信息

### 错误消息

```
Error: timeout exceeded when trying to connect
    at Connection.connectAsync (/app/node_modules/pg/lib/connection.js:45:23)
```

### 堆栈跟踪

```
Error: timeout exceeded when trying to connect
    at Connection.connectAsync (/app/node_modules/pg/lib/connection.js:45:23)
    at Pool._pulseQueue (/app/node_modules/pg-pool/index.js:148:28)
    at Pool.connect (/app/node_modules/pg-pool/index.js:42:10)
    at PostgresAdapter.query (/app/node_modules/fhir-persistence/dist/esm/db/postgres-adapter.mjs:67:24)
    at FhirPersistence.searchResources (/app/node_modules/fhir-persistence/dist/esm/store/fhir-persistence.mjs:123:18)
```

### 日志输出

```
[2024-03-15T14:30:15.234Z] INFO: Pool stats: total=10, idle=0, waiting=50
[2024-03-15T14:30:16.456Z] ERROR: Connection timeout after 2000ms
[2024-03-15T14:30:17.789Z] ERROR: Connection timeout after 2000ms
```

---

## 数据库状态

### 查询信息

```sql
-- 检查活动连接
SELECT count(*) FROM pg_stat_activity WHERE datname = 'fhir_db';
-- 结果: 10 (达到 max_connections)

-- 检查长时间运行的查询
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '1 minute';
-- 结果: 多个查询运行超过 5 分钟
```

---

## 已尝试的解决方案

- [x] 重启应用 - 临时解决，2 小时后再次出现
- [x] 增加连接池大小到 max=50 - 延迟问题出现但未根本解决
- [x] 查阅文档: TROUBLESHOOTING.md 问题 6
- [ ] 重启数据库 - 未尝试（生产环境）

**尝试结果**:
增加连接池大小延迟了问题出现，但未根本解决。怀疑存在连接泄漏。

---

## 业务影响

### 影响描述

生产环境 FHIR API 完全不可用，影响所有医疗应用的数据访问。约 1000 名医护人员无法访问患者数据。

### 紧急程度

- [x] 立即 (Immediate) - 需要在 4 小时内解决

### 临时解决方案

每 2 小时重启应用，但这会导致短暂的服务中断。

---

## 附加信息

### 性能指标

- 响应时间: 超时 (>30s)
- CPU 使用率: 15%
- 内存使用: 2GB / 8GB
- 数据库大小: 50GB
- 资源数量: 500,000 条 Patient 记录
- 并发请求: 100

---

## 期望行为

所有请求应该正常完成，连接应该被正确释放回连接池。

---

## 联系信息

- **GitHub 用户名**: @john-smith
- **Email**: john.smith@hospital.org
- **时区**: UTC+8
- **可联系时间**: 24/7 (紧急情况)
```

---

## 提交后 (After Submission)

### 期望响应时间 (Expected Response Time)

| 严重程度 | 首次响应 | 修复目标 |
|---------|---------|---------|
| P0 | 4 小时 | 24 小时 |
| P1 | 8 小时 | 3 天 |
| P2 | 24 小时 | 1 周 |
| P3 | 3 天 | 2 周 |

### 跟进流程 (Follow-up Process)

1. **确认收到**: 维护者会在首次响应时间内确认收到问题
2. **初步分析**: 维护者会进行初步分析并可能要求更多信息
3. **修复开发**: 开始开发修复方案
4. **测试验证**: 在测试环境验证修复
5. **发布修复**: 发布包含修复的新版本
6. **关闭问题**: 确认修复后关闭 Issue

---

## 技术支持 (Technical Support)

- **GitHub Issues**: https://github.com/medxaidev/fhir-persistence/issues
- **Email**: fangjun20208@gmail.com
- **文档**: https://github.com/medxaidev/fhir-persistence#readme

---

**文档版本历史 (Document Version History)**

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2024-03 | 初始版本，完整问题报告模版 |
