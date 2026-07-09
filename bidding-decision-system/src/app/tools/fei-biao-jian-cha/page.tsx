import Link from 'next/link';
import { AlertTriangle, ArrowRight, Shield, FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '废标条件在线检查工具 - 3分钟识别投标废标风险 | OpenCheck',
  description: 'AI自动解析招标文件中的废标条件，逐条比对您的资质，提前发现资格性审查和符合性审查风险点，降低废标概率。',
  openGraph: { title: '废标条件在线检查工具', description: 'AI自动解析招标文件废标条件，提前发现风险', images: [{ url: 'https://www.opencheck.com.cn/api/og?title=废标条件在线检查工具&category=工具' }] },
};

export default function FeiBiaoPage() {
  return (
    <div className="min-h-screen bg-[#0A0A12] text-white">
      <main className="mx-auto max-w-3xl px-4 sm:px-8 py-16">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-8 h-8 text-[#ef4444]" />
          <h1 className="text-3xl font-bold">废标条件在线检查工具</h1>
        </div>
        <p className="text-lg text-[#9ca3af] mb-8">
          上传招标文件，AI 自动提取所有废标条件和无效报价情形，逐条与您的企业资质进行比对，3分钟生成废标风险报告。
        </p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">为什么需要废标检查？</h2>
          <p className="text-[#d1d5db] leading-relaxed mb-4">
            据统计，2024年全国招标项目中约有12%的投标因资格性审查或符合性审查不通过而被废标。废标不仅损失标书制作成本（平均2-5万元），更重要的是错失商业机会。
          </p>
          <p className="text-[#d1d5db] leading-relaxed">
            常见的废标原因包括：资质文件不全或不满足★号条款、联合体协议缺失关键条款、报价超出最高限价、技术方案未逐条响应实质性要求、签字盖章不规范等。手动检查一份上百页的招标文件至少需要2-3小时，且容易遗漏。
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">AI 如何帮您检查</h2>
          <div className="space-y-3">
            {['自动解析招标文件中所有★号条款和废标条件','逐条比对您的企业资质、业绩和证书','生成风险等级评估（高/中/低）','标注每项风险的应对建议和时限'].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-[#d1d5db]">
                <Shield className="w-5 h-5 text-[#22d3ee] mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#ef4444]/10 to-[#7c3aed]/10 border border-[#2e2e42] text-center">
          <p className="text-lg text-white font-semibold mb-4">立即体验废标检查</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ef4444] to-[#7c3aed] text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
            <FileText className="w-4 h-4" /> 免费开始检查 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
