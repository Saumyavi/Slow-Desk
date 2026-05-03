'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Task, QUOTES, ProjectData, CalEvent, todayStr } from './data';

export type Accent = 'terracotta' | 'sage' | 'plum' | 'butter' | 'sky' | 'ink';
export type DashVariant = 'A' | 'B' | 'C';

export interface User {
  name: string;
  email: string;
  bio?: string;
  role?: string;
  location?: string;
  avatar?: string;
  status?: string;
  joinedAt?: string;
}

export interface AppNotification {
  id: string;
  icon: string;
  text: string;
  color: string;
  createdAt: string;
  readAt?: string;
}

interface AppState {
  user: User | null;
  logout: () => void;
  updateUser: (patch: Partial<Omit<User, 'email'>>) => void;
  setUserEmail: (email: string, defaultName?: string) => void;
  tasks: Task[];
  setTasks: (t: Task[] | ((prev: Task[]) => Task[])) => void;
  toggleTask: (id: string) => void;
  mood: string;
  setMood: (m: string) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  accent: Accent;
  setAccent: (a: Accent) => void;
  bgPattern: 'none' | 'dots' | 'grid';
  setBgPattern: (p: 'none' | 'dots' | 'grid') => void;
  sidebar: 'wide' | 'icon';
  setSidebar: (s: 'wide' | 'icon') => void;
  density: 'compact' | 'cozy' | 'comfy';
  setDensity: (d: 'compact' | 'cozy' | 'comfy') => void;
  dashVariant: DashVariant;
  setDashVariant: (v: DashVariant) => void;
  quote: string;
  confettiTrigger: { x: number; y: number; t: number } | null;
  fireConfetti: (x?: number, y?: number) => void;
  projects: ProjectData[];
  setProjects: (p: ProjectData[] | ((prev: ProjectData[]) => ProjectData[])) => void;
  calendarEvents: CalEvent[];
  setCalendarEvents: (e: CalEvent[] | ((prev: CalEvent[]) => CalEvent[])) => void;
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt'>) => void;
  markAllRead: () => void;
  dismissNotification: (id: string) => void;
  completions: Record<string, number>;
  tourDone: boolean;
  completeTour: () => void;
}

const Ctx = createContext<AppState | null>(null);

const ACCENT_MAP: Record<Accent, [string, string]> = {
  terracotta: ['#c1623f', '#f0ddd5'],
  sage:       ['#7a9e7e', '#ddeede'],
  plum:       ['#8b5c75', '#eed8e8'],
  butter:     ['#c9943a', '#f5e9cc'],
  sky:        ['#5b8fbf', '#d4e6f5'],
  ink:        ['#2a2420', '#e8e4db'],
};

function applyTheme(t: 'light' | 'dark') {
  document.documentElement.dataset.theme = t;
  document.body.dataset.theme = t;
}
function applyAccent(a: Accent) {
  const [main, soft] = ACCENT_MAP[a] ?? ACCENT_MAP.terracotta;
  document.documentElement.style.setProperty('--accent', main);
  document.documentElement.style.setProperty('--accent-soft', soft);
}

const EXPIRY_MS = 24 * 3600 * 1000;

