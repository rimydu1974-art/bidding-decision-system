import { cache } from 'react';
import prisma from '@/lib/db';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

const getArticle = cache(async (slug: string) => {
  const article = await prisma.thinkTankArticle.findUnique({ where: { slug } });
  if (!article || !article.isPublished) return null;
  return article;
});

const getRelatedArticles = cache(async (category: string, excludeSlug: string) => {
  return prisma.thinkTankArticle.findMany({
    where: { category, isPublished: true, slug: { not: excludeSlug } },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { id: true, title: true, slug: true, category: true, summary: true, views: true, createdAt: true },
  });
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
  const related = await getRelatedArticles(article.category, article.slug);
  return <div><h1>{article.title}</h1><p>{article.slug}</p><p>Related: {related.length}</p></div>;
}
