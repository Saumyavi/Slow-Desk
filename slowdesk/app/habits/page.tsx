'use client';
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { createClient } from '@/lib/supabase/client';
import * as db from '@/lib/supabase/db';
import Topbar from '@/components/Topbar';
import Icon from '@/components/Icon';


const ACCENT_PALETTE = ['#c1623f', '#7a9e7e', '#8b5c75', '#c9943a', '#5b8fbf'];
const GOAL_OPTIONS   = ['daily', '5/wk', '3/wk', 'weekdays', 'weekends'];

const EMOJI_CATEGORIES = [
  { label: 'Fitness',    emojis: ['🏃','🏋️','🤸','🚴','🏊','🧗','🤾','⚽','🎾','🏈','🥊','🧘'] },
  { label: 'Skincare',   emojis: ['🧴','🪥','💆','🧖','🫧','💅','🌸','🪷','🫙','✨','🌺','🌻'] },
  { label: 'Hydration',  emojis: ['💧','🥤','🧃','🫗','🍵','☕','🫖','🧊','🍶','🥛','🍹','🌊'] },
  { label: 'Nutrition',  emojis: ['🥗','🥦','🍎','🍇','🥕','🫐','🥑','🌿','🥜','🍓','🥝','🫚'] },
  { label: 'Sleep',      emojis: ['😴','🌙','⭐','🛌','🌛','🌜','💤','🕯️','🌌','🌠','🛏️','🫁'] },
  { label: 'Mind',       emojis: ['🧠','📖','📝','✍️','🎯','💡','🔬','📚','🎓','💭','🧩','☮️'] },
  { label: 'Wellness',   emojis: ['💊','🩺','❤️','🫶','🙏','🌞','🚿','🌈','🍃','🌱','🪴','🦋'] },
  { label: 'Creative',   emojis: ['🎨','🎵','🎸','🎹','📷','🎬','✏️','🖌️','🎭','🪡','🎤','🎧'] },
  { label: 'Social',     emojis: ['👥','📞','💬','🤝','💌','👨‍👩‍👧','🏡','☕','🫂','🎁','🥂','🌍'] },
];

interface SubHabit {
  id: string;
  title: string;
  done: boolean;
  position: number;
}

