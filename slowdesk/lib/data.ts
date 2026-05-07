export type Tone = 'terra' | 'sage' | 'butter' | 'plum' | 'sky';
export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  done: boolean;
  project: string;
  tone: Tone;
  attach: number;
  due: 'today' | 'tomorrow' | 'this week' | 'next week' | 'someday';
  time: string;
  priority: Priority;
}

export interface SubTask {
  id: string;
  task_id: string;
  title: string;
  done: boolean;
  position: number;
}

export interface Project {
  id: string;
  name: string;
  short: string;
  tone: Tone;
  count: number;
  progress: number;
  due: string;
  desc: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  streak: number;
  goal: string;
}

export interface Note {
  id: string;
  title: string;
  updated: string;
  updatedAt?: string;
  tone: Tone;
  preview: string;
}

export const TONE_COLORS: Record<Tone, string> = {
  terra:  '#c1623f',
  sage:   '#7a9e7e',
  butter: '#c9943a',
  plum:   '#8b5c75',
  sky:    '#5b8fbf',
};

export const QUOTES = [
  "Make it ugly. Then make it work. Then make it pretty.",
  "The best way out is always through.",
  "Done is better than perfect, but cozy is better than both.",
  "Small steps every day. Big leaps every season.",
  "You can do hard things. You've done them before.",
  "A goal without a plan is just a wish.",
  "Start where you are. Use what you have. Do what you can.",
  "The secret of getting ahead is getting started.",
];

export const INITIAL_TASKS: Task[] = [
  { id: 'seed-t1', title: 'Review project brief and set milestones', done: true,  project: 'Work',    tone: 'butter', attach: 2, due: 'today',     time: '9:00 AM',  priority: 'high'   },
  { id: 'seed-t2', title: 'Morning run — 5K',                         done: true,  project: 'Health',  tone: 'sage',   attach: 0, due: 'today',     time: '7:00 AM',  priority: 'medium' },
  { id: 'seed-t3', title: 'Design system color audit',                 done: false, project: 'Work',    tone: 'butter', attach: 1, due: 'today',     time: '2:00 PM',  priority: 'high'   },
  { id: 'seed-t4', title: 'Read two chapters of current book',         done: false, project: 'Learning',tone: 'sky',    attach: 0, due: 'today',     time: '8:00 PM',  priority: 'low'    },
  { id: 'seed-t5', title: 'Weekly team sync — prepare talking points', done: false, project: 'Work',    tone: 'butter', attach: 0, due: 'tomorrow',  time: '10:00 AM', priority: 'high'   },
  { id: 'seed-t6', title: 'Update portfolio with recent case studies', done: false, project: 'Website', tone: 'terra',  attach: 3, due: 'tomorrow',  time: '—',        priority: 'medium' },
  { id: 'seed-t7', title: 'Meal prep for the week',                    done: false, project: 'Health',  tone: 'sage',   attach: 0, due: 'this week', time: '—',        priority: 'medium' },
  { id: 'seed-t8', title: 'Learn TypeScript generics',                 done: false, project: 'Learning',tone: 'sky',    attach: 0, due: 'this week', time: '—',        priority: 'low'    },
  { id: 'seed-t9', title: 'Write monthly reflection journal entry',    done: false, project: '',        tone: 'plum',   attach: 0, due: 'this week', time: '—',        priority: 'low'    },
];

export const INITIAL_PROJECTS: ProjectData[] = [
  { id: 'seed-p1', name: 'Work',     short: 'WK', tone: 'butter', due: 'Ongoing',    desc: 'Day-to-day work tasks, meetings, and deliverables.' },
  { id: 'seed-p2', name: 'Health',   short: 'HL', tone: 'sage',   due: 'Ongoing',    desc: 'Fitness goals, nutrition, sleep, and wellbeing habits.' },
  { id: 'seed-p3', name: 'Website',  short: 'WB', tone: 'terra',  due: 'End of month', desc: 'Personal portfolio redesign and content updates.' },
  { id: 'seed-p4', name: 'Learning', short: 'LN', tone: 'sky',    due: 'Ongoing',    desc: 'Books, courses, skills, and things worth knowing.' },
];

export const INITIAL_NOTES: Note[] = (() => {
  const now = Date.now();
  return [
    { id: 'seed-n1', title: 'Project ideas',     updatedAt: new Date(now - 2 * 3600000).toISOString(),       updated: '2 hours ago',  tone: 'terra', preview: 'A running list of side project ideas worth exploring. Start small, iterate fast. Think about problems you actually have...' },
    { id: 'seed-n2', title: 'Reading notes',     updatedAt: new Date(now - 86400000).toISOString(),           updated: 'yesterday',    tone: 'sky',   preview: 'Key takeaways from recent reading. Atomic Habits — systems beat goals. Focus on the 1% improvements...' },
    { id: 'seed-n3', title: 'Weekly reflection', updatedAt: new Date(now - 3 * 86400000).toISOString(),       updated: '3 days ago',   tone: 'sage',  preview: 'What went well this week: shipped the auth feature, consistent morning runs, good sleep schedule...' },
  ];
})();

export const INITIAL_EVENTS: CalEvent[] = (() => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return [
    { id: 'seed-e1', title: 'Team standup',       day: now.getDate(),     month: m, year: y, time: '10:00 AM', endTime: '10:30 AM', color: '#c9943a', note: 'Daily sync' },
    { id: 'seed-e2', title: 'Design review',       day: now.getDate() + 1, month: m, year: y, time: '2:00 PM',  endTime: '3:00 PM',  color: '#c1623f', note: '' },
    { id: 'seed-e3', title: 'Portfolio deadline',  day: now.getDate() + 5, month: m, year: y, time: '5:00 PM',  endTime: '6:00 PM',  color: '#8b5c75', note: 'Submit case studies' },
    { id: 'seed-e4', title: 'Gym session',         day: now.getDate() + 2, month: m, year: y, time: '7:00 AM',  endTime: '8:00 AM',  color: '#7a9e7e', note: '' },
  ];
})();

export const PROJECTS: Project[] = [];
export const HABITS: Habit[] = [];
export const NOTES: Note[] = [];

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface ProjectData {
  id: string;
  name: string;
  short: string;
  tone: Tone;
  due: string;
  desc: string;
}

export interface CalEvent {
  id: string;
  title: string;
  day: number;
  month: number;
  year: number;
  time: string;
  endTime: string;
  color: string;
  note: string;
  source?: 'local' | 'google';
  googleEventId?: string;
}

export function computeProgress(tasks: { done: boolean }[]): number {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter(t => t.done).length / tasks.length) * 100);
}

export function genHeatmap(seed: number): number[] {
  const out: number[] = [];
  let s = seed;
  for (let i = 0; i < 30; i++) {
    s = (s * 9301 + 49297) % 233280;
    const v = s / 233280;
    out.push(v < 0.2 ? 0 : v < 0.4 ? 1 : v < 0.65 ? 2 : v < 0.85 ? 3 : 4);
  }
  return out;
}

/** Returns today as YYYY-MM-DD */
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns a human-readable relative time string from an ISO timestamp */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return 'just now';
  if (mins < 60)  return `${mins} minutes ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days === 1) return 'yesterday';
  if (days < 7)   return `${days} days ago`;
  if (days < 30)  return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
