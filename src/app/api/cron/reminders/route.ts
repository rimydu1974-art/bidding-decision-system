import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendBidReminder, sendQueryDeadlineReminder, sendSubscriptionExpiry } from '@/lib/feishu/notify';

// GET: 检查并发送提醒（定时任务调用）
// 可通过 Vercel Cron Jobs 或外部定时任务调用
// GET /api/cron/reminders?token=your-secret-token
export async function GET(request: NextRequest) {
  try {
    // 验证 cron token
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = [];

    // 1. 检查开标时间提醒（提前1天、3天、7天）
    const projects = await prisma.project.findMany({
      where: {
        status: { in: ['active', 'analyzing', 'preparing'] },
      },
    });

    for (const project of projects) {
      const metadata = JSON.parse(project.metadata || '{}');
      const bidOpeningTime = metadata.bidOpeningTime;

      if (bidOpeningTime) {
        const openingDate = new Date(bidOpeningTime);
        const daysUntil = Math.ceil((openingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // 提前1天、3天、7天提醒
        if ([1, 3, 7].includes(daysUntil)) {
          try {
            await sendBidReminder(
              project.userId,
              project.name,
              openingDate,
              daysUntil
            );
            results.push({
              type: 'bid_reminder',
              project: project.name,
              daysLeft: daysUntil,
              status: 'sent',
            });
          } catch (error) {
            results.push({
              type: 'bid_reminder',
              project: project.name,
              daysLeft: daysUntil,
              status: 'failed',
              error: String(error),
            });
          }
        }
      }
    }

    // 2. 检查质疑截止提醒（提前1天）
    for (const project of projects) {
      const metadata = JSON.parse(project.metadata || '{}');
      const queryDeadline = metadata.queryDeadline;

      if (queryDeadline) {
        const deadlineDate = new Date(queryDeadline);
        const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil === 1) {
          try {
            await sendQueryDeadlineReminder(
              project.userId,
              project.name,
              deadlineDate
            );
            results.push({
              type: 'query_deadline',
              project: project.name,
              status: 'sent',
            });
          } catch (error) {
            results.push({
              type: 'query_deadline',
              project: project.name,
              status: 'failed',
              error: String(error),
            });
          }
        }
      }
    }

    // 3. 检查订阅到期提醒（提前3天）
    const users = await prisma.user.findMany({
      where: {
        plan: { in: ['pro', 'enterprise'] },
        planExpiresAt: { not: null },
      },
    });

    for (const user of users) {
      if (user.planExpiresAt) {
        const daysUntil = Math.ceil(
          (user.planExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntil === 3) {
          try {
            await sendSubscriptionExpiry(
              user.id,
              user.plan || 'pro',
              user.planExpiresAt
            );
            results.push({
              type: 'subscription_expiry',
              userId: user.id,
              email: user.email,
              status: 'sent',
            });
          } catch (error) {
            results.push({
              type: 'subscription_expiry',
              userId: user.id,
              email: user.email,
              status: 'failed',
              error: String(error),
            });
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
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
