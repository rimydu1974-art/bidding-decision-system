'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowLeft, CreditCard, Zap, Building, Star } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlight: boolean;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Star className="h-6 w-6" />,
  single: <CreditCard className="h-6 w-6" />,
  pro: <Zap className="h-6 w-6" />,
  'pro-year': <Zap className="h-6 w-6" />,
  enterprise: <Building className="h-6 w-6" />,
};

const PLAN_PERIOD_LABELS: Record<string, string> = {
  month: '月',
  year: '年',
  single: '/单次',
};

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/pricing');
      const data = await response.json();
      if (response.ok) {
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Failed to load pricing plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    // 跳转到支付页面
    router.push(`/payment?plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <h1 className="text-xl font-bold text-gray-900">定价方案</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">选择适合您的方案</h2>
          <p className="mt-4 text-lg text-gray-600">
            灵活的定价方案，满足不同规模团队的需求
          </p>
        </div>

        {/* 加载状态 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">加载中...</p>
          </div>
        ) : (
          /* 定价卡片 */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.highlight
                    ? 'border-2 border-blue-500 shadow-lg'
                    : 'border border-gray-200'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1">最受欢迎</Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                        plan.highlight ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {PLAN_ICONS[plan.name] || <Star className="h-6 w-6" />}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.displayName}</h3>
                    <p className="text-gray-500 mt-1">{plan.description}</p>
                  </div>

                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price === 0 ? '免费' : `¥${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-500">/{PLAN_PERIOD_LABELS[plan.period] || plan.period}</span>
                    )}
                    {plan.name === 'pro-year' && (
                      <div className="text-sm text-red-500 mt-1">
                        <span className="line-through text-gray-400">¥1188</span> 省¥389
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={subscribing && selectedPlan === plan.name}
                    className={`w-full ${
                      plan.highlight ? 'bg-blue-600 hover:bg-blue-700' : ''
                    }`}
                    variant={plan.highlight ? 'default' : 'outline'}
                  >
                    {subscribing && selectedPlan === plan.name ? (
                      '处理中...'
                    ) : plan.price === 0 ? (
                      '开始使用'
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        立即订阅
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">常见问题</h3>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">可以随时升级或降级吗？</h4>
                <p className="text-gray-600">
                  是的，您可以随时在账户设置中升级或降级您的订阅方案。升级立即生效，降级在当前周期结束后生效。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">支持哪些支付方式？</h4>
                <p className="text-gray-600">
                  我们支持支付宝、微信支付、银行卡等多种支付方式。企业版还支持对公转账。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">有退款政策吗？</h4>
                <p className="text-gray-600">
                  如果您在订阅后7天内不满意，可以申请全额退款。超过7天后，我们将按剩余天数比例退款。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
