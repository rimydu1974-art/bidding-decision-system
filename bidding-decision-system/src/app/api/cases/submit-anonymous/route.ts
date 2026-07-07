import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateSession, getTokenFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '请先登录后再投稿' }, { status: 401 });
    }

    const session = await validateSession(token);
    if (!session) {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 });
    }

    const body = await request.json();
    const { title, industry, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    const submission = await prisma.caseSubmission.create({
      data: {
        userId: session.user.id,
        title,
        industry: industry || null,
        content,
        status: 'pending',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: '投稿成功，等待审核',
        id: submission.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit anonymous case error:', error);
    return NextResponse.json(
      { error: '投稿失败，请稍后重试' },
      { status: 500 }
    );
  }
}
