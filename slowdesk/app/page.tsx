'use client';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/lib/store';
import { TONE_COLORS, Task, computeProgress } from '@/lib/data';
import * as db from '@/lib/supabase/db';
import Topbar from '@/components/Topbar';
import DeskScene from '@/components/DeskScene';
import Icon from '@/components/Icon';
import TaskModal from '@/components/TaskModal';
import LandingPage from '@/components/LandingPage';

/* ── Greeting card ─────────────────────────────────────────── */
function GreetingCard({ tasks }: { tasks: Task[] }) {
  const { mood, setMood, quote, fireConfetti, user, completions } = useApp();
  const cardRef = useRef<HTMLDivElement>(null);
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');
  const MOODS = ['😌','😊','😐','😩','🔥'];

  useEffect(() => {
    const now = new Date();
    const h = now.getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    setDateStr(now.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase());
  }, []);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', delay: 0.05 });
  }, []);

  const todayCount  = tasks.filter(t => t.due === 'today' && !t.done).length;
  const doneCount   = tasks.filter(t => t.done).length;
  const streak      = useMemo(() => {
    const base = new Date();
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if ((completions[key] ?? 0) > 0) count++;
      else break;
    }
    return count;
  }, [completions]);

  return (
    <div ref={cardRef} className="greeting-card card" style={{ position: 'relative', overflow: 'hidden', minHeight: 160 }}>
      <DeskScene />
      <div className="greeting-scrim" />

      {/* left text */}
      <div className="greeting-inner" style={{ position: 'relative', zIndex: 2, padding: '18px 24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            {dateStr}
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 400, color: '#fff', marginBottom: 6, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
            {greeting}{greeting && ','}{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)' }}>{user?.name ?? 'Friend'}</em>{' '}
            <span style={{ fontSize: 24 }}>👋</span>
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', maxWidth: 340, lineHeight: 1.6, marginBottom: 16, fontStyle: 'italic' }}>
            "{quote}"
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { label: `${todayCount} tasks today` },
              { label: `${doneCount} this month` },
              { label: `🔥 ${streak} day streak` },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                borderRadius: 20, padding: '4px 12px',
                fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.2)',
              }}>{s.label}</div>
            ))}
          </div>
        </div>

        {/* mood checker */}
        <div style={{
          background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)',
          borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.2)',
          flexShrink: 0, marginLeft: 20,
        }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, textAlign: 'center' }}>
            Mood check
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {MOODS.map(m => (
              <button key={m} onClick={() => { setMood(m); if (m === '🔥') fireConfetti(); }} style={{
                width: 36, height: 36, borderRadius: 10, fontSize: 18, cursor: 'pointer',
                border: mood === m ? '2px solid rgba(255,255,255,0.8)' : '2px solid transparent',
                background: mood === m ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                display: 'grid', placeItems: 'center', transition: 'all 0.15s',
              }}>{m}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Today task row ─────────────────────────────────────────── */
function TodayRow({ task, onToggle, onDragStart, onDragOver, onDrop, onEdit, onDelete, projectColor }: {
  task: Task; projectColor: string;
  onToggle:(id:string)=>void; onDragStart:(id:string)=>void;
  onDragOver:(e:React.DragEvent)=>void; onDrop:(id:string)=>void;
  onEdit:(t:Task)=>void; onDelete:(id:string)=>void;
}) {
  const rowRef  = useRef<HTMLDivElement>(null);
  const chkRef  = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menu]);

  const toggle = () => {
    if (!task.done && chkRef.current)
      gsap.timeline().to(chkRef.current, { scale: 1.35, duration: 0.1 }).to(chkRef.current, { scale: 1, duration: 0.2, ease: 'elastic.out(1.2,0.5)' });
    onToggle(task.id);
  };

  const del = () => {
    if (!rowRef.current) return onDelete(task.id);
    gsap.to(rowRef.current, { x: 20, opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0,
      duration: 0.2, ease: 'power2.in', onComplete: () => onDelete(task.id) });
  };

  return (
    <div ref={rowRef} draggable
      onDragStart={() => onDragStart(task.id)} onDragOver={onDragOver} onDrop={() => onDrop(task.id)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        borderRadius: 10, background: 'var(--bg-elev)', border: '1px solid var(--line)',
        transition: 'border-color 0.14s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(193,98,63,0.22)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}
    >
      <button ref={chkRef} onClick={toggle} style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
        border: task.done ? 'none' : '1.5px solid var(--ink-faint)',
        background: task.done ? 'var(--accent)' : 'transparent',
        display: 'grid', placeItems: 'center', transition: 'all 0.14s',
      }}>
        {task.done && <Icon name="check" size={9} style={{ color: '#fff' }} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500,
          color: task.done ? 'var(--ink-faint)' : 'var(--ink)',
          textDecoration: task.done ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{task.title}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 2, alignItems: 'center' }}>
          {task.time && task.time !== '—' && (
            <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{task.time}</span>
          )}
          {task.attach > 0 && (
            <span style={{ fontSize: 11, color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icon name="paperclip" size={10} />{task.attach}
            </span>
          )}
        </div>
      </div>

      {/* project chip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 20, flexShrink: 0,
        background: projectColor + '15', border: `1px solid ${projectColor}35`,
        fontSize: 11, fontWeight: 500, color: 'var(--ink-soft)', maxWidth: 150,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: projectColor, flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.project || 'Inbox'}</span>
      </div>

      {/* three-dot menu */}
      <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button onClick={() => setMenu(m => !m)} style={{
          width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
          background: menu ? 'var(--bg-sunk)' : 'transparent',
          color: 'var(--ink-faint)', display: 'grid', placeItems: 'center', transition: 'all 0.12s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-sunk)')}
          onMouseLeave={e => { if (!menu) e.currentTarget.style.background = 'transparent'; }}
        ><Icon name="more" size={14} /></button>
        {menu && (
          <div style={{
            position: 'absolute', right: 0, top: 32, zIndex: 200,
            background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8,
            padding: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', minWidth: 120,
          }}>
            {[
              { label: 'Edit', icon: 'edit' as const, action: () => { onEdit(task); setMenu(false); } },
              { label: 'Delete', icon: 'trash' as const, action: () => { del(); setMenu(false); }, danger: true },
            ].map(item => (
              <button key={item.label} onClick={item.action} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 10px', borderRadius: 6, border: 'none', background: 'transparent',
                cursor: 'pointer', fontSize: 12, color: item.danger ? '#e05c3c' : 'var(--ink)',
                fontFamily: 'var(--font-sans)', textAlign: 'left',
              }}
                onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'rgba(224,92,60,0.08)' : 'var(--bg-sunk)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              ><Icon name={item.icon} size={12} />{item.label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const ACCENT_HEX: Record<string, string> = {
  terracotta: '#c1623f', sage: '#7a9e7e', plum: '#8b5c75',
  butter: '#c9943a', sky: '#5b8fbf', ink: '#2a2420',
};

/* ── Week Gantt ─────────────────────────────────────────────── */
function WeekGantt({ weekOffset }: { weekOffset: number }) {
  const { tasks, calendarEvents, accent } = useApp();
  const accentHex = ACCENT_HEX[accent] ?? '#c1623f';
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [todayIdx, setTodayIdx] = useState(2);

  useEffect(() => {
    const now = new Date();
    const days = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - 2 + i + weekOffset * 7);
      return d;
    });
    setWeekDays(days);
    const ti = days.findIndex(d => d.toDateString() === new Date().toDateString());
    setTodayIdx(ti >= 0 ? ti : -1);
  }, [weekOffset]);

  if (!weekDays.length) return <div style={{ height: 80 }} />;

  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  // Build bar rows: tasks first so manual tasks are always visible
  const bars: { label: string; color: string; start: number; end: number }[] = [];

  // tasks by due date (added first to guarantee visibility)
  tasks.forEach(t => {
    let colIdx = -1;
    if (t.due === 'today') colIdx = todayIdx;
    else if (t.due === 'tomorrow') colIdx = todayIdx + 1;
    if (colIdx >= 0 && colIdx < 5) {
      const projColor = TONE_COLORS[t.tone] || 'var(--accent)';
      bars.push({ label: t.title, color: projColor, start: colIdx, end: colIdx + 1 });
    }
  });

  // calendar events → single-day bars
  calendarEvents.forEach(ev => {
    const evDate = new Date(ev.year, ev.month, ev.day);
    const idx = weekDays.findIndex(d => d.toDateString() === evDate.toDateString());
    if (idx >= 0)
      bars.push({ label: ev.title, color: ev.color, start: idx, end: idx + 1 });
  });

  const visibleBars = bars.slice(0, 10);

  return (
    <div className="gantt-scroll">
    <div style={{ position: 'relative', minWidth: 400 }}>
      {/* column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 8 }}>
        {weekDays.map((d, i) => {
          const isToday = i === todayIdx;
          return (
            <div key={i} style={{ textAlign: 'center', paddingBottom: 6 }}>
              <div style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: isToday ? 'var(--accent)' : 'var(--ink-faint)',
                letterSpacing: '0.06em',
              }}>
                {MONTHS[d.getMonth()]} {d.getDate()}
                {isToday && (
                  <span style={{
                    marginLeft: 5, fontSize: 8, background: 'var(--accent)',
                    color: '#fff', borderRadius: 4, padding: '1px 5px', fontWeight: 700,
                  }}>TODAY</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* bars area */}
      <div style={{ position: 'relative', minHeight: visibleBars.length * 34 + 8 }}>
        {/* today line */}
        {todayIdx >= 0 && (
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${(todayIdx / 5) * 100 + 10}%`,
            width: 2, background: accentHex, zIndex: 10, borderRadius: 1, opacity: 0.7,
          }} />
        )}

        {/* grid columns (background) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', position: 'absolute', inset: 0, gap: 4 }}>
          {weekDays.map((_, i) => (
            <div key={i} style={{
              background: i === todayIdx ? `${accentHex}0A` : 'transparent',
              borderRadius: 6,
            }} />
          ))}
        </div>

        {/* bars */}
        {visibleBars.map((bar, rowIdx) => (
          <div key={rowIdx} style={{
            position: 'absolute',
            top: rowIdx * 34,
            left: `${(bar.start / 5) * 100 + 1}%`,
            width: `${((bar.end - bar.start) / 5) * 100 - 2}%`,
            height: 28, borderRadius: 6,
            background: bar.color + '28',
            border: `1px solid ${bar.color}55`,
            display: 'flex', alignItems: 'center', padding: '0 10px',
            overflow: 'hidden',
          }}>
            <span style={{
              fontSize: 11, fontWeight: 500, color: bar.color,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{bar.label}</span>
          </div>
        ))}

        {visibleBars.length === 0 && (
          <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
            No tasks or events this week
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

/* ── Task overview donut ────────────────────────────────────── */
function TaskOverview({ tasks }: { tasks: Task[] }) {
  const ringRef = useRef<SVGCircleElement>(null);

  const total    = tasks.length;
  const done     = tasks.filter(t => t.done).length;
  const pending  = total - done;
  const highPri  = tasks.filter(t => t.priority === 'high' && !t.done).length;
  const dueToday = tasks.filter(t => t.due === 'today' && !t.done).length;
  const pct      = total ? Math.round((done / total) * 100) : 0;

  const R = 52, STROKE = 10;
  const circ = 2 * Math.PI * R;
  const dash  = total ? (done / total) * circ : 0;

  useEffect(() => {
    if (!ringRef.current) return;
    gsap.fromTo(ringRef.current,
      { strokeDashoffset: circ },
      { strokeDashoffset: circ - dash, duration: 1.1, ease: 'power2.out', delay: 0.2 }
    );
  }, [dash, circ]);

  const stats = [
    { label: 'Total tasks',   value: total,    color: 'var(--ink-soft)' },
    { label: 'Completed',     value: done,      color: '#7a9e7e' },
    { label: 'High priority', value: highPri,   color: '#c1623f' },
    { label: 'Due today',     value: dueToday,  color: '#c9943a' },
  ];

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
        Task overview
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* donut ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
            {/* track */}
            <circle cx={60} cy={60} r={R} fill="none"
              stroke="var(--line)" strokeWidth={STROKE} />
            {/* progress */}
            <circle ref={ringRef} cx={60} cy={60} r={R} fill="none"
              stroke="var(--accent)" strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{pct}%</span>
            <span style={{ fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>done</span>
          </div>
        </div>

        {/* stats list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stats.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{s.label}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* pending summary */}
      {pending > 0 && (
        <div style={{
          marginTop: 14, padding: '8px 12px', borderRadius: 8,
          background: 'var(--bg-sunk)', border: '1px solid var(--line)',
          fontSize: 12, color: 'var(--ink-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{pending} task{pending !== 1 ? 's' : ''} still pending</span>
          <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
            {dueToday} due today
          </span>
        </div>
      )}
      {total === 0 && (
        <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
          Add tasks to see your progress
        </div>
      )}
    </div>
  );
}

/* ── This month heatmap (habit activity) ────────────────────── */
function ThisMonth() {
  const { accent, user } = useApp();
  const accentHex = ACCENT_HEX[accent] ?? '#c1623f';
  const cellRefs  = useRef<(HTMLDivElement | null)[]>([]);

  const now          = new Date();
  const year         = now.getFullYear();
  const month        = now.getMonth();
  const todayDate    = now.getDate();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const totalCells   = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const monthKey     = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Read habit history from Supabase
  const [dayCounts,   setDayCounts]   = useState<Record<string, number>>({});
  const [totalHabits, setTotalHabits] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      try {
        const habits = await db.getHabits(user.id);
        setTotalHabits(habits.length);
        const counts: Record<string, number> = {};
        habits.forEach(h => {
          (h.history ?? []).forEach((date: string) => {
            if (date.startsWith(monthKey)) {
              counts[date] = (counts[date] ?? 0) + 1;
            }
          });
        });
        setDayCounts(counts);
      } catch (err) {
        console.error('Failed to load habits:', err);
      }
    });
  }, [user?.email, monthKey]);

  useEffect(() => {
    const els = cellRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;
    gsap.fromTo(els,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, stagger: 0.008, duration: 0.25, ease: 'back.out(1.4)', delay: 0.15 }
    );
  }, []);

  // Color based on ratio of habits logged vs total habits that day
  const ratioToColor = (count: number) => {
    if (count === 0 || totalHabits === 0) return 'transparent';
    const r = count / totalHabits;
    if (r <= 0.25) return `${accentHex}40`;
    if (r <= 0.5)  return `${accentHex}73`;
    if (r <= 0.75) return `${accentHex}AD`;
    return `${accentHex}E6`;
  };

  type Cell = { dayNum: number; count: number; isToday: boolean } | null;
  const cells: Cell[] = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - firstWeekday + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    const dateKey = `${monthKey}-${String(dayNum).padStart(2, '0')}`;
    return { dayNum, count: dayCounts[dateKey] ?? 0, isToday: dayNum === todayDate };
  });

  const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const WEEKDAYS = ['S','M','T','W','T','F','S'];

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Habit activity
        </span>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>
          {MONTHS[month].slice(0, 3)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
          {dayCounts[`${monthKey}-${String(todayDate).padStart(2, '0')}`] ?? 0}
          <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink-soft)', marginLeft: 6 }}>
            of {totalHabits} done today
          </span>
        </span>
      </div>

      {/* Day-of-week header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
        {WEEKDAYS.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)', fontWeight: 600 }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((cell, i) => (
          <div
            key={i}
            ref={el => { cellRefs.current[i] = el; }}
            title={cell
              ? `${MONTHS[month].slice(0, 3)} ${cell.dayNum}: ${cell.count} of ${totalHabits} habit${totalHabits !== 1 ? 's' : ''}`
              : undefined}
            style={{
              aspectRatio: '1', borderRadius: 4, opacity: 0,
              background: cell ? ratioToColor(cell.count) : 'transparent',
              border: cell
                ? cell.isToday
                  ? `1.5px solid ${accentHex}80`
                  : '1.5px solid var(--line)'
                : 'none',
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10 }}>
        <span style={{ fontSize: 9, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>0%</span>
        {[0.15, 0.35, 0.6, 0.9].map((r, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: 2,
            background: totalHabits > 0 ? ratioToColor(Math.ceil(r * totalHabits)) : `${accentHex}${['40','73','AD','E6'][i]}`,
            border: '1px solid var(--line)',
          }} />
        ))}
        <span style={{ fontSize: 9, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>100%</span>
      </div>
    </div>
  );
}

function isScheduledToday(goal: string): boolean {
  const day = new Date().getDay(); // 0=Sun,1=Mon,...,6=Sat
  switch (goal) {
    case 'daily':    return true;
    case 'weekdays': return day >= 1 && day <= 5;
    case 'weekends': return day === 0 || day === 6;
    case '5/wk':     return day >= 1 && day <= 5;
    case '3/wk':     return day === 1 || day === 3 || day === 5; // Mon/Wed/Fri
    default:         return true;
  }
}

/* ── Today's habits ─────────────────────────────────────────── */
function TodayHabits() {
  const { user } = useApp();
  const router = useRouter();
  const [habits, setHabits] = useState<{ id: string; name: string; emoji: string; color: string; done: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { setLoading(false); return; }
      try {
        const data = await db.getHabits(u.id);
        setHabits(
          data
            .filter((h: { goal: string }) => isScheduledToday(h.goal))
            .map((h: { id: string; name: string; emoji: string; color: string; history: string[] }) => ({
              id: h.id, name: h.name, emoji: h.emoji, color: h.color,
              done: (h.history ?? []).includes(today),
            }))
        );
      } catch { /* silent */ }
      setLoading(false);
    });
  }, [user?.email, today]);

  const toggle = async (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h));
    try { await db.toggleHabitDate(id, today); } catch {
      setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h));
    }
  };

  const pending  = habits.filter(h => !h.done);
  const doneCount = habits.filter(h => h.done).length;
  const pct = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', flex: 1 }}>
          Today's habits
        </span>
        {habits.length > 0 && (
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700 }}>
            {doneCount}/{habits.length} · {pct}%
          </span>
        )}
        <button onClick={() => router.push('/habits')} style={{
          marginLeft: 10, background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6,
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-faint)')}
          title="View all habits"
        ><Icon name="list" size={14} /></button>
      </div>

      {/* progress bar */}
      {habits.length > 0 && (
        <div style={{ height: 4, borderRadius: 2, background: 'var(--line)', marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.4s ease' }} />
        </div>
      )}

      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic', padding: '8px 0' }}>Loading…</div>
      ) : habits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
          No habits yet —{' '}
          <button onClick={() => router.push('/habits')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12, padding: 0, fontFamily: 'var(--font-sans)' }}>
            add one
          </button>
        </div>
      ) : pending.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(122,158,126,0.1)', border: '1px solid rgba(122,158,126,0.3)' }}>
          <span style={{ fontSize: 20 }}>🎉</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#7a9e7e' }}>All done!</div>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>All {habits.length} habits completed today</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {habits.map(h => (
            <div key={h.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              background: h.done ? 'var(--bg-sunk)' : 'var(--bg-elev)',
              border: `1px solid ${h.done ? 'var(--line)' : h.color + '35'}`,
              transition: 'all 0.15s',
            }}>
              <button onClick={() => toggle(h.id)} style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                border: h.done ? 'none' : `2px solid ${h.color}60`,
                background: h.done ? h.color : 'transparent',
                display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {h.done && <Icon name="check" size={11} style={{ color: '#fff' }} />}
              </button>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{h.emoji}</span>
              <span style={{
                flex: 1, fontSize: 13, fontWeight: 500,
                color: h.done ? 'var(--ink-faint)' : 'var(--ink)',
                textDecoration: h.done ? 'line-through' : 'none',
                transition: 'all 0.15s',
              }}>{h.name}</span>
              {h.done && <Icon name="check" size={11} style={{ color: h.color, flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Active projects 2×2 grid ───────────────────────────────── */
function ActiveProjects() {
  const { projects, tasks } = useApp();
  const router = useRouter();
  const barRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    barRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.out', delay: 0.3 + i * 0.06, transformOrigin: 'left' });
    });
  }, [projects.length]);

  if (!projects.length) {
    return (
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Active projects</div>
        <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
          No projects yet
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Active projects</span>
        <button onClick={() => router.push('/projects')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6,
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-faint)')}
          title="View all projects"
        ><Icon name="list" size={14} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minWidth: 0 }}>
        {projects.slice(0, 4).map((p, i) => {
          const pt = tasks.filter(t => t.project === p.name);
          const prog = computeProgress(pt);
          const color = TONE_COLORS[p.tone];
          return (
            <div key={p.id} style={{
              padding: '12px', borderRadius: 12, minWidth: 0, overflow: 'hidden',
              background: 'var(--bg-sunk)', border: '1px solid var(--line)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, minWidth: 0 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: color, display: 'grid', placeItems: 'center',
                  fontSize: 13, color: '#fff', fontWeight: 700,
                }}>
                  {p.short[0].toLowerCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 1 }}>{pt.length} tasks · <span style={{ fontWeight: 600, color }}>{prog}%</span></div>
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: 'var(--line)', overflow: 'hidden' }}>
                <i ref={el => { barRefs.current[i] = el; }} style={{
                  display: 'block', height: '100%', width: `${prog}%`,
                  background: color, borderRadius: 2,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Weekly retrospective widget ───────────────────────────── */
function WeeklyRetro() {
  const [insight, setInsight] = useState('');
  const [stats, setStats] = useState<{ completedTasks: number; totalTasks: number; completionRate: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/retrospective/me');
      const data = await res.json();
      setInsight(data.insight ?? 'Could not generate insight. Please try again.');
      setStats(data.stats ?? null);
      setGenerated(true);
    } catch {
      setInsight('Could not generate insight. Please try again.');
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const isSunday = new Date().getDay() === 0;

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Weekly reflection
        </span>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)', background: 'var(--bg-sunk)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--line)' }}>
          {isSunday ? '✦ auto-sent today' : 'auto-sends Sundays'}
        </span>
      </div>

      {!generated ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic', marginBottom: 14, lineHeight: 1.6 }}>
            {isSunday ? 'Your weekly reflection is ready.' : "Preview this week's AI reflection anytime."}
          </p>
          <button onClick={generate} disabled={loading} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: loading ? 'var(--bg-sunk)' : 'var(--accent)',
            color: loading ? 'var(--ink-faint)' : '#fff',
            fontSize: 13, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
            fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
          }}>
            {loading ? '✦ Generating…' : isSunday ? 'Generate reflection' : 'Preview reflection'}
          </button>
        </div>
      ) : (
        <div>
          {stats && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              {[
                { label: 'Completed', value: stats.completedTasks, color: '#7a9e7e' },
                { label: 'Total tasks', value: stats.totalTasks, color: 'var(--ink-soft)' },
                { label: 'Rate', value: `${stats.completionRate}%`, color: 'var(--accent)' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8, background: 'var(--bg-sunk)', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.75, fontStyle: 'italic', margin: 0, marginBottom: 12 }}>
            &ldquo;{insight}&rdquo;
          </p>
          <button onClick={() => { setGenerated(false); setInsight(''); setStats(null); }} style={{
            fontSize: 11, color: 'var(--ink-faint)', background: 'none', border: 'none',
            cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: 0,
          }}>↺ Regenerate</button>
        </div>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */
export default function DashboardPage() {
  const supabase = createClient();
  const [authUser, setAuthUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { tasks, setTasks, toggleTask, projects, dashVariant } = useApp();

  // All hooks must be at the top before any conditional returns
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask,  setEditingTask]  = useState<Task | null>(null);
  const [dateLabel,    setDateLabel]    = useState('');
  const [sortBy,       setSortBy]       = useState<'default'|'priority'|'due'|'name'>('default');
  const [sortOpen,     setSortOpen]     = useState(false);
  const [weekOffset,   setWeekOffset]   = useState(0);
  const sortRef = useRef<HTMLDivElement>(null);
  const dragId  = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(user);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setDateLabel(new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase());
  }, []);

  useEffect(() => {
    if (!sortOpen) return;
    const h = (e: MouseEvent) => { if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [sortOpen]);

  const onToggle = useCallback((id: string) => {
    toggleTask(id);
  }, [toggleTask]);

  const onDragStart = useCallback((id: string) => { dragId.current = id; }, []);
  const onDragOver  = useCallback((e: React.DragEvent) => e.preventDefault(), []);
  const onDrop      = useCallback((targetId: string) => {
    if (!dragId.current || dragId.current === targetId) return;
    setTasks(prev => {
      const from = prev.findIndex(t => t.id === dragId.current);
      const to   = prev.findIndex(t => t.id === targetId);
      if (from < 0 || to < 0) return prev;
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
    dragId.current = null;
  }, [setTasks]);

  const onAdd = useCallback(async (p: Omit<Task,'id'>) => {
    if (!authUser) return;
    try {
      const newTask = await db.createTask(authUser.id, p);
      setTasks(prev => [{ ...p, id: newTask.id }, ...prev]);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  }, [authUser, setTasks]);

  const onEdit = useCallback(async (u: Task) => {
    if (!authUser) return;
    try {
      await db.updateTask(authUser.id, u.id, u);
      setTasks(prev => prev.map(t => t.id === u.id ? u : t));
      setEditingTask(null);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  }, [authUser, setTasks]);

  const onDelete = useCallback(async (id: string) => {
    if (!authUser) return;
    try {
      await db.deleteTask(authUser.id, id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }, [authUser, setTasks]);

  // Conditional returns MUST come after ALL hooks
  if (loading) return null;
  if (!authUser) return <LandingPage />;

  const getProjectColor = (name: string) => {
    const p = projects.find(x => x.name === name);
    return p ? TONE_COLORS[p.tone] : 'var(--accent)';
  };

  const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const DUE_ORDER: Record<string, number> = { today: 0, tomorrow: 1, 'this week': 2 };
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'priority') return (PRIORITY_ORDER[a.priority ?? ''] ?? 1) - (PRIORITY_ORDER[b.priority ?? ''] ?? 1);
    if (sortBy === 'due')      return (DUE_ORDER[a.due ?? ''] ?? 9) - (DUE_ORDER[b.due ?? ''] ?? 9);
    if (sortBy === 'name')     return a.title.localeCompare(b.title);
    return 0;
  });
  const todayTasks = sortedTasks.filter(t => t.due === 'today');
  const todayDoneCount = todayTasks.filter(t => t.done).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 40 }}>
      <Topbar
        title="Dashboard"
        subtitle={dateLabel}
        action={
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Icon name="plus" size={14} /> New task
          </button>
        }
      />

      <div style={{ padding: '0 20px 0', display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
        <GreetingCard tasks={tasks} />

        {/* main 2-col grid */}
        <div className="dashboard-grid" data-variant={dashVariant}>

          {/* ── LEFT col ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Today's tasks */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <h3 className="serif" style={{ fontSize: 20, fontWeight: 400, margin: 0 }}>Today</h3>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {todayDoneCount}/{todayTasks.length} done · drag to reorder
                </span>
                <div style={{ flex: 1 }} />
                <div ref={sortRef} style={{ position: 'relative' }}>
                  <button onClick={() => setSortOpen(o => !o)} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 8, border: '1px solid var(--line)',
                    background: sortOpen ? 'var(--bg-sunk)' : 'transparent',
                    cursor: 'pointer', fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--font-sans)',
                  }}>
                    <Icon name="list" size={12} />
                    {sortBy === 'default' ? 'Sort by' : sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                  </button>
                  {sortOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
                      background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 10,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: 140,
                    }}>
                      {([['default','Default order'],['priority','Priority'],['due','Due date'],['name','Name']] as const).map(([val, label]) => (
                        <button key={val} onClick={() => { setSortBy(val); setSortOpen(false); }} style={{
                          width: '100%', padding: '9px 14px', border: 'none', background: sortBy === val ? 'var(--bg-sunk)' : 'none',
                          cursor: 'pointer', fontSize: 13, color: sortBy === val ? 'var(--accent)' : 'var(--ink)',
                          fontFamily: 'var(--font-sans)', textAlign: 'left', fontWeight: sortBy === val ? 600 : 400,
                        }}
                          onMouseEnter={e => { if (sortBy !== val) e.currentTarget.style.background = 'var(--bg-sunk)'; }}
                          onMouseLeave={e => { if (sortBy !== val) e.currentTarget.style.background = 'none'; }}
                        >{label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {todayTasks.map(t => (
                  <TodayRow
                    key={t.id} task={t}
                    projectColor={getProjectColor(t.project)}
                    onToggle={onToggle} onDragStart={onDragStart}
                    onDragOver={onDragOver} onDrop={onDrop}
                    onEdit={setEditingTask} onDelete={onDelete}
                  />
                ))}
                {todayTasks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink-faint)', fontSize: 13, fontStyle: 'italic' }}>
                    No tasks due today — add one above
                  </div>
                )}
              </div>
            </div>

            {/* Timeline this week */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
                  Timeline<em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--ink-faint)', marginLeft: 4 }}>· this week</em>
                </h3>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => setWeekOffset(o => o - 1)} style={{
                    width: 26, height: 26, borderRadius: 6, border: '1px solid var(--line)',
                    background: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--ink-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>‹</button>
                  <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)', minWidth: 70, textAlign: 'center' }}>
                    {weekOffset === 0 ? 'This week' : weekOffset === -1 ? 'Last week' : weekOffset === 1 ? 'Next week' : `${weekOffset > 0 ? '+' : ''}${weekOffset}w`}
                  </span>
                  <button onClick={() => setWeekOffset(o => o + 1)} style={{
                    width: 26, height: 26, borderRadius: 6, border: '1px solid var(--line)',
                    background: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--ink-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>›</button>
                </div>
              </div>
              <WeekGantt weekOffset={weekOffset} />
            </div>

            <WeeklyRetro />
          </div>

          {/* ── RIGHT col ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <TaskOverview tasks={tasks} />
            <TodayHabits />
            <ThisMonth />
            <ActiveProjects />
          </div>
        </div>
      </div>

      {showAddModal && <TaskModal onAdd={onAdd} onClose={() => setShowAddModal(false)} />}
      {editingTask  && <TaskModal editTask={editingTask} onEdit={onEdit} onClose={() => setEditingTask(null)} />}
    </div>
  );
}
