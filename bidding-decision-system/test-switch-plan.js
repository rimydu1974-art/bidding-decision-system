const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  // 查找管理员用户
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
  console.log('  用户名:', user.username);
  console.log('  邮箱:', user.email);
  console.log('  当前plan:', user.plan);
  console.log('  planExpiresAt:', user.planExpiresAt);
  console.log('  tempExpiresAt:', user.tempExpiresAt);
  console.log('  aiQuotaUsed:', user.aiQuotaUsed);

  // 切换到免费版测试
  const newPlan = 'free';
  const now = new Date();
  const tempExpires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天后过期

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: newPlan,
      planExpiresAt: null, // 清除专业版过期时间
      tempExpiresAt: tempExpires, // 设置临时权限（19元单次版测试）
      aiQuotaUsed: 0, // 重置额度
    },
  });

  console.log('\n已切换到免费版+临时权限（19元单次版模式）:');
  console.log('  plan: free');
  console.log('  tempExpiresAt:', tempExpires);
  console.log('  aiQuotaUsed: 0');
  console.log('\n现在可以测试19元单次版功能了！');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
