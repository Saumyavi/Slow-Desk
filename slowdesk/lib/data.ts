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
  recurrenceRule?: string;        // 'daily' | 'weekly:N' (0=Sun) | 'monthly:N'
  recurrenceTemplateId?: string;  // id of the seed task for this series
}

// ── Recurrence helpers ──────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function recurrenceLabel(rule: string): string {
  if (!rule) return '';
  if (rule === 'daily') return 'Every day';
  const [type, val] = rule.split(':');
  if (type === 'weekly')    return `Every ${DAY_NAMES[parseInt(val, 10)] ?? '?'}`;
  if (type === 'biweekly')  return `Every 2 weeks (${DAY_NAMES[parseInt(val, 10)] ?? '?'})`;
  if (type === 'monthly')   return `Monthly on ${ordinal(parseInt(val, 10))}`;
  return '';
}

export function nextOccurrenceDate(rule: string, after: Date): string {
  const d = new Date(after);
  d.setHours(0, 0, 0, 0);
  if (rule === 'daily') {
    d.setDate(d.getDate() + 1);
  } else {
    const [type, val] = rule.split(':');
    const n = parseInt(val, 10);
    if (type === 'weekly') {
      d.setDate(d.getDate() + 1);
      while (d.getDay() !== n) d.setDate(d.getDate() + 1);
    } else if (type === 'biweekly') {
      d.setDate(d.getDate() + 14); // exactly 2 weeks — same weekday guaranteed
    } else if (type === 'monthly') {
      d.setDate(d.getDate() + 1);
      while (d.getDate() !== n) {
        d.setDate(d.getDate() + 1);
        if (d.getDate() === 1 && n > 28) break;
      }
    }
  }
  return d.toISOString().slice(0, 10);
}

export function dateToDueBucket(dateStr: string): Task['due'] {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t     = new Date(dateStr); t.setHours(0, 0, 0, 0);
  const diff  = Math.round((t.getTime() - today.getTime()) / 86400000);
  if (diff <= 0)  return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff <= 7)  return 'this week';
  if (diff <= 14) return 'next week';
  return 'someday';
}

// ── Natural language recurrence parser ─────────────────────────

const NLP_DAY_MAP: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

function cleanTitle(input: string, match: string): string {
  return input
    .replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[-–—,\s]+|[-–—,\s]+$/g, '')
    .trim() || input.trim();
}

export function parseRecurrenceFromTitle(input: string): { rule: string; cleanTitle: string } | null {
  const text = input.toLowerCase().trim();

  // Daily (including morning/night aliases)
  const dailyMatch = text.match(/\b(every\s+day|daily|each\s+day|every\s+morning|every\s+night|every\s+evening|every\s+weekday|weekdays|every\s+weekdays)\b/);
  if (dailyMatch) return { rule: 'daily', cleanTitle: cleanTitle(input, dailyMatch[0]) };

  // Weekend → Saturday
  const weekendMatch = text.match(/\b(every\s+weekend|weekends|each\s+weekend)\b/);
  if (weekendMatch) return { rule: 'weekly:6', cleanTitle: cleanTitle(input, weekendMatch[0]) };

  // Biweekly: "every 2 weeks", "every other week", "fortnightly", "every other monday"
  const biweeklyGeneric = text.match(/\b(every\s+2\s+weeks|every\s+two\s+weeks|fortnightly|every\s+other\s+week|bi-?weekly)\b/);
  if (biweeklyGeneric) {
    // Default biweekly to current day of week
    const dayNum = new Date().getDay();
    return { rule: `biweekly:${dayNum}`, cleanTitle: cleanTitle(input, biweeklyGeneric[0]) };
  }
  const biweeklyDayMatch = text.match(/\bevery\s+other\s+(sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)\b/);
  if (biweeklyDayMatch) {
    const key = biweeklyDayMatch[1].slice(0, 3) as keyof typeof NLP_DAY_MAP;
    if (NLP_DAY_MAP[key] !== undefined)
      return { rule: `biweekly:${NLP_DAY_MAP[key]}`, cleanTitle: cleanTitle(input, biweeklyDayMatch[0]) };
  }

  // Weekly: "every monday", "each fri"
  const weeklyMatch = text.match(/\b(every|each)\s+(sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)\b/);
  if (weeklyMatch) {
    const key = weeklyMatch[2].slice(0, 3) as keyof typeof NLP_DAY_MAP;
    if (NLP_DAY_MAP[key] !== undefined)
      return { rule: `weekly:${NLP_DAY_MAP[key]}`, cleanTitle: cleanTitle(input, weeklyMatch[0]) };
  }

  // Monthly with ordinal: "pay rent every 1st", "1st of every month"
  const monthlyOrdinalFwd = text.match(/\bevery\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (monthlyOrdinalFwd) {
    const day = parseInt(monthlyOrdinalFwd[1], 10);
    if (day >= 1 && day <= 28) return { rule: `monthly:${day}`, cleanTitle: cleanTitle(input, monthlyOrdinalFwd[0]) };
  }
  const monthlyOrdinalBwd = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+of\s+every\s+month\b/);
  if (monthlyOrdinalBwd) {
    const day = parseInt(monthlyOrdinalBwd[1], 10);
    if (day >= 1 && day <= 28) return { rule: `monthly:${day}`, cleanTitle: cleanTitle(input, monthlyOrdinalBwd[0]) };
  }

  // Monthly generic
  const monthlyMatch = text.match(/\b(every\s+month|monthly|each\s+month)\b/);
  if (monthlyMatch) return { rule: 'monthly:1', cleanTitle: cleanTitle(input, monthlyMatch[0]) };

  return null;
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
