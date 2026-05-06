# slowdesk

A cozy, personal productivity workspace. Track tasks, projects, habits, notes, and calendar events — all in one warm, focused interface built for one person: you.

---

## Features

| Module | What it does |
|---|---|
| **Dashboard** | Greeting card with mood tracker, today's task queue (drag to reorder), week Gantt timeline, task donut chart, habit heatmap, active project cards |
| **Tasks** | Full task list with All / Today / Upcoming / Completed tabs, priority & project filters, inline edit/delete, **photo-to-task OCR** (point camera at a handwritten list) |
| **Projects** | Tone-colored project cards with per-project task progress bars and due dates |
| **Calendar** | Month view with color-coded events by category |
| **Habits** | Daily habit tracking with per-habit streak counter and 30-day history heatmap |
| **Notes** | Freeform notes with color tones and an integrated daily gratitude journal |
| **Profile** | Editorial profile editor — name, role, bio, location, status emoji, avatar; appearance settings; dashboard layout picker; morning ritual setup |
| **Morning Ritual** | Daily task digest delivered each morning via **email** (Resend) and/or **WhatsApp** (Twilio Business). Configured per-user in Profile. |
| **Weekly Retrospective** | Auto-generated weekly summary email sent every Sunday morning |
| **Tweaks panel** | Theme (light/dark), 6 accent colors, sidebar mode (wide/icon-only), content density (compact/cozy/comfy), background pattern (none/dots/grid), dashboard layout variant (Classic/Focus/Editorial) |

**Cross-cutting:**
- Cmd/Ctrl+K spotlight search across tasks, projects, and habits
- Bell notifications with unread badge and per-item dismiss
- Daily streak counter from task completions
- Confetti burst on task completion
- Onboarding tour for new users
- Animated desk scene on landing page

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Styling | Tailwind CSS v4 + custom CSS design system (`globals.css`) |
| Animations | GSAP 3 |
| Auth | Supabase Auth — Google OAuth + email/password |
| Database | Supabase (PostgreSQL) |
| Email | Resend |
| WhatsApp | Twilio Business API |
| OCR | Tesseract.js (runs in-browser, no server needed) |
| State | React Context (`lib/store.tsx`) |
| Language | TypeScript 5 |
| Deployment | Vercel (Hobby plan — 1 cron job) |

---

## Project Structure

```
slowdesk/
├── app/
│   ├── page.tsx                                    # Dashboard
│   ├── tasks/page.tsx                              # Tasks + OCR capture
│   ├── projects/page.tsx
│   ├── calendar/page.tsx
│   ├── habits/page.tsx
│   ├── notes/page.tsx
│   ├── profile/page.tsx                            # Profile + morning ritual settings
│   ├── auth/callback/route.ts                      # Supabase OAuth callback
│   ├── api/
│   │   ├── notifications/morning-digest/route.ts   # Daily cron (4am UTC)
│   │   └── retrospective/route.ts                  # Weekly retrospective (triggered Sundays)
│   ├── layout.tsx
│   ├── globals.css                                 # Design tokens + Tailwind v4
│   └── favicon.ico
├── components/
│   ├── AppShell.tsx          # Auth gate + main layout wrapper
│   ├── AuthScreen.tsx        # Login / signup modal
│   ├── CameraCapture.tsx     # Camera OCR for photo-to-task
│   ├── Confetti.tsx          # Celebration animation
│   ├── DeskScene.tsx         # Animated GSAP desk illustration (landing)
│   ├── Icon.tsx              # Icon component
│   ├── LandingPage.tsx       # Marketing landing page
│   ├── OnboardingTour.tsx    # First-run guided tour
│   ├── Providers.tsx         # AppProvider tree
│   ├── Sidebar.tsx
│   ├── TaskModal.tsx         # Add / edit task modal
│   ├── TaskReview.tsx        # OCR result review before import
│   ├── Topbar.tsx            # Search, notifications, user menu
│   └── TweaksPanel.tsx       # Theme / density settings drawer
├── lib/
│   ├── data.ts               # Types, constants, helpers
│   ├── emails/
│   │   ├── morning-digest.ts       # Email + WhatsApp template helpers
│   │   └── weekly-retrospective.ts # Retrospective email template
│   ├── ocr.ts                # Tesseract.js wrapper
│   ├── store.tsx             # Global state (tasks, projects, settings, etc.)
│   ├── supabase/
│   │   ├── client.ts         # Browser Supabase client
│   │   ├── db.ts             # Database helper functions
│   │   └── server.ts         # Server-side Supabase client
│   ├── task-parser.ts        # Parse raw OCR text into structured tasks
│   └── twilio.ts             # Twilio WhatsApp Business helper
├── supabase/
│   └── migrations/           # SQL migrations (run in Supabase SQL editor)
├── public/
│   ├── robots.txt
│   └── sitemap.xml
├── middleware.ts             # Supabase session refresh on every request
├── next.config.ts            # Security headers + Next.js config
├── vercel.json               # Cron job schedule
└── .env.example              # Required environment variables (template)
```

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd slowdesk
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/` via the Supabase SQL editor
3. Go to **Authentication → Providers → Google** and enable Google OAuth (see step 4)
4. Go to **Authentication → URL Configuration** and set:
   - **Site URL:** `https://your-domain.vercel.app`
   - **Redirect URLs:** `https://your-domain.vercel.app/auth/callback`

### 3. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Under **Authorized redirect URIs**, add:
   ```
   https://<your-supabase-project>.supabase.co/auth/v1/callback
   ```
4. Copy the Client ID and Secret into Supabase → Authentication → Providers → Google

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>

# Resend (email delivery)
RESEND_API_KEY=<from resend.com>

# Cron authentication
CRON_SECRET=<run: openssl rand -hex 32>

# Twilio WhatsApp (optional — only needed if WhatsApp digest is used)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Cron Jobs

The app runs on Vercel Hobby (1 cron limit). The single daily cron handles both notifications:

| Schedule | What runs |
|---|---|
| `0 4 * * *` (4am UTC daily) | Morning digest — sends email/WhatsApp to all opted-in users |
| Every Sunday (internal) | Weekly retrospective — triggered inside the daily cron on Sundays |

Cron requests are authenticated with `CRON_SECRET` via the `Authorization: Bearer` header.

---

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Serve production build locally
npm run lint     # Run ESLint
```
