'use client';
import { SessionProvider } from 'next-auth/react';
import { AppProvider } from '@/lib/store';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppProvider>{children}</AppProvider>
    </SessionProvider>
  );
}
