import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
import { hashPassword, createSession } from '@/lib/auth';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import { trackBehavior } from '@/lib/behavior';

export async function POST(request: NextRequest) {
  try {
    // 速率限制
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`register:${ip}`, RATE_LIMITS.register);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: '注册尝试过于频繁，请稍后再试' },
        { status: 429 }
      );
    }

    const { email, password, name, phone } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码至少6位' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已注册' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashPassword(password),
        name: name || email.split('@')[0],
        phone,
      },
    });

    const session = await createSession(user.id);

    trackBehavior({ userId: user.id, action: 'register' });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    response.cookies.set('auth-token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
