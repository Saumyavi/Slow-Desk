# Slowdesk

A calm, personal productivity workspace — tasks, projects, habits, notes, calendar, and an AI **voice agent** that calls you twice a day to plan and reflect.

---

## Features

### Core modules

| Module | Description |
|---|---|
| **Dashboard** | Daily task queue (drag to reorder), week timeline, habit heatmap, project progress, greeting card |
| **Tasks** | All / Today / Upcoming / Completed tabs · priority + project filters · due dates · subtasks · descriptions · recurring tasks · photo-to-task OCR · voice input · AI task breakdown |
| **Projects** | Tone-colored project cards · per-project task progress · due dates · uploaded project documents (Supabase Storage) |
| **Calendar** | Month view with **Google Calendar** two-way sync — events pulled automatically with a `G` badge |
| **Habits** | Daily check-ins, subhabits, streak counters, 30-day heatmaps, AI insights |
| **Notes** | Freeform notes with tone colors and a daily gratitude journal · optional AI enhancement |
| **Pomodoro** | Built-in focus timer with sessions persisted per user |
| **Profile & Tweaks** | Theme (light/dark) · 6 accent colors · sidebar mode · content density · dashboard layout · avatar upload |

### Notifications & rituals

| Channel | What it does |
|---|---|
| **Email digest** | Morning email summary via **Resend** at your chosen local time |
| **WhatsApp digest** | Same digest delivered via **Twilio WhatsApp Business** |
| **Morning voice call** | An AI agent calls you (via Twilio Voice) to walk through today's tasks and habits — at *your* local time, in *your* timezone |
| **Evening voice call** | Reflective end-of-day call: completed tasks, what's left, project-progress recap |
| **Weekly retrospective** | Auto-generated weekly summary email every Sunday |

### Voice agent capabilities

The voice agent runs on **Groq `llama-3.3-70b-versatile`** with function-calling. During a call it can:

- Complete, reschedule, delete, or create tasks
- Set task time, change priority
- Complete or skip habits
- Pull **today's calendar events** (including Google-synced ones) into context — e.g. *"you have a 2 pm call, want to move gym to 4?"*
- Recap **project progress** on evening calls — e.g. *"Aurora is 70% done, 2 tasks left this week"*
- Persist long-term **call memory** across sessions
- End the conversation cleanly

### Cross-cutting

- ⌘/Ctrl + K spotlight search
- Bell notifications
- Confetti on task completion
- Guided onboarding tour
- PWA support (installable, offline shell, service worker)
- SEO basics (sitemap, robots, dynamic icon/manifest)

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16.2.4** (App Router · Turbopack) |
| Language | **TypeScript 5** |
| UI | **React 19.2.4** |
| Styling | **Tailwind CSS v4** + custom CSS design tokens |
| Animations | **GSAP 3** |
| Auth | **Supabase Auth** (Google OAuth + email/password) |
| Database | **Supabase Postgres** (RLS via `auth.uid() = user_id`) |
| Storage | **Supabase Storage** (avatars, project documents) |
| Background jobs | **Vercel Cron** + **Supabase `pg_cron` / `pg_net`** |
| Email | **Resend** |
| WhatsApp | **Twilio WhatsApp Business API** |
| Voice (telephony) | **Twilio Programmable Voice** (outbound calls + TwiML webhooks) |
| Voice (LLM) | **Groq** — `llama-3.3-70b-versatile` with tool calling |
| AI task parsing | **Google Gemini 2.5 Flash** |
| OCR | **Tesseract.js** (runs in-browser, no server cost) |
| Calendar | **Google Calendar API** (OAuth + sync) |
| State | React Context (`lib/store.tsx`) |
| Deployment | **Vercel** |

---

## Project structure

