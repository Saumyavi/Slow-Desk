'use client';
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import Icon from './Icon';
import AuthScreen from './AuthScreen';

/* ── CSS keyframes injected once ─────────────────────────── */
const LANDING_CSS = `
@keyframes ld-float1{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-20px) rotate(2deg)}}
@keyframes ld-float2{0%,100%{transform:translateY(0) rotate(6deg)}50%{transform:translateY(-16px) rotate(-2deg)}}
@keyframes ld-float3{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-24px) rotate(4deg)}}
@keyframes ld-pulse{0%,100%{opacity:1}50%{opacity:0.35}}
@keyframes ld-strike{from{transform:rotate(-2deg) scaleX(0)}to{transform:rotate(-2deg) scaleX(1)}}
@keyframes ld-task-in{to{opacity:1;transform:translateY(0)}}
@keyframes ld-blink{50%{opacity:0}}
@keyframes ld-confetti{0%{opacity:0;transform:translate(0,0) rotate(0deg)}10%{opacity:1}100%{opacity:0;transform:var(--cf) rotate(540deg)}}
@keyframes ld-spin{to{transform:rotate(360deg)}}
.ld-f1{animation:ld-float1 8s ease-in-out infinite}
.ld-f2{animation:ld-float2 10s ease-in-out infinite}
.ld-f3{animation:ld-float3 12s ease-in-out infinite}
.ld-f4{animation:ld-float1 9s ease-in-out infinite}
.ld-f5{animation:ld-float2 11s ease-in-out infinite}
.ld-f6{animation:ld-float3 9s ease-in-out infinite}
.ld-dot{animation:ld-pulse 2s ease-in-out infinite}
.ld-strike::after{content:'';position:absolute;left:-4px;right:-4px;top:55%;height:8px;background:var(--accent);border-radius:4px;opacity:0.72;transform:rotate(-2deg);animation:ld-strike 1s 0.7s cubic-bezier(0.2,0.9,0.3,1.2) backwards;transform-origin:left center}
.ld-cursor{display:inline-block;width:2px;height:1em;background:var(--accent);vertical-align:text-bottom;margin-left:1px;animation:ld-blink 1s steps(2) infinite}
.ld-feat:hover{transform:translateY(-4px);box-shadow:0 20px 40px -20px rgba(40,30,20,0.14)}
@media(max-width:768px){
  .ld-nav-inner{grid-template-columns:1fr auto!important;padding:12px 20px!important;}
  .ld-nav-links{display:none!important;}
  .ld-hero{grid-template-columns:1fr!important;padding:80px 20px 40px!important;min-height:auto!important;gap:0!important;}
  .ld-hero-demo{display:none!important;}
  .ld-feat-content{padding:36px 16px 44px!important;}
  .ld-feat-grid>div{grid-column:1/-1!important;}
  .ld-feat-wide{flex-direction:column!important;gap:16px!important;}
  .ld-feat-wide-preview{grid-template-columns:1fr!important;}
  .ld-about{padding:56px 20px 60px!important;}
  .ld-testimonials-section{padding:44px 20px 52px!important;}
  .ld-testimonials-grid{grid-template-columns:1fr!important;}
  .ld-cta-section{padding:44px 20px 52px!important;}
  .ld-footer{padding:20px!important;flex-direction:column!important;gap:8px!important;text-align:center!important;}
}
`;


/* ── Animated demo card ──────────────────────────────────── */
function ConfettiBurst({ row }: { row: number }) {
  const top = 14 + row * 58 + 20;
  const colors = ['var(--accent)', 'var(--sage)', 'var(--butter)', 'var(--plum)', 'var(--sky)'];
  return (
    <>
      {Array.from({ length: 12 }).map((_, i) => {
        const dx = (Math.random() - 0.5) * 240;
        const dy = -(Math.random() * 70 + 30);
        return (
          <span key={i} style={{
            position: 'absolute', left: 28, top,
            width: 7, height: 11, borderRadius: 2, pointerEvents: 'none',
            background: colors[i % colors.length], opacity: 0,
            ['--cf' as string]: `translate(${dx}px,${dy}px)`,
            animation: 'ld-confetti 1.3s cubic-bezier(0.2,0.7,0.3,1) forwards',
          }} />
        );
      })}
    </>
  );
}

