# OPENCHECK 智标系统 - 开发总结与PRD

## 文档信息
- 版本：v1.0
- 日期：2026年6月27日
- 状态：第一阶段完成

---

# 第一部分：一个月开发总结

## 一、系统架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                    OPENCHECK 智标系统                         │
├─────────────────────────────────────────────────────────────┤
│  前端层 (Frontend)                                           │
│  ├── Next.js 16 + React 19 + Tailwind CSS 4                 │
│  ├── 25个页面路由                                            │
│  └── 27个UI组件                                             │
├─────────────────────────────────────────────────────────────┤
│  中枢层 (Core Engine)                                        │
│  ├── 三引擎架构：决策引擎/评分引擎/风险引擎                    │
│  ├── 规则库v2：44条规则（10个分类）                           │
│  └── AI分析管道：9个AI供应商支持                              │
├─────────────────────────────────────────────────────────────┤
│  后台层 (Admin)                                              │
│  ├── 11个管理页面                                            │
│  ├── 38个API路由                                            │
│  └── 14个数据库模型                                          │
└─────────────────────────────────────────────────────────────┘
```

## 二、开源 vs 闭源 分类

### 开源部分 (packages/core)
| 模块 | 文件 | 说明 |
|------|------|------|
| 决策引擎 | engines/decision-engine.ts | 投标决策A/B/C/D等级评定 |
| 评分引擎 | engines/score-engine.ts | 评分规则分析、得分计算 |
| 风险引擎 | engines/risk-engine.ts | 废标/评分/时间风险分析 |
| UI组件 | glass-card, score-gauge, risk-badge | 基础UI组件 |
| 文件解析器 | parsers/index.ts | PDF/Word/Excel解析 |
| 工具函数 | utils/index.ts | 通用工具函数 |
| 类型定义 | types/index.ts | 所有TypeScript类型 |

### 闭源部分 (packages/saas + src/)
| 模块 | 说明 | 商业价值 |
|------|------|---------|
| AI分析管道 | 9个AI供应商、提示词工程 | 核心竞争力 |
| 规则库v2 | 44条规则、阈值配置 | 领域知识 |
| 用户系统 | 认证、授权、额度管理 | 变现基础 |
| 支付系统 | 微信/支付宝、订单管理 | 收入来源 |
| 管理后台 | 用户/订单/数据/规则管理 | 运营能力 |
| 知识库 | 行业知识、招标文件库 | 数据壁垒 |
| 飞书集成 | 通知、知识库同步 | 企业客户 |

## 三、功能模块清单

### 前端功能 (25个页面)
| 页面 | 路由 | 功能 |
|------|------|------|
| 首页 | / | 系统入口、历史记录、统计概览 |
| 项目列表 | /projects | 管理所有投标项目 |
| 项目详情 | /project/[id] | 评估结果展示（6大类+深度诊断） |
| 评分拆解 | /scoring | 评分规则分析 |
| 知识库 | /knowledge | 行业知识管理 |
| AI对话 | /ai-chat | 智能问答助手 |
| AI写作 | /ai-write | 标书内容生成 |
| 定价页 | /pricing | 套餐展示与购买 |
| 支付页 | /payment | 支付流程 |
| 用户中心 | /user-center | 个人信息管理 |
| API文档 | /api-docs | 接口文档 |

### 后台功能 (11个管理页面)
| 页面 | 路由 | 功能 |
|------|------|------|
| 仪表盘 | /admin | 运营数据概览 |
| 用户管理 | /admin/users | 用户列表、状态管理 |
| 订单管理 | /admin/orders | 订单查询、状态跟踪 |
| AI成本 | /admin/ai-cost | AI调用成本监控 |
| 行为漏斗 | /admin/behavior | 用户行为分析 |
| 行业统计 | /admin/analytics | 行业数据统计 |
| 用户反馈 | /admin/feedback | 反馈收集与处理 |
| 数据导出 | /admin/export | 用户/订单/AI数据导出 |
| 高价值客户 | /admin/customers | VIP客户管理 |
| 规则管理 | /admin/rules | 分析规则CRUD |
| 系统配置 | /admin/settings | 系统参数配置 |

### AI分析能力 (7大类)
| 类别 | 免费版 | 19元版 | 99元版 |
|------|--------|--------|--------|
| 第1类：基本信息 | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| 第2类：财务信息 | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| 第3类：资质要求 | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| 第4类：评分规则 | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| 第5类：时间要求 | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| 第6类：项目需求 | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| 第7类：电话问题 | ✅ 计数 | ✅ 完整 | ✅ 完整 |

### 深度诊断功能
| 功能 | 免费版 | 19元版 | 99元版 |
|------|--------|--------|--------|
| 老板总结 | 有计数 | ✅ 完整 | ✅ 完整 |
| 废标风险 | 有计数 | ✅ 完整 | ✅ 完整 |
| 评分关键项 | 有计数 | ✅ 完整 | ✅ 完整 |
| 容易失分项 | 有计数 | ✅ 完整 | ✅ 完整 |
| 电话咨询问题 | 有计数 | ✅ 完整 | ✅ 完整 |
| 投标策略建议 | 锁定 | ✅ 条件化 | ✅ 完整 |
| 准备分工项目包 | 锁定 | ✅ 完整 | ✅ 完整 |
| 服务期限偏离 | 无 | 仅招标文件 | ✅ 招标+投标 |

### 导出功能
| 功能 | 免费版 | 19元版 | 99元版 |
|------|--------|--------|--------|
| Excel导出 | ✅ | ✅ | ✅ |
| PDF导出 | ✅ | ✅ | ✅ |

## 四、收费分层详细说明

### 免费版 (0元/月)
- **额度**：每月20次AI分析
- **可见内容**：
  - 6大类基本信息（完整可见）
  - 老板总结（仅显示：项目名称、预算、资质状态、风险点数、准备包数、问题数）
  - 深度诊断（仅显示：各类别计数）
- **不可见内容**：
  - 废标风险详情
  - 评分关键项详情
  - 容易失分项详情
  - 电话咨询问题详情
  - 投标策略建议
  - 准备分工项目包详情
- **导出**：支持Excel/PDF（不含付费内容）

### 19元单次版
- **额度**：单次购买，不限次数（当月有效）
- **解锁内容**：
  - 老板总结完整版（结论+关键提醒+准备重点）
  - 废标风险（每条含来源、页码、风险等级、建议）
  - 评分关键项（每条含关键点、来源、页码）
  - 容易失分项（每条含风险说明、来源、页码）
  - 电话咨询问题（每条含原因、优先级）
  - 投标策略建议（条件化：有资料给结论，无资料给条件建议）
  - 准备分工项目包（6大类47项+页码定位）
  - 服务期限偏离（仅分析招标文件）
- **限制**：
  - 服务期限偏离只分析招标文件，不分析投标文件

### 99元专业版
- **额度**：月付，不限项目
- **解锁内容**：
  - 19元版全部内容
  - 服务期限偏离（分析招标+投标文件）
  - 不限项目深度分析
  - 不限标书生成
  - 不限评分拆解
  - API接口
  - 优先客服
  - 企业知识库

## 五、技术架构详情

### 数据库模型 (14个)
```
User → Session → Assessment → Project
                → KnowledgeItem
                → Order → PricingPlan
                → ProjectUnlock
                → AIUsage
                → UserBehavior
                → FileHash
                → UserFeedback
                → SystemSetting
                → ProjectIndustry
