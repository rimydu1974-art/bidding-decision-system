import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateSession, getTokenFromRequest } from '@/lib/auth';

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

    const assessments = await prisma.assessment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ assessments });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: '获取历史记录失败' },
      { status: 500 }
    );
  }
}

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

    const data = await request.json();

    const assessment = await prisma.assessment.create({
      data: {
        userId: session.user.id,
        projectName: data.projectName || '未命名项目',
        projectCode: data.projectCode || '',
        budget: data.budget || 0,
        riskLevel: data.riskLevel || 'medium',
        recommendation: data.recommendation || 'caution',
        fileName: data.fileName || '',
        aiResult: JSON.stringify(data.aiResult || {}),
        basicInfo: JSON.stringify(data.basicInfo || {}),
        risks: JSON.stringify(data.risks || []),
        tasks: JSON.stringify(data.tasks || []),
        scoringRules: JSON.stringify(data.scoringRules || {}),
        qualificationReqs: JSON.stringify(data.qualificationReqs || []),
        technicalResponse: JSON.stringify(data.technicalResponse || []),
        bidDeadline: data.bidDeadline ? new Date(data.bidDeadline) : null,
        bidOpeningTime: data.bidOpeningTime ? new Date(data.bidOpeningTime) : null,
        queryDeadline: data.queryDeadline ? new Date(data.queryDeadline) : null,
      },
    });

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('Save assessment error:', error);
    return NextResponse.json(
      { error: '保存评估失败' },
      { status: 500 }
    );
  }
}

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
      return NextResponse.json({ error: '缺少评估ID' }, { status: 400 });
    }

    await prisma.assessment.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete assessment error:', error);
    return NextResponse.json(
      { error: '删除评估失败' },
      { status: 500 }
    );
  }
}
