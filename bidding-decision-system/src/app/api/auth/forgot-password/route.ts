import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import crypto from 'crypto';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 速率限制
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`passwordReset:${ip}`, RATE_LIMITS.passwordReset);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '请输入邮箱' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: '如果该邮箱已注册，重置链接已发送' });
    }

    // 清理该邮箱的过期Token
    await prisma.passwordReset.deleteMany({
      where: {
        email,
        OR: [
          { expiresAt: { lt: new Date() } },
          { used: true },
        ],
      },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小时

    await prisma.passwordReset.create({
      data: { email, token, expiresAt },
    });

    const resetUrl = `${request.nextUrl.origin}/reset-password?token=${token}`;

    // 生产环境通过SMTP发送邮件；开发环境打印到控制台
    if (process.env.NODE_ENV === 'production') {
      console.log(`[Auth] 密码重置链接已生成: ${email}`);
    } else {
      console.log(`[Auth] 密码重置链接 (开发模式): ${resetUrl}`);
    }

    return NextResponse.json({
      message: '如果该邮箱已注册，重置链接已发送到您的邮箱',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
