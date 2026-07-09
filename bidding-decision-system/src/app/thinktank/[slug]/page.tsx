import { cache } from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

const getArticle = cache(async (slug: string) => {
  const article = await prisma.thinkTankArticle.findUnique({ where: { slug } });
  if (!article || !article.isPublished) return null;
  prisma.thinkTankArticle.update({ where: { slug }, data: { views: { increment: 1 } } }).catch(() => {});
  return article;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: 'Not Found' };
  return { title: article.title, description: article.summary || '' };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  return <div><h1>{article.title}</h1><p>{article.slug}</p></div>;
}
