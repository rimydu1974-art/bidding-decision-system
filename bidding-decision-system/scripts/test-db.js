const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✓ 数据库连接成功');
    
    // 测试查询
    const count = await prisma.industryRule.count();
    console.log(`✓ IndustryRule 表当前有 ${count} 条记录`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('✗ 数据库连接失败:', error.message);
  }
}

testConnection();
