import type { Task } from '@/lib/types';

export function dateToDueBucket(dateStr: string): Task['due'] {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t     = new Date(dateStr + 'T00:00:00'); t.setHours(0, 0, 0, 0);
  const diff  = Math.round((t.getTime() - today.getTime()) / 86400000);
  if (diff < 0)   return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff <= 7)  return 'this week';
  if (diff <= 14) return 'next week';
  return 'someday';
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function relativeTime(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
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
