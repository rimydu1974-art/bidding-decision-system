import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: '文章标识不能为空' },
        { status: 400 }
      );
    }

    const article = await prisma.thinkTankArticle.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        content: true,
        summary: true,
        tags: true,
        coverImage: true,
        views: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      );
    }

    if (!article.content) {
      return NextResponse.json(
        { error: '文章内容为空' },
        { status: 404 }
      );
    }

    // Increment views
    await prisma.thinkTankArticle.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({
      ...article,
      tags: JSON.parse(article.tags),
      views: article.views + 1,
    });
  } catch (error) {
    console.error('Get thinktank article by slug error:', error);
    return NextResponse.json(
      { error: '获取文章详情失败' },
      { status: 500 }
    );
  }
}
