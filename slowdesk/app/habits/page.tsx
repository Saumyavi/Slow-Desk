'use client';
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { HABITS as SEED_HABITS } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import * as db from '@/lib/supabase/db';
import Topbar from '@/components/Topbar';
import Icon from '@/components/Icon';


const ACCENT_PALETTE = ['#c1623f', '#7a9e7e', '#8b5c75', '#c9943a', '#5b8fbf'];
const EMOJI_OPTIONS  = ['✍️','🚶','📖','🌙','🎨','🏃','🧘','💧','🍎','🌿','💪','📝','🎯','🎵','🧠','🌞','😴','🚿','🍵','🏋️'];
const GOAL_OPTIONS   = ['daily', '5/wk', '3/wk', 'weekdays', 'weekends'];

interface HabitData {
  id: string;
  name: string;
  emoji: string;
  goal: string;
  color: string;
  history: string[]; // "YYYY-MM-DD"
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const TODAY = toDateStr(new Date());

function seedHistory(streak: number, colorIdx: number): string[] {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (i < streak) {
      dates.push(toDateStr(d));
    } else {
      const v = ((colorIdx * 7 + i * 13) % 17) / 17;
      if (v > 0.45) dates.push(toDateStr(d));
    }
  }
  return dates;
}

function computeStreak(historySet: Set<string>): number {
  const today = new Date();
  // If today isn't done yet, start counting from yesterday so the streak
  // doesn't reset to 0 just because the user hasn't ticked today.
  const start = historySet.has(toDateStr(today)) ? 0 : 1;
  let streak = 0;
  for (let i = start; ; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (historySet.has(toDateStr(d))) streak++;
    else break;
  }
  return streak;
}

function buildHeatmap(historySet: Set<string>): boolean[] {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return historySet.has(toDateStr(d));
  });
}

function initHabits(): HabitData[] {
  return SEED_HABITS.map((h, i) => ({
    id: h.id,
    name: h.name,
    emoji: h.emoji,
    goal: h.goal,
    color: ACCENT_PALETTE[i % ACCENT_PALETTE.length],
    history: seedHistory(h.streak, i),
  }));
}

