import prisma from '@/lib/db';
import { identifyIndustry } from '@/lib/utils/industry-identifier';

export interface UserProfileData {
  id: string;
  userId: string;
  preferredIndustries: Array<{ industry: string; count: number; ratio: number }>;
  strongProjectTypes: Array<{ type: string; count: number }>;
  totalAssessments: number;
  totalBids: number;
  totalWins: number;
  totalDecisions: number;
  aiSuggestionFollowRate: number;
  totalSuggestions: number;
  followedSuggestions: number;
  riskTolerance: string;
  avgBidRatio: number;
  bidRatioRange: { min: number; max: number };
  analysisStreak: number;
  lastAnalysisAt: Date | null;
  profileVersion: number;
}

/**
 * 获取或创建用户画像
 */
export async function getOrCreateUserProfile(userId: string): Promise<UserProfileData | null> {
  try {
    let profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // 自动创建空画像
      profile = await prisma.userProfile.create({
        data: { userId },
      });
    }

    return formatProfile(profile);
  } catch (error) {
    console.error('[UserProfile] 获取画像失败:', error);
    return null;
  }
}

/**
 * 强制刷新用户画像（全量计算）
 */
export async function refreshUserProfile(userId: string): Promise<UserProfileData | null> {
  try {
    // 1. 获取所有评估记录
    const assessments = await prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 200, // 最近200条
    });

    if (assessments.length === 0) {
      return null;
    }

    // 2. 统计行业分布
    const industryCount: Record<string, number> = {};
    for (const a of assessments) {
      const industry = identifyIndustry(a.projectName, JSON.parse(a.basicInfo || '{}'));
      if (industry) {
        industryCount[industry] = (industryCount[industry] || 0) + 1;
      }
    }

    const totalWithIndustry = Object.values(industryCount).reduce((s, c) => s + c, 0);
    const preferredIndustries = Object.entries(industryCount)
      .map(([industry, count]) => ({
        industry,
        count,
        ratio: totalWithIndustry > 0 ? count / totalWithIndustry : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 3. 统计决策
    const decisions = assessments.filter(a => a.userDecision);
    const totalDecisions = decisions.length;
    const totalBids = decisions.filter(a => a.userDecision === 'bid').length;

    // 4. 统计报价风格
    const bidRatios: number[] = [];
    for (const a of assessments) {
      const basicInfo = JSON.parse(a.basicInfo || '{}');
      const budget = a.budget || basicInfo.budget || 0;
      const maxPrice = JSON.parse(a.aiResult || '{}')?.financialInfo?.maxPrice || 0;
      if (budget > 0 && maxPrice > 0) {
        bidRatios.push(maxPrice / budget);
      }
    }

    const avgBidRatio = bidRatios.length > 0
      ? bidRatios.reduce((s, r) => s + r, 0) / bidRatios.length
      : 0;

    const bidRatioRange = bidRatios.length > 0
      ? { min: Math.min(...bidRatios), max: Math.max(...bidRatios) }
      : { min: 0, max: 0 };

    // 5. 计算风险偏好
    const riskLevels = assessments.map(a => a.riskLevel);
    const highRiskCount = riskLevels.filter(r => r === 'high' || r === 'critical').length;
    const riskTolerance = highRiskCount / assessments.length > 0.5
      ? 'aggressive'
      : highRiskCount / assessments.length > 0.2
        ? 'moderate'
        : 'conservative';

    // 6. 计算连续分析天数
    const analysisStreak = calculateStreak(assessments);

    // 7. 写入/更新 UserProfile
    const profileData = {
      preferredIndustries: JSON.stringify(preferredIndustries),
      strongProjectTypes: JSON.stringify([]), // 暂时为空
      totalAssessments: assessments.length,
      totalBids,
      totalWins: 0, // 需要用户自报
      totalDecisions,
      aiSuggestionFollowRate: 0, // 需要后续计算
      totalSuggestions: 0,
      followedSuggestions: 0,
      riskTolerance,
      avgBidRatio,
      bidRatioRange: JSON.stringify(bidRatioRange),
      analysisStreak,
      lastAnalysisAt: assessments[0]?.createdAt || new Date(),
      profileVersion: Date.now(),
    };

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData,
      },
    });

    return formatProfile(profile);
  } catch (error) {
    console.error('[UserProfile] 刷新画像失败:', error);
    return null;
  }
}

/**
 * 清除用户画像
 */
export async function clearUserProfile(userId: string): Promise<boolean> {
  try {
    await prisma.userProfile.delete({
      where: { userId },
    });
    return true;
  } catch (error) {
    console.error('[UserProfile] 清除画像失败:', error);
    return false;
  }
}

/**
 * 格式化画像数据
 */
function formatProfile(profile: any): UserProfileData {
  return {
    id: profile.id,
    userId: profile.userId,
    preferredIndustries: JSON.parse(profile.preferredIndustries || '[]'),
    strongProjectTypes: JSON.parse(profile.strongProjectTypes || '[]'),
    totalAssessments: profile.totalAssessments,
    totalBids: profile.totalBids,
    totalWins: profile.totalWins,
    totalDecisions: profile.totalDecisions,
    aiSuggestionFollowRate: profile.aiSuggestionFollowRate,
    totalSuggestions: profile.totalSuggestions,
    followedSuggestions: profile.followedSuggestions,
    riskTolerance: profile.riskTolerance,
    avgBidRatio: profile.avgBidRatio,
    bidRatioRange: JSON.parse(profile.bidRatioRange || '{}'),
    analysisStreak: profile.analysisStreak,
    lastAnalysisAt: profile.lastAnalysisAt,
    profileVersion: profile.profileVersion,
  };
}

/**
 * 计算连续分析天数
 */
function calculateStreak(assessments: any[]): number {
  if (assessments.length === 0) return 0;

  const dates = [...new Set(
    assessments.map(a => new Date(a.createdAt).toDateString())
  )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 1;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  // 从最近一天开始检查
  if (dates[0] !== today && dates[0] !== yesterday) {
    return 0;
  }

  for (let i = 1; i < dates.length; i++) {
    const curr = new Date(dates[i - 1]);
    const prev = new Date(dates[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / 86400000;

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * 生成AI注入的用户画像文本
 */
export function generateProfilePrompt(profile: UserProfileData | null): string {
  if (!profile || profile.totalAssessments === 0) {
    return '';
  }

  const lines: string[] = ['【用户画像】'];

  // 行业偏好
  if (profile.preferredIndustries.length > 0) {
    const industries = profile.preferredIndustries
      .slice(0, 3)
      .map(i => `${i.industry}(${Math.round(i.ratio * 100)}%)`)
      .join(', ');
    lines.push(`- 偏好行业：${industries}`);
  }

  // 风险偏好
  const riskLabels: Record<string, string> = {
    conservative: '偏保守',
    moderate: '中等',
    aggressive: '偏激进',
  };
  lines.push(`- 风险承受：${riskLabels[profile.riskTolerance] || '中等'}`);

  // 报价风格
  if (profile.avgBidRatio > 0) {
    lines.push(`- 报价风格：平均报价/预算=${Math.round(profile.avgBidRatio * 100)}%`);
  }

  // 决策统计
  if (profile.totalDecisions > 0) {
    lines.push(`- 历史决策：投${profile.totalBids}次, 共${profile.totalDecisions}次记录`);
  }

  // 活跃度
  if (profile.analysisStreak > 1) {
    lines.push(`- 连续分析：${profile.analysisStreak}天`);
  }

  return lines.join('\n');
}
