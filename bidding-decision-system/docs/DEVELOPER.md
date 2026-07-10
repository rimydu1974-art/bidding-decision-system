# OpenCheck 开发者技术文档

---

## 1. 项目简介

OpenCheck 是一款基于 AI 的智能投标决策平台，帮助投标团队快速分析招标文件、识别废标风险、生成投标决策评估表。

### 核心功能

- **AI速读**：上传招标文件（PDF/Word），AI自动提取6大类关键信息
- **智能风控**：废标风险自动发现，合规性一键检测
- **老板总结**：一页纸决策摘要（是否参与、核心门槛、制胜策略）
- **偏离表**：招标要求 vs 投标响应对比
- **评分预测**：评分项拆解、得分预估
- **标书生成**：AI辅助生成投标文件
- **AI投标助手**：对话式投标咨询

---

## 2. 技术栈

| 层级 | 技术 | 说明 |
|---|---|---|
| **框架** | Next.js 16 (React 19) | App Router, Server Components, API Routes |
| **语言** | TypeScript 5 | 严格类型 |
| **数据库** | PostgreSQL (Supabase) | 托管 PostgreSQL |
| **ORM** | Prisma 5 | `prisma/schema.prisma` 定义数据模型 |
| **CSS** | Tailwind CSS 4 | 原子化 CSS |
| **认证** | JWT + bcryptjs | 自定义认证，NextAuth 辅助 |
| **AI** | 9家AI提供商 | DeepSeek、通义千问、智谱AI、豆包、Kimi、零一万物、讯飞星火、腾讯混元、MiniMax |
| **文档解析** | pdf-parse, mammoth, exceljs | PDF/Word/Excel 解析 |
| **PDF生成** | jsPDF + jspdf-autotable | 投标决策报告生成 |
| **图表** | Recharts | 数据可视化 |
| **集成** | 飞书、企业微信 | 通知推送、知识库同步 |
| **支付** | 微信支付、支付宝 | Mock模式默认，支持截图审核 |
| **部署** | Vercel | Serverless + Cron |

---

## 3. 环境要求

- **Node.js**：18.17+ (推荐 20+)
- **包管理**：npm
- **数据库**：PostgreSQL 14+（推荐 Supabase 托管）
- **AI API Key**：至少配置一家AI提供商的 API Key

---

## 4. 快速开始

```bash
# 1. 克隆仓库
git clone <repo-url>
cd bidding-decision-system

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local，填入必要的环境变量

# 4. 初始化数据库
npx prisma db push
npx prisma generate

# 5. 启动开发服务器
npm run dev
```

访问 `http://localhost:3000`

### 必需的环境变量

