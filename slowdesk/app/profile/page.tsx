'use client';
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { createClient } from '@/lib/supabase/client';
import { useApp, Accent } from '@/lib/store';
import Topbar from '@/components/Topbar';
import Icon from '@/components/Icon';

const handleSignOut = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = '/';
};

const AVATAR_EMOJIS = [
  '☕','🌿','🌊','🦉','🌙','⭐','🌸','🍃','🦋','🌻',
  '🎨','📚','🌵','🐢','🌈','🍀','🌺','🦊','🐝','🎭',
  '✨','🌟','🍵','🎸','🎹','🏔️','🌄','🦅','🐋','🎯',
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

const DENSITIES: { key: 'compact' | 'cozy' | 'comfy'; label: string }[] = [
  { key: 'compact', label: 'Compact' },
  { key: 'cozy',    label: 'Cozy'    },
  { key: 'comfy',   label: 'Comfy'   },
];

const PATTERNS: { key: 'none' | 'dots' | 'grid'; label: string }[] = [
  { key: 'none', label: 'None' },
  { key: 'dots', label: 'Dots' },
  { key: 'grid', label: 'Grid' },
];

function daysSince(iso?: string) {
  if (!iso) return 1;
  return Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: 'var(--ink-faint)',
      fontFamily: 'var(--font-mono)', marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600,
        color: 'var(--ink-soft)', marginBottom: 6,
        fontFamily: 'var(--font-sans)',
      }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, readOnly }: {
  value: string; onChange?: (v: string) => void;
  placeholder?: string; readOnly?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8,
        border: '1px solid var(--line)',
        background: readOnly ? 'var(--bg-sunk)' : 'var(--bg)',
        fontSize: 14, color: readOnly ? 'var(--ink-faint)' : 'var(--ink)',
        outline: 'none', fontFamily: 'var(--font-sans)',
        boxSizing: 'border-box', transition: 'border-color 0.15s',
        cursor: readOnly ? 'default' : 'text',
      }}
      onFocus={e => { if (!readOnly) e.target.style.borderColor = 'var(--accent)'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--line)'; }}
    />
  );
}

function PillToggle<T extends string>({
  options, value, onChange,
}: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', background: 'var(--bg-sunk)', borderRadius: 8, padding: 3, gap: 2 }}>
      {options.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} style={{
          flex: 1, padding: '6px 12px', borderRadius: 6, border: 'none',
          background: value === o.key ? 'var(--bg-elev)' : 'transparent',
          color: value === o.key ? 'var(--ink)' : 'var(--ink-faint)',
          fontSize: 13, fontWeight: value === o.key ? 600 : 400,
          cursor: 'pointer', fontFamily: 'var(--font-sans)',
          transition: 'all 0.15s',
          boxShadow: value === o.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
        }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--line)', margin: '28px 0' }} />;
}

