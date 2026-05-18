import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  generateEveningSummary,
  VoiceHabit,
  CallMemoryEntry,
  VoiceCalendarEvent,
  VoiceProjectProgress,
} from '@/lib/voice-agent';

export const runtime = 'nodejs';

function xmlResponse(xml: string) {
  return new Response(xml, {
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

function esc(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function gatherTwiml(spokenText: string, actionUrl: string, noCaptureText: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${spokenText}</Say>
  <Gather input="speech" action="${esc(actionUrl)}" method="POST" timeout="6" speechTimeout="auto" language="en-IN">
  </Gather>
  <Say voice="Polly.Joanna">${noCaptureText}</Say>
  <Hangup/>
</Response>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchHabitsForUser(supabase: any, userId: string, todayStr: string): Promise<VoiceHabit[]> {
  const { data: habitRows } = await supabase
    .from('habits')
    .select('id, name, emoji, habit_history(completed_date)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!habitRows) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return habitRows.map((h: any) => ({
    id: h.id,
    name: h.name,
    emoji: h.emoji ?? '✅',
    completedToday: (h.habit_history || []).some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (hh: any) => String(hh.completed_date).slice(0, 10) === todayStr,
    ),
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchTodaysCalendarEvents(supabase: any, userId: string, today: Date): Promise<VoiceCalendarEvent[]> {
  const { data } = await supabase
    .from('calendar_events')
    .select('title, time, end_time, source')
    .eq('user_id', userId)
    .eq('year',  today.getFullYear())
    .eq('month', today.getMonth() + 1)
    .eq('day',   today.getDate())
    .order('time', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((e: any) => ({
    time:    e.time ?? '',
    endTime: e.end_time ?? undefined,
    title:   e.title ?? '',
    source:  (e.source ?? 'local') as 'local' | 'google',
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchProjectProgress(supabase: any, userId: string, todayStr: string): Promise<VoiceProjectProgress[]> {
  // 7-day horizon for "this week"
  const weekEnd = new Date(todayStr);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', userId);

  if (!projects?.length) return [];

  const { data: tasks } = await supabase
    .from('tasks')
    .select('project_id, done, due, due_date')
    .eq('user_id', userId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byProject = new Map<string, any[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const t of tasks ?? []) {
    if (!t.project_id) continue;
    const list = byProject.get(t.project_id) ?? [];
    list.push(t);
    byProject.set(t.project_id, list);
  }

  const result: VoiceProjectProgress[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of projects as any[]) {
    const ts = byProject.get(p.id) ?? [];
    if (ts.length === 0) continue;
    const done = ts.filter(t => t.done).length;
    const percent = Math.round((done / ts.length) * 100);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const open = ts.filter((t: any) => !t.done);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openThisWeek = open.filter((t: any) =>
      t.due_date
        ? t.due_date <= weekEndStr
        : t.due === 'today' || t.due === 'overdue' || t.due === 'this week' || t.due === 'tomorrow',
    ).length;
    result.push({
      name: p.name,
      percent,
      remaining: open.length,
      remainingThisWeek: openThisWeek,
    });
  }

  // Highest activity first
  result.sort((a, b) => b.remainingThisWeek - a.remainingThisWeek || b.remaining - a.remaining);
  return result.slice(0, 5);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId  = searchParams.get('userId');
  const type    = (searchParams.get('type') ?? 'morning') as 'morning' | 'evening';
  const callSid = searchParams.get('CallSid') ?? `local-${Date.now()}`;

  if (!userId) {
    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Invalid request.</Say><Hangup/></Response>`);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name, voice_memory')
    .eq('id', userId)
    .single();

  const userName  = profile?.name ?? 'there';
  const memory: CallMemoryEntry[] = profile?.voice_memory ?? [];
  const today     = new Date();
  const todayStr  = today.toISOString().slice(0, 10);
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const handleUrl = new URL(request.url);
  handleUrl.pathname = '/api/voice/twiml/handle';
  handleUrl.search   = '';

  const habits = await fetchHabitsForUser(supabase, userId, todayStr);
  const calendarEvents = await fetchTodaysCalendarEvents(supabase, userId, today);
  const projectProgress = await fetchProjectProgress(supabase, userId, todayStr);

  if (type === 'evening') {
    return handleEveningStart(supabase, userId, userName, todayStr, callSid, handleUrl.toString(), habits, memory, calendarEvents, projectProgress);
  }

  // ── Morning flow ──────────────────────────────────────────────
  const { data: taskRows } = await supabase
    .from('tasks')
    .select('id, title, priority, due, due_date, done')
    .eq('user_id', userId)
    .eq('done', false)
    .order('priority', { ascending: false })
    .limit(20);

  const tasks = (taskRows || [])
    .filter((t: { due_date: string; due: string }) => t.due_date ? t.due_date <= todayStr : t.due === 'today' || t.due === 'overdue')
    .slice(0, 10);

  const { error: sessionError } = await supabase.from('voice_sessions').insert({
    call_sid: callSid,
    user_id:  userId,
    type:     'morning',
    messages: [],
    tasks:    tasks.map((t: { id: string; title: string; priority: string; due: string; done: boolean }) => ({ id: t.id, title: t.title, priority: t.priority, due: t.due, done: t.done })),
    habits,
    memory,
    calendar_events:  calendarEvents,
    project_progress: projectProgress,
    status:   'active',
  });
  if (sessionError) console.error('voice_sessions insert failed:', sessionError.message);

  // Build task announcement
  let taskSpeech: string;
  if (tasks.length === 0) {
    taskSpeech = 'Your slate is completely clear today — enjoy the freedom!';
  } else {
    const high = tasks.filter((t: { priority: string }) => t.priority === 'high');
    const med  = tasks.filter((t: { priority: string }) => t.priority === 'medium');
    const low  = tasks.filter((t: { priority: string }) => t.priority === 'low');
    taskSpeech = `You have ${tasks.length} task${tasks.length !== 1 ? 's' : ''} today. `;
    if (high.length) taskSpeech += `High priority: ${high.map((t: { title: string }) => t.title).join(', ')}. `;
    if (med.length)  taskSpeech += `Medium: ${med.map((t: { title: string }) => t.title).join(', ')}. `;
    if (low.length)  taskSpeech += `Lower priority: ${low.map((t: { title: string }) => t.title).join('. ')}.`;
  }

  // Build habit check-in line
  const pendingHabits = habits.filter(h => !h.completedToday);
  const habitSpeech = pendingHabits.length > 0
    ? ` You have ${pendingHabits.length} habit${pendingHabits.length !== 1 ? 's' : ''} pending: ${pendingHabits.map(h => h.name).join(', ')}.`
    : habits.length > 0 ? ` All ${habits.length} habits already done — great start!` : '';

  // Surface today's first few calendar events (keeps the greeting short)
  const eventSpeech = calendarEvents.length > 0
    ? ` On your calendar: ${calendarEvents.slice(0, 3).map(e => `${e.title} at ${e.time}`).join('; ')}${calendarEvents.length > 3 ? `, plus ${calendarEvents.length - 3} more` : ''}.`
    : '';

  const greeting = esc(`Good morning, ${userName}! Today is ${dateLabel}. ${taskSpeech}${habitSpeech}${eventSpeech}`);
  const prompt   = esc(`Would you like to make any changes, or shall I let you get started?`);
  const fallback = esc(`I didn't catch that. Have a wonderful day, ${userName}!`);

  return xmlResponse(gatherTwiml(`${greeting} ${prompt}`, handleUrl.toString(), fallback));
}

async function handleEveningStart(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  userName: string,
  todayStr: string,
  callSid: string,
  handleUrl: string,
  habits: VoiceHabit[],
  memory: CallMemoryEntry[],
  calendarEvents: VoiceCalendarEvent[],
  projectProgress: VoiceProjectProgress[],
) {
  const { data: completedRows } = await supabase
    .from('tasks')
    .select('id, title, priority, due')
    .eq('user_id', userId)
    .eq('done', true)
    .gte('updated_at', `${todayStr}T00:00:00.000Z`);

  const { data: pendingRows } = await supabase
    .from('tasks')
    .select('id, title, priority, due, due_date')
    .eq('user_id', userId)
    .eq('done', false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingToday = (pendingRows || []).filter((t: any) =>
    t.due_date ? t.due_date <= todayStr : t.due === 'today' || t.due === 'overdue',
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completedTasks = (completedRows || []).map((t: any) => ({ id: t.id, title: t.title, priority: t.priority, due: t.due, done: true }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingTasks   = pendingToday.map((t: any) => ({ id: t.id, title: t.title, priority: t.priority, due: t.due, done: false }));

  const summary = await generateEveningSummary(userName, completedTasks, pendingTasks, memory, projectProgress);

  const { error: sessionError } = await supabase.from('voice_sessions').insert({
    call_sid: callSid,
    user_id:  userId,
    type:     'evening',
    messages: [],
    tasks:    pendingTasks,
    habits,
    memory,
    calendar_events:  calendarEvents,
    project_progress: projectProgress,
    status:   'active',
  });
  if (sessionError) console.error('voice_sessions insert failed:', sessionError.message);

  const spoken   = esc(summary);
  const prompt   = esc(pendingTasks.length > 0 ? 'Would you like to reschedule any of these, or are you done for the day?' : 'Have a restful evening!');
  const fallback = esc(`Sleep well, ${userName}!`);

  if (pendingTasks.length === 0) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Say voice="Polly.Joanna">${spoken} ${prompt}</Say>\n  <Hangup/>\n</Response>`, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  }

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n${gatherTwiml(`${spoken} ${prompt}`, handleUrl, fallback)}`.replace('<?xml version="1.0" encoding="UTF-8"?>\n<?xml version="1.0" encoding="UTF-8"?>', '<?xml version="1.0" encoding="UTF-8"?>'),
    { headers: { 'Content-Type': 'text/xml; charset=utf-8' } },
  );
}
