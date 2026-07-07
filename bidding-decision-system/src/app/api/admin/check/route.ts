import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 检查管理员权限
export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  
  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json({ 
    authorized: true, 
    user: { 
      id: result.user.id, 
      email: result.user.email, 
      role: result.user.role 
    } 
  });
}
