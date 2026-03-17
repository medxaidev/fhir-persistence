# fhir-persistence — 文档中心 (Documentation Hub)

**文档版本 (Document Version):** 1.0.0  
**适用产品版本 (Product Version):** fhir-persistence v0.6.0+  
**最后更新 (Last Updated):** 2024-03

---

## 欢迎 (Welcome)

欢迎使用 `fhir-persistence` 文档中心。本文档集提供了完整的接入指南、API 参考、架构说明和故障排除信息，帮助您快速集成和使用 FHIR 持久化层。

Welcome to the `fhir-persistence` documentation hub. This documentation set provides complete integration guides, API references, architecture descriptions, and troubleshooting information to help you quickly integrate and use the FHIR persistence layer.

---

## 版本要求 (Version Requirements)

| 组件 | 最低版本 | 推荐版本 | 说明 |
|------|---------|---------|------|
| **fhir-persistence** | 0.6.0 | 0.6.0 | 本包 |
| **Node.js** | 18.0.0 | 20.x LTS | 运行时环境 |
| **npm** | 9.0.0 | 10.x | 包管理器 |
| **TypeScript** | 5.0.0 | 5.9.3 | 开发依赖（可选） |
| **fhir-definition** | 0.5.0 | 0.5.0 | FHIR 定义 |
| **fhir-runtime** | 0.8.1 | 0.8.1 | FHIRPath 运行时 |
| **better-sqlite3** | 12.6.2 | 12.6.2 | SQLite 适配器 |
| **pg** | 8.0.0 | 8.20.0 | PostgreSQL 适配器（可选） |
| **SQLite** | 3.35.0 | 3.45.0+ | 数据库 |
| **PostgreSQL** | 12.0 | 15.x / 16.x | 数据库（可选） |

---

## 文档导航 (Documentation Navigation)

### 📚 核心文档 (Core Documentation)

#### 1. [接入指南 (INTEGRATION-GUIDE.md)](./INTEGRATION-GUIDE.md)

**适合人群**: 新用户、系统集成工程师  
**阅读时间**: 30-45 分钟

**内容概览**:
- ✅ 完整的安装和配置步骤
- ✅ 快速开始示例（SQLite & PostgreSQL）
- ✅ 推荐集成方式（FhirSystem）
- ✅ 核心 API 使用示例
- ✅ CRUD、搜索、条件操作
- ✅ Schema 迁移管理
- ✅ 高级特性（全文搜索、缓存）
- ✅ 性能优化建议
- ✅ 安全建议
- ✅ 测试集成
- ✅ 部署检查清单

**何时阅读**:
- 首次接入系统
- 需要了解基本用法
- 准备生产部署

---

#### 2. [API 完整参考 (API-REFERENCE.md)](./API-REFERENCE.md)

**适合人群**: 开发工程师、API 用户  
**阅读时间**: 60-90 分钟（参考文档）

**内容概览**:
- ✅ 所有公共 API 的详细说明
- ✅ 核心门面（FhirPersistence, FhirStore）
- ✅ 存储适配器（SQLite, PostgreSQL）
- ✅ SQL 方言抽象
- ✅ 注册表（SearchParameter, StructureDefinition）
- ✅ Schema 和 DDL 生成
- ✅ 搜索 API（解析、构建、执行）
- ✅ 迁移引擎
- ✅ 索引管道
- ✅ 条件操作
- ✅ Bundle 处理
- ✅ 术语服务
- ✅ 启动编排器
- ✅ 生产工具
- ✅ 完整类型定义
- ✅ 版本兼容性矩阵

**何时阅读**:
- 需要查找特定 API
- 了解参数和返回值
- 检查版本兼容性

---

#### 3. [架构概览 (ARCHITECTURE-OVERVIEW.md)](./ARCHITECTURE-OVERVIEW.md)

**适合人群**: 架构师、高级工程师  
**阅读时间**: 45-60 分钟

