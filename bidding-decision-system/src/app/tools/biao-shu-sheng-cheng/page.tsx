import Link from 'next/link';
import { PenTool, ArrowRight, Sparkles, FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI标书自动生成工具 - 技术标商务标一键生成 | OpenCheck',
  description: '上传招标文件，AI自动提取技术要求和商务条款，结合企业资质库智能填充，一键生成技术标和商务标初稿，节省80%标书编写时间。',
  openGraph: { title: 'AI标书自动生成工具', description: '上传招标文件，AI一键生成技术标和商务标初稿', images: [{ url: 'https://www.opencheck.com.cn/api/og?title=AI标书自动生成工具&category=工具' }] },
};

export default function BiaoShuPage() {
  return (
    <div className="min-h-screen bg-[#0A0A12] text-white">
      <main className="mx-auto max-w-3xl px-4 sm:px-8 py-16">
        <div className="flex items-center gap-3 mb-6">
          <PenTool className="w-8 h-8 text-[#7c3aed]" />
          <h1 className="text-3xl font-bold">AI标书自动生成工具</h1>
        </div>
        <p className="text-lg text-[#9ca3af] mb-8">
          AI 自动解析招标文件中的技术规格和商务条款，智能匹配企业资质库、业绩案例和技术方案模板，一键生成技术标和商务标初稿。
        </p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">写标书到底有多耗时？</h2>
          <p className="text-[#d1d5db] leading-relaxed mb-4">
            一份完整的技术标书通常在50-200页之间，包含技术方案、项目组织、人员配置、实施计划、质量保证、售后服务等章节。据统计，中小企业投标团队编写一份技术标平均耗时40-80工时，大型项目可达200工时以上。
          </p>
          <p className="text-[#d1d5db] leading-relaxed">
            其中大量工作是重复性的——复制粘贴公司介绍、资质证书、业绩合同、人员简历。AI可以将这部分工作自动化，让团队专注于差异化方案和策略制定。
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">AI 标书生成流程</h2>
          <div className="space-y-3">
            {['上传招标文件，AI解析技术要求和商务条款','自动生成标书框架和章节结构','智能填充企业资质、业绩和人员信息','生成格式规范的Word/PDF标书初稿'].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-[#d1d5db]">
                <Sparkles className="w-5 h-5 text-[#a78bfa] mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#7c3aed]/10 to-[#06b6d4]/10 border border-[#2e2e42] text-center">
          <p className="text-lg text-white font-semibold mb-4">免费试用AI标书生成</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
            <FileText className="w-4 h-4" /> 上传招标文件开始生成 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
