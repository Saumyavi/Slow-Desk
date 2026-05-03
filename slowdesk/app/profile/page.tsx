'use client';
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { signOut } from 'next-auth/react';
import { useApp, Accent } from '@/lib/store';
import Topbar from '@/components/Topbar';
import Icon from '@/components/Icon';

const handleSignOut = async () => {
  await signOut({ redirect: false });
  window.location.href = '/';
};

/* ── Constants ───────────────────────────────────────────── */
const AVATAR_EMOJIS = [
  '☕','🌿','🌊','🦉','🌙','⭐','🌸','🍃','🦋','🌻',
  '🎨','📚','🌵','🐢','🌈','🍀','🌺','🦊','🐝','🎭',
  '✨','🌟','🍵','🎸','🎹','🏔️','🌄','🦅','🐋','🌙',
];

const STATUSES = [
  { emoji: '☕', label: 'Coffee vibes' },
  { emoji: '🎯', label: 'Focused'      },
  { emoji: '🌊', label: 'In flow'      },
  { emoji: '🌱', label: 'Growing'      },
  { emoji: '🔥', label: 'On fire'      },
  { emoji: '✨', label: 'Sparkling'    },
  { emoji: '😌', label: 'Cozy'         },
  { emoji: '🍃', label: 'Calm'         },
];

const ACCENTS: { key: Accent; color: string; label: string }[] = [
  { key: 'terracotta', color: '#c1623f', label: 'Terracotta' },
  { key: 'sage',       color: '#7a9e7e', label: 'Sage'       },
  { key: 'plum',       color: '#8b5c75', label: 'Plum'       },
  { key: 'butter',     color: '#c9943a', label: 'Butter'     },
  { key: 'sky',        color: '#5b8fbf', label: 'Sky'        },
  { key: 'ink',        color: '#2a2420', label: 'Ink'        },
];

const DENSITIES: { key: 'compact' | 'cozy' | 'comfy'; label: string; emoji: string }[] = [
  { key: 'compact', label: 'Compact', emoji: '⚡' },
  { key: 'cozy',    label: 'Cozy',    emoji: '☕' },
  { key: 'comfy',   label: 'Comfy',   emoji: '🛋️' },
];

const PATTERNS: { key: 'none' | 'dots' | 'grid'; label: string; emoji: string }[] = [
  { key: 'none', label: 'Clean',  emoji: '⬜' },
  { key: 'dots', label: 'Dots',   emoji: '🔵' },
  { key: 'grid', label: 'Grid',   emoji: '🔲' },
];

