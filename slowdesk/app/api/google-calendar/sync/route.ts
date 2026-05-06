import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getGoogleCalendarStatus,
  saveGoogleCalendarTokens,
  upsertGoogleCalendarEvent,
} from '@/lib/supabase/db';

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

  const status = await getGoogleCalendarStatus(user.id);
  if (!status?.google_calendar_connected || !status.google_calendar_access_token) {
    return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
  }

  let accessToken = status.google_calendar_access_token;

  // Refresh token if expired or about to expire (within 5 minutes)
  const expiry = status.google_calendar_token_expiry
    ? new Date(status.google_calendar_token_expiry).getTime()
    : 0;
  if (Date.now() > expiry - 5 * 60 * 1000 && status.google_calendar_refresh_token) {
    const refreshed = await refreshAccessToken(status.google_calendar_refresh_token);
    if (!refreshed) return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
    accessToken = refreshed.access_token;
    await saveGoogleCalendarTokens(user.id, {
      accessToken,
      refreshToken: status.google_calendar_refresh_token,
      expiryMs: Date.now() + refreshed.expires_in * 1000,
    });
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
    return NextResponse.json({ error: 'Google Calendar API error' }, { status: 502 });
  }

  const gcalData = await gcalRes.json();
  const items: any[] = gcalData.items ?? [];

  let synced = 0;
  for (const item of items) {
    const parsed = parseGoogleEvent(item);
    if (!parsed) continue;
    await upsertGoogleCalendarEvent(user.id, parsed);
    synced++;
  }

  return NextResponse.json({ synced });
}