```env
# 数据库
DATABASE_URL=postgresql://user:password@host:5432/dbname

# AI提供商（至少配置一个）
DOUBAO_API_KEY=your-doubao-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
ZHIPU_API_KEY=your-zhipu-api-key
TONGYI_API_KEY=your-tongyi-api-key
KIMI_API_KEY=your-kimi-api-key

# 认证
SESSION_SECRET=your-random-secret-string
JWT_SECRET=your-jwt-secret-string

# 应用
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

完整环境变量列表见 `.env.local.example`。

---

## 5. 项目结构

```
bidding-decision-system/
├── prisma/
│   └── schema.prisma          # 数据库模型定义（20+模型）
├── public/                    # 静态资源
├── scripts/                   # 开发/管理脚本
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API 路由（62个接口）
│   │   ├── admin/             # 管理后台页面
│   │   ├── thinktank/         # 智库（公开知识库）
│   │   ├── tools/             # 在线工具（标书生成/废标检查/评分计算/资质核对）
│   │   ├── pricing/           # 定价页面
│   │   ├── payment/           # 支付页面
│   │   ├── projects/          # 项目列表
│   │   ├── project/[id]/      # 项目详情与评估
│   │   ├── knowledge/         # 用户知识库
│   │   ├── materials/         # 企业素材库
│   │   ├── ai-chat/           # AI助手对话
│   │   ├── ai-write/          # AI标书生成
│   │   ├── scoring/           # 评分拆解分析
│   │   ├── user-center/       # 用户中心
│   │   ├── login/register/    # 认证页面
│   │   └── workspace/         # 工作台
│   ├── components/            # React 组件
│   │   ├── ui/                # 基础UI组件
│   │   ├── assessment/        # 评估展示组件
│   │   ├── risk/              # 风险展示组件
│   │   ├── popup/             # 弹窗/引导组件
│   │   └── upload/            # 文件上传组件
│   ├── lib/                   # 核心业务逻辑
│   │   ├── ai/                # AI集成（call-ai.ts, prompts/, providers/）
│   │   ├── rules/             # 规则引擎（44条规则）
│   │   ├── rule-extractors/   # 领域规则提取器
│   │   ├── parsers/           # 文件解析器
│   │   ├── auth/              # 认证逻辑
│   │   ├── db/                # Prisma客户端
│   │   ├── pricing.ts         # 定价套餐定义
│   │   ├── quota.ts           # 额度管理逻辑
│   │   ├── payment.ts         # 支付服务
│   │   └── progressive-nudge.ts # 渐进式升级引导
│   ├── types/                 # TypeScript 类型定义
│   └── middleware.ts          # Next.js 中间件（认证守卫）
├── uploads/                   # 用户上传文件
├── wechat-bot/                # 企微机器人
├── init-db.sql                # 原始SQL建表语句
├── vercel.json                # Vercel部署配置
├── next.config.ts
├── package.json
└── .env.local.example         # 环境变量模板
```

### 关键目录说明

| 目录 | 说明 |
|---|---|
| `src/lib/ai/` | AI调用封装，统一9家AI提供商接口 |
| `src/lib/rules/` | 规则引擎，44条废标/风险规则 |
| `src/lib/pricing.ts` | 定价套餐定义（单一来源） |
| `src/lib/quota.ts` | 额度检查、重置、导出权限控制 |
| `src/app/api/` | 62个API路由 |
| `src/components/assessment/` | 评估结果展示组件 |

---

## 6. API接口文档

### 6.1 认证接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | 手机号注册 |
| POST | `/api/auth/login` | 密码登录 |
| POST | `/api/auth/sms` | 发送短信验证码 |
| POST | `/api/auth/sms-login` | 短信验证码登录 |
| POST | `/api/auth/logout` | 退出登录 |
| GET | `/api/auth/me` | 获取当前用户信息 |
| POST | `/api/auth/forgot-password` | 忘记密码 |
| POST | `/api/auth/reset-password` | 重置密码 |

### 6.2 核心业务接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/analyze` | 上传招标文件并触发AI分析 |
| GET | `/api/assessments/[id]` | 获取评估结果 |
| POST | `/api/scoring` | 评分拆解分析 |
| POST | `/api/ai-chat` | AI投标助手对话 |
| POST | `/api/ai-write` | AI标书生成 |

### 6.3 导出接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/report` | 导出Excel投标决策评估表 |
| POST | `/api/report/pdf` | 导出PDF投标决策报告 |

**导出权限**：

- 免费用户：可导出（老板总结预览版）
- 单次版¥19：7天内可导出（完整版）
- 专业版/企业版：始终可导出（完整版）

### 6.4 支付接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/payment` | 创建支付订单 |
| POST | `/api/payment/submit` | 提交支付 |
| POST | `/api/payment/callback` | 支付回调（微信） |
| POST | `/api/payment/notify` | 支付通知（支付宝） |
| POST | `/api/payment/screenshot` | 截图上传审核 |

### 6.5 用户接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/user/quota` | 获取用户额度信息 |
| POST | `/api/user/api-key` | 配置/验证API Key |
| GET | `/api/projects` | 获取项目列表 |
| GET | `/api/knowledge` | 获取知识库列表 |
| POST | `/api/knowledge/upload` | 上传知识库文件 |

### 6.6 管理后台接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/dashboard` | 管理后台仪表盘 |
| GET | `/api/admin/users` | 用户管理 |
| GET | `/api/admin/orders` | 订单管理 |
| POST | `/api/admin/orders/review` | 审核订单 |
| GET | `/api/admin/ai-cost` | AI成本统计 |
| GET | `/api/admin/behavior` | 用户行为数据 |
| GET | `/api/admin/analytics` | 数据分析 |
| GET | `/api/admin/rules` | 规则管理 |
| GET | `/api/admin/settings` | 系统设置 |

### 6.7 定时任务

| 路径 | 说明 |
|---|---|
| `/api/cron/reminders` | 定时提醒（每日9:00） |
| `/api/cron/cleanup` | 定时清理过期数据 |

---

## 7. 数据库设计

### 7.1 核心模型（20+）

