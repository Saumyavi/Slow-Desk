'use client';
import { useState, useRef, useEffect, ReactNode } from 'react';
import { gsap } from 'gsap';
import Icon, { IconName } from './Icon';
import AuthScreen from './AuthScreen';

/* ── Data ────────────────────────────────────────────────── */
const FEATURES: { icon: IconName; emoji: string; label: string; desc: string; color: string }[] = [
  { icon: 'dashboard', emoji: '🖥️', label: 'Dashboard',      color: '#c1623f', desc: 'Your command center. See today\'s tasks, mood, projects, and activity all in one calm view.' },
  { icon: 'list',      emoji: '📋', label: 'All Tasks',       color: '#7a9e7e', desc: 'Capture and organize everything with priorities, due dates, projects, and drag-to-reorder.' },
  { icon: 'camera',    emoji: '📸', label: 'Photo to Tasks',  color: '#c9943a', desc: 'Snap a photo of printed task lists or typed notes. OCR extracts them automatically — 100% free.' },
  { icon: 'calendar',  emoji: '📅', label: 'Calendar',        color: '#8b5c75', desc: 'Plan your weeks with a warm color-coded calendar. Add events, set times, write notes.' },
  { icon: 'habits',    emoji: '🌱', label: 'Habit Tracker',   color: '#c9943a', desc: 'Build streaks with a 30-day heatmap. Watch your consistency grow, one day at a time.' },
  { icon: 'projects',  emoji: '📁', label: 'Projects',        color: '#5b8fbf', desc: 'Track multiple projects with subtasks, live progress bars, and portfolio overviews.' },
  { icon: 'notes',     emoji: '📝', label: 'Notes & Journal', color: '#8b5c75', desc: 'Write freely, save thoughts, and practice daily gratitude — all in one warm space.' },
];

const QUOTES = [
  { text: 'The first productivity app I actually want to open in the morning.', author: 'Designer, remote' },
  { text: 'It feels like journaling but for your whole life workflow.', author: 'Indie hacker' },
  { text: 'Finally, a productivity app that doesn\'t give me anxiety.', author: 'Creative director' },
];

const STEPS = [
  { n: '01', title: 'Sign up free', desc: 'No credit card, no noise. Just your name and email.' },
  { n: '02', title: 'Set your pace', desc: 'Choose your layout, density, and accent color.' },
  { n: '03', title: 'Start slowly', desc: 'Add one task. Track one habit. Write one note.' },
];

/* ── Smooth scroll helper ────────────────────────────────── */
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Floating ambient card ───────────────────────────────── */
function FloatCard({ children, top, right, left, bottom, delay = 0 }: {
  children: ReactNode; top?: number | string; right?: number | string;
  left?: number | string; bottom?: number | string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.fromTo(ref.current, { opacity: 0, scale: 0.8, y: 12 }, { opacity: 1, scale: 1, y: 0, duration: 0.55, delay: 1 + delay, ease: 'back.out(1.5)' });
    gsap.to(ref.current, { y: -7, duration: 2.4 + delay * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.5 });
  }, [delay]);
  return (
    <div ref={ref} style={{
      position: 'absolute', top, right, left, bottom, opacity: 0,
      background: 'var(--bg-elev)', border: '1px solid var(--line)',
      borderRadius: 14, padding: '10px 14px',
      boxShadow: '0 8px 28px rgba(0,0,0,0.1)', zIndex: 10, minWidth: 130,
    }}>{children}</div>
  );
}

