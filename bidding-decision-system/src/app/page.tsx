'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Crown, Upload, Brain, Shield, FileSearch, AlertTriangle, CheckSquare } from 'lucide-react';
import { PLANS } from '@/lib/pricing';

const plans = [
  {
    ...PLANS.free,
    highlight: false,
    tag: '新手入门',
    tagColor: 'text-emerald-400 border-emerald-400/30',
    buttonText: '免费开始',
    buttonStyle: 'btn-success',
  },
  {
    ...PLANS.single,
    highlight: false,
    tag: '灵活按需',
    tagColor: 'text-orange-400 border-orange-400/30',
    buttonText: '¥19 立即解锁',
    buttonStyle: 'btn-primary',
  },
  {
    ...PLANS.pro,
    highlight: true,
    tag: '团队首选',
    tagColor: 'text-cyan-400 border-cyan-400/30',
    buttonText: '立即开通专业版',
    buttonStyle: 'btn-accent',
  },
];

const features = [
  {
    icon: <Brain className="w-6 h-6 text-cyan-400" />,
    title: 'AI速读',
    desc: '3分钟完成招标文件深度解析',
    items: ['上传招标文件（PDF/Word/扫描件）', 'AI深度解析资质要求、评分标准', '生成老板决策摘要：是否参与·核心门槛·制胜策略'],
    stat: { value: '3分钟', label: '200页标书 → 1页决策摘要' },
  },
  {
    icon: <Shield className="w-6 h-6 text-rose-400" />,
    title: '智能风控',
    desc: '废标风险自动发现，合规性一键检测',
    items: ['废标风险自动发现：资质不符、签字盖章遗漏、格式错误', '缺失材料智能提醒：自动比对招标清单，生成补交清单', '合规性一键检测：资质证照有效期、经营范围匹配'],
    stat: { value: '99%', label: '废标隐患拦截率' },
  },
  {
    icon: <FileSearch className="w-6 h-6 text-purple-400" />,
    title: '6大核心指标',
    desc: '全景扫描，每条结论附带引用来源',
    items: ['响应性审查 · 原文定位', '资质合规校验 · 证照核验', '报价合理性 · 横向比对'],
    stat: { value: '200+', label: '风险规则库' },
  },
];

export default function HomePage() {
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
    <div className="min-h-screen bg-[#0A0A12] flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">OpenCheck</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            登录
          </button>
          <button
            onClick={() => router.push('/register')}
            className="btn-accent px-4 py-2 text-sm"
          >
            免费注册
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center mb-12 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            智能投标决策平台
          </h1>
          <p className="text-lg text-gray-400 mb-2">
            3分钟生成投标决策评估表，AI智能分析招标文件，提前发现废标风险
          </p>
          <p className="text-sm text-gray-500">
            零幻觉 · 条条有出处 · 可溯源
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-16">
          {features.map((feature, idx) => (
            <div key={idx} className="glass-card rounded-2xl p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                {feature.icon}
                <div>
                  <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                  <p className="text-xs text-gray-400">{feature.desc}</p>
                </div>
              </div>
              <ul className="space-y-2 flex-1 text-sm text-gray-300 mb-4">
                {feature.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-700/50 pt-4 mt-auto">
                <span className="text-2xl font-extrabold gradient-text">{feature.stat.value}</span>
                <span className="text-xs text-gray-500 ml-2">{feature.stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Section */}
        <div className="w-full max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">免费起步 · 按需升级</h2>
            <p className="text-gray-400">20次/月 免费 · ¥19/次 按需 · ¥99/月 畅用 · 无需信用卡 · 注册即用</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={plan.highlight ? 'gradient-border p-[1px] rounded-2xl' : 'glass-card p-[1px] rounded-2xl'}
                style={plan.highlight ? {
                  background: 'linear-gradient(#1e1e2e,#1e1e2e) padding-box, linear-gradient(135deg,#7c3aed,#06b6d4) border-box',
                } : undefined}
              >
                <div className={`rounded-2xl p-6 flex flex-col h-full ${plan.highlight ? 'bg-[#0f0f1a]' : 'bg-transparent'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">{plan.displayName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${plan.tagColor}`}>
                      {plan.tag}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{plan.description}</p>

                  <div className="mb-4">
                    <span className="text-3xl font-extrabold gradient-text">
                      {plan.price === 0 ? '¥0' : `¥${plan.price}`}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">/ {(plan.period as string) === 'single' ? '次' : '月'}</span>
                  </div>

                  <ul className="space-y-2 flex-1 text-sm text-gray-300 mb-5">
                    {plan.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.name)}
                    className={`${plan.buttonStyle} w-full justify-center py-2.5 text-sm`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full px-6 py-6 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-500">
          <span>OpenCheck 智检 · Bid Decision OS</span>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/login')} className="hover:text-gray-300 transition-colors">
              登录
            </button>
            <button onClick={() => router.push('/register')} className="hover:text-gray-300 transition-colors">
              注册
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
