'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
import {
  Search,
  Eye,
  Clock,
  X,
  FileText,
  Scale,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RegulationItem {
  id: string;
  title: string;
  region: string;
  category: string;
  publishDate: string;
  views: number;
  summary: string;
  content: string;
  createdAt: string;
}

const REGIONS = [
  '全部',
  '全国',
  '北京',
  '上海',
  '广东',
  '浙江',
  '江苏',
  '四川',
  '湖北',
  '其他',
];

const CATEGORIES = [
  '全部',
  '法律',
  '行政法规',
  '部门规章',
  '地方性法规',
  '规范性文件',
  '其他',
];

const REGION_BADGES: Record<string, string> = {
  '全国': 'bg-blue-500/20 text-blue-400',
  '北京': 'bg-red-500/20 text-red-400',
  '上海': 'bg-amber-500/20 text-amber-400',
  '广东': 'bg-emerald-500/20 text-emerald-400',
  '浙江': 'bg-cyan-500/20 text-cyan-400',
  '江苏': 'bg-purple-500/20 text-purple-400',
  '四川': 'bg-pink-500/20 text-pink-400',
  '湖北': 'bg-orange-500/20 text-orange-400',
};

const CATEGORY_BADGES: Record<string, string> = {
  '法律': 'bg-indigo-500/20 text-indigo-400',
  '行政法规': 'bg-violet-500/20 text-violet-400',
  '部门规章': 'bg-fuchsia-500/20 text-fuchsia-400',
  '地方性法规': 'bg-teal-500/20 text-teal-400',
  '规范性文件': 'bg-sky-500/20 text-sky-400',
  '其他': 'bg-gray-500/20 text-gray-400',
};

export default function RegulationsPage() {
  const [regulations, setRegulations] = useState<RegulationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('全部');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadRegulations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRegion !== '全部') params.set('region', selectedRegion);
      if (selectedCategory !== '全部') params.set('category', selectedCategory);
      if (searchQuery) params.set('search', searchQuery);
      params.set('page', String(page));
      params.set('pageSize', '10');
      const res = await fetch(`/api/regulations?${params}`);
      const data = await res.json();
      if (res.ok) {
        setRegulations(data.items || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load regulations:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion, selectedCategory, searchQuery, page]);

  useEffect(() => {
    setPage(1);
  }, [selectedRegion, selectedCategory, searchQuery]);

  useEffect(() => {
    loadRegulations();
  }, [loadRegulations]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="flex h-screen bg-[#0A0A12]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-8 h-16 border-b border-[#2e2e42] flex-shrink-0">
          <div className="flex items-center gap-3">
            <Scale className="h-6 w-6 text-[#a78bfa]" />
            <div>
              <h1 className="text-xl font-bold text-white">法规库</h1>
              <p className="text-xs text-[#6b7280]">各省市招投标法规文档</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Filter Sidebar */}
              <aside className="w-full lg:w-56 flex-shrink-0 space-y-5">
                <div className="glass-card p-4">
                  <h3 className="text-sm font-semibold text-[#e2e8f0] mb-3">地区筛选</h3>
                  <div className="flex flex-wrap gap-2">
                    {REGIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setSelectedRegion(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedRegion === r
                            ? 'bg-[#7c3aed]/15 text-[#a78bfa] border border-[#7c3aed]/30'
                            : 'text-[#6b7280] border border-[#2e2e42] hover:bg-[#1e1e2e] hover:text-[#e2e8f0]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-4">
                  <h3 className="text-sm font-semibold text-[#e2e8f0] mb-3">分类筛选</h3>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedCategory(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedCategory === c
                            ? 'bg-[#7c3aed]/15 text-[#a78bfa] border border-[#7c3aed]/30'
                            : 'text-[#6b7280] border border-[#2e2e42] hover:bg-[#1e1e2e] hover:text-[#e2e8f0]'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1 space-y-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
                  <input
                    type="text"
                    placeholder="搜索法规名称..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-11"
                  />
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                    <p className="mt-4 text-[#6b7280] text-sm">加载中...</p>
                  </div>
                ) : regulations.length === 0 ? (
                  <div className="glass-card flex flex-col items-center justify-center py-20">
                    <FileText className="h-12 w-12 text-[#6b7280] mb-4" />
                    <p className="text-[#6b7280]">暂无法规数据</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                    {regulations.map((reg) => (
                      <div key={reg.id} className="glass-card overflow-hidden">
                        <button
                          onClick={() => toggleExpand(reg.id)}
                          className="w-full p-5 text-left flex items-start gap-4 hover:bg-white/[0.02] transition-colors"
                        >
                          <FileText className="h-5 w-5 text-[#a78bfa] mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white line-clamp-1 mb-2">
                              {reg.title}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  REGION_BADGES[reg.region] || 'bg-[#2a2a3c] text-[#6b7280]'
                                }`}
                              >
                                {reg.region}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  CATEGORY_BADGES[reg.category] || 'bg-[#2a2a3c] text-[#6b7280]'
                                }`}
                              >
                                {reg.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-[#4b5563]">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {reg.publishDate || '发布日期未知'}
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {reg.views}
                              </div>
                            </div>
                          </div>
                          <div className="text-[#6b7280] mt-1">
                            {expandedId === reg.id ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </div>
                        </button>

                        {expandedId === reg.id && (
                          <div className="px-5 pb-5 pt-0 border-t border-[#2e2e42] animate-in">
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-[#9ca3af] mb-2">摘要</h4>
                              <p className="text-sm text-[#6b7280] leading-relaxed mb-4">
                                {reg.summary || '暂无摘要'}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-[#9ca3af] mb-2">全文</h4>
                              <div className="text-sm text-[#9ca3af] leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto scrollbar">
                                {reg.content || '暂无全文内容'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="glass-card p-4 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          page === 1
                            ? 'text-[#4b5563] border border-[#2e2e42] cursor-not-allowed'
                            : 'text-[#e2e8f0] border border-[#2e2e42] hover:bg-[#1e1e2e] hover:border-[#7c3aed]/30'
                        }`}
                      >
                        上一页
                      </button>
                      {(() => {
                        const pages: (number | string)[] = [];
                        for (let p = 1; p <= totalPages; p++) {
                          if (p === 1 || p === totalPages || Math.abs(p - page) <= 2) {
                            if (pages.length > 0 && typeof pages[pages.length - 1] === 'number' && (p as number) - (pages[pages.length - 1] as number) > 1) {
                              pages.push('...');
                            }
                            pages.push(p);
                          }
                        }
                        return pages.map((item, i) =>
                          typeof item === 'string' ? (
                            <span key={`ellipsis-${i}`} className="px-1 text-[#4b5563] text-xs">...</span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => setPage(item)}
                              className={`min-w-[32px] px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                page === item
                                  ? 'bg-[#7c3aed]/15 text-[#a78bfa] border border-[#7c3aed]/30'
                                  : 'text-[#e2e8f0] border border-[#2e2e42] hover:bg-[#1e1e2e] hover:border-[#7c3aed]/30'
                              }`}
                            >
                              {item}
                            </button>
                          )
                        );
                      })()}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          page === totalPages
                            ? 'text-[#4b5563] border border-[#2e2e42] cursor-not-allowed'
                            : 'text-[#e2e8f0] border border-[#2e2e42] hover:bg-[#1e1e2e] hover:border-[#7c3aed]/30'
                        }`}
                      >
                        下一页
                      </button>
                    </div>
                  )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
