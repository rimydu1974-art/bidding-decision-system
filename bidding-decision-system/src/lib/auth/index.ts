import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV !== 'development') {
  console.error('[Auth] JWT_SECRET 环境变量未设置，生产环境启动失败');
}
const SESSION_SECRET = JWT_SECRET || crypto.randomBytes(32).toString('hex');

// 管理员邮箱列表（仅从环境变量读取，开发环境可设置 ADMIN_EMAILS 逗号分隔）
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verify;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return session;
}

export async function validateSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session;
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export function getTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    return cookies['auth-token'] || null;
  }
  return null;
}

// 检查是否为管理员邮箱
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// 认证中间件：验证用户登录
export async function requireAuth(request: NextRequest): Promise<{
  user: { id: string; email: string; role: string; [key: string]: unknown };
} | NextResponse> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const session = await validateSession(token);
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  return { user: session.user as { id: string; email: string; role: string; [key: string]: unknown } };
}

// 管理员中间件：验证管理员权限
export async function requireAdmin(request: NextRequest): Promise<{
  user: { id: string; email: string; role: string; [key: string]: unknown };
} | NextResponse> {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // 检查角色或邮箱
  if (user.role !== 'admin' && !isAdminEmail(user.email)) {
    return NextResponse.json({ error: '无管理员权限' }, { status: 403 });
  }

  return { user };
}
