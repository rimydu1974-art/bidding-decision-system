'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Edit,
  Folder,
  Tag,
  Clock,
  RefreshCw,
  Cloud,
  CloudOff,
  HardDrive,
  Upload,
  X,
  Link,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  content: string;
  tags: string;
  fileType: string;
  fileName: string | null;
  source: string;
  sourceId: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  name: string;
  count: number;
}

interface Source {
  name: string;
  count: number;
}

const CATEGORIES = [
  '全部',
  '资质证书',
  '业绩案例',
  '技术方案',
  '人员简历',
  '财务材料',
  '投标模板',
  '政策法规',
  '飞书文档',
  '其他',
];

const SOURCES = [
  { id: 'all', name: '全部来源', icon: Folder },
  { id: 'manual', name: '手动创建', icon: HardDrive },
  { id: 'feishu', name: '飞书同步', icon: Cloud },
  { id: 'upload', name: '文件上传', icon: Upload },
];

const SOURCE_LABELS: Record<string, { text: string; color: string }> = {
  manual: { text: '手动创建', color: 'bg-blue-500/20 text-blue-400' },
  feishu: { text: '飞书同步', color: 'bg-purple-500/20 text-purple-400' },
  upload: { text: '文件上传', color: 'bg-emerald-500/20 text-emerald-400' },
};

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedSource, setSelectedSource] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [syncingFeishu, setSyncingFeishu] = useState(false);
  const [feishuSpaces, setFeishuSpaces] = useState<{ id: string; name: string }[]>([]);
  const [selectedSpace, setSelectedSpace] = useState('');
  const [showFeishuSync, setShowFeishuSync] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('其他');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feishuConnected, setFeishuConnected] = useState(false);
  const [feishuSpaceName, setFeishuSpaceName] = useState('');
  const [feishuSyncing, setFeishuSyncing] = useState(false);
  const [feishuSyncResult, setFeishuSyncResult] = useState('');

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('其他');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');

  const loadKnowledge = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        source: selectedSource,
        search: searchQuery,
      });
      const response = await fetch(`/api/knowledge?${params}`);
      const data = await response.json();
      if (response.ok) {
        setItems(data.items || []);
        setCategories(data.categories || []);
        setSources(data.sources || []);
      }
    } catch (error) {
      console.error('Failed to load knowledge:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSource, searchQuery]);

  useEffect(() => {
    loadKnowledge();
    // 加载飞书连接状态
    fetch('/api/feishu/config')
      .then((res) => res.json())
      .then((data) => {
        setFeishuConnected(data.connected || false);
        setFeishuSpaceName(data.spaceName || '');
      })
      .catch(() => {});
  }, [loadKnowledge]);

  const loadFeishuSpaces = async () => {
    try {
      const response = await fetch('/api/feishu/knowledge?action=list');
      const data = await response.json();
      if (response.ok && data.spaces) {
        setFeishuSpaces(data.spaces);
      }
    } catch (error) {
      console.error('Failed to load Feishu spaces:', error);
    }
  };

  const handleFeishuSync = async () => {
    if (!selectedSpace) {
      alert('请选择飞书知识库');
      return;
    }
    setSyncingFeishu(true);
    try {
      const nodesResponse = await fetch(`/api/feishu/knowledge?action=nodes&spaceId=${selectedSpace}`);
      const nodesData = await nodesResponse.json();
      if (!nodesResponse.ok || !nodesData.nodes) {
        throw new Error('获取飞书文档失败');
      }
      let syncCount = 0;
      for (const node of nodesData.nodes) {
        if (node.obj_type === 'doc' || node.obj_type === 'sheet') {
          const contentResponse = await fetch(`/api/feishu/knowledge?action=content&documentId=${node.obj_token}`);
          const contentData = await contentResponse.json();
          if (contentResponse.ok && contentData.content) {
            await fetch('/api/feishu/knowledge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                documentId: node.obj_token,
                title: node.title || '未命名文档',
                content: contentData.content,
                category: '飞书文档',
              }),
            });
            syncCount++;
          }
        }
      }
      alert(`成功同步 ${syncCount} 个文档`);
      setShowFeishuSync(false);
      loadKnowledge();
    } catch (error) {
      console.error('Feishu sync error:', error);
      alert('同步失败，请检查飞书配置');
    } finally {
      setSyncingFeishu(false);
    }
  };

  useEffect(() => {
    if (showFeishuSync) {
      loadFeishuSpaces();
    }
  }, [showFeishuSync]);

  const handleFileUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('category', uploadCategory);
      const response = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadCategory('其他');
        loadKnowledge();
        alert('文件上传成功');
      } else {
        alert(data.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          category: formCategory,
          content: formContent,
          tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (response.ok) {
        setShowAddModal(false);
        resetForm();
        loadKnowledge();
      }
    } catch (error) {
      console.error('Failed to add knowledge:', error);
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;
    try {
      const response = await fetch('/api/knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          title: formTitle,
          category: formCategory,
          content: formContent,
          tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (response.ok) {
        setEditingItem(null);
        resetForm();
        loadKnowledge();
      }
    } catch (error) {
      console.error('Failed to update knowledge:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDeleteConfirmId(null);
        loadKnowledge();
      }
    } catch (error) {
      console.error('Failed to delete knowledge:', error);
    }
  };

  const openEditModal = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormContent(item.content);
    setFormTags(parseTags(item.tags).join(', '));
  };

  const resetForm = () => {
    setFormTitle('');
    setFormCategory('其他');
    setFormContent('');
    setFormTags('');
  };

  const parseTags = (tagsStr: string) => {
    try {
      return JSON.parse(tagsStr || '[]');
    } catch {
      return [];
    }
  };

  const getSourceCount = (sourceId: string) => {
    if (sourceId === 'all') return items.length;
    return sources.find((s) => s.name === sourceId)?.count || 0;
  };

  const closeAllModals = () => {
    setShowAddModal(false);
    setEditingItem(null);
    resetForm();
  };

  return (
    <div className="flex h-screen bg-[#0A0A12]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-8 h-16 border-b border-[#2e2e42] flex-shrink-0">
          <h1 className="text-xl font-bold text-white">知识库</h1>
          <div className="flex items-center gap-3">
            {feishuConnected ? (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/20 transition-all"
                onClick={async () => {
                  setFeishuSyncing(true);
                  setFeishuSyncResult('');
                  try {
                    const res = await fetch('/api/feishu/config', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'sync' }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      setFeishuSyncResult(data.message);
                      loadKnowledge();
                    } else {
                      setFeishuSyncResult(data.error || '同步失败');
                    }
                  } catch {
                    setFeishuSyncResult('同步失败');
                  } finally {
                    setFeishuSyncing(false);
                  }
                }}
                disabled={feishuSyncing}
              >
                {feishuSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                飞书已连接 · {feishuSpaceName}
              </button>
            ) : (
              <button
                className="btn-ghost"
                onClick={() => window.location.href = '/feishu-config'}
              >
                <CloudOff className="h-4 w-4 mr-1" />
                连接飞书
              </button>
            )}
            <button className="btn-ghost" onClick={() => setShowUploadModal(true)}>
              <Upload className="h-4 w-4 mr-1" />
              上传文件
            </button>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-1" />
              新增知识
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-[#e2e8f0] mb-3">数据来源</h3>
                <div className="space-y-1">
                  {SOURCES.map((src) => {
                    const Icon = src.icon;
                    const count = getSourceCount(src.id);
                    return (
                      <button
                        key={src.id}
                        onClick={() => setSelectedSource(src.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-all ${
                          selectedSource === src.id
                            ? 'bg-[#7c3aed]/15 text-[#a78bfa]'
                            : 'text-[#6b7280] hover:bg-[#1e1e2e] hover:text-[#e2e8f0]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {src.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a2a3c] text-[#6b7280]">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-[#e2e8f0] mb-3">知识分类</h3>
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => {
                    const count = cat === '全部'
                      ? items.length
                      : categories.find((c) => c.name === cat)?.count || 0;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-all ${
                          selectedCategory === cat
                            ? 'bg-[#7c3aed]/15 text-[#a78bfa]'
                            : 'text-[#6b7280] hover:bg-[#1e1e2e] hover:text-[#e2e8f0]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Folder className="h-4 w-4" />
                          {cat}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a2a3c] text-[#6b7280]">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="mb-6 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
                <input
                  type="text"
                  placeholder="搜索知识库..."
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
              ) : items.length === 0 ? (
                <div className="glass-card flex flex-col items-center justify-center py-20">
                  <FileText className="h-12 w-12 text-[#6b7280] mb-4" />
                  <p className="text-[#6b7280]">暂无知识库内容</p>
                  <div className="mt-4 flex gap-3">
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      添加知识
                    </button>
                    {feishuConnected ? (
                      <button
                        className="btn-ghost"
                        onClick={async () => {
                          setFeishuSyncing(true);
                          try {
                            const res = await fetch('/api/feishu/config', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'sync' }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              loadKnowledge();
                            }
                          } finally {
                            setFeishuSyncing(false);
                          }
                        }}
                        disabled={feishuSyncing}
                      >
                        <Cloud className="h-4 w-4 mr-1" />
                        从飞书同步
                      </button>
                    ) : (
                      <button
                        className="btn-ghost"
                        onClick={() => window.location.href = '/feishu-config'}
                      >
                        <Link className="h-4 w-4 mr-1" />
                        连接飞书知识库
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <div key={item.id} className="glass-card p-5 group">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-white line-clamp-1">{item.title}</h3>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#a78bfa] hover:bg-[#7c3aed]/10 transition-all"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a2a3c] text-[#9ca3af]">{item.category}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${SOURCE_LABELS[item.source]?.color || 'bg-[#2a2a3c] text-[#6b7280]'}`}>
                          {SOURCE_LABELS[item.source]?.text || item.source}
                        </span>
                      </div>

                      <p className="text-sm text-[#6b7280] line-clamp-3 mb-4">{item.content || '暂无内容'}</p>

                      <div className="flex items-center justify-between text-xs text-[#4b5563]">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.updatedAt).toLocaleDateString('zh-CN')}
                        </div>
                        <div className="flex items-center gap-2">
                          {parseTags(item.tags).slice(0, 2).map((tag: string, i: number) => (
                            <span key={i} className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {(showAddModal || editingItem) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in">
          <div className="glass-card w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#2e2e42]">
              <h2 className="text-lg font-semibold text-white">{editingItem ? '编辑知识' : '新增知识'}</h2>
              <button onClick={closeAllModals} className="text-[#6b7280] hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">标题</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="input-field"
                  placeholder="输入知识标题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">分类</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="input-field"
                >
                  {CATEGORIES.filter((c) => c !== '全部').map((cat) => (
                    <option key={cat} value={cat} className="bg-[#1e1e2e] text-[#e2e8f0]">{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">内容</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={6}
                  className="input-field resize-none"
                  placeholder="输入知识内容..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">标签（用逗号分隔）</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="input-field"
                  placeholder="如：ISO9001, 高新技术, 资质证书"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#2e2e42]">
              <button className="btn-ghost" onClick={closeAllModals}>取消</button>
              <button className="btn-primary" onClick={editingItem ? handleEdit : handleAdd}>
                {editingItem ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showFeishuSync && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in">
          <div className="glass-card w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#2e2e42]">
              <h2 className="text-lg font-semibold text-white">从飞书同步</h2>
              <button onClick={() => setShowFeishuSync(false)} className="text-[#6b7280] hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">选择飞书知识库</label>
                <select
                  value={selectedSpace}
                  onChange={(e) => setSelectedSpace(e.target.value)}
                  className="input-field"
                >
                  <option value="" className="bg-[#1e1e2e] text-[#e2e8f0]">请选择</option>
                  {feishuSpaces.map((space) => (
                    <option key={space.id} value={space.id} className="bg-[#1e1e2e] text-[#e2e8f0]">{space.name}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-[#6b7280]">将同步所选知识库中的所有文档到本地知识库</p>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#2e2e42]">
              <button className="btn-ghost" onClick={() => setShowFeishuSync(false)}>取消</button>
              <button className="btn-primary" onClick={handleFeishuSync} disabled={syncingFeishu}>
                {syncingFeishu ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    同步中...
                  </>
                ) : (
                  '开始同步'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in">
          <div className="glass-card w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#2e2e42]">
              <h2 className="text-lg font-semibold text-white">上传文件到知识库</h2>
              <button onClick={() => { setShowUploadModal(false); setUploadFile(null); }} className="text-[#6b7280] hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">选择文件</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="input-field file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#7c3aed]/20 file:text-[#a78bfa] hover:file:bg-[#7c3aed]/30"
                />
                <p className="text-xs text-[#6b7280] mt-1.5">支持 PDF、Word、Excel、文本文件</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">分类</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="input-field"
                >
                  {CATEGORIES.filter((c) => c !== '全部').map((cat) => (
                    <option key={cat} value={cat} className="bg-[#1e1e2e] text-[#e2e8f0]">{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#2e2e42]">
              <button className="btn-ghost" onClick={() => { setShowUploadModal(false); setUploadFile(null); }}>取消</button>
              <button className="btn-primary" onClick={handleFileUpload} disabled={!uploadFile || uploading}>
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    上传中...
                  </>
                ) : (
                  '上传'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in">
          <div className="glass-card w-full max-w-sm mx-4 overflow-hidden">
            <div className="p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-[#ef4444]/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-[#ef4444]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">确认删除</h3>
              <p className="text-sm text-[#6b7280]">确定要删除这条知识吗？此操作不可撤销。</p>
            </div>
            <div className="flex gap-3 p-5 border-t border-[#2e2e42]">
              <button className="btn-ghost flex-1" onClick={() => setDeleteConfirmId(null)}>取消</button>
              <button
                className="flex-1 inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl px-5 py-2.5 text-sm border border-[#ef4444]/30 text-[#ef4444] bg-[#ef4444]/10 hover:bg-[#ef4444]/20 transition-all cursor-pointer"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                <Trash2 className="h-4 w-4" />
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
