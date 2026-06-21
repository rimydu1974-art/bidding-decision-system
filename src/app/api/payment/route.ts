import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';
import { createAlipayOrder, createWechatPayOrder } from '@/lib/payment';

// POST: 创建支付订单
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

    const { planId, paymentMethod } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: '无效的订阅方案' }, { status: 400 });
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

    // 保存订单到数据库
    const order = await prisma.order.create({
      data: {
        orderNo,
        userId: session.user.id,
        planName: planId,
        amount: plan.price,
        paymentStatus: 'pending',
        paymentMethod: paymentMethod || 'alipay',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟过期
      },
    });

    // 调用支付接口
    const orderInfo = {
      orderNo: order.orderNo,
      amount: Math.round(plan.price * 100), // 转换为分
      description: `投标AI - ${plan.displayName}`,
      userId: session.user.id,
    };

    let paymentResult;
    if (paymentMethod === 'wechat') {
      paymentResult = await createWechatPayOrder(orderInfo);
    } else {
      paymentResult = await createAlipayOrder(orderInfo);
    }

    if (!paymentResult.success) {
      return NextResponse.json({ error: paymentResult.error || '创建支付失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        amount: order.amount,
        planName: order.planName,
        status: order.paymentStatus,
        createdAt: order.createdAt,
      },
      payment: {
        payUrl: paymentResult.payUrl,
        qrCode: paymentResult.qrCode,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: '创建订单失败' },
      { status: 500 }
    );
  }
}

// GET: 查询订单状态
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

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: '缺少订单ID' }, { status: 400 });
    }

    // 从数据库查询订单
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNo: orderId }],
        userId: session.user.id,
      },
    });

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNo: order.orderNo,
        amount: order.amount,
        planName: order.planName,
        status: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error('Query payment error:', error);
    return NextResponse.json(
      { error: '查询订单失败' },
      { status: 500 }
    );
  }
}
