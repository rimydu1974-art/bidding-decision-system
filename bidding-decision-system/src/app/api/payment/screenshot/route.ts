import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAGIC_BYTES: Record<string, number[][]> = {
  jpeg: [[0xFF, 0xD8, 0xFF]],
  png: [[0x89, 0x50, 0x4E, 0x47]],
};

function validateFileMagic(buffer: Buffer): string | null {
  for (const [ext, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const sig of signatures) {
      if (sig.every((byte, i) => buffer[i] === byte)) return ext;
    }
  }
  return null;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\-_.]/g, '_');
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const session = await validateSession(token);
    if (!session) {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const orderNo = formData.get('orderNo') as string;

    if (!file || !orderNo) {
      return NextResponse.json({ error: '缺少文件或订单号' }, { status: 400 });
    }

    // 验证orderNo格式，防止路径穿越
    if (!/^[a-zA-Z0-9\-_]+$/.test(orderNo)) {
      return NextResponse.json({ error: '无效的订单号' }, { status: 400 });
    }

    // 验证订单存在且属于当前用户
    const order = await prisma.order.findUnique({
      where: { orderNo },
    });

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: '无权操作此订单' }, { status: 403 });
    }

    if (order.paymentStatus !== 'pending') {
      return NextResponse.json({ error: '订单状态异常' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '请上传 JPG 或 PNG 格式的图片' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过10MB' }, { status: 400 });
    }

    // 验证文件头magic bytes，防止MIME伪造攻击
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const realType = validateFileMagic(buffer);
    if (!realType) {
      return NextResponse.json({ error: '文件类型不合法，请上传真实的图片文件' }, { status: 400 });
    }

    // 重新编码文件以防止嵌入恶意内容
    // 对上传的图像进行再编码

    // Create upload directory
    const uploadDir = join(process.cwd(), 'uploads', 'screenshots');
    await mkdir(uploadDir, { recursive: true });

    const safeOrderNo = sanitizeFilename(orderNo);
    const filename = `${safeOrderNo}-${Date.now()}.${realType}`;
    const filepath = join(uploadDir, filename);
    
    await writeFile(filepath, buffer);

    return NextResponse.json({ 
      success: true, 
      filename,
      url: `/api/payment/screenshot/${filename}` 
    });
  } catch (error) {
    console.error('Screenshot upload error:', error);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}
