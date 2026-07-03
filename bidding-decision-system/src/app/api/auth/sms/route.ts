import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/sms';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';

const MAX_VERIFY_ATTEMPTS = 5;
const smsStore = new Map<string, { code: string; expires: number; attempts: number }>();

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const { phone } = await request.json();

    if (!phone || phone.length !== 11) {
      return NextResponse.json({ error: '请输入正确的手机号' }, { status: 400 });
    }

    // 速率限制：每个手机号每分钟最多1次，每小时最多5次
    const phoneRateLimit = checkRateLimit(`sms-phone:${phone}`, { windowMs: 60 * 1000, max: 1 });
    if (!phoneRateLimit.allowed) {
      return NextResponse.json({ error: '发送过快，请1分钟后再试' }, { status: 429 });
    }

    const hourRateLimit = checkRateLimit(`sms-hour:${phone}`, { windowMs: 3600 * 1000, max: 5 });
    if (!hourRateLimit.allowed) {
      return NextResponse.json({ error: '发送过于频繁，请1小时后再试' }, { status: 429 });
    }

    // IP速率限制：每个IP每小时最多10次
    const ipRateLimit = checkRateLimit(`sms-ip:${ip}`, { windowMs: 3600 * 1000, max: 10 });
    if (!ipRateLimit.allowed) {
      return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000;

    smsStore.set(phone, { code, expires, attempts: 0 });

    // 使用SMS服务发送验证码
    const result = await sendSMS(phone, code);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error || '发送失败' }, { status: 500 });
    }

    console.log(`[SMS] 验证码已发送: ${phone}`);

    return NextResponse.json({ success: true, message: '验证码已发送' });
  } catch {
    return NextResponse.json({ error: '发送失败' }, { status: 500 });
  }
}

export function verifySmsCode(phone: string, code: string): boolean {
  const stored = smsStore.get(phone);
  if (!stored) return false;

  if (Date.now() > stored.expires) {
    smsStore.delete(phone);
    return false;
  }

  // 暴力破解防护：最多尝试5次
  if (stored.attempts >= MAX_VERIFY_ATTEMPTS) {
    smsStore.delete(phone);
    return false;
  }

  if (stored.code !== code) {
    stored.attempts++;
    return false;
  }

  smsStore.delete(phone);
  return true;
}
