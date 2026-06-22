import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';
import { parseFile } from '@/lib/parsers';

export const dynamic = 'force-dynamic';

// POST: 上传文件到知识库
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = (formData.get('category') as string) || '其他';

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    // 解析文件
    const parsed = await parseFile(file);

    // 保存到知识库
    const item = await prisma.knowledgeItem.create({
      data: {
        userId: session.user.id,
        title: parsed.title || file.name,
        category,
        content: parsed.content || '',
        tags: JSON.stringify([file.name]),
        fileType: file.type || 'unknown',
        fileName: file.name,
        source: 'upload',
      },
    });

    return NextResponse.json({
      success: true,
      item: {
        id: item.id,
        title: item.title,
        category: item.category,
        source: item.source,
      },
    });
  } catch (error) {
    console.error('Upload knowledge error:', error);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}
