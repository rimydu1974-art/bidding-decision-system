import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST: 保存/验证用户自己的API Key
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

    const { apiKey } = await request.json();

    if (!apiKey || !apiKey.startsWith('sk-')) {
      return NextResponse.json({ error: '无效的API Key格式' }, { status: 400 });
    }

    // 验证API Key有效性
    let isVerified = false;
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 5,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: 'API Key无效或无权限' }, { status: 400 });
      }

      // 200 或 429 都表示Key有效（429表示额度不足但Key本身有效）
      if (response.status === 200 || response.status === 429) {
        isVerified = true;
      }
    } catch (error) {
      // 网络错误等，保存但不标记为已验证
      console.log('API validation error, saving as unverified:', error);
    }

    // 保存API Key，仅在验证通过时标记为已验证
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        userApiKey: apiKey,
        apiKeyVerified: isVerified,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save API key error:', error);
    return NextResponse.json(
      { error: '保存API Key失败' },
      { status: 500 }
    );
  }
}

// DELETE: 删除用户自己的API Key
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

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        userApiKey: null,
        apiKeyVerified: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { error: '删除API Key失败' },
      { status: 500 }
    );
  }
}
