'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Database,
  Clock,
  FileText,
  Folder,
  FolderOpen,
  Link,
  Unlink,
  ArrowRight,
  File,
  FileCode,
  AlertCircle,
} from 'lucide-react';

interface FeishuConfig {
  connected: boolean;
  spaceId: string | null;
  spaceName: string | null;
  lastSyncAt: string | null;
  docCount: number;
}

interface DriveFile {
  token: string;
  name: string;
  type: string;
  url?: string;
  createdTime?: string;
  modifiedTime?: string;
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = ['测试连接', '浏览文件', '选择文件夹', '连接飞书', '同步文档'];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
              i + 1 < currentStep ? 'bg-[#10b981] text-white' :
              i + 1 === currentStep ? 'bg-[#7c3aed] text-white ring-2 ring-[#7c3aed]/30' :
              'bg-[#2a2a3c] text-[#6b7280]'
            }`}>
              {i + 1 < currentStep ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs hidden md:inline ${i + 1 <= currentStep ? 'text-white' : 'text-[#6b7280]'}`}>{label}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 min-w-[12px] ${i + 1 < currentStep ? 'bg-[#10b981]' : 'bg-[#2a2a3c]'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function FeishuConfigPage() {
  const [config, setConfig] = useState<FeishuConfig | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedFolderName, setSelectedFolderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [openingFiles, setOpeningFiles] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ token: string; name: string }[]>([]);
  const [folderLink, setFolderLink] = useState('');

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/feishu/config');
      const data = await res.json();
      if (res.ok) {
        setConfig(data);
        if (data.spaceId) {
          setSelectedFolder(data.spaceId);
          setSelectedFolderName(data.spaceName || '');
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/feishu/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, message: '测试连接失败' });
    } finally {
      setTesting(false);
    }
  };

  const loadFiles = async (folderToken?: string) => {
    setOpeningFiles(true);
    setFileError(null);
    try {
      const res = await fetch('/api/feishu/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list-files', folderToken: folderToken || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFileError(data.error || `请求失败 (${res.status})`);
        return;
      }
      if (data.files) setFiles(data.files);
      else setFileError('未返回文件列表');
    } catch (e: any) {
      setFileError(e?.message || '网络请求失败');
    } finally {
      setOpeningFiles(false);
    }
  };

  const handleOpenFolder = (folder: DriveFile) => {
    setSelectedFolder(folder.token);
    setSelectedFolderName(folder.name);
    setBreadcrumb(prev => [...prev, { token: folder.token, name: folder.name }]);
    loadFiles(folder.token);
  };

  const handleBreadcrumbClick = (idx: number) => {
    const newBreadcrumb = breadcrumb.slice(0, idx + 1);
    setBreadcrumb(newBreadcrumb);
    if (idx < 0) {
      setSelectedFolder('');
      setSelectedFolderName('');
      loadFiles();
    } else {
      setSelectedFolder(newBreadcrumb[idx].token);
      setSelectedFolderName(newBreadcrumb[idx].name);
      loadFiles(newBreadcrumb[idx].token);
    }
  };

  // 从链接中提取token
  const extractToken = (url: string): string | null => {
    const folderMatch = url.match(/\/drive\/folder\/([a-zA-Z0-9]+)/);
    if (folderMatch) return folderMatch[1];
    const wikiMatch = url.match(/\/wiki\/([a-zA-Z0-9]+)/);
    if (wikiMatch) return wikiMatch[1];
    if (/^[a-zA-Z0-9]+$/.test(url.trim())) return url.trim();
    return null;
  };

  const handleLinkSubmit = async () => {
    const token = extractToken(folderLink);
    if (!token) {
      alert('无法识别链接，请粘贴飞书云盘文件夹链接');
      return;
    }
    setSelectedFolder(token);
    setSelectedFolderName('飞书文件夹');
    setBreadcrumb([{ token, name: '飞书文件夹' }]);
    await loadFiles(token);
  };

  const handleConnect = async () => {
    if (!selectedFolder) { alert('请先选择一个文件夹'); return; }
    setConnecting(true);
    try {
      const res = await fetch('/api/feishu/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', folderToken: selectedFolder, folderName: selectedFolderName }),
      });
      const data = await res.json();
      if (data.success) loadConfig();
      else alert(data.error || '连接失败');
    } catch { alert('连接失败'); } finally { setConnecting(false); }
  };

  const handleDisconnect = async () => {
    if (!confirm('确定要断开飞书连接吗？这将删除所有从飞书同步的文档。')) return;
    setDisconnecting(true);
    try {
      const res = await fetch('/api/feishu/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      const data = await res.json();
      if (data.success) { alert(data.message); loadConfig(); }
    } catch { alert('断开连接失败'); } finally { setDisconnecting(false); }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/feishu/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      });
      const data = await res.json();
      setSyncResult(data);
      if (data.success) loadConfig();
    } catch { setSyncResult({ success: false, message: '同步失败' }); } finally { setSyncing(false); }
  };

  const getCurrentStep = () => {
    if (config?.connected && config.docCount > 0) return 5;
    if (config?.connected) return 4;
    if (selectedFolder) return 3;
    if (testResult?.success) return 2;
    return 1;
  };

  const folders = files.filter(f => f.type === 'folder');
  const docs = files.filter(f => f.type !== 'folder');

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0A0A12]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0A12]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">飞书云盘配置</h1>
            <p className="text-[#6b7280]">连接飞书云盘，同步文档到本地知识库</p>
          </div>

          {/* 已连接状态 */}
          {config?.connected && (
            <div className="glass-card p-5 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 flex items-center justify-center">
                    <Cloud className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">已连接飞书</h3>
                    <p className="text-sm text-[#6b7280]">文件夹：{config.spaceName}</p>
                  </div>
                </div>
                <button onClick={handleDisconnect} disabled={disconnecting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#ef4444]/30 text-[#ef4444] bg-[#ef4444]/10 hover:bg-[#ef4444]/20 transition-all text-sm">
                  {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                  断开连接
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-3 rounded-xl bg-[#1a1a2e]">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="w-4 h-4 text-[#a78bfa]" />
                    <span className="text-xs text-[#6b7280]">已同步文档</span>
                  </div>
                  <p className="text-xl font-bold text-white">{config.docCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#1a1a2e]">
                  <div className="flex items-center gap-2 mb-1">
                    <Folder className="w-4 h-4 text-[#06b6d4]" />
                    <span className="text-xs text-[#6b7280]">同步文件夹</span>
                  </div>
                  <p className="text-sm font-medium text-white truncate">{config.spaceName}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#1a1a2e]">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-[#10b981]" />
                    <span className="text-xs text-[#6b7280]">最后同步</span>
                  </div>
                  <p className="text-sm font-medium text-white">
                    {config.lastSyncAt ? new Date(config.lastSyncAt).toLocaleString('zh-CN') : '从未同步'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <StepIndicator currentStep={getCurrentStep()} />

          {/* 第1步：测试连接 */}
          <div className={`rounded-2xl border p-5 mb-4 transition-all ${
            testResult?.success ? 'border-[#10b981] bg-[#10b981]/5' :
            testResult && !testResult.success ? 'border-[#ef4444] bg-[#ef4444]/5' :
            getCurrentStep() === 1 ? 'border-[#7c3aed] bg-[#7c3aed]/5' :
            'border-[#2e2e42] bg-[#1a1a2e]'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                testResult?.success ? 'bg-[#10b981]/20' :
                testResult && !testResult.success ? 'bg-[#ef4444]/20' :
                'bg-[#7c3aed]/20'
              }`}>
                {testResult?.success ? <CheckCircle className="w-4 h-4 text-[#10b981]" /> :
                 testResult && !testResult.success ? <XCircle className="w-4 h-4 text-[#ef4444]" /> :
                 <span className="text-[#a78bfa] font-bold text-sm">1</span>}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">测试飞书连接</h3>
                <p className="text-sm text-[#6b7280] mb-3">验证应用凭证能否正常访问飞书云盘</p>
                <button onClick={handleTestConnection} disabled={testing} className="btn-primary text-sm">
                  {testing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                  {testing ? '测试中...' : '测试连接'}
                </button>
                {testResult && (
                  <div className={`mt-3 p-3 rounded-lg text-sm ${testResult.success ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#ef4444]/10 text-[#ef4444]'}`}>
                    {testResult.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 第2步：浏览云盘文件 */}
          <div className={`rounded-2xl border p-5 mb-4 transition-all ${
            testResult?.success ? 'border-[#10b981] bg-[#10b981]/5' :
            getCurrentStep() === 2 ? 'border-[#7c3aed] bg-[#7c3aed]/5' :
            'border-[#2e2e42] bg-[#1a1a2e]'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                testResult?.success ? 'bg-[#10b981]/20' : 'bg-[#2a2a3c]'
              }`}>
                {testResult?.success ? <CheckCircle className="w-4 h-4 text-[#10b981]" /> :
                 <span className="text-[#6b7280] font-bold text-sm">2</span>}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">浏览云盘文件</h3>
                <p className="text-sm text-[#6b7280] mb-3">选择要同步的文件夹（点击文件夹进入，选中后点连接）</p>

                {/* 粘贴文件夹链接 */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={folderLink}
                    onChange={(e) => setFolderLink(e.target.value)}
                    placeholder="粘贴飞书文件夹链接（如 https://xxx.feishu.cn/drive/folder/xxx）"
                    className="flex-1 bg-[#1a1a2e] border border-[#2e2e42] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#7c3aed]"
                  />
                  <button onClick={handleLinkSubmit} disabled={!folderLink || openingFiles} className="btn-primary text-sm px-4">
                    {openingFiles ? <Loader2 className="w-4 h-4 animate-spin" /> : '打开'}
                  </button>
                </div>

                {/* 面包屑导航 */}
                {breadcrumb.length > 0 && (
                  <div className="flex items-center gap-1 mb-3 text-sm">
                    <button onClick={() => handleBreadcrumbClick(-1)} className="text-[#a78bfa] hover:underline">根目录</button>
                    {breadcrumb.map((b, i) => (
                      <React.Fragment key={i}>
                        <span className="text-[#6b7280]">/</span>
                        <button onClick={() => handleBreadcrumbClick(i)} className="text-[#a78bfa] hover:underline">{b.name}</button>
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {testResult?.success ? (
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {folders.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-[#6b7280] mb-1 px-1">文件夹 ({folders.length})</p>
                        {folders.map(f => (
                          <div key={f.token} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#2a2a3c] cursor-pointer transition-all"
                            onClick={() => handleOpenFolder(f)}>
                            <FolderOpen className="w-4 h-4 text-[#f59e0b]" />
                            <span className="text-sm text-white flex-1">{f.name}</span>
                            <ArrowRight className="w-3 h-3 text-[#6b7280]" />
                          </div>
                        ))}
                      </div>
                    )}
                    {docs.length > 0 && (
                      <div>
                        <p className="text-xs text-[#6b7280] mb-1 px-1">文件 ({docs.length}) — 同步整个文件夹的内容</p>
                        {docs.map(f => (
                          <div key={f.token}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#2a2a3c] border border-transparent transition-all">
                            {f.type === 'docx' ? <FileCode className="w-4 h-4 text-[#06b6d4]" /> : <File className="w-4 h-4 text-[#6b7280]" />}
                            <span className="text-sm text-white flex-1 truncate">{f.name}</span>
                            <span className="text-xs text-[#6b7280] px-1.5 py-0.5 rounded bg-[#2a2a3c]">{f.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {folders.length === 0 && docs.length === 0 && !fileError && (
                      <p className="text-sm text-[#6b7280] py-4 text-center">此文件夹为空</p>
                    )}
                    {fileError && (
                      <div className="p-3 rounded-lg bg-[#ef4444]/10 text-[#ef4444] text-sm mt-2">
                        加载失败：{fileError}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[#6b7280]">请先完成第1步测试连接</p>
                )}
              </div>
            </div>
          </div>

          {/* 第3步：选择要同步的文件夹 */}
          <div className={`rounded-2xl border p-5 mb-4 transition-all ${
            selectedFolder && !config?.connected ? 'border-[#7c3aed] bg-[#7c3aed]/5' :
            config?.connected ? 'border-[#10b981] bg-[#10b981]/5' :
            'border-[#2e2e42] bg-[#1a1a2e]'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                config?.connected ? 'bg-[#10b981]/20' : selectedFolder ? 'bg-[#7c3aed]/20' : 'bg-[#2a2a3c]'
              }`}>
                {config?.connected ? <CheckCircle className="w-4 h-4 text-[#10b981]" /> :
                 <span className={`font-bold text-sm ${selectedFolder ? 'text-[#a78bfa]' : 'text-[#6b7280]'}`}>3</span>}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">选择同步目标</h3>
                <p className="text-sm text-[#6b7280] mb-3">粘贴文件夹链接后点击「打开」，确认后点「连接飞书」</p>
                {config?.connected ? (
                  <div className="p-3 rounded-lg bg-[#10b981]/10 text-[#10b981] text-sm">
                    已连接到「{config.spaceName}」
                  </div>
                ) : selectedFolder ? (
                  <div className="p-3 rounded-lg bg-[#7c3aed]/10 text-[#a78bfa] text-sm flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    已选择：{selectedFolderName}
                  </div>
                ) : (
                  <p className="text-sm text-[#6b7280]">请在第2步中粘贴飞书文件夹链接并点击「打开」</p>
                )}
              </div>
            </div>
          </div>

          {/* 第4步：连接飞书 */}
          <div className={`rounded-2xl border p-5 mb-4 transition-all ${
            config?.connected ? 'border-[#10b981] bg-[#10b981]/5' :
            getCurrentStep() >= 4 ? 'border-[#7c3aed] bg-[#7c3aed]/5' :
            'border-[#2e2e42] bg-[#1a1a2e]'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                config?.connected ? 'bg-[#10b981]/20' : 'bg-[#2a2a3c]'
              }`}>
                {config?.connected ? <CheckCircle className="w-4 h-4 text-[#10b981]" /> :
                 <span className="text-[#6b7280] font-bold text-sm">4</span>}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">连接飞书</h3>
                <p className="text-sm text-[#6b7280] mb-3">确认选择并建立连接</p>
                {config?.connected ? (
                  <div className="p-3 rounded-lg bg-[#10b981]/10 text-[#10b981] text-sm">连接已建立</div>
                ) : (
                  <button onClick={handleConnect} disabled={connecting || !selectedFolder} className="btn-primary text-sm">
                    {connecting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Link className="w-4 h-4 mr-1" />}
                    {connecting ? '连接中...' : '连接飞书'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 第5步：同步文档 */}
          <div className={`rounded-2xl border p-5 mb-4 transition-all ${
            syncResult?.success ? 'border-[#10b981] bg-[#10b981]/5' :
            getCurrentStep() >= 5 ? 'border-[#7c3aed] bg-[#7c3aed]/5' :
            'border-[#2e2e42] bg-[#1a1a2e]'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                syncResult?.success ? 'bg-[#10b981]/20' : 'bg-[#2a2a3c]'
              }`}>
                {syncResult?.success ? <CheckCircle className="w-4 h-4 text-[#10b981]" /> :
                 <span className="text-[#6b7280] font-bold text-sm">5</span>}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">同步文档</h3>
                <p className="text-sm text-[#6b7280] mb-3">将飞书文件夹中的文档同步到本地知识库（docx获取正文，PDF/其他保存元信息）</p>
                {config?.connected ? (
                  <>
                    <button onClick={handleSync} disabled={syncing} className="btn-primary text-sm">
                      {syncing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                      {syncing ? '同步中...' : '立即同步'}
                    </button>
                    {syncResult && (
                      <div className={`mt-3 p-3 rounded-lg text-sm ${syncResult.success ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#ef4444]/10 text-[#ef4444]'}`}>
                        {syncResult.message}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-[#6b7280]">请先完成第4步连接飞书</p>
                )}
              </div>
            </div>
          </div>

          {/* 使用说明 */}
          <div className="mt-6 glass-card p-6">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#f59e0b]" />
              使用说明
            </h3>
            <div className="space-y-2 text-sm text-[#9ca3af]">
              <p>1. 点击「测试连接」验证飞书应用凭证</p>
              <p>2. 在文件浏览器中找到你要同步的文件夹</p>
              <p>3. 点击文件夹进入，然后点「连接飞书」</p>
              <p>4. 点击「立即同步」，文档将同步到本地知识库</p>
              <p>5. 同步后的文档可在「知识库」页面查看，来源标记为「飞书同步」</p>
              <div className="mt-3 p-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-xs text-[#f59e0b]">
                注意：目前仅支持同步飞书文档（docx）类型，PDF/表格等暂不支持。断开连接会清除所有同步的文档副本。
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
