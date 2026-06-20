import prisma from '@/lib/db';

const FREE_MONTHLY_QUOTA = 20;

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  useUserApiKey?: boolean;
}

export async function checkAiQuota(userId: string): Promise<QuotaCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { allowed: false, reason: '用户不存在' };
  }

  const now = new Date();

  // 检查是否需要重置额度
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

  // 订阅用户无限制
  if (isPro || isEnterprise || hasTempAccess) {
    return { 
      allowed: true, 
      useUserApiKey: false // 订阅用户可以使用平台模型
    };
  }

  // 免费用户检查额度
  if (user.aiQuotaUsed >= FREE_MONTHLY_QUOTA) {
    // 额度用完，检查是否有用户自己的API Key
    if (user.userApiKey && user.apiKeyVerified) {
      return { 
        allowed: true, 
        useUserApiKey: true // 使用用户自己的API Key
      };
    }
    return { 
      allowed: false, 
      reason: '本月免费额度已用完，请升级订阅或配置自己的API Key' 
    };
  }

  // 免费额度内
  return { 
    allowed: true, 
    useUserApiKey: false // 免费用户使用平台额度
  };
}

export async function incrementAiUsage(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      aiQuotaUsed: { increment: 1 },
      totalAiCalls: { increment: 1 },
    },
  });
}
