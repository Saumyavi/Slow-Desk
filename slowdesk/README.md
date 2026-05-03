# slowdesk

A cozy, personal productivity workspace. Track tasks, projects, habits, notes, and calendar events — all in one warm, focused interface.

---

## Features

| Module | What it does |
|---|---|
| **Dashboard** | Greeting card with mood tracker, today's task list (drag to reorder), week Gantt timeline, task overview donut chart, habit activity heatmap, active project cards |
| **Tasks** | Full task list with All / Today / Upcoming / Completed tabs, priority & project filters, inline edit and delete |
| **Projects** | Project board with tone-colored cards, per-project task progress bars, due dates |
| **Calendar** | Month view with draggable events, color-coded by category |
| **Habits** | Daily habit tracking with per-habit streak counter and 30-day history heatmap |
| **Notes** | Rich freeform notes with color tones and an integrated daily gratitude journal |
| **Profile** | User profile editor — name, role, bio, location, status |
| **Tweaks panel** | Theme (light / dark), accent color (6 options), sidebar mode, content density |

**Cross-cutting:**
- Cmd/Ctrl+K spotlight search across tasks, projects, and habits
- Bell notifications with unread badge, mark-all-read, and per-item dismiss
- Daily streak counter computed from task completions
- Confetti on task completion
- Onboarding tour for new users

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Styling | Tailwind CSS v4 + custom CSS design system |
| Animations | GSAP 3.15 |
| Auth | NextAuth v4 — Google OAuth + email/password credentials |
| State | React Context (`AppProvider` in `lib/store.tsx`) |
| Client storage | `localStorage` keyed per user email |
| Server storage | `.users.json` for credential-based accounts (dev only) |
| Language | TypeScript 5 |
| Deployment | Vercel |

---

## Project Structure

```
slowdesk/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── tasks/page.tsx        # All tasks
│   ├── projects/page.tsx     # Projects
│   ├── calendar/page.tsx     # Calendar
│   ├── habits/page.tsx       # Habits
│   ├── notes/page.tsx        # Notes
│   ├── profile/page.tsx      # User profile
│   ├── login/page.tsx        # Auth callback page
│   ├── api/auth/[...nextauth]/route.ts
│   ├── api/register/route.ts
│   ├── layout.tsx
│   └── globals.css           # Design tokens + Tailwind v4
├── components/
│   ├── AppShell.tsx          # Auth gate + layout wrapper
│   ├── Sidebar.tsx
│   ├── Topbar.tsx            # Search, notifications, user menu
│   ├── TaskModal.tsx         # Add / edit task modal
│   ├── TweaksPanel.tsx       # Theme / density settings drawer
│   ├── DeskScene.tsx         # GSAP animated desk illustration
│   ├── LandingPage.tsx
│   ├── AuthModal.tsx
│   ├── AuthScreen.tsx
│   ├── Confetti.tsx
│   ├── OnboardingTour.tsx
│   ├── Icon.tsx
│   └── Providers.tsx         # NextAuth + AppProvider tree
├── lib/
│   ├── store.tsx             # Global state (tasks, projects, notifications, settings)
│   ├── data.ts               # Types, constants, seed data, helpers
│   └── auth.ts               # NextAuth config + credential helpers
└── .env.example              # Required environment variables
```

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd slowdesk
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
```

To set up Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data Persistence

All user data (tasks, projects, habits, notes, calendar events, settings) is stored in `localStorage` under the key prefix `sd:<email>:*`. There is no server-side database for app data — the app is entirely client-side after authentication.

---

## Scripts

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Serve production build locally
npm run lint     # Run ESLint
```