```
slowdesk/
├── app/
│   ├── page.tsx                     # Dashboard
│   ├── tasks/                       # Tasks page
│   ├── projects/                    # Projects page
│   ├── calendar/                    # Calendar page (Google-synced)
│   ├── habits/                      # Habits + subhabits
│   ├── notes/                       # Notes + gratitude
│   ├── profile/                     # Settings, theme, schedule, voice toggles
│   ├── auth/
│   │   ├── callback/                # Supabase OAuth callback
│   │   └── google-calendar/         # Google Calendar OAuth callback
│   ├── api/
│   │   ├── google-calendar/         # connect · sync · disconnect
│   │   ├── habits/insights/         # AI habit analysis
│   │   ├── notes/                   # AI note helpers
│   │   ├── notifications/
│   │   │   └── morning-digest/      # Hourly cron — email + WhatsApp fan-out
│   │   ├── retrospective/           # Weekly retrospective (Sundays)
│   │   ├── tasks/
│   │   │   ├── breakdown/           # AI task breakdown
│   │   │   ├── parse-recurrence/    # Natural-language recurrence parser
│   │   │   └── voice/               # Voice → task creation
│   │   ├── voice/
│   │   │   ├── outbound/            # Hourly cron — places Twilio calls
│   │   │   ├── twiml/start/         # Twilio webhook: greeting + session bootstrap
│   │   │   ├── twiml/handle/        # Twilio webhook: SpeechResult → agent turn
│   │   │   └── test/                # Local debug helper
│   │   └── icon/                    # Dynamic app icon
│   ├── layout.tsx
│   ├── manifest.ts                  # PWA manifest
│   └── globals.css                  # Design tokens + Tailwind v4
├── components/
│   ├── layout/                      # AppShell · Sidebar · Topbar · TweaksPanel · Providers · ServiceWorkerRegistration
│   ├── features/                    # PomodoroTimer · VoiceCapture · CameraCapture · OnboardingTour
│   ├── marketing/                   # LandingPage · AuthScreen · DeskScene
│   ├── tasks/                       # TaskModal · TaskReview
│   └── ui/                          # Icon · Confetti
├── lib/
│   ├── data.ts                      # Types, constants, shared helpers
│   ├── store.tsx                    # Global React context
│   ├── types.ts
│   ├── task-parser.ts               # OCR / voice text → structured tasks
│   ├── recurrence.ts                # Recurring task expansion
│   ├── ocr.ts                       # Tesseract.js wrapper
│   ├── habit-analysis.ts            # Habit streak analytics
│   ├── voice-agent.ts               # Groq tools, prompts, memory, evening summary
│   ├── twilio.ts                    # WhatsApp helper
│   ├── twilio-voice.ts              # Outbound call helper
│   ├── emails/                      # morning-digest · weekly-retrospective
│   ├── supabase/                    # client · server · db · tasks · habits · projects · notes · calendar · profile
│   └── utils/                       # dates · tasks
├── supabase/
│   └── migrations/                  # SQL migrations — run in filename order
├── scripts/
│   └── preview-email.mjs            # Local email template preview
├── public/                          # sw.js · robots.txt · sitemap.xml
├── proxy.ts                         # Supabase session refresh on every request (Next.js 16)
├── next.config.ts                   # Security headers, compression
├── vercel.json                      # Hourly cron schedule
└── .env.example
```

---

## Getting started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd slowdesk
npm install
```

### 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run every file in `supabase/migrations/` **in filename order** via the SQL Editor.
3. Authentication → URL Configuration:
   - **Site URL:** `https://your-domain.vercel.app`
   - **Redirect URLs:** `https://your-domain.vercel.app/auth/callback`
4. Storage: the `20260511_storage_setup.sql` migration creates the `avatars` and `project-documents` buckets with RLS.

### 3. Google OAuth (two separate configs)

**For Supabase sign-in**
1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID.
2. Redirect URI: `https://<project>.supabase.co/auth/v1/callback`.
3. Paste Client ID + Secret into Supabase → Authentication → Providers → Google.

**For Google Calendar sync**
1. Enable the **Google Calendar API** in the same Cloud project.
2. Add redirect URIs:
   ```
   http://localhost:3000/auth/google-calendar/callback
   https://your-domain.vercel.app/auth/google-calendar/callback
   ```
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your env file.

### 4. Twilio setup (optional, for WhatsApp + voice calls)

1. Create a Twilio account and grab Account SID + Auth Token.
2. **WhatsApp:** join the Twilio sandbox or provision a WhatsApp sender; set `TWILIO_WHATSAPP_FROM`.
3. **Voice:** buy a phone number, set `TWILIO_PHONE_FROM`, and point its **Voice webhook** at `https://your-domain.vercel.app/api/voice/twiml/handle` (POST).
4. The outbound call route uses `TwiML <Connect>`-style flow rooted at `/api/voice/twiml/start`.

### 5. Groq setup (voice agent brain)

