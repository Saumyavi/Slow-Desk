'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/lib/store';
import Sidebar from './Sidebar';
import TweaksPanel from './TweaksPanel';
import Confetti from './Confetti';
import OnboardingTour from './OnboardingTour';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { sidebar, confettiTrigger, setUserEmail, tourDone } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  // / is public — the page itself shows landing or dashboard based on auth
  // /login kept for OAuth callbacks
  const isPublic = pathname === '/login' || pathname === '/';

  useEffect(() => {
    if (!isPublic && status === 'unauthenticated') router.replace('/');
  }, [status, router, isPublic]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      setUserEmail(session.user.email, session.user.name ?? undefined);
    }
  }, [status, session?.user?.email]);

  // Public pages render without the app shell
  if (isPublic && status !== 'authenticated') return <>{children}</>;

  if (status === 'loading') {
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

  if (status === 'unauthenticated') return null;

  return (
    <div className="app-shell" data-sidebar={sidebar}>
      <Sidebar />
      <main className="main">{children}</main>
      <Confetti trigger={confettiTrigger} />
      <TweaksPanel />
      {!tourDone && <OnboardingTour />}
    </div>
  );
}
