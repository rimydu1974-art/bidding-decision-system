const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findFirst({ where: { email: 'rimydu1974@qq.com' } });
  console.log('用户状态:');
  console.log('  plan:', user.plan);
  console.log('  tempExpiresAt:', user.tempExpiresAt);
  console.log('  aiQuotaUsed:', user.aiQuotaUsed);
  console.log('  userApiKey:', user.userApiKey ? '已配置' : '未配置');
  console.log('  apiKeyVerified:', user.apiKeyVerified);
  await prisma.$disconnect();
}

check();
