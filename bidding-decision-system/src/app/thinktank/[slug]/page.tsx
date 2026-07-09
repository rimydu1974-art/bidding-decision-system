import { cache } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Clock, Eye, Tag, Home, ChevronRight, TrendingUp, Scale, AlertTriangle, Lightbulb, Cpu, Filter } from 'lucide-react';
import prisma from '@/lib/db';
import type { Metadata } from 'next';

const CATEGORY_STYLES: Record<string, { bg: string; text: string; gradient: string }> = {
  '法规解读': { bg: 'bg-[#7c3aed]/15', text: 'text-[#a78bfa]', gradient: 'from-[#7c3aed] to-[#6d28d9]' },
  '废标案例': { bg: 'bg-[#ef4444]/15', text: 'text-[#f87171]', gradient: 'from-[#ef4444] to-[#dc2626]' },
  '决策推演': { bg: 'bg-[#06b6d4]/15', text: 'text-[#22d3ee]', gradient: 'from-[#06b6d4] to-[#0891b2]' },
  '行业洞察': { bg: 'bg-[#10b981]/15', text: 'text-[#34d399]', gradient: 'from-[#10b981] to-[#059669]' },
  '技术趋势': { bg: 'bg-[#f59e0b]/15', text: 'text-[#fbbf24]', gradient: 'from-[#f59e0b] to-[#d97706]' },
};

const CATEGORY_ICONS: Record<string, typeof Filter> = {
  '法规解读': Scale,
  '废标案例': AlertTriangle,
  '决策推演': Lightbulb,
  '行业洞察': TrendingUp,
  '技术趋势': Cpu,
};

const COVER_GRADIENTS = [
  'from-[#7c3aed] to-[#06b6d4]',
  'from-[#06b6d4] to-[#10b981]',
  'from-[#f59e0b] to-[#ef4444]',
  'from-[#10b981] to-[#7c3aed]',
  'from-[#ef4444] to-[#7c3aed]',
];

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
  if (!article) return { title: '文章不存在' };

  const ogImageUrl = `https://www.opencheck.com.cn/api/og?title=${encodeURIComponent(article.title)}&category=${encodeURIComponent(article.category)}`;

  return {
    title: `${article.title} - 招投标智库 | OpenCheck`,
    description: article.summary || article.title,
    openGraph: {
      title: article.title,
      description: article.summary || '',
      type: 'article',
      publishedTime: article.createdAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary || '',
      images: [ogImageUrl],
    },
  };
}