**内容概览**:
- ✅ 系统在 FHIR 生态中的定位
- ✅ 核心设计原则（6 大原则）
- ✅ 架构分层（6 层架构）
- ✅ 数据模型（三表模式）
- ✅ 模块组织和依赖关系
- ✅ 数据流（创建、搜索、迁移）
- ✅ 扩展点（自定义适配器、方言）
- ✅ 性能考量
- ✅ 安全架构
- ✅ 版本演进历史
- ✅ 测试策略
- ✅ 部署拓扑
- ✅ 监控和可观测性
- ✅ 未来路线图

**何时阅读**:
- 需要深入理解系统设计
- 评估技术选型
- 规划系统扩展
- 进行性能优化

---

#### 4. [故障排除指南 (TROUBLESHOOTING.md)](./TROUBLESHOOTING.md)

**适合人群**: 所有用户  
**阅读时间**: 根据问题而定

**内容概览**:
- ✅ 安装问题（19 个常见问题）
- ✅ 数据库连接问题
- ✅ Schema 和迁移问题
- ✅ CRUD 操作问题
- ✅ 搜索问题
- ✅ 性能问题
- ✅ 错误代码参考
- ✅ 调试技巧
- ✅ 常见错误模式
- ✅ 诊断检查清单

**何时阅读**:
- 遇到错误或问题
- 系统行为异常
- 性能不符合预期
- 需要调试帮助

---

#### 5. [阻塞问题上报模版 (BLOCKING-ISSUES.md)](./BLOCKING-ISSUES.md)

**适合人群**: 遇到阻塞性问题的用户  
**阅读时间**: 10-15 分钟（填写模版）

**内容概览**:
- ✅ 完整的问题报告模版
- ✅ 环境信息收集指南
- ✅ 重现步骤编写指南
- ✅ 错误信息收集方法
- ✅ 业务影响评估
- ✅ 示例问题报告
- ✅ 提交流程和响应时间

**何时使用**:
- 系统崩溃或无法启动
- 数据丢失或损坏
- 严重性能问题
- 安全漏洞
- 阻塞生产部署的问题

---

## 快速链接 (Quick Links)

### 🚀 快速开始 (Quick Start)

```bash
# 安装
npm install fhir-persistence fhir-definition fhir-runtime better-sqlite3

# 基础使用
import { BetterSqlite3Adapter, FhirPersistence } from 'fhir-persistence';

const adapter = new BetterSqlite3Adapter({ path: './fhir.db' });
const persistence = new FhirPersistence({ adapter, searchParameterRegistry });

const patient = await persistence.createResource('Patient', {
  resourceType: 'Patient',
  name: [{ family: 'Smith', given: ['John'] }],
});
```

