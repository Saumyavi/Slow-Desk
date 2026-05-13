# Slowdesk

A personal productivity workspace — tasks, projects, habits, notes, and calendar in one focused interface.

---

## Features

| Module | Description |
|---|---|
| **Dashboard** | Daily task queue (drag to reorder), week timeline, habit heatmap, project progress, greeting card |
| **Tasks** | All / Today / Upcoming / Completed tabs, priority & project filters, photo-to-task OCR, voice input, recurring tasks |
| **Projects** | Tone-colored project cards with per-project task progress and due dates |
| **Calendar** | Month view with Google Calendar sync — events pulled automatically with a `G` badge |
| **Habits** | Daily check-ins with streak counters and 30-day heatmaps |
| **Notes** | Freeform notes with tone colors and a daily gratitude journal |
| **Morning Ritual** | Daily task digest sent each morning via email (Resend) and/or WhatsApp (Twilio) |
| **Weekly Retrospective** | Auto-generated weekly summary email every Sunday |
| **Profile & Tweaks** | Theme (light/dark), 6 accent colors, sidebar mode, content density, dashboard layout |

**Cross-cutting:** Cmd/Ctrl+K spotlight search · bell notifications · confetti on task completion · onboarding tour · PWA support

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19 |
| Styling | Tailwind CSS v4 + custom CSS design tokens |
| Animations | GSAP 3 |
| Auth | Supabase Auth — Google OAuth + email/password |
| Database | Supabase (PostgreSQL) |
| Email | Resend |
| WhatsApp | Twilio Business API |
| OCR | Tesseract.js (in-browser, no server) |
| State | React Context |
| Deployment | Vercel |

---

## Project Structure

```
slowdesk/
├── app/
│   ├── page.tsx                                     # Dashboard
│   ├── tasks/page.tsx
│   ├── projects/page.tsx
│   ├── calendar/page.tsx
│   ├── habits/page.tsx
│   ├── notes/page.tsx
│   ├── profile/page.tsx
│   ├── auth/
│   │   ├── callback/route.ts                        # Supabase OAuth callback
│   │   └── google-calendar/callback/route.ts        # Google Calendar OAuth callback
│   ├── api/
│   │   ├── google-calendar/{connect,sync,disconnect}/route.ts
│   │   ├── habits/insights/route.ts                 # AI habit analysis
│   │   ├── notes/ai/route.ts                        # AI note enhancement
│   │   ├── notifications/
│   │   │   └── morning-digest/route.ts              # Daily cron (4 AM UTC)
│   │   ├── retrospective/route.ts                   # Weekly retrospective (Sundays)
│   │   └── tasks/{breakdown,voice,parse-recurrence}/route.ts
│   ├── layout.tsx
│   └── globals.css                                  # Design tokens + Tailwind v4
├── components/
│   ├── AppShell.tsx          # Auth gate + layout wrapper
│   ├── AuthScreen.tsx        # Login / signup modal
│   ├── CameraCapture.tsx     # Photo-to-task OCR
│   ├── Icon.tsx
│   ├── LandingPage.tsx
│   ├── OnboardingTour.tsx
│   ├── PomodoroTimer.tsx
│   ├── Sidebar.tsx
│   ├── TaskModal.tsx
│   ├── TaskReview.tsx        # OCR result review
│   ├── Topbar.tsx
│   ├── TweaksPanel.tsx
│   └── VoiceCapture.tsx
├── lib/
│   ├── data.ts               # Types, constants, shared helpers
│   ├── store.tsx             # Global React context
│   ├── task-parser.ts        # OCR / voice text → structured tasks
│   ├── twilio.ts             # WhatsApp helper
│   ├── ocr.ts                # Tesseract.js wrapper
│   ├── habit-analysis.ts     # Habit streak analytics
│   ├── emails/
│   │   ├── morning-digest.ts
│   │   └── weekly-retrospective.ts
│   └── supabase/
│       ├── client.ts         # Browser client
│       ├── server.ts         # Server client (RSC / route handlers)
│       └── db.ts             # Database helpers
├── supabase/
│   └── migrations/           # SQL migrations — run in order via Supabase SQL editor
├── scripts/
│   └── preview-email.mjs     # Local email template preview
├── public/
│   ├── sw.js                 # Service worker (PWA)
│   ├── robots.txt
│   └── sitemap.xml
├── proxy.ts                  # Supabase session refresh on every request (Next.js 16 convention)
├── next.config.ts            # Security headers, compression
├── vercel.json               # Cron schedule
└── .env.example              # Environment variable template
```

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd slowdesk
npm install
```

### 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run each file in `supabase/migrations/` in order via the **SQL Editor**
3. Go to **Authentication → URL Configuration** and set:
   - **Site URL:** `https://your-domain.vercel.app`
   - **Redirect URLs:** `https://your-domain.vercel.app/auth/callback`

### 3. Google OAuth (two separate configs)

**For Supabase sign-in:**
1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID
2. Add redirect URI: `https://<project>.supabase.co/auth/v1/callback`
3. Paste Client ID + Secret into Supabase → Authentication → Providers → Google

**For Google Calendar sync:**
1. Enable the **Google Calendar API** in the same Cloud project
2. Add redirect URIs:
   ```
   http://localhost:3000/auth/google-calendar/callback
   https://your-domain.vercel.app/auth/google-calendar/callback
   ```
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your env file

### 4. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (cron only, keep secret) |
| `CRON_SECRET` | ✅ | `openssl rand -hex 32` |
| `RESEND_API_KEY` | ✅ | From [resend.com](https://resend.com) |
| `RESEND_FROM_EMAIL` | — | Custom sender, e.g. `SlowDesk <hi@yourdomain.com>` |
| `GOOGLE_CLIENT_ID` | — | Google Calendar sync |
| `GOOGLE_CLIENT_SECRET` | — | Google Calendar sync |
| `TWILIO_ACCOUNT_SID` | — | WhatsApp digest |
| `TWILIO_AUTH_TOKEN` | — | WhatsApp digest |
| `TWILIO_WHATSAPP_FROM` | — | e.g. `whatsapp:+14155238886` |
| `GEMINI_API_KEY` | — | AI features (notes, habits, tasks) |

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Migrations

All migrations live in `supabase/migrations/` and must be run in filename order via the Supabase SQL Editor. There is no CLI migration runner — copy each file and execute it.

---

## Cron Jobs

Vercel Hobby plan supports one cron job. The single daily run handles both notification types:

| Trigger | What happens |
|---|---|
| `0 4 * * *` (4 AM UTC) | Morning digest — email + WhatsApp to opted-in users |
| Every Sunday (inline) | Weekly retrospective email triggered from inside the daily cron |

Cron requests are authenticated via `Authorization: Bearer <CRON_SECRET>`.

---

## Scripts

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Serve production build locally
npm run lint     # ESLint

node scripts/preview-email.mjs   # Preview email templates in browser
```

---

## Deployment

Deploy to Vercel with one click or via the CLI:

```bash
npx vercel --prod
```

Set all environment variables in the Vercel dashboard under **Settings → Environment Variables** before deploying. The cron job in `vercel.json` activates automatically.
