import prisma from '@/lib/db';

export const FREE_MONTHLY_QUOTA = 20;

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  useUserApiKey?: boolean;
}

export interface QuotaInfo {
  user: {
    id: string;
    plan: string;
    isPro: boolean;
    isEnterprise: boolean;
    hasTempAccess: boolean;
    tempExpiresAt: Date | null;
    planExpiresAt: Date | null;
    totalAiCalls: number;
    totalSpent: number;
  };
  quota: {
    used: number;
    limit: number;
    remaining: number;
    resetAt: Date;
  };
  hasApiKey: boolean;
}

export async function checkAiQuota(userId: string): Promise<QuotaCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { allowed: false, reason: '用户不存在' };
  }

  const now = new Date();

  // 检查是否需要重置额度 - 使用原子操作避免并发问题
  const lastReset = new Date(user.aiQuotaResetAt);
  const needReset = now.getMonth() !== lastReset.getMonth() || 
                    now.getFullYear() !== lastReset.getFullYear();

  if (needReset) {
    // 原子重置：仅当resetAt确实未被其他请求更新时才重置
    const resetResult = await prisma.user.updateMany({
      where: {
        id: user.id,
        aiQuotaResetAt: user.aiQuotaResetAt,
      },
      data: { aiQuotaUsed: 0, aiQuotaResetAt: now },
    });

    if (resetResult.count > 0) {
      user.aiQuotaUsed = 0;
    } else {
      // 其他请求已经重置过了，重新读取最新值
      const refreshed = await prisma.user.findUnique({ where: { id: userId } });
      if (refreshed) user.aiQuotaUsed = refreshed.aiQuotaUsed;
    }
  }

  // 检查订阅状态
  const isPro = !!(user.plan === 'pro' && user.planExpiresAt && user.planExpiresAt > now);
  const isEnterprise = !!(user.plan === 'enterprise' && user.planExpiresAt && user.planExpiresAt > now);
  const hasTempAccess = !!(user.tempExpiresAt && user.tempExpiresAt > now);

  // 专业版/企业版：必须用自己的API Key，未配置则拒绝
  if (isPro || isEnterprise) {
    if (!user.userApiKey || !user.apiKeyVerified) {
      return {
        allowed: false,
        reason: '专业版/企业版需配置自己的AI模型API（DeepSeek/通义千问/智谱等），请前往用户中心配置',
      };
    }
    return {
      allowed: true,
      useUserApiKey: true // 使用用户自己的API
    };
  }

  // 单次购买用户（19元）：有临时权限，使用平台API，不检查额度
  if (hasTempAccess) {
    return {
      allowed: true,
      useUserApiKey: false // 使用平台API
    };
  }

  // 免费用户检查额度 - 原子预扣防竞态
  if (user.aiQuotaUsed >= FREE_MONTHLY_QUOTA) {
    if (user.userApiKey && user.apiKeyVerified) {
      return { 
        allowed: true, 
        useUserApiKey: true
      };
    }
    return { 
      allowed: false, 
      reason: '本月免费额度已用完，请升级订阅或配置自己的API Key' 
    };
  }

  // 原子预扣：在check阶段就预扣额度，防止check-increment竞态
  const preDeduct = await prisma.user.updateMany({
    where: {
      id: user.id,
      aiQuotaUsed: { lt: FREE_MONTHLY_QUOTA },
    },
    data: { aiQuotaUsed: { increment: 1 } },
  });

  if (preDeduct.count > 0) {
    return { 
      allowed: true, 
      useUserApiKey: false
    };
  }

  // 预扣失败：其他请求抢占了额度，重新检查
  const refreshed = await prisma.user.findUnique({ where: { id: userId } });
  if (refreshed && refreshed.aiQuotaUsed >= FREE_MONTHLY_QUOTA) {
    if (refreshed.userApiKey && refreshed.apiKeyVerified) {
      return { 
        allowed: true, 
        useUserApiKey: true
      };
    }
    return { 
      allowed: false, 
      reason: '本月免费额度已用完，请升级订阅或配置自己的API Key' 
    };
  }

  return { 
    allowed: true, 
    useUserApiKey: false
  };
}

// 获取用户额度信息（供API使用）
export async function getQuotaInfo(userId: string): Promise<QuotaInfo | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  const now = new Date();

  // 检查是否需要重置额度 - 使用原子操作避免竞态条件
  const lastReset = new Date(user.aiQuotaResetAt);
  const needReset = now.getMonth() !== lastReset.getMonth() || 
                    now.getFullYear() !== lastReset.getFullYear();

  if (needReset) {
    // 使用updateMany with条件检查，与checkAiQuota()保持一致
    const resetResult = await prisma.user.updateMany({
      where: {
        id: user.id,
        aiQuotaResetAt: lastReset, // 乐观锁
      },
      data: { aiQuotaUsed: 0, aiQuotaResetAt: now },
    });
    
    if (resetResult.count > 0) {
      user.aiQuotaUsed = 0;
    } else {
      // 其他请求已经重置过了，重新读取最新值
      const refreshed = await prisma.user.findUnique({ where: { id: userId } });
      if (refreshed) user.aiQuotaUsed = refreshed.aiQuotaUsed;
    }
  }

  const isPro = !!(user.plan === 'pro' && user.planExpiresAt && user.planExpiresAt > now);
  const isEnterprise = !!(user.plan === 'enterprise' && user.planExpiresAt && user.planExpiresAt > now);
  const hasTempAccess = !!(user.tempExpiresAt && user.tempExpiresAt > now);

  let quotaLimit = FREE_MONTHLY_QUOTA;
  if (isPro || isEnterprise || hasTempAccess) {
    quotaLimit = -1; // 无限制
  }

  const quotaRemaining = quotaLimit === -1 ? -1 : Math.max(0, quotaLimit - user.aiQuotaUsed);

  return {
    user: {
      id: user.id,
      plan: user.plan,
      isPro,
      isEnterprise,
      hasTempAccess,
      tempExpiresAt: user.tempExpiresAt,
      planExpiresAt: user.planExpiresAt,
      totalAiCalls: user.totalAiCalls,
      totalSpent: user.totalSpent,
    },
    quota: {
      used: user.aiQuotaUsed,
      limit: quotaLimit,
      remaining: quotaRemaining,
      resetAt: user.aiQuotaResetAt,
    },
    hasApiKey: !!user.userApiKey && user.apiKeyVerified,
  };
}

// 检查文件是否已分析过（用于去重）
export async function checkFileAnalyzed(userId: string, fileName: string): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: {
      userId,
      name: fileName,
    },
  });
  return !!project;
}

// 分析文件时扣次（检查阶段已预扣，此处仅记录totalAiCalls避免重复扣quota）
export async function incrementAiUsageForFile(userId: string, fileName: string): Promise<void> {
  const alreadyAnalyzed = await checkFileAnalyzed(userId, fileName);
  if (!alreadyAnalyzed) {
    // 使用updateMany确保幂等性
    await prisma.user.updateMany({
      where: { id: userId },
      data: {
        totalAiCalls: { increment: 1 },
      },
    });
  }
}

// AI写标书不扣次（订阅功能的一部分）
export async function incrementAiUsage(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      totalAiCalls: { increment: 1 },
    },
  });
}

// 退还AI配额（分析失败时调用）
export async function refundAiQuota(userId: string): Promise<void> {
  await prisma.user.updateMany({
    where: {
      id: userId,
      aiQuotaUsed: { gt: 0 }, // 确保不会减成负数
    },
    data: {
      aiQuotaUsed: { decrement: 1 },
    },
  });
}
