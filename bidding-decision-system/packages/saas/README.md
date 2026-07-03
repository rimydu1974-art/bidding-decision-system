# @bid-ai/saas

Proprietary enterprise features for the Bid AI platform.

## WARNING

This software is **UNLICENSED and PROPRIETARY**. 

Do not copy, distribute, or reverse engineer this software.

## Features

- **Authentication**: User registration, login, JWT tokens
- **Payment**: Payment processing, order management
- **AI Business Logic**: Tender analysis prompts, provider integration
- **Feishu Integration**: Business workflow automation
- **Quota Management**: Usage tracking, rate limiting

## Requirements

- Node.js 18+
- PostgreSQL database
- Redis (for rate limiting in production)

## Environment Variables

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
DEEPSEEK_API_KEY=your-api-key
FEISHU_APP_ID=your-app-id
```

## Development

This package is part of a Turborepo monorepo. Run from the root:

```bash
# Install dependencies
npm install

# Run development
npm run dev

# Build packages
npm run turbo:build
```

## License

UNLICENSED - Proprietary Software. See [LICENSE](./LICENSE).

## Commercial Use

For commercial use, deployment, or distribution, contact:

- Email: [your-email@example.com]
- Website: [your-website.com]
