'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { INITIAL_NOTES, TONE_COLORS, Note, Task, relativeTime } from '@/lib/data';
import { useApp } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import * as db from '@/lib/supabase/db';
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
  const supabase = createClient();
  const { tasks, setTasks, projects, setProjects, fireConfetti, user } = useApp();
  const email = user?.email ?? 'guest';
  const todayDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
  const gratKey = `sd:${email}:gratitude:${todayDate}`;

  const [userId, setUserId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [content, setContent] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gratitude, setGratitude] = useState<GratitudeEntry>(() => {
    if (typeof window === 'undefined') return { grateful: '', smile: '', remember: '' };
    try { const s = localStorage.getItem(gratKey); return s ? JSON.parse(s) : { grateful: '', smile: '', remember: '' }; } catch { return { grateful: '', smile: '', remember: '' }; }
  });
  const [gratOpen, setGratOpen] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAITip, setShowAITip] = useState(false);

  // Load user and notes from Supabase
  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || !mounted) return;
      setUserId(user.id);

      // Load notes from Supabase
      const notesData = await db.getNotes(user.id);
      if (!mounted) return;

      const noteIdParam = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('noteId') : null;

      if (notesData.length === 0) {
        // Create initial notes if none exist
        for (const note of INITIAL_NOTES) {
          await db.createNote(user.id, note.title, note.preview, note.tone);
        }
        const freshNotes = await db.getNotes(user.id);
        if (!mounted) return;

        setNotes(freshNotes);
        const targetId = noteIdParam && freshNotes.find(n => n.id === noteIdParam)
          ? noteIdParam : (freshNotes[0]?.id ?? '');
        setActiveId(targetId);
        if (noteIdParam) window.history.replaceState({}, '', window.location.pathname);

        // Load content for each note
        const contentMap: Record<string, string> = {};
        for (const n of freshNotes) {
          const fullNote = await db.getNote(user.id, n.id);
          if (fullNote) contentMap[n.id] = fullNote.content || '';
        }
        if (mounted) setContent(contentMap);
      } else {
        setNotes(notesData);
        const targetId = noteIdParam && notesData.find(n => n.id === noteIdParam)
          ? noteIdParam : (notesData[0]?.id ?? '');
        setActiveId(targetId);
        if (noteIdParam) window.history.replaceState({}, '', window.location.pathname);

        // Load content for each note
        const contentMap: Record<string, string> = {};
        for (const n of notesData) {
          const fullNote = await db.getNote(user.id, n.id);
          if (fullNote) contentMap[n.id] = fullNote.content || '';
        }
        if (mounted) setContent(contentMap);
      }

      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  // Auto-save gratitude to localStorage (gratitude not in Supabase yet)
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

  const saveNote = async () => {
    if (!userId || !activeId) return;
    try {
      const currentNote = notes.find(n => n.id === activeId);
      if (!currentNote) return;

      await db.updateNote(userId, activeId, {
        title: currentNote.title,
        content: content[activeId] || '',
        tone: currentNote.tone,
      });

      const iso = new Date().toISOString();
      setNotes(prev => prev.map(n =>
        n.id === activeId ? { ...n, updated: 'just now', updatedAt: iso, preview: (content[activeId] || '').slice(0, 140) } : n
      ));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  const addNote = async () => {
    if (!userId) return;
    try {
      const newNote = await db.createNote(userId, 'Untitled note', '', 'terra');
      const note: Note = {
        id: newNote.id,
        title: 'Untitled note',
        updated: 'just now',
        updatedAt: new Date().toISOString(),
        tone: 'terra',
        preview: ''
      };
      setNotes(prev => [note, ...prev]);
      setContent(prev => ({ ...prev, [newNote.id]: '' }));
      setActiveId(newNote.id);
      setShowAITip(true);
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const deleteNote = async (id: string) => {
    if (!userId) return;
    try {
      await db.deleteNote(userId, id);
      const remaining = notes.filter(n => n.id !== id);
      setNotes(remaining);
      if (activeId === id) setActiveId(remaining[0]?.id ?? '');
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const onAddTask = useCallback(async (partial: Omit<Task, 'id'>) => {
    if (!userId) return;
    try {
      const newTask = await db.createTask(userId, partial);
      setTasks(prev => [{ ...partial, id: newTask.id }, ...prev]);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  }, [userId, setTasks]);

  const onEditTask = useCallback(async (updated: Task) => {
    if (!userId) return;
    try {
      await db.updateTask(userId, updated.id, updated);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      setEditingTask(null);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  }, [userId, setTasks]);

  /* ── AI state ───────────────────────────────────────────── */
  type AiAction = 'summarize' | 'extract' | 'ask';
  const [showAI, setShowAI] = useState(false);
  const [aiAction, setAiAction] = useState<AiAction | null>(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [extractedTasks,    setExtractedTasks]    = useState<string[]>([]);
  const [addedTasks,        setAddedTasks]        = useState<Set<string>>(new Set());
  const [selectedForProject, setSelectedForProject] = useState<Set<string>>(new Set());
  const [projectName,       setProjectName]       = useState('');
  const [creatingProject,   setCreatingProject]   = useState(false);
  const [projectCreated,    setProjectCreated]    = useState(false);

  const runAI = async (action: AiAction, question?: string) => {
    setAiAction(action);
    setAiResponse('');
    setExtractedTasks([]);
    setAddedTasks(new Set());
    setAiLoading(true);

    try {
      const res = await fetch('/api/notes/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content[activeId] || '',
          title: activeNote?.title || '',
          action,
          question,
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        setAiResponse(`Error: ${err.error || 'Request failed'}`);
        setAiLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setAiResponse(full);
      }

      if (action === 'extract') {
        const tasks = full
          .split('\n')
          .filter(l => l.trim().startsWith('- '))
          .map(l => l.replace(/^-\s+/, '').trim())
          .filter(Boolean);
        setExtractedTasks(tasks);
        setSelectedForProject(new Set(tasks));
        setProjectName(activeNote?.title || '');
        setProjectCreated(false);
      }
    } catch {
      setAiResponse('Error: Could not reach AI service.');
    }

    setAiLoading(false);
  };

  const handleAddExtractedTask = async (taskTitle: string) => {
    await onAddTask({ title: taskTitle, done: false, priority: 'medium', project: '', tone: 'terra', attach: 0, due: 'someday', time: '' });
    setAddedTasks(prev => new Set(prev).add(taskTitle));
  };

  const createProjectWithTasks = async () => {
    if (!userId || !projectName.trim() || selectedForProject.size === 0) return;
    setCreatingProject(true);
    try {
      const name = projectName.trim();
      const created = await db.createProject(userId, {
        name, short: name.slice(0, 2).toUpperCase(),
        tone: 'terra', due: 'Ongoing',
        desc: `Created from note: ${activeNote?.title || ''}`,
      });
      setProjects(prev => [{
        id: created.id,
        name: created.name,
        short: created.short,
        tone: created.tone,
        due: created.due || 'Ongoing',
        desc: created.description || '',
      }, ...prev]);
      const tasksToAdd = extractedTasks.filter(t => selectedForProject.has(t));
      for (const title of tasksToAdd) {
        await onAddTask({ title, done: false, priority: 'medium', project: name, tone: 'terra', attach: 0, due: 'someday', time: '' });
      }
      setAddedTasks(new Set(tasksToAdd));
      setProjectCreated(true);
    } catch (err) { console.error(err); }
    setCreatingProject(false);
  };

  const wordCount = (content[activeId] || '').trim().split(/\s+/).filter(Boolean).length;

  const setGrat = (key: keyof GratitudeEntry, val: string) =>
    setGratitude(prev => ({ ...prev, [key]: val }));

  const gratInputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8, boxSizing: 'border-box',
    border: '1.5px solid rgba(201,148,58,0.25)', background: 'rgba(201,148,58,0.06)',
    fontSize: 13, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-sans)',
    transition: 'border-color 0.15s', resize: 'none', lineHeight: 1.5,
  };

  if (loading) return null;

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

            {/* ── AI tip for new notes ─────────────────────── */}
            {showAITip && (
              <div style={{
                marginBottom: 20, borderRadius: 12, padding: '14px 16px',
                background: 'linear-gradient(135deg, rgba(193,98,63,0.08) 0%, rgba(201,148,58,0.06) 100%)',
                border: '1.5px solid rgba(193,98,63,0.25)',
                display: 'flex', alignItems: 'flex-start', gap: 12,
                animation: 'aiTipIn 0.3s ease-out',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: 'linear-gradient(135deg, #c1623f 0%, #c9943a 100%)',
                  display: 'grid', placeItems: 'center',
                  boxShadow: '0 2px 8px rgba(193,98,63,0.3)',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                    <path d="m12 3 1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>
                    Try the AI assistant
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                    Once you've written something, hit <strong style={{ color: 'var(--accent)' }}>✦ AI</strong> to summarize your note, extract action items, or ask questions about it.
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => { setShowAI(true); setShowAITip(false); setAiAction(null); }}
                      style={{
                        padding: '4px 12px', borderRadius: 6, border: 'none',
                        background: 'linear-gradient(135deg, #c1623f 0%, #c9943a 100%)',
                        color: '#fff', fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        boxShadow: '0 1px 6px rgba(193,98,63,0.3)',
                      }}
                    >Open AI panel</button>
                    <button
                      onClick={() => setShowAITip(false)}
                      style={{
                        padding: '4px 12px', borderRadius: 6,
                        border: '1px solid var(--line)', background: 'transparent',
                        color: 'var(--ink-faint)', fontSize: 11,
                        cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      }}
                    >Dismiss</button>
                  </div>
                </div>
              </div>
            )}

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
              <button
                onClick={() => { setShowAI(v => !v); setShowAITip(false); if (!showAI) { setAiAction(null); setAiResponse(''); setExtractedTasks([]); } }}
                style={{
                  padding: '5px 14px', borderRadius: 7,
                  border: 'none',
                  background: showAI
                    ? 'var(--accent)'
                    : 'linear-gradient(135deg, #c1623f 0%, #c9943a 100%)',
                  fontSize: 12, fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
                  boxShadow: showAI ? 'none' : '0 2px 8px rgba(193,98,63,0.35)',
                  letterSpacing: '0.02em',
                  opacity: showAI ? 0.85 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 3px 12px rgba(193,98,63,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = showAI ? 'none' : '0 2px 8px rgba(193,98,63,0.35)'; e.currentTarget.style.transform = 'none'; }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.6))' }}>
                  <path d="m12 3 1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z"/>
                </svg>
                AI
              </button>
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

            {/* ── AI panel ────────────────────────────────── */}
            {showAI && (
              <div style={{
                marginTop: 20, border: '1px solid var(--line)',
                borderRadius: 14, background: 'var(--bg-elev)', overflow: 'hidden',
              }}>
                {/* header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderBottom: '1px solid var(--line)',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent)', flexShrink: 0 }}>
                    <path d="m12 3 1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z"/>
                  </svg>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', flex: 1 }}>AI Assistant</span>
                  <button onClick={() => setShowAI(false)} style={{
                    width: 22, height: 22, borderRadius: 6, border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    display: 'grid', placeItems: 'center', color: 'var(--ink-faint)',
                  }}>
                    <Icon name="x" size={12} />
                  </button>
                </div>

                {/* action chips */}
                <div style={{ display: 'flex', gap: 6, padding: '10px 14px', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
                  {([
                    { id: 'summarize', label: 'Summarize' },
                    { id: 'extract',   label: 'Extract tasks' },
                    { id: 'ask',       label: 'Ask' },
                  ] as { id: AiAction; label: string }[]).map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => id === 'ask' ? setAiAction('ask') : runAI(id)}
                      disabled={aiLoading}
                      style={{
                        padding: '5px 14px', borderRadius: 20,
                        border: `1.5px solid ${aiAction === id ? 'var(--accent)' : 'var(--line)'}`,
                        background: aiAction === id ? 'var(--accent-soft)' : 'transparent',
                        color: aiAction === id ? 'var(--accent)' : 'var(--ink-soft)',
                        fontSize: 12, fontWeight: 500,
                        cursor: aiLoading ? 'default' : 'pointer',
                        fontFamily: 'var(--font-sans)', transition: 'all 0.13s',
                        opacity: aiLoading && aiAction !== id ? 0.5 : 1,
                      }}
                    >{label}</button>
                  ))}
                </div>

                {/* ask input */}
                {aiAction === 'ask' && (
                  <div style={{
                    display: 'flex', gap: 8, padding: '10px 14px',
                    borderBottom: '1px solid var(--line)',
                  }}>
                    <input
                      autoFocus
                      value={aiQuestion}
                      onChange={e => setAiQuestion(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && aiQuestion.trim() && runAI('ask', aiQuestion)}
                      placeholder="Ask anything about this note…"
                      style={{
                        flex: 1, padding: '6px 10px', borderRadius: 8,
                        border: '1.5px solid var(--line)', background: 'var(--bg-sunk)',
                        fontSize: 13, color: 'var(--ink)', outline: 'none',
                        fontFamily: 'var(--font-sans)',
                      }}
                    />
                    <button
                      onClick={() => aiQuestion.trim() && runAI('ask', aiQuestion)}
                      disabled={!aiQuestion.trim() || aiLoading}
                      style={{
                        padding: '6px 14px', borderRadius: 8,
                        border: 'none', background: 'var(--accent)', color: '#fff',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        opacity: !aiQuestion.trim() || aiLoading ? 0.5 : 1,
                        transition: 'opacity 0.13s',
                      }}
                    >Ask</button>
                  </div>
                )}

                {/* response area */}
                {(aiLoading || aiResponse) && (
                  <div style={{ padding: '14px 16px', maxHeight: 300, overflowY: 'auto' }}>
                    {aiLoading && !aiResponse && (
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '4px 0' }}>
                        {[0, 0.18, 0.36].map((delay, i) => (
                          <div key={i} style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: 'var(--accent)', opacity: 0.7,
                            animation: `aiPulse 1.1s ease-in-out ${delay}s infinite`,
                          }} />
                        ))}
                      </div>
                    )}
                    {aiResponse && aiAction !== 'extract' && (
                      <p style={{
                        margin: 0, fontSize: 13, lineHeight: 1.75,
                        color: 'var(--ink)', whiteSpace: 'pre-wrap',
                        fontFamily: 'var(--font-sans)',
                      }}>
                        {aiResponse}
                        {aiLoading && <span style={{ opacity: 0.35, fontWeight: 300 }}>▊</span>}
                      </p>
                    )}

                    {/* extracted tasks list */}
                    {aiAction === 'extract' && extractedTasks.length > 0 && !aiLoading && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {extractedTasks.map((task, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '7px 10px', borderRadius: 8,
                            background: 'var(--bg-sunk)', border: `1px solid ${selectedForProject.has(task) ? 'var(--accent)' : 'var(--line)'}`,
                            transition: 'border-color 0.13s',
                          }}>
                            <button
                              onClick={() => setSelectedForProject(prev => { const n = new Set(prev); n.has(task) ? n.delete(task) : n.add(task); return n; })}
                              style={{
                                width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                                border: selectedForProject.has(task) ? 'none' : '1.5px solid var(--ink-faint)',
                                background: selectedForProject.has(task) ? 'var(--accent)' : 'transparent',
                                display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'all 0.15s',
                              }}
                            >
                              {selectedForProject.has(task) && <Icon name="check" size={8} style={{ color: '#fff' }} />}
                            </button>
                            <span style={{ flex: 1, fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>{task}</span>
                            {addedTasks.has(task) ? (
                              <span style={{
                                fontSize: 11, color: '#7a9e7e', display: 'flex',
                                alignItems: 'center', gap: 3, flexShrink: 0,
                              }}>
                                <Icon name="check" size={11} /> Added
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAddExtractedTask(task)}
                                style={{
                                  padding: '3px 10px', borderRadius: 6, flexShrink: 0,
                                  border: '1px solid var(--accent)', background: 'transparent',
                                  color: 'var(--accent)', fontSize: 11, fontWeight: 600,
                                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                                  transition: 'all 0.12s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-soft)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                              >+ Add</button>
                            )}
                          </div>
                        ))}

                        {/* create project suggestion */}
                        <div style={{
                          marginTop: 6, padding: '12px 14px', borderRadius: 10,
                          background: 'linear-gradient(135deg, rgba(193,98,63,0.06) 0%, rgba(201,148,58,0.05) 100%)',
                          border: '1.5px solid rgba(193,98,63,0.2)',
                        }}>
                          {projectCreated ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Icon name="check" size={13} />
                              <span style={{ fontSize: 12, color: '#7a9e7e', fontWeight: 600 }}>
                                Project created with {addedTasks.size} task{addedTasks.size !== 1 ? 's' : ''}!
                              </span>
                            </div>
                          ) : (
                            <>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
                                Group all as a project?
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 10, lineHeight: 1.5 }}>
                                {selectedForProject.size === 0
                                  ? 'Select at least one task above to create a project.'
                                  : `Create a project and add ${selectedForProject.size} selected task${selectedForProject.size !== 1 ? 's' : ''} under it.`}
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                  value={projectName}
                                  onChange={e => setProjectName(e.target.value)}
                                  placeholder="Project name…"
                                  style={{
                                    flex: 1, padding: '6px 10px', borderRadius: 7,
                                    border: '1.5px solid var(--line)', background: 'var(--bg-sunk)',
                                    fontSize: 12, color: 'var(--ink)', outline: 'none',
                                    fontFamily: 'var(--font-sans)', transition: 'border-color 0.13s',
                                  }}
                                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
                                />
                                <button
                                  onClick={createProjectWithTasks}
                                  disabled={creatingProject || !projectName.trim() || selectedForProject.size === 0}
                                  style={{
                                    padding: '6px 14px', borderRadius: 7, border: 'none',
                                    background: 'linear-gradient(135deg, #c1623f 0%, #c9943a 100%)',
                                    color: '#fff', fontSize: 11, fontWeight: 700,
                                    cursor: creatingProject || !projectName.trim() ? 'default' : 'pointer',
                                    fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
                                    opacity: creatingProject || !projectName.trim() ? 0.5 : 1,
                                    transition: 'opacity 0.13s',
                                  }}
                                >
                                  {creatingProject ? 'Creating…' : '✦ Create project'}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    {aiAction === 'extract' && aiLoading && (
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: 'var(--ink)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', opacity: 0.6 }}>
                        {aiResponse}
                        <span style={{ opacity: 0.35 }}>▊</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

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
