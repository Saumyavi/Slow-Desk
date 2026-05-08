# slowdesk

> A calmer way to work — tasks, habits, projects, notes, and deep focus, all in one warm workspace built for intentional people.

**Live:** [slowdesk.app](https://slowdesk.app)

---

## ✨ Features

### 🗂 Core Modules

| Module | What it does |
|---|---|
| **Dashboard** | Greeting card with mood tracker, today's task queue (drag to reorder), week Gantt timeline, task donut chart, habit heatmap, active project cards |
| **Tasks** | Full task list with All / Today / Upcoming / Completed tabs, priority & project filters, inline edit/delete, recurring tasks |
| **Projects** | Tone-colored project cards with per-project task progress bars and due dates |
| **Calendar** | Month view with color-coded events; **Google Calendar sync** — connect once, pull all events automatically with a `G` badge |
| **Habits** | Daily habit tracking with per-habit streak counter, 30-day history heatmap, and AI-powered analytics |
| **Notes** | Freeform notes with color tones and an integrated daily gratitude journal |
| **Profile** | Editorial profile editor — name, role, bio, location, status emoji, avatar upload; appearance settings; dashboard layout picker |

### 🤖 AI-Powered Features

| Feature | How it works |
|---|---|
| **Voice Task Capture** | Speak a task naturally — Web Speech API transcribes it, Gemini AI parses it into a structured task with title, priority, due date, and project |
| **Photo-to-Task OCR** | Point your camera at a handwritten list — Tesseract.js extracts text, a custom NLP parser converts it to tasks you review before importing |
| **AI Habit Analysis** | Statistical analysis of your habit history (streaks, day-of-week rates, Jaccard co-occurrence, 30/60-day trends) fed to Gemini for personalized insights |

### 🍅 Pomodoro Timer

- Full 25/5/15 Pomodoro cycle with phase automation
- Animated SVG ring progress indicator with phase-specific colors
- Cycle dots track progress through each round of 4
- Per-task session count persisted to Supabase
- GSAP-animated modal with smooth open/close transitions

### 📱 Progressive Web App (PWA)

- Installable on iOS, Android, and desktop via browser "Add to Home Screen"
- Service worker with **stale-while-revalidate** strategy for pages
- Cache-first for static assets
- Offline fallback page when no connection
- Proper `manifest.json` with icons, theme color, and `standalone` display mode

### 📱 Mobile-Responsive

- Full mobile layout: sidebar hidden, **bottom navigation bar** shown
- Tablet layout: icon-only sidebar collapses to 64px
- All pages reflow to single-column on small screens
- Touch-friendly targets, safe-area-inset padding for notched phones

### 🔔 Notifications & Communication

| Feature | Tech |
|---|---|
| **In-app notifications** | Bell icon with unread badge, per-item dismiss, 40-item history |
| **Morning digest email** | Daily 4am cron — sends task summary via Resend |
| **Weekly retrospective** | Auto-generated Sunday email summarizing the week |
| **WhatsApp notifications** | Twilio Business API for WhatsApp message delivery |

### 🎨 Design System

- **6 accent colors** — Terracotta, Sage, Plum, Butter, Sky, Ink — all synced to Supabase
- **Light/dark theme** with full token coverage
- **3 density modes** — Compact / Cozy / Comfy
- **Background patterns** — None / Dots / Grid
- **3 dashboard layout variants** — Classic / Focus / Editorial
- Instrument Serif + Geist + JetBrains Mono typography
- GSAP animations throughout

### 🧭 UX Polish

- **⌘K spotlight search** across tasks, notes, projects, and habits
- **Animated onboarding tour** — 7-slide auto-advancing intro for new users (with Pomodoro and AI slides)
- **Confetti burst** on task completion
- **Animated desk scene** on landing page (GSAP)
- **Drag-to-reorder** tasks on dashboard
- **Recurring tasks** with automatic next-occurrence spawning

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Styling | Tailwind CSS v4 + custom CSS design system (`globals.css`) |
| Animations | GSAP 3 |
| AI | Google Gemini (`@google/generative-ai`) |
| Auth | Supabase Auth — Google OAuth + email/password |
| Calendar Sync | Google Calendar API (OAuth 2.0) |
| Database | Supabase (PostgreSQL) |
| Email | Resend |
| WhatsApp | Twilio Business API |
| OCR | Tesseract.js (runs in-browser) |
| Voice | Web Speech API (browser-native) |
| PWA | Custom service worker + Next.js `manifest.ts` |
| State | React Context (`lib/store.tsx`) |
| Language | TypeScript 5 |
| Deployment | Vercel (Hobby plan) |

---

## 📁 Project Structure

```
slowdesk/
├── app/
│   ├── page.tsx                                    # Dashboard
│   ├── tasks/page.tsx                              # Tasks + OCR + Voice capture
│   ├── projects/page.tsx
│   ├── calendar/page.tsx
│   ├── habits/page.tsx
│   ├── notes/page.tsx
│   ├── profile/page.tsx
│   ├── auth/
│   │   ├── callback/route.ts                       # Supabase OAuth callback
│   │   └── google-calendar/callback/route.ts       # Google Calendar OAuth callback
│   ├── api/
│   │   ├── tasks/voice/route.ts                    # AI voice-to-task parsing (Gemini)
│   │   ├── google-calendar/
│   │   │   ├── connect/route.ts
│   │   │   ├── sync/route.ts
│   │   │   └── disconnect/route.ts
│   │   ├── notifications/morning-digest/route.ts   # Daily cron (4am UTC)
│   │   └── retrospective/route.ts                  # Weekly retrospective (Sundays)
│   ├── layout.tsx                                  # Root layout + SW registration
│   ├── manifest.ts                                 # PWA manifest
│   ├── globals.css                                 # Design tokens + responsive CSS
│   └── favicon.ico
├── components/
│   ├── AppShell.tsx              # Auth gate + main layout wrapper
│   ├── AuthScreen.tsx            # Login / signup modal
│   ├── CameraCapture.tsx         # Camera OCR for photo-to-task
│   ├── Confetti.tsx              # Celebration animation
│   ├── DeskScene.tsx             # Animated GSAP desk illustration (landing)
│   ├── Icon.tsx                  # Icon component
│   ├── LandingPage.tsx           # Marketing landing page
│   ├── OnboardingTour.tsx        # Animated 7-slide onboarding tour
│   ├── PomodoroTimer.tsx         # Full Pomodoro timer with GSAP animations
│   ├── Providers.tsx             # AppProvider tree
│   ├── ServiceWorkerRegistration.tsx  # PWA service worker registration
│   ├── Sidebar.tsx               # Desktop sidebar + mobile bottom nav
│   ├── TaskModal.tsx             # Add / edit task modal
│   ├── TaskReview.tsx            # OCR result review before import
│   ├── Topbar.tsx                # ⌘K search, notifications, user menu
│   ├── TweaksPanel.tsx           # Theme / density settings drawer
│   └── VoiceCapture.tsx          # Voice task capture with AI parsing
├── lib/
│   ├── data.ts                   # Types, constants, helpers
│   ├── emails/
│   │   ├── morning-digest.ts     # Email + WhatsApp template helpers
│   │   └── weekly-retrospective.ts
│   ├── habit-analysis.ts         # Statistical habit analysis + Gemini context builder
│   ├── ocr.ts                    # Tesseract.js wrapper
│   ├── store.tsx                 # Global state (tasks, projects, settings, tour, etc.)
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── db.ts                 # Database helper functions (incl. Pomodoro sessions)
│   │   └── server.ts
│   ├── task-parser.ts            # Parse OCR text into structured tasks
│   └── twilio.ts                 # Twilio WhatsApp Business helper
├── public/
│   ├── sw.js                     # PWA service worker
│   ├── robots.txt
│   └── sitemap.xml
├── supabase/
│   └── migrations/               # SQL migrations
├── proxy.ts                      # Supabase session refresh middleware
├── next.config.ts                # Security headers + Next.js config
├── vercel.json                   # Cron job schedule
└── .env.example                  # Required environment variables
```

---

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Saumyavi/Slow-Desk.git
cd Slow-Desk/slowdesk
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/` via the Supabase SQL editor
3. Go to **Authentication → Providers → Google** and enable Google OAuth
4. Set your **Site URL** and **Redirect URLs** in Authentication → URL Configuration

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>

# AI (Google Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=<from aistudio.google.com>

# Resend (email delivery)
RESEND_API_KEY=<from resend.com>

# Cron authentication
CRON_SECRET=<run: openssl rand -hex 32>

# Google Calendar sync (optional)
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

# Twilio WhatsApp (optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🔄 Cron Jobs

Runs on Vercel Hobby (1 cron limit). Single daily cron handles both notifications:

| Schedule | What runs |
|---|---|
| `0 4 * * *` (4am UTC daily) | Morning digest — sends email/WhatsApp to opted-in users |
| Every Sunday (internal) | Weekly retrospective — triggered inside the daily cron on Sundays |

---

## 📋 Scripts

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Serve production build locally
npm run lint     # Run ESLint
```

---

## 🗺 Roadmap

- [ ] AI Daily Digest — Gemini-powered morning summary with top 3 task suggestions
- [ ] Focus Mode — full-screen minimal view during Pomodoro sessions  
- [ ] Weekly Review Page — visual charts for completions, habits, and Pomodoro history
- [ ] Task → Habit linking — completing a task auto-logs the linked habit
- [ ] WhatsApp Morning Briefing — daily tasks + streak summary via Twilio cron

---

*Built with intention. For people who work at a human pace.*
