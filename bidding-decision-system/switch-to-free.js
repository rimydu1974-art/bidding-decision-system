const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const r = await p.user.updateMany({
    where: { email: 'rimydu1974@qq.com' },
    data: {
      plan: 'free',
      tempExpiresAt: null,
      aiQuotaUsed: 0,
      aiQuotaResetAt: new Date(),
    },
  });
  console.log('Updated:', r.count, 'user(s) to free mode');
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
