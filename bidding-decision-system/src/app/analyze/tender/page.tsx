'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import {
  Upload,
  FileText,
  X,
  ArrowLeft,
  File,
  AlertCircle,
  Loader2,
  CheckCircle,
  Search,
  Brain,
  Shield,
  FileSearch,
} from 'lucide-react';
import { FeatureComparison } from '@/components/popup/feature-comparison';
import { NudgeBanner } from '@/components/popup/nudge-banner';

const MAX_FILES = 3;
const MAX_SIZE_MB = 100;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export default function TenderAnalyzePage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [forceReanalyze, setForceReanalyze] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [userPlan, setUserPlan] = useState('free');
  const [analyzeCount, setAnalyzeCount] = useState(0);
  const [singleSpend, setSingleSpend] = useState(0);

  useEffect(() => {
    fetch('/api/user/quota').then(r => r.json()).then(d => {
      setUserPlan(d.user?.plan || 'free');
      setAnalyzeCount(d.user?.totalAiCalls || d.quota?.used || 0);
      setSingleSpend(d.user?.totalSpent || 0);
    }).catch(() => {});
  }, []);

  const ANALYZE_STAGES = [
    { percent: 15, label: '上传文件中...', icon: <Upload className="w-5 h-5" /> },
    { percent: 35, label: '解析文档内容...', icon: <FileSearch className="w-5 h-5" /> },
    { percent: 55, label: 'AI智能分析中...', icon: <Brain className="w-5 h-5" /> },
    { percent: 75, label: '提取关键信息...', icon: <Search className="w-5 h-5" /> },
    { percent: 90, label: '规则引擎检测...', icon: <Shield className="w-5 h-5" /> },
    { percent: 98, label: '生成分析报告...', icon: <FileText className="w-5 h-5" /> },
  ];

  // 模拟进度条动画 - 在实际请求完成前持续趋近但不达100%
  useEffect(() => {
    if (analyzing) {
      let stageIndex = 0;
      let currentPercent = 0;

      progressTimerRef.current = setInterval(() => {
        currentPercent += Math.random() * 3 + 1;
        if (currentPercent > 98) currentPercent = 98;

        const nextStages = ANALYZE_STAGES.filter((s) => currentPercent >= s.percent);
        if (nextStages.length > 0) {
          stageIndex = nextStages.length - 1;
        }

        setProgress(Math.round(currentPercent));
        setProgressStage(ANALYZE_STAGES[Math.min(stageIndex, ANALYZE_STAGES.length - 1)].label);
      }, 600);

      return () => {
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
      };
    }
  }, [analyzing]);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError('');
      const arr = Array.from(newFiles);
      const valid: File[] = [];

      for (const f of arr) {
        if (files.length + valid.length >= MAX_FILES) {
          setError(`最多上传${MAX_FILES}个文件`);
          break;
        }
        if (!ALLOWED_TYPES.includes(f.type)) {
          setError('仅支持 .pdf .doc .docx 格式');
          continue;
        }
        if (f.size > MAX_SIZE_BYTES) {
          setError(`单个文件不能超过${MAX_SIZE_MB}MB`);
          continue;
        }
        valid.push(f);
      }

      if (valid.length > 0) {
        setFiles((prev) => [...prev, ...valid]);
        setTimeout(() => {
          buttonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
      }
    },
    [files.length]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setAnalyzing(true);
    setProgress(0);
    setProgressStage('准备中...');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('projectId', 'tender-upload');

      const res = await fetch(`/api/analyze${forceReanalyze ? '?force=true' : ''}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '分析失败');
        setAnalyzing(false);
        setProgress(0);
        return;
      }

      // 完成！进度跳到100%
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setProgress(100);
      setProgressStage('分析完成！');

      // 短暂延迟后跳转
      setTimeout(() => {
        if (data.assessment?.id) {
          router.push(`/project/${data.assessment.id}`);
        } else {
          router.push('/projects');
        }
      }, 800);
    } catch {
      setError('网络错误，请重试');
      setAnalyzing(false);
      setProgress(0);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A12]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[800px] mx-auto">
          <button
            onClick={() => router.push('/workspace')}
            className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回工作台
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">招标文件分析</h1>
            <p className="text-[#6b7280]">上传招标文件，AI 智能提取关键信息并评估风险</p>
          </div>

          <div className="glass-card p-6 flex flex-col">
            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                ${isDragOver
                  ? 'border-[#a78bfa] bg-[#7c3aed]/5'
                  : 'border-[#2e2e42] hover:border-[#6b7280] bg-[#0A0A12]'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7c3aed]/20 to-[#7c3aed]/5 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-[#a78bfa]" />
              </div>
              <p className="text-white font-medium mb-1">
                拖拽文件到此处，或点击选择
              </p>
              <p className="text-sm text-[#6b7280]">
                支持 .pdf .doc .docx，单个最大 {MAX_SIZE_MB}MB，最多 {MAX_FILES} 个文件
              </p>
            </div>

            {/* 功能清单 - 免费用户可见，5秒后自动消失 */}
            {userPlan === 'free' && <FeatureComparison />}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20">
                <AlertCircle className="w-4 h-4 text-[#ef4444]" />
                <span className="text-sm text-[#ef4444]">{error}</span>
              </div>
            )}

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#0f0f1a] border border-[#2e2e42]"
                  >
                    <FileText className="w-5 h-5 text-[#a78bfa] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#e2e8f0] truncate">{f.name}</p>
                      <p className="text-xs text-[#6b7280]">{formatSize(f.size)}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="text-[#6b7280] hover:text-[#ef4444] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}


            {/* 强制重新分析选项 */}
            {files.length > 0 && (
              <label className="flex items-center gap-2 mb-3 cursor-pointer text-sm text-[#6b7280] hover:text-[#a78bfa] transition-colors">
                <input
                  type="checkbox"
                  checked={forceReanalyze}
                  onChange={(e) => setForceReanalyze(e.target.checked)}
                  className="w-4 h-4 rounded border-[#2e2e42] bg-[#0f0f1a] text-[#7c3aed] focus:ring-[#7c3aed] focus:ring-offset-0 cursor-pointer"
                />
                强制重新分析（跳过缓存）
              </label>
            )}
            {/* Analyze Button / Progress Bar */}
            {analyzing ? (
              <div className="mt-6 space-y-3">
                {/* 进度条 */}
                <div className="w-full bg-[#1e1e2e] rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${progress}%`,
                      background: progress === 100
                        ? 'linear-gradient(90deg, #22c55e, #10b981)'
                        : 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                    }}
                  />
                </div>
                {/* 进度文字+百分比 */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-[#a78bfa]">
                    {progress === 100 ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    )}
                    <span>{progressStage}</span>
                  </div>
                  <span className="text-[#6b7280] font-mono">{progress}%</span>
                </div>
                {/* 阶段指示器 */}
                <div className="flex justify-between mt-2">
                  {ANALYZE_STAGES.map((stage, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                        progress >= stage.percent ? 'bg-[#a78bfa] shadow-[0_0_6px_#a78bfa]' : 'bg-[#2e2e42]'
                      }`} />
                      <span className="text-[10px] text-[#4b5563] hidden md:block">
                        {stage.label.replace('...', '')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div ref={buttonRef} className="sticky bottom-0 pt-4 pb-1 bg-[#0f0f1a] -mx-6 px-6 -mb-6 pb-6">
                <button
                  onClick={handleAnalyze}
                  disabled={files.length === 0}
                  className={`
                    w-full py-3 rounded-xl font-medium text-sm transition-all
                    ${files.length === 0
                      ? 'bg-[#2e2e42] text-[#6b7280] cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white hover:opacity-90 cursor-pointer'
                    }
                  `}
                >
                  开始AI分析
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <NudgeBanner
        config={{
          plan: userPlan as 'free' | 'single',
          analyzeCount,
          singleSpend,
        }}
        onUpgrade={() => router.push('/pricing')}
      />
    </div>
  );
}