const SITE_URL = 'https://www.opencheck.com.cn';

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const style = CATEGORY_STYLES[article.category] || { bg: 'bg-[#6b7280]/15', text: 'text-[#9ca3af]', gradient: 'from-[#6b7280] to-[#4b5563]' };
  const IconComponent = CATEGORY_ICONS[article.category] || Filter;
  const tags: string[] = (() => { try { return JSON.parse(article.tags); } catch { return []; } })();
  const related = await getRelatedArticles(article.category, article.slug);

  const articleUrl = `${SITE_URL}/thinktank/${article.slug}`;
  const blogPostingLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.summary || article.title,
    datePublished: article.createdAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    keywords: tags.join(', '),
    author: { '@type': 'Organization', name: '投标AI', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'OpenCheck', url: SITE_URL },
    url: articleUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首页', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: '招投标智库', item: `${SITE_URL}/thinktank` },
      { '@type': 'ListItem', position: 3, name: article.category, item: `${SITE_URL}/thinktank?category=${encodeURIComponent(article.category)}` },
      { '@type': 'ListItem', position: 4, name: article.title },
    ],
  };

  // Extract steps from content for HowTo schema
  const stepMatches = article.content.match(/<h[23][^>]*>([^<]*(?:步|Step|STEP)[^<]*)<\/h[23]>/gi);
  const howToLd = stepMatches && stepMatches.length >= 2 ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: article.title,
    step: stepMatches.slice(0, 8).map((m: string, i: number) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: m.replace(/<\/?h[23][^>]*>/gi, '').trim(),
    })),
  } : null;

  const formatDate = (d: Date | string) => {
    try { return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return String(d); }
  };

  return (
    <div className="min-h-screen bg-[#0A0A12] text-white">
      {/* JSON-LD structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {howToLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />}

      <main className="mx-auto max-w-3xl px-4 sm:px-8 pb-16">
        {/* Breadcrumb */}
        <nav aria-label="面包屑导航" className="flex items-center gap-2 text-sm text-[#6b7280] mt-8 mb-6 flex-wrap">
          <Link href="/" className="hover:text-white transition-colors inline-flex items-center gap-1">
            <Home className="w-3.5 h-3.5" /> 首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/thinktank" className="hover:text-white transition-colors">
            招投标智库
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#9ca3af]">{article.category}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white truncate max-w-[200px]">{article.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${style.bg} ${style.text}`}>
              <IconComponent className="w-3.5 h-3.5" />{article.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 leading-tight">{article.title}</h1>
          {article.summary && (
            <p className="text-lg text-[#9ca3af] mb-4">{article.summary}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-[#4b5563]">
            <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(article.createdAt)}</div>
            <div className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{(article.views + 1).toLocaleString()} 阅读</div>
          </div>
        </header>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {tags.map((tag: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs text-[#9ca3af] bg-[#1a1a2e] border border-[#2e2e42] rounded-md px-2.5 py-1">
                <Tag className="w-3 h-3" />{tag}
              </span>
            ))}
          </div>
        )}

        {/* Article Content */}
        <article className="prose prose-invert prose-lg max-w-none
          prose-headings:text-white prose-headings:font-bold
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-[#d1d5db] prose-p:leading-relaxed
          prose-strong:text-white prose-strong:font-semibold
          prose-a:text-[#a78bfa] prose-a:no-underline hover:prose-a:text-[#7c3aed]
          prose-li:text-[#d1d5db] prose-li:leading-relaxed
          prose-code:text-[#22d3ee] prose-code:bg-[#1a1a2e] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-[#1a1a2e] prose-pre:border prose-pre:border-[#2e2e42]
          prose-blockquote:border-l-[#7c3aed] prose-blockquote:text-[#9ca3af]
          prose-hr:border-[#2e2e42]
          prose-img:rounded-xl"
        >
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>

        {/* Related Articles */}
        {related.length > 0 && (
          <section className="mt-12 pt-8 border-t border-[#2e2e42]">
            <h2 className="text-xl font-bold text-white mb-6">相关文章</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((ra, i) => {
                const rs = CATEGORY_STYLES[ra.category] || style;
                const cgi = COVER_GRADIENTS[i % COVER_GRADIENTS.length];
                const ri = CATEGORY_ICONS[ra.category] || Filter;
                return (
                  <Link key={ra.id} href={`/thinktank/${ra.slug}`}
                    className="rounded-xl border border-[#2e2e42] bg-[#0f0f1a]/60 hover:border-[#7c3aed]/40 transition-all overflow-hidden group"
                  >
                    <div className={`h-2 bg-gradient-to-r ${cgi}`} />
                    <div className="p-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${rs.bg} ${rs.text} mb-2`}>
                        {ri({ className: 'w-2.5 h-2.5' })} {ra.category}
                      </span>
                      <h3 className="text-sm font-semibold text-white line-clamp-2 mb-2 group-hover:text-[#a78bfa] transition-colors">
                        {ra.title}
                      </h3>
                      <div className="flex items-center justify-between text-[10px] text-[#4b5563]">
                        <span>{formatDate(ra.createdAt)}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{ra.views}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-[#7c3aed]/10 to-[#06b6d4]/10 border border-[#2e2e42]">
          <p className="text-sm text-[#9ca3af] text-center">
            本文由 <span className="text-white font-medium">投标AI</span> 整理发布 |
            <Link href="/" className="text-[#a78bfa] hover:text-white ml-1 transition-colors">体验智能投标决策工具 →</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
