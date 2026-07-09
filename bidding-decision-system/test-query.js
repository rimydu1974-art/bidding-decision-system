const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$queryRaw`SELECT 1 as test`.then(r => {
  console.log('Query OK:', JSON.stringify(r));
  return p.$disconnect();
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
