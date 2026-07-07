import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        plan: true,
        totalAiCalls: true,
        totalOrders: true,
        totalSpent: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const header = '邮箱,姓名,手机,角色,状态,套餐,AI调用次数,订单数,总消费,最后登录,注册时间';
    const rows = users.map(u => [
      u.email,
      u.name || '',
      u.phone || '',
      u.role,
      u.status,
      u.plan,
      u.totalAiCalls,
      u.totalOrders,
      u.totalSpent,
      u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : '',
      new Date(u.createdAt).toISOString(),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = '\uFEFF' + header + '\n' + rows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('[Admin Export Users] Error:', error);
    return NextResponse.json({ error: '导出用户数据失败' }, { status: 500 });
  }
}