```

### API路由 (38个)
- 认证相关：8个（登录/注册/短信/密码重置）
- 核心业务：6个（分析/评分/AI对话/AI写作/报告）
- 资源管理：4个（项目/知识库/历史）
- 用户相关：2个（额度/API Key）
- 支付相关：4个（支付/回调/定价）
- 通知集成：3个（通知/飞书）
- 管理员：11个（仪表盘/用户/订单/数据/配置）

### 规则库v2 (44条)
| 分类 | 数量 | 说明 |
|------|------|------|
| 硬排斥规则 | 6条 | 废标条件（无效/否决/不通过） |
| 软排斥规则 | 6条 | 扣分风险 |
| 围标信号 | 5条 | 异常行为检测 |
| 数值红线 | 10条 | 保证金/报价/比例阈值 |
| 中标无效 | 3条 | 法律风险 |
| 电子标书指纹 | 5条 | 技术雷同检测 |
| 报价异常 | 3条 | 不平衡报价 |
| 围标边界 | 2条 | 围标关键区分 |
| 前置过滤器 | 2条 | 预处理规则 |
| 异议投诉时效 | 2条 | 时间节点 |

---

# 第二部分：测试指南

## 一、本地开发环境启动

### 步骤1：安装依赖
```bash
cd C:\Users\ips\Desktop\测试AI员工能力\重做投标网站\bidding-decision-system
npm install
```

### 步骤2：配置环境变量
```bash
# 复制环境变量模板
copy .env.local.example .env.local

