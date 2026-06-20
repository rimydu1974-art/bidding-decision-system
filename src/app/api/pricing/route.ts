import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// 默认定价方案
const DEFAULT_PLANS = [
  {
    name: 'free',
    displayName: '免费版',
    price: 0,
    period: 'month',
    description: '适合个人用户试用',
    features: JSON.stringify([
      '每月20次AI分析',
      '基础风险识别',
      'Excel报告下载',
      '自备API Key可用',
    ]),
    highlight: false,
    sortOrder: 0,
  },
  {
    name: 'single',
    displayName: '单次购买',
    price: 12,
    period: 'single',
    description: '临时使用，7天有效',
    features: JSON.stringify([
      '单份完整标书生成',
      '7天全功能体验',
      '所有AI功能解锁',
    ]),
    highlight: false,
    sortOrder: 1,
  },
  {
    name: 'pro',
    displayName: '专业版',
    price: 99,
    period: 'month',
    description: '适合小微投标工作室',
    features: JSON.stringify([
      '无限AI分析',
      '完整标书生成',
      '企业知识库',
      '项目管理',
      '优先客服',
      '每月更新模板',
    ]),
    highlight: true,
    sortOrder: 2,
  },
  {
    name: 'pro-year',
    displayName: '专业版年付',
    price: 799,
    period: 'year',
    description: '年付立减389元',
    features: JSON.stringify([
      '专业版全部功能',
      '额外赠送30次token',
      '年付更划算',
    ]),
    highlight: false,
    sortOrder: 3,
  },
  {
    name: 'enterprise',
    displayName: '企业版',
    price: 299,
    period: 'month',
    description: '适合10人以上团队',
    features: JSON.stringify([
      '专业版全部功能',
      '飞书/钉钉集成',
      '团队权限管理',
      '操作审计日志',
      '专属客户经理',
      'SLA保障',
    ]),
    highlight: false,
    sortOrder: 4,
  },
];

// 初始化默认定价方案
async function ensureDefaultPlans() {
  const count = await prisma.pricingPlan.count();
  if (count === 0) {
    await prisma.pricingPlan.createMany({
      data: DEFAULT_PLANS,
    });
  }
}

// GET: 获取所有定价方案
export async function GET() {
  try {
    await ensureDefaultPlans();

    const plans = await prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      plans: plans.map((p) => ({
        ...p,
        features: JSON.parse(p.features),
      })),
    });
  } catch (error) {
    console.error('Get pricing plans error:', error);
    return NextResponse.json(
      { error: '获取定价方案失败' },
      { status: 500 }
    );
  }
}

// POST: 创建或更新定价方案（管理员用）
export async function POST(request: NextRequest) {
  try {
    const { plans } = await request.json();

    if (!Array.isArray(plans)) {
      return NextResponse.json({ error: '无效的定价数据' }, { status: 400 });
    }

    // 更新或创建每个方案
    for (const plan of plans) {
      const existing = await prisma.pricingPlan.findFirst({
        where: { name: plan.name },
      });

      if (existing) {
        await prisma.pricingPlan.update({
          where: { id: existing.id },
          data: {
            displayName: plan.displayName,
            price: plan.price,
            period: plan.period,
            description: plan.description,
            features: JSON.stringify(plan.features),
            highlight: plan.highlight,
            sortOrder: plan.sortOrder,
          },
        });
      } else {
        await prisma.pricingPlan.create({
          data: {
            name: plan.name,
            displayName: plan.displayName,
            price: plan.price,
            period: plan.period || 'month',
            description: plan.description || '',
            features: JSON.stringify(plan.features || []),
            highlight: plan.highlight || false,
            sortOrder: plan.sortOrder || 0,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update pricing plans error:', error);
    return NextResponse.json(
      { error: '更新定价方案失败' },
      { status: 500 }
    );
  }
}
