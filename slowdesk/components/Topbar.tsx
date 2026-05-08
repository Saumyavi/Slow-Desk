'use client';
import { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { createClient } from '@/lib/supabase/client';
import Icon, { IconName } from './Icon';
import { useApp } from '@/lib/store';
import { HABITS, Note } from '@/lib/data';
import * as db from '@/lib/supabase/db';

/* ── Search modal ────────────────────────────────────────── */
function ResultGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-faint)', padding: '8px 18px 4px' }}>{label}</div>
      {children}
    </div>
  );
}

function ResultItem({ icon, title, subtitle, faded, onClick }: {
  icon: IconName; title: string; subtitle?: string; faded?: boolean; onClick: () => void;
}) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px',
      cursor: 'pointer', transition: 'background 0.1s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-sunk)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <Icon name={icon} size={14} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: faded ? 'var(--ink-faint)' : 'var(--ink)',
          textDecoration: faded ? 'line-through' : 'none',
        }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>
        )}
      </div>
    </div>
  );
}

function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const inputRef   = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);
  const router     = useRouter();
  const { tasks: storeTasks, projects: storeProjects } = useApp();

  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.15 });
    gsap.fromTo(panelRef.current,
      { y: -14, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 0.22, ease: 'power3.out' }
    );
    setTimeout(() => inputRef.current?.focus(), 30);

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const n = await db.getNotes(user.id);
      setNotes(n);
    });
  }, []);

  const close = useCallback(() => {
    gsap.to(panelRef.current,   { y: -8, opacity: 0, scale: 0.97, duration: 0.14 });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.15, onComplete: onClose });
  }, [onClose]);

  const navigate = useCallback((href: string) => {
    router.push(href);
    close();
  }, [router, close]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [close]);

  const q = query.toLowerCase().trim();

  const tasks    = q ? storeTasks.filter(t => t.title.toLowerCase().includes(q) || t.project.toLowerCase().includes(q)).slice(0, 4) : [];
  const projects = q ? storeProjects.filter(p => p.name.toLowerCase().includes(q)).slice(0, 3) : [];
  const habits   = q ? HABITS.filter(h => h.name.toLowerCase().includes(q)).slice(0, 3) : [];
  const filteredNotes = q ? notes.filter(n => n.title.toLowerCase().includes(q) || n.preview.toLowerCase().includes(q)).slice(0, 3) : [];
  const hasResults = tasks.length + projects.length + habits.length + filteredNotes.length > 0;

  const quickLinks: { icon: IconName; label: string; href: string }[] = [
    { icon: 'list',      label: 'All Tasks',   href: '/tasks' },
    { icon: 'calendar',  label: 'Calendar',    href: '/calendar' },
    { icon: 'habits',    label: 'Habits',      href: '/habits' },
    { icon: 'projects',  label: 'Projects',    href: '/projects' },
    { icon: 'notes',     label: 'Notes',       href: '/notes' },
  ];

  return (
    <div ref={overlayRef} onClick={e => e.target === overlayRef.current && close()} style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '12vh',
    }}>
      <div ref={panelRef} style={{
        width: 560, background: 'var(--bg-elev)', borderRadius: 16,
        boxShadow: '0 32px 80px rgba(0,0,0,0.22)', border: '1px solid var(--line)',
        overflow: 'hidden',
      }}>
        {/* input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', borderBottom: '1px solid var(--line)' }}>
          <Icon name="search" size={16} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks, notes, projects…"
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 15, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-sans)',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ display: 'grid', placeItems: 'center', color: 'var(--ink-faint)', padding: 2 }}>
              <Icon name="x" size={14} />
            </button>
          )}
          <span style={{
            fontSize: 10, fontFamily: 'var(--font-mono)', background: 'var(--bg-sunk)',
            padding: '2px 6px', borderRadius: 4, color: 'var(--ink-faint)', flexShrink: 0,
          }}>Esc</span>
        </div>

        {/* results body */}
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '6px 0' }}>

          {/* no query → quick nav */}
          {!q && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-faint)', padding: '6px 18px 4px' }}>Quick navigate</div>
              {quickLinks.map(l => (
                <ResultItem key={l.href} icon={l.icon} title={l.label} onClick={() => navigate(l.href)} />
              ))}
            </div>
          )}

          {/* query with no matches */}
          {q && !hasResults && (
            <div style={{ padding: '28px 18px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13, fontStyle: 'italic' }}>
              No results for "{query}"
            </div>
          )}

          {tasks.length > 0 && (
            <ResultGroup label="Tasks">
              {tasks.map(t => (
                <ResultItem key={t.id} icon="list" title={t.title} subtitle={t.project} faded={t.done} onClick={() => navigate('/tasks')} />
              ))}
            </ResultGroup>
          )}

          {filteredNotes.length > 0 && (
            <ResultGroup label="Notes">
              {filteredNotes.map(n => (
                <ResultItem key={n.id} icon="notes" title={n.title} subtitle={n.preview.slice(0, 72)} onClick={() => navigate('/notes?noteId=' + n.id)} />
              ))}
            </ResultGroup>
          )}

          {projects.length > 0 && (
            <ResultGroup label="Projects">
              {projects.map(p => (
                <ResultItem key={p.id} icon="projects" title={p.name} subtitle={`due ${p.due}`} onClick={() => navigate('/projects')} />
              ))}
            </ResultGroup>
          )}

          {habits.length > 0 && (
            <ResultGroup label="Habits">
              {habits.map(h => (
                <ResultItem key={h.id} icon="habits" title={`${h.emoji} ${h.name}`} subtitle={`${h.goal} · ${h.streak}d streak`} onClick={() => navigate('/habits')} />
              ))}
            </ResultGroup>
          )}
        </div>

        {/* footer hints */}
        <div style={{ display: 'flex', gap: 16, padding: '8px 18px', borderTop: '1px solid var(--line)' }}>
          {['↵ open', 'Esc close'].map(hint => (
            <span key={hint} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)' }}>{hint}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Notification dropdown ───────────────────────────────── */
function relativeNotifTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function NotifDropdown({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, markAllRead, dismissNotification } = useApp();

  const unread  = notifications.filter(n => !n.readAt);
  const visible = notifications.slice(0, 20);

  useEffect(() => {
    gsap.fromTo(ref.current, { y: -8, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.18, ease: 'power2.out' });
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
      width: 320, background: 'var(--bg-elev)',
      border: '1px solid var(--line)', borderRadius: 14,
      boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
      overflow: 'hidden', zIndex: 500,
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px 10px', borderBottom: '1px solid var(--line)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
          Notifications
          {unread.length > 0 && (
            <span style={{
              marginLeft: 8, fontSize: 10, fontWeight: 700,
              background: 'var(--accent)', color: '#fff',
              borderRadius: 10, padding: '1px 7px',
            }}>{unread.length}</span>
          )}
        </span>
        {unread.length > 0 && (
          <button onClick={markAllRead} style={{
            fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none',
            cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500,
          }}>Mark all read</button>
        )}
      </div>

      {/* items */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {visible.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 12, fontStyle: 'italic' }}>
            All caught up — no notifications
          </div>
        )}

        {visible.map(n => {
          const isRead = !!n.readAt;
          return (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
              borderBottom: '1px solid var(--line-soft)', transition: 'background 0.12s',
              background: isRead ? 'transparent' : 'rgba(193,98,63,0.04)',
              opacity: isRead ? 0.6 : 1,
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-sunk)')}
              onMouseLeave={e => (e.currentTarget.style.background = isRead ? 'transparent' : 'rgba(193,98,63,0.04)')}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: n.color + '20', display: 'grid', placeItems: 'center', color: n.color,
              }}>
                <Icon name={n.icon as IconName} size={13} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, lineHeight: 1.45,
                  color: isRead ? 'var(--ink-faint)' : 'var(--ink)',
                  fontWeight: isRead ? 400 : 500,
                  textDecoration: isRead ? 'line-through' : 'none',
                  textDecorationColor: 'var(--ink-faint)',
                }}>{n.text}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                  {relativeNotifTime(n.createdAt)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {!isRead && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
                )}
                <button
                  onClick={() => dismissNotification(n.id)}
                  title="Dismiss"
                  style={{
                    width: 18, height: 18, borderRadius: 4, border: 'none', background: 'transparent',
                    cursor: 'pointer', display: 'grid', placeItems: 'center',
                    color: 'var(--ink-faint)', transition: 'color 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-faint)')}
                >
                  <Icon name="x" size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '8px 16px', borderTop: '1px solid var(--line)', textAlign: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
          {unread.length > 0 ? `${unread.length} unread` : 'no unread notifications'}
        </span>
      </div>
    </div>
  );
}

/* ── Topbar ──────────────────────────────────────────────── */
interface TopbarProps {
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
}

export default function Topbar({ title, subtitle, action }: TopbarProps) {
  const { user, notifications } = useApp();
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const menuRef  = useRef<HTMLDivElement>(null);
  const searchBtnRef = useRef<HTMLButtonElement>(null);

  /* ⌘K / Ctrl+K opens search */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  /* avatar dropdown close-on-outside */
  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuRef.current || !menuOpen) return;
    gsap.fromTo(menuRef.current,
      { y: -8, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.18, ease: 'power2.out' }
    );
  }, [menuOpen]);

  const initial = user?.name?.[0]?.toUpperCase() ?? 'S';
  const unreadCount = notifications.filter(n => !n.readAt).length;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return;
      const { data } = await supabase.from('user_profiles').select('avatar_url').eq('id', u.id).single();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    });
  }, []);

  return (
    <>
      <div className="topbar">
        {/* title + subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 className="page-title serif" style={{ margin: 0, lineHeight: 1.1 }}>{title}</h1>
          {subtitle && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* search trigger — looks like a box, opens modal on click */}
        <button
          ref={searchBtnRef}
          onClick={() => setSearchOpen(true)}
          className="search-box"
          style={{ cursor: 'pointer', textAlign: 'left', background: 'var(--bg-elev)' }}
        >
          <Icon name="search" size={14} />
          <span style={{ flex: 1, color: 'var(--ink-faint)', fontSize: 13, userSelect: 'none' }}>Search anything…</span>
          <span className="kbd">⌘K</span>
        </button>

        {/* action button or default */}
        {action ?? (
          <button className="btn btn-primary">
            <Icon name="plus" size={14} /> New task
          </button>
        )}

        {/* notification bell */}
        <div style={{ position: 'relative' }}>
          <button className="icon-btn" onClick={() => { setNotifOpen(o => !o); setMenuOpen(false); }}>
            <Icon name="bell" size={16} />
            {unreadCount > 0 && <span className="dot" />}
          </button>
          {notifOpen && <NotifDropdown onClose={() => setNotifOpen(false)} />}
        </div>

        {/* avatar + user dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            className="avatar-me"
            onClick={() => { setMenuOpen(o => !o); setNotifOpen(false); }}
            style={{ cursor: 'pointer', userSelect: 'none', overflow: avatarUrl ? 'hidden' : undefined, padding: avatarUrl ? 0 : undefined }}
            title={user?.name}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt={user?.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : initial}
          </div>
          {menuOpen && (
            <div ref={menuRef} style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 220, background: 'var(--bg-elev)',
              border: '1px solid var(--line)', borderRadius: 12,
              boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
              overflow: 'hidden', zIndex: 500,
            }}>
              <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user?.name ?? ''} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--line)' }} />
                ) : (
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>{initial}</div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                </div>
              </div>
              <button onClick={() => { setMenuOpen(false); router.push('/profile'); }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', border: 'none', background: 'none',
                cursor: 'pointer', color: 'var(--ink)', fontSize: 13, fontWeight: 500,
                fontFamily: 'var(--font-sans)', textAlign: 'left',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-sunk)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <Icon name="user" size={14} /> View profile
              </button>
              <div style={{ height: 1, background: 'var(--line)', margin: '0 14px' }} />
              <button onClick={() => { setMenuOpen(false); handleSignOut(); }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', border: 'none', background: 'none',
                cursor: 'pointer', color: '#e05c3c', fontSize: 13, fontWeight: 500,
                fontFamily: 'var(--font-sans)', textAlign: 'left',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(224,92,60,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <Icon name="logout" size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* search modal rendered at root level */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
