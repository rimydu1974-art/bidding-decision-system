import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';
import { parseFile } from '@/lib/parsers';

export const dynamic = 'force-dynamic';

// 文件大小限制（100MB）
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// 允许的文件类型
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/markdown',
];

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

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `文件大小超过限制（最大 ${MAX_FILE_SIZE / 1024 / 1024}MB）` },
        { status: 400 }
      );
    }

    // 检查文件类型
    if (ALLOWED_TYPES.length > 0 && !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型' },
        { status: 400 }
      );
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
