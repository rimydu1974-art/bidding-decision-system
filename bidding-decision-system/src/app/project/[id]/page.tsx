'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { ScoreGauge } from '@/components/ui/score-gauge';
import { RiskBadge } from '@/components/ui/risk-badge';
import { SoftRejectionBanner } from '@/components/ui/soft-rejection-banner';
import {
  ArrowLeft,
  Download,
  FileText,
  Lock,
  CheckCircle,
  AlertTriangle,
  Phone,
  FileCode,
  Target,
  Key,
  X,
  ChevronDown,
  FileSpreadsheet,
  FileImage,
  Upload,
  FileSearch,
  MessageSquare,
  Send,
} from 'lucide-react';
import { UnlockComparisonTable } from '@/components/popup/unlock-comparison-table';
import { NudgeCard } from '@/components/popup/nudge-card';

// 解锁价格（与 src/lib/pricing.ts 保持一致）
const UNLOCK_PRICE = 19;

interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: string;
  metadata: string;
  createdAt: string;
}

interface RiskAggregation {
  overallRiskLevel: string;
  hardRejections: Array<{
    ruleId: string;
    ruleName: string;
    triggered: boolean;
    message: string;
    suggestion?: string;
  }>;
  softRejections: Array<{
    ruleId: string;
    ruleName: string;
    riskLevel: string;
    weight: number;
    triggered: boolean;
    message: string;
    suggestion?: string;
  }>;
  riskScore: number;
  recommendation: string;
  topRisks: Array<{
    ruleId: string;
    ruleName: string;
    riskLevel: string;
    weight: number;
    message: string;
  }>;
}

interface AssessmentData {
  basicInfo?: any;
  financialInfo?: any;
  scoringRules?: any;
  qualificationRequirements?: any;
  timeRequirements?: any;
  projectInfo?: any;
  phoneQuestions?: any[];
  risks?: any[];
  tasks?: any[];
  checklist?: any[];
  recommendation?: string;
  riskLevel?: string;
  riskAggregation?: RiskAggregation;
  bidAnalysis?: {
    scoringResults: any[];
    totalScore: number;
    totalMaxScore: number;
    rawResponse: string;
    criteria: any[];
    analyzedAt: string;
  };
}

type TabType = 'eval' | 'checklist' | 'response' | 'scoring' | 'keywords' | 'bid-eval' | 'ai-assistant';

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: 'eval', label: '免费 AI 评估', icon: Target },
  { id: 'checklist', label: '准备清单', icon: FileText },
  { id: 'response', label: '商务技术响应表', icon: FileCode },
  { id: 'scoring', label: '评分预测', icon: BarChart3 },
  { id: 'keywords', label: '关键词拆解', icon: Key },
  { id: 'bid-eval', label: '投标评估', icon: FileSearch },
  { id: 'ai-assistant', label: 'AI 助手', icon: MessageSquare },
];

import { BarChart3 } from 'lucide-react';

