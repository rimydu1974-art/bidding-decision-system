// 简单的内存Rate Limiter（生产环境建议使用Redis）

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// 定期清理过期记录
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // 每分钟清理一次

export interface RateLimitConfig {
  windowMs: number;  // 时间窗口（毫秒）
  max: number;       // 最大请求数
}

// 预设的限流配置
export const RATE_LIMITS = {
  // 登录：每15分钟最多5次
  login: { windowMs: 15 * 60 * 1000, max: 5 },
  // 注册：每小时最多3次
  register: { windowMs: 60 * 60 * 1000, max: 3 },
  // 密码重置：每小时最多3次
  passwordReset: { windowMs: 60 * 60 * 1000, max: 3 },
  // AI分析：每分钟最多10次
  ai: { windowMs: 60 * 1000, max: 10 },
  // API通用：每分钟最多60次
  api: { windowMs: 60 * 1000, max: 60 },
};

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    // 新建或重置
    const resetAt = now + config.windowMs;
    rateLimitMap.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.max - 1, resetAt };
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.max - entry.count, resetAt: entry.resetAt };
}

export function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
