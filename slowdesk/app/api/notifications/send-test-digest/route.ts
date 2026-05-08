import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { sendWhatsApp } from '@/lib/twilio';
import { getMorningDigestEmail, getMorningDigestWhatsApp, getMorningDigestTemplateVars } from '@/lib/emails/morning-digest';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest) {
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
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.notification_email_enabled && !profile.notification_whatsapp_enabled) {
      return NextResponse.json({ error: 'Enable email or WhatsApp notifications first, then save your preferences.' }, { status: 400 });
    }

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, done, priority, projects(name)')
      .eq('user_id', user.id)
      .eq('done', false)
      .or(`due.is.null,due.lte.${todayStr}`)
      .order('priority', { ascending: false })
      .limit(10);

    const taskList = (tasks || []).map((t: { title: string; priority: string; projects: { name: string } | null }) => ({
      title: t.title,
      project: t.projects?.name || '',
      priority: t.priority,
    }));

    const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const userName = user.email?.split('@')[0] || 'there';
    const digestData = { userName, tasks: taskList, date: dateLabel };

    const sent: string[] = [];
    const errors: string[] = [];

    if (profile.notification_email_enabled && user.email) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromAddr = process.env.RESEND_FROM_EMAIL || 'SlowDesk <onboarding@resend.dev>';
        await resend.emails.send({
          from: fromAddr,
          to: user.email,
          subject: `☕ Test morning ritual — ${dateLabel}`,
          html: getMorningDigestEmail(digestData),
        });
        sent.push('email');
      } catch (err) {
        errors.push(`Email: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (profile.notification_whatsapp_enabled && profile.notification_phone) {
      try {
        const contentSid = process.env.TWILIO_CONTENT_SID;
        await sendWhatsApp(
          contentSid
            ? { to: profile.notification_phone, contentSid, contentVariables: getMorningDigestTemplateVars(digestData) }
            : { to: profile.notification_phone, body: getMorningDigestWhatsApp(digestData) },
        );
        sent.push('whatsapp');
      } catch (err) {
        errors.push(`WhatsApp: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({
      success: sent.length > 0,
      sent,
      ...(errors.length > 0 && { errors }),
    });
  } catch (error) {
    console.error('Test digest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
