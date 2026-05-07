import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function upsertEvent(supabase: SupabaseClient, userId: string, event: {
  googleEventId: string; title: string;
  day: number; month: number; year: number;
  time: string; endTime: string; note: string;
}) {
  const { error } = await supabase.from('calendar_events').upsert({
    user_id:         userId,
    google_event_id: event.googleEventId,
    title:           event.title,
    day:             event.day,
    month:           event.month,
    year:            event.year,
    time:            event.time,
    end_time:        event.endTime,
    color:           '#5b8fbf',
    note:            event.note,
    source:          'google',
    updated_at:      new Date().toISOString(),
  }, { onConflict: 'user_id,google_event_id', ignoreDuplicates: false });
  if (error) throw error;
}

function parseGoogleEvent(ev: any): {
  googleEventId: string; title: string;
  day: number; month: number; year: number;
  time: string; endTime: string; note: string;
} | null {
  const start = ev.start?.dateTime ?? ev.start?.date;
  const end   = ev.end?.dateTime   ?? ev.end?.date;
  if (!start || !ev.summary) return null;

  const startDate = new Date(start);
  const endDate   = end ? new Date(end) : null;

  const pad = (n: number) => String(n).padStart(2, '0');
  const toTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  // All-day events have date only (no time component)
  const isAllDay = !ev.start?.dateTime;

  return {
    googleEventId: ev.id,
    title:   ev.summary,
    day:     startDate.getDate(),
    month:   startDate.getMonth(),
    year:    startDate.getFullYear(),
    time:    isAllDay ? '00:00' : toTime(startDate),
    endTime: isAllDay ? '23:59' : (endDate ? toTime(endDate) : toTime(startDate)),
    note:    ev.description ?? ev.location ?? '',
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Read tokens directly with server client
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('google_calendar_connected, google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry')
    .eq('id', user.id)
    .single();

  if (!profile?.google_calendar_connected || !profile.google_calendar_access_token) {
    return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
  }

  let accessToken = profile.google_calendar_access_token;

  // Refresh token if expired or about to expire (within 5 minutes)
  const expiry = profile.google_calendar_token_expiry
    ? new Date(profile.google_calendar_token_expiry).getTime()
    : 0;
  if (Date.now() > expiry - 5 * 60 * 1000 && profile.google_calendar_refresh_token) {
    const refreshed = await refreshAccessToken(profile.google_calendar_refresh_token);
    if (!refreshed) return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
    accessToken = refreshed.access_token;
    await supabase.from('user_profiles').update({
      google_calendar_access_token: accessToken,
      google_calendar_token_expiry: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    }).eq('id', user.id);
  }

  // Fetch events from Google: next 90 days + past 30 days
  const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy:      'startTime',
    maxResults:   '250',
  });

  const gcalRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!gcalRes.ok) {
    const gcalErr = await gcalRes.json().catch(() => ({}));
    return NextResponse.json({ error: 'Google Calendar API error', detail: gcalErr }, { status: 502 });
  }

  const gcalData = await gcalRes.json();
  const items: any[] = gcalData.items ?? [];

  let synced = 0;
  let upsertError: string | null = null;
  for (const item of items) {
    const parsed = parseGoogleEvent(item);
    if (!parsed) continue;
    try {
      await upsertEvent(supabase, user.id, parsed);
      synced++;
    } catch (e: any) {
      upsertError = e?.message ?? String(e);
      break;
    }
  }

  if (upsertError) {
    return NextResponse.json({ error: 'Upsert failed', detail: upsertError }, { status: 500 });
  }

  return NextResponse.json({ synced });
}
