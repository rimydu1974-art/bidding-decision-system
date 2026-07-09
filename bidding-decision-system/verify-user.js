const { PrismaClient } = require('@prisma/client');
async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({
    where: { email: 'rimydu1974@qq.com' },
    select: { id: true, email: true, name: true, role: true, plan: true }
  });
  console.log('User found:', JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
