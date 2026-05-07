'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { Task } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import * as db from '@/lib/supabase/db';
import Icon from './Icon';

type Phase = 'work' | 'short-break' | 'long-break';

const DURATIONS: Record<Phase, number> = {
  'work':        25 * 60,
  'short-break':  5 * 60,
  'long-break':  15 * 60,
};

const PHASE_LABEL: Record<Phase, string> = {
  'work':        'FOCUS',
  'short-break': 'SHORT BREAK',
  'long-break':  'LONG BREAK',
};

const PHASE_COLOR: Record<Phase, string> = {
  'work':        '#c1623f',
  'short-break': '#7a9e7e',
  'long-break':  '#5b8fbf',
};

interface Props {
  task: Task;
  onClose: () => void;
}

export default function PomodoroTimer({ task, onClose }: Props) {
  const [phase,         setPhase]         = useState<Phase>('work');
  const [secondsLeft,   setSecondsLeft]   = useState(DURATIONS.work);
  const [running,       setRunning]       = useState(false);
  const [cycleCount,    setCycleCount]    = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);
  const [flashDone,     setFlashDone]     = useState(false);
  const [userId,        setUserId]        = useState<string | null>(null);

  // Refs to read latest values without stale-closure issues
  const phaseRef      = useRef<Phase>('work');
  const cycleRef      = useRef(0);
  const userIdRef     = useRef<string | null>(null);
  phaseRef.current    = phase;
  cycleRef.current    = cycleCount;
  userIdRef.current   = userId;

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  // Entrance animation + load today's sessions
  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.22 });
    gsap.fromTo(panelRef.current,
      { y: 28, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.32, ease: 'power3.out' },
    );

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      try {
        const n = await db.getTaskPomodorosToday(user.id, task.id);
        setTodaySessions(n);
      } catch {}
    });
  }, [task.id]);

  // Advance to next phase when a session finishes
  const advancePhase = useCallback(async () => {
    const currentPhase = phaseRef.current;
    const currentCycle = cycleRef.current;
    const uid          = userIdRef.current;

    setRunning(false);
    setFlashDone(true);

    if (currentPhase === 'work') {
      const newCycle = currentCycle + 1;
      setCycleCount(newCycle);
      setTodaySessions(s => s + 1);

      if (uid) {
        try { await db.savePomodoroSession(uid, task.id, task.title, DURATIONS.work); }
        catch {}
      }

      const nextPhase: Phase = newCycle % 4 === 0 ? 'long-break' : 'short-break';
      setTimeout(() => {
        setFlashDone(false);
        setPhase(nextPhase);
        setSecondsLeft(DURATIONS[nextPhase]);
      }, 2200);
    } else {
      setTimeout(() => {
        setFlashDone(false);
        setPhase('work');
        setSecondsLeft(DURATIONS.work);
      }, 1800);
    }
  }, [task.id, task.title]);

  // Tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Detect zero → trigger advance
  useEffect(() => {
    if (secondsLeft === 0 && running) {
      setRunning(false);
      advancePhase();
    }
  }, [secondsLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRunning = () => setRunning(r => !r);

  const resetTimer = () => {
    setRunning(false);
    setSecondsLeft(DURATIONS[phase]);
  };

  const skipPhase = () => {
    setRunning(false);
    if (phase === 'work') {
      const nextPhase: Phase = (cycleCount + 1) % 4 === 0 ? 'long-break' : 'short-break';
      setPhase(nextPhase);
      setSecondsLeft(DURATIONS[nextPhase]);
    } else {
      setPhase('work');
      setSecondsLeft(DURATIONS.work);
    }
  };

  const close = () => {
    setRunning(false);
    gsap.to(panelRef.current,   { y: 14, opacity: 0, scale: 0.96, duration: 0.18, ease: 'power2.in' });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, onComplete: onClose });
  };

  // Ring geometry
  const total    = DURATIONS[phase];
  const progress = 1 - secondsLeft / total;
  const R        = 88;
  const circ     = 2 * Math.PI * R;
  const offset   = circ * (1 - progress);
  const color    = PHASE_COLOR[phase];

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  // Cycle dots — 4 per round, filled by completed work sessions in current round
  const dotsFilled = cycleCount % 4;

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) close(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(14, 9, 6, 0.90)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        ref={panelRef}
        style={{
          width: 360,
          background: 'linear-gradient(160deg, #1e1410 0%, #2c1e16 55%, #1a1218 100%)',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 48px 96px rgba(0,0,0,0.55)',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div style={{ padding: '18px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 3 }}>
              Working on
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.82)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.title}
            </div>
          </div>
          <button
            onClick={close}
            style={{
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)',
              display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0,
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        {/* ── Phase label ── */}
        <div style={{ textAlign: 'center', marginTop: 18, marginBottom: 2 }}>
          <span style={{
            fontSize: 9.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.2em',
            color, textTransform: 'uppercase',
          }}>
            {PHASE_LABEL[phase]}
          </span>
        </div>

        {/* ── Ring ── */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 14px' }}>
          <div style={{ position: 'relative', width: 214, height: 214 }}>
            <svg width={214} height={214} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={107} cy={107} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
              <circle
                cx={107} cy={107} r={R} fill="none"
                stroke={color} strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ transitionProperty: 'stroke-dashoffset, stroke', transitionDuration: running ? '1s, 0.4s' : '0s, 0.4s', transitionTimingFunction: 'linear, ease' }}
              />
            </svg>

            {/* Center display */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              {flashDone ? (
                <div style={{ fontSize: 36, lineHeight: 1 }}>
                  {phase === 'work' ? '🎉' : '✨'}
                </div>
              ) : (
                <>
                  <div style={{
                    fontSize: 44, fontWeight: 700, color: '#fff',
                    fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', lineHeight: 1,
                  }}>
                    {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', marginTop: 5 }}>
                    {total / 60} min
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Cycle dots + today count ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 22 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 9, height: 9, borderRadius: '50%',
                background: i < dotsFilled ? '#c1623f' : 'rgba(255,255,255,0.10)',
                transition: 'background 0.35s',
              }}
            />
          ))}
          {todaySessions > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              marginLeft: 10, paddingLeft: 12,
              borderLeft: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontSize: 13 }}>🍅</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
                ×{todaySessions} today
              </span>
            </div>
          )}
        </div>

        {/* ── Controls ── */}
        <div style={{ display: 'flex', gap: 10, padding: '0 24px 26px', alignItems: 'center' }}>
          {/* Reset */}
          <button
            onClick={resetTimer}
            title="Reset timer"
            style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.38)',
              display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'background 0.14s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            {/* refresh icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>

          {/* Play / Pause — main CTA */}
          <button
            onClick={toggleRunning}
            style={{
              flex: 1, height: 52, borderRadius: 14, border: 'none',
              background: color, color: '#fff', cursor: 'pointer',
              fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-sans)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'filter 0.14s',
            }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.14)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
          >
            {running ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                {secondsLeft === total ? 'Start' : 'Resume'}
              </>
            )}
          </button>

          {/* Skip */}
          <button
            onClick={skipPhase}
            title="Skip to next phase"
            style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.38)',
              display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'background 0.14s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            {/* skip-forward icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"/>
              <line x1="19" y1="5" x2="19" y2="19"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
