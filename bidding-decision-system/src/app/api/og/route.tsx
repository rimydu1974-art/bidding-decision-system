import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || '招投标智库';
  const category = searchParams.get('category') || '';

  const categoryColors: Record<string, string> = {
    '法规解读': '#7c3aed',
    '废标案例': '#ef4444',
    '决策推演': '#06b6d4',
    '行业洞察': '#10b981',
    '技术趋势': '#f59e0b',
  };
  const accent = categoryColors[category] || '#7c3aed';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          width: 1200,
          height: 630,
          padding: 80,
          background: `linear-gradient(135deg, #0A0A12 0%, #1a1a2e 50%, ${accent}20 100%)`,
          fontFamily: '"Noto Sans SC", sans-serif',
        }}
      >
        {category && (
          <div
            style={{
              display: 'flex',
              padding: '8px 20px',
              borderRadius: 20,
              backgroundColor: `${accent}30`,
              color: accent,
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 30,
            }}
          >
            {category}
          </div>
        )}
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.3,
            maxWidth: 1000,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 50,
            gap: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 48,
              height: 48,
              borderRadius: 14,
              background: `linear-gradient(135deg, #7c3aed, #06b6d4)`,
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              color: '#fff',
              fontWeight: 700,
            }}
          >
            O
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 22, color: '#ffffff', fontWeight: 600 }}>OpenCheck 投标AI</div>
            <div style={{ fontSize: 16, color: '#6b7280', marginTop: 4 }}>智能投标决策支持系统</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
