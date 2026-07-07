'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
import {
  Search,
  BookOpen,
  Eye,
  Clock,
  Tag,
  TrendingUp,
  Scale,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Bookmark,
  Filter,
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  category: string;
  summary: string;
  tags: string[];
  views: number;
  coverImage: string | null;
  author: string;
  date: string;
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
  '法规解读': {
    bg: 'bg-[#7c3aed]/15',
    text: 'text-[#a78bfa]',
    gradient: 'from-[#7c3aed] to-[#6d28d9]',
  },
  '废标案例': {
    bg: 'bg-[#ef4444]/15',
    text: 'text-[#f87171]',
    gradient: 'from-[#ef4444] to-[#dc2626]',
  },
  '决策推演': {
    bg: 'bg-[#06b6d4]/15',
    text: 'text-[#22d3ee]',
    gradient: 'from-[#06b6d4] to-[#0891b2]',
  },
  '行业洞察': {
    bg: 'bg-[#10b981]/15',
    text: 'text-[#34d399]',
    gradient: 'from-[#10b981] to-[#059669]',
  },
  '技术趋势': {
    bg: 'bg-[#f59e0b]/15',
    text: 'text-[#fbbf24]',
    gradient: 'from-[#f59e0b] to-[#d97706]',
  },
};

const COVER_GRADIENTS = [
  'from-[#7c3aed] to-[#06b6d4]',
  'from-[#06b6d4] to-[#10b981]',
  'from-[#f59e0b] to-[#ef4444]',
  'from-[#10b981] to-[#7c3aed]',
  'from-[#ef4444] to-[#7c3aed]',
];

export default function ThinktankPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/thinktank?${params}`);
      const data = await res.json();
      if (res.ok) {
        setArticles(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, debouncedSearch]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const getCategoryStyle = (category: string) =>
    CATEGORY_STYLES[category] || {
      bg: 'bg-[#6b7280]/15',
      text: 'text-[#9ca3af]',
      gradient: 'from-[#6b7280] to-[#4b5563]',
    };

  return (
    <div className="flex h-screen bg-[#0A0A12]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-8 h-16 border-b border-[#2e2e42] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">招投标智库</h1>
              <p className="text-xs text-[#6b7280] -mt-0.5">行业专家文章与决策洞察</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#6b7280]">
            <Bookmark className="w-4 h-4" />
            <span>只读模式</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar">
          <div className="max-w-6xl mx-auto">
            {/* Hero Banner */}
            <div className="relative mb-8 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed]/20 via-[#06b6d4]/20 to-[#7c3aed]/20" />
              <div className="absolute inset-0 bg-[#0A0A12]/60" />
              <div className="relative px-8 py-10">
                <h2 className="text-2xl font-bold text-white mb-2">
                  深度洞察，精准决策
                </h2>
                <p className="text-[#9ca3af] max-w-xl">
                  汇集行业专家对招投标法规、废标风险、决策模型与前沿趋势的深度解读，
                  助您在投标竞争中抢占先机。
                </p>
                <div className="flex items-center gap-4 mt-5">
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                    const style = getCategoryStyle(cat.label);
                    return (
                      <div key={cat.id} className="flex items-center gap-1.5 text-xs">
                        <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${style.gradient}`} />
                        <span className="text-[#9ca3af]">{cat.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1 mb-6 border-b border-[#2e2e42] overflow-x-auto scrollbar pb-0">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`tab-btn flex items-center gap-1.5 ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
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
                className="input-field pl-11"
              />
            </div>

            {/* Articles Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-[#6b7280] text-sm">加载文章中...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center py-20">
                <BookOpen className="h-12 w-12 text-[#6b7280] mb-4" />
                <p className="text-[#6b7280]">暂无文章</p>
                <p className="text-sm text-[#4b5563] mt-1">调整筛选条件查看更多内容</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {articles.map((article, index) => {
                  const style = getCategoryStyle(article.category);
                  const coverGradient = COVER_GRADIENTS[index % COVER_GRADIENTS.length];
                  return (
                    <article
                      key={article.id}
                      className="glass-card overflow-hidden group cursor-pointer"
                    >
                      {/* Cover Image Placeholder */}
                      <div className="relative h-40 overflow-hidden">
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${coverGradient} opacity-30`}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-2xl bg-[#0A0A12]/60 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                            <BookOpen className="w-7 h-7 text-white/60" />
                          </div>
                        </div>
                        <div className="absolute top-3 left-3">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}
                          >
                            {React.createElement(
                              CATEGORIES.find((c) => c.label === article.category)?.icon || Filter,
                              { className: 'w-3 h-3' }
                            )}
                            {article.category}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-white/70 bg-[#0A0A12]/50 backdrop-blur-sm rounded-full px-2 py-1">
                          <Eye className="w-3 h-3" />
                          {article.views.toLocaleString()}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-semibold text-white line-clamp-2 mb-2 group-hover:text-[#a78bfa] transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-sm text-[#6b7280] line-clamp-2 mb-4">
                          {article.summary}
                        </p>

                        {/* Tags */}
                        {article.tags && article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {article.tags.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 text-[11px] text-[#9ca3af] bg-[#2a2a3c] rounded-md px-2 py-0.5"
                              >
                                <Tag className="w-2.5 h-2.5" />
                                {tag}
                              </span>
                            ))}
                            {article.tags.length > 3 && (
                              <span className="text-[11px] text-[#6b7280] bg-[#2a2a3c] rounded-md px-2 py-0.5">
                                +{article.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-[#4b5563] pt-3 border-t border-[#2e2e42]">
                          <span>{article.author}</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(article.date).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
