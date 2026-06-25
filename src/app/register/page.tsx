'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Smartphone } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (smsCode.length !== 6) {
      setError('请输入6位验证码');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: smsCode, name, company }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '注册失败');
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const Logo = () => (
    <svg width="26" height="26" viewBox="0 0 32 32">
      <defs>
        <linearGradient id="logo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa"/>
          <stop offset="100%" stopColor="#06b6d4"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="7" fill="url(#logo)"/>
      <path d="M9 16l4 4 10-10" stroke="#fff" strokeWidth="2.5" fill="none"
            strokeLinecap="round" strokeLinejoin="round"/>
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
            <span className="font-bold text-2xl tracking-tight text-white">投标AI</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            智能投标决策<br />支持系统
          </h1>
          <p className="text-lg text-[#9ca3af] mb-8 leading-relaxed">
            注册即享每月20次免费AI分析额度
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[#e2e8f0]">
              <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/10 flex items-center justify-center">
                <span className="text-[#a78bfa] text-sm">01</span>
              </div>
              <span className="text-sm">上传招标文件，AI自动解析</span>
            </div>
            <div className="flex items-center gap-3 text-[#e2e8f0]">
              <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/10 flex items-center justify-center">
                <span className="text-[#a78bfa] text-sm">02</span>
              </div>
              <span className="text-sm">获取投标决策评估报告</span>
            </div>
            <div className="flex items-center gap-3 text-[#e2e8f0]">
              <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/10 flex items-center justify-center">
                <span className="text-[#a78bfa] text-sm">03</span>
              </div>
              <span className="text-sm">一键生成标书，提升中标率</span>
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
              <span className="font-bold text-xl text-white">投标AI</span>
            </div>
            <p className="text-sm text-[#6b7280]">注册即享每月20次免费AI分析</p>
          </div>

          <div className="glass rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-1">注册账号</h2>
            <p className="text-sm text-[#6b7280] mb-6">开始使用智能投标决策支持系统</p>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="输入6位验证码"
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
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">姓名</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="请输入姓名（可选）"
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">公司名称</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="input-field"
                  placeholder="请输入公司名称（可选）"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-sm">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base justify-center disabled:opacity-50">
                {loading ? '注册中...' : '注册'}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-[#6b7280]">
              已有账号？{' '}
              <Link href="/login" className="text-[#a78bfa] hover:underline font-medium">
                立即登录
              </Link>
            </p>

            <p className="mt-3 text-center text-xs text-[#6b7280]">
              注册即表示同意{' '}
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
