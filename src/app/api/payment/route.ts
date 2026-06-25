import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createPaymentOrder, getPaymentConfig } from '@/lib/payment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, planId, amount, paymentMethod } = body;

    // 获取用户
    const cookieHeader = request.headers.get('cookie');
    const cookies = cookieHeader?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const token = cookies?.['auth-token'];
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 });
    }

    const user = session.user;

    // 生成订单号
    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 创建订单
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        orderNo,
        planName: planId || 'single',
        amount: amount || 1900, // 默认19元
        paymentMethod: paymentMethod || 'wechat',
        paymentStatus: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时过期
      },
    });

    // 调用支付服务创建支付
    const paymentResult = await createPaymentOrder({
      orderNo,
      amount: order.amount,
      description: `投标AI - ${order.planName}`,
      userId: user.id,
      notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`,
    });

    if (!paymentResult.success) {
      return NextResponse.json({ error: paymentResult.error || '创建支付失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderNo: order.orderNo,
      payUrl: paymentResult.payUrl,
      qrCode: paymentResult.qrCode,
      prepayId: paymentResult.prepayId,
    });
  } catch (error) {
    console.error('[Payment] 创建支付失败:', error);
    return NextResponse.json({ error: '创建支付失败' }, { status: 500 });
  }
}
