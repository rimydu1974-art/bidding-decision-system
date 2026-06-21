import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';

// POST: 提交支付凭证
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const session = await validateSession(token);

    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { planId, payerName, transactionId, screenshot, note } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: '请选择订阅方案' }, { status: 400 });
    }

    if (!payerName) {
      return NextResponse.json({ error: '请填写付款人姓名' }, { status: 400 });
    }

    // 从数据库获取定价方案
    const plan = await prisma.pricingPlan.findFirst({
      where: { name: planId, isActive: true },
    });

    if (!plan) {
      return NextResponse.json({ error: '无效的订阅方案' }, { status: 400 });
    }

    // 生成订单号
    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // 保存订单到数据库（状态为pending，等待管理员审核）
    const order = await prisma.order.create({
      data: {
        orderNo,
        userId: session.user.id,
        planName: planId,
        amount: plan.price,
        paymentStatus: 'pending', // 等待审核
        paymentMethod: 'manual', // 手动转账
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
        metadata: JSON.stringify({
          payerName,
          transactionId: transactionId || '',
          screenshot: screenshot || '',
          note: note || '',
          submittedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        amount: order.amount,
        planName: plan.displayName,
        status: order.paymentStatus,
      },
      message: '支付凭证已提交，等待管理员审核',
    });
  } catch (error) {
    console.error('Submit payment error:', error);
    return NextResponse.json(
      { error: '提交失败' },
      { status: 500 }
    );
  }
}
