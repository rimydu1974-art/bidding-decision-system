import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    AI_PROVIDER: process.env.AI_PROVIDER || '(not set)',
    DOUBAO_API_KEY: process.env.DOUBAO_API_KEY ? `set (${process.env.DOUBAO_API_KEY.substring(0, 10)}...)` : '(not set)',
    DOUBAO_MODEL: process.env.DOUBAO_MODEL || '(not set)',
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? 'set' : '(not set)',
    TONGYI_API_KEY: process.env.TONGYI_API_KEY ? 'set' : '(not set)',
  });
}
