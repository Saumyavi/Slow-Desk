import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateEveningSummary } from '@/lib/voice-agent';

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
    .select('name')
    .eq('id', userId)
    .single();

  const userName  = profile?.name ?? 'there';
  const today     = new Date();
  const todayStr  = today.toISOString().slice(0, 10);
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const handleUrl = new URL(request.url);
  handleUrl.pathname = '/api/voice/twiml/handle';
  handleUrl.search   = '';

  if (type === 'evening') {
    return handleEveningStart(supabase, userId, userName, todayStr, callSid, handleUrl.toString());
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
    .filter(t => t.due_date ? t.due_date <= todayStr : t.due === 'today' || t.due === 'overdue')
    .slice(0, 10);

  // Persist session keyed by Twilio CallSid
  await supabase.from('voice_sessions').upsert({
    call_sid:   callSid,
    user_id:    userId,
    type:       'morning',
    messages:   [],
    tasks:      tasks.map(t => ({ id: t.id, title: t.title, priority: t.priority, due: t.due, done: t.done })),
    status:     'active',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'call_sid' });

  // Build task announcement
  let taskSpeech: string;
  if (tasks.length === 0) {
    taskSpeech = 'Your slate is completely clear today — enjoy the freedom!';
  } else {
    const high = tasks.filter(t => t.priority === 'high');
    const med  = tasks.filter(t => t.priority === 'medium');
    const low  = tasks.filter(t => t.priority === 'low');
    taskSpeech = `You have ${tasks.length} task${tasks.length !== 1 ? 's' : ''} today. `;
    if (high.length) taskSpeech += `High priority: ${high.map(t => t.title).join(', ')}. `;
    if (med.length)  taskSpeech += `Medium: ${med.map(t => t.title).join(', ')}. `;
    if (low.length)  taskSpeech += `Lower priority: ${low.map(t => t.title).join('. ')}.`;
  }

  const greeting = esc(`Good morning, ${userName}! Today is ${dateLabel}. ${taskSpeech}`);
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

  const summary = await generateEveningSummary(userName, completedTasks, pendingTasks);

  await supabase.from('voice_sessions').upsert({
    call_sid:   callSid,
    user_id:    userId,
    type:       'evening',
    messages:   [],
    tasks:      pendingTasks,
    status:     'active',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'call_sid' });

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
