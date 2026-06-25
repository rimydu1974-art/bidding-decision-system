import { NextRequest, NextResponse } from 'next/server';

// 不需要登录的路径（首页需要登录）
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/pricing',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/pricing',
  '/api/payment/callback',
  '/api/test',
];

// 静态资源和特殊路径
const staticPaths = [
  '/_next',
  '/favicon.ico',
  '/sitemap.ts',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静态资源直接放行
  if (staticPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 公开路径直接放行
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next();
  }

  // 检查认证token
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    // API请求返回401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    // 页面请求重定向到登录页
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
