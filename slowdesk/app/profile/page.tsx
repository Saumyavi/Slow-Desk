'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { createClient } from '@/lib/supabase/client';
import { useApp, Accent } from '@/lib/store';
import * as db from '@/lib/supabase/db';
import Topbar from '@/components/layout/Topbar';
import Icon from '@/components/ui/Icon';

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
  { emoji: '🫖', label: 'Tea time'    },
  { emoji: '🎧', label: 'Deep focus'  },
  { emoji: '💭', label: 'Thinking'    },
  { emoji: '🌱', label: 'Slow start'  },
  { emoji: '🔥', label: 'On fire'     },
  { emoji: '✨', label: 'Magic hours' },
  { emoji: '🥐', label: 'Cozy'        },
  { emoji: '🌿', label: 'Out & about' },
];

const ACCENTS: { key: Accent; color: string; label: string; hint: string }[] = [
  { key: 'terracotta', color: '#c1623f', label: 'Terracotta', hint: 'a warm clay pot'   },
  { key: 'sage',       color: '#7a9e7e', label: 'Sage',       hint: 'a quiet garden'    },
  { key: 'plum',       color: '#8b5c75', label: 'Plum',       hint: 'late-summer fruit' },
  { key: 'butter',     color: '#c9943a', label: 'Butter',     hint: 'morning sunlight'  },
  { key: 'sky',        color: '#5b8fbf', label: 'Sky',        hint: 'after the rain'    },
  { key: 'ink',        color: '#2a2420', label: 'Ink',        hint: 'a fountain pen'    },
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


function Input({ value, onChange, placeholder, readOnly, style: extraStyle }: {
  value: string; onChange?: (v: string) => void;
  placeholder?: string; readOnly?: boolean;
  style?: React.CSSProperties;
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
        outline: 'none', fontFamily: 'var(--font-body)',
        boxSizing: 'border-box', transition: 'border-color 0.15s',
        cursor: readOnly ? 'default' : 'text',
        ...extraStyle,
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
          cursor: 'pointer', fontFamily: 'var(--font-body)',
          transition: 'all 0.15s',
          boxShadow: value === o.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
        }}>
          {o.label}
        </button>
      ))}
    </div>
  );
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
    tasks, projects, calendarEvents,
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

  const [avatarUrl,       setAvatarUrl]       = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [photoLightbox,   setPhotoLightbox]   = useState(false);

  // Morning ritual state
  const [notifEmailEnabled,        setNotifEmailEnabled]        = useState(false);
  const [notifWaEnabled,           setNotifWaEnabled]           = useState(false);
  const [notifCallEnabled,         setNotifCallEnabled]         = useState(false);
  const [notifCallEveningEnabled,  setNotifCallEveningEnabled]  = useState(false);
  const [notifPhone,               setNotifPhone]               = useState('');
  const [notifTime,                setNotifTime]                = useState('08:00');
  const [notifTimezone,            setNotifTimezone]            = useState('UTC');
  const [notifSaved,               setNotifSaved]               = useState(false);
  const [notifSaving,              setNotifSaving]              = useState(false);
  const [ritualSaved,              setRitualSaved]              = useState(false);
  const [hoveredAccent,       setHoveredAccent]       = useState<string | null>(null);

  const [exporting, setExporting] = useState<string | null>(null);

  const pageRef    = useRef<HTMLDivElement>(null);
  const pickerRef  = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const todayStamp = () => new Date().toISOString().slice(0, 10);

  const exportJSON = async () => {
    setExporting('json');
    try {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      let notes: object[] = [];
      if (u) {
        const list = await db.getNotes(u.id);
        notes = await Promise.all(list.map(n => db.getNote(u.id, n.id).then(f => ({ ...n, content: f?.content ?? '' }))));
      }
      const payload = {
        exported_at: new Date().toISOString(),
        tasks,
        projects,
        calendar_events: calendarEvents,
        notes,
      };
      triggerDownload(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `slowdesk-${todayStamp()}.json`);
    } catch (e) { console.error(e); }
    setExporting(null);
  };

  const exportCSV = () => {
    setExporting('csv');
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const headers = ['Title', 'Done', 'Project', 'Priority', 'Due', 'Time'];
    const rows = tasks.map(t => [esc(t.title), t.done ? 'Yes' : 'No', esc(t.project), t.priority, t.due, t.time ?? ''].join(','));
    triggerDownload(new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' }), `slowdesk-tasks-${todayStamp()}.csv`);
    setExporting(null);
  };

  const exportMarkdown = async () => {
    setExporting('md');
    try {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();

      const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      let md = `# SlowDesk Export\n_${date}_\n\n---\n\n`;

      // Tasks grouped by project
      md += `## Tasks\n\n`;
      const byProject: Record<string, typeof tasks> = {};
      for (const t of tasks) { (byProject[t.project || 'Inbox'] ??= []).push(t); }
      for (const [proj, pts] of Object.entries(byProject)) {
        md += `### ${proj}\n\n`;
        for (const t of pts) md += `- [${t.done ? 'x' : ' '}] ${t.title}${t.priority === 'high' ? ' ⚡' : ''} · _${t.due}_\n`;
        md += '\n';
      }

      // Projects
      if (projects.length) {
        md += `## Projects\n\n`;
        for (const p of projects) md += `### ${p.name}\n${p.desc ? p.desc + '\n' : ''}_Due: ${p.due}_\n\n`;
      }

      // Notes with full content
      if (u) {
        const list = await db.getNotes(u.id);
        if (list.length) {
          md += `## Notes\n\n`;
          for (const n of list) {
            const full = await db.getNote(u.id, n.id);
            md += `### ${n.title}\n\n${full?.content ?? ''}\n\n---\n\n`;
          }
        }
      }

      triggerDownload(new Blob([md], { type: 'text/markdown' }), `slowdesk-${todayStamp()}.md`);
    } catch (e) { console.error(e); }
    setExporting(null);
  };

  useEffect(() => {
    if (!pageRef.current) return;
    gsap.fromTo(Array.from(pageRef.current.children),
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, stagger: 0.07, duration: 0.4, ease: 'power2.out' }
    );
  }, []);

  // Load notification preferences and avatar_url
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('notification_email_enabled, notification_whatsapp_enabled, notification_call_enabled, notification_call_evening_enabled, notification_phone, notification_time, notification_timezone, avatar_url')
        .eq('id', data.user.id)
        .single();
      if (!profile) return;
      setNotifEmailEnabled(profile.notification_email_enabled ?? false);
      setNotifWaEnabled(profile.notification_whatsapp_enabled ?? false);
      setNotifCallEnabled(profile.notification_call_enabled ?? false);
      setNotifCallEveningEnabled(profile.notification_call_evening_enabled ?? false);
      setNotifPhone(profile.notification_phone ?? '');
      setNotifTime(profile.notification_time ?? '08:00');
      setNotifTimezone(profile.notification_timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC');
      if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
    });
  }, []);


  const saveNotifPrefs = async () => {
    setNotifSaving(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      await supabase.from('user_profiles').update({
        notification_email_enabled:        notifEmailEnabled,
        notification_whatsapp_enabled:     notifWaEnabled,
        notification_call_enabled:         notifCallEnabled,
        notification_call_evening_enabled: notifCallEveningEnabled,
        notification_phone:                notifPhone || null,
        notification_time:                 notifTime,
        notification_timezone:             notifTimezone,
        updated_at:                        new Date().toISOString(),
      }).eq('id', data.user.id);
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2500);
    } finally {
      setNotifSaving(false);
    }
  };

  useEffect(() => {
    if (showAvatarPicker && pickerRef.current) {
      gsap.fromTo(pickerRef.current,
        { opacity: 0, y: -8, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'back.out(1.4)' }
      );
    }
  }, [showAvatarPicker]);

  const uploadAvatar = useCallback(async (file: File) => {
    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${u.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) { console.error(upErr); return; }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(url);
      await supabase.from('user_profiles').update({ avatar_url: url, updated_at: new Date().toISOString() }).eq('id', u.id);
    } finally {
      setAvatarUploading(false);
    }
  }, []);

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

      {/* spin-slow keyframe */}
      <style>{`@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div ref={pageRef} style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>

        {/* ── Hero ──────────────────────────────────────────── */}
        <div style={{
          position: 'relative', borderRadius: 24, overflow: 'hidden',
          marginBottom: 28,
          background: 'linear-gradient(135deg, color-mix(in oklch, var(--accent-soft) 70%, transparent), var(--bg-elev) 70%)',
          border: '1px solid var(--line)', boxShadow: 'var(--shadow)',
        }}>
          {/* Watermark serif initial */}
          <div aria-hidden style={{
            position: 'absolute', right: -18, top: -64,
            fontSize: 360, lineHeight: 1,
            color: 'var(--accent)', opacity: 0.07,
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            pointerEvents: 'none', userSelect: 'none',
          }}>{(name[0] || 's').toLowerCase()}</div>

          {/* Script flourish */}
          <svg aria-hidden width="220" height="60" viewBox="0 0 220 60" style={{ position: 'absolute', left: 30, bottom: 12, opacity: 0.12, pointerEvents: 'none' }}>
            <path d="M5 40 Q 30 5, 60 35 T 120 35 T 180 30 Q 200 25, 215 40" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
          </svg>

          <div style={{ position: 'relative', padding: '38px 36px 34px', display: 'flex', alignItems: 'center', gap: 26 }}>

            {/* Spinning avatar ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 104, height: 104, borderRadius: '50%',
                background: 'conic-gradient(from 220deg, var(--terracotta), var(--butter), var(--sage), var(--plum), var(--terracotta))',
                padding: 4, boxShadow: 'var(--shadow-lg)',
                animation: 'spin-slow 32s linear infinite',
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--terracotta), var(--butter))',
                  display: 'grid', placeItems: 'center', color: 'white',
                  fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: avatarUrl ? undefined : (avatar && avatar !== (name[0] || 's').toLowerCase() ? 44 : 52),
                  border: '3px solid var(--bg-elev)', overflow: 'hidden',
                  animation: avatarUrl ? 'spin-slow 32s linear reverse infinite' : undefined,
                }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" onClick={() => setPhotoLightbox(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block', cursor: 'zoom-in' }} />
                  ) : avatar && !AVATAR_EMOJIS.every(e => e !== avatar) ? (
                    <span style={{ fontSize: 44, lineHeight: 1 }}>{avatar}</span>
                  ) : (
                    (name[0] || 's').toLowerCase()
                  )}
                </div>
              </div>
              {/* Status dot */}
              <div title={STATUSES.find(s => s.emoji === status)?.label ?? ''} style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--bg-elev)', border: '2.5px solid var(--bg-elev)',
                boxShadow: 'var(--shadow)', display: 'grid', placeItems: 'center', fontSize: 18,
              }}>{status}</div>
              {/* Upload photo button */}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = ''; }} />
              <button title={avatarUploading ? 'Uploading…' : 'Upload photo'} onClick={() => {
                if (avatarUploading) return;
                fileInputRef.current?.click();
              }} style={{
                position: 'absolute', top: -2, right: -2,
                width: 28, height: 28, borderRadius: '50%',
                background: avatarUploading ? 'var(--accent-soft)' : 'var(--bg-elev)', border: '1px solid var(--line)',
                display: 'grid', placeItems: 'center', color: 'var(--ink-soft)',
                boxShadow: 'var(--shadow-sm)', cursor: avatarUploading ? 'default' : 'pointer',
              }}>
                {avatarUploading ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-18 0"/></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Name block */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ink-faint)', marginBottom: 6 }}>
                <span style={{ color: 'var(--accent)' }}>●</span> resident · {days} day{days !== 1 ? 's' : ''}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 1, letterSpacing: '-0.025em', marginBottom: 4 }}>
                {name || 'unnamed'}<span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>.</span>
              </div>
              <div style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                {user?.email}
              </div>
            </div>

            {/* Ticket badge */}
            <div style={{ flexShrink: 0, transform: 'rotate(2.5deg)' }}>
              <div style={{
                background: 'var(--bg-elev)', border: '1.5px dashed var(--accent)',
                borderRadius: 10, padding: '14px 18px 14px 22px',
                boxShadow: 'var(--shadow)', position: 'relative', minWidth: 180,
              }}>
                <span style={{ position: 'absolute', left: -7, top: '50%', width: 12, height: 12, borderRadius: '50%', background: 'var(--bg)', transform: 'translateY(-50%)', border: '1.5px dashed var(--accent)', clipPath: 'inset(0 0 0 50%)' }} />
                <span style={{ position: 'absolute', right: -7, top: '50%', width: 12, height: 12, borderRadius: '50%', background: 'var(--bg)', transform: 'translateY(-50%)', border: '1.5px dashed var(--accent)', clipPath: 'inset(0 50% 0 0)' }} />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--ink-faint)', marginBottom: 4 }}>SLOWDESK · NO. 0001</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1, color: 'var(--accent)' }}>
                  day <span style={{ fontStyle: 'italic' }}>one</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-soft)', marginTop: 6 }}>welcome aboard ✦</div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{
            borderTop: '1px solid var(--line)',
            background: 'oklch(from var(--bg-elev, #f9f3ec) l c h / 0.6)',
            backdropFilter: 'blur(4px)',
            padding: '14px 36px',
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24,
          }}>
            {[
              { n: String(days),    l: 'days here',      sub: days === 1 ? 'just arrived' : 'and counting' },
              { n: '0',             l: 'streak days',    sub: 'starts tomorrow' },
              { n: '6',             l: 'projects open',  sub: 'gently' },
              { n: '∞',        l: 'cups of tea',    sub: 'unverified' },
            ].map((s, i) => (
              <div key={i} style={{ position: 'relative' }}>
                {i > 0 && <span style={{ position: 'absolute', left: -12, top: 4, bottom: 4, width: 1, background: 'var(--line)' }} />}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: i === 3 ? 'var(--accent)' : 'var(--ink)', fontStyle: i === 3 ? 'italic' : 'normal' }}>{s.n}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-faint)', marginTop: 4 }}>{s.l}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontStyle: 'italic', marginTop: 1 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>


        {/* ── 01 Personal info ──────────────────────────────── */}
        <div className="card" style={{ borderRadius: 18, padding: 28, marginBottom: 22 }}>
          {/* Section label */}
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-faint)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            01 — Personal info
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, margin: '8px 0 6px', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Who <em style={{ color: 'var(--accent)' }}>are</em> you, really?
          </h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, margin: '0 0 24px', maxWidth: 460 }}>
            A few quiet details. Only what you&apos;d put on a name tag — nothing more.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 6, display: 'block' }}>Display name</label>
              <Input value={name} onChange={setName} placeholder="Your name" />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 6, display: 'block' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Input value={user?.email ?? ''} readOnly />
                <span style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em',
                  color: 'var(--accent)', background: 'var(--accent-soft)', padding: '3px 7px', borderRadius: 4,
                }}>verified</span>
              </div>
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 6, display: 'block' }}>What you do</label>
              <Input value={role} onChange={setRole} placeholder="designer, gardener, both…" />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 6, display: 'block' }}>Where you are</label>
              <div style={{ position: 'relative' }}>
                <Input value={location} onChange={setLocation} placeholder="a city, a forest, a rooftop" style={{ paddingLeft: 36 }} />
                <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', pointerEvents: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 6, display: 'block' }}>
              Bio <span style={{ color: 'var(--ink-faint)', fontStyle: 'normal', fontSize: 12, fontFamily: 'var(--font-body)' }}>— a small autobiography</span>
            </label>
            <div style={{ position: 'relative' }}>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, 280))}
                placeholder="Once upon a Wednesday afternoon…"
                style={{
                  width: '100%', minHeight: 130, padding: '14px 16px', borderRadius: 10,
                  border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)',
                  fontSize: 17, fontFamily: 'var(--font-display)', lineHeight: 1.6,
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in oklch, var(--accent) 15%, transparent)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <div style={{
                position: 'absolute', right: 12, bottom: 10,
                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.05em',
                background: 'var(--bg-elev)', padding: '2px 6px', borderRadius: 4,
              }}>{bio.length} / 280</div>
            </div>
          </div>

          {/* Status — expanding chips */}
          <div>
            <label style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 10, display: 'block' }}>Today you feel like…</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {STATUSES.map(s => {
                const active = status === s.emoji;
                return (
                  <button key={s.emoji} onClick={() => setStatus(s.emoji)} title={s.label} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: active ? '7px 13px 7px 9px' : '7px 9px',
                    borderRadius: 999,
                    border: '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
                    background: active ? 'var(--accent-soft)' : 'var(--bg)',
                    color: active ? 'var(--accent)' : 'var(--ink-soft)',
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.18s cubic-bezier(.2,.9,.3,1.2)',
                    transform: active ? 'translateY(-1px)' : 'none',
                    boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  }}>
                    <span style={{ fontSize: 16 }}>{s.emoji}</span>
                    {active && <span>{s.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <hr style={{ margin: '24px 0 20px', border: 'none', borderTop: '1px solid var(--line)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={save} className="btn btn-primary" style={{ padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="check" size={14} />
              {saved ? 'All tucked in' : 'Save changes'}
            </button>
            <button className="btn" onClick={() => { setName(user?.name ?? ''); setRole(user?.role ?? ''); setLocation(user?.location ?? ''); setBio(user?.bio ?? ''); }}>Discard</button>
            <div style={{ flex: 1 }} />
            {saved ? (
              <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: 'var(--accent)' }}>kept safe ✦</span>
            ) : (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-faint)' }}>autosaves on blur</span>
            )}
          </div>
        </div>

        {/* ── 02 Appearance ─────────────────────────────────── */}
        <div className="card" style={{ borderRadius: 18, padding: 28, marginBottom: 22 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-faint)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            02 — Appearance
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, margin: '8px 0 6px', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Set the <em style={{ color: 'var(--accent)' }}>mood</em>.
          </h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, margin: '0 0 26px' }}>
            Pick a light. Pick a colour. Live with it for a week.
          </p>

          {/* Theme — illustrated cards */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 10, display: 'block' }}>Theme</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {([
                { id: 'light' as const, name: 'Day',   sub: 'cream paper, fresh tea',  bg: 'linear-gradient(135deg, #f5ede2, #ede0ce)', glyph: '☀' },
                { id: 'dark'  as const, name: 'Night', sub: 'lamp on, world quiet',     bg: 'linear-gradient(135deg, #231e18, #1a1510)', glyph: '☾' },
              ]).map(t => {
                const active = theme === t.id;
                const dark = t.id === 'dark';
                return (
                  <button key={t.id} onClick={() => setTheme(t.id)} style={{
                    position: 'relative', overflow: 'hidden', borderRadius: 14,
                    background: t.bg,
                    border: '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
                    padding: 18, textAlign: 'left', cursor: 'pointer', transition: 'all 0.18s',
                    boxShadow: active ? '0 0 0 3px color-mix(in oklch, var(--accent) 15%, transparent)' : 'none',
                    color: dark ? '#f0ece4' : 'var(--ink)',
                  }}>
                    <div style={{ position: 'absolute', right: 12, top: 12, fontSize: 26, opacity: 0.85 }}>{t.glyph}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontStyle: 'italic', letterSpacing: '-0.01em' }}>{t.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{t.sub}</div>
                    {active && <div style={{ position: 'absolute', bottom: 10, right: 14, fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: dark ? '#f0ece4' : 'var(--accent)' }}>● in use</div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent — paint chips */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 10, display: 'block' }}>Accent — house colour</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
              {ACCENTS.map(a => {
                const active = accent === a.key;
                const hov = hoveredAccent === a.key;
                return (
                  <button key={a.key} onClick={() => setAccent(a.key)}
                    onMouseEnter={() => setHoveredAccent(a.key)}
                    onMouseLeave={() => setHoveredAccent(null)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                      borderRadius: 10, overflow: 'hidden',
                      border: '1px solid ' + (active ? 'var(--ink)' : 'var(--line)'),
                      background: 'var(--bg)', padding: 0, cursor: 'pointer',
                      transition: 'transform 0.18s, box-shadow 0.18s',
                      transform: hov ? 'translateY(-3px) rotate(-0.6deg)' : 'none',
                      boxShadow: hov || active ? 'var(--shadow)' : 'none',
                    }}>
                    <span style={{ height: 44, background: a.color, borderBottom: '1px solid rgba(0,0,0,0.08)', position: 'relative', display: 'block' }}>
                      {active && <span style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: 'var(--bg-elev)', display: 'grid', placeItems: 'center', color: a.color }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      </span>}
                    </span>
                    <span style={{ padding: '8px 10px 9px', textAlign: 'left' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block' }}>{a.label}</span>
                      <span style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontStyle: 'italic', display: 'block', marginTop: 1 }}>{a.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar + Density */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
            <div>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 8, display: 'block' }}>Sidebar</label>
              <PillToggle value={sidebar} onChange={setSidebar} options={[{ key: 'wide', label: 'Wide' }, { key: 'icon', label: 'Icons only' }]} />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 8, display: 'block' }}>Density</label>
              <PillToggle value={density} onChange={setDensity} options={DENSITIES} />
            </div>
          </div>

          {/* Background pattern */}
          <div>
            <label style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 10, display: 'block' }}>Background pattern</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { id: 'none' as const, name: 'None', bg: 'var(--bg)', size: undefined },
                { id: 'dots' as const, name: 'Dots', bg: 'radial-gradient(rgba(120,100,80,0.4) 1px, var(--bg) 1px)', size: '10px 10px' },
                { id: 'grid' as const, name: 'Grid', bg: 'linear-gradient(to right, rgba(120,100,80,0.3) 1px, var(--bg) 1px), linear-gradient(to bottom, rgba(120,100,80,0.3) 1px, var(--bg) 1px)', size: '14px 14px' },
              ].map(p => {
                const active = bgPattern === p.id;
                return (
                  <button key={p.id} onClick={() => setBgPattern(p.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                    borderRadius: 11, border: '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
                    background: active ? 'var(--accent-soft)' : 'var(--bg)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <span style={{ width: 38, height: 38, borderRadius: 8, background: p.bg, backgroundSize: p.size, border: '1px solid var(--line)', flexShrink: 0, display: 'block' }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: active ? 'var(--accent)' : 'var(--ink)' }}>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 03 Dashboard layout ───────────────────────────── */}
        <div className="card" style={{ borderRadius: 18, padding: 28, marginBottom: 22 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-faint)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            03 — Dashboard layout
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, margin: '8px 0 6px', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Pick a <em style={{ color: 'var(--accent)' }}>rhythm</em>.
          </h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, margin: '0 0 22px' }}>
            How the home view sits when you arrive in the morning.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {([
              { v: 'A' as const, label: 'Classic',   sub: 'main + sidebar', tag: 'most popular',   cols: '2fr 1fr' },
              { v: 'B' as const, label: 'Focus',     sub: 'wide + narrow',  tag: 'one-thing days', cols: '3fr 1fr' },
              { v: 'C' as const, label: 'Editorial', sub: 'three columns',  tag: 'magazine feel',  cols: '1fr 1fr 1fr' },
            ]).map(({ v, label, sub, tag, cols }) => {
              const active = dashVariant === v;
              return (
                <button key={v} onClick={() => setDashVariant(v)} style={{
                  background: active ? 'var(--accent-soft)' : 'var(--bg)',
                  border: '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
                  borderRadius: 14, padding: 16, cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.18s', position: 'relative',
                  boxShadow: active ? 'var(--shadow)' : 'none',
                  transform: active ? 'translateY(-2px)' : 'none',
                }}>
                  {active && <span style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'grid', placeItems: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </span>}
                  {/* Wireframe preview */}
                  <div style={{ height: 92, borderRadius: 8, background: 'var(--bg-elev)', border: '1px solid var(--line)', padding: 8, display: 'grid', gap: 6, gridTemplateColumns: cols, overflow: 'hidden', marginBottom: 12 }}>
                    {v === 'A' && <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ height: 16, background: active ? 'var(--accent)' : 'var(--line)', borderRadius: 3, opacity: 0.9 }} />
                        <div style={{ flex: 1, background: 'var(--line-soft)', borderRadius: 3 }} />
                        <div style={{ flex: 1, background: 'var(--line-soft)', borderRadius: 3 }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ flex: 1, background: 'var(--line-soft)', borderRadius: 3 }} />
                        <div style={{ height: 18, background: 'var(--line-soft)', borderRadius: 3 }} />
                      </div>
                    </>}
                    {v === 'B' && <>
                      <div style={{ background: active ? 'color-mix(in oklch, var(--accent) 60%, transparent)' : 'var(--line)', borderRadius: 3, display: 'grid', placeItems: 'center' }}>
                        <span style={{ width: '40%', height: 4, background: 'var(--bg-elev)', borderRadius: 2, display: 'block' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {[1,2,3].map(i => <div key={i} style={{ flex: 1, background: 'var(--line-soft)', borderRadius: 3 }} />)}
                      </div>
                    </>}
                    {v === 'C' && <>
                      <div style={{ background: 'var(--line-soft)', borderRadius: 3 }} />
                      <div style={{ background: active ? 'var(--accent)' : 'var(--line)', borderRadius: 3, opacity: 0.85 }} />
                      <div style={{ background: 'var(--line-soft)', borderRadius: 3 }} />
                    </>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: active ? 'var(--accent)' : 'var(--ink)', fontStyle: 'italic' }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-faint)', marginTop: 2 }}>{sub}</div>
                  <div style={{ marginTop: 10, fontSize: 11, fontStyle: 'italic', color: active ? 'var(--accent)' : 'var(--ink-soft)' }}>— {tag}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 04 Morning Ritual ─────────────────────────────── */}
        <div className="card" style={{ borderRadius: 18, padding: 28, marginBottom: 22, position: 'relative', overflow: 'hidden' }}>
          {/* Sun decoration */}
          <svg aria-hidden width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', right: -24, top: -24, opacity: 0.07, pointerEvents: 'none' }}>
            <circle cx="60" cy="60" r="22" fill="var(--accent)" />
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return <line key={i} x1={60 + Math.cos(a) * 32} y1={60 + Math.sin(a) * 32} x2={60 + Math.cos(a) * 48} y2={60 + Math.sin(a) * 48} stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />;
            })}
          </svg>

          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-faint)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            04 — Morning ritual
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, margin: '8px 0 6px', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            A gentle <em style={{ color: 'var(--accent)' }}>nudge</em> at sunrise.
          </h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, margin: '0 0 24px', maxWidth: 520 }}>
            Receive a calm summary of today&apos;s pending tasks each morning — by email, on WhatsApp, or both.
          </p>

          {/* Channel cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
            {([
              {
                id: 'email' as const,
                on: notifEmailEnabled, set: setNotifEmailEnabled,
                name: 'Email digest', sub: 'lands in your inbox',
                icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>),
              },
              {
                id: 'wa' as const,
                on: notifWaEnabled, set: setNotifWaEnabled,
                name: 'WhatsApp message', sub: 'a single chat ping',
                icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>),
              },
              {
                id: 'call-morning' as const,
                on: notifCallEnabled, set: setNotifCallEnabled,
                name: 'Morning voice call', sub: 'agent reads & edits tasks',
                icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.29 6.29l1.28-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.71 2.01z"/></svg>),
              },
              {
                id: 'call-evening' as const,
                on: notifCallEveningEnabled, set: setNotifCallEveningEnabled,
                name: 'Evening voice call', sub: 'day recap + AI insights',
                icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>),
              },
            ]).map(ch => (
              <button key={ch.id} onClick={() => ch.set(!ch.on)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 18px', borderRadius: 13, textAlign: 'left',
                border: '1px solid ' + (ch.on ? 'var(--accent)' : 'var(--line)'),
                background: ch.on ? 'var(--accent-soft)' : 'var(--bg)',
                cursor: 'pointer', transition: 'all 0.18s',
                boxShadow: ch.on ? 'var(--shadow-sm)' : 'none',
              }}>
                <span style={{ width: 42, height: 42, borderRadius: 11, background: ch.on ? 'var(--accent)' : 'var(--bg-sunk)', color: ch.on ? 'white' : 'var(--ink-soft)', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'all 0.18s' }}>{ch.icon}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 14, color: ch.on ? 'var(--accent)' : 'var(--ink)' }}>{ch.name}</span>
                  <span style={{ display: 'block', fontSize: 11.5, fontStyle: 'italic', color: 'var(--ink-faint)', marginTop: 1 }}>{ch.sub}</span>
                </span>
                <span style={{ width: 38, height: 22, borderRadius: 999, background: ch.on ? 'var(--accent)' : 'var(--bg-sunk)', border: '1px solid ' + (ch.on ? 'var(--accent)' : 'var(--line)'), position: 'relative', transition: 'all 0.2s', flexShrink: 0, display: 'block' }}>
                  <span style={{ position: 'absolute', top: 2, left: ch.on ? 17 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s cubic-bezier(.2,.9,.3,1.2)', display: 'block' }} />
                </span>
              </button>
            ))}
          </div>

          {/* WhatsApp number — collapses */}
          <div style={{ maxHeight: notifWaEnabled ? 120 : 0, opacity: notifWaEnabled ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.3s, opacity 0.3s, margin 0.3s', marginBottom: notifWaEnabled ? 22 : 0 }}>
            <label style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 6, display: 'block' }}>
              WhatsApp number
              <span style={{ color: 'var(--ink-faint)', fontStyle: 'normal', fontSize: 12, fontFamily: 'var(--font-body)', marginLeft: 6 }}>— international format, e.g. 14155552671</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-faint)' }}>+</span>
              <input
                value={notifPhone}
                onChange={e => setNotifPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="14155552671"
                style={{ width: '100%', padding: '11px 90px 11px 28px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)', fontSize: 14, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--line)'; }}
              />
              {notifPhone && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--sage)', background: 'var(--sage-soft)', padding: '3px 7px', borderRadius: 4 }}>● linked</span>}
            </div>
          </div>


          {/* Delivery info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-sunk)', border: '1px solid var(--line-soft)', marginBottom: 22 }}>
            <span style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, var(--butter-soft), var(--terracotta-soft))', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 20 }}>☀</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                Delivered every morning at{' '}
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontStyle: 'italic', color: 'var(--ink)' }}>9:30 am IST</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-faint)', marginTop: 2 }}>custom timing · coming soon</div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--accent)' }}>next: tomorrow</span>
          </div>

          {/* Postcard preview */}
          <details style={{ marginBottom: 20 }}>
            <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-soft)', padding: '8px 0', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>▸</span> preview tomorrow&apos;s note
            </summary>
            <div style={{ marginTop: 10, padding: '18px 22px', borderRadius: 12, background: 'var(--bg)', border: '1px dashed var(--line)', fontFamily: 'var(--font-display)', transform: 'rotate(-0.3deg)' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>tomorrow morning · for {name || 'you'}</div>
              <div style={{ fontSize: 18, lineHeight: 1.5, color: 'var(--ink)' }}>
                Good morning. <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Three small things</span> wait for you today —
                a sketch to finish, a note to send, and a cup of tea to drink slowly. <span style={{ fontStyle: 'italic' }}>No rush.</span>
              </div>
            </div>
          </details>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
            <button onClick={() => { saveNotifPrefs(); setRitualSaved(true); setTimeout(() => setRitualSaved(false), 2000); }} disabled={notifSaving} className="btn btn-primary" style={{ padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 8, opacity: notifSaving ? 0.7 : 1 }}>
              <Icon name="check" size={14} />
              {ritualSaved ? 'Ritual set' : notifSaving ? 'Saving…' : 'Save preferences'}
            </button>
            {ritualSaved && <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: 'var(--accent)' }}>see you at sunrise ✦</span>}
          </div>
        </div>

        {/* ── 05 — Data & Export ───────────────────────────── */}
        <div style={{ borderRadius: 18, border: '1px solid var(--line)', background: 'var(--bg-elev)', padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>05</span>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>Data &amp; Export</h2>
          </div>
          <p style={{ margin: '0 0 22px', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>
            Your data belongs to you — no lock-in. Download everything as a backup or move it to another tool.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* JSON */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(91,143,191,0.1)', border: '1px solid rgba(91,143,191,0.25)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5b8fbf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>JSON</div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>tasks · projects · notes · calendar — full structure</div>
              </div>
              <button
                onClick={exportJSON}
                disabled={exporting !== null}
                style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(91,143,191,0.4)', background: 'rgba(91,143,191,0.08)', color: '#5b8fbf', fontSize: 12, fontWeight: 600, cursor: exporting ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', opacity: exporting ? 0.5 : 1, transition: 'all 0.13s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { if (!exporting) e.currentTarget.style.background = 'rgba(91,143,191,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(91,143,191,0.08)'; }}
              >
                {exporting === 'json' ? 'Exporting…' : '↓ Export'}
              </button>
            </div>

            {/* CSV */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(122,158,126,0.1)', border: '1px solid rgba(122,158,126,0.25)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7a9e7e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>CSV</div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>tasks — spreadsheet-ready</div>
              </div>
              <button
                onClick={exportCSV}
                disabled={exporting !== null}
                style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(122,158,126,0.4)', background: 'rgba(122,158,126,0.08)', color: '#7a9e7e', fontSize: 12, fontWeight: 600, cursor: exporting ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', opacity: exporting ? 0.5 : 1, transition: 'all 0.13s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { if (!exporting) e.currentTarget.style.background = 'rgba(122,158,126,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(122,158,126,0.08)'; }}
              >
                {exporting === 'csv' ? 'Exporting…' : '↓ Export'}
              </button>
            </div>

            {/* Markdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(193,98,63,0.1)', border: '1px solid rgba(193,98,63,0.25)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c1623f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h16M4 12h10M4 18h7"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>Markdown</div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>tasks · projects · notes — human-readable</div>
              </div>
              <button
                onClick={exportMarkdown}
                disabled={exporting !== null}
                style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(193,98,63,0.4)', background: 'rgba(193,98,63,0.08)', color: '#c1623f', fontSize: 12, fontWeight: 600, cursor: exporting ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', opacity: exporting ? 0.5 : 1, transition: 'all 0.13s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { if (!exporting) e.currentTarget.style.background = 'rgba(193,98,63,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(193,98,63,0.08)'; }}
              >
                {exporting === 'md' ? 'Exporting…' : '↓ Export'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Sign out — postcard style ─────────────────────── */}
        <div style={{
          position: 'relative', borderRadius: 14, border: '1px solid var(--line)',
          background: 'var(--bg-elev)', padding: '22px 26px',
          display: 'flex', alignItems: 'center', gap: 18, overflow: 'hidden',
          backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 12px, rgba(120,100,80,0.04) 12px 14px)',
        }}>
          <div style={{ width: 50, height: 50, borderRadius: 12, background: 'var(--bg-sunk)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--ink-soft)', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontStyle: 'italic', letterSpacing: '-0.01em' }}>Step away for a while?</div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>Your tasks, notes, and tea cups will be exactly where you left them.</div>
          </div>
          {signOutConfirm ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Are you sure?</span>
              <button onClick={handleSignOut} style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: 'var(--terracotta)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="logout" size={13} /> Yes, sign out
              </button>
              <button onClick={() => setSignOutConfirm(false)} className="btn" style={{ fontSize: 13 }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setSignOutConfirm(true)} className="btn" style={{ borderColor: 'color-mix(in oklch, var(--terracotta) 30%, transparent)', color: 'var(--terracotta)' }}>
              Sign out
            </button>
          )}
        </div>

        {/* Footer mark */}
        <div style={{ textAlign: 'center', marginTop: 36, paddingTop: 24, borderTop: '1px dashed var(--line)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          slow<span style={{ color: 'var(--accent)' }}>desk</span> · v0.4 · made gently
        </div>

        {/* Photo lightbox */}
        {photoLightbox && avatarUrl && (
          <div onClick={() => setPhotoLightbox(false)} style={{
            position: 'fixed', inset: 0, zIndex: 4000,
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
            display: 'grid', placeItems: 'center', cursor: 'zoom-out',
          }}>
            <img src={avatarUrl} alt="profile photo" style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 16, boxShadow: '0 32px 80px rgba(0,0,0,0.5)', objectFit: 'contain' }} />
          </div>
        )}

        <div style={{ height: 40 }} />

      </div>
    </div>
  );
}
