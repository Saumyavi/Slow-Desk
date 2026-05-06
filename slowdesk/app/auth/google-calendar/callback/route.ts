import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { saveGoogleCalendarTokens } from '@/lib/supabase/db';

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

  // Get current user from Supabase session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/calendar?gcal_error=not_authenticated`);
  }

  await saveGoogleCalendarTokens(user.id, {
    accessToken:  tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiryMs:     Date.now() + (tokens.expires_in ?? 3600) * 1000,
  });

  return NextResponse.redirect(`${origin}/calendar?gcal_connected=1`);
}
