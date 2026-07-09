# OpenCheck 智标系统 - AI投标决策平台

> **基于AI的智能投标决策系统，帮助投标团队快速分析招标文件、识别废标风险、生成投标建议。**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D2D2D?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 项目简介

OpenCheck 智标系统是一个**AI驱动的投标决策平台**，专为招投标行业设计。通过AI技术，帮助投标团队在5分钟内完成招标文件分析，提取核心信息，识别废标风险，做出科学的Go/No-Go决策。

### 核心功能

| 功能 | 说明 |
|------|------|
| **AI速读** | 3分钟提取招标文件6大核心维度（预算、资质、时间、评分等） |
| **智能风控** | 18+废标规则自动检测，覆盖签章、密封、资质等硬性要求 |
| **老板决策** | 5分钟Go/No-Go判断，生成老板能看懂的决策报告 |
| **6大核心指标** | 预算、资质、时间节点、评分规则、废标条款、风险等级 |
| **PDF报告** | 一键生成专业分析报告，支持打印和分享 |
| **知识库** | 积累企业投标经验，建立标准化检查流程 |

### 适用场景

- 投标团队快速筛选项目
- 老板决策是否投入资源
- 风控人员审查标书合规性
- 新手投标员学习行业规范

## 技术栈

| 技术 | 用途 |
|------|------|
| **Next.js 16** | 全栈React框架 |
| **TypeScript** | 类型安全 |
| **Prisma ORM** | 数据库访问 |
| **Supabase** | PostgreSQL托管 |
| **Tailwind CSS** | UI样式 |
| **多AI模型** | DeepSeek / 通义千问 / 智谱 / 豆包 |
| **Vercel** | 部署平台 |

## 快速开始

### 环境要求

- Node.js 18+
- npm 8+
- PostgreSQL（或使用Supabase）

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/rimydu1974-art/bidding-decision-system.git
cd bidding-decision-system

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local 填入你的配置

# 4. 初始化数据库
npx prisma db push

# 5. 启动开发服务器
npm run dev
```

### 环境变量配置

```env
# 数据库
DATABASE_URL="postgresql://..."

# AI服务（选择一个）
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your-key

# 或使用其他AI服务商
# AI_PROVIDER=doubao
# DOUBAO_API_KEY=your-key
```

## 项目结构

```
bidding-decision-system/
├── src/
│   ├── app/                    # Next.js页面
│   │   ├── api/               # API路由
│   │   ├── admin/             # 管理后台
│   │   ├── thinktank/         # 招投标智库
│   │   └── tools/             # 在线工具
│   ├── components/            # React组件
│   │   ├── ui/                # 基础UI组件
│   │   ├── assessment/        # 评估展示组件
│   │   └── risk/              # 风险展示组件
│   ├── lib/                   # 工具库
│   │   ├── ai/                # AI服务集成
│   │   ├── rules/             # 规则引擎
│   │   └── parsers/           # 文档解析器
│   └── types/                 # TypeScript类型
├── prisma/                    # 数据库Schema
├── public/                    # 静态资源
└── scripts/                   # 工具脚本
```

## 在线体验

**https://www.opencheck.com.cn**

## 核心亮点

### 1. AI多模型支持

支持9种AI服务商，自动切换，保证可用性：

- DeepSeek（推荐，性价比高）
- 通义千问
- 智谱AI
- 豆包（字节跳动）
- Kimi（月之暗面）
- 零一万物
- 讯飞星火
- 腾讯混元
- MiniMax

### 2. 废标风控引擎

基于招投标法规和行业经验，构建了完整的废标风险检测规则库：

- **硬性废标**：签章、密封、资质等致命问题
- **软性风险**：条款模糊、时间紧张等潜在风险
- **围标串标**：电子指纹、价格异常等行为检测

### 3. 5D溯源

每个分析结果都标注来源位置，方便核对原文：

- 文件名
- 页码
- 段落位置
- 原文引用
- 置信度

## 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

## 相关链接

- **官网**：https://www.opencheck.com.cn
- **GitHub**：https://github.com/rimydu1974-art/bidding-decision-system
- **Gitee**：https://gitee.com/rimydu/bidding-decision-system

## 联系方式

- 项目主页：https://www.opencheck.com.cn
- Issues：https://github.com/rimydu1974-art/bidding-decision-system/issues

## 致谢

感谢所有为招投标行业数字化做出贡献的开发者和从业者。
