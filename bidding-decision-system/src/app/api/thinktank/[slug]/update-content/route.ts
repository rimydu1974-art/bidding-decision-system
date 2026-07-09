import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Temporary admin endpoint for content updates — delete after use
export async function PATCH(req: NextRequest) {
  const { slug, content } = await req.json();
  if (!slug || !content) return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  await prisma.thinkTankArticle.update({ where: { slug }, data: { content } });
  return NextResponse.json({ ok: true });
}
