'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Crown } from 'lucide-react';

const plans = [
  {
    name: 'free',
    displayName: '免费版',
    price: 0,
    period: '20次/月',
    description: '体验AI分析能力',
    highlight: false,
    features: [
      'AI分析招标文件',
      '6项信息提取（含来源页码）',
      '基本信息/财务信息/评分规则',
      '项目需求/时间要求/资质要求',
      '老板总结',
      '每月20次免费额度',
    ],
    buttonText: '开始使用',
    buttonStyle: 'btn-success',
  },
  {
    name: 'single',
    displayName: '单次基础版',
    price: 19,
    period: '/项目',
    description: '解锁单项目完整分析',
    highlight: false,
    features: [
      '解锁潜在废标风险',
      '解锁评分关键项',
      '解锁电话咨询问题',
      '解锁准备分工项目包',
      '解锁投标策略建议',
      '解锁容易失分项',
    ],
    buttonText: '立即去上传标书',
    buttonStyle: 'btn-primary',
  },
  {
    name: 'pro',
    displayName: '专业会员版',
    price: 99,
    period: '/月',
    description: '不限项目深度分析',
    highlight: true,
    features: [
      '不限项目深度分析',
      '不限标书生成',
      '不限评分拆解',
      'API接口',
      '优先客服',
      '企业知识库',
    ],
    buttonText: '🚀 立即开通专业版',
    buttonStyle: 'btn-accent',
  },
];

export default function PricingPage() {
  const router = useRouter();

  const handleSubscribe = (planName: string) => {
    if (planName === 'free') {
      router.push('/register');
    } else {
      router.push(`/payment?plan=${planName}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A12] flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-3">选择合适您的方案</h1>
        <p className="text-[#9ca3af]">从单次分析到专业版，灵活满足不同规模的投标需求</p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] w-full">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={plan.highlight ? 'gradient-border p-[1px] rounded-2xl' : 'glass-card p-[1px] rounded-2xl'}
            style={plan.highlight ? {
              background: 'linear-gradient(#1e1e2e,#1e1e2e) padding-box, linear-gradient(135deg,#7c3aed,#06b6d4) border-box',
            } : undefined}
          >
            <div className={`rounded-2xl p-8 flex flex-col h-full ${plan.highlight ? 'bg-[#0f0f1a]' : 'bg-transparent'}`}>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-white">{plan.displayName}</h3>
                {plan.highlight && <Crown className="w-5 h-5 text-[#f59e0b]" />}
              </div>
              <p className="text-sm text-[#6b7280] mb-4">{plan.description}</p>

              <div className="mb-5">
                <span className="text-4xl font-extrabold gradient-text">
                  {plan.price === 0 ? '¥0' : `¥${plan.price}`}
                </span>
                <span className="text-[#6b7280] ml-1">/ {plan.period}</span>
              </div>

              <ul className="space-y-3 flex-1 text-sm text-[#9ca3af] mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.name)}
                className={`${plan.buttonStyle} w-full justify-center py-3 text-base`}
              >
                {plan.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-16 max-w-3xl w-full">
        <h3 className="text-2xl font-bold text-white text-center mb-8">常见问题</h3>
        <div className="space-y-4">
          {[
            { q: '可以随时升级或降级吗？', a: '是的，您可以随时在账户设置中升级或降级您的订阅方案。升级立即生效，降级在当前周期结束后生效。' },
            { q: '支持哪些支付方式？', a: '我们支持支付宝、微信支付、银行卡等多种支付方式。企业版还支持对公转账。' },
            { q: '免费版和付费版有什么区别？', a: '免费版每月提供20次AI分析额度，可查看基础评估结果。付费版可解锁完整风险分析、评分关键项、准备分工项目包等深度内容。' },
          ].map((faq, idx) => (
            <div key={idx} className="glass-card p-6">
              <h4 className="font-semibold text-white mb-2">{faq.q}</h4>
              <p className="text-[#9ca3af] text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
