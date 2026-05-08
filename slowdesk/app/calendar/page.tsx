'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { CalEvent } from '@/lib/data';
import { useApp } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import * as db from '@/lib/supabase/db';
import Topbar from '@/components/Topbar';
import Icon from '@/components/Icon';

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y: number, m: number)    { return new Date(y, m, 1).getDay(); }
function pad(n: number)                        { return String(n).padStart(2, '0'); }
function formatTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${pad(m)} ${ampm}`;
}

const COLOR_OPTIONS = [
  { label: 'Terracotta', value: '#c1623f' },
  { label: 'Sage',       value: '#7a9e7e' },
  { label: 'Plum',       value: '#8b5c75' },
  { label: 'Butter',     value: '#c9943a' },
  { label: 'Sky',        value: '#5b8fbf' },
  { label: 'Ink',        value: '#3a2f24' },
];

/* ── Event Modal ─────────────────────────────────────────── */
function EventModal({ editEvent, defaultDay, defaultMonth, defaultYear, onSave, onDelete, onClose }: {
  editEvent?: CalEvent;
  defaultDay: number; defaultMonth: number; defaultYear: number;
  onSave: (ev: CalEvent) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}) {
  const isEdit = !!editEvent;
  const initDate = `${defaultYear}-${pad(defaultMonth + 1)}-${pad(defaultDay)}`;
  const [title,   setTitle]   = useState(editEvent?.title   ?? '');
  const [date,    setDate]    = useState(editEvent
    ? `${editEvent.year}-${pad(editEvent.month + 1)}-${pad(editEvent.day)}` : initDate);
  const [time,    setTime]    = useState(editEvent?.time    ?? '10:00');
  const [endTime, setEndTime] = useState(editEvent?.endTime ?? '11:00');
  const [color,   setColor]   = useState(editEvent?.color   ?? '#c1623f');
  const [note,    setNote]    = useState(editEvent?.note    ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18 });
    gsap.fromTo(panelRef.current, { y: 28, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.28, ease: 'power3.out' });
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const close = () => {
    gsap.to(panelRef.current,   { y: 12, opacity: 0, scale: 0.97, duration: 0.16, ease: 'power2.in' });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.18, onComplete: onClose });
  };

  const submit = () => {
    if (!title.trim() || !date) return;
    const [y, m, d] = date.split('-').map(Number);
    onSave({ id: editEvent?.id ?? `ev${Date.now()}`, title: title.trim(), day: d, month: m - 1, year: y, time, endTime, color, note });
    close();
  };

  const iStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8, boxSizing: 'border-box',
    border: '1.5px solid var(--line)', background: 'var(--bg-sunk)',
    fontSize: 13, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s',
  };
  const lbl = (t: string) => (
    <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-faint)', display: 'block', marginBottom: 6 }}>{t}</label>
  );

  return (
    <div ref={overlayRef} onClick={e => e.target === overlayRef.current && close()} style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div ref={panelRef} style={{ width: 440, background: 'var(--bg-elev)', borderRadius: 18, boxShadow: '0 28px 72px rgba(0,0,0,0.28)', border: '1px solid var(--line)', overflow: 'hidden' }}>
        <div style={{ height: 5, background: color, transition: 'background 0.2s' }} />
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px 12px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{isEdit ? 'Edit event' : 'New event'}</span>
          <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 4 }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            {lbl('Event title')}
            <input ref={inputRef} value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="What's happening?" style={{ ...iStyle, fontSize: 14 }}
              onFocus={e => (e.currentTarget.style.borderColor = color)} onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              {lbl('Date')}
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={iStyle}
                onFocus={e => (e.currentTarget.style.borderColor = color)} onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')} />
            </div>
            <div>
              {lbl('Start')}
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={iStyle}
                onFocus={e => (e.currentTarget.style.borderColor = color)} onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')} />
            </div>
            <div>
              {lbl('End')}
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={iStyle}
                onFocus={e => (e.currentTarget.style.borderColor = color)} onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')} />
            </div>
          </div>
          <div>
            {lbl('Color')}
            <div style={{ display: 'flex', gap: 8 }}>
              {COLOR_OPTIONS.map(c => (
                <button key={c.value} title={c.label} onClick={() => setColor(c.value)} style={{
                  width: 28, height: 28, borderRadius: '50%', background: c.value,
                  border: color === c.value ? '3px solid var(--ink)' : '3px solid transparent',
                  outline: '1.5px solid rgba(0,0,0,0.12)', cursor: 'pointer',
                  transform: color === c.value ? 'scale(1.18)' : 'scale(1)', transition: 'transform 0.12s',
                }} />
              ))}
            </div>
          </div>
          <div>
            {lbl('Project / notes')}
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Folio v3 Redesign" style={iStyle}
              onFocus={e => (e.currentTarget.style.borderColor = color)} onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--line)', background: 'var(--bg-sunk)' }}>
          {isEdit && onDelete && (
            <button onClick={() => { if (confirmDelete) { onDelete(editEvent!.id); close(); } else setConfirmDelete(true); }} style={{
              padding: '7px 14px', borderRadius: 8, border: `1px solid ${confirmDelete ? '#e05c3c' : 'var(--line)'}`,
              background: confirmDelete ? 'rgba(224,92,60,0.1)' : 'transparent',
              color: confirmDelete ? '#e05c3c' : 'var(--ink-soft)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Icon name="trash" size={12} />{confirmDelete ? 'Confirm delete' : 'Delete'}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={close} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Cancel</button>
          <button onClick={submit} disabled={!title.trim()} style={{
            padding: '7px 20px', borderRadius: 8, border: 'none',
            background: title.trim() ? color : 'var(--bg-sunk)',
            color: title.trim() ? '#fff' : 'var(--ink-faint)',
            fontSize: 13, fontWeight: 600, cursor: title.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
          }}>{isEdit ? 'Save changes' : 'Add event'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function CalendarPage() {
  const supabase = createClient();
  const { calendarEvents: events, setCalendarEvents: setEvents } = useApp();
  const [todayDate] = useState(() => new Date());
  const [year,     setYear]     = useState(() => new Date().getFullYear());
  const [month,    setMonth]    = useState(() => new Date().getMonth());
  const [selected, setSelected] = useState<number | null>(() => new Date().getDate());
  const [modal,    setModal]    = useState<{ day: number; event?: CalEvent } | null>(null);
  const [userId,   setUserId]   = useState<string | null>(null);

  // Google Calendar state
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalSyncing,   setGcalSyncing]   = useState(false);
  const [gcalSyncMsg,   setGcalSyncMsg]   = useState('');

  const gridRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);

      // Check Google Calendar connection status
      const { data } = await supabase
        .from('user_profiles')
        .select('google_calendar_connected')
        .eq('id', user.id)
        .single();
      if (data?.google_calendar_connected) setGcalConnected(true);
    });

    // Handle redirect params after OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get('gcal_connected') === '1') {
      setGcalConnected(true);
      setGcalSyncMsg('Google Calendar connected!');
      window.history.replaceState({}, '', '/calendar');
      handleSync();
    }
    if (params.get('gcal_error')) {
      setGcalSyncMsg('Could not connect Google Calendar. Try again.');
      window.history.replaceState({}, '', '/calendar');
    }
  }, []);

  const handleSync = async () => {
    setGcalSyncing(true);
    setGcalSyncMsg('');
    try {
      const res = await fetch('/api/google-calendar/sync', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setGcalSyncMsg(`Synced ${json.synced} events`);
      // Reload events from DB
      if (userId) {
        const fresh = await import('@/lib/supabase/db').then(m => m.getCalendarEvents(userId));
        setEvents(fresh);
      }
    } catch (e: any) {
      setGcalSyncMsg(e.message ?? 'Sync failed');
    } finally {
      setGcalSyncing(false);
      setTimeout(() => setGcalSyncMsg(''), 3000);
    }
  };

  const handleDisconnect = async () => {
    await fetch('/api/google-calendar/disconnect', { method: 'POST' });
    setGcalConnected(false);
    setEvents(prev => prev.filter(e => e.source !== 'google'));
    setGcalSyncMsg('Disconnected');
    setTimeout(() => setGcalSyncMsg(''), 2000);
  };

  useEffect(() => {
    if (!gridRef.current) return;
    const cells = gridRef.current.querySelectorAll('.cal-day');
    gsap.fromTo(cells, { opacity: 0, y: 8 }, { opacity: 1, y: 0, stagger: 0.007, duration: 0.28, ease: 'power2.out' });
  }, [month, year]);

  useEffect(() => {
    if (!sideRef.current) return;
    gsap.fromTo(sideRef.current, { x: 10, opacity: 0 }, { x: 0, opacity: 1, duration: 0.22, ease: 'power2.out' });
  }, [selected]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDay(year, month);
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  const eventsForDay = useCallback((d: number | null) =>
    d ? events.filter(e => e.day === d && e.month === month && e.year === year)
          .sort((a, b) => a.time.localeCompare(b.time))
      : [],
  [events, month, year]);

  const selectedEvents = eventsForDay(selected);

  const tomorrow = new Date(todayDate);
  tomorrow.setDate(todayDate.getDate() + 1);
  const tomorrowEvents = events
    .filter(e => e.year === tomorrow.getFullYear() && e.month === tomorrow.getMonth() && e.day === tomorrow.getDate())
    .sort((a, b) => a.time.localeCompare(b.time));

  const prev    = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next    = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const goToday = () => { setMonth(todayDate.getMonth()); setYear(todayDate.getFullYear()); setSelected(todayDate.getDate()); };

  const saveEvent = async (ev: CalEvent) => {
    if (!userId) return;
    try {
      const idx = events.findIndex(e => e.id === ev.id);
      if (idx >= 0) {
        await db.updateCalendarEvent(userId, ev.id, ev);
        setEvents(prev => prev.map(e => e.id === ev.id ? ev : e));
      } else {
        const newEvent = await db.createCalendarEvent(userId, ev);
        setEvents(prev => [...prev, { ...ev, id: newEvent.id }]);
      }
      if (ev.month === month && ev.year === year) setSelected(ev.day);
    } catch (err) {
      console.error('Failed to save event:', err);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!userId) return;
    try {
      await db.deleteCalendarEvent(userId, id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const isSelectedToday = selected === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear();
  const selDOW = selected
    ? new Date(year, month, selected).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
    : '';

  const navBtnStyle: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 10,
    border: '1px solid var(--line)', background: 'var(--bg-elev)',
    cursor: 'pointer', display: 'grid', placeItems: 'center',
    color: 'var(--ink-soft)', transition: 'all 0.13s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Topbar
        title="Calendar"
        subtitle={`Month view · ${MONTHS[month]} ${year}`}
        action={
          <button className="btn btn-primary" onClick={() => setModal({ day: selected ?? todayDate.getDate() })}>
            <Icon name="plus" size={14} /> New event
          </button>
        }
      />

      <div style={{ padding: '24px 24px 40px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Month heading + nav */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 42, fontWeight: 400, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
            {MONTHS[month]}&nbsp;
            <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--ink-faint)', opacity: 0.7 }}>{year}</em>
          </h2>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={prev} style={navBtnStyle}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink-soft)'; }}>
              <Icon name="chevron" size={14} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <button onClick={goToday} style={{
              height: 34, padding: '0 18px', borderRadius: 10,
              border: '1px solid var(--line)', background: 'var(--bg-elev)',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
              color: 'var(--ink)', fontFamily: 'var(--font-sans)', transition: 'all 0.13s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink)'; }}>
              Today
            </button>
            <button onClick={next} style={navBtnStyle}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink-soft)'; }}>
              <Icon name="chevron" size={14} />
            </button>
          </div>
        </div>

        {/* Grid + sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

          {/* Calendar grid */}
          <div>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 6 }}>
              {DAYS.map(d => (
                <div key={d} style={{
                  textAlign: 'center', fontSize: 10, fontWeight: 700,
                  color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 0 8px',
                }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
              {cells.map((day, i) => {
                const isToday    = day === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear();
                const isSelected = day === selected;
                const dayEvs     = eventsForDay(day);

                return (
                  <div key={i} className="cal-day"
                    onClick={() => day && setSelected(day)}
                    onDoubleClick={() => day && setModal({ day })}
                    style={{
                      minHeight: 90, borderRadius: 12, padding: '8px 8px 6px',
                      cursor: day ? 'pointer' : 'default',
                      background: isToday ? 'rgba(193,98,63,0.07)' : 'var(--bg-elev)',
                      border: isSelected
                        ? '1.5px solid var(--accent)'
                        : isToday
                        ? '1.5px solid rgba(193,98,63,0.28)'
                        : '1px solid var(--line)',
                      transition: 'border-color 0.13s',
                    }}
                    onMouseEnter={e => { if (day && !isSelected) e.currentTarget.style.borderColor = 'rgba(193,98,63,0.2)'; }}
                    onMouseLeave={e => { if (day && !isSelected) e.currentTarget.style.borderColor = isToday ? 'rgba(193,98,63,0.28)' : 'var(--line)'; }}
                  >
                    {day && (
                      <>
                        <div style={{
                          fontSize: 13, fontWeight: isToday ? 600 : 400, lineHeight: 1,
                          color: isToday ? 'var(--accent)' : 'var(--ink-soft)',
                          marginBottom: 5,
                        }}>{day}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {dayEvs.slice(0, 2).map(ev => (
                            <div key={ev.id}
                              onClick={e => { e.stopPropagation(); setSelected(day); setModal({ day, event: ev }); }}
                              style={{
                                fontSize: 10, fontWeight: 500, padding: '2px 5px', borderRadius: 4,
                                background: ev.color + '22', color: ev.color,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                              }}>
                              {ev.source === 'google' && (
                                <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fontWeight: 700, background: ev.color, color: '#fff', borderRadius: 2, padding: '0 3px', flexShrink: 0 }}>G</span>
                              )}
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                            </div>
                          ))}
                          {dayEvs.length > 2 && (
                            <div style={{ fontSize: 9, color: 'var(--ink-faint)', paddingLeft: 2, fontFamily: 'var(--font-mono)' }}>
                              +{dayEvs.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div ref={sideRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Google Calendar card */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                {/* Google Calendar icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="17" rx="2" stroke="var(--ink-soft)" strokeWidth="1.6"/>
                  <path d="M3 9h18" stroke="var(--ink-soft)" strokeWidth="1.6"/>
                  <path d="M8 2v4M16 2v4" stroke="var(--ink-soft)" strokeWidth="1.6" strokeLinecap="round"/>
                  <circle cx="12" cy="15" r="2.5" fill="var(--accent)" opacity="0.8"/>
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', flex: 1 }}>Google Calendar</span>
                {gcalConnected && (
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sage)', background: 'var(--sage-soft)', padding: '2px 7px', borderRadius: 4 }}>
                    connected
                  </span>
                )}
              </div>

              {gcalSyncMsg && (
                <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
                  {gcalSyncMsg}
                </div>
              )}

              {gcalConnected ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleSync}
                    disabled={gcalSyncing}
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: 12, padding: '7px 12px', opacity: gcalSyncing ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    {gcalSyncing ? 'Syncing…' : 'Sync now'}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="btn"
                    style={{ fontSize: 12, padding: '7px 12px', color: 'var(--ink-faint)' }}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <a
                  href="/api/google-calendar/connect"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '9px 14px', borderRadius: 9,
                    border: '1px solid var(--line)', background: 'var(--bg)',
                    fontSize: 13, fontWeight: 500, color: 'var(--ink)',
                    textDecoration: 'none', transition: 'all 0.15s', cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink)'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Connect Google Calendar
                </a>
              )}
            </div>

            {/* Today's schedule */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--ink-faint)', marginBottom: 4,
              }}>
                {selDOW} · {MONTHS[month].slice(0, 3).toUpperCase()} {selected}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h3 className="serif" style={{ fontSize: 20, fontWeight: 400, margin: 0 }}>
                  {isSelectedToday ? "Today's schedule" : `${MONTHS[month].slice(0, 3)} ${selected}`}
                </h3>
                {selected && (
                  <button onClick={() => setModal({ day: selected })} style={{
                    width: 28, height: 28, borderRadius: 8,
                    border: '1px solid var(--line)', background: 'transparent',
                    cursor: 'pointer', display: 'grid', placeItems: 'center',
                    color: 'var(--ink-faint)', transition: 'all 0.13s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink-faint)'; }}
                  >
                    <Icon name="plus" size={13} />
                  </button>
                )}
              </div>

              {selectedEvents.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                  Nothing scheduled. Breathe easy.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {selectedEvents.map(ev => (
                    <div key={ev.id} style={{ display: 'flex', gap: 10, cursor: 'pointer' }}
                      onClick={() => setModal({ day: ev.day, event: ev })}
                    >
                      <div style={{
                        fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)',
                        flexShrink: 0, width: 52, paddingTop: 2, lineHeight: 1.3,
                      }}>{formatTime(ev.time)}</div>
                      <div style={{ width: 3, borderRadius: 2, background: ev.color, flexShrink: 0, minHeight: 36, alignSelf: 'stretch' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                          {ev.source === 'google' && (
                            <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', fontWeight: 700, background: 'var(--accent)', color: '#fff', borderRadius: 2, padding: '1px 3px', flexShrink: 0 }}>G</span>
                          )}
                          {ev.title}
                        </div>
                        {ev.note && (
                          <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ev.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming — tomorrow */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--ink-faint)', marginBottom: 14,
              }}>
                Upcoming · Tomorrow
              </div>

              {tomorrowEvents.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                  No events tomorrow.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tomorrowEvents.map(ev => (
                    <div key={ev.id}
                      onClick={() => { setMonth(ev.month); setYear(ev.year); setSelected(ev.day); setModal({ day: ev.day, event: ev }); }}
                      style={{
                        padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
                        background: 'var(--bg-sunk)', fontSize: 13, fontWeight: 500,
                        color: 'var(--ink)', transition: 'background 0.13s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--line)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-sunk)')}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <EventModal
          editEvent={modal.event}
          defaultDay={modal.day}
          defaultMonth={month}
          defaultYear={year}
          onSave={saveEvent}
          onDelete={modal.event ? deleteEvent : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