**详细步骤**: 参见 [接入指南 - 快速开始](./INTEGRATION-GUIDE.md#快速开始-quick-start)

---

### 📖 常用场景 (Common Scenarios)

#### 场景 1: 创建和搜索资源

```typescript
// 创建
const patient = await persistence.createResource('Patient', {
  resourceType: 'Patient',
  birthDate: '1990-01-15',
  active: true,
});

// 搜索
const results = await persistence.searchResources({
  resourceType: 'Patient',
  queryParams: { birthdate: 'ge1990-01-01', active: 'true' },
});
```

**详细说明**: [接入指南 - 核心 API 使用](./INTEGRATION-GUIDE.md#核心-api-使用-core-api-usage)

---

#### 场景 2: Schema 迁移

```typescript
import { IGPersistenceManager } from 'fhir-persistence';

const igManager = new IGPersistenceManager(adapter, 'sqlite');
const result = await igManager.initialize({
  name: 'hl7.fhir.r4.core',
  version: '4.0.1',
  checksum: computedChecksum,
  tableSets: tableSets,
});

console.log('Action:', result.action); // 'new' | 'upgrade' | 'consistent'
```

**详细说明**: [接入指南 - Schema 迁移](./INTEGRATION-GUIDE.md#schema-迁移-schema-migration)

---

#### 场景 3: 条件操作

```typescript
import { ConditionalService } from 'fhir-persistence';

const service = new ConditionalService(adapter, spRegistry);

const result = await service.conditionalCreate('Patient', patient, {
  identifier: 'http://hospital.org/mrn|12345',
});

if (result.outcome === 'existing') {
  console.log('Patient already exists');
}
```

**详细说明**: [接入指南 - 条件操作](./INTEGRATION-GUIDE.md#条件操作-conditional-operations)

---

### 🔍 问题排查 (Troubleshooting)

#### 常见问题快速索引

| 问题类型 | 文档位置 |
|---------|---------|
| 安装失败 | [故障排除 - 问题 1](./TROUBLESHOOTING.md#问题-1-better-sqlite3-安装失败) |
| 连接超时 | [故障排除 - 问题 5](./TROUBLESHOOTING.md#问题-5-postgresql-连接超时) |
| Schema 迁移失败 | [故障排除 - 问题 7](./TROUBLESHOOTING.md#问题-7-schema-迁移失败) |
| 搜索返回空结果 | [故障排除 - 问题 13](./TROUBLESHOOTING.md#问题-13-搜索返回空结果) |
| 性能问题 | [故障排除 - 问题 17](./TROUBLESHOOTING.md#问题-17-搜索速度慢) |

---

## 学习路径 (Learning Path)

### 🎯 初学者路径 (Beginner Path)

**目标**: 能够使用基本 CRUD 和搜索功能

1. **第 1 步**: 阅读 [接入指南 - 快速开始](./INTEGRATION-GUIDE.md#快速开始-quick-start) (15 分钟)
2. **第 2 步**: 运行快速开始示例代码 (15 分钟)
3. **第 3 步**: 阅读 [接入指南 - 核心 API 使用](./INTEGRATION-GUIDE.md#核心-api-使用-core-api-usage) (30 分钟)
4. **第 4 步**: 实践 CRUD 操作 (30 分钟)
5. **第 5 步**: 实践基础搜索 (30 分钟)

**总时间**: 约 2 小时

---

### 🚀 中级路径 (Intermediate Path)

**目标**: 掌握高级搜索、迁移、条件操作

**前置要求**: 完成初学者路径

1. **第 1 步**: 阅读 [API 参考 - 搜索 API](./API-REFERENCE.md#搜索-api-search-api) (30 分钟)
2. **第 2 步**: 实践链式搜索和 _include (45 分钟)
3. **第 3 步**: 阅读 [接入指南 - Schema 迁移](./INTEGRATION-GUIDE.md#schema-迁移-schema-migration) (20 分钟)
4. **第 4 步**: 实践 Schema 迁移 (30 分钟)
5. **第 5 步**: 阅读 [API 参考 - 条件操作](./API-REFERENCE.md#条件操作-conditional-operations) (15 分钟)
6. **第 6 步**: 实践条件 CRUD (30 分钟)

**总时间**: 约 3 小时

---

### 🏆 高级路径 (Advanced Path)

**目标**: 深入理解架构、优化性能、扩展系统

**前置要求**: 完成中级路径

1. **第 1 步**: 阅读 [架构概览](./ARCHITECTURE-OVERVIEW.md) (60 分钟)
2. **第 2 步**: 阅读 [接入指南 - 性能优化](./INTEGRATION-GUIDE.md#性能优化建议-performance-optimization) (30 分钟)
3. **第 3 步**: 实践性能优化（索引、两阶段搜索、缓存）(90 分钟)
4. **第 4 步**: 阅读 [架构概览 - 扩展点](./ARCHITECTURE-OVERVIEW.md#扩展点-extension-points) (20 分钟)
5. **第 5 步**: 实现自定义适配器或方言（可选）(120 分钟)
6. **第 6 步**: 阅读 [架构概览 - 安全架构](./ARCHITECTURE-OVERVIEW.md#安全架构-security-architecture) (20 分钟)
7. **第 7 步**: 实施安全最佳实践 (60 分钟)

**总时间**: 约 6-8 小时

---

## 文档版本对照 (Documentation Version Matrix)

| 文档 | 版本 | 适用产品版本 | 最后更新 |
|------|------|-------------|---------|
| README.md | 1.0.0 | v0.6.0+ | 2024-03 |
| INTEGRATION-GUIDE.md | 1.0.0 | v0.6.0+ | 2024-03 |
| API-REFERENCE.md | 1.0.0 | v0.6.0+ | 2024-03 |
| ARCHITECTURE-OVERVIEW.md | 1.0.0 | v0.6.0+ | 2024-03 |
| TROUBLESHOOTING.md | 1.0.0 | v0.6.0+ | 2024-03 |
| BLOCKING-ISSUES.md | 1.0.0 | v0.6.0+ | 2024-03 |

---

## 外部资源 (External Resources)

### 官方资源 (Official Resources)

- **GitHub 仓库**: https://github.com/medxaidev/fhir-persistence
- **npm 包**: https://www.npmjs.com/package/fhir-persistence
- **问题跟踪**: https://github.com/medxaidev/fhir-persistence/issues
- **变更日志**: [CHANGELOG.md](../CHANGELOG.md)
- **许可证**: [LICENSE](../LICENSE)

### FHIR 标准 (FHIR Standards)

- **FHIR R4 规范**: https://hl7.org/fhir/R4/
- **FHIR 搜索**: https://hl7.org/fhir/R4/search.html
- **FHIR 资源**: https://hl7.org/fhir/R4/resourcelist.html
- **SearchParameter**: https://hl7.org/fhir/R4/searchparameter.html

### 相关项目 (Related Projects)

- **fhir-definition**: FHIR 定义加载器
- **fhir-runtime**: FHIRPath 评估和验证
- **fhir-engine**: FHIR 系统编排器（即将推出）

### 数据库文档 (Database Documentation)

- **SQLite**: https://www.sqlite.org/docs.html
- **PostgreSQL**: https://www.postgresql.org/docs/
- **better-sqlite3**: https://github.com/WiseLibs/better-sqlite3
- **node-postgres**: https://node-postgres.com/

---

## 贡献指南 (Contributing)

### 文档贡献 (Documentation Contributions)

我们欢迎文档改进！如果您发现错误或有改进建议：

1. **报告问题**: 在 GitHub Issues 中创建问题
2. **提交 PR**: Fork 仓库，修改文档，提交 Pull Request
3. **讨论**: 在 Issues 或 Discussions 中讨论重大变更

### 文档标准 (Documentation Standards)

- 使用 Markdown 格式
- 中英文双语（中文优先）
- 包含代码示例
- 包含版本要求
- 保持简洁清晰

---

## 获取帮助 (Getting Help)

### 📧 联系方式 (Contact)

- **Email**: fangjun20208@gmail.com
- **GitHub Issues**: https://github.com/medxaidev/fhir-persistence/issues
- **GitHub Discussions**: https://github.com/medxaidev/fhir-persistence/discussions

### 🐛 报告问题 (Report Issues)

- **一般问题**: 在 GitHub Issues 中创建普通 Issue
- **阻塞性问题**: 使用 [BLOCKING-ISSUES.md](./BLOCKING-ISSUES.md) 模版
- **安全问题**: 发送邮件至 fangjun20208@gmail.com

### 💬 社区支持 (Community Support)

- **GitHub Discussions**: 提问、分享经验、讨论最佳实践
- **Stack Overflow**: 使用标签 `fhir-persistence`

---

## 更新日志 (Update Log)

### v1.0.0 (2024-03)

**新增文档**:
- ✅ README.md - 文档中心索引
- ✅ INTEGRATION-GUIDE.md - 完整接入指南
- ✅ API-REFERENCE.md - 完整 API 参考
- ✅ ARCHITECTURE-OVERVIEW.md - 架构概览
- ✅ TROUBLESHOOTING.md - 故障排除指南
- ✅ BLOCKING-ISSUES.md - 问题报告模版

**文档特性**:
- 中英文双语
- 完整版本要求
- 丰富的代码示例
- 详细的故障排除步骤
- 清晰的学习路径

---

## 反馈 (Feedback)

我们重视您的反馈！请通过以下方式告诉我们：

- 📝 **文档改进建议**: 在 GitHub Issues 中创建 `documentation` 标签的 Issue
- ⭐ **文档评分**: 在 README 底部留下您的评价
- 💡 **新文档请求**: 在 GitHub Discussions 中提出

---

## 许可证 (License)

本文档集采用 [MIT License](../LICENSE) 授权。

---

**感谢使用 fhir-persistence！**

**Thank you for using fhir-persistence!**

---

**文档版本历史 (Document Version History)**

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2024-03 | 初始版本，完整文档中心 |
