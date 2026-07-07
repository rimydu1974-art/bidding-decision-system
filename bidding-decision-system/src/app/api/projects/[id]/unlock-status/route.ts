import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ unlocked: false });
    }

    const session = await validateSession(token);
    if (!session) {
      return NextResponse.json({ unlocked: false });
    }

    const { id: projectId } = await params;

    const unlock = await prisma.projectUnlock.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId,
        },
      },
    });

    return NextResponse.json({ unlocked: !!unlock });
  } catch (error) {
    console.error('Check unlock status error:', error);
    return NextResponse.json({ unlocked: false });
  }
}
