import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SlowDesk',
    short_name: 'SlowDesk',
    description: 'A calmer way to work — tasks, habits, projects, and notes.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f0e6d8',
    theme_color: '#c1623f',
    orientation: 'portrait',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/api/icon?size=192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/api/icon?size=512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
