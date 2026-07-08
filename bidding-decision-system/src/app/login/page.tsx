'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Mail, Smartphone } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);

  const handleSendSms = async () => {
    if (!phone || phone.length !== 11) {
      setError('请输入正确的手机号');
      return;
    }
    setError('');
    try {
      const res = await fetch('/api/auth/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '发送失败');
      setSmsSent(true);
      setSmsCountdown(60);
      const timer = setInterval(() => {
        setSmsCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/sms-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: smsCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '登录失败');
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '登录失败');
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const Logo = () => (
    <svg width="140" height="46" viewBox="0 0 440 120">
      <defs>
        <linearGradient id="aframe" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED"/>
          <stop offset="100%" stopColor="#06B6D4"/>
        </linearGradient>
        <linearGradient id="acheck" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#06B6D4"/>
          <stop offset="50%" stopColor="#A78BFA"/>
          <stop offset="100%" stopColor="#7C3AED"/>
        </linearGradient>
        <linearGradient id="aword" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#A78BFA"/>
          <stop offset="100%" stopColor="#22D3EE"/>
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="100" height="100" rx="26" fill="none" stroke="url(#aframe)" strokeWidth="2.5"/>
      <rect x="20" y="20" width="80" height="80" rx="19" fill="none" stroke="url(#aframe)" strokeWidth="0.6" opacity="0.25"/>
      <polyline points="38,62 56,82 84,48" fill="none" stroke="url(#acheck)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="84" cy="48" r="3" fill="#22D3EE"/>
      <text x="140" y="68" fontFamily="'Inter','Helvetica Neue','Arial Black','PingFang SC','Microsoft YaHei',sans-serif" fontSize="38" fontWeight="900" letterSpacing="-0.8" fill="url(#aword)">OpenCheck</text>
      <text x="142" y="88" fontFamily="'Inter','Helvetica Neue','PingFang SC','Microsoft YaHei',sans-serif" fontSize="11" fontWeight="500" letterSpacing="1.2" fill="#8B9BB4">BID DECISION OS</text>
    </svg>
  );

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/25 via-[#0A0A12] to-[#06b6d4]/12" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 35%, rgba(124,58,237,0.18) 0%, transparent 50%), radial-gradient(circle at 75% 65%, rgba(6,182,212,0.12) 0%, transparent 50%)',
        }} />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <Logo />
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            <span className="text-white">AI 驱动的</span><br />
            <span className="gradient-text">投标决策与标书生成平台</span>
          </h1>
          <p className="text-lg text-[#9ca3af] mb-10 leading-relaxed">
            上传招标文件，AI 自动解析、评估风险、生成评分建议，让每一次投标决策都有据可依。
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#7c3aed]/10 flex items-center justify-center mx-auto mb-2">
                <FileText className="w-6 h-6 text-[#a78bfa]" />
              </div>
              <p className="text-sm font-medium text-white">智能解析</p>
              <p className="text-xs text-[#6b7280]">秒级提取招标核心要素</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#f472b6]/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">🧠</span>
              </div>
              <p className="text-sm font-medium text-white">AI 评估</p>
              <p className="text-xs text-[#6b7280]">多维风险与可投性判断</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#f59e0b]/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">✍️</span>
              </div>
              <p className="text-sm font-medium text-white">标书生成</p>
              <p className="text-xs text-[#6b7280]">技术标商务标一键输出</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[390px]">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Logo />
            </div>
            <p className="text-sm text-[#6b7280]">智能投标决策支持系统</p>
          </div>

          <div className="glass rounded-2xl p-8">
            {/* Tab switcher */}
            <div className="flex mb-6 bg-[#0f0f1a] rounded-xl p-1">
              <button
                onClick={() => setAuthMode('phone')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  authMode === 'phone' ? 'bg-[#1e1e2e] text-white' : 'text-[#6b7280]'
                }`}
              >
                手机号登录
              </button>
              <button
                onClick={() => setAuthMode('email')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  authMode === 'email' ? 'bg-[#1e1e2e] text-white' : 'text-[#6b7280]'
                }`}
              >
                邮箱登录
              </button>
            </div>

            {authMode === 'phone' ? (
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#9ca3af] mb-2">手机号</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field"
                    placeholder="请输入手机号"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#9ca3af] mb-2">验证码</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      className="input-field flex-1"
                      placeholder="输入验证码"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSendSms}
                      disabled={smsCountdown > 0}
                      className="btn-ghost whitespace-nowrap text-sm px-5 disabled:opacity-50"
                    >
                      {smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-sm">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base justify-center disabled:opacity-50">
                  {loading ? '登录中...' : '登录'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#9ca3af] mb-2">邮箱</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="请输入邮箱"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#9ca3af] mb-2">密码</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="请输入密码"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-sm">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base justify-center disabled:opacity-50">
                  {loading ? '登录中...' : '登录'}
                </button>
              </form>
            )}

            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-[#2e2e42]" />
              <span className="text-xs text-[#6b7280]">或</span>
              <div className="flex-1 h-px bg-[#2e2e42]" />
            </div>

            <Link
              href="/register"
              className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#1e1e2e] text-sm text-[#e2e8f0] hover:bg-[#2a2a3c] transition-all"
            >
              <Smartphone className="w-4 h-4" />
              注册新账号
            </Link>

            <p className="mt-5 text-center text-xs text-[#6b7280]">
              登录即表示同意{' '}
              <span className="text-[#a78bfa] hover:underline cursor-pointer">服务条款</span>{' '}
              和{' '}
              <span className="text-[#a78bfa] hover:underline cursor-pointer">隐私政策</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
