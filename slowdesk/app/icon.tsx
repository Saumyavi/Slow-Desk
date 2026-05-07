import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: '7px',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 20,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            transform: 'rotate(-4deg)',
            lineHeight: 1,
            marginTop: 2,
          }}
        >
          s
        </span>
      </div>
    ),
    { ...size },
  );
}
