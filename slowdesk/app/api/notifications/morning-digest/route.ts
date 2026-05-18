import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { sendWhatsApp } from '@/lib/twilio';
import { placeCall } from '@/lib/twilio-voice';
import { getMorningDigestEmail, getMorningDigestWhatsApp, getMorningDigestTemplateVars } from '@/lib/emails/morning-digest';

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

/** Match "HH" or "HH:MM" against the current hour in the user's timezone. */
function matchesScheduledHour(scheduled: string | null | undefined, tz: string | null | undefined, now: Date): boolean {
  if (!scheduled) return false;
  const targetHour = parseInt(scheduled.split(':')[0] ?? '', 10);
  if (!Number.isFinite(targetHour)) return false;
  return hourInTimezone(now, tz || 'UTC') === targetHour;
}

export async function GET(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Fetch all users who have any notification enabled
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, notification_email_enabled, notification_whatsapp_enabled, notification_call_enabled, notification_phone, notification_time, notification_timezone');

    if (profilesError) {
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    const now = new Date();

    // Only contact users whose local morning-time hour matches the current hour.
    // The cron itself runs hourly so this acts as a per-user filter.
    const targets = (profiles || []).filter((p: any) => {
      const anyEnabled = p.notification_email_enabled || p.notification_whatsapp_enabled || p.notification_call_enabled;
      if (!anyEnabled) return false;
      return matchesScheduledHour(p.notification_time, p.notification_timezone, now);
    });

    if (targets.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No users opted in' });
    }

    // Fetch auth users to get emails
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailMap: Record<string, string> = {};
    for (const u of authUsers?.users ?? []) {
      if (u.email) emailMap[u.id] = u.email;
    }

    const today = new Date();
    const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const results = [];

    for (const profile of targets) {
      const userId = profile.id;
      const userEmail = emailMap[userId];

      try {
        const tasks = await getTodayTasks(supabaseAdmin, userId, today);
        const userName = userEmail ? userEmail.split('@')[0] : 'there';
        const digestData = { userName, tasks, date: dateLabel };

        const sent: string[] = [];

        const fromAddr = process.env.RESEND_FROM_EMAIL || 'SlowDesk <onboarding@resend.dev>';
        if (profile.notification_email_enabled && userEmail) {
          await resend.emails.send({
            from: fromAddr,
            to: userEmail,
            subject: `☕ Your morning ritual — ${dateLabel}`,
            html: getMorningDigestEmail(digestData),
          });
          sent.push('email');
        }

        if (profile.notification_whatsapp_enabled && profile.notification_phone) {
          await sendWhatsApp({ to: profile.notification_phone, body: getMorningDigestWhatsApp(digestData) });
          sent.push('whatsapp');
        }

        if (profile.notification_call_enabled && profile.notification_phone) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
          const twimlUrl = `${baseUrl}/api/voice/twiml/start?userId=${userId}&type=morning`;
          await placeCall(profile.notification_phone, twimlUrl);
          sent.push('call');
        }

        results.push({ userId, sent, status: 'ok' });
      } catch (err) {
        console.error(`Morning digest failed for ${userId}:`, err);
        results.push({ userId, status: 'failed', error: String(err) });
      }
    }

    // Also fire weekly retrospective on Sunday at 04:00 UTC (same daily run)
    if (now.getUTCDay() === 0 && now.getUTCHours() === 4) {
      const baseUrl = new URL(request.url).origin;
      await fetch(`${baseUrl}/api/retrospective`, {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      }).catch(e => console.error('Retrospective trigger failed:', e));
    }

    return NextResponse.json({ success: true, sent: results.filter(r => r.status === 'ok').length, results });
  } catch (error) {
    console.error('Morning digest cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getTodayTasks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  userId: string,
  today: Date,
) {
  const todayStr = today.toISOString().slice(0, 10);

  // Tasks due today: either due_date <= today (new records) or due = 'today' / 'overdue' (legacy records without due_date)
  const { data } = await supabaseAdmin
    .from('tasks')
    .select('title, done, priority, due, due_date, projects(name)')
    .eq('user_id', userId)
    .eq('done', false)
    .order('priority', { ascending: false })
    .limit(50);

  return (data || [])
    .filter((t: any) => {
      if (t.due_date) return t.due_date <= todayStr;
      return t.due === 'today' || t.due === 'overdue';
    })
    .slice(0, 10)
    .map((t: any) => ({
      title: t.title,
      project: t.projects?.name || '',
      priority: t.priority,
    }));
}
