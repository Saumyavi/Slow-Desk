import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${origin}/calendar?gcal_error=access_denied`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  `${origin}/auth/google-calendar/callback`,
      grant_type:    'authorization_code',
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokenRes.ok || !tokens.access_token) {
    return NextResponse.redirect(`${origin}/calendar?gcal_error=token_exchange_failed`);
  }

  // Use server client — has the session cookie from the browser
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/calendar?gcal_error=not_authenticated`);
  }

  // Update directly with server client so RLS auth is correct
  const { error: dbError } = await supabase
    .from('user_profiles')
    .update({
      google_calendar_connected:     true,
      google_calendar_access_token:  tokens.access_token,
      google_calendar_refresh_token: tokens.refresh_token ?? null,
      google_calendar_token_expiry:  new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
    })
    .eq('id', user.id);

  if (dbError) {
    return NextResponse.redirect(`${origin}/calendar?gcal_error=db_save_failed`);
  }

  return NextResponse.redirect(`${origin}/calendar?gcal_connected=1`);
}
