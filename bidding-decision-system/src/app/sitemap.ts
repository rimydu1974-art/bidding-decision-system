import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.opencheck.com.cn';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/thinktank`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/tools/fei-biao-jian-cha`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/tools/ping-fen-ji-suan`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/tools/zi-zhi-he-dui`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/tools/biao-shu-sheng-cheng`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  // Fetch articles via API instead of Prisma directly (avoids build-time DB connection issues)
  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${baseUrl}/api/thinktank?pageSize=500`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      articleRoutes = (data.items || []).map((a: { slug: string; updatedAt: string }) => ({
        url: `${baseUrl}/thinktank/${a.slug}`,
        lastModified: new Date(a.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error('sitemap: failed to fetch thinktank articles', err);
  }

  return [...staticRoutes, ...articleRoutes];
}
