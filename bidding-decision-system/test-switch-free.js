const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      email: 'rimydu1974@qq.com',
    },
  });

  if (!user) {
    console.log('未找到用户');
    return;
  }

  console.log('当前用户信息:');
  console.log('  ID:', user.id);
  console.log('  当前plan:', user.plan);
  console.log('  tempExpiresAt:', user.tempExpiresAt);
  console.log('  aiQuotaUsed:', user.aiQuotaUsed);

  // 切换到纯免费版（无临时权限）
  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: 'free',
      planExpiresAt: null,
      tempExpiresAt: null, // 清除临时权限
      aiQuotaUsed: 0, // 重置额度，给20次免费额度
    },
  });

  console.log('\n已切换到纯免费版:');
  console.log('  plan: free');
  console.log('  tempExpiresAt: null');
  console.log('  aiQuotaUsed: 0');
  console.log('\n现在可以测试免费版功能了（每月20次额度）！');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
