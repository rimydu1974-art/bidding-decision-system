import Link from 'next/link';
import { ClipboardCheck, ArrowRight, CheckCircle2, FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '投标资质要求核对表 - 自动匹配招标资质条件 | OpenCheck',
  description: 'AI自动提取招标文件中的资质要求，与您的企业资质库进行智能匹配，标注通过项和不满足项，生成资质差距分析报告。',
  openGraph: { title: '投标资质要求核对表', description: 'AI自动匹配招标资质要求，生成差距分析报告', images: [{ url: 'https://www.opencheck.com.cn/api/og?title=投标资质要求核对表&category=工具' }] },
};

export default function QualificationPage() {
  return (
    <div className="min-h-screen bg-[#0A0A12] text-white">
      <main className="mx-auto max-w-3xl px-4 sm:px-8 py-16">
        <div className="flex items-center gap-3 mb-6">
          <ClipboardCheck className="w-8 h-8 text-[#10b981]" />
          <h1 className="text-3xl font-bold">投标资质要求核对表</h1>
        </div>
        <p className="text-lg text-[#9ca3af] mb-8">
          AI 自动提取招标文件中的所有资质门槛——注册资本、成立年限、专业资质、业绩要求、人员证书等，与您的企业资质库进行智能匹配，一目了然。
        </p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">资质要求有多复杂？</h2>
          <p className="text-[#d1d5db] leading-relaxed mb-4">
            一份典型的政府采购招标文件中，资质相关条款通常分散在多个章节——投标人须知、资格性审查标准、商务要求、技术规格书——总数可达20-50条。手动逐条核对不仅耗时，还容易遗漏带"★"号的实质性要求。
          </p>
          <p className="text-[#d1d5db] leading-relaxed">
            常见资质类型包括：基础资质（营业执照、税务登记）、专业资质（ISO认证、行业许可证、安全生产许可证）、财务资质（审计报告、银行资信证明）、业绩要求（同类项目合同、验收报告）、人员资质（注册证书、社保证明）。
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">AI 自动核对流程</h2>
          <div className="space-y-3">
            {['上传招标文件，AI提取所有资质要求条款','逐条匹配企业资质库中的证书和文件','标注✅满足/❌不满足/⚠️需补充','生成差距分析报告和材料准备清单'].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-[#d1d5db]">
                <CheckCircle2 className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#10b981]/10 to-[#06b6d4]/10 border border-[#2e2e42] text-center">
          <p className="text-lg text-white font-semibold mb-4">免费核对企业资质</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#10b981] to-[#06b6d4] text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
            <FileText className="w-4 h-4" /> 开始核对资质 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
