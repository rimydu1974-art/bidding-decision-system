import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const article = await prisma.thinkTankArticle.findUnique({ where: { slug } });
    if (!article) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ ok: true, title: article.title, slug: article.slug, contentLen: article.content.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
