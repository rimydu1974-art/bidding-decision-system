'use client';

import React, { useState } from 'react';
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
      { name: 'weightConfig', type: 'object', required: false, description: '权重配置' },
    ],
    curlExample: `curl -X POST https://your-domain.com/api/scoring \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "documentId": "doc_67890",
    "criteria": ["技术方案", "商务报价", "服务承诺"]
  }'`,
  },
  {
    method: 'POST',
    path: '/api/ai-write',
    title: 'AI写作',
    description: '利用AI生成投标文档内容，包括技术方案和商务文件。',
    parameters: [
      { name: 'template', type: 'string', required: true, description: '文档模板类型' },
      { name: 'content', type: 'string', required: true, description: '生成内容的提示描述' },
      { name: 'style', type: 'string', required: false, description: '写作风格' },
    ],
    curlExample: `curl -X POST https://your-domain.com/api/ai-write \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "template": "technical_proposal",
    "content": "为智慧城市项目编写技术方案",
    "style": "professional"
  }'`,
  },
  {
    method: 'GET',
    path: '/api/knowledge',
    title: '知识库查询',
    description: '查询投标知识库，获取相关案例和最佳实践。',
    parameters: [
      { name: 'query', type: 'string', required: true, description: '搜索关键词' },
      { name: 'category', type: 'string', required: false, description: '知识分类' },
      { name: 'limit', type: 'number', required: false, description: '返回结果数量限制' },
    ],
    curlExample: `curl -X GET "https://your-domain.com/api/knowledge?query=投标策略&category=best_practices&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
  {
    method: 'GET',
    path: '/api/projects',
    title: '项目列表',
    description: '获取所有投标项目的列表信息。',
    parameters: [
      { name: 'status', type: 'string', required: false, description: '项目状态筛选' },
      { name: 'page', type: 'number', required: false, description: '页码' },
      { name: 'pageSize', type: 'number', required: false, description: '每页数量' },
    ],
    curlExample: `curl -X GET "https://your-domain.com/api/projects?status=active&page=1&pageSize=20" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
];

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET':
      return 'bg-green-500/20 text-green-400 border border-green-500/30';
    case 'POST':
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'PUT':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    case 'DELETE':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  }
};

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<'docs' | 'keys' | 'stats'>('docs');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: '生产环境密钥',
      key: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      createdAt: '2024-01-15',
      lastUsed: '2024-03-10',
    },
    {
      id: '2',
      name: '测试环境密钥',
      key: 'sk-yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
      createdAt: '2024-02-01',
      lastUsed: '2024-03-08',
    },
  ]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);

  const toggleKeyVisibility = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCreateKey = () => {
    if (newKeyName.trim()) {
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: newKeyName,
        key: `sk-${Array.from({ length: 32 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')}`,
        createdAt: new Date().toISOString().split('T')[0],
        lastUsed: '从未使用',
      };
      setApiKeys([...apiKeys, newKey]);
      setNewKeyName('');
      setShowNewKeyForm(false);
    }
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter((key) => key.id !== id));
  };

  const stats = {
    totalRequests: 15234,
    todayRequests: 342,
    avgResponseTime: 245,
    successRate: 98.7,
    monthlyUsage: [
      { month: '1月', requests: 1200 },
      { month: '2月', requests: 1890 },
      { month: '3月', requests: 2340 },
    ],
  };

  return (
    <div className="flex h-screen bg-[#0A0A12] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">API 开放平台</h1>
            <p className="text-[#6b7280] mt-1">投标决策系统 API 文档与管理</p>
          </div>

          <div className="flex gap-2 mb-6 border-b border-[#2e2e42]">
            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'docs'
                  ? 'border-[#7c3aed] text-[#a78bfa]'
                  : 'border-transparent text-[#6b7280] hover:text-[#e2e8f0]'
              }`}
            >
              <Book className="h-4 w-4" />
              API文档
            </button>
            <button
              onClick={() => setActiveTab('keys')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'keys'
                  ? 'border-[#7c3aed] text-[#a78bfa]'
                  : 'border-transparent text-[#6b7280] hover:text-[#e2e8f0]'
              }`}
            >
              <Key className="h-4 w-4" />
              API密钥
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'border-[#7c3aed] text-[#a78bfa]'
                  : 'border-transparent text-[#6b7280] hover:text-[#e2e8f0]'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              使用统计
            </button>
          </div>

          {activeTab === 'docs' && (
            <div className="space-y-6">
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">认证说明</h3>
                </div>
                <p className="text-[#6b7280] text-sm mb-4">所有API请求需要在请求头中携带API密钥进行认证</p>
                <div className="bg-[#0f0f1a] rounded-lg p-4 font-mono text-sm border border-[#2e2e42]">
                  <span className="text-[#6b7280]">{`// 请求头格式`}</span>
                  <br />
                  <span className="text-green-400">Authorization</span>
                  <span className="text-[#e2e8f0]">: </span>
                  <span className="text-yellow-300">Bearer YOUR_API_KEY</span>
                </div>
              </div>

              {endpoints.map((endpoint, index) => (
                <div key={index} className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`${getMethodColor(endpoint.method)} px-2 py-1 rounded text-xs font-mono font-bold`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-[#a78bfa] bg-[#1e1e2e] px-2 py-1 rounded border border-[#2e2e42]">
                      {endpoint.path}
                    </code>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{endpoint.title}</h3>
                  <p className="text-[#6b7280] text-sm mb-4">{endpoint.description}</p>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-[#e2e8f0] mb-2">参数说明</h4>
                    <div className="border border-[#2e2e42] rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-[#1e1e2e]">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium text-[#6b7280]">参数名</th>
                            <th className="text-left px-4 py-2 font-medium text-[#6b7280]">类型</th>
                            <th className="text-left px-4 py-2 font-medium text-[#6b7280]">必填</th>
                            <th className="text-left px-4 py-2 font-medium text-[#6b7280]">描述</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2e2e42]">
                          {endpoint.parameters.map((param, pIndex) => (
                            <tr key={pIndex}>
                              <td className="px-4 py-2 font-mono text-sm text-[#e2e8f0]">{param.name}</td>
                              <td className="px-4 py-2 text-[#6b7280]">{param.type}</td>
                              <td className="px-4 py-2">
                                {param.required ? (
                                  <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/30">
                                    必填
                                  </span>
                                ) : (
                                  <span className="bg-gray-500/20 text-gray-400 text-xs px-2 py-0.5 rounded border border-gray-500/30">
                                    可选
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-[#6b7280]">{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-[#e2e8f0]">cURL 示例</h4>
                      <button
                        className="btn-ghost text-xs"
                        onClick={() => copyToClipboard(endpoint.curlExample)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        复制
                      </button>
                    </div>
                    <pre className="bg-[#0f0f1a] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto text-sm font-mono border border-[#2e2e42]">
                      {endpoint.curlExample}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-1">API 密钥管理</h3>
                <p className="text-[#6b7280] text-sm mb-6">创建和管理您的API访问密钥</p>

                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setShowNewKeyForm(true)} className="btn-primary">
                    <Key className="h-4 w-4 mr-2" />
                    创建新密钥
                  </button>
                </div>

                {showNewKeyForm && (
                  <div className="glass-card p-4 mb-6 border border-[#7c3aed]/30 bg-[#7c3aed]/5">
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="输入密钥名称..."
                        className="input-field flex-1"
                      />
                      <button onClick={handleCreateKey} className="btn-primary">
                        创建
                      </button>
                      <button className="btn-ghost" onClick={() => setShowNewKeyForm(false)}>
                        取消
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="border border-[#2e2e42] rounded-lg p-4 bg-[#0f0f1a]/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Key className="h-5 w-5 text-[#6b7280]" />
                          <span className="font-medium text-[#e2e8f0]">{apiKey.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="btn-ghost p-2"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {showKeys[apiKey.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            className="btn-ghost p-2"
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            className="btn-ghost p-2 text-red-400 hover:text-red-300"
                            onClick={() => handleDeleteKey(apiKey.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-[#1e1e2e] rounded p-3 font-mono text-sm text-[#e2e8f0] border border-[#2e2e42]">
                        {showKeys[apiKey.id]
                          ? apiKey.key
                          : apiKey.key.replace(/./g, '*').slice(0, 20) + '...'}
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-[#6b7280]">
                        <span>创建时间: {apiKey.createdAt}</span>
                        <span>最后使用: {apiKey.lastUsed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card p-6">
                  <div className="text-sm text-[#6b7280]">总请求数</div>
                  <div className="text-3xl font-bold text-white">{stats.totalRequests.toLocaleString()}</div>
                </div>
                <div className="glass-card p-6">
                  <div className="text-sm text-[#6b7280]">今日请求</div>
                  <div className="text-3xl font-bold text-white">{stats.todayRequests}</div>
                </div>
                <div className="glass-card p-6">
                  <div className="text-sm text-[#6b7280]">平均响应时间</div>
                  <div className="text-3xl font-bold text-white">{stats.avgResponseTime}ms</div>
                </div>
                <div className="glass-card p-6">
                  <div className="text-sm text-[#6b7280]">成功率</div>
                  <div className="text-3xl font-bold text-green-400">{stats.successRate}%</div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-1">月度使用趋势</h3>
                <p className="text-[#6b7280] text-sm mb-4">最近三个月的API调用统计</p>
                <div className="space-y-4">
                  {stats.monthlyUsage.map((month, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="w-12 text-sm text-[#6b7280]">{month.month}</span>
                      <div className="flex-1 bg-[#1e1e2e] rounded-full h-6 overflow-hidden border border-[#2e2e42]">
                        <div
                          className="bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] h-full rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${(month.requests / 3000) * 100}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {month.requests.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">API 状态</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium">所有服务运行正常</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
