import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { placeCall } from '@/lib/twilio-voice';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const type = body.type === 'evening' ? 'evening' : 'morning';

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: profile } = await admin
    .from('user_profiles')
    .select('notification_phone, notification_call_enabled, notification_call_evening_enabled')
    .eq('id', user.id)
    .single();

  if (!profile?.notification_phone) {
    return NextResponse.json({ error: 'No phone number configured. Add one in Profile → Notifications.' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const twimlUrl = `${baseUrl}/api/voice/twiml/start?userId=${user.id}&type=${type}`;

  try {
    const call = await placeCall(profile.notification_phone, twimlUrl);
    return NextResponse.json({ success: true, callSid: call.sid, type });
  } catch (err) {
    console.error('request-call failed:', err);
    return NextResponse.json({ error: 'Failed to place call. Check Twilio credentials.' }, { status: 500 });
  }
}
