import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import { getQuotaInfo } from '@/lib/quota';

export const dynamic = 'force-dynamic';

// 检查用户是否有AI调用额度
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

    const quotaInfo = await getQuotaInfo(session.user.id);

    if (!quotaInfo) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json(quotaInfo);
  } catch (error) {
    console.error('Check quota error:', error);
    return NextResponse.json(
      { error: '检查额度失败' },
      { status: 500 }
    );
  }
}
