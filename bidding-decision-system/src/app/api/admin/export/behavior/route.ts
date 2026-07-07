import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const actions = ['register', 'upload', 'analyze', 'view_result', 'click_pay', 'pay_success'];
    const actionLabels: Record<string, string> = {
      register: '注册', upload: '上传标书', analyze: 'AI分析',
      view_result: '查看结果', click_pay: '点击付费', pay_success: '支付成功',
    };

    const counts = await Promise.all(
      actions.map(async (action) => {
        const count = await prisma.userBehavior.count({
          where: { action, createdAt: { gte: startDate } },
        });
        return { action, label: actionLabels[action], count };
      })
    );

    const header = '步骤,英文标识,用户数,占上一步比例';
    const rows = counts.map((item, i) => {
      const prevCount = i > 0 ? counts[i - 1].count : item.count;
      const rate = prevCount > 0 ? ((item.count / prevCount) * 100).toFixed(1) + '%' : '100%';
      return `${item.label},${item.action},${item.count},${rate}`;
    });

    const csv = '\uFEFF' + header + '\n' + rows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="behavior_funnel_${days}d_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('[Export Behavior] Error:', error);
    return NextResponse.json({ error: '导出行为数据失败' }, { status: 500 });
  }
}
