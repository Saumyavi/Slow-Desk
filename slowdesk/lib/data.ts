export * from './types';
export * from './recurrence';
export * from './utils/dates';
export * from './utils/tasks';

import type { Tone, Project, Habit, Note } from './types';

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
  "Progress, not perfection.",
  "One task at a time. One day at a time.",
  "Rest if you must, but don't quit.",
  "Discipline is just choosing between what you want now and what you want most.",
  "Every expert was once a beginner.",
  "Consistency beats intensity every time.",
  "You don't have to be great to start, but you have to start to be great.",
  "Momentum is built in the quiet moments no one sees.",
  "Show up. Even on the bad days.",
  "The work you do today is the rest you enjoy tomorrow.",
  "Clarity comes from action, not thought.",
  "It always seems impossible until it's done.",
  "Your future self is watching — make them proud.",
  "Focus on the process. The results will follow.",
  "Slow progress is still progress.",
  "Do the next right thing.",
  "Energy flows where attention goes.",
  "Finish what you start. Start what matters.",
  "Motivation fades. Discipline builds careers.",
];

export const PROJECTS: Project[] = [];
export const HABITS: Habit[] = [];
export const NOTES: Note[] = [];
