'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Task, QUOTES, ProjectData, CalEvent, todayStr } from './data';
import { createClient } from './supabase/client';
import * as db from './supabase/db';

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [user,            setUser]            = useState<User | null>(null);
  const [userId,          setUserId]          = useState<string | null>(null);
  const [tasks,           setTasksState]      = useState<Task[]>([]);
  const [mood,            setMoodState]       = useState('😊');
  const [theme,           setThemeState]      = useState<'light' | 'dark'>('light');
  const [accent,          setAccentState]     = useState<Accent>('terracotta');
  const [bgPattern,       setBgPatternState]  = useState<'none' | 'dots' | 'grid'>('none');
  const [sidebar,         setSidebarState]    = useState<'wide' | 'icon'>('wide');
  const [density,         setDensityState]    = useState<'compact' | 'cozy' | 'comfy'>('cozy');
  const [dashVariant,     setDashVariantState] = useState<DashVariant>('A');
  const [projects,        setProjectsState]   = useState<ProjectData[]>([]);
  const [calendarEvents,  setCalendarEventsState] = useState<CalEvent[]>([]);
  const [tourDone,        setTourDoneState]   = useState(true);
  const [notifications,   setNotifications]   = useState<AppNotification[]>([]);
  const [completions,     setCompletions]     = useState<Record<string, number>>({});
  const [confettiTrigger, setConfettiTrigger] = useState<{ x: number; y: number; t: number } | null>(null);
  const [dataLoaded,      setDataLoaded]      = useState(false);

  const [quote] = useState(() => {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    return QUOTES[dayOfYear % QUOTES.length];
  });

  /* ── Load all user data from Supabase when email is known ── */
  const setUserEmail = useCallback(async (email: string, defaultName?: string) => {
    const supabase = createClient();

    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      setUserId(authUser.id);

      // Load user profile
      const profile = await db.getUserProfile(authUser.id);
      if (profile) {
        setUser({ ...profile, email });
      } else {
        // Create new profile
        const name = defaultName ?? authUser.user_metadata?.name ?? email.split('@')[0];
        await db.createUserProfile(authUser.id, name, email);
        setUser({ name, email, joinedAt: new Date().toISOString() });
      }

      // Load preferences
      const prefs = await db.getUserPreferences(authUser.id);
      if (prefs) {
        setMoodState(prefs.mood || '😊');
        setThemeState(prefs.theme || 'light');
        setAccentState(prefs.accent || 'terracotta');
        setBgPatternState(prefs.bg_pattern || 'none');
        setSidebarState(prefs.sidebar || 'wide');
        setDensityState(prefs.density || 'cozy');
        setDashVariantState(prefs.dash_variant || 'A');
        setTourDoneState(prefs.tour_done ?? false);

        applyTheme(prefs.theme || 'light');
        applyAccent(prefs.accent || 'terracotta');
        document.body.dataset.density = prefs.density || 'cozy';
        document.body.dataset.bgPattern = prefs.bg_pattern || 'none';
      } else {
        // No preferences row = brand new user, show the intro
        setTourDoneState(false);
      }

      // Load all data from Supabase
      const [tasksData, projectsData, eventsData, completionsData] = await Promise.all([
        db.getTasks(authUser.id),
        db.getProjects(authUser.id),
        db.getCalendarEvents(authUser.id),
        db.getDailyCompletions(authUser.id),
      ]);

      setTasksState(tasksData);
      setProjectsState(projectsData);
      setCalendarEventsState(eventsData);
      setCompletions(completionsData);
      setDataLoaded(true);

      // Catch up any stale recurring tasks
      const refreshed = await db.catchUpRecurringTasks(authUser.id);
      if (refreshed.length > 0) setTasksState(refreshed);

    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, []);

  /* ── Auto-save tasks to Supabase (debounced) ── */
  useEffect(() => {
    if (!userId || !dataLoaded) return;

    // Simple debounce - wait before saving
    const timer = setTimeout(() => {
      // Note: In a production app, you'd want more sophisticated sync
      // For now, we rely on individual create/update/delete calls from components
    }, 1000);

    return () => clearTimeout(timer);
  }, [tasks, userId, dataLoaded]);

  /* ── Preference setters (apply DOM + auto-save to Supabase) ── */
  const setTheme = useCallback((t: 'light' | 'dark') => {
    setThemeState(t);
    applyTheme(t);
    if (userId) db.updateUserPreferences(userId, { theme: t });
  }, [userId]);

  const setAccent = useCallback((a: Accent) => {
    setAccentState(a);
    applyAccent(a);
    if (userId) db.updateUserPreferences(userId, { accent: a });
  }, [userId]);

  const setBgPattern = useCallback((p: 'none' | 'dots' | 'grid') => {
    setBgPatternState(p);
    document.body.dataset.bgPattern = p;
    if (userId) db.updateUserPreferences(userId, { bg_pattern: p });
  }, [userId]);

  const setSidebar = useCallback((s: 'wide' | 'icon') => {
    setSidebarState(s);
    if (userId) db.updateUserPreferences(userId, { sidebar: s });
  }, [userId]);

  const setDensity = useCallback((d: 'compact' | 'cozy' | 'comfy') => {
    setDensityState(d);
    document.body.dataset.density = d;
    if (userId) db.updateUserPreferences(userId, { density: d });
  }, [userId]);

  const setMood = useCallback((m: string) => {
    setMoodState(m);
    if (userId) db.updateUserPreferences(userId, { mood: m });
  }, [userId]);

  const setDashVariant = useCallback((v: DashVariant) => {
    setDashVariantState(v);
    if (userId) db.updateUserPreferences(userId, { dash_variant: v });
  }, [userId]);

  const fireConfetti = (x = window.innerWidth / 2, y = window.innerHeight / 3) =>
    setConfettiTrigger({ x, y, t: Date.now() });

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserId(null);
    setTasksState([]);
    setProjectsState([]);
    setCalendarEventsState([]);
    setDataLoaded(false);
  };

  const updateUser = useCallback(async (patch: Partial<Omit<User, 'email'>>) => {
    if (!userId) return;

    setUser(prev => {
      const updated = { ...prev, ...patch } as User;
      return updated;
    });

    try {
      await db.updateUserProfile(userId, patch);
    } catch (err) {
      console.error('Error updating user profile:', err);
    }
  }, [userId]);

  /* ── Task management with Supabase sync ── */
  const setTasks = useCallback((t: Task[] | ((prev: Task[]) => Task[])) => {
    setTasksState(t);
  }, []);

  const setProjects = useCallback((p: ProjectData[] | ((prev: ProjectData[]) => ProjectData[])) => {
    setProjectsState(p);
  }, []);

  const setCalendarEvents = useCallback((e: CalEvent[] | ((prev: CalEvent[]) => CalEvent[])) => {
    setCalendarEventsState(e);
  }, []);

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
    if (userId) db.updateUserPreferences(userId, { tour_done: true });
  }, [userId]);

  /* ── toggleTask: toggle done state + track completions + confetti + notification ── */
  const toggleTask = useCallback(async (id: string) => {
    if (!userId) return;

    const today = todayStr();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newDoneState = !task.done;

    // Optimistically update UI
    setTasksState(prev => prev.map(t => t.id === id ? { ...t, done: newDoneState } : t));

    // Update completions
    if (newDoneState) {
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

      // Update Supabase
      await db.updateTask(userId, id, { done: true });
      await db.incrementDailyCompletion(userId, today);

      // Spawn next recurrence if applicable
      if (task.recurrenceRule) {
        try {
          const next = await db.spawnNextRecurrence(userId, task);
          if (next) {
            setTasksState(prev => [{
              id:                  next.id,
              title:               next.title,
              done:                false,
              project:             next.project || '',
              tone:                next.tone ?? 'terra',
              attach:              0,
              due:                 next.due,
              time:                next.time ?? '—',
              priority:            next.priority ?? 'medium',
              recurrenceRule:      task.recurrenceRule,
              recurrenceTemplateId: task.recurrenceTemplateId ?? task.id,
            }, ...prev]);
          }
        } catch (err) {
          console.error('Failed to spawn next recurrence:', err);
        }
      }
    } else {
      setCompletions(c => ({ ...c, [today]: Math.max(0, (c[today] ?? 0) - 1) }));

      // Update Supabase
      await db.updateTask(userId, id, { done: false });
      await db.decrementDailyCompletion(userId, today);
    }
  }, [userId, tasks]);

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
