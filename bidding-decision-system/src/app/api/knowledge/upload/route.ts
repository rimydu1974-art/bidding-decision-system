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
    const uploadId = formData.get('uploadId') as string;
    const fileUrl = formData.get('fileUrl') as string;
    const category = (formData.get('category') as string) || '其他';

    let file: File;
    let fileName: string;
    let fileType: string;

    if (fileUrl) {
      // Supabase Storage: download from URL
      const response = await fetch(fileUrl);
      if (!response.ok) {
        return NextResponse.json({ error: '文件下载失败' }, { status: 400 });
      }
      const fileBuffer = await response.arrayBuffer();
      const urlParts = fileUrl.split('/');
      fileName = decodeURIComponent(urlParts[urlParts.length - 1].replace(/^\d+-\w+-/, ''));
      fileType = response.headers.get('content-type') || 'application/octet-stream';
      file = new File([fileBuffer], fileName, { type: fileType });
    } else if (uploadId) {
      // Chunked upload - read assembled file from disk
      const { readFile: fsReadFile, readdir } = await import('fs/promises');
      const { existsSync } = await import('fs');
      const pathMod = await import('path');
      const uploadsDir = pathMod.default.join(process.cwd(), 'tmp', 'uploads');
      if (!existsSync(uploadsDir)) {
        return NextResponse.json({ error: '文件不存在或已过期' }, { status: 400 });
      }
      const files = await readdir(uploadsDir);
      const matchFile = files.find(f => f.startsWith(uploadId + '_'));
      if (!matchFile) {
        return NextResponse.json({ error: '文件不存在或已过期，请重新上传' }, { status: 400 });
      }
      const filePath = pathMod.default.join(uploadsDir, matchFile);
      const fileBuffer = await fsReadFile(filePath);
      fileName = matchFile.substring(uploadId.length + 1);
      fileType = 'application/octet-stream';
      file = new File([fileBuffer], fileName, { type: fileType });
      const { unlink } = await import('fs/promises');
      await unlink(filePath).catch(() => {});
    } else {
      // Direct upload mode
      file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json({ error: '请选择文件' }, { status: 400 });
      }
      fileName = file.name;
      fileType = file.type;

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `文件大小超过限制（最大 ${MAX_FILE_SIZE / 1024 / 1024}MB）` },
          { status: 400 }
        );
      }

      if (ALLOWED_TYPES.length > 0 && !ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: '不支持的文件类型' },
          { status: 400 }
        );
      }
    }

    // 解析文件
    const parsed = await parseFile(file);

    // 保存到知识库
    const item = await prisma.knowledgeItem.create({
      data: {
        userId: session.user.id,
        title: parsed.title || fileName,
        category,
        content: parsed.content || '',
        tags: JSON.stringify([fileName]),
        fileType: fileType || 'unknown',
        fileName: fileName,
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
