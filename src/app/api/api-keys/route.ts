import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';
import crypto from 'crypto';

// 生成API Key
function generateApiKey(): string {
  const prefix = 'bd_';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return prefix + randomBytes;
}

// GET: 获取API Key列表
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

    // 查询用户的API Key（从Session表中获取）
    const sessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        token: { startsWith: 'api_' },
      },
      orderBy: { createdAt: 'desc' },
    });

    const apiKeys = sessions.map((s) => ({
      id: s.id,
      name: s.token.split('_').slice(2).join('_') || 'Default API Key',
      key: s.token,
      createdAt: s.createdAt,
      lastUsedAt: null,
      usageCount: 0,
    }));

    return NextResponse.json({ keys: apiKeys });
  } catch (error) {
    console.error('Get API keys error:', error);
    return NextResponse.json(
      { error: '获取API密钥失败' },
      { status: 500 }
    );
  }
}

// POST: 创建API Key
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

    const { name } = await request.json();

    // 生成新的API Key
    const apiKey = `api_${name || 'key'}_${generateApiKey()}`;

    // 存储到Session表
    const newSession = await prisma.session.create({
      data: {
        userId: session.user.id,
        token: apiKey,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年过期
      },
    });

    return NextResponse.json({
      key: {
        id: newSession.id,
        name: name || 'Default API Key',
        key: apiKey,
        createdAt: newSession.createdAt,
      },
    });
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json(
      { error: '创建API密钥失败' },
      { status: 500 }
    );
  }
}

// DELETE: 删除API Key
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少API Key ID' }, { status: 400 });
    }

    // 删除API Key
    await prisma.session.deleteMany({
      where: {
        id,
        userId: session.user.id,
        token: { startsWith: 'api_' },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { error: '删除API密钥失败' },
      { status: 500 }
    );
  }
}
