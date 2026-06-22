import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// 免费版每月AI额度
const FREE_MONTHLY_QUOTA = 20;

// 检查用户是否有AI调用额度
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const session = await validateSession(token);

    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 检查是否需要重置额度（每月1号）
    const now = new Date();
    const lastReset = new Date(user.aiQuotaResetAt);
    const needReset = now.getMonth() !== lastReset.getMonth() || 
                      now.getFullYear() !== lastReset.getFullYear();

    if (needReset) {
      await prisma.user.update({
        where: { id: user.id },
        data: { aiQuotaUsed: 0, aiQuotaResetAt: now },
      });
      user.aiQuotaUsed = 0;
    }

    // 检查订阅状态
    const isPro = user.plan === 'pro' && user.planExpiresAt && user.planExpiresAt > now;
    const isEnterprise = user.plan === 'enterprise' && user.planExpiresAt && user.planExpiresAt > now;
    const hasTempAccess = user.tempExpiresAt && user.tempExpiresAt > now;

    // 计算剩余额度
    let quotaLimit = FREE_MONTHLY_QUOTA;
    if (isPro || isEnterprise || hasTempAccess) {
      quotaLimit = -1; // 无限制
    }

    const quotaRemaining = quotaLimit === -1 ? -1 : Math.max(0, quotaLimit - user.aiQuotaUsed);

    return NextResponse.json({
      user: {
        id: user.id,
        plan: user.plan,
        isPro,
        isEnterprise,
        hasTempAccess,
        tempExpiresAt: user.tempExpiresAt,
        planExpiresAt: user.planExpiresAt,
      },
      quota: {
        used: user.aiQuotaUsed,
        limit: quotaLimit,
        remaining: quotaRemaining,
        resetAt: user.aiQuotaResetAt,
      },
      hasApiKey: !!user.userApiKey && user.apiKeyVerified,
    });
  } catch (error) {
    console.error('Check quota error:', error);
    return NextResponse.json(
      { error: '检查额度失败' },
      { status: 500 }
    );
  }
}
