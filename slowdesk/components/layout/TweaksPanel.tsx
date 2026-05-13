'use client';
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useApp, Accent } from '@/lib/store';
import Icon from '@/components/ui/Icon';

const ACCENTS: { key: Accent; color: string }[] = [
  { key: 'terracotta', color: '#c1623f' },
  { key: 'sage',       color: '#7a9e7e' },
  { key: 'plum',       color: '#8b5c75' },
  { key: 'butter',     color: '#c9943a' },
  { key: 'sky',        color: '#5b8fbf' },
  { key: 'ink',        color: '#2a2420' },
];

export default function TweaksPanel() {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme, accent, setAccent, bgPattern, setBgPattern, sidebar, setSidebar, density, setDensity, dashVariant, setDashVariant } = useApp();

  useEffect(() => {
    if (!drawerRef.current) return;
    if (open) {
      gsap.fromTo(drawerRef.current,
        { y: 12, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
      );
    } else {
      gsap.to(drawerRef.current, { y: 8, opacity: 0, scale: 0.97, duration: 0.18, ease: 'power2.in' });
    }
  }, [open]);

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1000 }}>
      {open && (
        <div ref={drawerRef} style={{
          position: 'absolute', bottom: 52, right: 0, width: 272,
          background: theme === 'dark' ? 'rgba(28,24,20,0.94)' : 'rgba(250,248,243,0.94)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          border: '0.5px solid rgba(255,255,255,0.3)',
          borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>Tweaks</span>
            <button onClick={() => setOpen(false)} style={{ color: 'var(--ink-faint)', fontSize: 16, lineHeight: 1 }}>
              <Icon name="x" size={14} />
            </button>
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TweakRow label="Theme">
              <Seg options={['light','dark']} value={theme} onChange={v => setTheme(v as 'light'|'dark')} />
            </TweakRow>
            <TweakRow label="Dashboard">
              <Seg options={['A','B','C']} labels={['Classic','Focus','Editorial']} value={dashVariant} onChange={v => setDashVariant(v as 'A'|'B'|'C')} />
            </TweakRow>
            <TweakRow label="Accent color">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ACCENTS.map(a => (
                  <button key={a.key} onClick={() => setAccent(a.key)} style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: a.color,
                    border: accent === a.key ? '2.5px solid var(--ink)' : '2.5px solid transparent',
                    outline: '1px solid rgba(0,0,0,0.12)',
                    cursor: 'pointer',
                  }} />
                ))}
              </div>
            </TweakRow>
            <TweakRow label="Background">
              <Seg options={['none','dots','grid']} value={bgPattern} onChange={v => setBgPattern(v as 'none'|'dots'|'grid')} />
            </TweakRow>
            <TweakRow label="Sidebar">
              <Seg options={['wide','icon']} labels={['Wide','Icons']} value={sidebar} onChange={v => setSidebar(v as 'wide'|'icon')} />
            </TweakRow>
            <TweakRow label="Density">
              <Seg options={['compact','cozy','comfy']} value={density} onChange={v => setDensity(v as 'compact'|'cozy'|'comfy')} />
            </TweakRow>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'var(--bg-elev)', border: '1px solid var(--line)',
          boxShadow: 'var(--shadow)',
          display: 'grid', placeItems: 'center',
          color: 'var(--ink-soft)', fontSize: 18, cursor: 'pointer',
          transition: 'all 0.2s',
          transform: open ? 'rotate(60deg)' : 'none',
        }}
      >
        <Icon name="settings" size={18} />
      </button>
    </div>
  );
}

function TweakRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-faint)' }}>{label}</div>
      {children}
    </div>
  );
}

function Seg({ options, labels, value, onChange }: { options: string[]; labels?: string[]; value: string; onChange: (v: string) => void }) {
  const idx = options.indexOf(value);
  const w = 100 / options.length;
  return (
    <div style={{ display: 'flex', padding: 2, background: 'rgba(0,0,0,0.06)', borderRadius: 8, position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 2, bottom: 2,
        left: `calc(${idx * w}% + 2px)`,
        width: `calc(${w}% - 4px)`,
        background: 'rgba(255,255,255,0.9)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        borderRadius: 6,
        transition: 'left 0.15s cubic-bezier(0.3,0.7,0.4,1)',
      }} />
      {options.map((opt, i) => (
        <button key={opt} onClick={() => onChange(opt)} style={{
          flex: 1, border: 'none', background: 'transparent',
          fontSize: 11, fontWeight: 500, padding: '5px 4px',
          borderRadius: 6, cursor: 'pointer',
          color: value === opt ? 'var(--ink)' : 'var(--ink-soft)',
          position: 'relative', zIndex: 1, transition: 'color 0.12s',
          textTransform: 'capitalize',
        }}>
          {labels ? labels[i] : opt}
        </button>
      ))}
    </div>
  );
}