/* ── Habit Modal ─────────────────────────────────────────── */
function HabitModal({ editHabit, onSave, onDelete, onClose }: {
  editHabit?: HabitData;
  onSave: (data: Omit<HabitData, 'id' | 'history'>) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const isEdit = !!editHabit;
  const [name,  setName]  = useState(editHabit?.name  ?? '');
  const [emoji, setEmoji] = useState(editHabit?.emoji ?? '✍️');
  const [goal,  setGoal]  = useState(editHabit?.goal  ?? 'daily');
  const [color, setColor] = useState(editHabit?.color ?? ACCENT_PALETTE[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18 });
    gsap.fromTo(panelRef.current,
      { y: 24, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 0.28, ease: 'power3.out' }
    );
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const close = () => {
    gsap.to(panelRef.current,   { y: 12, opacity: 0, scale: 0.97, duration: 0.16, ease: 'power2.in' });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.18, onComplete: onClose });
  };

  const submit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), emoji, goal, color });
    close();
  };

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete?.();
    close();
  };

  const fieldLabel = (text: string) => (
    <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.07em', color: 'var(--ink-faint)', display: 'block', marginBottom: 6 }}>
      {text}
    </label>
  );

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px', borderRadius: 8, boxSizing: 'border-box',
    border: '1.5px solid var(--line)', background: 'var(--bg-sunk)',
    fontSize: 13, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-sans)',
    transition: 'border-color 0.15s', width: '100%',
  };

  return (
    <div ref={overlayRef} onClick={e => e.target === overlayRef.current && close()} style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div ref={panelRef} style={{
        width: 460, background: 'var(--bg-elev)', borderRadius: 18,
        boxShadow: '0 28px 72px rgba(0,0,0,0.28)', border: '1px solid var(--line)',
        overflow: 'hidden',
      }}>
        {/* colored strip */}
        <div style={{ height: 4, background: color, transition: 'background 0.2s' }} />

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px 12px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{isEdit ? 'Edit habit' : 'New habit'}</span>
          <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 4 }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* body */}
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* emoji + name */}
          <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 10 }}>
            <div>
              {fieldLabel('Icon')}
              <input value={emoji} onChange={e => setEmoji(e.target.value)}
                style={{ ...inputStyle, width: 64, textAlign: 'center', fontSize: 22, padding: '6px 4px' }}
                onFocus={e => (e.currentTarget.style.borderColor = color)}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
              />
            </div>
            <div>
              {fieldLabel('Habit name')}
              <input ref={inputRef} value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="e.g. Morning pages"
                style={{ ...inputStyle, fontSize: 14 }}
                onFocus={e => (e.currentTarget.style.borderColor = color)}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
              />
            </div>
          </div>

          {/* emoji quick-picks */}
          <div>
            {fieldLabel('Quick pick')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {EMOJI_OPTIONS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{
                  width: 36, height: 36, borderRadius: 8, fontSize: 18, cursor: 'pointer',
                  border: emoji === e ? `2px solid ${color}` : '1.5px solid var(--line)',
                  background: emoji === e ? color + '18' : 'var(--bg-sunk)',
                  transition: 'all 0.12s',
                }}>{e}</button>
              ))}
            </div>
          </div>

          {/* frequency */}
          <div>
            {fieldLabel('Frequency')}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {GOAL_OPTIONS.map(g => (
                <button key={g} onClick={() => setGoal(g)} style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: goal === g ? `1.5px solid ${color}` : '1.5px solid var(--line)',
                  background: goal === g ? color + '18' : 'transparent',
                  color: goal === g ? color : 'var(--ink-soft)',
                  transition: 'all 0.13s', fontFamily: 'var(--font-sans)',
                }}>{g}</button>
              ))}
            </div>
          </div>

          {/* color */}
          <div>
            {fieldLabel('Color')}
            <div style={{ display: 'flex', gap: 8 }}>
              {ACCENT_PALETTE.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 28, height: 28, borderRadius: '50%', background: c,
                  border: color === c ? '3px solid var(--ink)' : '3px solid transparent',
                  outline: '1.5px solid rgba(0,0,0,0.12)',
                  cursor: 'pointer', transition: 'transform 0.12s',
                  transform: color === c ? 'scale(1.18)' : 'scale(1)',
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--line)', background: 'var(--bg-sunk)' }}>
          {isEdit && onDelete && (
            <button onClick={handleDelete} style={{
              padding: '7px 14px', borderRadius: 8,
              border: `1px solid ${confirmDelete ? '#e05c3c' : 'var(--line)'}`,
              background: confirmDelete ? 'rgba(224,92,60,0.1)' : 'transparent',
              color: confirmDelete ? '#e05c3c' : 'var(--ink-soft)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Icon name="trash" size={12} />
              {confirmDelete ? 'Confirm delete' : 'Delete'}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={close} style={{
            padding: '7px 16px', borderRadius: 8, border: '1px solid var(--line)',
            background: 'transparent', fontSize: 13, color: 'var(--ink-soft)',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}>Cancel</button>
          <button onClick={submit} disabled={!name.trim()} style={{
            padding: '7px 20px', borderRadius: 8, border: 'none',
            background: name.trim() ? color : 'var(--bg-sunk)',
            color: name.trim() ? '#fff' : 'var(--ink-faint)',
            fontSize: 13, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
          }}>{isEdit ? 'Save changes' : 'Add habit'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Habit Row ───────────────────────────────────────────── */
function HabitRow({ habit, onToggleToday, onEdit }: {
  habit: HabitData;
  onToggleToday: (id: string) => void;
  onEdit: (h: HabitData) => void;
}) {
  const historySet = new Set(habit.history);
  const todayDone  = historySet.has(TODAY);
  const streak     = computeStreak(historySet);
  const heatmap    = buildHeatmap(historySet);

  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const checkRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const els = cellRefs.current.filter(Boolean);
    gsap.fromTo(els,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, stagger: 0.01, duration: 0.22, ease: 'back.out(1.3)', delay: Math.random() * 0.12 + 0.08 }
    );
  }, []);

  const handleToggle = () => {
    if (!todayDone && checkRef.current) {
      gsap.timeline()
        .to(checkRef.current, { scale: 1.45, duration: 0.11, ease: 'power3.out' })
        .to(checkRef.current, { scale: 1, duration: 0.3, ease: 'elastic.out(1.4,0.5)' });
    }
    onToggleToday(habit.id);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* emoji */}
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: habit.color + '22', display: 'grid', placeItems: 'center', fontSize: 20,
        }}>{habit.emoji}</div>

        {/* meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{habit.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{habit.goal}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: habit.color }}>
              <Icon name="flame" size={11} /> {streak} day streak
            </span>
          </div>
        </div>

        {/* edit button (hover) */}
        {hovered && (
          <button onClick={() => onEdit(habit)} style={{
            width: 28, height: 28, borderRadius: 7, border: '1px solid var(--line)',
            background: 'var(--bg-sunk)', cursor: 'pointer',
            display: 'grid', placeItems: 'center',
            color: 'var(--ink-soft)', transition: 'all 0.12s', flexShrink: 0,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink-soft)'; }}
          >
            <Icon name="edit" size={12} />
          </button>
        )}

        {/* check button */}
        <button ref={checkRef} onClick={handleToggle} style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          border: `2px solid ${todayDone ? habit.color : 'var(--line)'}`,
          background: todayDone ? habit.color : 'transparent',
          cursor: 'pointer', display: 'grid', placeItems: 'center',
          transition: 'all 0.2s',
        }}>
          {todayDone && <Icon name="check" size={14} style={{ color: '#fff' }} />}
        </button>
      </div>

      {/* 30-day heatmap */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Last 30 days</div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {heatmap.map((done, i) => (
            <div key={i} ref={el => { cellRefs.current[i] = el; }} style={{
              width: 14, height: 14, borderRadius: 3, opacity: 0,
              background: done ? habit.color : 'var(--bg-sunk)',
            }} />
          ))}
        </div>
      </div>

      {/* last-7-days mini bars (Mon–Sun) */}
      <div style={{ display: 'flex', gap: 4 }}>
        {['M','T','W','T','F','S','S'].map((d, i) => {
          const done = heatmap[heatmap.length - 7 + i];
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 20, borderRadius: 4,
                background: done ? habit.color : 'var(--bg-sunk)',
                marginBottom: 3, transition: 'background 0.25s',
              }} />
              <div style={{ fontSize: 9, color: 'var(--ink-faint)', fontWeight: 500 }}>{d}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function HabitsPage() {
  const supabase = createClient();


  const [userId, setUserId] = useState<string | null>(null);
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [modal, setModal] = useState<{ habit?: HabitData } | null>(null);
  const [loading, setLoading] = useState(true);
  const headerRef = useRef<HTMLDivElement>(null);

  // Load user and habits from Supabase
  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || !mounted) return;
      setUserId(user.id);

      // Load habits from Supabase
      const habitsData = await db.getHabits(user.id);
      if (!mounted) return;

      if (habitsData.length === 0) {
        // Create initial habits if none exist
        const initialHabits = initHabits();
        for (const habit of initialHabits) {
          await db.createHabit(user.id, habit);
        }
        const freshHabits = await db.getHabits(user.id);
        if (mounted) setHabits(freshHabits);
      } else {
        setHabits(habitsData);
      }

      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!headerRef.current) return;
    gsap.fromTo(headerRef.current.children,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08, duration: 0.45, ease: 'power2.out', delay: 0.1 }
    );
  }, []);

  const onToggleToday = async (id: string) => {
    if (!userId) return;

    try {
      await db.toggleHabitDate(id, TODAY);

      // Update local state
      setHabits(prev => prev.map(h => {
        if (h.id !== id) return h;
        const set = new Set(h.history);
        set.has(TODAY) ? set.delete(TODAY) : set.add(TODAY);
        return { ...h, history: [...set] };
      }));
    } catch (err) {
      console.error('Failed to toggle habit:', err);
    }
  };

  const saveHabit = async (data: Omit<HabitData, 'id' | 'history'>, editId?: string) => {
    if (!userId) return;

    try {
      if (editId) {
        await db.updateHabit(userId, editId, data);
        setHabits(prev => prev.map(h => h.id === editId ? { ...h, ...data } : h));
      } else {
        const newHabit = await db.createHabit(userId, { ...data, history: [] });
        setHabits(prev => [...prev, { id: newHabit.id, history: [], ...data }]);
      }
    } catch (err) {
      console.error('Failed to save habit:', err);
    }
  };

  const deleteHabit = async (id: string) => {
    if (!userId) return;

    try {
      await db.deleteHabit(userId, id);
      setHabits(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error('Failed to delete habit:', err);
    }
  };

  const doneCount = habits.filter(h => new Set(h.history).has(TODAY)).length;
  const pct = habits.length === 0 ? 0 : Math.round((doneCount / habits.length) * 100);

  const streakRanking = [...habits]
    .map(h => ({ ...h, streak: computeStreak(new Set(h.history)) }))
    .sort((a, b) => b.streak - a.streak);

  if (loading) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      <Topbar
        title="Habits"
        subtitle={`${doneCount} of ${habits.length} done today · ${pct}%`}
        action={
          <button className="btn btn-primary" onClick={() => setModal({})}>
            <Icon name="plus" size={14} /> New habit
          </button>
        }
      />

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* today summary card */}
        <div ref={headerRef} className="card" style={{ background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--bg-elev) 100%)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div className="serif" style={{ fontSize: 20, fontWeight: 400 }}>Today's check-in</div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>
                {habits.length === 0
                  ? '🌱 Add your first habit to get started.'
                  : pct === 100 ? '🎉 Perfect day! All habits done.'
                  : pct >= 60  ? '💪 Great progress, keep it up!'
                  : '🌱 Keep going, you got this.'}
              </div>
            </div>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
              background: `conic-gradient(var(--accent) ${pct * 3.6}deg, var(--bg-sunk) 0deg)`,
              display: 'grid', placeItems: 'center',
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%',
                background: 'var(--bg-elev)',
                display: 'grid', placeItems: 'center',
                fontSize: 13, fontWeight: 700, color: 'var(--accent)',
              }}>{pct}%</div>
            </div>
          </div>
          <div className="bar" style={{ height: 6, borderRadius: 3 }}>
            <i style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 0.45s ease' }} />
          </div>
        </div>

        {/* habit cards grid or empty state */}
        {habits.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 20px', border: '1px dashed var(--line)', background: 'transparent' }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>🌱</div>
            <div className="serif" style={{ fontSize: 18, marginBottom: 6 }}>No habits yet</div>
            <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 20 }}>Start small. Add one habit to track today.</div>
            <button className="btn btn-primary" onClick={() => setModal({})}>
              <Icon name="plus" size={14} /> Add first habit
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {habits.map(h => (
              <HabitRow key={h.id} habit={h}
                onToggleToday={onToggleToday}
                onEdit={habit => setModal({ habit })}
              />
            ))}
          </div>
        )}

        {/* streak leaderboard */}
        {habits.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Streak board</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {streakRanking.map((h, i) => (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)', width: 16 }}>{i + 1}</span>
                  <span style={{ fontSize: 18 }}>{h.emoji}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{h.name}</span>
                  <div className="bar" style={{ width: 80 }}>
                    <i style={{ display: 'block', height: '100%', width: `${Math.min(100, (h.streak / 30) * 100)}%`, background: h.color, borderRadius: 2, transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: h.color, width: 36, textAlign: 'right' }}>
                    {h.streak}d
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* modal */}
      {modal && (
        <HabitModal
          editHabit={modal.habit}
          onSave={data => saveHabit(data, modal.habit?.id)}
          onDelete={modal.habit ? () => deleteHabit(modal.habit!.id) : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
