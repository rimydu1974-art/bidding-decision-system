import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '请输入邮箱' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: '如果该邮箱已注册，重置链接已发送' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小时

    await prisma.passwordReset.create({
      data: { email, token, expiresAt },
    });

    const resetUrl = `${request.nextUrl.origin}/reset-password?token=${token}`;

    console.log('========================================');
    console.log(`密码重置请求: ${email}`);
    console.log(`重置链接: ${resetUrl}`);
    console.log('========================================');

    return NextResponse.json({
      message: '重置链接已发送到您的邮箱',
      resetUrl,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
