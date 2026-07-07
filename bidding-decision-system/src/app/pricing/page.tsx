'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Crown } from 'lucide-react';
import { PLANS } from '@/lib/pricing';

const plans = [
  {
    ...PLANS.free,
    highlight: false,
    buttonText: '开始使用',
    buttonStyle: 'btn-success',
  },
  {
    ...PLANS.single,
    highlight: false,
    buttonText: '¥19 立即解锁单项目',
    buttonStyle: 'btn-primary',
  },
  {
    ...PLANS.pro,
    highlight: true,
    buttonText: '🚀 立即开通专业版',
    buttonStyle: 'btn-accent',
  },
];

export default function PricingPage() {
  const router = useRouter();

  const handleSubscribe = async (planName: string) => {
    try {
      await fetch('/api/behavior/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'click_pay', metadata: { planName } }),
      });
    } catch {}
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
                <span className="text-[#6b7280] ml-1">/ {(plan.period as string) === 'single' ? '项目' : (plan.period as string) === 'year' ? '年' : '月'}</span>
              </div>

              <ul className="space-y-3 flex-1 text-sm text-[#9ca3af] mb-6">
                {plan.features.map((feature: string, idx: number) => (
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
            { q: '免费版和付费版有什么区别？', a: '免费版每月20次AI分析，投标决策表数据完整但老板总结只显示数量，偏离表只有要求列。¥19解锁完整老板总结、完整偏离表（含响应）、风险评估、评分预测等深度功能，同项目投标文件评估免费追加。' },
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
