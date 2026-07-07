import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const usages = await prisma.aIUsage.findMany({
      select: {
        user: { select: { email: true } },
        model: true,
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        cost: true,
        useUserApiKey: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const header = '用户邮箱,模型,提示Token,补全Token,总Token,费用(元),使用自有Key,时间';
    const rows = usages.map(u => [
      u.user.email,
      u.model,
      u.promptTokens,
      u.completionTokens,
      u.totalTokens,
      u.cost,
      u.useUserApiKey ? '是' : '否',
      new Date(u.createdAt).toISOString(),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = '\uFEFF' + header + '\n' + rows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ai_usage_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('[Admin Export AI Usage] Error:', error);
    return NextResponse.json({ error: '导出AI使用数据失败' }, { status: 500 });
  }
}
