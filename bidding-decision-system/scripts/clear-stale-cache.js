// Clear stale file hash cache and re-analyze old files
// Usage: node scripts/clear-stale-cache.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing stale file hash cache...');
  
  // Delete all file hash entries to force re-analysis on next upload
  const hashResult = await prisma.fileHash.deleteMany({});
  console.log(`Deleted ${hashResult.count} file hash cache entries`);

  // Delete assessments with empty project names (symptom of broken pipeline)
  const badResult = await prisma.assessment.deleteMany({
    where: {
      projectName: '',
    },
  });
  console.log(`Deleted ${badResult.count} assessments with empty project names`);

  console.log('Done. Users will trigger fresh analysis on next file upload.');
}

main()
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
