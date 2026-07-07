import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { PLANS, getAllPlans } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

// 初始化默认定价方案
async function ensureDefaultPlans() {
  const count = await prisma.pricingPlan.count();
  if (count === 0) {
    const plans = getAllPlans().map((plan, index) => ({
      name: plan.name,
      displayName: plan.displayName,
      price: plan.price,
      period: plan.period,
      description: plan.description,
      features: JSON.stringify(plan.features),
      highlight: plan.name === 'pro',
      sortOrder: index,
    }));
    await prisma.pricingPlan.createMany({ data: plans });
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
