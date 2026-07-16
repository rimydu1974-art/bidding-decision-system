import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import { getOrCreateUserProfile, refreshUserProfile, clearUserProfile } from '@/lib/user-profile';
import { trackBehavior } from '@/lib/behavior';

export const dynamic = 'force-dynamic';

// 获取用户DNA档案
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

    const profile = await getOrCreateUserProfile(session.user.id);

    // 追踪查看行为
    trackBehavior({
      userId: session.user.id,
      action: 'view_profile',
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: '获取用户档案失败' },
      { status: 500 }
    );
  }
}

// 刷新用户DNA档案
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

    const profile = await refreshUserProfile(session.user.id);

    // 追踪画像生成行为
    trackBehavior({
      userId: session.user.id,
      action: 'profile_generated',
      metadata: { profileVersion: profile?.profileVersion || 0 },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Refresh user profile error:', error);
    return NextResponse.json(
      { error: '刷新用户档案失败' },
      { status: 500 }
    );
  }
}

// 清除用户DNA档案
export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const session = await validateSession(token);
    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const success = await clearUserProfile(session.user.id);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Clear user profile error:', error);
    return NextResponse.json(
      { error: '清除用户档案失败' },
      { status: 500 }
    );
  }
}
