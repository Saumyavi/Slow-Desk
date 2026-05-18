import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { placeCall } from '@/lib/twilio-voice';

export const runtime = 'nodejs';

/**
 * Returns the user's local hour (0-23) right now in the given IANA timezone.
 * Falls back to UTC if the timezone string is invalid.
 */
function hourInTimezone(now: Date, tz: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz || 'UTC',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const hh = parts.find(p => p.type === 'hour')?.value ?? '0';
    const n = parseInt(hh, 10);
    return Number.isFinite(n) ? n % 24 : now.getUTCHours();
  } catch {
    return now.getUTCHours();
  }
}

function matchesScheduledHour(scheduled: string | null | undefined, tz: string | null | undefined, now: Date): boolean {
  if (!scheduled) return false;
  const targetHour = parseInt(scheduled.split(':')[0] ?? '', 10);
  if (!Number.isFinite(targetHour)) return false;
  return hourInTimezone(now, tz || 'UTC') === targetHour;
}

export async function GET(request: NextRequest) {
  return handleOutbound(request, 'morning');
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const type = body.type === 'evening' ? 'evening' : 'morning';
  return handleOutbound(request, type);
}

async function handleOutbound(request: NextRequest, type: 'morning' | 'evening') {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const enabledColumn = type === 'morning' ? 'notification_call_enabled' : 'notification_call_evening_enabled';
  const timeColumn    = type === 'morning' ? 'notification_time'         : 'notification_call_evening_time';

  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select(`id, notification_phone, notification_timezone, ${enabledColumn}, ${timeColumn}`)
    .eq(enabledColumn, true);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }

  const now = new Date();

  // Only call users whose chosen local hour matches the current local hour.
  // The cron must run hourly for this to be precise.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eligible = (profiles || []).filter((p: any) =>
    p.notification_phone && matchesScheduledHour(p[timeColumn], p.notification_timezone, now),
  );

  if (eligible.length === 0) {
    return NextResponse.json({ success: true, type, sent: 0, message: 'No users opted in for this hour' });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const results = [];

  for (const profile of eligible) {
    try {
      const twimlUrl = `${baseUrl}/api/voice/twiml/start?userId=${profile.id}&type=${type}`;
      const call = await placeCall(profile.notification_phone, twimlUrl);
      results.push({ userId: profile.id, status: 'ok', callSid: call.sid });
    } catch (err) {
      console.error(`Voice call failed for ${profile.id}:`, err);
      results.push({ userId: profile.id, status: 'failed', error: String(err) });
    }
  }

  return NextResponse.json({ success: true, type, sent: results.filter(r => r.status === 'ok').length, results });
}
