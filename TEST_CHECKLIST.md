# SlowDesk — Pre-Launch Test Checklist

Check each box as you test. If something breaks, note it in the comments column.

---

## Auth
- [ ] Sign up with email
- [ ] Sign in with email
- [ ] Sign in with Google
- [ ] Sign out (with confirmation)
- [ ] Redirects correctly after login

---

## Dashboard
~~- [ ] Greeting card shows name, date, quote~~
~~- [ ] Mood selector + confetti fires on 🔥~~
~~- [ ] Stats cards (pending tasks, streak, completed this month)~~
- [ ] Week timeline shows tasks + calendar events -- only shows google events and no manual events
~~- [ ] Donut chart updates when tasks toggled~~
~~- [ ] Habit heatmap shows current month~~
- [ ] Project cards show progress -- three button on right top which doesn nothing
~~- [ ] Create task from dashboard~~
~~- [ ] Toggle task done from dashboard~~
- [ ] Sort tasks (priority, due date, name)
- [ ] Weekly retrospective generates AI paragraph (Sunday only)

---

## Tasks
~~- [ ] Create task (modal)~~
- [ ] Edit task
- [ ] Delete task (non-recurring)
~~- [ ] Toggle done → confetti fires~~
~~- [ ] Filter: All / Today / Upcoming / Completed / Recurring~~
~~- [ ] Priority filter (High)~~
~~- [ ] Project filter~~
- [ ] **Voice capture** → speak task → task appears
- [ ] **Camera scan** → photo → tasks extracted → review → confirm
~~- [ ] **Subtasks** → AI breakdown → select steps → add~~
~~- [ ] Subtask manual add + toggle + delete~~
~~- [ ] **Pomodoro timer** → starts, counts down, stops~~
~~- [ ] **Recurring task** → type "every monday" → AI detects → hint appears → apply~~
~~- [ ] Recurring task completes → next instance spawns automatically~~
- [ ] Recurring task → Skip this, keep series
- [ ] Recurring task → Stop series
- [ ] Recurring task → History sidebar (completions + streak)

---

## Habits
~~- [ ] Create habit (name, emoji, frequency, color)~~
~~- [ ] Edit habit~~
~~- [ ] Delete habit~~
~~- [ ] Check off habit for today~~
~~- [ ] Uncheck habit~~
~~- [ ] 30-day heatmap updates~~
~~- [ ] Streak counter increments~~
- [ ] **Habit intelligence** → Analyze → AI insights appear
~~- [ ] Refresh insights~~

---

## Notes
~~- [ ] Create note~~
~~- [ ] Rename note~~
~~- [ ] Delete note~~
~~- [ ] Type and save content~~
~~- [ ] Tone/color picker~~
~~- [ ] Word/char count updates~~
~~- [ ] **AI assistant** → summarize~~
~~- [ ] **AI assistant** → extract tasks → select → bulk add~~
- [ ] **Create project from extracted tasks**
- [ ] Gratitude section (3 fields save correctly)
- [ ] Search notes

---

## Projects
~~- [ ] Create project (name, color, due date, description)~~
~~- [ ] Edit project~~
~~- [ ] Delete project~~
- [ ] Progress bar updates as tasks complete
~~- [ ] Expand project → inline tasks visible~~
~~- [ ] Toggle task done inside project~~
~~- [ ] Add task from inside project~~

---

## Calendar
~~- [ ] Month view renders~~
~~- [ ] Navigate prev/next month~~
~~- [ ] Jump to today~~
~~- [ ] Click date → view events in sidebar~~
~~- [ ] Double-click date → create event modal~~
~~- [ ] Create event (title, time, color)~~
~~- [ ] Edit event~~
~~- [ ] Delete event~~
~~- [ ] **Google Calendar sync** → connect → sync → events appear with G badge~~
~~- [ ] Disconnect Google Calendar~~

---

## Profile & Settings
~~- [ ] Edit name, role, location, bio → Save~~
~~- [ ] Status emoji selector~~
- [ ] Avatar picker (30 emojis)
~~- [ ] Theme toggle (light ↔ dark)~~
~~- [ ] Accent color changes app-wide~~
~~- [ ] Sidebar wide ↔ icons only~~
~~- [ ] Density (compact / cozy / comfy)~~
~~- [ ] Background pattern (none / dots / grid)~~
~~- [ ] Dashboard layout A / B / C~~
- [ ] Email digest toggle → Save preferences
- [ ] WhatsApp toggle + phone number → Save preferences
~~- [ ] Export JSON → file downloads~~
~~- [ ] Export CSV → file downloads~~
~~- [ ] Export Markdown → file downloads~~
~~- [ ] Sign out confirm dialog~~

---

## Notifications
- [ ] Test email → received with postcard design
- [ ] Test WhatsApp → received with quote + priority dots
- [ ] Cron fires at 9:30 AM IST (check Vercel logs next morning)

---

## PWA / Mobile
- [ ] Install as app (mobile → Add to Home Screen)
- [ ] App opens correctly from home screen
- [ ] Tasks page responsive on mobile
- [ ] Habits page responsive on mobile
- [ ] Profile page responsive on mobile

---

## Known Limitations (not bugs)
- Morning ritual custom delivery time shows "coming soon"
- WhatsApp requires Twilio sandbox opt-in (`join <word>` to +14155238886)
- Resend free tier only delivers to verified account email without a custom domain
- Weekly retrospective AI only fires on Sundays via cron

---

_Total: ~80 test cases_


Recurring tasks not getting created properly.

Mail Fix by creating a free domain from freenom
Global search doesn't navigate to the specific item	
add more motivational quotes on data.ts file
🧠 AI Daily Digest — Every morning, Gemini summarizes yesterday's completions, suggests today's top 3 tasks based on priorities and deadlines, and gives a habit nudge. One API call, huge perceived value.
Whatsapp message sent twice email once but both of them shows no tasks for today
when user clicks on slow desk icon does nothing but should land to dashboard page
when having dashboard page manually, it shows 404 once its done
twilio message not coming daily


make habit day wise and the display habits on dahsboard page 
change icons on habits creation page
add checks on habits
add placeholder to attach documents related to projects
add link option in task

motivation fades. Discipline build careers

if im assigning any task to tomorrow, it keeps on moving tomorrow, no today
