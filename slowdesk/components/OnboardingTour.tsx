'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';

const SLIDES = [
  {
    emoji: '🌿',
    headline: 'A calmer kind of work',
    sub: 'No noise. No overwhelm. Just you and what matters.',
    accent: 'var(--accent)',
  },
  {
    emoji: '✅',
    headline: 'Tasks, done simply',
    sub: 'Add tasks, set priorities, and check them off one by one.',
    accent: '#7a9e7e',
  },
  {
    emoji: '📅',
    headline: 'Your day at a glance',
    sub: 'A dashboard that shows exactly what needs your attention today.',
    accent: '#5b8fbf',
  },
  {
    emoji: '🌱',
    headline: 'Build habits that stick',
    sub: 'Track the small things that compound into big change.',
    accent: '#c9943a',
  },
  {
    emoji: '✨',
    headline: 'Ready when you are',
    sub: "Your workspace is set up. Let's get started.",
    accent: 'var(--accent)',
  },
];

const SLIDE_DURATION = 3800; // ms per slide (auto-advance)

export default function OnboardingTour() {
  const { completeTour } = useApp();
  const router = useRouter();
  const [step, setStep]       = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [dir, setDir]         = useState<1 | -1>(1); // slide direction
  const [animKey, setAnimKey] = useState(0);          // re-triggers slide anim
  const [progress, setProgress] = useState(0);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef   = useRef<number>(Date.now());
  const rafRef     = useRef<number>(0);
  const isLast     = step === SLIDES.length - 1;

  /* ── Progress bar (requestAnimationFrame) ── */
  const tickProgress = () => {
    const elapsed = Date.now() - startRef.current;
    const pct = Math.min(elapsed / SLIDE_DURATION, 1);
    setProgress(pct);
    if (pct < 1) {
      rafRef.current = requestAnimationFrame(tickProgress);
    }
  };

  const resetProgress = () => {
    cancelAnimationFrame(rafRef.current);
    startRef.current = Date.now();
    setProgress(0);
    rafRef.current = requestAnimationFrame(tickProgress);
  };

  /* ── Auto advance ── */
  useEffect(() => {
    resetProgress();
    timerRef.current = setTimeout(() => {
      if (!isLast) goTo(step + 1, 1);
    }, SLIDE_DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const goTo = (next: number, d: 1 | -1) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDir(d);
    setAnimKey(k => k + 1);
    setStep(next);
  };

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => completeTour(), 600);
  };

  const slide = SLIDES[step];

  return (
    <div
      id="onboarding-tour-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backdropFilter: 'blur(18px) saturate(0.5)',
        background: 'rgba(14,10,6,0.82)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        opacity: leaving ? 0 : 1,
        transition: 'opacity 0.6s ease',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes ot-in-right {
          from { opacity: 0; transform: translateX(44px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
        @keyframes ot-in-left {
          from { opacity: 0; transform: translateX(-44px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0)     scale(1);    }
        }
        @keyframes ot-emoji-pop {
          0%   { transform: scale(0.6) rotate(-8deg); opacity: 0; }
          60%  { transform: scale(1.12) rotate(2deg); opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);  opacity: 1; }
        }
        @keyframes ot-dot-pulse {
          0%, 100% { transform: scale(1);    opacity: 0.5; }
          50%       { transform: scale(1.4); opacity: 1;   }
        }
      `}</style>

      {/* ── Slide card ── */}
      <div
        key={animKey}
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center',
          maxWidth: 420, padding: '0 24px',
          animation: `${dir === 1 ? 'ot-in-right' : 'ot-in-left'} 0.45s cubic-bezier(.2,.9,.3,1) both`,
        }}
      >
        {/* Emoji illustration */}
        <div style={{
          fontSize: 80, lineHeight: 1,
          marginBottom: 36,
          animation: 'ot-emoji-pop 0.5s cubic-bezier(.2,.9,.3,1.3) both',
          animationDelay: '0.05s',
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))',
        }}>
          {slide.emoji}
        </div>

        {/* Headline */}
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 1.15,
          letterSpacing: '-0.02em', color: '#fff',
          marginBottom: 14,
        }}>
          {slide.headline}
        </div>

        {/* Sub */}
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 15,
          color: 'rgba(255,255,255,0.45)', lineHeight: 1.65,
          maxWidth: 300,
        }}>
          {slide.sub}
        </div>
      </div>

      {/* ── Progress dots ── */}
      <div style={{
        display: 'flex', gap: 8, marginTop: 52, marginBottom: 32,
        alignItems: 'center',
      }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            id={`tour-dot-${i}`}
            onClick={() => goTo(i, i > step ? 1 : -1)}
            style={{
              width: i === step ? 24 : 7,
              height: 7,
              borderRadius: 99,
              background: i === step ? slide.accent : 'rgba(255,255,255,0.2)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'all 0.35s cubic-bezier(.2,.9,.3,1)',
              outline: 'none',
            }}
          />
        ))}
      </div>

      {/* ── Progress bar (thin strip under dots) ── */}
      <div style={{
        width: 200, height: 2,
        borderRadius: 99,
        background: 'rgba(255,255,255,0.08)',
        marginBottom: 40, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: slide.accent,
          width: `${progress * 100}%`,
          transition: 'background 0.4s',
        }} />
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {/* Skip / Finish */}
        <button
          id="tour-skip-btn"
          onClick={dismiss}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase',
            letterSpacing: '0.18em', padding: '6px 12px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
        >
          {isLast ? 'get started →' : 'skip'}
        </button>

        {/* Next (only shown if not last) */}
        {!isLast && (
          <button
            id="tour-next-btn"
            onClick={() => goTo(step + 1, 1)}
            style={{
              padding: '10px 24px', borderRadius: 99,
              background: slide.accent,
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: 13,
              fontWeight: 600, color: '#fff',
              letterSpacing: '0.01em',
              transition: 'opacity 0.2s, transform 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.85';
              e.currentTarget.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Next
          </button>
        )}

        {/* Finish CTA on last slide */}
        {isLast && (
          <button
            id="tour-finish-btn"
            onClick={dismiss}
            style={{
              padding: '10px 28px', borderRadius: 99,
              background: 'var(--accent)',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: 13,
              fontWeight: 600, color: '#fff',
              letterSpacing: '0.01em',
              transition: 'opacity 0.2s, transform 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.85';
              e.currentTarget.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Enter slowdesk
          </button>
        )}
      </div>
    </div>
  );
}
