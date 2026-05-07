'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { useApp } from '@/lib/store';
import { TONE_COLORS, Task, SubTask } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import * as db from '@/lib/supabase/db';
import { ExtractedTask } from '@/lib/task-parser';
import Topbar from '@/components/Topbar';
import Icon from '@/components/Icon';
import TaskModal from '@/components/TaskModal';
import PomodoroTimer from '@/components/PomodoroTimer';
import CameraCapture from '@/components/CameraCapture';
import TaskReview from '@/components/TaskReview';

type Filter = 'all' | 'today' | 'upcoming' | 'completed';

/* ── Task row ──────────────────────────────────────────── */
function TaskItem({ task, projectColor, onToggle, onEdit, onDelete, onFocus, subtasks, onAddSubtask, onToggleSubtask, onDeleteSubtask, isNew, onDismissNew }: {
  task: Task;
  projectColor: string;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onFocus: (task: Task) => void;
  subtasks: SubTask[];
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (subtaskId: string, done: boolean) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  isNew?: boolean;
  onDismissNew?: () => void;
}) {
  const rowRef   = useRef<HTMLDivElement>(null);
  const checkRef = useRef<HTMLButtonElement>(null);
  const menuRef  = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const [menuOpen,        setMenuOpen]        = useState(false);
  const [showFocusBtn,    setShowFocusBtn]    = useState(false);
  const [showPanel,       setShowPanel]       = useState(false);
  const [breaking,        setBreaking]        = useState(false);
  const [suggestions,     setSuggestions]     = useState<string[]>([]);
  const [selected,        setSelected]        = useState<Set<string>>(new Set());
  const [addingSubtask,   setAddingSubtask]   = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const doneCount  = subtasks.filter(s => s.done).length;
  const totalCount = subtasks.length;
  const progress   = totalCount > 0 ? doneCount / totalCount : 0;

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  useEffect(() => {
    if (addingSubtask) setTimeout(() => inputRef.current?.focus(), 40);
  }, [addingSubtask]);

  useEffect(() => {
    if (!isNew) return;
    const t = setTimeout(() => onDismissNew?.(), 8000);
    return () => clearTimeout(t);
  }, [isNew]);

  const handleToggle = () => {
    if (!task.done && checkRef.current) {
      gsap.timeline()
        .to(checkRef.current, { scale: 1.4, duration: 0.1, ease: 'power2.out' })
        .to(checkRef.current, { scale: 1, duration: 0.25, ease: 'elastic.out(1.3,0.5)' });
    }
    onToggle(task.id);
  };

  const handleDelete = () => {
    if (!rowRef.current) return onDelete(task.id);
    gsap.to(rowRef.current, {
      x: 32, opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginBottom: 0,
      duration: 0.22, ease: 'power2.in', onComplete: () => onDelete(task.id),
    });
  };

  const commitSubtask = () => {
    const t = newSubtaskTitle.trim();
    if (!t) { setAddingSubtask(false); return; }
    onAddSubtask(task.id, t);
    setNewSubtaskTitle('');
    setAddingSubtask(false);
  };

  const handleAIBreak = async () => {
    if (showPanel && !breaking) { setShowPanel(false); return; }
    setShowPanel(true);
    setSuggestions([]);
    setSelected(new Set());
    setBreaking(true);

    try {
      const res = await fetch('/api/tasks/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle: task.title, projectName: task.project }),
      });
      if (!res.ok || !res.body) { setBreaking(false); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
      }

      const parsed = full
        .split('\n')
        .filter(l => l.trim().startsWith('- '))
        .map(l => l.replace(/^-\s+/, '').trim())
        .filter(Boolean);

      setSuggestions(parsed);
      setSelected(new Set(parsed));
    } catch { /* silent */ }

    setBreaking(false);
  };

  const addSelected = () => {
    suggestions.filter(s => selected.has(s)).forEach(s => onAddSubtask(task.id, s));
    setSuggestions([]);
    setSelected(new Set());
  };

  const showTime = task.time && task.time !== '—';

  return (
    <div
      ref={rowRef}
      data-taskrow
      style={{
        background: 'var(--bg-elev)', borderRadius: 10, border: '1px solid var(--line)',
        transition: 'border-color 0.15s, box-shadow 0.15s', overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(193,98,63,0.25)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; setShowFocusBtn(true); }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none'; setShowFocusBtn(false); }}
    >
      {/* ── Main row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px' }}>
        {/* Checkbox */}
        <button
          ref={checkRef}
          onClick={handleToggle}
          style={{
            width: 18, height: 18, borderRadius: 4, flexShrink: 0,
            border: task.done ? 'none' : '1.5px solid var(--ink-faint)',
            background: task.done ? 'var(--accent)' : 'transparent',
            display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {task.done && <Icon name="check" size={10} style={{ color: '#fff' }} />}
        </button>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 500,
            color: task.done ? 'var(--ink-faint)' : 'var(--ink)',
            textDecoration: task.done ? 'line-through' : 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginBottom: totalCount > 0 ? 5 : 3,
          }}>{task.title}</div>

          {/* Subtask progress bar */}
          {totalCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--line)', maxWidth: 120 }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: doneCount === totalCount ? '#7a9e7e' : 'var(--accent)',
                  width: `${progress * 100}%`, transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{ fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                {doneCount}/{totalCount}
              </span>
            </div>
          )}

          {totalCount === 0 && (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {showTime && <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{task.time}</span>}
              {task.attach > 0 && (
                <>
                  {showTime && <span style={{ fontSize: 11, color: 'var(--ink-faint)', opacity: 0.4 }}>·</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: 'var(--ink-faint)' }}>
                    <Icon name="paperclip" size={10} />{task.attach}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Project chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 20,
            background: projectColor + '18', border: `1px solid ${projectColor}40`,
            fontSize: 11, fontWeight: 500, color: 'var(--ink-soft)', maxWidth: 140,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: projectColor, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.project}</span>
          </div>

          {/* Focus button — visible on hover */}
          {showFocusBtn && !task.done && (
            <button
              onClick={() => onFocus(task)}
              title="Start focus session (Pomodoro)"
              style={{
                width: 28, height: 28, borderRadius: 6, border: 'none',
                background: 'var(--accent-soft)', color: 'var(--accent)',
                display: 'grid', placeItems: 'center', cursor: 'pointer',
                transition: 'all 0.12s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--accent)'; }}
            >
              <Icon name="focus" size={13} />
            </button>
          )}

          {/* AI break-into-steps button */}
          <button
            onClick={handleAIBreak}
            title="Break into steps with AI"
            style={{
              width: 28, height: 28, borderRadius: 6, border: 'none',
              background: showPanel ? 'var(--accent-soft)' : 'transparent',
              cursor: 'pointer', display: 'grid', placeItems: 'center',
              color: showPanel ? 'var(--accent)' : 'var(--ink-faint)', transition: 'all 0.13s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = showPanel ? 'var(--accent-soft)' : 'transparent'; e.currentTarget.style.color = showPanel ? 'var(--accent)' : 'var(--ink-faint)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="m12 3 1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z"/>
            </svg>
          </button>

          {/* Three-dot menu */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(m => !m)}
              style={{
                width: 28, height: 28, borderRadius: 6, border: 'none',
                background: menuOpen ? 'var(--bg-sunk)' : 'transparent',
                cursor: 'pointer', display: 'grid', placeItems: 'center',
                color: 'var(--ink-faint)', transition: 'all 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-sunk)')}
              onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon name="more" size={15} />
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 32, zIndex: 200,
                background: 'var(--bg-elev)', border: '1px solid var(--line)',
                borderRadius: 8, padding: 4,
                boxShadow: '0 8px 24px rgba(0,0,0,0.14)', minWidth: 130,
              }}>
                <button onClick={() => { onEdit(task); setMenuOpen(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '7px 10px', borderRadius: 6, border: 'none', background: 'transparent',
                  cursor: 'pointer', fontSize: 12, color: 'var(--ink)', fontFamily: 'var(--font-sans)', textAlign: 'left',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-sunk)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon name="edit" size={12} /> Edit
                </button>
                <button onClick={() => { handleDelete(); setMenuOpen(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '7px 10px', borderRadius: 6, border: 'none', background: 'transparent',
                  cursor: 'pointer', fontSize: 12, color: '#e05c3c', fontFamily: 'var(--font-sans)', textAlign: 'left',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(224,92,60,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon name="trash" size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── New task AI suggestion strip ── */}
      {isNew && !showPanel && subtasks.length === 0 && (
        <div style={{
          borderTop: '1px solid var(--line)',
          padding: '8px 16px 8px 44px',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'linear-gradient(90deg, rgba(193,98,63,0.05) 0%, transparent 100%)',
          animation: 'aiTipIn 0.25s ease-out',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent)', flexShrink: 0, opacity: 0.8 }}>
            <path d="m12 3 1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z"/>
          </svg>
          <span style={{ fontSize: 11.5, color: 'var(--ink-soft)', flex: 1 }}>
            Want to break this into steps with AI?
          </span>
          <button
            onClick={() => { onDismissNew?.(); handleAIBreak(); }}
            style={{
              padding: '3px 10px', borderRadius: 6, border: 'none',
              background: 'linear-gradient(135deg, #c1623f 0%, #c9943a 100%)',
              color: '#fff', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
              boxShadow: '0 1px 6px rgba(193,98,63,0.3)',
            }}
          >Break it down →</button>
          <button
            onClick={() => onDismissNew?.()}
            style={{
              width: 18, height: 18, borderRadius: 4, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'grid', placeItems: 'center', color: 'var(--ink-faint)',
              flexShrink: 0,
            }}
          >
            <Icon name="x" size={9} />
          </button>
        </div>
      )}

      {/* ── AI + subtask panel ── */}
      {showPanel && (
        <div style={{ borderTop: '1px solid var(--line)', background: 'var(--bg)', padding: '10px 16px 12px 44px' }}>

          {/* Existing subtasks */}
          {subtasks.map(st => (
            <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--line-soft)' }}>
              <button
                onClick={() => onToggleSubtask(st.id, !st.done)}
                style={{
                  width: 15, height: 15, borderRadius: 3, flexShrink: 0,
                  border: st.done ? 'none' : '1.5px solid var(--ink-faint)',
                  background: st.done ? '#7a9e7e' : 'transparent',
                  display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {st.done && <Icon name="check" size={8} style={{ color: '#fff' }} />}
              </button>
              <span style={{ flex: 1, fontSize: 12.5, color: st.done ? 'var(--ink-faint)' : 'var(--ink-soft)', textDecoration: st.done ? 'line-through' : 'none' }}>{st.title}</span>
              <button
                onClick={() => onDeleteSubtask(st.id)}
                style={{ width: 18, height: 18, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink-faint)', opacity: 0, transition: 'opacity 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#e05c3c'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.color = 'var(--ink-faint)'; }}
              >
                <Icon name="x" size={10} />
              </button>
            </div>
          ))}

          {/* AI loading */}
          {breaking && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 0.15, 0.3].map((delay, i) => (
                  <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: `aiPulse 1.1s ease-in-out ${delay}s infinite` }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>Breaking into steps…</span>
            </div>
          )}

          {/* AI suggestions */}
          {!breaking && suggestions.length > 0 && (
            <div style={{ paddingTop: subtasks.length > 0 ? 8 : 2 }}>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="m12 3 1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z"/></svg>
                AI suggestions — tap to deselect
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                {suggestions.map(s => {
                  const on = selected.has(s);
                  return (
                    <button
                      key={s}
                      onClick={() => setSelected(prev => { const n = new Set(prev); on ? n.delete(s) : n.add(s); return n; })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px', borderRadius: 7, border: 'none', textAlign: 'left',
                        background: on ? 'var(--accent-soft)' : 'var(--bg-sunk)',
                        cursor: 'pointer', transition: 'background 0.13s', fontFamily: 'var(--font-sans)',
                      }}
                    >
                      <div style={{
                        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                        border: on ? 'none' : '1.5px solid var(--ink-faint)',
                        background: on ? 'var(--accent)' : 'transparent',
                        display: 'grid', placeItems: 'center', transition: 'all 0.15s',
                      }}>
                        {on && <Icon name="check" size={8} style={{ color: '#fff' }} />}
                      </div>
                      <span style={{ fontSize: 12.5, color: on ? 'var(--ink)' : 'var(--ink-soft)' }}>{s}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={addSelected}
                  disabled={selected.size === 0}
                  style={{
                    padding: '5px 14px', borderRadius: 7, border: 'none',
                    background: selected.size > 0 ? 'var(--accent)' : 'var(--line)',
                    color: selected.size > 0 ? '#fff' : 'var(--ink-faint)',
                    fontSize: 12, fontWeight: 600, cursor: selected.size > 0 ? 'pointer' : 'default',
                    fontFamily: 'var(--font-sans)', transition: 'all 0.13s',
                  }}
                >
                  Add {selected.size > 0 ? `${selected.size} step${selected.size > 1 ? 's' : ''}` : 'steps'}
                </button>
                <button
                  onClick={() => { setSuggestions([]); setSelected(new Set()); }}
                  style={{
                    padding: '5px 12px', borderRadius: 7, border: '1px solid var(--line)',
                    background: 'transparent', color: 'var(--ink-faint)',
                    fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                >Discard</button>
              </div>
            </div>
          )}

          {/* Manual add — secondary option */}
          {!breaking && suggestions.length === 0 && (
            addingSubtask ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: subtasks.length > 0 ? 6 : 2 }}>
                <div style={{ width: 15, height: 15, borderRadius: 3, border: '1.5px solid var(--line)', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitSubtask(); if (e.key === 'Escape') { setAddingSubtask(false); setNewSubtaskTitle(''); } }}
                  onBlur={commitSubtask}
                  placeholder="Step title…"
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 12.5, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}
                />
              </div>
            ) : (
              <button
                onClick={() => setAddingSubtask(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  marginTop: subtasks.length > 0 ? 6 : 0,
                  padding: '4px 0', border: 'none', background: 'transparent',
                  cursor: 'pointer', color: 'var(--ink-faint)', fontSize: 11.5,
                  fontFamily: 'var(--font-sans)', transition: 'color 0.13s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink-soft)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-faint)')}
              >
                <Icon name="plus" size={11} /> Add manually
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────── */
export default function TasksPage() {
  const supabase = createClient();
  const { tasks, setTasks, projects, toggleTask } = useApp();
  const [filter,         setFilter]         = useState<Filter>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high'>('all');
  const [projectFilter,  setProjectFilter]  = useState<string>('');
  const [filterOpen,     setFilterOpen]     = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask,  setEditingTask]  = useState<Task | null>(null);
  const [focusTask,    setFocusTask]    = useState<Task | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [userId,       setUserId]       = useState<string | null>(null);
  const [subtasksMap,  setSubtasksMap]  = useState<Record<string, SubTask[]>>({});
  const [newTaskId,    setNewTaskId]    = useState<string | null>(null);
  const listRef      = useRef<HTMLDivElement>(null);
  const filterBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const allSubtasks = await db.getSubtasksByUser(user.id);
      const map: Record<string, SubTask[]> = {};
      for (const st of allSubtasks) {
        if (!map[st.task_id]) map[st.task_id] = [];
        map[st.task_id].push(st);
      }
      setSubtasksMap(map);
    });
  }, []);

  useEffect(() => {
    if (!filterOpen) return;
    const h = (e: MouseEvent) => {
      if (filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [filterOpen]);

  useEffect(() => {
    if (!listRef.current) return;
    const rows = listRef.current.querySelectorAll('[data-taskrow]');
    gsap.fromTo(rows,
      { x: -12, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.035, duration: 0.32, ease: 'power2.out', clearProps: 'transform,opacity' }
    );
  }, [filter, priorityFilter, projectFilter]);

  const onToggle = useCallback((id: string) => {
    toggleTask(id);
  }, [toggleTask]);

  const onDelete = useCallback(async (id: string) => {
    if (!userId) return;
    try {
      await db.deleteTask(userId, id);
      setTasks(prev => prev.filter(x => x.id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }, [userId, setTasks]);

  const onAdd = useCallback(async (partial: Omit<Task, 'id'>) => {
    if (!userId) return;
    try {
      const newTask = await db.createTask(userId, partial);
      setTasks(prev => [{ ...partial, id: newTask.id }, ...prev]);
      setNewTaskId(newTask.id);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  }, [userId, setTasks]);

  const onEditSave = useCallback(async (updated: Task) => {
    if (!userId) return;
    try {
      await db.updateTask(userId, updated.id, updated);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      setEditingTask(null);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  }, [userId, setTasks]);

  const onAddSubtask = useCallback(async (taskId: string, title: string) => {
    if (!userId) return;
    try {
      const pos = (subtasksMap[taskId]?.length ?? 0);
      const st = await db.createSubtask(userId, taskId, title, pos);
      setSubtasksMap(prev => ({ ...prev, [taskId]: [...(prev[taskId] ?? []), st] }));
    } catch (err) { console.error(err); }
  }, [userId, subtasksMap]);

  const onToggleSubtask = useCallback(async (subtaskId: string, done: boolean) => {
    if (!userId) return;
    try {
      await db.toggleSubtask(userId, subtaskId, done);
      setSubtasksMap(prev => {
        const next = { ...prev };
        for (const tid in next) {
          next[tid] = next[tid].map(s => s.id === subtaskId ? { ...s, done } : s);
        }
        return next;
      });
    } catch (err) { console.error(err); }
  }, [userId]);

  const onDeleteSubtask = useCallback(async (subtaskId: string) => {
    if (!userId) return;
    try {
      await db.deleteSubtask(userId, subtaskId);
      setSubtasksMap(prev => {
        const next = { ...prev };
        for (const tid in next) {
          next[tid] = next[tid].filter(s => s.id !== subtaskId);
        }
        return next;
      });
    } catch (err) { console.error(err); }
  }, [userId]);

  const handleTasksExtracted = useCallback((tasks: ExtractedTask[]) => {
    setExtractedTasks(tasks);
    setShowCamera(false);
    setShowReview(true);
  }, []);

  const handleConfirmTasks = useCallback(async (tasksToAdd: ExtractedTask[]) => {
    if (!userId) return;

    try {
      for (const task of tasksToAdd) {
        const newTask = {
          title: task.title,
          done: false,
          project: '',
          tone: 'terra' as const,
          attach: 0,
          due: task.due || 'this week',
          time: '—',
          priority: task.priority,
        };
        const created = await db.createTask(userId, newTask);
        setTasks(prev => [created, ...prev]);
      }
      setShowReview(false);
      setExtractedTasks([]);
    } catch (err) {
      console.error('Failed to create tasks:', err);
      alert('Failed to create some tasks. Please try again.');
    }
  }, [userId, setTasks]);

  const getProjectColor = useCallback((name: string) => {
    const p = projects.find(x => x.name === name);
    return p ? TONE_COLORS[p.tone] : 'var(--accent)';
  }, [projects]);

  const activeCount    = tasks.filter(t => !t.done).length;
  const completedCount = tasks.filter(t => t.done).length;

  const byTab = (() => {
    switch (filter) {
      case 'today':     return tasks.filter(t => t.due === 'today'    && !t.done);
      case 'upcoming':  return tasks.filter(t => t.due === 'tomorrow' && !t.done);
      case 'completed': return tasks.filter(t => t.done);
      default:          return tasks;
    }
  })();

  const filtered = byTab
    .filter(t => priorityFilter === 'all' || t.priority === 'high')
    .filter(t => !projectFilter || t.project === projectFilter);

  const projectNames = [...new Set(filtered.map(t => t.project))];
  const groups = projectNames.map(name => ({
    label: name,
    color: getProjectColor(name),
    tasks: filtered.filter(t => t.project === name),
  }));

  const FILTERS = [
    { key: 'all'       as Filter, label: 'All',       count: tasks.length },
    { key: 'today'     as Filter, label: 'Today',     count: tasks.filter(t => t.due === 'today'    && !t.done).length },
    { key: 'upcoming'  as Filter, label: 'Upcoming',  count: tasks.filter(t => t.due === 'tomorrow' && !t.done).length },
    { key: 'completed' as Filter, label: 'Completed', count: completedCount },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Topbar
        title="All tasks"
        subtitle={`${activeCount} active · ${completedCount} completed`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setShowCamera(true)}>
              <Icon name="camera" size={14} /> Scan
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Icon name="plus" size={14} /> New task
            </button>
          </div>
        }
      />

      <div style={{ padding: '20px 24px 40px', flex: 1 }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>

          {/* Main tabs — pill style */}
          <div style={{ display: 'flex', gap: 6 }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 20,
                border: filter === f.key ? 'none' : '1.5px solid var(--line)',
                background: filter === f.key ? 'var(--accent)' : 'transparent',
                color: filter === f.key ? '#fff' : 'var(--ink-soft)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
              }}>
                {f.label}
                <span style={{ fontSize: 11, opacity: filter === f.key ? 0.75 : 0.45, fontWeight: 700 }}>{f.count}</span>
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Active filter tags — shown when filters are on */}
          {priorityFilter === 'high' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(193,98,63,0.1)', border: '1px solid rgba(193,98,63,0.3)',
              fontSize: 12, color: '#c1623f', fontWeight: 500,
            }}>
              ⚡ High
              <button onClick={() => setPriorityFilter('all')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#c1623f', padding: 0, fontSize: 14, lineHeight: 1, marginLeft: 2,
              }}>×</button>
            </div>
          )}
          {projectFilter && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 20,
              background: getProjectColor(projectFilter) + '15',
              border: `1px solid ${getProjectColor(projectFilter)}40`,
              fontSize: 12, color: getProjectColor(projectFilter), fontWeight: 500,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: getProjectColor(projectFilter) }} />
              {projectFilter}
              <button onClick={() => setProjectFilter('')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: getProjectColor(projectFilter), padding: 0, fontSize: 14, lineHeight: 1, marginLeft: 2,
              }}>×</button>
            </div>
          )}

          {/* Filter popover button */}
          <div ref={filterBtnRef} style={{ position: 'relative' }}>
            {(() => {
              const activeCount = (priorityFilter === 'high' ? 1 : 0) + (projectFilter ? 1 : 0);
              return (
                <button onClick={() => setFilterOpen(o => !o)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20,
                  border: `1.5px solid ${activeCount ? 'var(--accent)' : 'var(--line)'}`,
                  background: activeCount ? 'var(--accent-soft)' : 'transparent',
                  color: activeCount ? 'var(--accent)' : 'var(--ink-soft)',
                  fontSize: 13, fontWeight: activeCount ? 600 : 500,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                }}>
                  <Icon name="sort" size={13} />
                  Filter{activeCount > 0 ? ` · ${activeCount}` : ''}
                </button>
              );
            })()}

            {filterOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 300,
                background: 'var(--bg-elev)', border: '1px solid var(--line)',
                borderRadius: 12, padding: '14px 16px',
                boxShadow: '0 12px 36px rgba(0,0,0,0.14)', minWidth: 220,
                display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                {/* Priority */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-faint)', marginBottom: 8 }}>Priority</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {([['all', 'All'], ['high', '⚡ High']] as const).map(([val, label]) => (
                      <button key={val} onClick={() => setPriorityFilter(val)} style={{
                        flex: 1, padding: '5px 0', borderRadius: 7, fontSize: 12, fontWeight: 500,
                        border: `1.5px solid ${priorityFilter === val ? (val === 'high' ? '#c1623f' : 'var(--accent)') : 'var(--line)'}`,
                        background: priorityFilter === val ? (val === 'high' ? 'rgba(193,98,63,0.1)' : 'var(--accent-soft)') : 'transparent',
                        color: priorityFilter === val ? (val === 'high' ? '#c1623f' : 'var(--accent)') : 'var(--ink-soft)',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.13s',
                      }}>{label}</button>
                    ))}
                  </div>
                </div>

                {/* Project */}
                {projects.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-faint)', marginBottom: 8 }}>Project</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button onClick={() => setProjectFilter('')} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                        border: `1.5px solid ${!projectFilter ? 'var(--accent)' : 'transparent'}`,
                        background: !projectFilter ? 'var(--accent-soft)' : 'transparent',
                        color: !projectFilter ? 'var(--accent)' : 'var(--ink-soft)',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)', textAlign: 'left', transition: 'all 0.13s',
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--line)', flexShrink: 0 }} />
                        All projects
                      </button>
                      {projects.map(p => {
                        const active = projectFilter === p.name;
                        const col = getProjectColor(p.name);
                        return (
                          <button key={p.id} onClick={() => setProjectFilter(active ? '' : p.name)} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 10px', borderRadius: 7, fontSize: 12, fontWeight: active ? 600 : 400,
                            border: `1.5px solid ${active ? col + '60' : 'transparent'}`,
                            background: active ? col + '12' : 'transparent',
                            color: active ? col : 'var(--ink-soft)',
                            cursor: 'pointer', fontFamily: 'var(--font-sans)', textAlign: 'left', transition: 'all 0.13s',
                          }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-sunk)'; }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Clear all */}
                {(priorityFilter !== 'all' || projectFilter) && (
                  <button onClick={() => { setPriorityFilter('all'); setProjectFilter(''); }} style={{
                    padding: '5px 0', borderRadius: 7, border: 'none',
                    background: 'transparent', fontSize: 11, color: 'var(--ink-faint)',
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    borderTop: '1px solid var(--line)', marginTop: -4, paddingTop: 10,
                  }}>Clear all filters</button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Task groups */}
        <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {groups.map(group => (
            <div key={group.label}>
              {/* Group header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '3px 10px', borderRadius: 20,
                  background: group.color + '18',
                  border: `1px solid ${group.color}35`,
                  fontSize: 11, fontWeight: 600, color: 'var(--ink)',
                  flexShrink: 0,
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: group.color }} />
                  {group.label}
                </div>
                <span style={{
                  fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)',
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0,
                }}>
                  {group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              </div>

              {/* Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.tasks.map(t => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    projectColor={group.color}
                    onToggle={onToggle}
                    onEdit={setEditingTask}
                    onDelete={onDelete}
                    onFocus={setFocusTask}
                    subtasks={subtasksMap[t.id] ?? []}
                    onAddSubtask={onAddSubtask}
                    onToggleSubtask={onToggleSubtask}
                    onDeleteSubtask={onDeleteSubtask}
                    isNew={t.id === newTaskId}
                    onDismissNew={() => setNewTaskId(null)}
                  />
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-faint)' }}>
              <div className="serif" style={{ fontSize: 26, marginBottom: 8 }}>All clear ✦</div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>No tasks match this filter.</div>
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ marginTop: 20 }}>
                <Icon name="plus" size={13} /> Add your first task
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddModal && <TaskModal onAdd={onAdd} onClose={() => setShowAddModal(false)} />}
      {editingTask  && <TaskModal editTask={editingTask} onEdit={onEditSave} onClose={() => setEditingTask(null)} />}
      {focusTask    && <PomodoroTimer task={focusTask} onClose={() => setFocusTask(null)} />}

      {/* Photo-to-task feature */}
      {showCamera && (
        <CameraCapture
          onTasksExtracted={handleTasksExtracted}
          onClose={() => setShowCamera(false)}
        />
      )}
      {showReview && (
        <TaskReview
          tasks={extractedTasks}
          onConfirm={handleConfirmTasks}
          onClose={() => setShowReview(false)}
        />
      )}
    </div>
  );
}