function UploadView({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [analysisPhase, setAnalysisPhase] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (files.length + newFiles.length > 3) {
      setError('最多上传3个文件');
      return;
    }
    let totalSize = 0;
    for (const f of [...files, ...newFiles]) { totalSize += f.size; }
    if (totalSize > 30 * 1024 * 1024) {
      setError('文件总大小不能超过30MB');
      return;
    }
    setError('');
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) { setError('请先选择文件'); return; }
    setAnalyzing(true);
    setError('');
    setProgress('正在上传文件...');
    setProgressPercent(5);
    setAnalysisPhase('upload');

    // 模拟分阶段进度条
    const phases = [
      { percent: 10, label: 'upload', text: '正在上传文件...' },
      { percent: 18, label: 'parse', text: '正在解析文档内容...' },
      { percent: 28, label: 'clean', text: '正在清洗文本、注入页码标记...' },
      { percent: 35, label: 'prepare', text: '正在构建AI分析指令...' },
      { percent: 45, label: 'ai_start', text: 'AI正在阅读招标文件...' },
      { percent: 60, label: 'ai_mid', text: 'AI正在提取关键信息...' },
      { percent: 75, label: 'ai_late', text: 'AI正在生成风险评估...' },
      { percent: 88, label: 'rule', text: '正在运行规则引擎检查...' },
      { percent: 95, label: 'save', text: '正在保存分析结果...' },
    ];

    let phaseIdx = 0;
    const progressTimer = setInterval(() => {
      if (phaseIdx < phases.length) {
        setProgressPercent(phases[phaseIdx].percent);
        setProgress(phases[phaseIdx].text);
        setAnalysisPhase(phases[phaseIdx].label);
        phaseIdx++;
      }
    }, 6000); // 每6秒推进一个阶段，总约54秒

    try {
      let lastAssessmentId: string | null = null;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        const res = await fetch('/api/analyze', { method: 'POST', body: formData });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || '分析失败');
        }
        const data = await res.json();
        if (data.assessment?.id) {
          lastAssessmentId = data.assessment.id;
        }
      }
      clearInterval(progressTimer);
      setProgressPercent(100);
      setProgress('分析完成，正在加载结果...');
      setAnalysisPhase('done');
      await new Promise(resolve => setTimeout(resolve, 500));
      if (lastAssessmentId) {
        router.push(`/project/${lastAssessmentId}`);
      } else {
        window.location.reload();
      }
    } catch (err) {
      clearInterval(progressTimer);
      setError(err instanceof Error ? err.message : '分析失败');
      setAnalyzing(false);
      setProgressPercent(0);
      setAnalysisPhase('');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A12]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-[#2e2e42] flex items-center flex-shrink-0">
          <button onClick={() => router.push('/projects')} className="text-[#6b7280] hover:text-white transition-all mr-3">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-bold text-white">{projectName}</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            {/* Upload Area */}
            <div className="glass-card p-8 text-center mb-6">
              <FileText className="w-16 h-16 text-[#7c3aed] mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">上传招标文件开始分析</h2>
              <p className="text-sm text-[#6b7280] mb-6">支持 PDF、Word、Excel 格式，最多3个文件，总大小不超过30MB</p>
              <label className={`cursor-pointer inline-flex items-center gap-2 btn-primary px-8 py-3 ${analyzing ? 'opacity-50 pointer-events-none' : ''}`}>
                <FileText className="w-5 h-5" />
                {files.length > 0 ? '继续添加文件' : '选择招标文件'}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={analyzing}
                />
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="glass-card p-6 mb-6">
                <h3 className="text-sm font-medium text-white mb-4">已选择的文件 ({files.length}/3)</h3>
                <div className="space-y-3">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#0f0f1a]">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#a78bfa]" />
                        <div>
                          <p className="text-sm text-[#e2e8f0]">{file.name}</p>
                          <p className="text-xs text-[#6b7280]">{formatSize(file.size)}</p>
                        </div>
                      </div>
                      {!analyzing && (
                        <button onClick={() => removeFile(idx)} className="text-[#6b7280] hover:text-[#ef4444] p-1">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-sm mb-6">
                {error}
              </div>
            )}

            {/* Progress */}
            {analyzing && progress && (
              <div className="p-5 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#a78bfa]">{progress}</span>
                  <span className="text-sm font-bold text-white">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${progressPercent}%`,
                      background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-[#6b7280]">
                  <span>预计总耗时约54秒</span>
                  <span>{analysisPhase === 'done' ? '完成' : `阶段 ${Math.ceil(progressPercent / 12)}/9`}</span>
                </div>
              </div>
            )}

            {/* Analyze Button */}
            {files.length > 0 && !analyzing && (
              <button onClick={handleAnalyze} className="btn-primary w-full py-4 text-base justify-center">
                开始AI分析
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// AI助手Tab组件
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function AIAssistantTab({ projectId, assessment }: { projectId: string; assessment: AssessmentData | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const storageKey = `ai-chat-${projectId}`;

  // 从localStorage加载对话记录
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {}
    }
  }, [storageKey]);

  // 保存对话记录到localStorage
  const saveMessages = (msgs: ChatMessage[]) => {
    localStorage.setItem(storageKey, JSON.stringify(msgs));
  };

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 构建项目上下文
  const buildProjectContext = () => {
    if (!assessment) return '暂无项目分析数据。';
    const parts: string[] = [];
    if (assessment.basicInfo?.projectName) parts.push(`项目名称: ${assessment.basicInfo.projectName}`);
    if (assessment.basicInfo?.budget) parts.push(`预算: ${assessment.basicInfo.budget}`);
    if (assessment.risks?.length) parts.push(`风险点: ${assessment.risks.length}个 (${assessment.risks.map((r: any) => r.title || r.category).join(', ')})`);
    if (assessment.checklist?.length) parts.push(`准备清单: ${assessment.checklist.length}项`);
    if (assessment.scoringRules) parts.push('评分规则: 已提取');
    if (assessment.qualificationRequirements) parts.push('资质要求: 已提取');
    if (assessment.recommendation) parts.push(`投标建议: ${assessment.recommendation}`);
    return parts.length > 0 ? parts.join('\n') : '暂无项目分析数据。';
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          projectId,
          systemContext: `你是专业的AI投标助手。以下是当前项目的分析信息：\n${buildProjectContext()}\n\n请基于以上项目信息和你的专业知识回答用户问题。如果规则中心没有相关信息，请用你自身的知识回答。`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        const assistantMsg: ChatMessage = { role: 'assistant', content: data.reply };
        const updatedMessages = [...newMessages, assistantMsg];
        setMessages(updatedMessages);
        saveMessages(updatedMessages);
      } else {
        const errorMsg: ChatMessage = { role: 'assistant', content: data.error || '抱歉，AI助手暂时无法回应，请稍后再试。' };
        const updatedMessages = [...newMessages, errorMsg];
        setMessages(updatedMessages);
        saveMessages(updatedMessages);
      }
    } catch {
      const errorMsg: ChatMessage = { role: 'assistant', content: '网络错误，请稍后再试。' };
      const updatedMessages = [...newMessages, errorMsg];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem(storageKey);
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-[#7c3aed] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">AI 投标助手</h3>
            <p className="text-sm text-[#6b7280] mb-4">我可以帮你分析项目风险、解答投标疑问、提供策略建议</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['这个项目有什么风险？', '报价策略怎么定？', '资质还缺什么？'].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/20 text-xs text-[#a78bfa] hover:bg-[#7c3aed]/20 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-[#7c3aed] text-white'
                : 'bg-[#1e1e2e] text-[#e2e8f0] border border-[#2e2e42]'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1e1e2e] border border-[#2e2e42] rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-[#2e2e42]">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="p-2 rounded-lg hover:bg-[#1e1e2e] text-[#6b7280] hover:text-white transition-colors"
            title="清空对话"
          >
            <X className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="输入你的问题..."
            className="flex-1 bg-[#1e1e2e] border border-[#2e2e42] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#7c3aed]/50"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userPlan, setUserPlan] = useState('free');
  const [analyzeCount, setAnalyzeCount] = useState(0);
  const [singleSpend, setSingleSpend] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('eval');
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportLabel, setExportLabel] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [hasShownComplete, setHasShownComplete] = useState(false);
  const [hasBidAnalysis, setHasBidAnalysis] = useState(false);

  useEffect(() => {
    loadProject();
    loadUserPlan();
  }, [projectId]);

  // 分析完成后弹窗引导
  useEffect(() => {
    if (!loading && assessment && !hasShownComplete) {
      const timer = setTimeout(() => {
        setShowCompleteModal(true);
        setHasShownComplete(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, assessment, hasShownComplete]);

  const loadProject = async () => {
    try {
      // 直接按ID查询评估记录（最可靠的方式）
      const res = await fetch(`/api/assessments/${projectId}`);
      const data = await res.json();

      if (res.ok && data.assessment) {
        const record = data.assessment;
        setProject({
          id: record.id,
          name: record.projectName,
          description: record.description || '',
          status: record.status || 'completed',
          metadata: record.metadata || '',
          createdAt: record.createdAt,
        });
        if (record.aiResult) {
          try {
            const parsedAiResult = JSON.parse(record.aiResult);
            setAssessment(parsedAiResult);
            setHasBidAnalysis(!!parsedAiResult.bidAnalysis);
          } catch {
            setAssessment({
              basicInfo: { projectName: record.projectName },
              financialInfo: { budget: record.budget },
              riskLevel: record.riskLevel,
              recommendation: record.recommendation,
            });
          }
        }
      } else {
        // fallback: 通过history API查找
        const historyRes = await fetch('/api/history');
        const historyData = await historyRes.json();
        const assessments = historyData.assessments || [];
        const record = assessments.find((a: any) => a.id === projectId);

        if (record) {
          setProject({
            id: record.id,
            name: record.projectName,
            description: record.description || '',
            status: record.status || 'completed',
            metadata: record.metadata || '',
            createdAt: record.createdAt,
          });
          if (record.aiResult) {
            try {
              const parsedAiResult = JSON.parse(record.aiResult);
              setAssessment(parsedAiResult);
              setHasBidAnalysis(!!parsedAiResult.bidAnalysis);
            } catch {
              setAssessment({
                basicInfo: { projectName: record.projectName },
                financialInfo: { budget: record.budget },
                riskLevel: record.riskLevel,
                recommendation: record.recommendation,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPlan = async () => {
    try {
      const res = await fetch('/api/user/quota');
      const data = await res.json();
      setUserPlan(data.user?.plan || data.plan || 'free');
      setAnalyzeCount(data.user?.totalAiCalls || data.quota?.used || 0);
      setSingleSpend(data.user?.totalSpent || 0);
      if (data.user?.plan === 'pro' || data.user?.plan === 'enterprise' || data.plan === 'pro' || data.plan === 'enterprise') {
        setIsUnlocked(true);
      } else {
        try {
          const unlockRes = await fetch(`/api/projects/${projectId}/unlock-status`);
          const unlockData = await unlockRes.json();
          if (unlockData.unlocked) setIsUnlocked(true);
        } catch {}
      }
    } catch {
      console.error('Failed to load user plan');
    }
  };

  const handleUnlock = () => {
    router.push(`/payment?projectId=${projectId}&returnUrl=/project/${projectId}`);
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 5000);
  };

  const handleExportExcel = async () => {
    setShowExportMenu(false);
    setExporting(true);
    setExportLabel('正在生成Excel报告...');
    try {
      if (!assessment) {
        setExportLabel('无数据可导出');
        setTimeout(() => { setExporting(false); setExportLabel(''); }, 2000);
        return;
      }
      // 验证关键字段存在
      if (!assessment.basicInfo && !assessment.projectInfo) {
        setExportLabel('数据不完整，请重新分析招标文件');
        setTimeout(() => { setExporting(false); setExportLabel(''); }, 3000);
        return;
      }
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessment, isPaid: isUnlocked }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('Export Excel API error:', res.status, errText);
        throw new Error(`API返回错误 (${res.status})`);
      }
      // 验证响应是Excel类型
      const contentType = res.headers.get('Content-Type') || '';
      if (!contentType.includes('spreadsheet') && !contentType.includes('excel')) {
        const text = await res.text();
        console.error('Export Excel: unexpected content type', contentType, text.substring(0, 200));
        throw new Error('服务器返回了非Excel格式的数据');
      }
      const blob = await res.blob();
      if (blob.size === 0) {
        console.error('Export Excel: received empty blob');
        setExportLabel('生成失败：文件为空，请重试');
        setTimeout(() => { setExporting(false); setExportLabel(''); }, 3000);
        return;
      }
      const filename = `投标决策评估-${assessment?.basicInfo?.projectName || project?.name || '未命名'}-${Date.now()}.xlsx`;
      triggerDownload(blob, filename);
      setExportLabel('导出完成！');
      setTimeout(() => { setExporting(false); setExportLabel(''); }, 1500);
    } catch (err) {
      console.error('Export Excel error:', err);
      setExportLabel('导出失败，请重试');
      setTimeout(() => { setExporting(false); setExportLabel(''); }, 2000);
    }
  };

  const handleExportPDF = async () => {
    setShowExportMenu(false);
    setExporting(true);
    setExportLabel('正在生成PDF报告...');
    try {
      if (!assessment) {
        setExportLabel('无数据可导出');
        setTimeout(() => { setExporting(false); setExportLabel(''); }, 2000);
        return;
      }
      const res = await fetch('/api/report/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessment, isPaid: isUnlocked }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('Export PDF API error:', res.status, errText);
        throw new Error(`API返回错误 (${res.status})`);
      }
      const blob = await res.blob();
      if (blob.size === 0) {
        console.error('Export PDF: received empty blob');
        setExportLabel('生成失败：文件为空，请重试');
        setTimeout(() => { setExporting(false); setExportLabel(''); }, 3000);
        return;
      }
      const filename = `投标决策报告-${assessment?.basicInfo?.projectName || project?.name || '未命名'}-${Date.now()}.pdf`;
      triggerDownload(blob, filename);
      setExportLabel('导出完成！');
      setTimeout(() => { setExporting(false); setExportLabel(''); }, 1500);
    } catch (err) {
      console.error('Export PDF error:', err);
      setExportLabel('导出失败，请重试');
      setTimeout(() => { setExporting(false); setExportLabel(''); }, 2000);
    }
  };

  const riskCounts = assessment ? {
    scoringFactors: assessment.scoringRules?.items?.length || 0,
    qualificationReqs: assessment.qualificationRequirements?.length || 0,
    techReqs: assessment.projectInfo?.technicalRequirements?.split('；').filter(Boolean).length || 0,
    phoneQuestions: assessment.phoneQuestions?.length || 0,
  } : { scoringFactors: 0, qualificationReqs: 0, techReqs: 0, phoneQuestions: 0 };

  const hasIncompleteInfo = !assessment?.scoringRules && !assessment?.qualificationRequirements && !assessment?.projectInfo;
  const score = hasIncompleteInfo ? 0 : 65;

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#0A0A12]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-[#7c3aed]/20 border-t-[#7c3aed] rounded-full mx-auto" />
            <p className="mt-4 text-[#6b7280]">加载中...</p>
          </div>
        </main>
      </div>
    );
  }

  // 如果没有评估数据，显示上传界面
  const hasAssessment = assessment && (
    assessment.risks || 
    assessment.scoringRules || 
    assessment.projectInfo ||
    assessment.basicInfo?.projectName
  );

  if (!hasAssessment && !loading) {
    return <UploadView projectId={projectId} projectName={project?.name || '项目'} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A12]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#2e2e42] flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => router.push('/projects')} className="text-[#6b7280] hover:text-white transition-all mr-1">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-lg font-bold text-white">{project?.name || '项目详情'}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#10b981]/10 text-[#10b981]">分析完成</span>
            </div>
            <p className="text-xs text-[#6b7280] ml-6">
              编号: {projectId.slice(0, 8)} | 预算: ¥{(assessment?.financialInfo?.budget || 0).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2 relative">
            {/* 导出加载状态浮层 */}
            {exporting && (
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#1e1e2e] border border-[#7c3aed]/30 shadow-xl flex items-center gap-2 whitespace-nowrap">
                <div className="w-4 h-4 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[#e2e8f0]">{exportLabel}</span>
              </div>
            )}
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exporting || loading || !assessment}
                className="btn-ghost text-xs flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                导出报告
                <ChevronDown className="w-3 h-3" />
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 py-1 rounded-xl bg-[#1e1e2e] border border-[#2e2e42] shadow-xl">
                    <button
                      onClick={handleExportExcel}
                      className="w-full px-4 py-2.5 text-left text-sm text-[#e2e8f0] hover:bg-[#2e2e42] flex items-center gap-3 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#10b981]" />
                      <div>
                        <p className="font-medium">导出 Excel</p>
                        <p className="text-[10px] text-[#6b7280]">投标决策评估表</p>
                      </div>
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-4 py-2.5 text-left text-sm text-[#e2e8f0] hover:bg-[#2e2e42] flex items-center gap-3 transition-colors"
                    >
                      <FileImage className="w-4 h-4 text-[#ef4444]" />
                      <div>
                        <p className="font-medium">导出 PDF</p>
                        <p className="text-[10px] text-[#6b7280]">排版报告 · 色块分区</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 投标文件上传提醒横幅 - 已付费但未上传投标文件 */}
        {isUnlocked && !assessment?.bidAnalysis && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-gradient-to-r from-[#f59e0b]/10 to-[#f97316]/5 border border-[#f59e0b]/20 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#e2e8f0]">📋 已解锁完整招标分析</p>
                <p className="text-xs text-[#9ca3af]">上传投标文件可免费获取评估报告</p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/analyze/bid?projectId=${projectId}`)}
              className="btn-primary text-sm whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              上传投标文件
            </button>
          </div>
        )}

        {/* Tab Bar */}
        <div className="px-5 pt-3 flex gap-0 border-b border-[#2e2e42] flex-shrink-0">
          {TABS.filter(tab => tab.id !== 'ai-assistant' || userPlan === 'pro' || userPlan === 'pro-year' || userPlan === 'enterprise').map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar">
          {/* Soft Rejection Banner */}
          {assessment?.riskAggregation && (
            <SoftRejectionBanner
              hardRejections={assessment.riskAggregation.hardRejections}
              softRejections={assessment.riskAggregation.softRejections}
            />
          )}

          {activeTab === 'eval' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Column (1/3) */}
              <div className="lg:col-span-1 space-y-4">
                {/* Score Gauge */}
                <div className="glass-card p-6 text-center">
                  <ScoreGauge score={score} size="lg" />
                  {!assessment?.scoringRules && (
                    <div className="mt-3 p-2 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/20">
                      <p className="text-xs text-[#f59e0b]">⚠️ 发现信息缺口：由于未关联企业知识库，AI无法判定建议</p>
                    </div>
                  )}
                </div>

                {/* Win Probability */}
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-white">中标概率预测</h3>
                    <span className="text-xs text-[#6b7280]">AI 模型</span>
                  </div>
                  <div className="flex items-end gap-4 mb-3">
                    <span className="text-4xl font-bold gradient-text">68%</span>
                    <span className="text-xs text-[#f59e0b] mb-1">竞争激烈</span>
                  </div>
                  <div className="w-full bg-[#1e1e2e] rounded-full h-2">
                    <div className="bg-gradient-to-r from-[#ef4444] via-[#f59e0b] to-[#10b981] h-2 rounded-full" style={{ width: '68%' }} />
                  </div>
                  {!assessment?.financialInfo && (
                    <div className="mt-3 p-2 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/20">
                      <p className="text-xs text-[#f59e0b]">⚠️ 上传招标文件投标文件一起做对比</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (2/3) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Risk Assessment - Blurred for free */}
                <div className={`glass-card p-6 ${!isUnlocked ? 'relative' : ''}`}>
                  <h3 className="text-sm font-medium text-white mb-4">风险评估</h3>
                  <div className={`space-y-3 ${!isUnlocked ? 'blur-[8px] select-none pointer-events-none' : ''}`}>
                    {(assessment?.risks || []).map((risk: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#0f0f1a]">
                        <RiskBadge level={risk.level || 'medium'} />
                        <div className="flex-1">
                          <p className="text-sm text-[#e2e8f0] font-medium">{risk.title || risk.category}</p>
                          <p className="text-xs text-[#6b7280] mt-0.5">{risk.description || risk.suggestion}</p>
                        </div>
                      </div>
                    ))}
                    {(!assessment?.risks || assessment.risks.length === 0) && (
                      <p className="text-[#6b7280] text-sm">暂无风险数据</p>
                    )}
                  </div>
                </div>

                {/* Missing Info Warning - Always visible */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#f59e0b]/10 to-[#f97316]/5 border border-[#f59e0b]/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#f59e0b] mb-2">⚠️ 你缺少哪些信息、哪些无法判断</p>
                      <div className="text-sm text-[#9ca3af] space-y-1">
                        <p>缺少信息：</p>
                        <div className="flex flex-wrap gap-2 ml-4">
                          <span className="px-2 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] text-xs">企业资质没有上传</span>
                          <span className="px-2 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] text-xs">个人资质没有上传</span>
                          <span className="px-2 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] text-xs">合同业绩没有上传</span>
                          <span className="px-2 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] text-xs">社保没有上传</span>
                          <span className="px-2 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] text-xs">检测报告没有上传</span>
                        </div>
                        <p className="mt-2">所以没办法对比做判断</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Deep Diagnosis - Always visible */}
                <div className="glass-card p-6">
                  <h3 className="text-sm font-medium text-white mb-4">项目深度诊断</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0f0f1a]">
                      <CheckCircle className="w-5 h-5 text-[#10b981]" />
                      <span className={`text-sm text-[#e2e8f0] ${hasIncompleteInfo ? 'blur-[4px] select-none' : ''}`}>
                        <b className="text-white">{riskCounts.scoringFactors}</b>项评分因素
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0f0f1a]">
                      <CheckCircle className="w-5 h-5 text-[#10b981]" />
                      <span className={`text-sm text-[#e2e8f0] ${hasIncompleteInfo ? 'blur-[4px] select-none' : ''}`}>
                        <b className="text-white">{riskCounts.qualificationReqs}</b>项资格要求
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0f0f1a]">
                      <CheckCircle className="w-5 h-5 text-[#10b981]" />
                      <span className={`text-sm text-[#e2e8f0] ${hasIncompleteInfo ? 'blur-[4px] select-none' : ''}`}>
                        <b className="text-white">{riskCounts.techReqs}</b>项关键技术要求
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0f0f1a]">
                      <CheckCircle className="w-5 h-5 text-[#10b981]" />
                      <span className={`text-sm text-[#e2e8f0] ${hasIncompleteInfo ? 'blur-[4px] select-none' : ''}`}>
                        <b className="text-white">{riskCounts.phoneQuestions}</b>项需电话确认问题
                      </span>
                    </div>
                  </div>

                  {!isUnlocked && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-[#7c3aed]/10 to-[#06b6d4]/10 border border-[#7c3aed]/20 text-center">
                      <Lock className="w-8 h-8 text-[#a78bfa] mx-auto mb-2" />
                      <p className="text-sm font-medium text-white mb-1">深度分析结果已生成</p>
                      <p className="text-xs text-[#9ca3af] mb-3">
                        包含潜在废标风险 | 评分关键项 | 容易失分项 | 准备分工项目包
                      </p>
                      <button onClick={handleUnlock} className="btn-primary w-full justify-center py-3">
                        🔑 解锁本项目 {`¥${UNLOCK_PRICE}`}
                      </button>
                    </div>
                  )}
                </div>

                {/* 功能对比表 - 仅免费用户可见 */}
                {!isUnlocked && <UnlockComparisonTable />}

                {/* Boss Summary - Visible but limited for free */}
                <div className="glass-card p-6">
                  <h3 className="text-sm font-medium text-white mb-4">老板总结</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">项目名称</span>
                      <span className="text-[#e2e8f0]">{assessment?.basicInfo?.projectName || project?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">预算金额</span>
                      <span className="text-[#e2e8f0]">¥{(assessment?.financialInfo?.budget || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">资质要求</span>
                      <span className="text-[#e2e8f0]">
                        {isUnlocked ? '详见资质要求列表' : '需上传完整资质才能判断'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">评分结构</span>
                      <span className="text-[#e2e8f0]">
                        {isUnlocked ? `${assessment?.scoringRules?.totalScore || 100}分` : `共${riskCounts.scoringFactors}项评分因素`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">关键风险点</span>
                      <span className="text-[#e2e8f0]">共{assessment?.risks?.length || 0}个</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">准备分工项目包</span>
                      <span className="text-[#e2e8f0]">共{assessment?.checklist?.length || 0}项任务</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">电话需确认问题</span>
                      <span className="text-[#e2e8f0]">共{assessment?.phoneQuestions?.length || 0}项</span>
                    </div>
                  </div>
                </div>

                {/* AI Comprehensive Suggestion - Blurred for free */}
                <div className={`glass-card p-6 ${!isUnlocked ? 'relative' : ''}`}>
                  <h3 className="text-sm font-medium text-white mb-4">AI 综合建议</h3>
                  <div className={`${!isUnlocked ? 'blur-[8px] select-none pointer-events-none' : ''}`}>
                    <p className="text-sm text-[#9ca3af] leading-relaxed mb-3">
                      {assessment?.recommendation === 'bid'
                        ? '资质基本匹配，风险可控，建议积极准备投标。'
                        : assessment?.recommendation === 'caution'
                        ? '存在部分风险，需重点关注资质和时间要求。'
                        : '风险较高，建议谨慎评估后再决定是否投标。'}
                    </p>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 rounded-lg bg-[#7c3aed]/20 text-[#a78bfa]">
                        {assessment?.recommendation === 'bid' ? '建议参与' : assessment?.recommendation === 'caution' ? '谨慎参与' : '不建议'}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-lg bg-[#f59e0b]/20 text-[#f59e0b]">关注报价</span>
                      <span className="text-xs px-2 py-1 rounded-lg bg-[#06b6d4]/20 text-[#06b6d4]">优化方案</span>
                    </div>
                  </div>
                </div>
              </div>

              <NudgeCard
                config={{
                  plan: userPlan as 'free' | 'single',
                  analyzeCount,
                  singleSpend,
                }}
                onUpgrade={() => router.push('/pricing')}
              />
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className={`glass-card p-6 max-w-3xl ${!isUnlocked ? 'relative' : ''}`}>
              <h3 className="text-sm font-medium text-white mb-4">📋 投标准备清单</h3>
              <div className={`${!isUnlocked ? 'blur-[8px] select-none pointer-events-none' : ''}`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2e2e42] text-[#6b7280]">
                      <th className="text-left py-2 font-medium">序号</th>
                      <th className="text-left py-2 font-medium">准备项</th>
                      <th className="text-left py-2 font-medium">负责人</th>
                      <th className="text-left py-2 font-medium">截止日期</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#e2e8f0]">
                    {(assessment?.checklist || []).map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-[#2e2e42]/50">
                        <td className="py-2">{idx + 1}</td>
                        <td>{item.item || item.category}</td>
                        <td>{item.assignee || '待定'}</td>
                        <td>{item.deadline || '待定'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="glass-card p-8 text-center max-w-md" style={{ borderColor: 'rgba(124,58,237,0.4)', boxShadow: '0 8px 40px rgba(124,58,237,0.2)' }}>
                    <Lock className="w-10 h-10 text-[#a78bfa] mx-auto mb-3" />
                    <h3 className="text-white font-bold text-lg mb-2">深度分析结果已生成</h3>
                    <p className="text-sm text-[#9ca3af] mb-4">包含潜在废标风险 | 评分关键项 | 容易失分项 | 准备分工项目包</p>
                    <button onClick={handleUnlock} className="btn-primary w-full justify-center py-3">🔑 解锁本项目 {`¥${UNLOCK_PRICE}`}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'response' && (
            <div className={`glass-card p-6 max-w-3xl ${!isUnlocked ? 'relative' : ''}`}>
              <h3 className="text-sm font-medium text-white mb-4">📊 商务技术响应表</h3>
              <div className={`${!isUnlocked ? 'blur-[8px] select-none pointer-events-none' : ''}`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2e2e42] text-[#6b7280]">
                      <th className="text-left py-2 font-medium">序号</th>
                      <th className="text-left py-2 font-medium">技术要求</th>
                      <th className="text-left py-2 font-medium">响应方案</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#e2e8f0]">
                    {(assessment?.projectInfo?.technicalRequirements || '').split('；').filter(Boolean).slice(0, 5).map((req: string, idx: number) => (
                      <tr key={idx} className="border-b border-[#2e2e42]/50">
                        <td className="py-2">{idx + 1}</td>
                        <td>{req.trim()}</td>
                        <td className="text-[#6b7280]">待解锁</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="glass-card p-8 text-center max-w-md" style={{ borderColor: 'rgba(124,58,237,0.4)', boxShadow: '0 8px 40px rgba(124,58,237,0.2)' }}>
                    <Lock className="w-10 h-10 text-[#a78bfa] mx-auto mb-3" />
                    <h3 className="text-white font-bold text-lg mb-2">深度分析结果已生成</h3>
                    <p className="text-sm text-[#9ca3af] mb-4">包含潜在废标风险 | 评分关键项 | 容易失分项 | 准备分工项目包</p>
                    <button onClick={handleUnlock} className="btn-primary w-full justify-center py-3">🔑 解锁本项目 {`¥${UNLOCK_PRICE}`}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className={`glass-card p-6 max-w-2xl ${!isUnlocked ? 'relative' : ''}`}>
              <h3 className="text-sm font-medium text-white mb-6">🎯 评分预测拆解</h3>
              <div className={`space-y-4 ${!isUnlocked ? 'blur-[8px] select-none pointer-events-none' : ''}`}>
                {assessment?.scoringRules?.items?.map((item: any, idx: number) => {
                  const pct = (item.score || item.maxScore || 0);
                  const barColor = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-[#e2e8f0]">{item.name || item.category}</span>
                        <span className="text-sm font-bold text-white">{item.score || item.maxScore || 0}</span>
                      </div>
                      <div className="w-full bg-[#1e1e2e] rounded-full h-2.5">
                        <div className="h-2.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="glass-card p-8 text-center max-w-md" style={{ borderColor: 'rgba(124,58,237,0.4)', boxShadow: '0 8px 40px rgba(124,58,237,0.2)' }}>
                    <Lock className="w-10 h-10 text-[#a78bfa] mx-auto mb-3" />
                    <h3 className="text-white font-bold text-lg mb-2">深度分析结果已生成</h3>
                    <p className="text-sm text-[#9ca3af] mb-4">包含潜在废标风险 | 评分关键项 | 容易失分项 | 准备分工项目包</p>
                    <button onClick={handleUnlock} className="btn-primary w-full justify-center py-3">🔑 解锁本项目 {`¥${UNLOCK_PRICE}`}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'keywords' && (
            <div className={`glass-card p-6 max-w-2xl ${!isUnlocked ? 'relative' : ''}`}>
              <h3 className="text-sm font-medium text-white mb-4">🔍 关键词拆解</h3>
              <div className={`space-y-2 ${!isUnlocked ? 'blur-[8px] select-none pointer-events-none' : ''}`}>
                {['废标条款', '实质性响应', '资质要求', '报价限制', '时间约束', '格式要求'].map((kw) => (
                  <div key={kw} className="flex items-center gap-4 p-3 rounded-xl bg-[#0f0f1a]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{kw}</span>
                        <span className="text-xs text-[#10b981]">✓ 已覆盖</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#6b7280]">
                        <span>权重: 92</span>
                        <span>出现: 14次</span>
                      </div>
                    </div>
                    <div className="w-20 bg-[#1e1e2e] rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-[#10b981]" style={{ width: '92%' }} />
                    </div>
                  </div>
                ))}
              </div>
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="glass-card p-8 text-center max-w-md" style={{ borderColor: 'rgba(124,58,237,0.4)', boxShadow: '0 8px 40px rgba(124,58,237,0.2)' }}>
                    <Lock className="w-10 h-10 text-[#a78bfa] mx-auto mb-3" />
                    <h3 className="text-white font-bold text-lg mb-2">深度分析结果已生成</h3>
                    <p className="text-sm text-[#9ca3af] mb-4">包含潜在废标风险 | 评分关键项 | 容易失分项 | 准备分工项目包</p>
                    <button onClick={handleUnlock} className="btn-primary w-full justify-center py-3">🔑 解锁本项目 {`¥${UNLOCK_PRICE}`}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bid-eval' && (
            <div className="glass-card p-6 max-w-2xl">
              <h3 className="text-sm font-medium text-white mb-6">📊 投标评估结果</h3>
              {hasBidAnalysis && assessment?.bidAnalysis ? (
                <div className="space-y-6">
                  {/* 总分 */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#06b6d4]/10 to-[#0ea5e9]/10 border border-[#06b6d4]/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#e2e8f0]">投标总分</span>
                      <span className="text-2xl font-bold gradient-text">
                        {assessment.bidAnalysis.totalScore}/{assessment.bidAnalysis.totalMaxScore}
                      </span>
                    </div>
                  </div>

                  {/* 评分维度 */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-white">分项评分</h4>
                    {assessment.bidAnalysis.scoringResults.map((result: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#0f0f1a]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[#e2e8f0]">{result.criteria}</span>
                          <span className={`text-sm font-bold ${
                            result.status === 'good' ? 'text-[#10b981]' :
                            result.status === 'warning' ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                          }`}>
                            {result.score}/{result.maxScore}
                          </span>
                        </div>
                        <p className="text-xs text-[#6b7280]">{result.suggestion}</p>
                      </div>
                    ))}
                  </div>

                  {/* 原始AI响应 */}
                  <div className="p-4 rounded-xl bg-[#0f0f1a]">
                    <h4 className="text-sm font-medium text-white mb-2">详细评估报告</h4>
                    <div className="text-xs text-[#9ca3af] whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {assessment.bidAnalysis.rawResponse}
                    </div>
                  </div>

                  <div className="text-xs text-[#6b7280] text-center">
                    分析时间: {new Date(assessment.bidAnalysis.analyzedAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileSearch className="w-12 h-12 text-[#6b7280] mx-auto mb-4" />
                  <p className="text-[#6b7280] mb-4">尚未上传投标文件</p>
                  <button
                    onClick={() => router.push(`/analyze/bid?projectId=${projectId}`)}
                    className="btn-primary px-6 py-2"
                  >
                    上传投标文件进行评估
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai-assistant' && (
            <AIAssistantTab projectId={projectId} assessment={assessment} />
          )}
        </div>
      </div>

      {/* 分析完成引导弹窗 */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCompleteModal(false)} />
          <div className="relative z-10 w-full max-w-lg mx-4 p-8 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#7c3aed]/30 shadow-2xl">
            <button onClick={() => setShowCompleteModal(false)} className="absolute top-4 right-4 text-[#6b7280] hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#10b981] to-[#06b6d4] flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">AI 分析完成</h2>
              <p className="text-sm text-[#9ca3af]">
                已完成对 <span className="text-[#a78bfa] font-medium">{project?.name}</span> 的全面分析
              </p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0f0f1a]">
                <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-[#a78bfa]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">风险评估已生成</p>
                  <p className="text-xs text-[#6b7280]">发现 {assessment?.risks?.length || 0} 个风险点</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0f0f1a]">
                <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#f59e0b]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">投标决策表已准备</p>
                  <p className="text-xs text-[#6b7280]">包含6大类完整信息提取</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0f0f1a]">
                <div className="w-8 h-8 rounded-lg bg-[#06b6d4]/20 flex items-center justify-center">
                  <FileCode className="w-4 h-4 text-[#06b6d4]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">偏离表已准备</p>
                  <p className="text-xs text-[#6b7280]">上传投标文件后自动填写响应</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#7c3aed]/10 to-[#06b6d4]/10 border border-[#7c3aed]/20 mb-4">
              <p className="text-sm text-[#e2e8f0] text-center">
                点击右上角 <span className="font-bold text-[#a78bfa]">「导出报告」</span> 获取完整投标决策表
              </p>
              <p className="text-xs text-[#6b7280] text-center mt-1">支持 Excel 和 PDF 两种格式</p>
            </div>
            <div className="p-3 rounded-xl bg-[#f59e0b]/5 border border-[#f59e0b]/20 mb-6">
              <p className="text-xs text-[#f59e0b] text-center">
                💡 建议在知识库上传企业资质、合同业绩、检测报告，系统将自动核对评分因素，提升评估准确性
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCompleteModal(false)} className="flex-1 py-3 rounded-xl border border-[#2e2e42] text-[#9ca3af] text-sm font-medium hover:bg-[#1e1e2e] transition-colors">
                先看看分析结果
              </button>
              <button
                onClick={() => { setShowCompleteModal(false); handleExportExcel(); }}
                disabled={exporting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {exporting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {exportLabel}
                  </span>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    导出Excel
                  </>
                )}
              </button>
              <button
                onClick={() => { setShowCompleteModal(false); handleExportPDF(); }}
                disabled={exporting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#ef4444]/80 to-[#f59e0b]/80 text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {exporting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {exportLabel}
                  </span>
                ) : (
                  <>
                    <FileImage className="w-4 h-4" />
                    导出PDF
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
