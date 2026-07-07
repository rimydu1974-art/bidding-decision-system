const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Fix test user name
  await prisma.user.update({
    where: { email: 'test@test.com' },
    data: { name: '测试用户' }
  });
  
  // Fix admin names
  await prisma.user.update({
    where: { email: 'rimydu1974@qq.com' },
    data: { name: '管理员1' }
  });
  
  await prisma.user.update({
    where: { email: 'rimydu1974@gmail.com' },
    data: { name: '管理员2' }
  });
  
  await prisma.user.update({
    where: { email: 'rimydu1974@live.cn' },
    data: { name: '管理员3' }
  });
  
  await prisma.user.update({
    where: { email: '1721042202@qq.com' },
    data: { name: '管理员4' }
  });
  
  console.log('All user names fixed');
  await prisma.$disconnect();
}

main().catch(console.error);
