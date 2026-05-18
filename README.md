# Slowdesk

A calm, personal productivity workspace — tasks, projects, habits, notes, calendar, and an AI **voice agent** that calls you twice a day to plan and reflect.

**Live:** [slowdesk.app](https://slowdesk.app)

---

## Features

### Workspace

| Module | Highlights |
|---|---|
| **Dashboard** | Greeting card, drag-to-reorder daily queue, week timeline, task donut, habit heatmap, active project cards |
| **Tasks** | All / Today / Upcoming / Completed tabs · priority + project filters · subtasks · descriptions · due dates · recurring tasks · photo-to-task OCR · voice input · AI task breakdown |
| **Projects** | Tone-colored cards · per-project progress · due dates · document uploads (Supabase Storage) |
| **Calendar** | Month view with two-way **Google Calendar** sync (events badged `G`) |
| **Habits** | Daily check-ins · subhabits · streak counters · 30-day heatmaps · AI insights |
| **Notes** | Freeform notes with tone colors · daily gratitude journal · optional AI enhancement |
| **Pomodoro** | 25/5/15 cycle, animated SVG ring, sessions persisted per task |
| **Profile & Tweaks** | Light/dark · 6 accents · sidebar mode · density · dashboard layout · avatar upload |

### Notifications & rituals

| Channel | What it does |
|---|---|
| **Email digest** | Morning summary via **Resend** at your chosen local time |
| **WhatsApp digest** | Same digest via **Twilio WhatsApp Business** |
| **Morning voice call** | AI agent (Twilio Voice + Groq) walks you through today's tasks at your local time |
| **Evening voice call** | Reflective wrap-up: completed work, what's left, project-progress recap |
| **Weekly retrospective** | Auto-generated Sunday email summarizing the week |

### Voice agent

Powered by **Groq `llama-3.3-70b-versatile`** with function calling. Per call it can:

- Complete / reschedule / delete / create tasks, set time, change priority
- Complete or skip habits
- Pull **today's calendar events** (incl. Google-synced) into context — *"you have a 2 pm call, want to move gym to 4?"*
- Recap **project progress** on evening calls — *"Aurora is 70% done, 2 tasks left this week"*
- Persist long-term **call memory** across sessions
- End the conversation cleanly

### Polish

⌘/Ctrl+K spotlight · bell notifications · confetti on completion · 7-slide onboarding tour · installable **PWA** with offline shell · GSAP-animated landing scene · mobile bottom-nav · WCAG-friendly tokens · SEO basics (sitemap, robots, dynamic icon/manifest).

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16.2.4** · App Router · Turbopack |
| Language | **TypeScript 5** · **React 19.2.4** |
| Styling | **Tailwind CSS v4** + custom CSS design tokens |
| Animations | **GSAP 3** |
| Auth | **Supabase Auth** (Google OAuth + email/password) |
| Database | **Supabase Postgres** · RLS via `auth.uid() = user_id` |
| Storage | **Supabase Storage** (avatars, project documents) |
| Background jobs | **Supabase `pg_cron` + `pg_net`** (hourly fan-out) |
| Email | **Resend** |
| WhatsApp / SMS | **Twilio Business API** |
| Voice telephony | **Twilio Programmable Voice** (outbound + TwiML webhooks) |
| Voice LLM | **Groq** · `llama-3.3-70b-versatile` (tool calling) |
| AI task parsing | **Google Gemini 2.5 Flash** |
| OCR | **Tesseract.js** (browser-side) |
| Voice capture | **Web Speech API** (browser-native) |
| State | React Context (`lib/store.tsx`) |
| Hosting | **Vercel** (Hobby — no Pro required) |

---

## Project layout

```
slowdesk/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── (tasks|projects|calendar|habits|notes|profile)/page.tsx
│   ├── auth/
│   │   ├── callback/               # Supabase OAuth callback
│   │   └── google-calendar/        # Google Calendar OAuth callback
│   ├── api/
│   │   ├── google-calendar/        # connect · sync · disconnect
│   │   ├── habits/insights/        # AI habit analysis
│   │   ├── notes/                  # AI note helpers
│   │   ├── notifications/morning-digest/   # hourly cron · email + WhatsApp fan-out
│   │   ├── retrospective/          # weekly retrospective (Sundays)
│   │   ├── tasks/
│   │   │   ├── breakdown/          # AI task breakdown
│   │   │   ├── parse-recurrence/   # NL recurrence parser
│   │   │   └── voice/              # voice → task creation
│   │   └── voice/
│   │       ├── outbound/           # hourly cron · places Twilio calls
│   │       └── twiml/{start,handle}/   # Twilio webhooks
│   ├── manifest.ts                 # PWA manifest
│   └── globals.css                 # design tokens + Tailwind v4
├── components/
│   ├── layout/                     # AppShell · Sidebar · Topbar · TweaksPanel · Providers
│   ├── features/                   # PomodoroTimer · VoiceCapture · CameraCapture · OnboardingTour
│   ├── marketing/                  # LandingPage · AuthScreen · DeskScene
│   ├── tasks/                      # TaskModal · TaskReview
│   └── ui/                         # Icon · Confetti
├── lib/
│   ├── data.ts · types.ts · store.tsx
│   ├── task-parser.ts · recurrence.ts · ocr.ts · habit-analysis.ts
│   ├── voice-agent.ts              # Groq tools, prompts, memory, evening summary
│   ├── twilio.ts · twilio-voice.ts
│   ├── emails/                     # morning-digest · weekly-retrospective
│   ├── supabase/                   # client · server · db · tasks · habits · projects · notes · calendar · profile
│   └── utils/                      # dates · tasks
├── supabase/migrations/            # SQL — run in filename order
├── public/                         # sw.js · robots.txt · sitemap.xml
├── proxy.ts                        # Supabase session refresh on every request
├── next.config.ts                  # security headers + compression
└── vercel.json
```

---

## Getting started

### 1. Install

```bash
git clone https://github.com/Saumyavi/Slow-Desk.git
cd Slow-Desk/slowdesk
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run every file in `supabase/migrations/` **in filename order** via the SQL editor.
3. Authentication → URL Configuration:
   - Site URL: `https://your-domain.vercel.app`
   - Redirect URLs: `https://your-domain.vercel.app/auth/callback`
4. Storage buckets (`avatars`, `project-documents`) are created by `20260511_storage_setup.sql`.

### 3. Google OAuth (two separate clients)

**Supabase sign-in** — Google Cloud Console → Credentials → OAuth client. Redirect URI: `https://<project>.supabase.co/auth/v1/callback`. Paste Client ID + Secret into Supabase → Authentication → Providers → Google.

**Google Calendar sync** — enable the Calendar API in the same project. Redirect URIs:
```
http://localhost:3000/auth/google-calendar/callback
https://your-domain.vercel.app/auth/google-calendar/callback
```
Set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

### 4. Twilio (optional — WhatsApp + voice)

Grab Account SID + Auth Token. For WhatsApp, join the sandbox or provision a sender (`TWILIO_WHATSAPP_FROM`). For voice, buy a number (`TWILIO_PHONE_NUMBER`) and point its **Voice webhook** at `https://your-domain.vercel.app/api/voice/twiml/handle` (POST).

### 5. Groq (voice agent brain)

Get a key at [console.groq.com](https://console.groq.com) → `GROQ_API_KEY`.

### 6. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-only (used by cron routes) |
| `CRON_SECRET` | ✅ | `openssl rand -hex 32` — gates cron endpoints |
| `RESEND_API_KEY` | ✅ | Email delivery |
| `RESEND_FROM_EMAIL` | — | Custom sender (e.g. `SlowDesk <hi@yourdomain.com>`) |
| `GOOGLE_CLIENT_ID` / `_SECRET` | — | Google Calendar sync |
| `GEMINI_API_KEY` | — | AI task parsing, note helpers, habit insights |
| `GROQ_API_KEY` | — | Voice agent LLM |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | — | WhatsApp + voice |
| `TWILIO_WHATSAPP_FROM` | — | e.g. `whatsapp:+14155238886` |
| `TWILIO_PHONE_NUMBER` | — | E.164 number for outbound voice calls |
| `NEXT_PUBLIC_SITE_URL` | — | Public URL — needed for Twilio webhooks |

### 7. Run

```bash
npm run dev          # http://localhost:3000
npx next dev -p 3001 # alternate port
```

---

## Scripts

```bash
npm run dev     # dev server (Turbopack)
npm run build   # production build
npm run start   # serve production build
npm run lint    # ESLint

node scripts/preview-email.mjs   # preview email templates locally
```

---

## Database migrations

`supabase/migrations/` is applied **in filename order** via the Supabase SQL editor (no CLI runner is wired up). Highlights:

- `20260506_notification_preferences.sql` — toggles + per-user `notification_time` / `notification_timezone`
- `20260507_google_calendar*.sql` — Google tokens + `calendar_events`
- `20260507_pomodoro_sessions.sql` — Pomodoro log
- `20260507_subtasks.sql` · `20260511_subhabits.sql` — sub-items
- `20260508_avatar_url.sql` · `20260511_storage_setup.sql` — uploads + RLS
- `20260508_recurring_tasks.sql` · `20260511_task_description.sql` · `20260512_task_due_date.sql` — task model
- `20260511_project_documents.sql` — per-project documents
- `20260514_voice_agent.sql` · `20260515_voice_memory.sql` · `20260515_voice_sessions_habits_memory.sql` — voice sessions + memory
- `20260518_voice_agent_calendar_times.sql` — per-user evening time + calendar/project snapshots on `voice_sessions`
- `20260518_morning_digest_hourly.sql` · `20260518_evening_cron_hourly.sql` — pg_cron jobs (edit placeholders before running)

---

## Cron jobs

Both fan-out crons run hourly via **Supabase `pg_cron` + `pg_net`** — no Vercel Pro plan required. The Next.js routes then filter users by their chosen local hour using `Intl.DateTimeFormat` against `notification_timezone`.

| Schedule | Endpoint | What it does |
|---|---|---|
| `0 * * * *` | `/api/notifications/morning-digest` | Email + WhatsApp digest for users whose local hour matches `notification_time`. Sundays at 04:00 UTC also dispatches the weekly retrospective. |
| `0 * * * *` | `/api/voice/outbound` | Places Twilio calls for users whose local hour matches their morning or evening voice-call time. |

Requests are authenticated with `Authorization: Bearer <CRON_SECRET>`. `vercel.json` is intentionally empty — Hobby plans only allow daily crons, which is too coarse for per-user scheduling.

---

## Security

- All user-owned tables use **Row Level Security** keyed on `auth.uid() = user_id`.
- Cron endpoints reject requests without the `CRON_SECRET` bearer token.
- `next.config.ts` sets CSP, X-Frame-Options, Referrer-Policy headers and enables compression.
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only** — never imported into client code.
- Twilio webhooks should be restricted to your production domain.
- Keep `.env*.local` out of git; rotate any key that has been committed or shared.

---

## Deployment

```bash
npx vercel --prod
```

Set every env var in **Vercel → Settings → Environment Variables** before deploying. Make sure `NEXT_PUBLIC_SITE_URL` matches your production domain so Twilio webhooks resolve. After deploying, edit the placeholders in the two pg_cron migrations (`YOUR_VERCEL_URL`, `YOUR_CRON_SECRET`) and run them in the Supabase SQL editor to activate the hourly jobs.

---

## Roadmap

- [ ] Full-screen Focus Mode during Pomodoro sessions
- [ ] Weekly Review page with completion / habit / Pomodoro charts
- [ ] Task → Habit linking (completing a task auto-logs the linked habit)
- [ ] Voice agent: project-document Q&A on calls
- [ ] iOS Shortcuts integration for one-tap task capture

---

*Built with intention. For people who work at a human pace.*
