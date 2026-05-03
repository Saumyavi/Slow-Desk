'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { useApp } from '@/lib/store';
import { TONE_COLORS, Task } from '@/lib/data';
import Topbar from '@/components/Topbar';
import Icon from '@/components/Icon';
import TaskModal from '@/components/TaskModal';

type Filter = 'all' | 'today' | 'upcoming' | 'completed';

/* ── Task row ──────────────────────────────────────────── */
function TaskItem({ task, projectColor, onToggle, onEdit, onDelete }: {
  task: Task;
  projectColor: string;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const rowRef   = useRef<HTMLDivElement>(null);
  const checkRef = useRef<HTMLButtonElement>(null);
  const menuRef  = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

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

  const showTime = task.time && task.time !== '—';

  return (
    <div
      ref={rowRef}
      data-taskrow
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 16px',
        background: 'var(--bg-elev)',
        borderRadius: 10,
        border: '1px solid var(--line)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(193,98,63,0.25)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--line)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Checkbox */}
      <button
        ref={checkRef}
        onClick={handleToggle}
        style={{
          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
          border: task.done ? 'none' : '1.5px solid var(--ink-faint)',
          background: task.done ? 'var(--accent)' : 'transparent',
          display: 'grid', placeItems: 'center', cursor: 'pointer',
          transition: 'all 0.15s',
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
          marginBottom: 3,
        }}>{task.title}</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {showTime && (
            <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{task.time}</span>
          )}
          {task.attach > 0 && (
            <>
              {showTime && <span style={{ fontSize: 11, color: 'var(--ink-faint)', opacity: 0.4 }}>·</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: 'var(--ink-faint)' }}>
                <Icon name="paperclip" size={10} />{task.attach}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* Project chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20,
          background: projectColor + '18',
          border: `1px solid ${projectColor}40`,
          fontSize: 11, fontWeight: 500, color: 'var(--ink-soft)',
          maxWidth: 160,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: projectColor, flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.project}</span>
        </div>

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
                padding: '7px 10px', borderRadius: 6, border: 'none',
                background: 'transparent', cursor: 'pointer',
                fontSize: 12, color: 'var(--ink)', fontFamily: 'var(--font-sans)', textAlign: 'left',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-sunk)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Icon name="edit" size={12} /> Edit
              </button>
              <button onClick={() => { handleDelete(); setMenuOpen(false); }} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 10px', borderRadius: 6, border: 'none',
                background: 'transparent', cursor: 'pointer',
                fontSize: 12, color: '#e05c3c', fontFamily: 'var(--font-sans)', textAlign: 'left',
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
  );
}

/* ── Page ──────────────────────────────────────────────── */
export default function TasksPage() {
  const { tasks, setTasks, projects, toggleTask } = useApp();
  const [filter,         setFilter]         = useState<Filter>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high'>('all');
  const [projectFilter,  setProjectFilter]  = useState<string>('');
  const [filterOpen,     setFilterOpen]     = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const listRef      = useRef<HTMLDivElement>(null);
  const filterBtnRef = useRef<HTMLDivElement>(null);

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

  const onDelete = useCallback((id: string) => {
    setTasks(prev => prev.filter(x => x.id !== id));
  }, [setTasks]);

  const onAdd = useCallback((partial: Omit<Task, 'id'>) => {
    setTasks(prev => [{ ...partial, id: `t${Date.now()}` }, ...prev]);
  }, [setTasks]);

  const onEditSave = useCallback((updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTask(null);
  }, [setTasks]);

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
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Icon name="plus" size={14} /> New task
          </button>
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
    </div>
  );
}