/* ── App UI mockup ───────────────────────────────────────── */
function AppMockup() {
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.fromTo(wrapRef.current, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.5 });
    gsap.to(wrapRef.current, { y: -10, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.4 });
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: 520, flexShrink: 0, opacity: 0 }}>
      {/* Browser chrome */}
      <div style={{
        background: 'var(--bg-elev)', borderRadius: 18, border: '1px solid var(--line)',
        boxShadow: '0 40px 90px rgba(0,0,0,0.16), 0 0 0 1px rgba(255,255,255,0.4)',
        overflow: 'hidden',
      }}>
        {/* window bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'var(--bg-sunk)', borderBottom: '1px solid var(--line)' }}>
          {['#ff6059','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
          <div style={{ flex: 1, height: 18, borderRadius: 5, background: 'var(--bg-elev)', marginLeft: 8 }} />
        </div>
        {/* app layout */}
        <div style={{ display: 'flex', height: 350 }}>
          {/* sidebar */}
          <div style={{ width: 54, background: 'var(--bg-elev)', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 8px', gap: 5 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--accent)', marginBottom: 10 }} />
            {[0,1,2,3,4].map(i => <div key={i} style={{ width: 34, height: 28, borderRadius: 7, background: i === 0 ? 'var(--accent-soft)' : 'transparent' }} />)}
          </div>
          {/* main */}
          <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
            {/* topbar strip */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ height: 16, width: 110, borderRadius: 4, background: 'var(--bg-sunk)' }} />
              <div style={{ flex: 1 }} />
              <div style={{ width: 90, height: 22, borderRadius: 5, background: 'var(--bg-sunk)' }} />
              <div style={{ width: 34, height: 22, borderRadius: 5, background: 'var(--accent)', opacity: 0.85 }} />
            </div>
            {/* greeting card */}
            <div style={{ height: 86, borderRadius: 13, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #3a2010 0%, #6b2a50 100%)' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(42,26,18,0.7) 0%, transparent 70%)' }} />
              <div style={{ position: 'relative', padding: '10px 13px' }}>
                <div style={{ height: 7, width: 70, borderRadius: 3, background: 'rgba(255,255,255,0.45)', marginBottom: 7 }} />
                <div style={{ height: 13, width: 150, borderRadius: 4, background: 'rgba(255,255,255,0.75)', marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {['😌','😊','🔥'].map(m => <div key={m} style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.18)', display: 'grid', placeItems: 'center', fontSize: 12 }}>{m}</div>)}
                </div>
              </div>
            </div>
            {/* task rows */}
            {[{ w: '55%', done: true }, { w: '72%', done: false }, { w: '63%', done: false }].map((t, i) => (
              <div key={i} style={{ height: 34, borderRadius: 8, background: 'var(--bg-sunk)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', border: '1px solid var(--line)' }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: t.done ? 'var(--accent)' : 'transparent', border: `1.5px solid ${t.done ? 'var(--accent)' : 'var(--line)'}` }} />
                <div style={{ height: 8, borderRadius: 3, background: 'var(--line)', width: t.w, opacity: t.done ? 0.45 : 0.8 }} />
                {!t.done && i === 1 && <div style={{ width: 28, height: 14, borderRadius: 10, background: 'rgba(193,98,63,0.2)', marginLeft: 'auto' }} />}
              </div>
            ))}
            {/* mini progress bars */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 2 }}>
              {[['#c1623f', '72%'], ['#7a9e7e', '45%']].map(([c, w]) => (
                <div key={c} style={{ background: 'var(--bg-sunk)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--line)' }}>
                  <div style={{ height: 7, borderRadius: 3, background: 'var(--line)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: w, background: c, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* floating ambient cards */}
      <FloatCard top={30} right={-70} delay={0}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 20 }}>🔥</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)' }}>12 day streak</div>
            <div style={{ fontSize: 10, color: 'var(--ink-faint)' }}>Morning pages</div>
          </div>
        </div>
      </FloatCard>

      <FloatCard bottom={50} left={-80} delay={0.4}>
        <div style={{ fontSize: 10, color: 'var(--ink-faint)', marginBottom: 5 }}>Today's progress</div>
        <div style={{ height: 5, borderRadius: 3, background: 'var(--bg-sunk)', overflow: 'hidden', width: 100, marginBottom: 4 }}>
          <div style={{ height: '100%', width: '65%', background: 'var(--accent)', borderRadius: 3 }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>4 of 7 done</div>
      </FloatCard>

      <FloatCard top={-24} left={60} delay={0.7}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#7a9e7e', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink)' }}>Sprint planning</span>
          <span style={{ fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>14:00</span>
        </div>
      </FloatCard>
    </div>
  );
}

/* ── Navbar ──────────────────────────────────────────────── */
function Navbar({ onSignIn }: { onSignIn: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    gsap.fromTo(ref.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
  }, []);

  const NAV_LINKS = [
    { label: 'Features',     id: 'features' },
    { label: 'About',        id: 'about' },
    { label: 'How it works', id: 'how-it-works' },
  ];

  return (
    <nav ref={ref} style={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', gap: 32,
      padding: '14px 60px',
      background: 'color-mix(in srgb, var(--bg) 88%, transparent)',
      backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--line-soft)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, background: 'var(--accent)', color: '#fff',
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--font-display)', fontSize: 22, fontStyle: 'italic', transform: 'rotate(-4deg)',
          boxShadow: '0 2px 8px rgba(193,98,63,0.35)',
        }}>s</div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '-0.02em' }}>
          slow<em style={{ color: 'var(--accent)' }}>desk</em>
        </span>
      </div>
      <div style={{ flex: 1 }} />
      {NAV_LINKS.map(link => (
        <button key={link.label}
          onClick={() => scrollTo(link.id)}
          style={{
            fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer',
            fontWeight: 500, background: 'none', border: 'none',
            fontFamily: 'var(--font-sans)', padding: '4px 2px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-soft)')}
        >{link.label}</button>
      ))}
      <button onClick={onSignIn} className="btn" style={{ fontSize: 13 }}>Sign in</button>
      <button onClick={onSignIn} className="btn btn-primary" style={{ fontSize: 13 }}>Get started free →</button>
    </nav>
  );
}

/* ── Hero section ────────────────────────────────────────── */
function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  const textRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!textRef.current) return;
    const els = textRef.current.querySelectorAll('[data-in]');
    gsap.fromTo(els, { y: 36, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.75, ease: 'power3.out', delay: 0.15 });
  }, []);

  return (
    <section style={{
      minHeight: '92vh', display: 'flex', alignItems: 'center',
      padding: '60px 60px 80px',
      background: 'radial-gradient(ellipse 70% 60% at 75% 40%, rgba(193,98,63,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 20% 80%, rgba(122,158,126,0.06) 0%, transparent 60%)',
      gap: 60,
    }}>
      {/* left: text */}
      <div ref={textRef} style={{ flex: '0 0 auto', maxWidth: 520 }}>
        <div data-in style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'var(--accent-soft)', color: 'var(--accent)',
          padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
          marginBottom: 24, border: '1px solid rgba(193,98,63,0.2)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          Designed for slow, deep work
        </div>

        <h1 data-in style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(42px, 5vw, 64px)',
          lineHeight: 1.08, letterSpacing: '-0.03em', margin: '0 0 22px',
          color: 'var(--ink)',
        }}>
          Your cozy corner<br />
          for <em style={{ color: 'var(--accent)' }}>deep work</em>
        </h1>

        <p data-in style={{
          fontSize: 17, lineHeight: 1.75, color: 'var(--ink-soft)',
          margin: '0 0 36px', maxWidth: 440,
        }}>
          A warm, beautiful workspace that helps you focus on what matters — without the noise, overwhelm, or anxiety that most productivity apps create.
        </p>

        <div data-in style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 44 }}>
          <button onClick={onGetStarted} className="btn btn-primary" style={{ fontSize: 15, padding: '12px 28px', borderRadius: 12 }}>
            Get started free →
          </button>
          <button onClick={onGetStarted} className="btn" style={{ fontSize: 15, padding: '12px 22px', borderRadius: 12 }}>
            Sign in
          </button>
        </div>

        <div data-in style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          {[
            { n: '6', label: 'powerful pages' },
            { n: '∞', label: 'tasks & habits' },
            { n: '100%', label: 'distraction free' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)', lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* right: mockup */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <AppMockup />
      </div>
    </section>
  );
}

