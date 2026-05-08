'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import Sidebar from './Sidebar';
import TweaksPanel from './TweaksPanel';
import Confetti from './Confetti';
import OnboardingTour from './OnboardingTour';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { sidebar, confettiTrigger, setUserEmail, tourDone } = useApp();
  const [tourPreview, setTourPreview] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tour') === '1') setTourPreview(true);
  }, []);
  useEffect(() => { if (tourDone) setTourPreview(false); }, [tourDone]);
  const router = useRouter();
  const pathname = usePathname();

  // / is public — the page itself shows landing or dashboard based on auth
  const isPublic = pathname === '/';

  useEffect(() => {
    // Check current session
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) console.error('Auth error:', error);
      setUser(user);
      setLoading(false);

      // Set user email in store
      if (user?.email) {
        setUserEmail(user.email, user.user_metadata?.name);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        setUserEmail(session.user.email, session.user.user_metadata?.name);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isPublic && !loading && !user) router.replace('/');
  }, [user, loading, router, isPublic]);

  // Public pages render without the app shell
  if (isPublic && !user) return <>{children}</>;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{ fontSize: 13, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
          Loading…
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app-shell" data-sidebar={sidebar}>
      <Sidebar />
      <main className="main">{children}</main>
      <Confetti trigger={confettiTrigger} />
      <TweaksPanel />
      {(!tourDone || tourPreview) && <OnboardingTour />}
    </div>
  );
}
