'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Database, FileText, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ImportStats {
  knowledgeItem: number;
  case: number;
  industryRule: number;
}

interface ImportResult {
  success: boolean;
  summary: {
    knowledgeItem: { imported: number; skipped: number };
    case: { imported: number; skipped: number };
    industryRule: { imported: number; skipped: number };
  };
}

export default function ImportPage() {
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/import');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!confirm('确认导入数据？重复数据将自动跳过。')) {
      return;
    }

    setImporting(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        fetchStats(); // Refresh stats
      } else {
        setError(data.error || '导入失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#7c3aed] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">数据导入</h1>
        <p className="text-[#6b7280] mt-1">导入招标数据到知识库</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 border border-[#2e2e42]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#7c3aed]/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-[#a78bfa]" />
            </div>
            <div>
              <p className="text-sm text-[#6b7280]">Q&A 知识库</p>
              <p className="text-xl font-bold text-white">{stats?.knowledgeItem || 0}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-[#2e2e42]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#10b981]/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#34d399]" />
            </div>
            <div>
              <p className="text-sm text-[#6b7280]">招标案例</p>
              <p className="text-xl font-bold text-white">{stats?.case || 0}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-[#2e2e42]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#fbbf24]" />
            </div>
            <div>
              <p className="text-sm text-[#6b7280]">行业规则</p>
              <p className="text-xl font-bold text-white">{stats?.industryRule || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="glass-card rounded-xl p-6 border border-[#2e2e42]">
        <h2 className="text-lg font-semibold text-white mb-4">导入数据</h2>
        
        <div className="space-y-4">
          <div className="bg-[#1e1e2e] rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-2">数据来源</h3>
            <ul className="text-sm text-[#6b7280] space-y-1">
              <li>• Q&A 知识库：从元博网爬取的招标数据生成</li>
              <li>• 招标案例：完整的招标公告内容</li>
              <li>• 行业规则：办公用品、医疗、教育等行业规则</li>
            </ul>
          </div>

          <div className="bg-[#1e1e2e] rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-2">导入说明</h3>
            <ul className="text-sm text-[#6b7280] space-y-1">
              <li>• 重复数据将自动跳过</li>
              <li>• 导入过程可能需要几分钟</li>
              <li>• 导入完成后数据立即生效</li>
            </ul>
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              importing
                ? 'bg-[#7c3aed]/50 text-[#a78bfa] cursor-not-allowed'
                : 'bg-[#7c3aed] text-white hover:bg-[#6d28d9]'
            }`}
          >
            {importing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                导入中...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                开始导入
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Section */}
      {result && (
        <div className="glass-card rounded-xl p-6 border border-[#10b981]/30 bg-[#10b981]/5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-[#34d399]" />
            <h2 className="text-lg font-semibold text-white">导入完成</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1e1e2e] rounded-lg p-4">
              <p className="text-sm text-[#6b7280]">Q&A 知识库</p>
              <p className="text-lg font-bold text-white">
                +{result.summary.knowledgeItem.imported}
                <span className="text-sm text-[#6b7280] ml-2">
                  (跳过 {result.summary.knowledgeItem.skipped})
                </span>
              </p>
            </div>
            
            <div className="bg-[#1e1e2e] rounded-lg p-4">
              <p className="text-sm text-[#6b7280]">招标案例</p>
              <p className="text-lg font-bold text-white">
                +{result.summary.case.imported}
                <span className="text-sm text-[#6b7280] ml-2">
                  (跳过 {result.summary.case.skipped})
                </span>
              </p>
            </div>
            
            <div className="bg-[#1e1e2e] rounded-lg p-4">
              <p className="text-sm text-[#6b7280]">行业规则</p>
              <p className="text-lg font-bold text-white">
                +{result.summary.industryRule.imported}
                <span className="text-sm text-[#6b7280] ml-2">
                  (跳过 {result.summary.industryRule.skipped})
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Section */}
      {error && (
        <div className="glass-card rounded-xl p-6 border border-[#ef4444]/30 bg-[#ef4444]/5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#f87171]" />
            <p className="text-[#f87171]">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
