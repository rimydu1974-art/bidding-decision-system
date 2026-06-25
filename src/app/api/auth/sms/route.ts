import { NextRequest, NextResponse } from 'next/server';

const smsStore = new Map<string, { code: string; expires: number }>();

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || phone.length !== 11) {
      return NextResponse.json({ error: '请输入正确的手机号' }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000;

    smsStore.set(phone, { code, expires });

    console.log(`[SMS] ${phone} -> ${code}`);

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
  if (stored.code !== code) return false;
  smsStore.delete(phone);
  return true;
}
