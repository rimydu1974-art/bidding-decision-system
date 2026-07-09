import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Clock, Eye, Tag, ArrowLeft, TrendingUp, Scale, AlertTriangle, Lightbulb, Cpu, Filter } from 'lucide-react';
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

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  const article = await prisma.thinkTankArticle.findUnique({
    where: { slug },
  });
  if (!article || !article.isPublished) return null;
  // Increment views async (fire-and-forget)
  prisma.thinkTankArticle.update({ where: { slug }, data: { views: { increment: 1 } } }).catch(() => {});
  return article;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: '文章不存在' };
  return {
    title: `${article.title} - 招投标智库 | OpenCheck`,
    description: article.summary || article.title,
    openGraph: {
      title: article.title,
      description: article.summary || '',
      type: 'article',
      publishedTime: article.createdAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const style = CATEGORY_STYLES[article.category] || { bg: 'bg-[#6b7280]/15', text: 'text-[#9ca3af]', gradient: 'from-[#6b7280] to-[#4b5563]' };
  const IconComponent = CATEGORY_ICONS[article.category] || Filter;
  const tags: string[] = (() => { try { return JSON.parse(article.tags); } catch { return []; } })();

  return (
    <div className="min-h-screen bg-[#0A0A12] text-white">
      <main className="mx-auto max-w-3xl px-4 sm:px-8 pb-16">
        {/* Back link */}
        <Link href="/thinktank" className="inline-flex items-center gap-2 text-sm text-[#6b7280] hover:text-white mt-8 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回智库
        </Link>

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
            <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(article.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
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
          {/* Render content as HTML. If it's markdown, consider using a markdown renderer instead */}
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>

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
