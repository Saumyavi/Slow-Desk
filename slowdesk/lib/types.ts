export type Tone = 'terra' | 'sage' | 'butter' | 'plum' | 'sky';
export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  done: boolean;
  project: string;
  tone: Tone;
  attach: number;
  due: 'overdue' | 'today' | 'tomorrow' | 'this week' | 'next week' | 'someday';
  time: string;
  priority: Priority;
  description?: string;
  recurrenceRule?: string;
  recurrenceTemplateId?: string;
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
