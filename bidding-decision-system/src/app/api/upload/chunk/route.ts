import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile, readdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { validateSession, getTokenFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CHUNK_DIR = path.join(process.cwd(), 'tmp', 'chunks');
const MAX_CHUNK_SIZE = 4 * 1024 * 1024; // 4MB per chunk (safe under Vercel limit)
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max
const UPLOAD_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

async function ensureChunkDir() {
  if (!existsSync(CHUNK_DIR)) {
    await mkdir(CHUNK_DIR, { recursive: true });
  }
}

function getChunkDir(uploadId: string) {
  if (!/^[\w-]+$/.test(uploadId)) throw new Error('Invalid upload ID');
  return path.join(CHUNK_DIR, uploadId);
}

async function cleanupChunkDir(uploadId: string) {
  const dir = getChunkDir(uploadId);
  if (existsSync(dir)) {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
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

    const formData = await request.formData();
    const uploadId = formData.get('uploadId') as string;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string, 10);
    const totalChunks = parseInt(formData.get('totalChunks') as string, 10);
    const fileName = formData.get('fileName') as string;
    const fileSize = parseInt(formData.get('fileSize') as string, 10);
    const chunk = formData.get('chunk') as File;

    if (!uploadId || isNaN(chunkIndex) || isNaN(totalChunks) || !fileName || !chunk) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过100MB' }, { status: 400 });
    }

    if (chunk.size > MAX_CHUNK_SIZE + 1024) {
      return NextResponse.json({ error: '分片大小异常' }, { status: 400 });
    }

    await ensureChunkDir();
    const chunkDir = getChunkDir(uploadId);
    if (!existsSync(chunkDir)) {
      await mkdir(chunkDir, { recursive: true });
    }

    // Write metadata on first chunk
    if (chunkIndex === 0) {
      const meta = { fileName, fileSize, totalChunks, userId: session.user.id, createdAt: Date.now() };
      await writeFile(path.join(chunkDir, '_meta.json'), JSON.stringify(meta));
    }

    // Check metadata consistency
    const metaPath = path.join(chunkDir, '_meta.json');
    if (existsSync(metaPath)) {
      const meta = JSON.parse(await readFile(metaPath, 'utf-8'));
      if (meta.fileName !== fileName || meta.totalChunks !== totalChunks) {
        return NextResponse.json({ error: '分片参数不一致' }, { status: 400 });
      }
      // Check expiry
      if (Date.now() - meta.createdAt > UPLOAD_EXPIRY_MS) {
        await cleanupChunkDir(uploadId);
        return NextResponse.json({ error: '上传已过期，请重试' }, { status: 410 });
      }
    }

    // Write chunk
    const buffer = Buffer.from(await chunk.arrayBuffer());
    await writeFile(path.join(chunkDir, `chunk_${String(chunkIndex).padStart(6, '0')}`), buffer);

    console.log(`[Chunk] Received chunk ${chunkIndex + 1}/${totalChunks} for ${fileName} (uploadId: ${uploadId})`);

    // Check if all chunks received
    const files = await readdir(chunkDir);
    const chunkFiles = files.filter(f => f.startsWith('chunk_'));

    if (chunkFiles.length === totalChunks) {
      // All chunks received - assemble file
      console.log(`[Chunk] All ${totalChunks} chunks received, assembling...`);
      const assembledChunks: Buffer[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(chunkDir, `chunk_${String(i).padStart(6, '0')}`);
        assembledChunks.push(await readFile(chunkPath));
      }
      const assembledBuffer = Buffer.concat(assembledChunks);
      const outputDir = path.join(process.cwd(), 'tmp', 'uploads');
      if (!existsSync(outputDir)) {
        await mkdir(outputDir, { recursive: true });
      }
      const assembledPath = path.join(outputDir, `${uploadId}_${fileName}`);
      await writeFile(assembledPath, assembledBuffer);

      console.log(`[Chunk] Assembled file: ${assembledPath} (${assembledBuffer.length} bytes)`);

      // Cleanup chunks
      await cleanupChunkDir(uploadId);

      return NextResponse.json({
        complete: true,
        uploadId,
        fileName,
        fileSize: assembledBuffer.length,
        filePath: assembledPath,
      });
    }

    return NextResponse.json({
      complete: false,
      received: chunkFiles.length,
      total: totalChunks,
    });
  } catch (error) {
    console.error('[Chunk] Error:', error);
    return NextResponse.json({ error: '分片上传失败' }, { status: 500 });
  }
}
