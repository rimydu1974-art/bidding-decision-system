'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
import {
  Search,
  Eye,
  Clock,
  X,
  FileText,
  Gavel,
  User,
  Building2,
  Send,
} from 'lucide-react';

interface CaseItem {
  id: string;
  title: string;
  industry: string;
  source: 'platform' | 'anonymous' | 'expert';
  content: string;
  views: number;
  createdAt: string;
}

const SOURCE_FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'platform', label: '平台收录' },
  { id: 'anonymous', label: '匿名投稿' },
  { id: 'expert', label: '专家分享' },
] as const;

const SOURCE_BADGES: Record<string, { text: string; color: string }> = {
  platform: { text: '平台收录', color: 'bg-blue-500/20 text-blue-400' },
  anonymous: { text: '匿名投稿', color: 'bg-amber-500/20 text-amber-400' },
  expert: { text: '专家分享', color: 'bg-emerald-500/20 text-emerald-400' },
};

const INDUSTRIES = [
  '信息技术',
  '工程建设',
  '医疗健康',
  '教育科研',
  '政府采购',
  '金融服务',
  '能源环保',
  '其他',
];

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formIndustry, setFormIndustry] = useState('信息技术');
  const [formContent, setFormContent] = useState('');

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSource !== 'all') params.set('source', selectedSource);
      if (searchQuery) params.set('search', searchQuery);
      const res = await fetch(`/api/cases?${params}`);
      const data = await res.json();
      if (res.ok) {
        setCases(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSource, searchQuery]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          industry: formIndustry,
          content: formContent,
          source: 'anonymous',
        }),
      });
      if (res.ok) {
        setShowSubmitModal(false);
        setFormTitle('');
        setFormIndustry('信息技术');
        setFormContent('');
        loadCases();
      }
    } catch (err) {
      console.error('Failed to submit case:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0A12]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-8 h-16 border-b border-[#2e2e42] flex-shrink-0">
          <div className="flex items-center gap-3">
            <Gavel className="h-6 w-6 text-[#a78bfa]" />
            <h1 className="text-xl font-bold text-white">案例中心</h1>
          </div>
          <button className="btn-primary" onClick={() => setShowSubmitModal(true)}>
            <User className="h-4 w-4 mr-1" />
            匿名投稿
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2 flex-wrap">
                {SOURCE_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedSource(f.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedSource === f.id
                        ? 'bg-[#7c3aed]/15 text-[#a78bfa] border border-[#7c3aed]/30'
                        : 'text-[#6b7280] border border-[#2e2e42] hover:bg-[#1e1e2e] hover:text-[#e2e8f0]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
                <input
                  type="text"
                  placeholder="搜索案例..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-11"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-[#6b7280] text-sm">加载中...</p>
              </div>
            ) : cases.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center py-20">
                <FileText className="h-12 w-12 text-[#6b7280] mb-4" />
                <p className="text-[#6b7280]">暂无案例</p>
                <button
                  className="btn-primary mt-4"
                  onClick={() => setShowSubmitModal(true)}
                >
                  <User className="h-4 w-4 mr-1" />
                  匿名投稿
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cases.map((c) => (
                  <div key={c.id} className="glass-card p-5 flex flex-col">
                    <h3 className="font-semibold text-white line-clamp-1 mb-2">
                      {c.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a2a3c] text-[#9ca3af]">
                        {c.industry}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          SOURCE_BADGES[c.source]?.color || 'bg-[#2a2a3c] text-[#6b7280]'
                        }`}
                      >
                        {SOURCE_BADGES[c.source]?.text || c.source}
                      </span>
                    </div>
                    <p className="text-sm text-[#6b7280] line-clamp-3 flex-1">
                      {c.content || '暂无内容'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-[#4b5563] mt-4 pt-3 border-t border-[#2e2e42]">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {c.views}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in">
          <div className="glass-card w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#2e2e42]">
              <h2 className="text-lg font-semibold text-white">匿名投稿案例</h2>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-[#6b7280] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">
                  案例标题
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="input-field"
                  placeholder="输入案例标题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">
                  所属行业
                </label>
                <select
                  value={formIndustry}
                  onChange={(e) => setFormIndustry(e.target.value)}
                  className="input-field"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind} className="bg-[#1e1e2e] text-[#e2e8f0]">
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">
                  案例内容
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={6}
                  className="input-field resize-none"
                  placeholder="描述案例详情..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#2e2e42]">
              <button className="btn-ghost" onClick={() => setShowSubmitModal(false)}>
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={submitting || !formTitle.trim() || !formContent.trim()}
              >
                {submitting ? (
                  <>
                    <Send className="h-4 w-4 mr-1 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    提交
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
