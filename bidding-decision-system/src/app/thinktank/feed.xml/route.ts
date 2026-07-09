import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const articles = await prisma.thinkTankArticle.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { title: true, slug: true, category: true, summary: true, createdAt: true },
  });

  const siteUrl = 'https://www.opencheck.com.cn';
  const items = articles.map((a) => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${siteUrl}/thinktank/${a.slug}</link>
      <description><![CDATA[${a.summary || a.title}]]></description>
      <category>${a.category}</category>
      <pubDate>${new Date(a.createdAt).toUTCString()}</pubDate>
      <guid isPermaLink="true">${siteUrl}/thinktank/${a.slug}</guid>
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>OpenCheck 招投标智库</title>
    <link>${siteUrl}/thinktank</link>
    <description>AI驱动的投标决策与标书生成平台。深度解读招投标法规、复盘废标案例、分享决策框架与行业趋势。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/thinktank/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
