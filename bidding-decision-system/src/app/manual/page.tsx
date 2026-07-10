'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Download, BookOpen, FileText, ChevronRight, ExternalLink } from 'lucide-react';

const chapters = [
  { id: 1, title: '欢迎使用OpenCheck', page: '第1章' },
  { id: 2, title: '注册与登录', page: '第2章' },
  { id: 3, title: '工作台介绍', page: '第3章' },
  { id: 4, title: '上传与分析', page: '第4章' },
  { id: 5, title: '查看分析结果', page: '第5章' },
  { id: 6, title: '导出报告', page: '第6章' },
  { id: 7, title: '项目管理', page: '第7章' },
  { id: 8, title: '评审中心', page: '第8章' },
  { id: 9, title: '套餐与定价对比', page: '第9章' },
  { id: 10, title: '常见问题', page: '第10章' },
];

export default function ManualPage() {
  const [activeChapter, setActiveChapter] = useState(1);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/docs/USER-MANUAL.pdf';
    link.download = 'OpenCheck-使用手册.pdf';
    link.click();
  };

  return (
    <div className="flex h-screen bg-[#0A0A12]">
      <Sidebar />

      <main className="flex-1 overflow-hidden flex">
        {/* 左侧目录 */}
        <div className="w-72 bg-[#0f0f1a] border-r border-[#2e2e42] flex flex-col">
          <div className="p-6 border-b border-[#2e2e42]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">使用手册</h1>
                <p className="text-xs text-[#6b7280]">User Manual</p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              下载PDF手册
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-xs text-[#6b7280] mb-3 px-2">目录 / Contents</p>
            <div className="space-y-1">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => setActiveChapter(chapter.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    activeChapter === chapter.id
                      ? 'bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30'
                      : 'text-[#9ca3af] hover:bg-[#1e1e2e] hover:text-white border border-transparent'
                  }`}
                >
                  <span className="text-xs font-mono w-6 text-center opacity-60">
                    {String(chapter.id).padStart(2, '0')}
                  </span>
                  <span className="text-sm flex-1">{chapter.title}</span>
                  <ChevronRight className="w-3 h-3 opacity-40" />
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-[#2e2e42]">
            <a
              href="https://www.opencheck.com.cn/pricing"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1e1e2e] hover:bg-[#2e2e42] text-[#9ca3af] hover:text-white rounded-xl transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              查看套餐定价
            </a>
          </div>
        </div>

        {/* 右侧PDF查看器 */}
        <div className="flex-1 flex flex-col">
          <div className="px-6 py-4 border-b border-[#2e2e42] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#a78bfa]" />
              <div>
                <h2 className="text-white font-medium">
                  {chapters[activeChapter - 1]?.title}
                </h2>
                <p className="text-xs text-[#6b7280]">
                  OpenCheck 智能投标决策支持系统 · 客户使用手册 v1.0
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6b7280]">
                第 {activeChapter} / {chapters.length} 章
              </span>
            </div>
          </div>

          <div className="flex-1 bg-[#1e1e2e]">
            <iframe
              src="/docs/USER-MANUAL.pdf"
              className="w-full h-full border-0"
              title="OpenCheck 使用手册"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
