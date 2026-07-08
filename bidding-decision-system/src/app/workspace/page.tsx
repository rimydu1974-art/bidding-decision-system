'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { ScoreGauge } from '@/components/ui/score-gauge';
import { RiskBadge } from '@/components/ui/risk-badge';
import { UpgradeDialog, shouldShowUpgrade, markUpgradeShown } from '@/components/popup/upgrade-dialog';
import { AnnouncementDialog, shouldShowAnnouncement } from '@/components/popup/announcement-dialog';
import { NudgeBanner } from '@/components/popup/nudge-banner';
import {
  Upload,
  FileText,
  MessageSquare,
  FolderOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart3,
  ArrowRight,
  Lock,
  RefreshCw,
  Scale,
  BookOpen,
  Briefcase,
} from 'lucide-react';

interface HistoryItem {
  id: string;
  projectName: string;
  budget: number;
  riskLevel: string;
  recommendation: string;
  fileName: string;
  createdAt: string;
  hasBidAnalysis?: boolean;
  isUnlocked?: boolean;
}

interface DailyUpdate {
  type: 'regulation' | 'case' | 'article';
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
}

export default function WorkspacePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [userPlan, setUserPlan] = useState('free');
  const [dailyUpdates, setDailyUpdates] = useState<DailyUpdate[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(true);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcementData, setAnnouncementData] = useState<any>(null);
  const [analyzeCount, setAnalyzeCount] = useState(0);
  const [singleSpend, setSingleSpend] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setIsLoggedIn(!!data.user);
        if (data.user) {
          loadHistory();
          loadUserQuota();
          loadDailyUpdates();
          checkPopups();
        }
      })
      .catch(() => setIsLoggedIn(false));
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      const assessments = (data.assessments || []).map((a: any) => {
        let hasBidAnalysis = false;
        let isUnlocked = false;
        try {
          if (a.aiResult) {
            const parsed = JSON.parse(a.aiResult);
            hasBidAnalysis = !!parsed.bidAnalysis;
          }
        } catch {}
        return {
          ...a,
          hasBidAnalysis,
          isUnlocked,
        };
      });
      setHistory(assessments);
    } catch {
      console.error('Failed to load history');
    }
  }, []);

  const track = async (action: string, metadata?: Record<string, unknown>) => {
    try {
      await fetch('/api/behavior/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, metadata }),
      });
    } catch {}
  };

  const loadUserQuota = async () => {
    try {
      const res = await fetch('/api/user/quota');
      const data = await res.json();
      setUserPlan(data.user?.plan || 'free');
      setAnalyzeCount(data.user?.totalAiCalls || data.quota?.used || 0);
      setSingleSpend(data.user?.totalSpent || 0);
    } catch {
      console.error('Failed to load quota');
    }
  };

  const loadDailyUpdates = async () => {
    try {
      const res = await fetch('/api/dashboard/daily-updates');
      const data = await res.json();
      setDailyUpdates(data.updates || []);
    } catch {
      console.error('Failed to load daily updates');
    } finally {
      setLoadingUpdates(false);
    }
  };

  const checkPopups = () => {
    if (shouldShowUpgrade({ analyzeCount: 3 })) {
      setShowUpgradePopup(true);
    }
    fetch('/api/admin/announcement')
      .then(res => res.json())
      .then(data => {
        if (data.active && shouldShowAnnouncement(data.id)) {
          setAnnouncementData(data);
          setShowAnnouncement(true);
        }
      })
      .catch(() => {});
  };

  const handleUpgradeClose = () => {
    setShowUpgradePopup(false);
    markUpgradeShown(3);
  };

  const handleAnnouncementClose = () => {
    setShowAnnouncement(false);
  };

  const handleUploadTender = () => {
    router.push('/analyze/tender');
  };

  const handleUploadBid = () => {
    router.push('/analyze/bid');
  };

  const handleAiAssistant = () => {
    if (userPlan === 'free') {
      router.push('/pricing');
    } else {
      router.push('/ai-write');
    }
  };

  const handleViewAll = () => {
    router.push('/projects');
  };

  const stats = {
    total: history.length,
    success: history.filter((h) => h.recommendation === 'bid').length,
    pending: history.filter((h) => h.riskLevel === 'analyzing').length,
    monthly: history.filter((h) => {
      const d = new Date(h.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'regulation':
        return <Scale className="w-4 h-4 text-[#7c3aed]" />;
      case 'case':
        return <Briefcase className="w-4 h-4 text-[#06b6d4]" />;
      case 'article':
        return <BookOpen className="w-4 h-4 text-[#10b981]" />;
      default:
        return <RefreshCw className="w-4 h-4 text-[#6b7280]" />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A12]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">工作台</h1>
            <p className="text-[#6b7280]">上传招标文件，AI 智能分析投标决策</p>
          </div>

          {/* 今日更新模块 */}
          {dailyUpdates.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-[#0f0f1a] border border-[#2e2e42]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                  <h3 className="text-sm font-medium text-white">今日更新</h3>
                </div>
                <button
                  onClick={loadDailyUpdates}
                  className="text-xs text-[#6b7280] hover:text-[#a78bfa] transition-colors"
                >
                  刷新
                </button>
              </div>
              <div className="space-y-2">
                {dailyUpdates.slice(0, 3).map((update, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-sm"
                  >
                    {getUpdateIcon(update.type)}
                    <span className="text-[#9ca3af]">{update.title}</span>
                    <span className="text-[#6b7280] text-xs ml-auto">{new Date(update.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upgrade Banner */}
          {userPlan === 'free' && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#7c3aed]/10 via-[#7c3aed]/5 to-[#06b6d4]/10 border border-[#7c3aed]/20 animate-in">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-lg">👑</span>
                  <span className="text-[#e2e8f0]">
                    免费版每月 <b className="text-white">20</b> 次AI分析额度
                  </span>
                </div>
                <button
                  onClick={() => { track('click_pay', { source: 'workspace_banner' }); router.push('/pricing'); }}
                  className="btn-primary text-sm whitespace-nowrap"
                >
                  🚀 立即升级
                </button>
              </div>
            </div>
          )}

          {/* Top Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="gradient-border p-[1px] rounded-2xl cursor-pointer" onClick={handleUploadTender}>
              <div className="bg-[#0A0A12] rounded-2xl p-7 flex flex-col items-center text-center gap-3 hover:bg-[#0f0f1a] transition-all">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7c3aed]/20 to-[#7c3aed]/5 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-[#a78bfa]" />
                </div>
                <h3 className="text-lg font-semibold text-white">上传招标文件</h3>
                <p className="text-sm text-[#6b7280]">支持3个文件，最大100M</p>
              </div>
            </div>

            <div className="glass-card p-7 flex flex-col items-center text-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform" onClick={handleUploadBid}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#06b6d4]/20 to-[#06b6d4]/5 flex items-center justify-center">
                <Upload className="w-8 h-8 text-[#06b6d4]" />
              </div>
              <h3 className="text-lg font-semibold text-white">上传投标文件</h3>
              <p className="text-sm text-[#6b7280]">支持3个文件，最大100M</p>
            </div>

            <div
              className={`glass-card p-7 flex flex-col items-center text-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform ${
                userPlan === 'free' ? 'opacity-75' : ''
              }`}
              onClick={handleAiAssistant}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/5 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-[#10b981]" />
              </div>
              <h3 className="text-lg font-semibold text-white">AI投标助手</h3>
              <p className="text-sm text-[#6b7280]">
                {userPlan === 'free' ? (
                  <span className="flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" /> 升级专业版后使用
                  </span>
                ) : (
                  '接入您的API，智能对话'
                )}
              </p>
            </div>
          </div>

          {/* Main Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Recent Projects */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">最近分析项目</h2>
                <button
                  onClick={handleViewAll}
                  className="text-sm text-[#a78bfa] hover:underline cursor-pointer flex items-center gap-1"
                >
                  查看全部 <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {history.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <FolderOpen className="h-12 w-12 text-[#6b7280] mx-auto mb-3" />
                  <p className="text-[#6b7280]">暂无项目，点击上方卡片开始分析</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {history.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="glass-card p-5 cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={() => { track('view_result', { projectId: item.id }); router.push(`/project/${item.id}`); }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#e2e8f0] truncate mb-1 text-sm">
                            {item.projectName}
                          </h3>
                          <p className="text-xs text-[#6b7280]">
                            {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.isUnlocked && !item.hasBidAnalysis && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b]">
                              📄 待上传投标文件
                            </span>
                          )}
                          <RiskBadge
                            level={item.riskLevel as any}
                            label={item.riskLevel === 'critical' ? '极高风险' : item.riskLevel === 'high' ? '高风险' : item.riskLevel === 'medium' ? '中风险' : '低风险'}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-[#6b7280] mb-1">可投性评分</p>
                          <ScoreGauge score={65} size="sm" showLabel={false} />
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.recommendation === 'bid' ? 'bg-[#10b981]/10 text-[#10b981]' :
                            item.recommendation === 'caution' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' :
                            'bg-[#ef4444]/10 text-[#ef4444]'
                          }`}>
                            {item.recommendation === 'bid' ? '建议投标' : item.recommendation === 'caution' ? '谨慎投标' : '不建议'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Suggestion Panel */}
            <div className="lg:col-span-1">
              <div className="glass-card p-5 h-full">
                <h3 className="text-sm font-medium text-white mb-4">AI 建议</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl text-sm bg-[#10b981]/5 border border-[#10b981]/10 text-[#9ca3af]">
                    <span className="text-[#10b981] font-medium">建议：</span>
                    优先准备资质证书，确保符合投标资格
                  </div>
                  <div className="p-3 rounded-xl text-sm bg-[#f59e0b]/5 border border-[#f59e0b]/10 text-[#9ca3af]">
                    <span className="text-[#f59e0b] font-medium">提醒：</span>
                    注意投标截止日期，预留充足的准备时间
                  </div>
                  <div className="p-3 rounded-xl text-sm bg-[#7c3aed]/5 border border-[#7c3aed]/10 text-[#9ca3af]">
                    <span className="text-[#a78bfa] font-medium">提示：</span>
                    上传投标文件可进行对比分析，提高准确度
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-5">
              <p className="text-sm text-[#6b7280] mb-1">总分析次数</p>
              <p className="text-3xl font-bold text-white mb-1">{stats.total}</p>
              <p className="text-xs text-[#10b981]">累计完成</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-sm text-[#6b7280] mb-1">成功项目</p>
              <p className="text-3xl font-bold text-white mb-1">{stats.success}</p>
              <p className="text-xs text-[#10b981]">建议投标</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-sm text-[#6b7280] mb-1">待处理</p>
              <p className="text-3xl font-bold text-white mb-1">{stats.pending}</p>
              <p className="text-xs text-[#f59e0b]">分析中</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-sm text-[#6b7280] mb-1">本月使用</p>
              <p className="text-3xl font-bold text-white mb-1">{stats.monthly}</p>
              <p className="text-xs text-[#6b7280]">/ 20 次</p>
            </div>
          </div>
        </div>
      </main>

      <UpgradeDialog
        open={showUpgradePopup}
        onClose={handleUpgradeClose}
        onGoPricing={() => {
          track('click_pay', { source: 'upgrade_popup' });
          router.push('/pricing');
        }}
      />

      <AnnouncementDialog
        open={showAnnouncement}
        onClose={handleAnnouncementClose}
        announcement={announcementData}
      />

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
