import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const size = Math.min(512, Math.max(16, parseInt(searchParams.get('size') ?? '192', 10)));

  return new ImageResponse(
    (
      <div
        style={{
          background: '#c1623f',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: `${Math.round(size * 0.22)}px`,
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: Math.round(size * 0.6),
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            transform: 'rotate(-4deg)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            marginTop: Math.round(size * 0.04),
          }}
        >
          s
        </span>
      </div>
    ),
    { width: size, height: size },
  );
}
