import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { readFileSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

interface ImportData {
  systemUser: {
    email: string;
    name: string;
    role: string;
  };
  knowledgeItems: Array<{
    id: string;
    question: string;
    answer: string;
    context: string;
    category: string;
  }>;
  cases: Array<{
    id: string;
    title: string;
    industry: string;
    content: string;
    summary: string;
  }>;
  industryRules: Array<{
    id: string;
    category: string;
    title: string;
    content: string;
    industry: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // 1. 验证管理员权限
    const result = await requireAdmin(request);
    if (result instanceof NextResponse) {
      return result;
    }

    // 2. 读取导入数据
    const dataPath = join(process.cwd(), 'import_data.json');
    let importData: ImportData;
    
    try {
      const rawData = readFileSync(dataPath, 'utf-8');
      importData = JSON.parse(rawData);
    } catch (e) {
      return NextResponse.json(
        { error: '导入数据文件不存在或格式错误' },
        { status: 400 }
      );
    }

    // 3. 获取或创建系统用户
    let systemUser = await prisma.user.findFirst({
      where: { email: importData.systemUser.email }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: importData.systemUser.email,
          name: importData.systemUser.name,
          password: 'system-' + Date.now(),
          role: importData.systemUser.role,
          status: 'active',
        }
      });
    }

    // 4. 批量导入 KnowledgeItem
    let qaImported = 0;
    let qaSkipped = 0;
    const qaBatchSize = 100;

    for (let i = 0; i < importData.knowledgeItems.length; i += qaBatchSize) {
      const batch = importData.knowledgeItems.slice(i, i + qaBatchSize);
      
      for (const item of batch) {
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
          qaImported++;
        } catch (e: any) {
          if (e.message?.includes('Unique constraint') || e.message?.includes('unique')) {
            qaSkipped++;
          }
        }
      }
    }

    // 5. 批量导入 Case
    let caseImported = 0;
    let caseSkipped = 0;
    const caseBatchSize = 100;

    for (let i = 0; i < importData.cases.length; i += caseBatchSize) {
      const batch = importData.cases.slice(i, i + caseBatchSize);
      
      for (const item of batch) {
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
          caseImported++;
        } catch (e: any) {
          if (e.message?.includes('Unique constraint') || e.message?.includes('unique')) {
            caseSkipped++;
          }
        }
      }
    }

    // 6. 批量导入 IndustryRule
    let ruleImported = 0;
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
        ruleImported++;
      } catch (e: any) {
        if (e.message?.includes('Unique constraint') || e.message?.includes('unique')) {
          ruleSkipped++;
        }
      }
    }

    // 7. 返回结果
    return NextResponse.json({
      success: true,
      summary: {
        knowledgeItem: { imported: qaImported, skipped: qaSkipped },
        case: { imported: caseImported, skipped: caseSkipped },
        industryRule: { imported: ruleImported, skipped: ruleSkipped },
      }
    });

  } catch (error) {
    console.error('[Import] Error:', error);
    return NextResponse.json(
      { error: '导入失败，请重试' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const result = await requireAdmin(request);
    if (result instanceof NextResponse) {
      return result;
    }

    // 获取导入统计
    const [knowledgeCount, caseCount, ruleCount] = await Promise.all([
      prisma.knowledgeItem.count({ where: { source: 'chinabidding_import' } }),
      prisma.case.count({ where: { source: 'platform' } }),
      prisma.industryRule.count(),
    ]);

    return NextResponse.json({
      stats: {
        knowledgeItem: knowledgeCount,
        case: caseCount,
        industryRule: ruleCount,
      }
    });

  } catch (error) {
    console.error('[Import Stats] Error:', error);
    return NextResponse.json(
      { error: '获取统计失败' },
      { status: 500 }
    );
  }
}
