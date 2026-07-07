const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const email = process.argv[2] || 'rimydu1974@gmail.com';
  const password = process.argv[3] || 'Admin123456';
  
  const hashedPassword = hashPassword(password);
  
  const result = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
    select: { id: true, email: true, name: true }
  });
  
  console.log(`Password updated for: ${result.email} (${result.name})`);
  await prisma.$disconnect();
}

main().catch(console.error);
