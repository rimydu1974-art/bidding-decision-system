const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const fs = require('fs');
const path = require('path');

const KNOWLEDGE_DIR = String.raw`C:\Users\ips\Desktop\测试AI员工能力\爬虫数据\yuanbo_crawler\opencheck_rag\knowledge`;
const QA_FILE = path.join(KNOWLEDGE_DIR, 'opencheck_qa_train.jsonl');
const KB_FILE = path.join(KNOWLEDGE_DIR, 'knowledge_base.json');

function generateCuid() {
    return 'c' + Math.random().toString(36).substring(2, 26);
}

async function main() {
    console.log('开始批量导入数据...');
    
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error('没有找到用户');
        process.exit(1);
    }
    console.log('使用用户:', user.email);
    
    // 导入 Q&A 数据（批量插入）
    console.log('\n导入 Q&A 数据到 KnowledgeItem...');
    const qaLines = fs.readFileSync(QA_FILE, 'utf-8').split('\n').filter(l => l.trim());
    console.log('  总数:', qaLines.length);
    
    // 检查已导入数量
    const existingQa = await prisma.knowledgeItem.count({
        where: { source: 'opencheck_import' }
    });
    console.log('  已导入:', existingQa);
    
    const BATCH_SIZE = 50;
    let imported = 0;
    
    for (let i = 0; i < qaLines.length; i += BATCH_SIZE) {
        const batch = qaLines.slice(i, i + BATCH_SIZE);
        const data = batch.map(line => {
            const item = JSON.parse(line);
            return {
                id: generateCuid(),
                userId: user.id,
                title: (item.instruction || '').substring(0, 100),
                category: item.category || '未分类',
                content: `问题：${item.instruction || ''}\n上下文：${(item.input || '').substring(0, 500)}\n回答：${item.output || ''}`,
                tags: JSON.stringify(['招标', 'Q&A', item.category || '']),
                fileType: 'text',
                source: 'opencheck_import',
                metadata: JSON.stringify({ type: 'qa' }),
            };
        });
        
        try {
            await prisma.knowledgeItem.createMany({
                data: data,
                skipDuplicates: true,
            });
            imported += data.length;
            if (imported % 500 === 0 || imported >= qaLines.length) {
                console.log(`  进度: ${imported}/${qaLines.length}`);
            }
        } catch (e) {
            console.error('  批量插入错误:', e.message.substring(0, 100));
        }
    }
    
    const totalQa = await prisma.knowledgeItem.count({
        where: { source: 'opencheck_import' }
    });
    console.log('Q&A 导入完成! 总计:', totalQa, '条');
    
    // 导入 Case 数据（批量插入）
    console.log('\n导入招标案例到 Case...');
    const kbData = JSON.parse(fs.readFileSync(KB_FILE, 'utf-8'));
    console.log('  总数:', kbData.length);
    
    const BATCH_SIZE_CASE = 50;
    let caseImported = 0;
    
    for (let i = 0; i < kbData.length; i += BATCH_SIZE_CASE) {
        const batch = kbData.slice(i, i + BATCH_SIZE_CASE);
        const data = batch.map(item => ({
            id: generateCuid(),
            title: (item.title || '').substring(0, 200),
            source: 'platform',
            industry: item.category || '其他',
            content: (item.content || '').substring(0, 5000),
            summary: (item.title || '').substring(0, 200),
            status: 'published',
            isPublic: false,
            tags: JSON.stringify([item.category || '', '招标公告']),
        }));
        
        try {
            await prisma.case.createMany({
                data: data,
                skipDuplicates: true,
            });
            caseImported += data.length;
            if (caseImported % 1000 === 0 || caseImported >= kbData.length) {
                console.log(`  进度: ${caseImported}/${kbData.length}`);
            }
        } catch (e) {
            console.error('  批量插入错误:', e.message.substring(0, 100));
        }
    }
    
    const totalCases = await prisma.case.count();
    console.log('Case 导入完成! 总计:', totalCases, '条');
    
    // 最终统计
    console.log('\n========== 导入统计 ==========');
    console.log('KnowledgeItem (Q&A):', totalQa, '条');
    console.log('Case (招标案例):', totalCases, '条');
    console.log('==============================');
    
    await prisma.$disconnect();
    console.log('\n导入完成!');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