interface HabitData {
  id: string;
  name: string;
  emoji: string;
  goal: string;
  color: string;
  history: string[]; // "YYYY-MM-DD"
  subhabits?: SubHabit[];
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const TODAY = toDateStr(new Date());

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

/* ── Habit Modal ─────────────────────────────────────────── */
function HabitModal({ editHabit, onSave, onDelete, onClose }: {
  editHabit?: HabitData;
  onSave: (data: Omit<HabitData, 'id' | 'history'>, subhabits: string[]) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const isEdit = !!editHabit;
  const [name,  setName]  = useState(editHabit?.name  ?? '');
  const [emoji, setEmoji] = useState(editHabit?.emoji ?? '✍️');
  const [goal,  setGoal]  = useState(editHabit?.goal  ?? 'daily');
  const [color, setColor] = useState(editHabit?.color ?? ACCENT_PALETTE[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [subhabits, setSubhabits] = useState<string[]>(
    editHabit?.subhabits?.map(sh => sh.title) ?? []
  );
  const [newSubhabit, setNewSubhabit] = useState('');
  const subhabitInputRef = useRef<HTMLInputElement>(null);

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
    onSave({ name: name.trim(), emoji, goal, color }, subhabits);
    close();
  };

  const addSubhabit = () => {
    if (!newSubhabit.trim()) return;
    setSubhabits([...subhabits, newSubhabit.trim()]);
    setNewSubhabit('');
    setTimeout(() => subhabitInputRef.current?.focus(), 10);
  };

  const removeSubhabit = (index: number) => {
    setSubhabits(subhabits.filter((_, i) => i !== index));
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
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
              {EMOJI_CATEGORIES.map(cat => (
                <div key={cat.label}>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-faint)', marginBottom: 5 }}>
                    {cat.label}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {cat.emojis.map(e => (
                      <button key={e} onClick={() => setEmoji(e)} style={{
                        width: 34, height: 34, borderRadius: 8, fontSize: 17, cursor: 'pointer',
                        border: emoji === e ? `2px solid ${color}` : '1.5px solid var(--line)',
                        background: emoji === e ? color + '18' : 'var(--bg-sunk)',
                        transition: 'all 0.12s',
                      }}>{e}</button>
                    ))}
                  </div>
                </div>
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

          {/* sub-habits */}
          <div>
            {fieldLabel('Sub-habits (optional)')}
            <div style={{
              border: '1.5px solid var(--line)',
              borderRadius: 8,
              background: 'var(--bg-sunk)',
              padding: 8,
              maxHeight: 200,
              overflowY: 'auto'
            }}>
              {subhabits.length === 0 ? (
                <div style={{
                  fontSize: 11,
                  color: 'var(--ink-faint)',
                  textAlign: 'center',
                  padding: '8px 0',
                  fontStyle: 'italic'
                }}>
                  Add steps to break down this habit
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                  {subhabits.map((sh, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      background: 'var(--bg-elev)',
                      borderRadius: 6,
                      border: '1px solid var(--line)'
                    }}>
                      <span style={{
                        fontSize: 12,
                        color: 'var(--ink)',
                        flex: 1,
                        lineHeight: 1.4
                      }}>{sh}</span>
                      <button
                        onClick={() => removeSubhabit(i)}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          display: 'grid',
                          placeItems: 'center',
                          color: 'var(--ink-faint)',
                          transition: 'all 0.12s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(224,92,60,0.1)';
                          e.currentTarget.style.color = '#e05c3c';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--ink-faint)';
                        }}
                      >
                        <Icon name="x" size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  ref={subhabitInputRef}
                  value={newSubhabit}
                  onChange={e => setNewSubhabit(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSubhabit()}
                  placeholder="Add a step..."
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1.5px solid var(--line)',
                    background: 'var(--bg-elev)',
                    fontSize: 12,
                    color: 'var(--ink)',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)'
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = color)}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
                />
                <button
                  onClick={addSubhabit}
                  disabled={!newSubhabit.trim()}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: newSubhabit.trim() ? color : 'var(--line)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: newSubhabit.trim() ? 'pointer' : 'default',
                    fontFamily: 'var(--font-sans)',
                    opacity: newSubhabit.trim() ? 1 : 0.5,
                    transition: 'all 0.13s'
                  }}
                >
                  Add
                </button>
              </div>
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
function HabitRow({ habit, onToggleToday, onEdit, onToggleSubhabit }: {
  habit: HabitData;
  onToggleToday: (id: string) => void;
  onEdit: (h: HabitData) => void;
  onToggleSubhabit: (habitId: string, subhabitId: string, done: boolean) => void;
}) {
  const historySet = new Set(habit.history);
  const todayDone  = historySet.has(TODAY);
  const streak     = computeStreak(historySet);
  const heatmap    = buildHeatmap(historySet);

  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const checkRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [showSubhabits, setShowSubhabits] = useState(false);

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

      {/* Sub-habits */}
      {Array.isArray(habit.subhabits) && habit.subhabits.length > 0 && (
        <div>
          <button
            onClick={() => setShowSubhabits(!showSubhabits)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--ink-soft)',
              fontFamily: 'var(--font-sans)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'color 0.13s',
              width: '100%',
              justifyContent: 'flex-start'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-soft)')}
          >
            <Icon
              name="chevronD"
              size={12}
              style={{
                transform: showSubhabits ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            />
            Steps ({habit.subhabits.length})
          </button>

          {showSubhabits && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              marginTop: 6,
              paddingLeft: 8,
              borderLeft: `2px solid ${habit.color}30`
            }}>
              {habit.subhabits.map((sh) => (
                <div
                  key={sh.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    background: 'var(--bg-sunk)',
                    borderRadius: 6,
                    border: '1px solid var(--line)',
                    transition: 'all 0.13s'
                  }}
                >
                  <button
                    onClick={() => onToggleSubhabit(habit.id, sh.id, !sh.done)}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 3,
                      flexShrink: 0,
                      border: sh.done ? 'none' : `1.5px solid ${habit.color}60`,
                      background: sh.done ? habit.color : 'transparent',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {sh.done && <Icon name="check" size={9} style={{ color: '#fff' }} />}
                  </button>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: sh.done ? 'var(--ink-faint)' : 'var(--ink)',
                      textDecoration: sh.done ? 'line-through' : 'none',
                      lineHeight: 1.4,
                      transition: 'all 0.15s'
                    }}
                  >
                    {sh.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function HabitsPage() {
  const supabase = createClient();


  const [userId,   setUserId]   = useState<string | null>(null);
  const [habits,   setHabits]   = useState<HabitData[]>([]);
  const [modal,    setModal]    = useState<{ habit?: HabitData } | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [insights,        setInsights]        = useState<{ type: string; text: string }[] | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsExpanded, setInsightsExpanded] = useState(true);
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

      setHabits(habitsData);

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

  const saveHabit = async (data: Omit<HabitData, 'id' | 'history'>, subhabits: string[], editId?: string) => {
    if (!userId) return;

    try {
      if (editId) {
        // Update habit
        await db.updateHabit(userId, editId, data);

        // Get existing subhabits to compare
        const existingSubhabits = await db.getSubhabits(editId);

        // Delete old subhabits that are not in the new list
        for (const existing of existingSubhabits) {
          await db.deleteSubhabit(existing.id);
        }

        // Create new subhabits
        const createdSubhabits: SubHabit[] = [];
        for (let i = 0; i < subhabits.length; i++) {
          const sh = await db.createSubhabit(editId, subhabits[i], i);
          createdSubhabits.push({
            id: sh.id,
            title: sh.title,
            done: sh.done,
            position: sh.position
          });
        }

        // Update state with new data and subhabits
        setHabits(prev => prev.map(h => h.id === editId ? { ...h, ...data, subhabits: createdSubhabits } : h));
      } else {
        const newHabit = await db.createHabit(userId, { ...data, history: [] });

        // Create sub-habits
        const createdSubhabits: SubHabit[] = [];
        for (let i = 0; i < subhabits.length; i++) {
          const sh = await db.createSubhabit(newHabit.id, subhabits[i], i);
          createdSubhabits.push({
            id: sh.id,
            title: sh.title,
            done: sh.done,
            position: sh.position
          });
        }

        const newHabitData = {
          id: newHabit.id,
          history: [],
          ...data,
          subhabits: createdSubhabits
        };

        setHabits(prev => [...prev, newHabitData]);
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

  const toggleSubhabit = async (habitId: string, subhabitId: string, done: boolean) => {
    try {
      await db.updateSubhabit(subhabitId, { done });

      // Update local state
      setHabits(prev => prev.map(h => {
        if (h.id !== habitId) return h;
        return {
          ...h,
          subhabits: h.subhabits?.map(sh =>
            sh.id === subhabitId ? { ...sh, done } : sh
          )
        };
      }));
    } catch (err) {
      console.error('Failed to toggle subhabit:', err);
    }
  };

  const fetchInsights = async (habitList: HabitData[]) => {
    if (habitList.length === 0) return;
    setInsightsLoading(true);
    setInsights(null);
    try {
      const res = await fetch('/api/habits/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habits: habitList.map(h => ({ name: h.name, emoji: h.emoji, history: h.history })),
        }),
      });
      const data = await res.json();
      setInsights(data.hasEnoughData ? (data.insights ?? []) : []);

    } catch {
      setInsights([]);
    } finally {
      setInsightsLoading(false);
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

        {/* ── Habit Intelligence ── */}
        {habits.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* header row */}
            <div
              onClick={() => setInsightsExpanded(e => !e)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 18px', cursor: 'pointer',
                borderBottom: insightsExpanded ? '1px solid var(--line)' : 'none',
                transition: 'border 0.2s',
              }}
            >
              <span style={{
                fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600,
              }}>✦ Habit insights</span>
              <div style={{ flex: 1 }} />
              {insights === null && !insightsLoading && (
                <button
                  onClick={e => { e.stopPropagation(); setInsightsExpanded(true); fetchInsights(habits); }}
                  style={{
                    padding: '5px 14px', borderRadius: 20, border: 'none',
                    background: 'var(--accent)', color: '#fff',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Analyze
                </button>
              )}
              {insights !== null && !insightsLoading && (
                <button
                  onClick={e => { e.stopPropagation(); fetchInsights(habits); }}
                  style={{
                    padding: '4px 12px', borderRadius: 20,
                    border: '1px solid var(--line)', background: 'transparent',
                    color: 'var(--ink-faint)', fontSize: 11, cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Refresh
                </button>
              )}
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="var(--ink-faint)" strokeWidth="2" strokeLinecap="round"
                style={{ transform: insightsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>

            {insightsExpanded && (
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* loading */}
                {insightsLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                      <circle cx="12" cy="12" r="10" fill="none" stroke="var(--line)" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontSize: 13, color: 'var(--ink-faint)', fontFamily: 'var(--font-sans)' }}>
                      Analyzing your habit patterns…
                    </span>
                  </div>
                )}

                {/* not enough data */}
                {!insightsLoading && insights !== null && insights.length === 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 10,
                    background: 'var(--bg-sunk)', border: '1px solid var(--line)',
                  }}>
                    <span style={{ fontSize: 20 }}>🌱</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>Keep logging</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-faint)', lineHeight: 1.5 }}>
                        Insights unlock after 14 days of habit data. You're building the foundation.
                      </div>
                    </div>
                  </div>
                )}

                {/* not yet analyzed */}
                {!insightsLoading && insights === null && (
                  <div style={{ fontSize: 13, color: 'var(--ink-faint)', fontStyle: 'italic', padding: '4px 0' }}>
                    Click Analyze to surface patterns from your habit history.
                  </div>
                )}

                {/* insight cards */}
                {!insightsLoading && insights !== null && insights.length > 0 && insights.map((insight, i) => {
                  const cfg = insight.type === 'win'
                    ? { emoji: '🏆', label: 'Win', color: '#7a9e7e', bg: 'rgba(122,158,126,0.08)', border: 'rgba(122,158,126,0.35)' }
                    : insight.type === 'nudge'
                    ? { emoji: '💡', label: 'Nudge', color: '#c9943a', bg: 'rgba(201,148,58,0.08)', border: 'rgba(201,148,58,0.35)' }
                    : { emoji: '⚠️', label: 'Pattern', color: '#c1623f', bg: 'rgba(193,98,63,0.08)', border: 'rgba(193,98,63,0.35)' };
                  return (
                    <div key={i} style={{
                      padding: '12px 16px', borderRadius: 10,
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      borderLeft: `3px solid ${cfg.color}`,
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{cfg.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: cfg.color, fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 4 }}>{cfg.label}</span>
                        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>
                          {insight.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
                onToggleSubhabit={toggleSubhabit}
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
          onSave={(data, subhabits) => saveHabit(data, subhabits, modal.habit?.id)}
          onDelete={modal.habit ? () => deleteHabit(modal.habit!.id) : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
