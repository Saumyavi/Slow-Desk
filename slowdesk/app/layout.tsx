import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import AppShell from '@/components/AppShell';

const APP_URL = 'https://slowdesk.app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'SlowDesk — a calmer way to work',
    template: '%s · SlowDesk',
  },
  description: 'A warm, focused workspace for tasks, habits, projects, and notes. Built for people who want to work with intention — not urgency.',
  keywords: ['task manager', 'habit tracker', 'productivity', 'notes', 'projects', 'to-do list', 'slow productivity'],
  authors: [{ name: 'SlowDesk' }],
  creator: 'SlowDesk',
  openGraph: {
    type: 'website',
    url: APP_URL,
    siteName: 'SlowDesk',
    title: 'SlowDesk — a calmer way to work',
    description: 'Tasks, habits, projects, and notes — all in one warm, focused workspace.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'SlowDesk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SlowDesk — a calmer way to work',
    description: 'Tasks, habits, projects, and notes — all in one warm, focused workspace.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.ico',
    apple: [{ url: '/api/icon?size=180', sizes: '180x180', type: 'image/png' }],
    other: [{ rel: 'mask-icon', url: '/favicon.ico' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#c1623f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