/* ── Feature strip ───────────────────────────────────────── */
function FeatureStrip() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        gsap.fromTo(ref.current!.children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.4 });
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', background: 'var(--bg-elev)', padding: '20px 60px' }}>
      <div ref={ref} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
        {FEATURES.map(f => (
          <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0 }}>
            <span style={{ fontSize: 18 }}>{f.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)' }}>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Features section ────────────────────────────────────── */
function FeaturesSection() {
  const secRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        const cards = gridRef.current!.querySelectorAll('.feat-card');
        gsap.fromTo(cards, { y: 32, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.55, ease: 'power2.out' });
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    if (secRef.current) obs.observe(secRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="features" ref={secRef} style={{ padding: '90px 60px', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>Everything in one place</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.02em', margin: '0 0 16px', color: 'var(--ink)' }}>
          Built for the way<br /><em style={{ color: 'var(--accent)' }}>humans</em> actually work
        </h2>
        <p style={{ fontSize: 16, color: 'var(--ink-soft)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          Task management, habit tracking, OCR photo-to-text, calendar, notes, and projects — all designed to work together seamlessly.
        </p>
      </div>

      <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 980, margin: '0 auto' }}>
        {FEATURES.map((f) => (
          <div key={f.label} className="feat-card" style={{
            background: 'var(--bg-elev)', border: '1px solid var(--line)',
            borderRadius: 18, padding: '24px 22px',
            opacity: 0, transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = f.color + '55'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--line)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: f.color + '18', display: 'grid', placeItems: 'center',
              }}>
                <Icon name={f.icon} size={18} style={{ color: f.color }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{f.label}</div>
                <div style={{ width: 20, height: 2, borderRadius: 1, background: f.color, marginTop: 4 }} />
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── How it works ────────────────────────────────────────── */
function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        gsap.fromTo(ref.current!.querySelectorAll('.step-card'), { x: -24, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.12, duration: 0.5, ease: 'power2.out' });
        obs.disconnect();
      }
    }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="how-it-works" style={{ padding: '80px 60px', background: 'var(--bg-elev)', borderTop: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>How it works</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.5vw, 42px)', letterSpacing: '-0.02em', margin: '0 0 48px', color: 'var(--ink)' }}>
          Three steps to a calmer day
        </h2>
        <div ref={ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} className="step-card" style={{ opacity: 0 }}>
              <div style={{
                fontSize: 32, fontFamily: 'var(--font-display)', fontStyle: 'italic',
                color: 'var(--accent)', opacity: 0.25, marginBottom: 16, lineHeight: 1,
              }}>{s.n}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 10px', color: 'var(--ink)' }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              {i < STEPS.length - 1 && (
                <div style={{ marginTop: 20, height: 1, background: 'linear-gradient(to right, var(--line), transparent)' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── About / Philosophy section ──────────────────────────── */
function AboutSection() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        gsap.fromTo(ref.current!.querySelectorAll('[data-p]'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power2.out' });
        obs.disconnect();
      }
    }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="about" ref={ref} style={{
      padding: '100px 60px', textAlign: 'center',
      background: 'linear-gradient(180deg, var(--bg) 0%, var(--accent-soft) 50%, var(--bg) 100%)',
      borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div data-p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>About slowdesk</div>

        {/* big decorative quote mark */}
        <div data-p style={{
          fontFamily: 'var(--font-display)', fontSize: 120, lineHeight: 0.6,
          color: 'var(--accent)', opacity: 0.18, marginBottom: 8, userSelect: 'none',
        }}>"</div>

        <blockquote data-p style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.5vw, 38px)',
          fontStyle: 'italic', lineHeight: 1.35, letterSpacing: '-0.01em',
          color: 'var(--ink)', margin: '0 0 32px',
        }}>
          Slow is not lazy.<br />It's intentional.
        </blockquote>

        <p data-p style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.8, maxWidth: 500, margin: '0 auto 24px' }}>
          We built slowdesk because most productivity apps feel like factories. slowdesk feels like your favorite corner of a warm café — cozy, purposeful, and deeply human.
        </p>

        <p data-p style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.8, maxWidth: 500, margin: '0 auto 40px' }}>
          There are no gamified streaks pushing you to burn out. No notification floods. No overwhelming dashboards. Just a calm space where you can plan your day, build good habits, and come back to what matters. Do less, better.
        </p>

        <div data-p style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {['#c1623f','#7a9e7e','#8b5c75','#c9943a','#5b8fbf'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ────────────────────────────────────────── */
function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        gsap.fromTo(ref.current!.querySelectorAll('.tcard'), { y: 28, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out' });
        obs.disconnect();
      }
    }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const COLORS = ['var(--accent-soft)', '#ddeede', '#eed8e8'];

  return (
    <section style={{ padding: '80px 60px', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.5vw, 40px)', letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)' }}>
          Loved by slow workers
        </h2>
      </div>
      <div ref={ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 860, margin: '0 auto' }}>
        {QUOTES.map((q, i) => (
          <div key={i} className="tcard" style={{
            background: COLORS[i], border: '1px solid var(--line)',
            borderRadius: 18, padding: '28px 24px', opacity: 0,
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 0.8, color: 'var(--accent)', opacity: 0.3, marginBottom: 12 }}>"</div>
            <p style={{ fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', color: 'var(--ink)', margin: '0 0 20px' }}>"{q.text}"</p>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>— {q.author}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── CTA section (replaces embedded auth) ────────────────── */
function CtaSection({ onGetStarted }: { onGetStarted: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        gsap.fromTo(ref.current!.querySelectorAll('[data-cta]'), { y: 28, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out' });
        obs.disconnect();
      }
    }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} style={{
      padding: '100px 60px 120px', textAlign: 'center',
      background: 'var(--bg-elev)', borderTop: '1px solid var(--line)',
    }}>
      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        <div data-cta style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'var(--accent-soft)', color: 'var(--accent)',
          padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
          marginBottom: 24, border: '1px solid rgba(193,98,63,0.2)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          Ready to slow down?
        </div>

        <h2 data-cta style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 52px)',
          letterSpacing: '-0.03em', margin: '0 0 18px', color: 'var(--ink)', lineHeight: 1.1,
        }}>
          Start your cozy<br /><em style={{ color: 'var(--accent)' }}>workspace</em> today
        </h2>

        <p data-cta style={{ fontSize: 16, color: 'var(--ink-soft)', lineHeight: 1.75, margin: '0 0 40px' }}>
          Free forever. No credit card needed. Just a calm place to do your best work.
        </p>

        <div data-cta style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onGetStarted} className="btn btn-primary" style={{ fontSize: 16, padding: '14px 32px', borderRadius: 14 }}>
            Create free account →
          </button>
          <button onClick={onGetStarted} className="btn" style={{ fontSize: 16, padding: '14px 26px', borderRadius: 14 }}>
            Sign in
          </button>
        </div>

        <div data-cta style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {['No setup required', 'Works on any device', 'Completely free'].map(label => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-faint)' }}>
              <span style={{ color: '#7a9e7e', fontSize: 14 }}>✓</span>
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{
      padding: '28px 60px', borderTop: '1px solid var(--line)',
      display: 'flex', alignItems: 'center', gap: 20,
      background: 'var(--bg-sunk)',
    }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '-0.02em', color: 'var(--ink-soft)' }}>
        slow<em style={{ color: 'var(--accent)' }}>desk</em>
      </span>
      <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>A cozy place for deep work.</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>Made with ☕ and patience</span>
    </footer>
  );
}

/* ── Root landing page ───────────────────────────────────── */
export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);

  const openAuth = () => setShowAuth(true);

  return (
    <div style={{ overflowX: 'hidden', background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>
      <Navbar onSignIn={openAuth} />
      <HeroSection onGetStarted={openAuth} />
      <FeatureStrip />
      <FeaturesSection />
      <HowItWorks />
      <AboutSection />
      <Testimonials />
      <CtaSection onGetStarted={openAuth} />
      <Footer />

      {showAuth && <AuthScreen onClose={() => setShowAuth(false)} />}
    </div>
  );
}
