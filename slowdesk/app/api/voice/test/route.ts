import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runAgentTurn, generateEveningSummary, VoiceTask } from '@/lib/voice-agent';

export const runtime = 'nodejs';

// Local-only test endpoint — simulates a voice conversation turn without Twilio
// DELETE or gate behind env check before going to production
//
// GET  /api/voice/test?userId=xxx&type=morning
//   → returns the opening script (what the agent would say first)
//
// POST /api/voice/test
//   { userId, message, type?, tasks?, messages? }
//   → runs one agent turn and returns { response, shouldHangUp, actions }

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const type   = (searchParams.get('type') ?? 'morning') as 'morning' | 'evening';

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name')
    .eq('id', userId)
    .single();

  const userName = profile?.name ?? 'there';
  const todayStr = new Date().toISOString().slice(0, 10);
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (type === 'evening') {
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
    const pendingTasks   = pendingToday.map((t: any)   => ({ id: t.id, title: t.title, priority: t.priority, due: t.due, done: false }));

    const summary = await generateEveningSummary(userName, completedTasks, pendingTasks, []);

    return NextResponse.json({
      type: 'evening',
      userName,
      completedCount: completedTasks.length,
      pendingCount:   pendingTasks.length,
      pendingTasks,
      openingScript:  summary,
    });
  }

  // Morning
  const { data: taskRows } = await supabase
    .from('tasks')
    .select('id, title, priority, due, due_date, done')
    .eq('user_id', userId)
    .eq('done', false)
    .order('priority', { ascending: false })
    .limit(20);

  const tasks: VoiceTask[] = (taskRows || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((t: any) => t.due_date ? t.due_date <= todayStr : t.due === 'today' || t.due === 'overdue')
    .slice(0, 10)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((t: any) => ({ id: t.id, title: t.title, priority: t.priority, due: t.due, done: t.done }));

  const high = tasks.filter(t => t.priority === 'high');
  const med  = tasks.filter(t => t.priority === 'medium');
  const low  = tasks.filter(t => t.priority === 'low');

  let taskSpeech = tasks.length === 0
    ? 'Your slate is completely clear today!'
    : `You have ${tasks.length} task${tasks.length !== 1 ? 's' : ''} today. `;
  if (high.length) taskSpeech += `High priority: ${high.map(t => t.title).join(', ')}. `;
  if (med.length)  taskSpeech += `Medium: ${med.map(t => t.title).join(', ')}. `;
  if (low.length)  taskSpeech += `Lower priority: ${low.map(t => t.title).join(', ')}.`;

  return NextResponse.json({
    type: 'morning',
    userName,
    date: dateLabel,
    tasks,
    openingScript: `Good morning, ${userName}! Today is ${dateLabel}. ${taskSpeech} Would you like to make any changes?`,
    hint: 'POST to this endpoint with { userId, message, tasks } to simulate a conversation turn',
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { userId, message, type = 'morning', tasks = [], messages = [] } = body;

  if (!userId || !message) {
    return NextResponse.json({ error: 'userId and message are required' }, { status: 400 });
  }

  const { response, shouldHangUp, updatedMessages } = await runAgentTurn(
    { userId, type, messages, tasks, habits: [], memory: [] },
    message,
  );

  return NextResponse.json({
    response,
    shouldHangUp,
    turnCount: updatedMessages.filter(m => m.role === 'user').length,
    messages: updatedMessages,
  });
}
