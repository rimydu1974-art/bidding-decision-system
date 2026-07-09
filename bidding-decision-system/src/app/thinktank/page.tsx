import { BookOpen } from 'lucide-react';
import prisma from '@/lib/db';
import { ThinktankFilters } from './components/ThinktankFilters';

export const dynamic = 'force-dynamic';

const CATEGORY_STYLES: Record<string, { bg: string; text: string; gradient: string }> = {
  '法规解读': { bg: 'bg-[#7c3aed]/15', text: 'text-[#a78bfa]', gradient: 'from-[#7c3aed] to-[#6d28d9]' },
  '废标案例': { bg: 'bg-[#ef4444]/15', text: 'text-[#f87171]', gradient: 'from-[#ef4444] to-[#dc2626]' },
  '决策推演': { bg: 'bg-[#06b6d4]/15', text: 'text-[#22d3ee]', gradient: 'from-[#06b6d4] to-[#0891b2]' },
  '行业洞察': { bg: 'bg-[#10b981]/15', text: 'text-[#34d399]', gradient: 'from-[#10b981] to-[#059669]' },
  '技术趋势': { bg: 'bg-[#f59e0b]/15', text: 'text-[#fbbf24]', gradient: 'from-[#f59e0b] to-[#d97706]' },
};

const COVER_GRADIENTS = [
  'from-[#7c3aed] to-[#06b6d4]',
  'from-[#06b6d4] to-[#10b981]',
  'from-[#f59e0b] to-[#ef4444]',
  'from-[#10b981] to-[#7c3aed]',
  'from-[#ef4444] to-[#7c3aed]',
];

export default async function ThinktankPage() {
  const articles = await prisma.thinkTankArticle.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, slug: true, category: true, summary: true,
      tags: true, views: true, coverImage: true, createdAt: true, updatedAt: true,
    },
  });

  const mappedArticles = articles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    category: a.category,
    summary: a.summary || '',
    tags: (() => { try { return JSON.parse(a.tags); } catch { return []; } })(),
    views: a.views,
    coverImage: a.coverImage,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#0A0A12] text-white">
      <main className="mx-auto max-w-6xl px-4 sm:px-8 pb-16">
        <header className="flex items-center justify-between pt-8 pb-4 border-b border-[#2e2e42]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">招投标智库</h1>
              <p className="text-xs text-[#6b7280] -mt-0.5">行业专家文章与决策洞察</p>
            </div>
          </div>
        </header>

        <div className="relative mb-8 mt-6 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed]/20 via-[#06b6d4]/20 to-[#7c3aed]/20" />
          <div className="absolute inset-0 bg-[#0A0A12]/60" />
          <div className="relative px-8 py-10">
            <h2 className="text-2xl font-bold text-white mb-2">深度洞察，精准决策</h2>
            <p className="text-[#9ca3af] max-w-xl">
              汇集行业专家对招投标法规、废标风险、决策模型与前沿趋势的深度解读，助您在投标竞争中抢占先机。
            </p>
            <div className="flex items-center gap-4 mt-5">
              {Object.entries(CATEGORY_STYLES).map(([label, style]) => (
                <div key={label} className="flex items-center gap-1.5 text-xs">
                  <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${style.gradient}`} />
                  <span className="text-[#9ca3af]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ThinktankFilters initialArticles={mappedArticles} coverGradients={COVER_GRADIENTS} />
      </main>
    </div>
  );
}
