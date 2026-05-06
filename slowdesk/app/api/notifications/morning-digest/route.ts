import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { sendWhatsApp } from '@/lib/twilio';
import { getMorningDigestEmail, getMorningDigestWhatsApp, getMorningDigestTemplateVars } from '@/lib/emails/morning-digest';

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

    // Current UTC hour, e.g. "08"
    const nowUtcHour = new Date().getUTCHours().toString().padStart(2, '0');

    // Fetch all users who have any notification enabled
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, notification_email_enabled, notification_whatsapp_enabled, notification_phone, notification_time, notification_timezone')
      .or('notification_email_enabled.eq.true,notification_whatsapp_enabled.eq.true');

    if (profilesError) {
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    // Filter to users whose local notification time matches current UTC hour
    const targets = (profiles || []).filter((p: any) => {
      const [hh] = (p.notification_time ?? '08:00').split(':');
      // Convert user's local time to UTC using their timezone offset
      try {
        const tz = p.notification_timezone || 'UTC';
        // Get what the current UTC hour looks like in the user's timezone
        const userLocalHour = new Date().toLocaleString('en-US', {
          timeZone: tz,
          hour: 'numeric',
          hour12: false,
        }).padStart(2, '0');
        return userLocalHour === hh;
      } catch {
        // Fallback: compare directly against UTC hour
        return hh === nowUtcHour;
      }
    });

    if (targets.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No users to notify at this hour' });
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

        if (profile.notification_email_enabled && userEmail) {
          await resend.emails.send({
            from: 'SlowDesk <onboarding@resend.dev>',
            to: userEmail,
            subject: `☕ Your morning ritual — ${dateLabel}`,
            html: getMorningDigestEmail(digestData),
          });
          sent.push('email');
        }

        if (profile.notification_whatsapp_enabled && profile.notification_phone) {
          const contentSid = process.env.TWILIO_CONTENT_SID;
          await sendWhatsApp(
            contentSid
              ? { to: profile.notification_phone, contentSid, contentVariables: getMorningDigestTemplateVars(digestData) }
              : { to: profile.notification_phone, body: getMorningDigestWhatsApp(digestData) },
          );
          sent.push('whatsapp');
        }

        results.push({ userId, sent, status: 'ok' });
      } catch (err) {
        console.error(`Morning digest failed for ${userId}:`, err);
        results.push({ userId, status: 'failed', error: String(err) });
      }
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
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  const { data } = await supabaseAdmin
    .from('tasks')
    .select('title, done, priority, projects(name)')
    .eq('user_id', userId)
    .eq('done', false)
    .or(`due.is.null,due.lte.${todayStr}`)
    .order('priority', { ascending: false })
    .limit(10);

  return (data || []).map((t: any) => ({
    title: t.title,
    project: t.projects?.name || '',
    priority: t.priority,
  }));
}
