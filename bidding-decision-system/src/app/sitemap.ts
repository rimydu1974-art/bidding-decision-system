import { MetadataRoute } from 'next';
import prisma from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.opencheck.com.cn';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/thinktank`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const articles = await prisma.thinkTankArticle.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    });
    articleRoutes = articles.map((a) => ({
      url: `${baseUrl}/thinktank/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch (err) {
    console.error('sitemap: failed to fetch thinktank articles', err);
  }

  return [...staticRoutes, ...articleRoutes];
}
