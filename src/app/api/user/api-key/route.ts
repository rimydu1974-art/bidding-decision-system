import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';

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

      if (response.status === 429) {
        // 429表示密钥有效但额度不足，仍然保存
        console.log('API Key valid but quota exceeded');
      }
    } catch (error) {
      console.log('API validation error, saving anyway:', error);
    }

    // 保存API Key
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        userApiKey: apiKey,
        apiKeyVerified: true,
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
