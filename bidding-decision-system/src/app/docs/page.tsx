'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Copy, Eye, EyeOff, Key, Book, BarChart3, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
}

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  description: string;
  parameters: { name: string; type: string; required: boolean; description: string }[];
  curlExample: string;
}

const endpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/api/analyze',
    title: '投标分析',
    description: '对招标文件进行智能分析，提取关键信息和评分要点。',
    parameters: [
      { name: 'fileUrl', type: 'string', required: true, description: '招标文件URL地址' },
      { name: 'projectId', type: 'string', required: false, description: '关联项目ID' },
      { name: 'options', type: 'object', required: false, description: '分析选项配置' },
    ],
    curlExample: `curl -X POST https://your-domain.com/api/analyze \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "fileUrl": "https://example.com/bidding-doc.pdf",
    "projectId": "proj_12345"
  }'`,
  },
  {
    method: 'POST',
    path: '/api/scoring',
    title: '智能评分',
    description: '基于AI模型对投标文件进行自动评分和评估。',
    parameters: [
      { name: 'documentId', type: 'string', required: true, description: '投标文档ID' },
      { name: 'criteria', type: 'array', required: false, description: '评分标准列表' },
    ],
    curlExample: `curl -X POST https://your-domain.com/api/scoring \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "documentId": "doc_12345",
    "criteria": ["技术方案", "价格", "资质"]
  }'`,
  },
  {
    method: 'GET',
    path: '/api/projects',
    title: '获取项目列表',
    description: '获取当前用户的项目列表。',
    parameters: [
      { name: 'page', type: 'number', required: false, description: '页码' },
      { name: 'limit', type: 'number', required: false, description: '每页数量' },
    ],
    curlExample: `curl -X GET "https://your-domain.com/api/projects?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
  {
    method: 'GET',
    path: '/api/knowledge',
    title: '获取知识库',
    description: '获取用户的知识库内容。',
    parameters: [
      { name: 'category', type: 'string', required: false, description: '分类筛选' },
      { name: 'search', type: 'string', required: false, description: '搜索关键词' },
    ],
    curlExample: `curl -X GET "https://your-domain.com/api/knowledge?category=资质证书" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
];

export default function DocsPage() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.role !== 'admin') {
          router.push('/pricing');
        } else {
          setIsAdmin(true);
        }
      })
      .catch(() => router.push('/pricing'));
  }, [router]);

  const handleCopy = (text: string, path: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20';
      case 'POST': return 'bg-[#7c3aed]/10 text-[#a78bfa] border-[#7c3aed]/20';
      case 'PUT': return 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20';
      case 'DELETE': return 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20';
      default: return 'bg-[#6b7280]/10 text-[#6b7280] border-[#6b7280]/20';
    }
  };

  if (isAdmin === null) {
    return (
      <div className="flex h-screen bg-[#0A0A12] items-center justify-center">
        <div className="text-[#9ca3af]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0A12]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">API 文档</h1>
            <p className="text-[#6b7280]">使用 OpenCheck API 集成投标分析能力到您的系统</p>
          </div>

          {/* Quick Start */}
          <div className="glass-card p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Book className="w-5 h-5 text-[#a78bfa]" />
              快速开始
            </h2>
            <div className="space-y-4 text-sm text-[#9ca3af]">
              <p>1. 在下方创建一个 API Key</p>
              <p>2. 使用 API Key 作为 Bearer Token 进行请求</p>
              <p>3. 所有请求请发送到 <code className="px-2 py-1 bg-[#1e1e2e] rounded text-[#a78bfa]">https://your-domain.com</code></p>
            </div>
          </div>

          {/* API Keys */}
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-[#a78bfa]" />
                API Keys
              </h2>
              <button className="btn-primary text-sm" onClick={() => setShowKeyForm(true)}>
                创建 Key
              </button>
            </div>
            {apiKeys.length === 0 ? (
              <p className="text-[#6b7280] text-sm">暂无 API Key，请创建一个</p>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-3 bg-[#1e1e2e] rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-white">{key.name}</p>
                      <p className="text-xs text-[#6b7280]">
                        {visibleKeys[key.id] ? key.key : '••••••••••••••••'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setVisibleKeys(prev => ({ ...prev, [key.id]: !prev[key.id] }))}
                        className="p-1.5 text-[#6b7280] hover:text-white"
                      >
                        {visibleKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button className="p-1.5 text-[#6b7280] hover:text-[#ef4444]">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Endpoints */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#a78bfa]" />
              API 接口
            </h2>
            {endpoints.map((endpoint, index) => (
              <div key={index} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getMethodColor(endpoint.method)}`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm text-[#e2e8f0] font-mono">{endpoint.path}</code>
                </div>
                <h3 className="text-white font-medium mb-2">{endpoint.title}</h3>
                <p className="text-sm text-[#6b7280] mb-4">{endpoint.description}</p>
                
                {endpoint.parameters.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-[#9ca3af] mb-2">参数</h4>
                    <div className="space-y-2">
                      {endpoint.parameters.map((param, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <code className="text-[#a78bfa]">{param.name}</code>
                          <span className="text-[#6b7280]">{param.type}</span>
                          {param.required && (
                            <span className="text-[#ef4444] text-xs">必填</span>
                          )}
                          <span className="text-[#6b7280]">{param.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-[#9ca3af]">示例</h4>
                    <button
                      onClick={() => handleCopy(endpoint.curlExample, endpoint.path)}
                      className="text-xs text-[#6b7280] hover:text-[#a78bfa] flex items-center gap-1"
                    >
                      {copiedPath === endpoint.path ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          复制
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 bg-[#0f0f1a] rounded-xl text-xs text-[#9ca3af] overflow-x-auto border border-[#2e2e42]">
                    {endpoint.curlExample}
                  </pre>
                </div>
              </div>
            ))}
          </div>

          {/* Rate Limits */}
          <div className="glass-card p-6 mt-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
              速率限制
            </h2>
            <div className="space-y-2 text-sm text-[#9ca3af]">
              <p>• 免费版：20 次/月</p>
              <p>• 专业版：无限次</p>
              <p>• 企业版：无限次 + 优先响应</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