# 编辑 .env.local 填入：
# - AI API Key（DeepSeek/通义千问等）
# - 数据库路径（默认SQLite）
# - JWT密钥
```

### 步骤3：初始化数据库
```bash
npx prisma generate
npx prisma db push
```

### 步骤4：启动开发服务器
```bash
npm run dev
```

### 步骤5：访问系统
- 前台：http://localhost:3000
- 后台：http://localhost:3000/admin
- API文档：http://localhost:3000/api-docs

## 二、测试流程

### 测试1：用户注册与登录
1. 访问 /register 注册账号
2. 访问 /login 登录
3. 检查用户中心 /user-center

### 测试2：免费版AI分析
1. 登录后访问 /projects
2. 点击"上传招标文件"
3. 上传PDF/Word/Excel文件（<10MB）
4. 等待AI分析完成
5. 查看评估结果（6大类信息）
6. 检查老板总结（仅计数）
7. 检查深度诊断（仅计数）

### 测试3：付费解锁
1. 访问 /pricing 查看套餐
2. 选择19元单次版
3. 完成支付（测试环境可模拟）
4. 重新查看评估结果
5. 检查老板总结（完整版）
6. 检查深度诊断（每条有实际内容）

### 测试4：导出功能
1. 在评估详情页点击"导出PDF"
2. 检查PDF内容（色块分区+关键点加粗）
3. 点击"导出Excel"
4. 检查Excel内容（7大类+风险清单+投标建议）

### 测试5：管理后台
1. 访问 /admin（需要管理员权限）
2. 查看仪表盘数据
3. 测试用户管理
4. 测试规则管理

## 三、测试数据准备

### 测试文件
- 准备1-2个招标文件（PDF格式，<10MB）
- 可从政府采购网下载真实招标文件

### 测试账号
- 免费用户：直接注册
- 付费用户：需要配置支付回调

---

# 第三部分：下一阶段升级指南

## 一、优先级排序

### P0 - 立即需要（1-2周）
1. **安装jspdf依赖**（解决workspace协议问题）
2. **PDF导出完善**（确保PDF正常生成）
3. **端到端测试**（完整业务流程验证）

### P1 - 短期需要（2-4周）
1. **数据库迁移到PostgreSQL**（当前SQLite不适合生产）
2. **AI分析管道优化**（提高分析准确率）
3. **支付回调完善**（微信/支付宝真实回调）

### P2 - 中期需要（1-2月）
1. **三引擎集成**（将Decision/Score/Risk Engine接入分析管道）
2. **规则库动态化**（从数据库加载规则，支持热更新）
3. **知识库建设**（行业知识、招标文件库）

### P3 - 长期需要（3-6月）
1. **packages分离完善**（core/saas真正独立）
2. **企业版功能**（飞书/钉钉集成、团队权限）
3. **API开放平台**（第三方接入）

## 二、具体升级任务

### 任务1：数据库升级
```bash
# 当前：SQLite（开发用）
# 目标：PostgreSQL（生产用）

