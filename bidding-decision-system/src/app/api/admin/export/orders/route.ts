import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const orders = await prisma.order.findMany({
      select: {
        orderNo: true,
        user: { select: { email: true } },
        planName: true,
        amount: true,
        paymentMethod: true,
        paymentStatus: true,
        paidAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const header = '订单号,用户邮箱,套餐,金额,支付方式,支付状态,支付时间,过期时间,创建时间';
    const rows = orders.map(o => [
      o.orderNo,
      o.user.email,
      o.planName,
      o.amount,
      o.paymentMethod || '',
      o.paymentStatus,
      o.paidAt ? new Date(o.paidAt).toISOString() : '',
      new Date(o.expiresAt).toISOString(),
      new Date(o.createdAt).toISOString(),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = '\uFEFF' + header + '\n' + rows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('[Admin Export Orders] Error:', error);
    return NextResponse.json({ error: '导出订单数据失败' }, { status: 500 });
  }
}