/* ── Section card wrapper ────────────────────────────────── */
function Card({ children, emoji, title, style }: {
  children: React.ReactNode; emoji: string; title: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="card wobble-in" style={{
      background: 'var(--bg-elev)', border: '1px solid var(--line)',
      borderRadius: 18, padding: '28px 30px', ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <span style={{ fontSize: 22 }}>{emoji}</span>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ── Pill toggle group ───────────────────────────────────── */
function PillGroup<T extends string>({ options, value, onChange }: {
  options: { key: T; label: string; emoji?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} style={{
          padding: '7px 16px', borderRadius: 999, border: '1.5px solid',
          borderColor: value === o.key ? 'var(--accent)' : 'var(--line)',
          background: value === o.key ? 'var(--accent-soft)' : 'transparent',
          color: value === o.key ? 'var(--accent)' : 'var(--ink-soft)',
          fontSize: 13, fontWeight: value === o.key ? 600 : 400,
          cursor: 'pointer', fontFamily: 'var(--font-sans)',
          transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          {o.emoji && <span>{o.emoji}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Field label ─────────────────────────────────────────── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.08em', color: 'var(--ink-faint)',
      display: 'block', marginBottom: 7,
      fontFamily: 'var(--font-mono)',
    }}>{children}</label>
  );
}

/* ── Input field ─────────────────────────────────────────── */
function Field({ value, onChange, placeholder, type = 'text', readOnly }: {
  value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; readOnly?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '10px 14px', borderRadius: 10,
        border: `1.5px solid ${focused && !readOnly ? 'var(--accent)' : 'var(--line)'}`,
        background: readOnly ? 'var(--bg-sunk)' : 'var(--bg)',
        fontSize: 14, color: readOnly ? 'var(--ink-faint)' : 'var(--ink)',
        outline: 'none', fontFamily: 'var(--font-sans)',
        transition: 'border-color 0.15s', boxSizing: 'border-box',
        cursor: readOnly ? 'not-allowed' : 'text',
      }}
    />
  );
}

/* ── Days since joined ───────────────────────────────────── */
function daysSince(iso?: string) {
  if (!iso) return 1;
  return Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

/* ── Main page ───────────────────────────────────────────── */
export default function ProfilePage() {
  const {
    user, updateUser, logout,
    theme, setTheme,
    accent, setAccent,
    sidebar, setSidebar,
    density, setDensity,
    bgPattern, setBgPattern,
    dashVariant, setDashVariant,
    fireConfetti,
  } = useApp();

  const [name,     setName]     = useState(user?.name     ?? '');
  const [role,     setRole]     = useState(user?.role     ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [bio,      setBio]      = useState(user?.bio      ?? '');
  const [avatar,   setAvatar]   = useState(user?.avatar   ?? '☕');
  const [status,   setStatus]   = useState(user?.status   ?? '😌');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [signOutConfirm, setSignOutConfirm] = useState(false);

  const heroRef       = useRef<HTMLDivElement>(null);
  const avatarRef     = useRef<HTMLDivElement>(null);
  const pickerRef     = useRef<HTMLDivElement>(null);
  const contentRef    = useRef<HTMLDivElement>(null);

  /* mount animations */
  useEffect(() => {
    gsap.fromTo(heroRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    );
    gsap.fromTo(contentRef.current?.children ?? [],
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power2.out', delay: 0.25 }
    );
    /* pulsing glow on avatar ring */
    gsap.to(avatarRef.current, {
      boxShadow: '0 0 0 8px var(--accent-soft)',
      duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1,
    });
  }, []);

  /* avatar picker animation */
  useEffect(() => {
    if (showAvatarPicker && pickerRef.current) {
      gsap.fromTo(pickerRef.current,
        { opacity: 0, y: -10, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'back.out(1.4)' }
      );
    }
  }, [showAvatarPicker]);

  const save = (e: React.MouseEvent) => {
    updateUser({ name, role, location, bio, avatar, status });
    setSaved(true);
    fireConfetti(e.clientX, e.clientY);
    setTimeout(() => setSaved(false), 2500);
  };

  const days = daysSince(user?.joinedAt);

  return (
    <div className="page">
      <Topbar title="Profile" subtitle="your cozy corner" />

      <div style={{ padding: '28px 32px 60px', maxWidth: 760, margin: '0 auto' }}>

        {/* ── Hero banner ───────────────────────────────────── */}
        <div ref={heroRef} style={{
          borderRadius: 22, overflow: 'hidden',
          background: 'linear-gradient(135deg, #3a2010 0%, #6b2a50 55%, #1e2d32 100%)',
          marginBottom: 28, position: 'relative',
        }}>
          {/* decorative blobs */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -20, left: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(193,98,63,0.12)', pointerEvents: 'none' }} />

          <div style={{ padding: '36px 36px 32px', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', position: 'relative' }}>
            {/* avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div ref={avatarRef} style={{
                width: 84, height: 84, borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
                display: 'grid', placeItems: 'center',
                fontSize: 42, cursor: 'pointer',
                border: '3px solid var(--accent)',
                boxShadow: '0 0 0 0px var(--accent-soft)',
                transition: 'transform 0.15s',
                userSelect: 'none',
              }}
                onClick={() => setShowAvatarPicker(v => !v)}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                title="Click to change avatar"
              >
                {avatar}
              </div>
              <div style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--accent)', border: '2px solid #2a1a12',
                display: 'grid', placeItems: 'center', cursor: 'pointer',
              }}
                onClick={() => setShowAvatarPicker(v => !v)}
              >
                <span style={{ fontSize: 10 }}>✏️</span>
              </div>
            </div>

            {/* name + meta */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 style={{ margin: 0, fontSize: 26, fontFamily: 'var(--font-display)', color: '#fff', lineHeight: 1 }}>
                  {user?.name ?? 'Friend'}
                </h1>
                <span style={{ fontSize: 18 }}>{status}</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 14, fontFamily: 'var(--font-mono)' }}>
                {user?.role ? user.role : 'slowdesk member'} · {user?.location || 'somewhere cozy'}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { n: days,  label: days === 1 ? 'cozy day' : 'cozy days' },
                  { n: '∞',   label: 'possibilities' },
                  { n: '☕',  label: 'brewed today' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: 'rgba(255,255,255,0.1)', borderRadius: 10,
                    padding: '6px 14px', backdropFilter: 'blur(4px)',
                  }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>{s.n}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* email chip */}
            <div style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px',
              fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)',
              border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
            }}>
              {user?.email}
            </div>
          </div>
        </div>

        {/* ── Avatar picker (inline) ────────────────────────── */}
        {showAvatarPicker && (
          <div ref={pickerRef} style={{
            background: 'var(--bg-elev)', border: '1px solid var(--line)',
            borderRadius: 16, padding: '16px 20px', marginBottom: 20,
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-faint)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
              Pick your avatar
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
              {AVATAR_EMOJIS.map(e => (
                <button key={e} onClick={() => { setAvatar(e); setShowAvatarPicker(false); }} style={{
                  fontSize: 24, padding: 6, borderRadius: 10, cursor: 'pointer',
                  border: avatar === e ? '2px solid var(--accent)' : '2px solid transparent',
                  background: avatar === e ? 'var(--accent-soft)' : 'transparent',
                  transition: 'all 0.12s',
                }}
                  onMouseEnter={e2 => (e2.currentTarget.style.background = 'var(--bg-sunk)')}
                  onMouseLeave={e2 => (e2.currentTarget.style.background = avatar === e ? 'var(--accent-soft)' : 'transparent')}
                >{e}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── Cards ─────────────────────────────────────────── */}
        <div ref={contentRef} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Personal info */}
          <Card emoji="🌿" title="Tell your story">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <FieldLabel>Display name</FieldLabel>
                <Field value={name} onChange={setName} placeholder="Your name" />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <Field value={user?.email ?? ''} readOnly />
              </div>
              <div>
                <FieldLabel>Role / title</FieldLabel>
                <Field value={role} onChange={setRole} placeholder="What do you do?" />
              </div>
              <div>
                <FieldLabel>Location</FieldLabel>
                <Field value={location} onChange={setLocation} placeholder="Where in the world?" />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <FieldLabel>Bio</FieldLabel>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="A few words about yourself…"
                rows={3}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1.5px solid var(--line)', background: 'var(--bg)',
                  fontSize: 14, color: 'var(--ink)', outline: 'none',
                  fontFamily: 'var(--font-sans)', resize: 'vertical',
                  lineHeight: 1.6, boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
              />
            </div>

            {/* Cozy status */}
            <div style={{ marginTop: 16 }}>
              <FieldLabel>Cozy status</FieldLabel>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {STATUSES.map(s => (
                  <button key={s.emoji} onClick={() => setStatus(s.emoji)} title={s.label} style={{
                    width: 42, height: 42, borderRadius: 12, fontSize: 20,
                    border: '2px solid',
                    borderColor: status === s.emoji ? 'var(--accent)' : 'var(--line)',
                    background: status === s.emoji ? 'var(--accent-soft)' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.12s',
                    display: 'grid', placeItems: 'center',
                  }}>
                    {s.emoji}
                  </button>
                ))}
                <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--ink-faint)', marginLeft: 4 }}>
                  {STATUSES.find(s => s.emoji === status)?.label ?? ''}
                </span>
              </div>
            </div>

            {/* Save */}
            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={save} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 14 }}>
                {saved ? '✓ Saved!' : 'Save changes'}
              </button>
              {saved && (
                <span style={{ fontSize: 12, color: '#7a9e7e', fontFamily: 'var(--font-mono)' }}>
                  Looking great ✨
                </span>
              )}
            </div>
          </Card>

          {/* Appearance */}
          <Card emoji="🎨" title="Look & feel">
            {/* Theme */}
            <div style={{ marginBottom: 22 }}>
              <FieldLabel>Theme</FieldLabel>
              <div style={{ display: 'flex', gap: 10 }}>
                {([['light', '☀️', 'Day mode'], ['dark', '🌙', 'Night mode']] as const).map(([t, em, lbl]) => (
                  <button key={t} onClick={() => setTheme(t)} style={{
                    flex: 1, padding: '12px', borderRadius: 12, cursor: 'pointer',
                    border: '2px solid',
                    borderColor: theme === t ? 'var(--accent)' : 'var(--line)',
                    background: theme === t ? 'var(--accent-soft)' : 'var(--bg-sunk)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontSize: 14, fontWeight: theme === t ? 600 : 400,
                    color: theme === t ? 'var(--accent)' : 'var(--ink-soft)',
                    fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 18 }}>{em}</span> {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent */}
            <div style={{ marginBottom: 22 }}>
              <FieldLabel>Accent color</FieldLabel>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {ACCENTS.map(a => (
                  <button key={a.key} onClick={() => setAccent(a.key)} title={a.label} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: a.color,
                      border: '3px solid',
                      borderColor: accent === a.key ? 'var(--ink)' : 'transparent',
                      outline: accent === a.key ? `2px solid ${a.color}` : 'none',
                      outlineOffset: 2,
                      transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    }} />
                    <span style={{ fontSize: 10, color: accent === a.key ? 'var(--ink)' : 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
                      {a.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ marginBottom: 22 }}>
              <FieldLabel>Sidebar</FieldLabel>
              <PillGroup
                value={sidebar}
                onChange={setSidebar}
                options={[
                  { key: 'wide', label: 'Wide', emoji: '📖' },
                  { key: 'icon', label: 'Icon only', emoji: '📌' },
                ]}
              />
            </div>

            {/* Density */}
            <div style={{ marginBottom: 22 }}>
              <FieldLabel>Density</FieldLabel>
              <PillGroup value={density} onChange={setDensity} options={DENSITIES} />
            </div>

            {/* Background pattern */}
            <div>
              <FieldLabel>Background pattern</FieldLabel>
              <PillGroup value={bgPattern} onChange={setBgPattern} options={PATTERNS} />
            </div>
          </Card>

          {/* Dashboard layout */}
          <Card emoji="🖥️" title="Dashboard layout">
            <div style={{ display: 'flex', gap: 14 }}>
              {(['A','B','C'] as const).map(v => (
                <button key={v} onClick={() => setDashVariant(v)} style={{
                  flex: 1, borderRadius: 14, padding: '16px 12px',
                  border: '2px solid',
                  borderColor: dashVariant === v ? 'var(--accent)' : 'var(--line)',
                  background: dashVariant === v ? 'var(--accent-soft)' : 'var(--bg-sunk)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {/* mini layout preview */}
                  <div style={{ marginBottom: 10 }}>
                    {v === 'A' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ height: 20, borderRadius: 4, background: dashVariant === 'A' ? 'var(--accent)' : 'var(--line)', opacity: 0.6 }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                          <div style={{ height: 12, borderRadius: 3, background: 'var(--line)' }} />
                          <div style={{ height: 12, borderRadius: 3, background: 'var(--line)' }} />
                        </div>
                        <div style={{ height: 10, borderRadius: 3, background: 'var(--line)' }} />
                      </div>
                    )}
                    {v === 'B' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ height: 24, borderRadius: 4, background: dashVariant === 'B' ? 'var(--accent)' : 'var(--line)', opacity: 0.6 }} />
                          <div style={{ height: 12, borderRadius: 3, background: 'var(--line)' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ height: 12, borderRadius: 3, background: 'var(--line)' }} />
                          <div style={{ height: 24, borderRadius: 4, background: 'var(--line)' }} />
                        </div>
                      </div>
                    )}
                    {v === 'C' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                          {[0,1,2].map(i => <div key={i} style={{ height: 14, borderRadius: 3, background: i === 0 && dashVariant === 'C' ? 'var(--accent)' : 'var(--line)', opacity: i === 0 ? 0.7 : 1 }} />)}
                        </div>
                        <div style={{ height: 18, borderRadius: 4, background: 'var(--line)' }} />
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: dashVariant === v ? 700 : 500,
                    color: dashVariant === v ? 'var(--accent)' : 'var(--ink-soft)',
                    fontFamily: 'var(--font-sans)',
                  }}>
                    Layout {v}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Danger zone */}
          <div style={{
            borderRadius: 18, border: '1.5px solid rgba(224,92,60,0.25)',
            background: 'rgba(224,92,60,0.04)', padding: '24px 28px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>👋</span>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>See you soon</h3>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: 380 }}>
                  Your workspace stays safe. All your tasks, habits, notes, and projects will be right here when you return. ☕
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {signOutConfirm ? (
                  <>
                    <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Are you sure?</span>
                    <button onClick={handleSignOut} style={{
                      padding: '9px 20px', borderRadius: 10, border: 'none',
                      background: '#e05c3c', color: '#fff',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 7,
                    }}>
                      <Icon name="logout" size={13} /> Yes, sign out
                    </button>
                    <button onClick={() => setSignOutConfirm(false)} className="btn" style={{ fontSize: 13, padding: '9px 16px' }}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setSignOutConfirm(true)} className="btn" style={{
                    fontSize: 13, padding: '9px 20px',
                    display: 'flex', alignItems: 'center', gap: 7,
                    color: '#e05c3c', borderColor: 'rgba(224,92,60,0.3)',
                  }}>
                    <Icon name="logout" size={13} style={{ color: '#e05c3c' }} /> Sign out
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* fun footer quote */}
          <div style={{ textAlign: 'center', padding: '10px 0 4px', color: 'var(--ink-faint)', fontSize: 13, fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
            "Slow down and the thing you are chasing will come around and catch you." — Zen proverb
          </div>

        </div>
      </div>
    </div>
  );
}
