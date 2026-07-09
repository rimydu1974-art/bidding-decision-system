'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, BookOpen, Eye, Clock, Tag, Filter, TrendingUp, Scale, AlertTriangle, Lightbulb, Cpu } from 'lucide-react';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  tags: string[];
  views: number;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { id: 'all', label: '全部', icon: Filter },
  { id: '法规解读', label: '法规解读', icon: Scale },
  { id: '废标案例', label: '废标案例', icon: AlertTriangle },
  { id: '决策推演', label: '决策推演', icon: Lightbulb },
  { id: '行业洞察', label: '行业洞察', icon: TrendingUp },
  { id: '技术趋势', label: '技术趋势', icon: Cpu },
];

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

function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] || { bg: 'bg-[#6b7280]/15', text: 'text-[#9ca3af]', gradient: 'from-[#6b7280] to-[#4b5563]' };
}

interface Props {
  initialArticles: Article[];
  coverGradients: string[];
}

export function ThinktankFilters({ initialArticles, coverGradients }: Props) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedCategory === 'all' && !debouncedSearch) {
      setArticles(initialArticles);
      setLoading(false);
      return;
    }
    loadArticles();
  }, [selectedCategory, debouncedSearch]);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/thinktank?${params}`);
      const data = await res.json();
      if (res.ok) {
        setArticles((data.items || []).map((item: Article) => ({
          ...item,
          tags: Array.isArray(item.tags) ? item.tags : typeof item.tags === 'string' ? JSON.parse(item.tags || '[]') : [],
        })));
      }
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, debouncedSearch]);

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('zh-CN'); } catch { return dateStr; }
  };

  return (
    <>
      {/* Category Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-[#2e2e42] overflow-x-auto pb-0">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg transition-colors ${
                isActive
                  ? 'text-white border-b-2 border-[#7c3aed] bg-[#7c3aed]/10'
                  : 'text-[#6b7280] hover:text-white hover:bg-[#2a2a3c]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />{cat.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
        <input
          type="text"
          placeholder="搜索文章标题、摘要、标签..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#1a1a2e] border border-[#2e2e42] rounded-xl px-4 py-3 pl-11 text-white placeholder-[#6b7280] focus:outline-none focus:border-[#7c3aed] transition-colors"
        />
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-[#6b7280] text-sm">加载文章中...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-[#2e2e42] bg-[#0f0f1a]/60">
          <BookOpen className="h-12 w-12 text-[#6b7280] mb-4" />
          <p className="text-[#6b7280]">暂无文章</p>
          <p className="text-sm text-[#4b5563] mt-1">调整筛选条件查看更多内容</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article, index) => {
            const style = getCategoryStyle(article.category);
            const coverGradient = coverGradients[index % coverGradients.length];
            const tags = article.tags || [];
            return (
              <Link key={article.id} href={`/thinktank/${article.slug}`} className="glass-card overflow-hidden group cursor-pointer rounded-2xl border border-[#2e2e42] bg-[#0f0f1a]/60 hover:border-[#7c3aed]/40 transition-all">
                <div className="relative h-40 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${coverGradient} opacity-30`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#0A0A12]/60 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                      <BookOpen className="w-7 h-7 text-white/60" />
                    </div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
                      {React.createElement(CATEGORY_ICONS[article.category] || Filter, { className: 'w-3 h-3' })}
                      {article.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-white/70 bg-[#0A0A12]/50 backdrop-blur-sm rounded-full px-2 py-1">
                    <Eye className="w-3 h-3" />
                    {article.views.toLocaleString()}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-white line-clamp-2 mb-2 group-hover:text-[#a78bfa] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-[#6b7280] line-clamp-2 mb-4">{article.summary}</p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {tags.slice(0, 3).map((tag: string, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[11px] text-[#9ca3af] bg-[#2a2a3c] rounded-md px-2 py-0.5">
                          <Tag className="w-2.5 h-2.5" />{tag}
                        </span>
                      ))}
                      {tags.length > 3 && (
                        <span className="text-[11px] text-[#6b7280] bg-[#2a2a3c] rounded-md px-2 py-0.5">+{tags.length - 3}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-[#4b5563] pt-3 border-t border-[#2e2e42]">
                    <span>投标AI</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(article.createdAt)}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