1. Get an API key at [console.groq.com](https://console.groq.com).
2. Set `GROQ_API_KEY`.

### 6. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (cron only — keep secret) |
| `CRON_SECRET` | ✅ | `openssl rand -hex 32` — protects cron endpoints |
| `RESEND_API_KEY` | ✅ | From [resend.com](https://resend.com) |
| `RESEND_FROM_EMAIL` | — | Custom sender, e.g. `SlowDesk <hi@yourdomain.com>` |
| `GOOGLE_CLIENT_ID` | — | Google Calendar sync |
| `GOOGLE_CLIENT_SECRET` | — | Google Calendar sync |
| `GEMINI_API_KEY` | — | AI task parsing, note helpers, habit insights |
| `GROQ_API_KEY` | — | Voice agent LLM |
| `TWILIO_ACCOUNT_SID` | — | WhatsApp + voice |
| `TWILIO_AUTH_TOKEN` | — | WhatsApp + voice |
| `TWILIO_WHATSAPP_FROM` | — | e.g. `whatsapp:+14155238886` |
| `TWILIO_PHONE_FROM` | — | E.164 number used for outbound voice calls |
| `NEXT_PUBLIC_SITE_URL` | — | Public URL — needed for Twilio webhooks |

### 7. Run locally

```bash
npm run dev
```

Opens [http://localhost:3000](http://localhost:3000). Use `npx next dev -p 3001` to pick a different port.

---

## Database migrations

All migrations live in `supabase/migrations/` and must be applied **in filename order** via the Supabase SQL Editor (no CLI runner is wired up). Highlights:

- `20260506_notification_preferences.sql` — notification toggles, per-user `notification_time` + `notification_timezone`
- `20260507_google_calendar*.sql` — Google Calendar tokens + `calendar_events` table
- `20260507_pomodoro_sessions.sql` — Pomodoro session log
- `20260507_subtasks.sql` · `20260511_subhabits.sql` — sub-items for tasks and habits
- `20260508_avatar_url.sql` · `20260511_storage_setup.sql` — avatar + document storage with RLS
- `20260508_recurring_tasks.sql` · `20260512_task_due_date.sql` · `20260511_task_description.sql` — task model upgrades
- `20260511_project_documents.sql` — document uploads per project
- `20260514_voice_agent.sql` · `20260515_voice_memory.sql` · `20260515_voice_sessions_habits_memory.sql` — voice sessions + long-term memory
- `20260514_evening_cron.sql` · `20260518_evening_cron_hourly.sql` — pg_cron job for evening calls (hourly)
- `20260518_voice_agent_calendar_times.sql` — per-user evening time + `calendar_events` / `project_progress` columns on `voice_sessions`

---

## Cron jobs

Hourly fan-out crons let each user pick their own local time without per-user schedules.

| Trigger | Endpoint | What happens |
|---|---|---|
| `0 * * * *` (Vercel) | `/api/notifications/morning-digest` | For each user whose **local hour** matches their `notification_time`, send email + WhatsApp digest. On Sundays at 04:00 UTC, also fan out the **weekly retrospective**. |
| `0 * * * *` (pg_cron → pg_net) | `/api/voice/outbound` | For each user whose **local hour** matches their morning or evening voice-call time, place a Twilio call. |

Cron requests are authenticated via `Authorization: Bearer <CRON_SECRET>`.

> **Note:** Hourly Vercel crons require the **Pro** plan. On Hobby, trigger `/api/notifications/morning-digest` from Supabase `pg_cron` instead (same pattern as the voice cron).

---

## Scripts

```bash
npm run dev      # Dev server (Turbopack)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint

node scripts/preview-email.mjs   # Preview email templates in the browser
```

---

## Deployment

```bash
npx vercel --prod
```

Before deploying, set all environment variables in **Vercel → Settings → Environment Variables**. The cron in `vercel.json` activates automatically. Make sure `NEXT_PUBLIC_SITE_URL` matches your production domain so Twilio webhooks resolve correctly.

---

## Security

- All Supabase tables use **Row Level Security** keyed on `auth.uid() = user_id`.
- Cron endpoints reject requests without the `CRON_SECRET` bearer token.
- `next.config.ts` sets security headers (CSP, X-Frame-Options, Referrer-Policy, etc.) and enables compression.
- Service role key is **server-only** and never shipped to the browser.
- Twilio webhooks should be restricted to your production domain.

---

## License

Private project — all rights reserved.
