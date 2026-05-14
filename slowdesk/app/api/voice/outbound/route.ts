import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { placeCall } from '@/lib/twilio-voice';

export const runtime = 'nodejs';

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

  const column = type === 'morning' ? 'notification_call_enabled' : 'notification_call_evening_enabled';
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('id, notification_phone')
    .eq(column, true);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }

  const eligible = (profiles || []).filter(p => p.notification_phone);
  if (eligible.length === 0) {
    return NextResponse.json({ success: true, type, sent: 0, message: 'No users opted in' });
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
