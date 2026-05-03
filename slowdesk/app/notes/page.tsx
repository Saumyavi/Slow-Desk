'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { INITIAL_NOTES, TONE_COLORS, Note, Task, relativeTime } from '@/lib/data';
import { useApp } from '@/lib/store';
import Topbar from '@/components/Topbar';
import Icon from '@/components/Icon';
import TaskModal from '@/components/TaskModal';

/* ── Decorative SVG ──────────────────────────────────────── */
const SparkSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    style={{ color: '#c9943a', opacity: 0.9 }}>
    <path d="m12 3 1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z"/>
  </svg>
);

/* ── Gratitude types ─────────────────────────────────────── */
interface GratitudeEntry {
  grateful: string;
  smile: string;
  remember: string;
}

/* ── Note item (sidebar) ─────────────────────────────────── */
function NoteItem({ note, active, preview, onClick, onDelete }: {
  note: Note; active: boolean; preview: string;
  onClick: () => void; onDelete: () => void;
}) {
  const color = TONE_COLORS[note.tone];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '12px 14px', borderRadius: 10, cursor: 'pointer', position: 'relative',
        background: active ? 'var(--accent-soft)' : hovered ? 'var(--bg-sunk)' : 'transparent',
        transition: 'background 0.13s',
      }}
    >
      <div style={{ display: 'flex', gap: 9 }}>
        {/* colored tone dot */}
        <div style={{
          width: 8, height: 8, borderRadius: 2, background: color,
          flexShrink: 0, marginTop: 5,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: 'var(--ink)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginBottom: 3,
          }}>
            {note.title}
          </div>
          <div style={{
            fontSize: 11, color: 'var(--ink-faint)', lineHeight: 1.5,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            marginBottom: 6,
          }}>
            {preview || 'Empty note…'}
          </div>
          <div style={{
            fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            {note.updatedAt ? relativeTime(note.updatedAt) : note.updated}
          </div>
        </div>
      </div>

      {hovered && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 20, height: 20, borderRadius: 5,
            background: 'var(--bg-elev)', border: '1px solid var(--line)',
            cursor: 'pointer', display: 'grid', placeItems: 'center',
            color: 'var(--ink-faint)', transition: 'all 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#e05c3c'; e.currentTarget.style.color = '#e05c3c'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink-faint)'; }}
        >
          <Icon name="x" size={10} />
        </button>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function NotesPage() {
  const { tasks, setTasks, projects, fireConfetti, user } = useApp();
  const email = user?.email ?? 'guest';
  const noteKey = `sd:${email}:notes`;
  const gratKey = `sd:${email}:gratitude`;

  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window === 'undefined') return INITIAL_NOTES;
    try { const s = localStorage.getItem(`sd:${email}:notes`); return s ? JSON.parse(s) : INITIAL_NOTES; } catch { return INITIAL_NOTES; }
  });
  const [activeId, setActiveId] = useState<string>(() => notes[0]?.id ?? '');
  const [content, setContent] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return Object.fromEntries(INITIAL_NOTES.map(n => [n.id, n.preview]));
    try {
      const s = localStorage.getItem(`sd:${email}:noteContent`);
      return s ? JSON.parse(s) : Object.fromEntries(notes.map(n => [n.id, n.preview]));
    } catch { return Object.fromEntries(notes.map(n => [n.id, n.preview])); }
  });
  const [saved,          setSaved]          = useState(false);
  const [gratitude,      setGratitude]      = useState<GratitudeEntry>(() => {
    if (typeof window === 'undefined') return { grateful: '', smile: '', remember: '' };
    try { const s = localStorage.getItem(gratKey); return s ? JSON.parse(s) : { grateful: '', smile: '', remember: '' }; } catch { return { grateful: '', smile: '', remember: '' }; }
  });
  const [gratOpen,       setGratOpen]       = useState(false);
  const [showAddTask,    setShowAddTask]    = useState(false);
  const [editingTask,    setEditingTask]    = useState<Task | null>(null);

  // Auto-save notes
  useEffect(() => { localStorage.setItem(noteKey, JSON.stringify(notes)); }, [notes, noteKey]);
  useEffect(() => { localStorage.setItem(`sd:${email}:noteContent`, JSON.stringify(content)); }, [content, email]);
  useEffect(() => { localStorage.setItem(gratKey, JSON.stringify(gratitude)); }, [gratitude, gratKey]);

  const editorRef     = useRef<HTMLTextAreaElement>(null);
  const listRef       = useRef<HTMLDivElement>(null);
  const editorAreaRef = useRef<HTMLDivElement>(null);

  const activeNote = notes.find(n => n.id === activeId);

  /* animate sidebar list on mount */
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-note]');
    gsap.fromTo(items,
      { x: -14, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.05, duration: 0.32, ease: 'power2.out', delay: 0.08 }
    );
  }, []);

  /* fade-in editor on note switch */
  useEffect(() => {
    if (!editorAreaRef.current) return;
    gsap.fromTo(editorAreaRef.current,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out' }
    );
    setTimeout(() => editorRef.current?.focus(), 60);
  }, [activeId]);

  const [dateStr, setDateStr] = useState('');
  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
  }, []);

  const onNoteChange = (val: string) => {
    setContent(prev => ({ ...prev, [activeId]: val }));
    setNotes(prev => prev.map(n =>
      n.id === activeId ? { ...n, preview: val.slice(0, 140) } : n
    ));
    setSaved(false);
  };

  const saveNote = () => {
    const iso = new Date().toISOString();
    setNotes(prev => prev.map(n =>
      n.id === activeId ? { ...n, updated: 'just now', updatedAt: iso, preview: (content[activeId] || '').slice(0, 140) } : n
    ));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addNote = () => {
    const id = `n${Date.now()}`;
    const newNote: Note = { id, title: 'Untitled note', updated: 'just now', updatedAt: new Date().toISOString(), tone: 'terra', preview: '' };
    setNotes(prev => [newNote, ...prev]);
    setContent(prev => ({ ...prev, [id]: '' }));
    setActiveId(id);
  };

  const deleteNote = (id: string) => {
    const remaining = notes.filter(n => n.id !== id);
    setNotes(remaining);
    if (activeId === id) setActiveId(remaining[0]?.id ?? '');
  };

  const onAddTask = useCallback((partial: Omit<Task, 'id'>) => {
    setTasks(prev => [{ ...partial, id: `t${Date.now()}` }, ...prev]);
  }, [setTasks]);

  const onEditTask = useCallback((updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTask(null);
  }, [setTasks]);

  const wordCount = (content[activeId] || '').trim().split(/\s+/).filter(Boolean).length;

  const setGrat = (key: keyof GratitudeEntry, val: string) =>
    setGratitude(prev => ({ ...prev, [key]: val }));

  const gratInputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8, boxSizing: 'border-box',
    border: '1.5px solid rgba(201,148,58,0.25)', background: 'rgba(201,148,58,0.06)',
    fontSize: 13, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-sans)',
    transition: 'border-color 0.15s', resize: 'none', lineHeight: 1.5,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar
        title="Notes & journal"
        subtitle={`${notes.length} notes${activeNote ? ` · last updated ${activeNote.updatedAt ? relativeTime(activeNote.updatedAt) : activeNote.updated}` : ''}`}
        action={
          <button className="btn btn-primary" onClick={() => setShowAddTask(true)}>
            <Icon name="plus" size={14} /> New task
          </button>
        }
      />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '284px 1fr', minHeight: 0 }}>

        {/* ── sidebar ─────────────────────────────────────── */}
        <div style={{
          borderRight: '1px solid var(--line)',
          display: 'flex', flexDirection: 'column', minHeight: 0,
        }}>
          {/* New note button */}
          <div style={{ padding: '16px 14px 10px', flexShrink: 0 }}>
            <button
              onClick={addNote}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 10,
                background: 'var(--accent)', border: 'none', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'var(--font-sans)', transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Icon name="plus" size={14} /> New note
            </button>
          </div>

          {/* Note list — shows ALL notes */}
          <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '0 6px 20px' }}>
            {notes.map(n => (
              <div key={n.id} data-note>
                <NoteItem
                  note={n}
                  active={activeId === n.id}
                  preview={content[n.id] || ''}
                  onClick={() => setActiveId(n.id)}
                  onDelete={() => deleteNote(n.id)}
                />
              </div>
            ))}
            {notes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '36px 0', fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                No notes yet. Create one above.
              </div>
            )}
          </div>

          {/* footer */}
          <div style={{ padding: '10px 16px 14px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>write freely, often</span>
          </div>
        </div>

        {/* ── editor ──────────────────────────────────────── */}
        {activeNote ? (
          <div ref={editorAreaRef} style={{
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
            padding: '28px 36px 40px',
          }}>

            {/* top meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: TONE_COLORS[activeNote.tone], flexShrink: 0,
              }} />
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                Updated {activeNote.updatedAt ? relativeTime(activeNote.updatedAt) : activeNote.updated}
              </span>
              <div style={{ flex: 1 }} />
              {/* tone swatches */}
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {(['terra','sage','butter','plum','sky'] as Note['tone'][]).map(t => (
                  <button key={t} onClick={() => setNotes(prev => prev.map(n => n.id === activeId ? { ...n, tone: t } : n))} style={{
                    width: 13, height: 13, borderRadius: '50%', background: TONE_COLORS[t],
                    border: activeNote.tone === t ? '2px solid var(--ink)' : '2px solid transparent',
                    outline: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.12s',
                    transform: activeNote.tone === t ? 'scale(1.2)' : 'scale(1)',
                  }} />
                ))}
                <button onClick={() => deleteNote(activeId)} style={{
                  width: 28, height: 28, borderRadius: 7, border: '1px solid var(--line)',
                  background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center',
                  color: 'var(--ink-faint)', marginLeft: 4, transition: 'all 0.12s',
                }}
                  title="Delete note"
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#e05c3c'; e.currentTarget.style.color = '#e05c3c'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink-faint)'; }}
                >
                  <Icon name="trash" size={12} />
                </button>
              </div>
            </div>

            {/* large serif title */}
            <input
              value={activeNote.title}
              onChange={e => setNotes(prev => prev.map(n => n.id === activeId ? { ...n, title: e.target.value } : n))}
              placeholder="Untitled note"
              style={{
                border: 'none', background: 'transparent', outline: 'none', padding: 0,
                fontSize: 44, fontWeight: 400, lineHeight: 1.15, color: 'var(--ink)',
                fontFamily: 'var(--font-display)', width: '100%',
                marginBottom: 24,
              }}
            />

            {/* body textarea */}
            <textarea
              ref={editorRef}
              value={content[activeId] || ''}
              onChange={e => onNoteChange(e.target.value)}
              placeholder={`Start writing…\n\nThis space is just for you.`}
              style={{
                flex: 1, border: 'none', background: 'transparent', outline: 'none',
                fontSize: 15, lineHeight: 1.85, color: 'var(--ink)',
                fontFamily: 'var(--font-sans)', resize: 'none', minHeight: 260,
              }}
            />

            {/* status bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              paddingTop: 12, marginTop: 16, borderTop: '1px solid var(--line)',
            }}>
              <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{wordCount} words</span>
              <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{(content[activeId] || '').length} chars</span>
              {dateStr && (
                <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{dateStr}</span>
              )}
              <div style={{ flex: 1 }} />
              {saved && (
                <span style={{ fontSize: 11, color: '#7a9e7e', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="check" size={11} /> Saved
                </span>
              )}
              <button onClick={saveNote} style={{
                padding: '5px 16px', borderRadius: 7, border: '1px solid var(--line)',
                background: 'var(--bg-sunk)', fontSize: 12, fontWeight: 500,
                color: 'var(--ink-soft)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'all 0.13s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink-soft)'; }}
              >Save</button>
            </div>

            {/* ── gratitude section (unchanged) ── */}
            <div style={{
              borderRadius: 12, overflow: 'hidden',
              border: '1px solid rgba(201,148,58,0.3)',
              background: 'linear-gradient(135deg, rgba(201,148,58,0.06) 0%, rgba(193,98,63,0.04) 100%)',
              marginTop: 20,
            }}>
              <button onClick={() => setGratOpen(o => !o)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}>
                <SparkSvg />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#c9943a', flex: 1, textAlign: 'left' }}>Today I'm grateful</span>
                <Icon name="chevronD" size={13} style={{ color: '#c9943a', opacity: 0.7, transform: gratOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {gratOpen && (
                <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { key: 'grateful' as const, label: '✨ I am grateful for…',  placeholder: 'Something you appreciate today' },
                    { key: 'smile'    as const, label: '😊 What made me smile…', placeholder: 'A small moment that lifted you' },
                    { key: 'remember' as const, label: '📌 I want to remember…', placeholder: 'A thought, feeling, or memory' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(201,148,58,0.85)', marginBottom: 5 }}>{label}</div>
                      <textarea
                        value={gratitude[key]}
                        onChange={e => setGrat(key, e.target.value)}
                        placeholder={placeholder}
                        rows={2}
                        style={gratInputStyle}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,148,58,0.6)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(201,148,58,0.25)')}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* empty state */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ color: 'var(--ink-faint)', opacity: 0.35 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
            <div style={{ fontSize: 13, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
              Select a note or create one
            </div>
            <button className="btn btn-primary" onClick={addNote}>
              <Icon name="plus" size={14} /> New note
            </button>
          </div>
        )}
      </div>

      {showAddTask  && <TaskModal onAdd={onAddTask} onClose={() => setShowAddTask(false)} />}
      {editingTask  && <TaskModal editTask={editingTask} onEdit={onEditTask} onClose={() => setEditingTask(null)} />}
    </div>
  );
}