function pruneNotifications(notifs: AppNotification[]): AppNotification[] {
  const cutoff = Date.now() - EXPIRY_MS;
  return notifs.filter(n => !n.readAt || new Date(n.readAt).getTime() > cutoff);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user,            setUser]            = useState<User | null>(null);
  const [userEmail,       setUserEmailState]  = useState<string | null>(null);
  const [tasks,           setTasks]           = useState<Task[]>([]);
  const [mood,            setMood]            = useState('😊');
  const [theme,           setThemeState]      = useState<'light' | 'dark'>('light');
  const [accent,          setAccentState]     = useState<Accent>('terracotta');
  const [bgPattern,       setBgPatternState]  = useState<'none' | 'dots' | 'grid'>('none');
  const [sidebar,         setSidebarState]    = useState<'wide' | 'icon'>('wide');
  const [density,         setDensityState]    = useState<'compact' | 'cozy' | 'comfy'>('cozy');
  const [dashVariant,     setDashVariantState] = useState<DashVariant>('A');
  const [projects,        setProjects]        = useState<ProjectData[]>([]);
  const [calendarEvents,  setCalendarEvents]  = useState<CalEvent[]>([]);
  const [tourDone,        setTourDoneState]   = useState(true);
  const [notifications,   setNotifications]   = useState<AppNotification[]>([]);
  const [completions,     setCompletions]     = useState<Record<string, number>>({});
  const [confettiTrigger, setConfettiTrigger] = useState<{ x: number; y: number; t: number } | null>(null);

  const [quote] = useState(() => {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    return QUOTES[dayOfYear % QUOTES.length];
  });

  /* ── Load all user data from localStorage when email is known ── */
  const setUserEmail = useCallback((email: string, defaultName?: string) => {
    setUserEmailState(email);
    const k = (key: string) => `sd:${email}:${key}`;
    try {
      // Initialize or restore user profile
      const savedUser = localStorage.getItem(k('user'));
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        const name = defaultName
          ?? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const newUser: User = { name, email, joinedAt: new Date().toISOString() };
        setUser(newUser);
        localStorage.setItem(k('user'), JSON.stringify(newUser));
      }

      // Restore all data
      const savedTasks     = localStorage.getItem(k('tasks'));
      const savedProjects  = localStorage.getItem(k('projects'));
      const savedEvents    = localStorage.getItem(k('events'));
      const savedTheme     = localStorage.getItem(k('theme')) as 'light' | 'dark' | null;
      const savedAccent    = localStorage.getItem(k('accent')) as Accent | null;
      const savedSidebar   = localStorage.getItem(k('sidebar')) as 'wide' | 'icon' | null;
      const savedDensity   = localStorage.getItem(k('density')) as 'compact' | 'cozy' | 'comfy' | null;
      const savedBgPattern = localStorage.getItem(k('bgPattern')) as 'none' | 'dots' | 'grid' | null;
      const savedMood      = localStorage.getItem(k('mood'));

      const savedCompletions = localStorage.getItem(k('completions'));

      if (savedTasks)        setTasks(JSON.parse(savedTasks));
      if (savedProjects)     setProjects(JSON.parse(savedProjects));
      if (savedEvents)       setCalendarEvents(JSON.parse(savedEvents));
      if (savedCompletions)  setCompletions(JSON.parse(savedCompletions));
      if (savedMood)         setMood(savedMood);
      if (savedTheme)      { setThemeState(savedTheme);     applyTheme(savedTheme); }
      if (savedAccent)     { setAccentState(savedAccent);   applyAccent(savedAccent); }
      if (savedSidebar)    setSidebarState(savedSidebar);
      if (savedDensity)    { setDensityState(savedDensity); document.body.dataset.density = savedDensity; }
      if (savedBgPattern)  { setBgPatternState(savedBgPattern); document.body.dataset.bgPattern = savedBgPattern; }

      // ── Load & generate notifications ──
      const rawNotifs: AppNotification[] = (() => {
        try { const s = localStorage.getItem(k('notifications')); return s ? JSON.parse(s) : []; }
        catch { return []; }
      })();

      // Expire read notifications older than 24 hours
      let validNotifs = pruneNotifications(rawNotifs);

      // Generate daily notifications once per day
      const today = todayStr();
      const lastNotifDay = localStorage.getItem(k('notifDay'));
      if (lastNotifDay !== today) {
        const currentTasks: Task[]     = savedTasks  ? JSON.parse(savedTasks)  : [];
        const currentEvents: CalEvent[] = savedEvents ? JSON.parse(savedEvents) : [];
        const now = new Date();
        const fresh: AppNotification[] = [];
        const existingIds = new Set(validNotifs.map(n => n.id));

        // Due-today tasks (unfinished)
        currentTasks
          .filter(t => t.due === 'today' && !t.done)
          .forEach(t => {
            const id = `due-${t.id}-${today}`;
            if (!existingIds.has(id))
              fresh.push({ id, icon: 'list', text: `"${t.title}" is due today`, color: '#c9943a', createdAt: new Date().toISOString() });
          });

        // Calendar events happening today
        currentEvents
          .filter(e => e.day === now.getDate() && e.month === now.getMonth() && e.year === now.getFullYear())
          .forEach(e => {
            const id = `event-${e.id}-${today}`;
            if (!existingIds.has(id))
              fresh.push({ id, icon: 'calendar', text: `"${e.title}" is today at ${e.time}`, color: e.color, createdAt: new Date().toISOString() });
          });

        if (fresh.length > 0) validNotifs = [...fresh, ...validNotifs];
        localStorage.setItem(k('notifDay'), today);
        localStorage.setItem(k('notifications'), JSON.stringify(validNotifs.slice(0, 40)));
      }

      setNotifications(validNotifs.slice(0, 40));

      // Show tour for new users (no tourDone key in localStorage)
      if (!localStorage.getItem(k('tourDone'))) setTourDoneState(false);
    } catch { /* ignore parse errors */ }
  }, []);

  /* ── Auto-save whenever data changes ── */
  useEffect(() => {
    if (!userEmail) return;
    localStorage.setItem(`sd:${userEmail}:tasks`, JSON.stringify(tasks));
  }, [tasks, userEmail]);

  useEffect(() => {
    if (!userEmail) return;
    localStorage.setItem(`sd:${userEmail}:projects`, JSON.stringify(projects));
  }, [projects, userEmail]);

  useEffect(() => {
    if (!userEmail) return;
    localStorage.setItem(`sd:${userEmail}:events`, JSON.stringify(calendarEvents));
  }, [calendarEvents, userEmail]);

  useEffect(() => {
    if (!userEmail) return;
    localStorage.setItem(`sd:${userEmail}:mood`, mood);
  }, [mood, userEmail]);

  useEffect(() => {
    if (!userEmail) return;
    localStorage.setItem(`sd:${userEmail}:notifications`, JSON.stringify(notifications));
  }, [notifications, userEmail]);

  useEffect(() => {
    if (!userEmail) return;
    localStorage.setItem(`sd:${userEmail}:completions`, JSON.stringify(completions));
  }, [completions, userEmail]);

  /* ── Preference setters (apply DOM + auto-save) ── */
  const setTheme = useCallback((t: 'light' | 'dark') => {
    setThemeState(t); applyTheme(t);
    if (userEmail) localStorage.setItem(`sd:${userEmail}:theme`, t);
  }, [userEmail]);

  const setAccent = useCallback((a: Accent) => {
    setAccentState(a); applyAccent(a);
    if (userEmail) localStorage.setItem(`sd:${userEmail}:accent`, a);
  }, [userEmail]);

  const setBgPattern = useCallback((p: 'none' | 'dots' | 'grid') => {
    setBgPatternState(p); document.body.dataset.bgPattern = p;
    if (userEmail) localStorage.setItem(`sd:${userEmail}:bgPattern`, p);
  }, [userEmail]);

  const setSidebar = useCallback((s: 'wide' | 'icon') => {
    setSidebarState(s);
    if (userEmail) localStorage.setItem(`sd:${userEmail}:sidebar`, s);
  }, [userEmail]);

  const setDensity = useCallback((d: 'compact' | 'cozy' | 'comfy') => {
    setDensityState(d); document.body.dataset.density = d;
    if (userEmail) localStorage.setItem(`sd:${userEmail}:density`, d);
  }, [userEmail]);

  const setDashVariant = (v: DashVariant) => setDashVariantState(v);

  const fireConfetti = (x = window.innerWidth / 2, y = window.innerHeight / 3) =>
    setConfettiTrigger({ x, y, t: Date.now() });

  const logout = () => { setUser(null); setUserEmailState(null); };

  const updateUser = useCallback((patch: Partial<Omit<User, 'email'>>) => {
    setUser(prev => {
      const base = prev ?? ({ email: userEmail ?? '' } as User);
      const updated = { ...base, ...patch };
      if (userEmail) localStorage.setItem(`sd:${userEmail}:user`, JSON.stringify(updated));
      return updated;
    });
  }, [userEmail]);

  /* ── Notification helpers ── */
  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'createdAt'>) => {
    setNotifications(prev => [{
      ...n,
      id: `n${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    }, ...prev].slice(0, 40));
  }, []);

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => n.readAt ? n : { ...n, readAt: now }));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const completeTour = useCallback(() => {
    setTourDoneState(true);
    if (userEmail) localStorage.setItem(`sd:${userEmail}:tourDone`, '1');
  }, [userEmail]);

  /* ── toggleTask: toggle done state + track completions + confetti + notification ── */
  const toggleTask = useCallback((id: string) => {
    const today = todayStr();
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;
      if (!task.done) {
        setCompletions(c => ({ ...c, [today]: (c[today] ?? 0) + 1 }));
        setConfettiTrigger({ x: window.innerWidth / 2, y: window.innerHeight / 3, t: Date.now() });
        const notifId = `done-${id}-${today}`;
        setNotifications(ns =>
          ns.some(n => n.id === notifId) ? ns : [{
            id: notifId,
            icon: 'check',
            text: `"${task.title}" marked done`,
            color: '#7a9e7e',
            createdAt: new Date().toISOString(),
          }, ...ns].slice(0, 40)
        );
      } else {
        setCompletions(c => ({ ...c, [today]: Math.max(0, (c[today] ?? 0) - 1) }));
      }
      return prev.map(t => t.id === id ? { ...t, done: !t.done } : t);
    });
  }, []);

  return (
    <Ctx.Provider value={{
      user, logout, updateUser, setUserEmail,
      tasks, setTasks, toggleTask, mood, setMood,
      theme, setTheme, accent, setAccent,
      bgPattern, setBgPattern, sidebar, setSidebar,
      density, setDensity, dashVariant, setDashVariant,
      quote, confettiTrigger, fireConfetti,
      projects, setProjects, calendarEvents, setCalendarEvents,
      notifications, addNotification, markAllRead, dismissNotification,
      completions, tourDone, completeTour,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
