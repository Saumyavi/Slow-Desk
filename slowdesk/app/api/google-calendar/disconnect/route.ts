import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase.from('user_profiles').update({
    google_calendar_connected:     false,
    google_calendar_access_token:  null,
    google_calendar_refresh_token: null,
    google_calendar_token_expiry:  null,
  }).eq('id', user.id);

  await supabase.from('calendar_events').delete().eq('user_id', user.id).eq('source', 'google');

  return NextResponse.json({ ok: true });
}
