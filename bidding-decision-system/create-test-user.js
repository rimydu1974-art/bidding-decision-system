const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const prisma = new PrismaClient();
  
  const email = 'rimydu1974@qq.com';
  const password = '123456';
  const hashedPassword = hashPassword(password);

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('User already exists, updating password...');
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
  } else {
    await prisma.user.create({
      data: {
        email,
        name: '管理员',
        password: hashedPassword,
        role: 'admin',
        plan: 'pro',
      },
    });
  }

  console.log(`Test user created: ${email} / ${password}`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
