import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { sendWhatsApp } from '@/lib/twilio';
import { getMorningDigestEmail, getMorningDigestWhatsApp, getMorningDigestTemplateVars } from '@/lib/emails/morning-digest';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('notification_email_enabled, notification_whatsapp_enabled, notification_phone')
      .eq('id', user.id)
      .maybeSingle();

    const today = new Date();
    const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const userName = user.email?.split('@')[0] ?? 'there';

    const tasks = await getTodayTasks(supabase, user.id, today);
    const digestData = { userName, tasks, date: dateLabel };

    const sent: string[] = [];
    const errors: string[] = [];
    const debug: Record<string, unknown> = {};

    // Email — always send in test mode regardless of toggle
    if (user.email) {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        errors.push('RESEND_API_KEY is not set in environment variables');
      } else {
        const resend = new Resend(apiKey);
        let toEmail = user.email;

        const trySend = async (to: string) => resend.emails.send({
          from: 'SlowDesk <onboarding@resend.dev>',
          to,
          subject: `☕ [Test] Your morning ritual — ${dateLabel}`,
          html: getMorningDigestEmail(digestData),
        });

        try {
          let result = await trySend(toEmail);

          // Resend free tier only allows sending to the account owner's email.
          // If that restriction fires, extract the allowed email from the error
          // message and retry — so test delivery always works.
          if (result.error?.name === 'validation_error' && result.error.message.includes('own email address')) {
            const match = result.error.message.match(/\(([^)]+@[^)]+)\)/);
            if (match) {
              toEmail = match[1];
              result = await trySend(toEmail);
            }
          }

          if (result.error) {
            errors.push(`Resend error: ${result.error.message}`);
          } else {
            sent.push('email');
            debug.resendId = result.data?.id;
            debug.sentTo = toEmail;
          }
        } catch (err) {
          errors.push(`Email failed: ${String(err)}`);
        }
      }
    }

    // WhatsApp — only if enabled and phone set
    if (profile?.notification_whatsapp_enabled && profile?.notification_phone) {
      try {
        const contentSid = process.env.TWILIO_CONTENT_SID;
        await sendWhatsApp(
          contentSid
            ? { to: profile.notification_phone, contentSid, contentVariables: getMorningDigestTemplateVars(digestData) }
            : { to: profile.notification_phone, body: getMorningDigestWhatsApp(digestData) },
        );
        sent.push('whatsapp');
      } catch (err) {
        errors.push(`WhatsApp failed: ${String(err)}`);
      }
    }

    return NextResponse.json({
      sent,
      errors,
      tasks: tasks.length,
      sentTo: user.email,
      debug,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

async function getTodayTasks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  _today: Date,
) {
  const { data } = await supabase
    .from('tasks')
    .select('title, done, priority, projects(name)')
    .eq('user_id', userId)
    .eq('done', false)
    .order('priority', { ascending: false })
    .limit(10);

  return (data || []).map((t: any) => ({
    title: t.title,
    project: t.projects?.name || '',
    priority: t.priority,
  }));
}
