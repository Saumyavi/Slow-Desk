'use client';
import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Task } from '@/lib/data';
import { useApp } from '@/lib/store';
import Icon from './Icon';

interface TaskModalProps {
  editTask?: Task;
  onAdd?: (task: Omit<Task, 'id'>) => void;
  onEdit?: (task: Task) => void;
  onClose: () => void;
}

function Chip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
      border: active ? `1.5px solid ${color || 'var(--accent)'}` : '1.5px solid var(--line)',
      background: active ? (color ? color + '18' : 'var(--accent-soft)') : 'transparent',
      color: active ? (color || 'var(--accent)') : 'var(--ink-soft)',
      transition: 'all 0.13s', fontFamily: 'var(--font-sans)',
    }}>{label}</button>
  );
}

export default function TaskModal({ editTask, onAdd, onEdit, onClose }: TaskModalProps) {
  const { projects } = useApp();
  const isEdit = !!editTask;
  const [title, setTitle] = useState(editTask?.title ?? '');
  const [due, setDue] = useState<Task['due']>(editTask?.due ?? 'today');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(editTask?.priority ?? 'medium');
  const [project, setProject] = useState(editTask?.project ?? projects[0]?.name ?? '');
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    gsap.fromTo(panelRef.current,
      { y: 24, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 0.28, ease: 'power3.out' }
    );
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const close = () => {
    gsap.to(panelRef.current, { y: 12, opacity: 0, scale: 0.97, duration: 0.18, ease: 'power2.in' });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, onComplete: onClose });
  };

  const submit = () => {
    if (!title.trim()) return;
    if (isEdit && editTask && onEdit) {
      onEdit({ ...editTask, title: title.trim(), due, priority, project });
    } else if (onAdd) {
      onAdd({ title: title.trim(), done: false, project: project || 'Inbox', tone: 'terra', attach: 0, due, time: '—', priority });
    }
    close();
  };

  return (
    <div ref={overlayRef} onClick={e => e.target === overlayRef.current && close()} style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div ref={panelRef} style={{
        width: 420, background: 'var(--bg-elev)', borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)', border: '1px solid var(--line)',
        overflow: 'hidden',
      }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{isEdit ? 'Edit task' : 'New task'}</span>
          <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 4 }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-faint)', display: 'block', marginBottom: 6 }}>Task</label>
            <input ref={inputRef} value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="What needs to get done?"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1.5px solid var(--line)', background: 'var(--bg-sunk)',
                fontSize: 14, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-sans)',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-faint)', display: 'block', marginBottom: 8 }}>Due date</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Chip label="Today"     active={due === 'today'}     onClick={() => setDue('today')} />
              <Chip label="Tomorrow"  active={due === 'tomorrow'}   onClick={() => setDue('tomorrow')} />
              <Chip label="This week" active={due === 'this week'}  onClick={() => setDue('this week')} />
              <Chip label="Next week" active={due === 'next week'}  onClick={() => setDue('next week')} />
              <Chip label="Someday"   active={due === 'someday'}    onClick={() => setDue('someday')} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-faint)', display: 'block', marginBottom: 8 }}>Priority</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <Chip label="⚡ High"  active={priority === 'high'}   onClick={() => setPriority('high')}   color="#c1623f" />
              <Chip label="Medium"   active={priority === 'medium'} onClick={() => setPriority('medium')} color="#c9943a" />
              <Chip label="Low"      active={priority === 'low'}    onClick={() => setPriority('low')}    color="#7a9e7e" />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-faint)', display: 'block', marginBottom: 8 }}>Project</label>
            <select value={project} onChange={e => setProject(e.target.value)} style={{
              width: '100%', padding: '9px 12px', borderRadius: 8,
              border: '1.5px solid var(--line)', background: 'var(--bg-sunk)',
              fontSize: 13, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-sans)', cursor: 'pointer',
            }}>
              <option value="Inbox">Inbox (no project)</option>
              {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* footer */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '14px 20px', borderTop: '1px solid var(--line)', background: 'var(--bg-sunk)' }}>
          <button onClick={close} style={{
            padding: '8px 18px', borderRadius: 8, border: '1px solid var(--line)',
            background: 'transparent', fontSize: 13, color: 'var(--ink-soft)',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}>Cancel</button>
          <button onClick={submit} disabled={!title.trim()} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            background: title.trim() ? 'var(--accent)' : 'var(--bg-sunk)',
            color: title.trim() ? '#fff' : 'var(--ink-faint)',
            fontSize: 13, fontWeight: 600, cursor: title.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
          }}>{isEdit ? 'Save changes' : 'Add task'}</button>
        </div>
      </div>
    </div>
  );
}
