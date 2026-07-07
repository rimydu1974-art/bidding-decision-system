const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const regs = await prisma.regulation.findMany({
    where: {
      sourceFile: { contains: '财政部' }
    }
  });
  
  let deleted = 0;
  for (const reg of regs) {
    if (reg.content.length < 100) {
      await prisma.regulation.delete({ where: { id: reg.id } });
      console.log(`Deleted: ${reg.title} (${reg.content.length} chars)`);
      deleted++;
    } else {
      console.log(`Kept: ${reg.title} (${reg.content.length} chars)`);
    }
  }
  
  console.log(`\nDeleted ${deleted} short-content regulations`);
  await prisma.$disconnect();
}

main().catch(console.error);
