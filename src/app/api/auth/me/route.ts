import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';
import { maskApiKey } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const session = await validateSession(token);

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // 获取完整的用户信息（包括API Key状态）
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        plan: true,
        planExpiresAt: true,
        tempExpiresAt: true,
        aiQuotaUsed: true,
        aiQuotaResetAt: true,
        userApiKey: true,
        apiKeyVerified: true,
        totalAiCalls: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        ...user,
        // API Key脱敏显示，不返回完整Key
        userApiKey: maskApiKey(user.userApiKey),
        hasApiKey: !!user.userApiKey,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
