'use client';
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { TONE_COLORS, Tone, ProjectData, Task, computeProgress } from '@/lib/data';
import { useApp } from '@/lib/store';
import Topbar from '@/components/Topbar';
import Icon from '@/components/Icon';

const TONE_OPTIONS: Tone[] = ['terra', 'sage', 'butter', 'plum', 'sky'];
const TONE_LABELS: Record<Tone, string> = { terra: 'Terracotta', sage: 'Sage', butter: 'Butter', plum: 'Plum', sky: 'Sky' };

/* ── Project Modal ───────────────────────────────────────── */
function ProjectModal({ editProject, onSave, onDelete, onClose }: {
  editProject?: ProjectData;
  onSave: (data: Omit<ProjectData, 'id'>) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const isEdit = !!editProject;
  const [name,  setName]  = useState(editProject?.name  ?? '');
  const [short, setShort] = useState(editProject?.short ?? '');
  const [tone,  setTone]  = useState<Tone>(editProject?.tone ?? 'terra');
  const [due,   setDue]   = useState(editProject?.due   ?? '');
  const [desc,  setDesc]  = useState(editProject?.desc  ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18 });
    gsap.fromTo(panelRef.current, { y: 24, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.28, ease: 'power3.out' });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const close = () => {
    gsap.to(panelRef.current,   { y: 12, opacity: 0, scale: 0.97, duration: 0.16, ease: 'power2.in' });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.18, onComplete: onClose });
  };

  const submit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), short: (short || name.slice(0, 2)).toUpperCase(), tone, due, desc });
    close();
  };

  const color = TONE_COLORS[tone];

  const fieldLabel = (text: string) => (
    <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-faint)', display: 'block', marginBottom: 6 }}>{text}</label>
  );
  const iStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8, boxSizing: 'border-box',
    border: '1.5px solid var(--line)', background: 'var(--bg-sunk)',
    fontSize: 13, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s',
  };

  return (
    <div ref={overlayRef} onClick={e => e.target === overlayRef.current && close()} style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div ref={panelRef} style={{
        width: 460, background: 'var(--bg-elev)', borderRadius: 18,
        boxShadow: '0 28px 72px rgba(0,0,0,0.28)', border: '1px solid var(--line)', overflow: 'hidden',
      }}>
        <div style={{ height: 4, background: color, transition: 'background 0.2s' }} />

        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px 12px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{isEdit ? 'Edit project' : 'New project'}</span>
          <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 4 }}><Icon name="x" size={16} /></button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
            <div>
              {fieldLabel('Project name')}
              <input ref={inputRef} value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="e.g. Folio v3 Redesign"
                style={{ ...iStyle, fontSize: 14 }}
                onFocus={e => (e.currentTarget.style.borderColor = color)}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
              />
            </div>
            <div>
              {fieldLabel('Short')}
              <input value={short} onChange={e => setShort(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="F3"
                style={{ ...iStyle, textAlign: 'center', fontWeight: 700, letterSpacing: '0.05em' }}
                onFocus={e => (e.currentTarget.style.borderColor = color)}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
              />
            </div>
          </div>

          <div>
            {fieldLabel('Color / tone')}
            <div style={{ display: 'flex', gap: 8 }}>
              {TONE_OPTIONS.map(t => (
                <button key={t} onClick={() => setTone(t)} title={TONE_LABELS[t]} style={{
                  width: 28, height: 28, borderRadius: '50%', background: TONE_COLORS[t],
                  border: tone === t ? '3px solid var(--ink)' : '3px solid transparent',
                  outline: '1.5px solid rgba(0,0,0,0.12)', cursor: 'pointer', transition: 'transform 0.12s',
                  transform: tone === t ? 'scale(1.18)' : 'scale(1)',
                }} />
              ))}
            </div>
          </div>

          <div>
            {fieldLabel('Due date')}
            <input value={due} onChange={e => setDue(e.target.value)} placeholder="e.g. May 22"
              style={iStyle}
              onFocus={e => (e.currentTarget.style.borderColor = color)}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
            />
          </div>

          <div>
            {fieldLabel('Description (optional)')}
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="What is this project about?" rows={2}
              style={{ ...iStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => (e.currentTarget.style.borderColor = color)}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--line)', background: 'var(--bg-sunk)' }}>
          {isEdit && onDelete && (
            <button onClick={() => { if (confirmDelete) { onDelete(); close(); } else setConfirmDelete(true); }} style={{
              padding: '7px 14px', borderRadius: 8,
              border: `1px solid ${confirmDelete ? '#e05c3c' : 'var(--line)'}`,
              background: confirmDelete ? 'rgba(224,92,60,0.1)' : 'transparent',
              color: confirmDelete ? '#e05c3c' : 'var(--ink-soft)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Icon name="trash" size={12} />
              {confirmDelete ? 'Confirm delete' : 'Delete project'}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={close} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Cancel</button>
          <button onClick={submit} disabled={!name.trim()} style={{
            padding: '7px 20px', borderRadius: 8, border: 'none',
            background: name.trim() ? color : 'var(--bg-sunk)',
            color: name.trim() ? '#fff' : 'var(--ink-faint)',
            fontSize: 13, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
          }}>{isEdit ? 'Save changes' : 'Create project'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Project Card ────────────────────────────────────────── */
function ProjectCard({ project, projectTasks, index, onEdit }: {
  project: ProjectData;
  projectTasks: Task[];
  index: number;
  onEdit: () => void;
}) {
  const { setTasks } = useApp();
  const cardRef = useRef<HTMLDivElement>(null);
  const [expanded,    setExpanded]    = useState(false);
  const [hovered,     setHovered]     = useState(false);
  const [addingTask,  setAddingTask]  = useState(false);
  const [newTask,     setNewTask]     = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editVal,     setEditVal]     = useState('');

  const color    = TONE_COLORS[project.tone];
  const progress = computeProgress(projectTasks);
  const doneCount = projectTasks.filter(t => t.done).length;

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out', delay: index * 0.07 });
  }, [index]);

  const toggleTask = (id: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const deleteTask = (id: string) =>
    setTasks(prev => prev.filter(t => t.id !== id));

  const submitNewTask = () => {
    if (!newTask.trim()) return;
    const newT: Task = {
      id: `t${Date.now()}`,
      title: newTask.trim(),
      done: false,
      project: project.name,
      tone: project.tone,
      attach: 0,
      due: 'today',
      time: '—',
      priority: 'medium',
    };
    setTasks(prev => [...prev, newT]);
    setNewTask(''); setAddingTask(false);
  };

  const submitEditTask = (id: string) => {
    if (!editVal.trim()) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title: editVal.trim() } : t));
    setEditingTask(null); setEditVal('');
  };

  return (
    <div ref={cardRef} className="proj-card" style={{ opacity: 0 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: color + '22', display: 'grid', placeItems: 'center',
          color, fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', fontStyle: 'italic',
        }}>{project.short[0]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{project.name}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.desc || 'No description.'}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{progress}%</div>
          {project.due && <div style={{ fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>due {project.due}</div>}
        </div>
      </div>

      {/* progress bar */}
      <div className="bar" style={{ marginBottom: 12 }}>
        <i style={{ display: 'block', height: '100%', width: `${progress}%`, background: color, borderRadius: 2, transition: 'width 0.45s ease' }} />
      </div>

      {/* footer row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setExpanded(e => !e)} style={{
          display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 11, color: 'var(--ink-faint)', padding: 0, fontFamily: 'var(--font-sans)',
        }}>
          <Icon name="chevronD" size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          {doneCount}/{projectTasks.length} tasks
        </button>
        <div style={{ flex: 1 }} />
        <span className="tag" style={{ background: color + '22', color }}>{project.tone}</span>
        {hovered && (
          <button onClick={e => { e.stopPropagation(); onEdit(); }} style={{
            width: 26, height: 26, borderRadius: 6, border: '1px solid var(--line)',
            background: 'var(--bg-sunk)', cursor: 'pointer', display: 'grid', placeItems: 'center',
            color: 'var(--ink-soft)', transition: 'all 0.12s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink-soft)'; }}
          ><Icon name="edit" size={11} /></button>
        )}
      </div>

      {/* expanded task list */}
      {expanded && (
        <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {projectTasks.length === 0 && !addingTask && (
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic', paddingBottom: 4 }}>No tasks yet.</div>
          )}
          {projectTasks.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', borderRadius: 6 }}>
              <button onClick={e => { e.stopPropagation(); toggleTask(t.id); }} style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                border: `1.5px solid ${t.done ? color : 'var(--line)'}`,
                background: t.done ? color : 'transparent',
                cursor: 'pointer', display: 'grid', placeItems: 'center', transition: 'all 0.18s',
              }}>
                {t.done && <Icon name="check" size={9} style={{ color: '#fff' }} />}
              </button>

              {editingTask === t.id ? (
                <input value={editVal} onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitEditTask(t.id); if (e.key === 'Escape') setEditingTask(null); }}
                  autoFocus
                  style={{
                    flex: 1, padding: '2px 6px', borderRadius: 4, fontSize: 12,
                    border: `1.5px solid ${color}`, background: 'var(--bg-sunk)',
                    color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-sans)',
                  }}
                />
              ) : (
                <span onDoubleClick={() => { setEditingTask(t.id); setEditVal(t.title); }}
                  title="Double-click to edit"
                  style={{
                    flex: 1, fontSize: 12, cursor: 'text',
                    color: t.done ? 'var(--ink-faint)' : 'var(--ink)',
                    textDecoration: t.done ? 'line-through' : 'none',
                  }}>{t.title}</span>
              )}

              <button onClick={e => { e.stopPropagation(); deleteTask(t.id); }} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--ink-faint)', opacity: 0, transition: 'opacity 0.15s', padding: 2,
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; (e.currentTarget.style as React.CSSProperties).color = '#e05c3c'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.color = 'var(--ink-faint)'; }}
              ><Icon name="x" size={10} /></button>
            </div>
          ))}

          {addingTask ? (
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }} onClick={e => e.stopPropagation()}>
              <input value={newTask} onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitNewTask(); if (e.key === 'Escape') { setAddingTask(false); setNewTask(''); } }}
                placeholder="Task title…" autoFocus
                style={{
                  flex: 1, padding: '5px 8px', borderRadius: 6, fontSize: 12,
                  border: `1.5px solid ${color}`, background: 'var(--bg-sunk)',
                  color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-sans)',
                }}
              />
              <button onClick={submitNewTask} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: color, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Add</button>
              <button onClick={() => { setAddingTask(false); setNewTask(''); }} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--line)', background: 'transparent', fontSize: 11, cursor: 'pointer', color: 'var(--ink-soft)' }}>✕</button>
            </div>
          ) : (
            <button onClick={e => { e.stopPropagation(); setAddingTask(true); }} style={{
              display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 11, color, padding: '4px 0',
              fontFamily: 'var(--font-sans)', fontWeight: 500, marginTop: 2,
            }}>
              <Icon name="plus" size={11} /> Add task
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function ProjectsPage() {
  const { projects, setProjects, tasks } = useApp();
  const [modal, setModal] = useState<{ project?: ProjectData } | null>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statsRef.current) return;
    gsap.fromTo(statsRef.current.querySelectorAll('.stat-pill'),
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, stagger: 0.06, duration: 0.35, ease: 'back.out(1.4)', delay: 0.1 }
    );
  }, []);

  const saveProject = (data: Omit<ProjectData, 'id'>, editId?: string) => {
    if (editId) {
      setProjects(prev => prev.map(p => p.id === editId ? { ...p, ...data } : p));
    } else {
      setProjects(prev => [...prev, { id: `p${Date.now()}`, ...data }]);
    }
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const getProjectTasks = (projectName: string) => tasks.filter(t => t.project === projectName);

  const allProjectTasks = tasks.filter(t => projects.some(p => p.name === t.project));
  const doneTasks       = allProjectTasks.filter(t => t.done).length;
  const avgProgress     = projects.length
    ? Math.round(projects.reduce((s, p) => s + computeProgress(getProjectTasks(p.name)), 0) / projects.length)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      <Topbar
        title="Projects"
        subtitle={`${projects.length} active · ${avgProgress}% avg progress`}
        action={
          <button className="btn btn-primary" onClick={() => setModal({})}>
            <Icon name="plus" size={14} /> New project
          </button>
        }
      />

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* live stats */}
        <div ref={statsRef} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Projects',     value: projects.length,          icon: 'projects' as const },
            { label: 'Tasks total',  value: allProjectTasks.length,   icon: 'list'     as const },
            { label: 'Completed',    value: doneTasks,                 icon: 'check'    as const },
            { label: 'Avg progress', value: `${avgProgress}%`,        icon: 'sparkle'  as const },
          ].map(s => (
            <div key={s.label} className="card stat-pill" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', flex: '1 1 140px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', color: 'var(--accent)' }}>
                <Icon name={s.icon} size={16} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* portfolio overview */}
        {projects.length > 0 && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Portfolio overview</h3>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)' }}>{avgProgress}% across all</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map(p => {
                const prog = computeProgress(getProjectTasks(p.name));
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 80, fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{p.short}</div>
                    <div className="bar" style={{ flex: 1 }}>
                      <i style={{ display: 'block', height: '100%', width: `${prog}%`, background: TONE_COLORS[p.tone], borderRadius: 2, transition: 'width 0.45s ease' }} />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)', width: 32, textAlign: 'right' }}>{prog}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* cards */}
        {projects.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 20px', border: '1px dashed var(--line)', background: 'transparent' }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>📁</div>
            <div className="serif" style={{ fontSize: 18, marginBottom: 6 }}>No projects yet</div>
            <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 20 }}>Create your first project to start tracking progress.</div>
            <button className="btn btn-primary" onClick={() => setModal({})}>
              <Icon name="plus" size={14} /> New project
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {projects.map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                projectTasks={getProjectTasks(p.name)}
                index={i}
                onEdit={() => setModal({ project: p })}
              />
            ))}
          </div>
        )}
      </div>

      {modal && (
        <ProjectModal
          editProject={modal.project}
          onSave={data => saveProject(data, modal.project?.id)}
          onDelete={modal.project ? () => deleteProject(modal.project!.id) : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