function AnimatedDemo() {
  const [typed, setTyped] = useState('');
  const [inputDone, setInputDone] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [confetti, setConfetti] = useState<{ row: number; k: number } | null>(null);
  const target = 'Sketch hero variants for Folio v3';

  useEffect(() => {
    let i = 0;
    const t0 = setTimeout(() => {
      const id = setInterval(() => {
        i++;
        setTyped(target.slice(0, i));
        if (i >= target.length) { clearInterval(id); setTimeout(() => setInputDone(true), 500); }
      }, 52);
    }, 600);
    const t1 = setTimeout(() => { setChecked(c => ({ ...c, t2: true })); setConfetti({ row: 1, k: Date.now() }); }, 4500);
    const t2 = setTimeout(() => { setChecked(c => ({ ...c, t3: true })); setConfetti({ row: 2, k: Date.now() }); }, 6800);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const tasks = [
    { id: 't1', title: typed || target, tag: 'sage',   tagLabel: 'Folio v3',   isInput: true },
    { id: 't2', title: 'Pick type pairing for Cozy Notes', tag: 'terra',  tagLabel: 'Cozy Notes' },
    { id: 't3', title: 'Export pebble icon set v2',        tag: 'butter', tagLabel: 'Pebble'     },
    { id: 't4', title: 'Write devlog · week 14',           tag: 'plum',   tagLabel: 'Journal'    },
  ];

  const TAG_COLORS: Record<string, { bg: string; color: string }> = {
    terra:  { bg: 'var(--accent-soft)',          color: 'var(--accent)' },
    sage:   { bg: 'var(--sage-soft)',            color: '#4a7a4e' },
    butter: { bg: 'var(--butter-soft)',          color: '#7a5820' },
    plum:   { bg: 'var(--plum-soft)',            color: 'var(--plum)' },
  };

  return (
    <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 30px 80px -30px rgba(40,30,20,0.22)' }}>
      {/* browser chrome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', background: 'var(--bg-sunk)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', background: 'var(--bg)', padding: '3px 12px', borderRadius: 6, maxWidth: 340 }}>
            slowdesk.app/today
          </div>
        </div>
        <div style={{ width: 30 }} />
      </div>

      {/* demo body */}
      <div style={{ padding: '28px 28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 30, margin: 0, letterSpacing: '-0.02em' }}>
            Today <span style={{ color: 'var(--ink-faint)', fontSize: 20 }}>· Wed, May 6</span>
          </h3>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <b style={{ color: 'var(--accent)' }}>{Object.values(checked).filter(Boolean).length}</b> / 4 done
          </span>
        </div>

        {/* dark focus card */}
        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 14, background: 'linear-gradient(135deg, #2a1a2e 0%, #3d1f2f 40%, #1e1530 100%)', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5ab55a' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.04em' }}>Sprint planning</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.06em' }}>14:08</span>
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
            <div style={{ width: '62%', height: '100%', background: 'linear-gradient(90deg, #c1623f, #e8855e)', borderRadius: 2 }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['😊', '🔥', '✨'].map(e => (
              <div key={e} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center', fontSize: 14 }}>{e}</div>
            ))}
          </div>
        </div>

        {/* fake input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: 'var(--bg-sunk)', border: '1px dashed var(--line)', borderRadius: 10, marginBottom: 16, fontSize: 14, fontWeight: 500 }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 14, lineHeight: 1 }}>+</div>
          <span style={{ flex: 1, color: typed ? 'var(--ink)' : 'var(--ink-faint)' }}>
            {typed || 'Add a task…'}
            {!inputDone && <span className="ld-cursor" />}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', padding: '2px 7px', background: 'var(--bg)', borderRadius: 5, border: '1px solid var(--line)' }}>⏎</span>
        </div>

        {/* task rows */}
        <div style={{ position: 'relative' }}>
          {tasks.map((t, i) => {
            const done = !!checked[t.id];
            const tc = TAG_COLORS[t.tag];
            return (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, marginBottom: 8,
                opacity: 0, transform: 'translateY(8px)',
                animation: `ld-task-in 0.5s cubic-bezier(0.2,0.9,0.3,1.2) ${1.1 + i * 0.5}s forwards`,
              }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${done ? 'var(--accent)' : 'var(--line)'}`, background: done ? 'var(--accent)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                  {done && <Icon name="check" size={12} style={{ color: '#fff' }} />}
                </div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: done ? 'var(--ink-faint)' : 'var(--ink)', textDecoration: done ? 'line-through' : 'none' }}>{t.title}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 9px', borderRadius: 999, background: tc.bg, color: tc.color }}>{t.tagLabel}</span>
              </div>
            );
          })}
          {confetti && <ConfettiBurst key={confetti.k} row={confetti.row} />}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <span>· drag to reorder</span>
          <span>· ⌘K quick-add</span>
          <span>· confetti on done 🎉</span>
        </div>
      </div>
    </div>
  );
}

/* ── Nav ─────────────────────────────────────────────────── */
function Nav({ onSignIn }: { onSignIn: (tab: 'login' | 'signup') => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
      transition: 'border-color 0.2s',
    }}>
      {/* inner container — matches hero max-width and padding */}
      <div className="ld-nav-inner" style={{
        maxWidth: 1600, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        padding: scrolled ? '10px 5vw' : '18px 5vw',
        transition: 'padding 0.2s',
      }}>
        {/* left — logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: 28, height: 28, background: 'var(--accent)', color: '#fff', borderRadius: 7, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontSize: 18, fontStyle: 'italic', transform: 'rotate(-4deg)', boxShadow: '0 2px 8px rgba(193,98,63,0.28)' }}>s</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '-0.02em' }}>slow<em style={{ color: 'var(--accent)' }}>desk</em></span>
        </a>

        {/* center — links */}
        <div className="ld-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[['Features', 'features'], ['About', 'about'], ['Sign in', '']].map(([label, id]) => (
            <button key={label} onClick={() => id ? scrollTo(id) : onSignIn('login')}
              style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'none', fontSize: 14, fontWeight: 500, color: 'var(--ink-soft)', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s, color 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-sunk)'; e.currentTarget.style.color = 'var(--ink)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--ink-soft)'; }}
            >{label}</button>
          ))}
        </div>

        {/* right — CTA */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => onSignIn('signup')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 999, fontSize: 14, fontWeight: 600, background: 'var(--ink)', color: 'var(--bg)', border: 'none', cursor: 'pointer', transition: 'background 0.15s', fontFamily: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--ink)')}
          >
            Start free <Icon name="chevron" size={13} style={{ color: 'inherit' }} />
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ── Hero ────────────────────────────────────────────────── */
function Hero({ onCta }: { onCta: (tab: 'login' | 'signup') => void }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current.querySelectorAll('[data-in]'),
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: 'power3.out', delay: 0.15 }
    );
  }, []);

  return (
    <section ref={ref} className="ld-hero" style={{
      minHeight: '100vh',
      padding: '0 4vw 0 5vw',
      display: 'grid',
      gridTemplateColumns: '36% 1fr',
      gap: '4vw',
      alignItems: 'center',
      maxWidth: 1600,
      margin: '0 auto',
      boxSizing: 'border-box' as const,
    }}>
      {/* ── Left: text ── */}
      <div>
        <div data-in style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'color-mix(in srgb, var(--accent) 14%, var(--bg))', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.04em', color: 'var(--accent)', marginBottom: 16 }}>
          <span className="ld-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          Designed for slow, deep work
        </div>

        <h1 data-in style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,4vw,54px)', lineHeight: 1.08, letterSpacing: '-0.03em', margin: '0 0 14px', fontWeight: 400 }}>
          Your cozy corner<br />
          for <em style={{ color: 'var(--accent)' }}>deep work</em>
        </h1>

        <p data-in style={{ fontSize: 14.5, color: 'var(--ink-soft)', margin: '0 0 24px', lineHeight: 1.65 }}>
          A warm, beautiful workspace that helps you focus on what matters — without the noise, overwhelm, or anxiety that most productivity apps create.
        </p>

        <div data-in style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const, marginBottom: 32 }}>
          <button onClick={() => onCta('signup')} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 13.5, borderRadius: 999 }}>
            Get started free →
          </button>
          <button onClick={() => onCta('login')} className="btn" style={{ padding: '10px 18px', fontSize: 13.5, borderRadius: 999, background: 'var(--bg)', border: '1.5px solid var(--line)' }}>
            Sign in
          </button>
        </div>

        <div data-in style={{ display: 'flex', gap: 24, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
          {[['6', 'Powerful pages'], ['∞', 'Tasks & habits'], ['100%', 'Distraction free']].map(([val, label]) => (
            <div key={label}>
              <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--ink)', letterSpacing: '-0.025em', lineHeight: 1, marginBottom: 4 }}>{val}</div>
              <div>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: animated demo ── */}
      <div data-in className="ld-hero-demo" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', inset: '40px 60px -20px', background: 'radial-gradient(ellipse at 55% 50%, rgba(193,98,63,0.14), transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedDemo />
        </div>
      </div>
    </section>
  );
}

/* ── Features ────────────────────────────────────────────── */
const FEAT_TASKS = [
  { label: 'Pick type pairing', tag: 'terra', done: true },
  { label: 'Sketch hero variants', tag: 'sage', done: false },
  { label: 'Export pebble icons', tag: 'butter', done: false },
];
const TAG_COLORS: Record<string, { bg: string; fg: string }> = {
  terra:  { bg: 'var(--accent-soft)',  fg: 'var(--accent)' },
  sage:   { bg: 'var(--sage-soft)',    fg: '#4a7a4e' },
  butter: { bg: 'var(--butter-soft)',  fg: '#7a5820' },
};

function Features() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        gsap.fromTo(ref.current!.querySelectorAll('.ld-feat'),
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.07, duration: 0.5, ease: 'power2.out' }
        );
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const card = (extra = {}): React.CSSProperties => ({
    background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 18,
    padding: '20px', display: 'flex', flexDirection: 'column', minHeight: 200, position: 'relative',
    overflow: 'hidden', transition: 'transform 0.22s, box-shadow 0.22s', ...extra,
  });

  return (
    <section ref={ref} id="features" style={{ background: '#f7ede8' }}>
      <div className="ld-feat-content" style={{ padding: '72px 48px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ marginBottom: 10, fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)' }}>— Features</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,44px)', lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 12px', fontWeight: 400 }}>
          Designed for <em style={{ color: 'var(--accent)' }}>quiet, deliberate</em> work.
        </h2>
        <p style={{ fontSize: 15, color: 'var(--ink-soft)', margin: 0 }}>Six pages. One purpose. Everything earns its place.</p>
      </div>

      <div className="ld-feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 12 }}>

        {/* Today's tasks — large */}
        <div className="ld-feat" style={{ ...card(), gridColumn: 'span 5', minHeight: 260 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', marginBottom: 12 }}>
            <Icon name="check" size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 21, letterSpacing: '-0.015em', margin: '0 0 5px', fontWeight: 400 }}>Today, with intention.</h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13, margin: '0 0 14px', lineHeight: 1.55 }}>Drag to reorder, check to celebrate. Feel the small joy of finishing.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
            {FEAT_TASKS.map((t, i) => {
              const tc = TAG_COLORS[t.tag];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 9px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 7 }}>
                  <div style={{ width: 13, height: 13, borderRadius: 4, border: `1.4px solid ${t.done ? 'var(--accent)' : 'var(--line)'}`, background: t.done ? 'var(--accent)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {t.done && <Icon name="check" size={8} style={{ color: '#fff' }} />}
                  </div>
                  <span style={{ flex: 1, fontSize: 11.5, color: t.done ? 'var(--ink-faint)' : 'var(--ink)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, padding: '1px 7px', borderRadius: 999, background: tc.bg, color: tc.fg }}>{t.tag === 'terra' ? 'Cozy Notes' : t.tag === 'sage' ? 'Folio v3' : 'Pebble'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Habits */}
        <div className="ld-feat" style={{ ...card({ background: 'var(--sage-soft)', borderColor: 'var(--sage)' }), gridColumn: 'span 3' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(122,158,126,0.25)', display: 'grid', placeItems: 'center', marginBottom: 12 }}>
            <Icon name="habits" size={16} style={{ color: '#4a7a4e' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19, letterSpacing: '-0.015em', margin: '0 0 5px', fontWeight: 400 }}>Habits, gently tracked.</h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: 12.5, margin: '0 0 12px', lineHeight: 1.5 }}>30-day heatmap that rewards consistency, not perfection.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 3, flex: 1, alignContent: 'start' }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const v = (i * 73) % 4;
              const opacity = v === 0 ? 0.12 : v === 1 ? 0.35 : v === 2 ? 0.65 : 1;
              return <div key={i} style={{ aspectRatio: '1', borderRadius: 2, background: `rgba(74,122,78,${opacity})` }} />;
            })}
          </div>
        </div>

        {/* Calendar */}
        <div className="ld-feat" style={{ ...card({ background: 'var(--plum-soft)', borderColor: 'var(--plum)' }), gridColumn: 'span 4' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(139,92,117,0.2)', display: 'grid', placeItems: 'center', marginBottom: 12 }}>
            <Icon name="calendar" size={16} style={{ color: 'var(--plum)' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19, letterSpacing: '-0.015em', margin: '0 0 5px', fontWeight: 400 }}>Calendar that whispers.</h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: 12.5, margin: '0 0 12px', lineHeight: 1.5 }}>Monthly view that shows the shape of your time — no nagging.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 9, flex: 1, alignContent: 'start' }}>
            {Array.from({ length: 28 }).map((_, i) => {
              const hasEvent = [3, 6, 10, 14, 17, 22, 25].includes(i);
              const isToday = i === 11;
              return (
                <div key={i} style={{ aspectRatio: '1', borderRadius: 4, display: 'grid', placeItems: 'center', background: isToday ? 'var(--plum)' : hasEvent ? 'rgba(139,92,117,0.18)' : 'var(--bg)', border: '1px solid var(--line-soft)', color: isToday ? '#fff' : hasEvent ? 'var(--plum)' : 'var(--ink-faint)', fontWeight: hasEvent || isToday ? 600 : 400 }}>
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="ld-feat" style={{ ...card({ background: 'var(--butter-soft)', borderColor: 'var(--butter)' }), gridColumn: 'span 4' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(201,148,58,0.2)', display: 'grid', placeItems: 'center', marginBottom: 12 }}>
            <Icon name="notes" size={16} style={{ color: '#7a5820' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19, letterSpacing: '-0.015em', margin: '0 0 5px', fontWeight: 400 }}>Notes &amp; journal.</h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: 12.5, margin: '0 0 12px', lineHeight: 1.5 }}>Serif-rich editor for thinking out loud. No blocks, no ceremony.</p>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 11px', flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>updated 2h ago</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, lineHeight: 1.2, marginBottom: 5 }}>Cozy Notes — kickoff thoughts</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>What if the canvas felt like a warm lamp at 11pm? Soft cream, deep ink…</div>
          </div>
        </div>

        {/* Projects */}
        <div className="ld-feat" style={{ ...card({ background: 'var(--sky-soft)', borderColor: 'var(--sky)' }), gridColumn: 'span 4' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(91,143,191,0.2)', display: 'grid', placeItems: 'center', marginBottom: 12 }}>
            <Icon name="projects" size={16} style={{ color: '#3a6a99' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19, letterSpacing: '-0.015em', margin: '0 0 5px', fontWeight: 400 }}>Projects, properly.</h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: 12.5, margin: '0 0 12px', lineHeight: 1.5 }}>Group tasks by intention. Watch progress build over weeks.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            {[{ n: 'Cozy Notes App', p: 72, c: 'var(--accent)' }, { n: 'Folio v3 Redesign', p: 45, c: '#4a7a4e' }, { n: 'Pebble Iconset', p: 90, c: '#c9943a' }].map(p => (
              <div key={p.n} style={{ padding: '7px 9px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 500, marginBottom: 4 }}>
                  <span>{p.n}</span><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)' }}>{p.p}%</span>
                </div>
                <div style={{ height: 3, background: 'var(--bg-sunk)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${p.p}%`, height: '100%', background: p.c, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Photo to Tasks */}
        <div className="ld-feat" style={{ ...card(), gridColumn: 'span 4' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(193,98,63,0.12)', display: 'grid', placeItems: 'center', marginBottom: 12 }}>
            <Icon name="camera" size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19, letterSpacing: '-0.015em', margin: '0 0 5px', fontWeight: 400 }}>Photo to Tasks.</h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>Snap a photo of any handwritten or printed list. OCR extracts tasks automatically — 100% free, no backend needed.</p>
          <div style={{ marginTop: 14, padding: '8px 10px', background: 'var(--bg-sunk)', borderRadius: 8, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="camera" size={13} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 1 }}>Tesseract OCR</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>Runs entirely in-browser · no upload</div>
            </div>
          </div>
        </div>

        {/* Morning Ritual — wide */}
        <div className="ld-feat ld-feat-wide" style={{ ...card({ flexDirection: 'row', alignItems: 'center', gap: 32 }), gridColumn: 'span 12', minHeight: 150, background: 'linear-gradient(135deg, #fdf3ee 0%, #f5e8de 100%)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(193,98,63,0.15)', display: 'grid', placeItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>☕</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 21, letterSpacing: '-0.015em', margin: '0 0 7px', fontWeight: 400 }}>Your <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>morning ritual</em>, delivered.</h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: 13, maxWidth: 380, lineHeight: 1.65, margin: 0 }}>
              Opt in to a calm summary of today's pending tasks, sent to your inbox or WhatsApp — exactly when your day starts.
            </p>
          </div>
          {/* Preview: email + whatsapp mockups */}
          <div className="ld-feat-wide-preview" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignSelf: 'stretch', padding: '4px 0' }}>
            {/* Email preview */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '12px 13px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10 }}>✉</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email · 8:00 AM</span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--ink)', lineHeight: 1.3, marginBottom: 2 }}>Good morning ☕</div>
              {['Sketch hero variants', 'Export pebble icons', 'Write devlog · week 14'].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 3, border: '1px solid var(--line)', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: 'var(--ink-soft)' }}>{t}</span>
                </div>
              ))}
            </div>
            {/* WhatsApp preview */}
            <div style={{ background: '#e9fbe5', borderRadius: 10, padding: '12px 13px', border: '1px solid rgba(74,180,80,0.2)', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(74,180,80,0.18)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10 }}>💬</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4a7a4e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>WhatsApp</span>
              </div>
              <p style={{ fontSize: 10.5, color: '#2c2416', lineHeight: 1.55, margin: 0, fontFamily: 'var(--font-sans)' }}>
                ☕ <strong>Good morning!</strong><br />
                Wed, May 6 — your day:<br />
                1. Sketch hero variants<br />
                2. Export pebble icons<br />
                3. Write devlog · week 14
              </p>
            </div>
          </div>
        </div>

        {/* Customization — wide */}
        <div className="ld-feat ld-feat-wide" style={{ ...card({ flexDirection: 'row', alignItems: 'center', gap: 32 }), gridColumn: 'span 12', minHeight: 150 }}>
          <div style={{ flex: 1 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', marginBottom: 12 }}>
              <Icon name="settings" size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 21, letterSpacing: '-0.015em', margin: '0 0 7px', fontWeight: 400 }}>Built for <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>your</em> rhythm.</h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: 13, maxWidth: 400, lineHeight: 1.6, margin: 0 }}>Six accent colors, three densities, three dashboard layouts, light/dark themes, background patterns. No two slowdesks look alike.</p>
          </div>
          <div className="ld-feat-wide-preview" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, alignSelf: 'stretch', padding: '8px 0' }}>
            {[
              { bg: '#f0e6d8', accent: '#c1623f', label: 'Light · Terracotta', dark: false },
              { bg: '#1c1814', accent: '#8fb894', label: 'Dark · Sage',        dark: true  },
              { bg: '#f0e6d8', accent: '#8b5c75', label: 'Light · Plum',       dark: false },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 10, padding: 10, border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: s.accent }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, margin: '8px 0' }}>
                  <div style={{ height: 3, background: s.accent, opacity: 0.85, borderRadius: 2, width: '70%' }} />
                  <div style={{ height: 3, background: s.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', borderRadius: 2, width: '90%' }} />
                  <div style={{ height: 3, background: s.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', borderRadius: 2, width: '60%' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.08em', color: s.dark ? 'rgba(255,255,255,0.45)' : 'var(--ink-faint)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}

/* ── About ───────────────────────────────────────────────── */
function About() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        gsap.fromTo(ref.current!.querySelectorAll('[data-p]'),
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.55, ease: 'power2.out' }
        );
        obs.disconnect();
      }
    }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} id="about" className="ld-about" style={{
      padding: '96px 48px 100px',
      textAlign: 'center',
      background: 'radial-gradient(ellipse at 20% 60%, #e8cfc4 0%, #edddd5 25%, #ede6dd 55%, var(--bg) 80%)',
      position: 'relative',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* label */}
        <div data-p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase' as const, letterSpacing: '0.22em', color: 'rgba(120,80,55,0.65)', marginBottom: 14 }}>
          About Slowdesk
        </div>

        {/* two quote drops */}
        <div data-p style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
          {[0, 1].map(i => (
            <svg key={i} width="16" height="26" viewBox="0 0 16 26" fill="var(--accent)">
              <path d="M8 0 C3.6 0 1 4.2 1 9 C1 13.8 4 17 8 17 C10.2 17 12 15.8 12.8 14 C12.5 18 10.5 22.5 8 24.5 L8 26 C12.5 24 15 19.5 15 13 C15 5.5 12 0 8 0Z" />
            </svg>
          ))}
        </div>

        {/* headline */}
        <h2 data-p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(34px,4vw,50px)', lineHeight: 1.18, letterSpacing: '-0.015em', margin: '0 0 36px', fontWeight: 400, color: 'var(--ink)' }}>
          Slow is not lazy.<br />It's intentional.
        </h2>

        {/* body */}
        <p data-p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.78, margin: '0 0 20px' }}>
          We built slowdesk because most productivity apps feel like factories. slowdesk feels like your favorite corner of a warm café — cozy, purposeful, and deeply human.
        </p>
        <p data-p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.78, margin: '0 0 44px' }}>
          There are no gamified streaks pushing you to burn out. No notification floods. No overwhelming dashboards. Just a calm space where you can plan your day, build good habits, and come back to what matters. Do less, better.
        </p>

        {/* dots */}
        <div data-p style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {['var(--accent)', 'var(--sage)', 'var(--plum)', 'var(--sky)', 'var(--butter)'].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.8 }} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA section ─────────────────────────────────────────── */
