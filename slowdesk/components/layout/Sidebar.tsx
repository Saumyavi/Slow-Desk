'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Icon, { IconName } from '@/components/ui/Icon';
import { useApp } from '@/lib/store';
import { TONE_COLORS, computeProgress } from '@/lib/data';


const NAV_ITEMS: { id: string; label: string; icon: IconName; href: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/' },
  { id: 'tasks',     label: 'All Tasks', icon: 'list',      href: '/tasks' },
  { id: 'calendar',  label: 'Calendar',  icon: 'calendar',  href: '/calendar' },
  { id: 'habits',    label: 'Habits',    icon: 'habits',    href: '/habits' },
  { id: 'projects',  label: 'Projects',  icon: 'projects',  href: '/projects' },
  { id: 'notes',     label: 'Notes',     icon: 'notes',     href: '/notes' },
];

const BOTTOM_NAV_ITEMS = [
  { id: 'dashboard', label: 'Home',     icon: 'dashboard' as IconName, href: '/' },
  { id: 'tasks',     label: 'Tasks',    icon: 'list'      as IconName, href: '/tasks' },
  { id: 'projects',  label: 'Projects', icon: 'projects'  as IconName, href: '/projects' },
  { id: 'habits',    label: 'Habits',   icon: 'habits'    as IconName, href: '/habits' },
  { id: 'notes',     label: 'Notes',    icon: 'notes'     as IconName, href: '/notes' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebar, user, projects, tasks } = useApp();
  const isIcon = sidebar === 'icon';
  const navRef = useRef<HTMLElement>(null);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'done' | 'error'>('idle');

  async function handleCallNow() {
    setCallState('calling');
    try {
      const res = await fetch('/api/voice/request-call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'morning' }) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Call failed:', data.error);
        setCallState('error');
      } else {
        setCallState('done');
      }
    } catch {
      setCallState('error');
    }
    setTimeout(() => setCallState('idle'), 4000);
  }

  useEffect(() => {
    if (!navRef.current) return;
    const items = navRef.current.querySelectorAll('.nav-item');
    gsap.fromTo(items,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: 'power2.out', clearProps: 'all' }
    );
  }, []);

  return (
    <>
    <aside className={`sidebar ${isIcon ? 'icon' : ''}`} ref={navRef}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <div className="brand" style={{ cursor: 'pointer' }}>
          <div className="brand-mark">s</div>
          {!isIcon && <div className="brand-name">slow<em>desk</em></div>}
        </div>
      </Link>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.id} href={item.href} style={{ textDecoration: 'none' }}>
              <button className={`nav-item ${active ? 'active' : ''}`}>
                <Icon name={item.icon} />
                <span className="label">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </nav>

      {!isIcon && (
        <>
          <Link href="/projects" style={{ textDecoration: 'none' }}>
            <div className="nav-section-label" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseLeave={e => (e.currentTarget.style.color = '')}
            >
              Projects · {projects.length}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginLeft: 2 }}>
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {projects.slice(0, 3).map(p => (
              <Link key={p.id} href="/projects" style={{ textDecoration: 'none' }}>
                <div className="fav-row" style={{ cursor: 'pointer' }}>
                  <div className="fav-chip" style={{ background: TONE_COLORS[p.tone] }}>
                    {p.short[0].toLowerCase()}
                  </div>
                  <div className="fav-meta" style={{ flex: 1, minWidth: 0 }}>
                    <div className="t" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div className="s">{tasks.filter(t => t.project === p.name).length} tasks · {computeProgress(tasks.filter(t => t.project === p.name))}%</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="nav-section-label">Workspace</div>
          <div className="fav-row" style={{ borderRadius: 8, cursor: 'pointer' }}
            onClick={() => router.push('/profile')}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-sunk)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="fav-chip" style={{ background: 'var(--accent)', fontSize: 16 }}>
              {user?.name?.[0]?.toUpperCase() ?? 'S'}
            </div>
            <div className="fav-meta">
              <div className="t">{user?.name ? `${user.name}'s Studio` : 'My Studio'}</div>
            </div>
          </div>

          <div style={{ flex: 1 }} />
          <button
            onClick={handleCallNow}
            disabled={callState === 'calling'}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '9px 12px', borderRadius: 8, border: '1px solid var(--line)',
              background: callState === 'done' ? 'var(--accent)' : callState === 'error' ? 'var(--bg-sunk)' : 'transparent',
              color: callState === 'done' ? '#fff' : callState === 'error' ? 'var(--ink-faint)' : 'var(--ink)',
              cursor: callState === 'calling' ? 'not-allowed' : 'pointer',
              fontSize: 12, fontFamily: 'var(--font-mono)', opacity: callState === 'calling' ? 0.6 : 1,
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .93h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
            </svg>
            {callState === 'calling' ? 'Calling…' : callState === 'done' ? 'Call placed!' : callState === 'error' ? 'Failed — retry?' : 'Call me now'}
          </button>
          <div className="card" style={{ marginTop: 8, background: 'var(--bg-sunk)', border: '1px dashed var(--line)', textAlign: 'center', padding: 14 }}>
            <div className="serif" style={{ fontSize: 16, marginBottom: 4 }}>Take a breath.</div>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>4 · 7 · 8 method</div>
          </div>
        </>
      )}
    </aside>

    {/* ── Mobile bottom navigation ── */}
    <nav className="bottom-nav">
      {BOTTOM_NAV_ITEMS.map(item => {
        const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link key={item.id} href={item.href} className={`bottom-nav-item ${active ? 'active' : ''}`}>
            <Icon name={item.icon} size={20} />
            {item.label}
          </Link>
        );
      })}
    </nav>
    </>
  );
}
