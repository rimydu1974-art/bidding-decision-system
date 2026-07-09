import Link from 'next/link';
import { Calculator, ArrowRight, BarChart3, FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '投标评分在线计算器 - 精准预测中标概率 | OpenCheck',
  description: '输入招标文件的评分规则和您的报价，AI自动计算价格分、商务分、技术分，预测综合得分和中标概率。',
  openGraph: { title: '投标评分在线计算器', description: 'AI自动计算投标评分，预测中标概率', images: [{ url: 'https://www.opencheck.com.cn/api/og?title=投标评分在线计算器&category=工具' }] },
};

export default function ScoreCalcPage() {
  return (
    <div className="min-h-screen bg-[#0A0A12] text-white">
      <main className="mx-auto max-w-3xl px-4 sm:px-8 py-16">
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="w-8 h-8 text-[#06b6d4]" />
          <h1 className="text-3xl font-bold">投标评分在线计算器</h1>
        </div>
        <p className="text-lg text-[#9ca3af] mb-8">
          AI 自动解析招标文件中的评分规则，根据您填写的报价和资质，模拟计算价格分、商务分、技术分及综合总分，精准预测中标概率。
        </p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">评分规则解析</h2>
          <p className="text-[#d1d5db] leading-relaxed mb-4">
            投标评分通常由三部分组成：<strong>价格分</strong>（权重30-60%）、<strong>商务分</strong>（权重10-20%）、<strong>技术分</strong>（权重30-60%）。不同项目类型、不同采购方式的权重分配差异很大。
          </p>
          <div className="space-y-2 text-[#d1d5db]">
            <p><strong>价格分</strong> = (评标基准价 ÷ 投标报价) × 价格权值 × 100。报价最低者得满分，高于基准价按比例扣分。</p>
            <p><strong>商务分</strong> = 企业规模 + 财务状况 + 业绩案例 + 信誉评价，每项有具体评分标准。</p>
            <p><strong>技术分</strong> = 技术方案 + 项目团队 + 实施计划 + 售后服务，通常是拉开差距的关键。</p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">AI 评分预测的优势</h2>
          <div className="space-y-3">
            {['自动从招标文件提取评分表和权重','根据历史中标数据模拟竞争对手报价区间','实时计算不同报价策略下的得分变化','生成最优报价建议和评分趋势图'].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-[#d1d5db]">
                <BarChart3 className="w-5 h-5 text-[#22d3ee] mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#06b6d4]/10 to-[#7c3aed]/10 border border-[#2e2e42] text-center">
          <p className="text-lg text-white font-semibold mb-4">免费计算您的投标分数</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
            <FileText className="w-4 h-4" /> 上传招标文件开始计算 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