function CtaSection({ onCta }: { onCta: (tab: 'login' | 'signup') => void }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        gsap.fromTo(ref.current!.querySelectorAll('[data-c]'),
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out' }
        );
        obs.disconnect();
      }
    }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="ld-cta-section" style={{ padding: '88px 48px 96px', textAlign: 'center', background: '#f5ebe3', borderTop: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div data-c style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 999, background: 'var(--accent-soft)', border: '1px solid rgba(193,98,63,0.2)', fontSize: 12, color: 'var(--accent)', marginBottom: 22, fontFamily: 'var(--font-sans)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          Ready to slow down?
        </div>

        <h2 data-c style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,4.5vw,50px)', letterSpacing: '-0.025em', margin: '0 0 18px', lineHeight: 1.15, fontWeight: 400 }}>
          Start your cozy<br /><em style={{ color: 'var(--accent)' }}>workspace</em> today
        </h2>

        <p data-c style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.65, margin: '0 0 36px' }}>
          Free forever. No credit card needed. Just a calm place to do your best work.
        </p>

        <div data-c style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const, marginBottom: 26 }}>
          <button onClick={() => onCta('signup')} className="btn btn-primary" style={{ fontSize: 14, padding: '12px 28px', borderRadius: 999 }}>
            Create free account →
          </button>
          <button onClick={() => onCta('login')} style={{ fontSize: 14, padding: '12px 24px', borderRadius: 999, background: 'transparent', border: '1.5px solid var(--ink)', color: 'var(--ink)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
            Sign in
          </button>
        </div>

        <div data-c style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          {['No setup required', 'Works on any device', 'Completely free'].map(l => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-faint)' }}>
              <span>✓</span> {l}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ────────────────────────────────────────── */
function Testimonials() {
  const CARDS = [
    { quote: '"The first productivity app I actually want to open in the morning."', role: 'Designer, Remote', bg: '#f5ddd8', accent: '#c1623f' },
    { quote: '"It feels like journaling but for your whole life workflow."',          role: 'Indie Hacker',    bg: '#d8ede0', accent: '#4a7a4e' },
    { quote: '"Finally, a productivity app that doesn\'t give me anxiety."',          role: 'Creative Director', bg: '#e8d8ec', accent: '#8b5c75' },
  ];
  return (
    <section className="ld-testimonials-section" style={{ padding: '80px 48px 88px', background: 'var(--bg)', borderTop: '1px solid var(--line)' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 400, letterSpacing: '-0.02em', textAlign: 'center', margin: '0 0 52px', color: 'var(--ink)' }}>
        Loved by slow workers
      </h2>
      <div className="ld-testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
        {CARDS.map((c, i) => (
          <div key={i} style={{ background: c.bg, borderRadius: 18, padding: '32px 28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: c.accent, lineHeight: 1, fontStyle: 'italic' }}>"</span>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17, lineHeight: 1.65, color: '#2a1a12', margin: 0, flex: 1 }}>{c.quote}</p>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: 'rgba(40,25,15,0.55)' }}>— {c.role}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="ld-footer" style={{ padding: '24px 48px', display: 'flex', alignItems: 'center', background: '#d8d0c8' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
          slow<em style={{ color: 'var(--accent)' }}>desk</em>
        </span>
        <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>A cozy place for deep work.</span>
      </div>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Made with <span style={{ color: 'var(--accent)' }}>♥</span> and patience</span>
    </footer>
  );
}

/* ── Root ────────────────────────────────────────────────── */
export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);

  const openAuth = (_tab: 'login' | 'signup' = 'signup') => {
    setShowAuth(true);
  };

  return (
    <div style={{ overflowX: 'hidden', background: 'var(--bg)', color: 'var(--ink)' }}>
      <style>{LANDING_CSS}</style>

      <Nav onSignIn={openAuth} />

      <Hero onCta={openAuth} />

      <Features />
      <About />
      <Testimonials />
      <CtaSection onCta={openAuth} />
      <Footer />

      {showAuth && <AuthScreen onClose={() => setShowAuth(false)} />}
    </div>
  );
}