| 模型 | 说明 |
|---|---|
| `User` | 用户：认证、套餐、额度、API Key、飞书集成、统计 |
| `Session` | JWT会话Token |
| `Assessment` | 评估结果：6大类AI分析结果、深度诊断 |
| `KnowledgeItem` | 用户知识库条目 |
| `Project` | 投标项目 |
| `PricingPlan` | 可配置的定价套餐 |
| `Order` | 支付订单 |
| `ProjectUnlock` | 单次解锁记录（唯一：用户+项目） |
| `PasswordReset` | 密码重置Token |
| `AIUsage` | AI调用成本监控（tokens、费用） |
| `UserBehavior` | 用户行为漏斗追踪 |
| `FileHash` | 文件去重（SHA256） |
| `UserFeedback` | 用户流失/退出反馈 |
| `SystemSetting` | 系统配置（KV存储） |
| `RuleConfig` | 分析规则定义（关键词、模式） |
| `ExtractionLog` | 规则 vs AI结果对比（幻觉检测） |
| `PaymentOrder` | 支付订单（截图审核流程） |
| `AdminNotification` | 管理后台通知 |

### 7.2 6层数据资产架构

| 层级 | 模型 | 说明 | 访问权限 |
|---|---|---|---|
| L1 | `Material` | 企业素材 | 用户私有 |
| L2 | `IndustryRule` | 行业规则库 | 闭源 |
| L3 | `ScoringRule` | 评分规则库 | 闭源 |
| L4 | `WasteRule` | 废标规则库 | 闭源 |
| L5 | `Case` + `CaseSubmission` | 案例中心 | 平台+匿名 |
| L6 | `ThinkTankArticle` + `Regulation` | 智库 | 公开 |

### 7.3 关键关系

```
User 1:N Project
User 1:N Assessment
User 1:N KnowledgeItem
User 1:N Order
Project 1:1 ProjectUnlock
User 1:1 Material (企业素材)
```

---

## 8. 部署指南

### 8.1 Vercel部署

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量（参考 `.env.local.example`）
4. 部署

`vercel.json` 配置：

```json
{
  "functions": {
    "src/app/api/analyze/route.ts": { "maxDuration": 60 },
    "src/app/api/report/pdf/route.ts": { "maxDuration": 30 },
    "src/app/api/report/route.ts": { "maxDuration": 30 }
  },
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### 8.2 数据库

推荐使用 Supabase 托管 PostgreSQL：

1. 创建 Supabase 项目
2. 获取数据库连接串
3. 设置 `DATABASE_URL` 环境变量
4. 运行 `npx prisma db push` 初始化表结构

### 8.3 AI提供商配置

至少配置一家AI提供商的 API Key：

| 提供商 | 环境变量 | 获取地址 |
|---|---|---|
| 豆包 | `DOUBAO_API_KEY` | console.volcengine.com |
| DeepSeek | `DEEPSEEK_API_KEY` | platform.deepseek.com |
| 通义千问 | `TONGYI_API_KEY` | dashscope.aliyun.com |
| 智谱AI | `ZHIPU_API_KEY` | open.bigmodel.cn |
| Kimi | `KIMI_API_KEY` | platform.moonshot.cn |

### 8.4 支付配置

默认使用 Mock 模式（截图审核）。生产环境配置：

```env
WECHAT_APP_ID=your-wechat-app-id
WECHAT_MCH_ID=your-wechat-mch-id
WECHAT_API_KEY=your-wechat-api-key
ALIPAY_APP_ID=your-alipay-app-id
```

---

## 9. 开发规范

### 9.1 代码风格

- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 样式使用 Tailwind CSS
- API 路由使用 Next.js App Router 约定

### 9.2 命名规范

| 类型 | 规范 | 示例 |
|---|---|---|
| 组件 | PascalCase | `BossSummary` |
| 文件 | kebab-case | `boss-summary.tsx` |
| API路由 | kebab-case | `/api/auth/login` |
| 变量/函数 | camelCase | `checkAiQuota` |
| 类型 | PascalCase | `QuotaCheckResult` |
| 常量 | UPPER_SNAKE_CASE | `FREE_MONTHLY_QUOTA` |

### 9.3 安全规范

- **永远不要**在代码中硬编码密钥、密码
- **永远不要**将 `.env.local` 提交到 Git
- 环境变量全部使用占位符脱敏
- API Key 等敏感信息仅在服务端使用
- 用户密码必须使用 bcrypt 加密存储

### 9.4 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式（不影响逻辑）
refactor: 重构
test: 测试
chore: 构建/工具变更
```

---

**OpenCheck 开发者文档 v1.0 · 2025年7月**
