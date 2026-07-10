// 定价单一来源 - 所有价格从此文件读取
export const PLANS = {
  free: {
    name: 'free',
    displayName: '免费版',
    price: 0,
    period: 'month',
    monthlyQuota: 20,
    description: '体验AI分析能力',
    features: [
      '投标决策表（6大类信息提取）',
      '老板总结（仅显示数量）',
      '偏离表框架（仅招标要求列）',
      '风险评估/评分预测/关键词（模糊预览）',
      '每月20次免费额度',
    ],
  },
  single: {
    name: 'single',
    displayName: '单次基础版',
    price: 19,
    period: 'single',
    monthlyQuota: 999,
    description: '解锁单项目完整分析',
    features: [
      '完整投标决策表（6大类信息提取）',
      '老板总结（结论+关键提醒+准备重点）',
      '完整偏离表（招标要求+投标响应）',
      '风险评估 + 废标风险检测',
      '甲方确认问题清单',
      '评分预测拆解',
      '关键词分析',
      '准备分工项目包',
      '同项目投标文件深度评估（免费追加）',
    ],
  },
  pro: {
    name: 'pro',
    displayName: '专业会员版',
    price: 99,
    period: 'month',
    monthlyQuota: 999,
    description: '不限项目深度分析',
    features: [
      '不限项目深度分析',
      '不限标书生成',
      '不限评分拆解',
      'AI投标助手对话功能',
      'API接口',
      '优先客服',
      '企业知识库',
    ],
  },
  'pro-year': {
    name: 'pro-year',
    displayName: '专业版年付',
    price: 799,
    period: 'year',
    monthlyQuota: 999,
    description: '年付立减389元',
    features: [
      '专业版全部功能',
      '额外赠送30次token',
      '年付更划算',
    ],
  },
  enterprise: {
    name: 'enterprise',
    displayName: '企业版',
    price: 299,
    period: 'month',
    monthlyQuota: 999,
    description: '适合10人以上团队',
    features: [
      '专业版全部功能',
      '飞书/钉钉集成',
      '团队权限管理',
      '操作审计日志',
      '专属客户经理',
      'SLA保障',
    ],
  },
} as const;

export type PlanName = keyof typeof PLANS;

// 获取套餐信息
export function getPlan(planName: string) {
  return PLANS[planName as PlanName] || PLANS.free;
}

// 获取套餐价格（分）
export function getPlanPriceInCents(planName: string): number {
  return getPlan(planName).price * 100;
}

// 获取所有套餐列表
export function getAllPlans() {
  return Object.values(PLANS);
}

// 最低价格和最高价格（用于SEO）
export const LOW_PRICE = 0;
export const HIGH_PRICE = 299;
export const OFFER_COUNT = Object.keys(PLANS).length;
