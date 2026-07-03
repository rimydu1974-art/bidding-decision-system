# Bid AI - 投标决策与标书生成平台

AI驱动的投标决策与标书生成SaaS平台，帮助投标团队快速分析招标文件、评估风险、生成专业标书。

## 🏗️ 项目架构

本项目采用 **Monorepo** 架构，分为开源核心和闭源企业版：

```
bidding-decision-system/
├── packages/
│   ├── core/                    # 🟢 开源 (MIT License)
│   │   ├── src/
│   │   │   ├── components/ui/   # UI组件
│   │   │   ├── lib/parsers/     # 文档解析器
│   │   │   ├── lib/utils/       # 工具函数
│   │   │   └── types/           # 类型定义
│   │   ├── LICENSE              # MIT许可证
│   │   └── README.md
│   │
│   └── saas/                    # 🔴 闭源 (Proprietary)
│       ├── src/
│       │   ├── lib/ai/          # AI业务逻辑
│       │   ├── lib/auth/        # 认证模块
│       │   ├── lib/feishu/      # 飞书集成
│       │   └── lib/payment/     # 支付模块
│       ├── LICENSE              # 商业许可证
│       └── README.md
│
├── src/                         # Next.js应用
├── prisma/                      # 数据库Schema
├── turbo.json                   # Turborepo配置
└── package.json                 # 工作区配置
```

## 🟢 开源模块 (@bid-ai/core)

**MIT License** - 自由使用、修改、分发

### 包含内容

| 模块 | 说明 |
|------|------|
| **UI组件** | GlassCard, ScoreGauge, RiskBadge |
| **文档解析** | PDF/Word/Excel解析，表格提取 |
| **工具函数** | 日期格式化、货币格式化、风险等级 |
| **类型定义** | 完整的TypeScript类型 |

### 安装使用

```bash
npm install @bid-ai/core
```

```tsx
import { GlassCard, ScoreGauge, parseFile } from '@bid-ai/core';
```

## 🔴 闭源模块 (@bid-ai/saas)

**UNLICENSED** - 商业软件，禁止复制、分发、逆向工程

### 包含内容

| 模块 | 说明 |
|------|------|
| **认证模块** | 用户注册、登录、JWT令牌、密码管理 |
| **支付模块** | 支付处理、订单管理、退款处理 |
| **AI业务逻辑** | 投标分析提示词、多厂商集成、响应解析 |
| **飞书集成** | 业务流程自动化、通知路由、审批对接 |
| **配额管理** | 使用追踪、速率限制、套餐管理 |

### 商业授权

如需商业使用、部署或分发，请联系：

- 邮箱：[your-email@example.com]
- 网站：[your-website.com]

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 8+
- PostgreSQL (可选)

### 安装

```bash
# 克隆仓库
git clone https://github.com/rimydu1974-art/bidding-decision-system.git
cd bidding-decision-system

# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local 填入你的配置

# 启动开发服务器
npm run dev
```

### 环境变量

```env
# 数据库
DATABASE_URL="postgresql://..."

# AI服务 (选择一个)
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your-key

# 飞书 (可选)
FEISHU_APP_ID=your-app-id
FEISHU_APP_SECRET=your-secret
```

## 📦 Turborepo 命令

```bash
# 构建所有包
npm run turbo:build

# 代码检查
npm run turbo:lint

# 清理构建产物
npm run clean
```

## 🎨 设计系统

基于暗色玻璃拟态设计：

- **主背景**: #0A0A12
- **玻璃效果**: backdrop-blur + 半透明背景
- **渐变色**: #7C3AED → #06B6D4
- **组件**: GlassCard, ScoreGauge, RiskBadge

## 📄 文档

- [开源核心文档](packages/core/README.md)
- [闭源企业版文档](packages/saas/README.md)
- [API文档](http://localhost:3000/api-docs)

## 🤝 贡献

欢迎贡献开源核心模块！请阅读：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📝 许可证

- **开源核心**: [MIT License](packages/core/LICENSE)
- **企业版**: [Proprietary](packages/saas/LICENSE)

## 🔗 相关链接

- [GitHub Repository](https://github.com/rimydu1974-art/bidding-decision-system)
- [Gitee Repository](https://gitee.com/rimydu/bidding-decision-system)
- [Demo](https://your-demo-url.com)

## 📞 联系方式

- 项目主页：[your-website.com]
- 技术支持：[support@your-domain.com]
- 商务合作：[business@your-domain.com]
