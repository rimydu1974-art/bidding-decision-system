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
    features: JSON.stringify(['每月5次AI分析', '基础风险识别', 'Excel报告下载', '标准分析速度']),
    highlight: false,
    sortOrder: 0,
  },
  {
    name: 'pro',
    displayName: '专业版',
    price: 99,
    period: 'month',
    description: '适合小型投标团队',
    features: JSON.stringify([
      '无限AI分析',
      '高级风险识别',
      '实时评分预测',
      'AI标书编写',
      '企业知识库',
      '项目管理',
      '优先客服支持',
    ]),
    highlight: true,
    sortOrder: 1,
  },
  {
    name: 'enterprise',
    displayName: '企业版',
    price: 299,
    period: 'month',
    description: '适合大型企业',
    features: JSON.stringify([
      '专业版全部功能',
      '飞书/钉钉集成',
      'API开放平台',
      '多团队协作',
      '定制化开发',
      '专属客户经理',
      'SLA保障',
    ]),
    highlight: false,
    sortOrder: 2,
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
