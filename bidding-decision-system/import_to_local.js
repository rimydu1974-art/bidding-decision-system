const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Use local SQLite for testing
process.env.DATABASE_URL = 'file:./dev.db';

const prisma = new PrismaClient();

function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

async function main() {
  console.log('========================================');
  console.log('OpenCheck Data Import (Local SQLite)');
  console.log('========================================\n');

  // 1. Load import data
  console.log('[1/5] Loading import data...');
  const importDataPath = path.join(__dirname, 'import_data.json');
  
  if (!fs.existsSync(importDataPath)) {
    console.error('Error: import_data.json not found!');
    process.exit(1);
  }
  
  const importData = JSON.parse(fs.readFileSync(importDataPath, 'utf-8'));
  console.log(`  Loaded: ${importData.knowledgeItems.length} Q&A, ${importData.cases.length} cases, ${importData.industryRules.length} rules`);

  // 2. Create or find system user
  console.log('\n[2/5] Setting up system user...');
  
  let systemUser = await prisma.user.findFirst({
    where: { email: importData.systemUser.email }
  });
  
  if (!systemUser) {
    console.log('  Creating system user...');
    systemUser = await prisma.user.create({
      data: {
        email: importData.systemUser.email,
        name: importData.systemUser.name,
        password: 'system-generated-' + Date.now(),
        role: importData.systemUser.role,
        status: 'active',
      }
    });
    console.log(`  Created: ${systemUser.id} (${systemUser.email})`);
  } else {
    console.log(`  Found: ${systemUser.id} (${systemUser.email})`);
  }

  // 3. Import KnowledgeItem (Q&A)
  console.log('\n[3/5] Importing KnowledgeItem (Q&A)...');
  let qaCount = 0;
  let qaSkipped = 0;
  
  for (const item of importData.knowledgeItems) {
    try {
      await prisma.knowledgeItem.create({
        data: {
          id: item.id,
          userId: systemUser.id,
          title: item.question,
          category: item.category,
          content: item.context + '\n\n回答：' + item.answer,
          tags: JSON.stringify([item.category]),
          fileType: 'text',
          source: 'chinabidding_import',
          metadata: JSON.stringify({ type: 'qa', original_category: item.category }),
        }
      });
      qaCount++;
      if (qaCount % 1000 === 0) {
        console.log(`  Progress: ${qaCount}/${importData.knowledgeItems.length}`);
      }
    } catch (e) {
      if (e.message.includes('Unique constraint') || e.message.includes('unique')) {
        qaSkipped++;
      } else {
        console.error(`  Error: ${e.message.substring(0, 100)}`);
      }
    }
  }
  console.log(`  Q&A imported: ${qaCount}, skipped: ${qaSkipped}`);

  // 4. Import Case
  console.log('\n[4/5] Importing Case...');
  let caseCount = 0;
  let caseSkipped = 0;
  
  for (const item of importData.cases) {
    try {
      await prisma.case.create({
        data: {
          id: item.id,
          title: item.title,
          source: 'platform',
          industry: item.industry,
          content: item.content,
          summary: item.summary,
          status: 'published',
          isPublic: false,
          tags: JSON.stringify([item.industry]),
        }
      });
      caseCount++;
      if (caseCount % 1000 === 0) {
        console.log(`  Progress: ${caseCount}/${importData.cases.length}`);
      }
    } catch (e) {
      if (e.message.includes('Unique constraint') || e.message.includes('unique')) {
        caseSkipped++;
      } else {
        console.error(`  Error: ${e.message.substring(0, 100)}`);
      }
    }
  }
  console.log(`  Cases imported: ${caseCount}, skipped: ${caseSkipped}`);

  // 5. Import IndustryRule
  console.log('\n[5/5] Importing IndustryRule...');
  let ruleCount = 0;
  let ruleSkipped = 0;
  
  for (const item of importData.industryRules) {
    try {
      await prisma.industryRule.create({
        data: {
          id: item.id,
          category: item.category,
          title: item.title,
          content: item.content,
          industry: item.industry,
          isActive: true,
        }
      });
      ruleCount++;
    } catch (e) {
      if (e.message.includes('Unique constraint') || e.message.includes('unique')) {
        ruleSkipped++;
      } else {
        console.error(`  Error: ${e.message.substring(0, 100)}`);
      }
    }
  }
  console.log(`  Rules imported: ${ruleCount}, skipped: ${ruleSkipped}`);

  // Summary
  console.log('\n========================================');
  console.log('Import Complete!');
  console.log('========================================');
  console.log(`KnowledgeItem (Q&A): ${qaCount}`);
  console.log(`Case: ${caseCount}`);
  console.log(`IndustryRule: ${ruleCount}`);
  console.log('========================================\n');

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
