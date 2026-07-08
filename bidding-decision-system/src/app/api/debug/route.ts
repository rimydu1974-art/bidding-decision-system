import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      userCount,
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^@]+@/, ':***@'),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^@]+@/, ':***@'),
    }, { status: 500 });
  }
}
