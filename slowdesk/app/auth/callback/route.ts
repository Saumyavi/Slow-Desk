import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createUserProfile } from '@/lib/supabase/db';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create user profile if it doesn't exist (for new users)
      try {
        await createUserProfile(
          data.user.id,
          data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          data.user.email || ''
        );
      } catch (err) {
        // Profile might already exist, that's okay
        console.log('Profile creation skipped:', err);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/?error=auth_callback_error`);
}
