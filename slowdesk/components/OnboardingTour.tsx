'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';

export default function OnboardingTour() {
  const { completeTour } = useApp();
  const router = useRouter();
  const [actionsVisible, setActionsVisible] = useState(false);
  const [leaving,        setLeaving]        = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setActionsVisible(true), 2800);
    return () => clearTimeout(t1);
  }, []);

  const dismiss = (path?: string) => {
    setLeaving(true);
    setTimeout(() => {
      completeTour();
      if (path) router.push(path);
    }, 650);
  };

  const actions = [
    { icon: '✅', label: 'Add a task',   path: '/tasks',   color: '#c1623f' },
    { icon: '📝', label: 'Write a note', path: '/notes',   color: '#7a9e7e' },
    { icon: '🌱', label: 'Log a habit',  path: '/habits',  color: '#5b8fbf' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backdropFilter: 'blur(14px) saturate(0.6)',
      background: 'rgba(18,12,7,0.78)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: leaving ? 0 : 1,
      transition: 'opacity 0.65s ease',
    }}>
      <style>{`
        @keyframes sd-rise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sd-shine {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      {/* Text lines */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 52, textAlign: 'center' }}>

        <div style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 15, color: 'rgba(255,255,255,0.4)',
          animation: 'sd-rise 0.7s ease forwards', animationDelay: '0.1s', opacity: 0,
          letterSpacing: '0.04em',
        }}>
          welcome to
        </div>

        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 72, lineHeight: 1,
          letterSpacing: '-0.03em', color: '#fff',
          animation: 'sd-rise 0.8s cubic-bezier(.2,.9,.3,1) forwards',
          animationDelay: '0.5s', opacity: 0,
        }}>
          slow<span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>desk</span><span style={{ color: 'var(--accent)' }}>.</span>
        </div>

        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 15,
          color: 'rgba(255,255,255,0.45)', letterSpacing: '0.01em',
          animation: 'sd-rise 0.7s ease forwards', animationDelay: '1.3s', opacity: 0,
          maxWidth: 320, lineHeight: 1.6,
        }}>
          A calm workspace for focused people.<br />No noise. No clutter. Just your work.
        </div>
      </div>

      {/* Starter actions */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 44,
        opacity:   actionsVisible ? 1 : 0,
        transform: actionsVisible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.5s, transform 0.5s cubic-bezier(.2,.9,.3,1)',
      }}>
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={() => dismiss(a.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              padding: '20px 24px', borderRadius: 18,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer', color: '#fff',
              transition: 'all 0.2s cubic-bezier(.2,.9,.3,1.2)',
              minWidth: 120,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background    = a.color + '28';
              e.currentTarget.style.borderColor   = a.color + '80';
              e.currentTarget.style.transform     = 'translateY(-4px) scale(1.04)';
              e.currentTarget.style.boxShadow     = `0 12px 32px ${a.color}30`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background    = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.transform     = 'none';
              e.currentTarget.style.boxShadow     = 'none';
            }}
          >
            <span style={{ fontSize: 30 }}>{a.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Enter button */}
      <button
        onClick={() => dismiss()}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.2em',
          opacity: actionsVisible ? 1 : 0, transition: 'opacity 0.5s 0.2s, color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
      >
        enter slowdesk →
      </button>

    </div>
  );
}