export default function ProfilePage() {
  const {
    user, updateUser,
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

  const pageRef    = useRef<HTMLDivElement>(null);
  const pickerRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pageRef.current) return;
    gsap.fromTo(Array.from(pageRef.current.children),
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, stagger: 0.07, duration: 0.4, ease: 'power2.out' }
    );
  }, []);

  useEffect(() => {
    if (showAvatarPicker && pickerRef.current) {
      gsap.fromTo(pickerRef.current,
        { opacity: 0, y: -8, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'back.out(1.4)' }
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
      <Topbar title="Profile" subtitle="your account & preferences" />

      <div ref={pageRef} style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* ── Identity header ───────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20,
          padding: '4px 0 28px',
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setShowAvatarPicker(v => !v)}
              style={{
                width: 72, height: 72, borderRadius: 18,
                background: 'var(--bg-elev)', border: '1px solid var(--line)',
                fontSize: 36, cursor: 'pointer',
                display: 'grid', placeItems: 'center',
                transition: 'border-color 0.15s, transform 0.15s',
                boxShadow: showAvatarPicker ? `0 0 0 2px var(--accent)` : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              title="Change avatar"
            >
              {avatar}
            </button>
            <div style={{
              position: 'absolute', bottom: -3, right: -3,
              width: 20, height: 20, borderRadius: 6,
              background: 'var(--accent)', display: 'grid', placeItems: 'center',
              border: '2px solid var(--bg)',
            }}>
              <Icon name="edit" size={10} style={{ color: '#fff' }} />
            </div>
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 4 }}>
              {user?.name || 'Your name'}
              <span style={{ marginLeft: 8, fontSize: 18 }}>{status}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 8 }}>
              {user?.email}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 12, color: 'var(--ink-soft)',
                background: 'var(--bg-elev)', border: '1px solid var(--line)',
                borderRadius: 6, padding: '3px 10px',
              }}>
                {days} day{days !== 1 ? 's' : ''} with SlowDesk
              </span>
              {user?.role && (
                <span style={{
                  fontSize: 12, color: 'var(--ink-soft)',
                  background: 'var(--bg-elev)', border: '1px solid var(--line)',
                  borderRadius: 6, padding: '3px 10px',
                }}>
                  {user.role}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Avatar picker */}
        {showAvatarPicker && (
          <div ref={pickerRef} style={{
            background: 'var(--bg-elev)', border: '1px solid var(--line)',
            borderRadius: 12, padding: '14px 16px', marginBottom: 24,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
              Choose avatar
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
              {AVATAR_EMOJIS.map(e => (
                <button key={e} onClick={() => { setAvatar(e); setShowAvatarPicker(false); }} style={{
                  fontSize: 22, padding: 6, borderRadius: 8, cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: avatar === e ? 'var(--accent)' : 'transparent',
                  background: avatar === e ? 'var(--accent-soft)' : 'transparent',
                  transition: 'all 0.12s',
                }}
                  onMouseEnter={e2 => { if (e !== avatar) e2.currentTarget.style.background = 'var(--bg-sunk)'; }}
                  onMouseLeave={e2 => { e2.currentTarget.style.background = e === avatar ? 'var(--accent-soft)' : 'transparent'; }}
                >{e}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── Personal info ─────────────────────────────────── */}
        <div className="card" style={{ borderRadius: 14, padding: '20px 24px' }}>
          <SectionLabel>Personal info</SectionLabel>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <FieldRow label="Display name">
              <Input value={name} onChange={setName} placeholder="Your name" />
            </FieldRow>
            <FieldRow label="Email">
              <Input value={user?.email ?? ''} readOnly />
            </FieldRow>
            <FieldRow label="Role">
              <Input value={role} onChange={setRole} placeholder="What do you do?" />
            </FieldRow>
            <FieldRow label="Location">
              <Input value={location} onChange={setLocation} placeholder="Where are you?" />
            </FieldRow>
          </div>

          <FieldRow label="Bio">
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="A few words about yourself…"
              rows={3}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                border: '1px solid var(--line)', background: 'var(--bg)',
                fontSize: 14, color: 'var(--ink)', outline: 'none',
                fontFamily: 'var(--font-sans)', resize: 'vertical',
                lineHeight: 1.6, boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
            />
          </FieldRow>

          <Divider />

          <FieldRow label="Status">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {STATUSES.map(s => (
                <button key={s.emoji} onClick={() => setStatus(s.emoji)} title={s.label} style={{
                  width: 38, height: 38, borderRadius: 10, fontSize: 18,
                  border: '1px solid',
                  borderColor: status === s.emoji ? 'var(--accent)' : 'var(--line)',
                  background: status === s.emoji ? 'var(--accent-soft)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.12s',
                  display: 'grid', placeItems: 'center',
                }}>
                  {s.emoji}
                </button>
              ))}
              <span style={{ fontSize: 12, color: 'var(--ink-faint)', marginLeft: 4 }}>
                {STATUSES.find(s => s.emoji === status)?.label ?? ''}
              </span>
            </div>
          </FieldRow>

          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={save} className="btn btn-primary" style={{ fontSize: 13, padding: '9px 20px' }}>
              {saved ? '✓ Saved' : 'Save changes'}
            </button>
            {saved && <span style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>Changes saved</span>}
          </div>
        </div>

        <div style={{ height: 16 }} />

        {/* ── Appearance ────────────────────────────────────── */}
        <div className="card" style={{ borderRadius: 14, padding: '20px 24px' }}>
          <SectionLabel>Appearance</SectionLabel>

          {/* Theme */}
          <FieldRow label="Theme">
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, marginTop: 4 }}>
              {(['light', 'dark'] as const).map(t => (
                <button key={t} onClick={() => setTheme(t)} style={{
                  flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                  border: '1px solid',
                  borderColor: theme === t ? 'var(--accent)' : 'var(--line)',
                  background: theme === t ? 'var(--accent-soft)' : 'var(--bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontSize: 13, fontWeight: theme === t ? 600 : 400,
                  color: theme === t ? 'var(--accent)' : 'var(--ink-soft)',
                  fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                }}>
                  {t === 'light' ? '☀️ Day' : '🌙 Night'}
                </button>
              ))}
            </div>
          </FieldRow>

          {/* Accent */}
          <FieldRow label="Accent color">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4, marginBottom: 20 }}>
              {ACCENTS.map(a => (
                <button key={a.key} onClick={() => setAccent(a.key)} title={a.label} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', background: a.color,
                    border: '2.5px solid',
                    borderColor: accent === a.key ? 'var(--ink)' : 'transparent',
                    outline: accent === a.key ? `2px solid ${a.color}` : 'none',
                    outlineOffset: 2, transition: 'all 0.15s',
                  }} />
                  <span style={{ fontSize: 10, color: accent === a.key ? 'var(--ink)' : 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
                    {a.label}
                  </span>
                </button>
              ))}
            </div>
          </FieldRow>

          {/* Sidebar */}
          <FieldRow label="Sidebar">
            <div style={{ marginTop: 4, marginBottom: 20, maxWidth: 280 }}>
              <PillToggle
                value={sidebar}
                onChange={setSidebar}
                options={[{ key: 'wide', label: 'Wide' }, { key: 'icon', label: 'Icons only' }]}
              />
            </div>
          </FieldRow>

          {/* Density */}
          <FieldRow label="Density">
            <div style={{ marginTop: 4, marginBottom: 20, maxWidth: 280 }}>
              <PillToggle value={density} onChange={setDensity} options={DENSITIES} />
            </div>
          </FieldRow>

          {/* Background pattern */}
          <FieldRow label="Background pattern">
            <div style={{ marginTop: 4, maxWidth: 280 }}>
              <PillToggle value={bgPattern} onChange={setBgPattern} options={PATTERNS} />
            </div>
          </FieldRow>
        </div>

        <div style={{ height: 16 }} />

        {/* ── Dashboard layout ──────────────────────────────── */}
        <div className="card" style={{ borderRadius: 14, padding: '20px 24px' }}>
          <SectionLabel>Dashboard layout</SectionLabel>
          <div style={{ display: 'flex', gap: 10 }}>
            {([
              { v: 'A' as const, label: 'Classic',   desc: '2/3 + sidebar' },
              { v: 'B' as const, label: 'Focus',     desc: 'Wide + narrow' },
              { v: 'C' as const, label: 'Editorial', desc: 'Equal columns' },
            ]).map(({ v, label, desc }) => (
              <button key={v} onClick={() => setDashVariant(v)} style={{
                flex: 1, borderRadius: 10, padding: '14px 10px',
                border: '1px solid',
                borderColor: dashVariant === v ? 'var(--accent)' : 'var(--line)',
                background: dashVariant === v ? 'var(--accent-soft)' : 'var(--bg)',
                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
              }}>
                {/* Mini wireframe */}
                <div style={{ marginBottom: 10 }}>
                  {v === 'A' && (
                    <div style={{ display: 'flex', gap: 3, height: 28, padding: '0 4px' }}>
                      <div style={{ flex: 1, background: dashVariant === 'A' ? 'var(--accent)' : 'var(--line)', borderRadius: 3, opacity: 0.5 }} />
                      <div style={{ width: '35%', background: 'var(--line)', borderRadius: 3 }} />
                    </div>
                  )}
                  {v === 'B' && (
                    <div style={{ display: 'flex', gap: 3, height: 28, padding: '0 4px' }}>
                      <div style={{ flex: 2, background: dashVariant === 'B' ? 'var(--accent)' : 'var(--line)', borderRadius: 3, opacity: 0.5 }} />
                      <div style={{ flex: 1, background: 'var(--line)', borderRadius: 3 }} />
                    </div>
                  )}
                  {v === 'C' && (
                    <div style={{ display: 'flex', gap: 3, height: 28, padding: '0 4px' }}>
                      <div style={{ flex: 1, background: dashVariant === 'C' ? 'var(--accent)' : 'var(--line)', borderRadius: 3, opacity: 0.5 }} />
                      <div style={{ flex: 1, background: 'var(--line)', borderRadius: 3 }} />
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: dashVariant === v ? 700 : 500, color: dashVariant === v ? 'var(--accent)' : 'var(--ink)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 16 }} />

        {/* ── Sign out ──────────────────────────────────────── */}
        <div className="card" style={{
          borderRadius: 14, padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>Sign out</div>
            <div style={{ fontSize: 13, color: 'var(--ink-faint)' }}>Your data stays safe and will be here when you return.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {signOutConfirm ? (
              <>
                <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Are you sure?</span>
                <button onClick={handleSignOut} style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: '#e05c3c', color: '#fff',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Icon name="logout" size={13} /> Yes, sign out
                </button>
                <button onClick={() => setSignOutConfirm(false)} className="btn" style={{ fontSize: 13, padding: '8px 14px' }}>
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setSignOutConfirm(true)} className="btn" style={{
                fontSize: 13, padding: '8px 16px',
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'var(--ink-soft)',
              }}>
                <Icon name="logout" size={13} /> Sign out
              </button>
            )}
          </div>
        </div>

        <div style={{ height: 40 }} />

      </div>
    </div>
  );
}
