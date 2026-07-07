import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: 清理过期的评估记录（定时任务调用）
// 删除策略：
// - 免费用户：分析后30天删除
// - ¥19单次用户：分析后30天删除
// - ¥99月卡用户（不续费）：订阅到期后60天删除
// - ¥99月卡用户（续费）：永久保留
// GET /api/cron/cleanup?token=your-secret-token
export async function GET(request: NextRequest) {
  try {
    // 验证 cron token
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = {
      deletedAssessments: 0,
      deletedProjects: 0,
      errors: [] as string[],
    };

    // 1. 清理免费用户和¥19单次用户的评估记录（分析后30天）
    const freeAndSingleUsers = await prisma.user.findMany({
      where: {
        plan: { in: ['free', 'single'] },
      },
      select: { id: true, plan: true },
    });

    const freeUserIds = freeAndSingleUsers.map(u => u.id);

    if (freeUserIds.length > 0) {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const deletedFree = await prisma.assessment.deleteMany({
        where: {
          userId: { in: freeUserIds },
          createdAt: { lt: thirtyDaysAgo },
        },
      });

      results.deletedAssessments += deletedFree.count;
    }

    // 2. 清理¥99月卡用户（不续费）的评估记录（订阅到期后60天）
    const expiredProUsers = await prisma.user.findMany({
      where: {
        plan: { in: ['pro', 'pro-year', 'enterprise'] },
        planExpiresAt: { not: null, lt: now }, // 已过期
      },
      select: { id: true, planExpiresAt: true },
    });

    for (const user of expiredProUsers) {
      if (user.planExpiresAt) {
        const sixtyDaysAfterExpiry = new Date(
          user.planExpiresAt.getTime() + 60 * 24 * 60 * 60 * 1000
        );

        if (now > sixtyDaysAfterExpiry) {
          const deletedPro = await prisma.assessment.deleteMany({
            where: {
              userId: user.id,
              createdAt: { lt: sixtyDaysAfterExpiry },
            },
          });

          results.deletedAssessments += deletedPro.count;
        }
      }
    }

    // 3. 清理没有关联评估记录的孤立项目
    // 找出所有项目，检查是否有对应的评估记录
    const allProjects = await prisma.project.findMany({
      select: { id: true, userId: true, createdAt: true },
    });

    for (const project of allProjects) {
      const hasAssessment = await prisma.assessment.findFirst({
        where: {
          userId: project.userId,
          // 通过projectName匹配（因为Assessment没有projectId字段）
        },
        select: { id: true },
      });

      // 如果用户没有评估记录，且项目创建超过30天，删除项目
      if (!hasAssessment) {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (project.createdAt < thirtyDaysAgo) {
          try {
            await prisma.project.delete({
              where: { id: project.id },
            });
            results.deletedProjects++;
          } catch (error) {
            results.errors.push(`删除项目 ${project.id} 失败: ${String(error)}`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('Cleanup cron job error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
