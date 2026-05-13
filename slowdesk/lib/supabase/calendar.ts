import { createClient } from './client';

function getClient() { return createClient(); }

export async function getCalendarEvents(userId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .order('year',  { ascending: true })
    .order('month', { ascending: true })
    .order('day',   { ascending: true });

  if (error || !data) return [];

  return data.map((e: any) => ({
    id: e.id,
    title: e.title,
    day: e.day,
    month: e.month,
    year: e.year,
    time: e.time,
    endTime: e.end_time,
    color: e.color,
    note: e.note || '',
    source: (e.source ?? 'local') as 'local' | 'google',
    googleEventId: e.google_event_id ?? undefined,
  }));
}

export async function createCalendarEvent(userId: string, event: any) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      id: `e${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: userId,
      title: event.title,
      day: event.day,
      month: event.month,
      year: event.year,
      time: event.time,
      end_time: event.endTime,
      color: event.color,
      note: event.note,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCalendarEvent(userId: string, eventId: string, updates: any) {
  const supabase = getClient();
  const { error } = await supabase
    .from('calendar_events')
    .update({
      title: updates.title,
      day: updates.day,
      month: updates.month,
      year: updates.year,
      time: updates.time,
      end_time: updates.endTime,
      color: updates.color,
      note: updates.note,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .eq('user_id', userId);
  if (error) throw error;
  return true;
}

export async function deleteCalendarEvent(userId: string, eventId: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId)
    .eq('user_id', userId);
  if (error) throw error;
  return true;
}

export async function upsertGoogleCalendarEvent(userId: string, event: {
  googleEventId: string;
  title: string;
  day: number; month: number; year: number;
  time: string; endTime: string;
  note: string;
}) {
  const supabase = getClient();
  const { error } = await supabase
    .from('calendar_events')
    .upsert({
      user_id: userId,
      google_event_id: event.googleEventId,
      title: event.title,
      day: event.day,
      month: event.month,
      year: event.year,
      time: event.time,
      end_time: event.endTime,
      color: '#5b8fbf',
      note: event.note,
      source: 'google',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,google_event_id', ignoreDuplicates: false });
  if (error) throw error;
}