# 步骤：
1. 安装PostgreSQL
2. 修改 prisma/schema.prisma 的datasource
3. 执行 prisma db push
4. 配置环境变量 DATABASE_URL
```

### 任务2：三引擎集成
```typescript
// 当前：引擎独立存在
// 目标：接入AI分析管道

// 在 src/app/api/analyze/route.ts 中集成：
import { DecisionEngine, ScoreEngine, RiskEngine } from '@bid-ai/core';

// AI分析完成后调用：
const decision = DecisionEngine.analyze({
  projectName: assessment.projectName,
  budget: assessment.budget,
  riskLevel: assessment.riskLevel,
  qualificationStatus: 'met',
  objectiveScore: assessment.scoringRules.objectiveScore,
  subjectiveScore: assessment.scoringRules.subjectiveScore,
});

const scoring = ScoreEngine.analyze(assessment.scoringRules);
const risk = RiskEngine.analyze(assessment);
```

### 任务3：规则库动态化
```typescript
// 当前：规则硬编码在 definitions/ 目录
// 目标：从数据库加载，支持管理后台CRUD

// 1. 在数据库中创建 Rule 模型
model Rule {
  id          String   @id @default(cuid())
  name        String
  category    String
  description String
  enabled     Boolean  @default(true)
  priority    String
  conditions  String
  action      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 2. 修改 rules/engine.ts 从数据库加载
```

### 任务4：PDF导出修复
```bash
# 当前：jspdf未安装（workspace协议问题）
# 解决方案：

# 方案A：手动安装
npm install jspdf jspdf-autotable --save --legacy-peer-deps

# 方案B：使用其他库
npm install pdf-lib --save
```

### 任务5：监控与日志
```typescript
// 添加系统监控
// 1. AI调用日志
// 2. 用户行为追踪
// 3. 错误日志收集
// 4. 性能监控
```

## 三、升级检查清单

### 上线前必做
- [ ] 数据库迁移到PostgreSQL
- [ ] 配置HTTPS
- [ ] 配置域名
- [ ] 配置支付回调URL
- [ ] 配置短信服务
- [ ] 配置AI API Key
- [ ] 测试完整业务流程
- [ ] 压力测试

### 功能完善
- [ ] jspdf安装与PDF导出测试
- [ ] 三引擎集成到分析管道
- [ ] 规则库动态化
- [ ] 知识库数据填充
- [ ] 飞书集成配置

### 运营准备
- [ ] 定价策略确认
- [ ] 支付渠道申请
- [ ] 客服体系搭建
- [ ] 用户手册编写
- [ ] 推广素材准备

---

# 第四部分：文件清单

## 核心文件
```
src/
├── app/page.tsx                    # 首页
├── app/projects/page.tsx           # 项目列表
├── app/project/[id]/page.tsx       # 项目详情
├── app/pricing/page.tsx            # 定价页
├── app/admin/                      # 管理后台
├── app/api/                        # API路由
├── components/assessment/          # 评估组件
├── components/risk/                # 风险组件
├── lib/ai/prompts/                 # AI提示词
├── lib/rules/                      # 规则库
├── lib/pricing.ts                  # 定价配置
├── types/index.ts                  # 类型定义
packages/core/src/engines/          # 三引擎
```

## 配置文件
```
prisma/schema.prisma                # 数据库Schema
package.json                        # 依赖配置
next.config.ts                      # Next.js配置
tsconfig.json                       # TypeScript配置
.env.local                          # 环境变量
```

---

**文档结束**
