import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';

// 定价方案
const PLANS = {
  free: { name: '免费版', price: 0, period: 'month' },
  pro: { name: '专业版', price: 99, period: 'month' },
  enterprise: { name: '企业版', price: 299, period: 'month' },
};

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

    if (!planId || !PLANS[planId as keyof typeof PLANS]) {
      return NextResponse.json({ error: '无效的订阅方案' }, { status: 400 });
    }

    const plan = PLANS[planId as keyof typeof PLANS];

    // 创建订单（模拟）
    const order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: session.user.id,
      planId,
      planName: plan.name,
      amount: plan.price,
      currency: 'CNY',
      paymentMethod: paymentMethod || 'alipay',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // 这里应该：
    // 1. 保存订单到数据库
    // 2. 调用支付接口（支付宝/微信支付）
    // 3. 返回支付链接或二维码

    // 模拟返回支付信息
    const paymentInfo = {
      orderId: order.id,
      paymentUrl: `https://pay.example.com/${order.id}`,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=pay:${order.id}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分钟过期
    };

    return NextResponse.json({
      success: true,
      order,
      payment: paymentInfo,
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

    // 模拟查询订单状态
    const orderStatus = {
      orderId,
      status: 'paid', // pending, paid, failed, refunded
      paidAt: new Date().toISOString(),
    };

    return NextResponse.json({ order: orderStatus });
  } catch (error) {
    console.error('Query payment error:', error);
    return NextResponse.json(
      { error: '查询订单失败' },
      { status: 500 }
    );
  }
}
