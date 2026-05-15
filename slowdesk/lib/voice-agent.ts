import Groq from 'groq-sdk';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const MODEL = 'llama-3.3-70b-versatile';

type DueBucket = 'today' | 'tomorrow' | 'this week' | 'next week' | 'someday';

function dueToDueDate(due: DueBucket): string | null {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const fmt = (date: Date) => date.toISOString().slice(0, 10);
  const add = (days: number) => { const r = new Date(d); r.setDate(r.getDate() + days); return r; };
  switch (due) {
    case 'today':     return fmt(d);
    case 'tomorrow':  return fmt(add(1));
    case 'this week': return fmt(add(3));
    case 'next week': return fmt(add(9));
    default:          return null;
  }
}

export interface VoiceTask {
  id: string;
  title: string;
  priority: string;
  due: string;
  done: boolean;
}

export interface VoiceHabit {
  id: string;
  name: string;
  emoji: string;
  completedToday: boolean;
}

export interface CallMemoryEntry {
  date: string;
  type: 'morning' | 'evening';
  summary: string;
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: Groq.Chat.ChatCompletionMessageToolCall[];
}

export interface AgentSession {
  userId: string;
  type: 'morning' | 'evening';
  messages: AgentMessage[];
  tasks: VoiceTask[];
  habits: VoiceHabit[];
  memory: CallMemoryEntry[];
}

export interface AgentTurnResult {
  response: string;
  shouldHangUp: boolean;
  updatedMessages: AgentMessage[];
}

const TOOLS: Groq.Chat.ChatCompletionTool[] = [
  // ── Task tools ──────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'complete_task',
      description: 'Mark a task as done/completed',
      parameters: {
        type: 'object',
        properties: { task_id: { type: 'string' } },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_task',
      description: 'Move a task to a different due date',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string' },
          due: { type: 'string', enum: ['today', 'tomorrow', 'this week', 'next week', 'someday'] },
        },
        required: ['task_id', 'due'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_task',
      description: 'Permanently delete a task',
      parameters: {
        type: 'object',
        properties: { task_id: { type: 'string' } },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task',
      parameters: {
        type: 'object',
        properties: {
          title:    { type: 'string' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          due:      { type: 'string', enum: ['today', 'tomorrow', 'this week', 'next week', 'someday'] },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_task_time',
      description: 'Set a specific time for a task, e.g. "10:00 AM"',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string' },
          time:    { type: 'string', description: 'Time in format like "9:00 AM" or "2:30 PM"' },
        },
        required: ['task_id', 'time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'change_priority',
      description: 'Change the priority of a task',
      parameters: {
        type: 'object',
        properties: {
          task_id:  { type: 'string' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['task_id', 'priority'],
      },
    },
  },
  // ── Habit tools ─────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'complete_habit',
      description: 'Mark a habit as completed for today',
      parameters: {
        type: 'object',
        properties: { habit_id: { type: 'string' } },
        required: ['habit_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'skip_habit',
      description: 'Skip a habit for today (will not count against streak)',
      parameters: {
        type: 'object',
        properties: { habit_id: { type: 'string' } },
        required: ['habit_id'],
      },
    },
  },
  // ── Call control ─────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'end_conversation',
      description: 'End the call. Use when user says goodbye or is done.',
      parameters: {
        type: 'object',
        properties: {
          farewell: { type: 'string', description: 'Short warm goodbye to speak aloud' },
        },
        required: ['farewell'],
      },
    },
  },
];

async function executeTool(
  name: string,
  args: Record<string, string>,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);

  switch (name) {
    case 'complete_task': {
      const { error } = await supabase
        .from('tasks')
        .update({ done: true, updated_at: new Date().toISOString() })
        .eq('id', args.task_id).eq('user_id', userId);
      if (error) console.error('complete_task failed:', error.message);
      return error ? `Failed: ${error.message}` : 'Task marked as complete.';
    }
    case 'reschedule_task': {
      const due = args.due as DueBucket;
      const { error } = await supabase
        .from('tasks')
        .update({ due, due_date: dueToDueDate(due), updated_at: new Date().toISOString() })
        .eq('id', args.task_id).eq('user_id', userId);
      if (error) console.error('reschedule_task failed:', error.message);
      return error ? `Failed: ${error.message}` : `Task rescheduled to ${due}.`;
    }
    case 'delete_task': {
      const { error } = await supabase
        .from('tasks').delete().eq('id', args.task_id).eq('user_id', userId);
      if (error) console.error('delete_task failed:', error.message);
      return error ? `Failed: ${error.message}` : 'Task deleted.';
    }
    case 'create_task': {
      const id  = `t${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const due = (args.due ?? 'today') as DueBucket;
      const { error } = await supabase.from('tasks').insert({
        id, user_id: userId, title: args.title, done: false,
        priority: args.priority ?? 'medium', due, due_date: dueToDueDate(due),
        tone: 'terra', attach: 0, time: null,
      });
      if (error) console.error('create_task failed:', error.message);
      return error ? `Failed: ${error.message}` : `Task "${args.title}" created.`;
    }
    case 'set_task_time': {
      const { error } = await supabase
        .from('tasks')
        .update({ time: args.time, updated_at: new Date().toISOString() })
        .eq('id', args.task_id).eq('user_id', userId);
      if (error) console.error('set_task_time failed:', error.message);
      return error ? `Failed: ${error.message}` : `Task time set to ${args.time}.`;
    }
    case 'change_priority': {
      const { error } = await supabase
        .from('tasks')
        .update({ priority: args.priority, updated_at: new Date().toISOString() })
        .eq('id', args.task_id).eq('user_id', userId);
      if (error) console.error('change_priority failed:', error.message);
      return error ? `Failed: ${error.message}` : `Priority changed to ${args.priority}.`;
    }
    case 'complete_habit': {
      const { error } = await supabase
        .from('habit_history')
        .insert({ habit_id: args.habit_id, completed_date: today });
      if (error) console.error('complete_habit failed:', error.message);
      return error ? `Failed: ${error.message}` : 'Habit marked complete for today.';
    }
    case 'skip_habit':
      return 'Habit skipped for today.';
    case 'end_conversation':
      return 'Conversation ended.';
    default:
      return 'Unknown function.';
  }
}

export async function runAgentTurn(
  session: AgentSession,
  userSpeech: string,
): Promise<AgentTurnResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const client = new Groq({ apiKey });

  const taskList = session.tasks.length
    ? session.tasks.map((t, i) => `${i + 1}. [ID:${t.id}] "${t.title}" — ${t.priority} priority, due: ${t.due}`).join('\n')
    : 'No tasks today.';

  const habitList = session.habits.length
    ? session.habits.map((h, i) => `${i + 1}. [ID:${h.id}] ${h.emoji} ${h.name}${h.completedToday ? ' (already done today)' : ''}`).join('\n')
    : 'No habits set up.';

  const memoryContext = session.memory.length
    ? `\nPast call patterns (use to personalise responses):\n${session.memory.slice(0, 5).map(m => `- ${m.date} ${m.type}: ${m.summary}`).join('\n')}`
    : '';

  const systemPrompt = `You are a calm, friendly voice assistant for SlowDesk, a productivity app.
You are on a phone call — keep every response SHORT (1-2 sentences max). No lists, no markdown.
Speak naturally like a helpful human, not a robot.

Today's tasks (use IDs when calling functions):
${taskList}

Today's habits:
${habitList}
${memoryContext}

Rules:
- Use function calls immediately when the user requests changes.
- After an action, briefly confirm and ask if there is anything else.
- For habits: ask if they completed yesterday's habits during morning calls if not already done.
- Call end_conversation when the user says they are done, goodbye, or similar.
- If you notice a pattern from memory (e.g. user keeps rescheduling the same task), gently mention it.`;

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...session.messages.map(m => {
      if (m.role === 'tool') return { role: 'tool' as const, content: m.content, tool_call_id: m.tool_call_id! };
      if (m.role === 'assistant' && m.tool_calls) return { role: 'assistant' as const, content: m.content ?? null, tool_calls: m.tool_calls };
      return { role: m.role as 'user' | 'assistant', content: m.content };
    }),
    { role: 'user', content: userSpeech },
  ];

  const updatedMessages: AgentMessage[] = [
    ...session.messages,
    { role: 'user', content: userSpeech },
  ];

  let shouldHangUp = false;
  let finalResponse = '';

  let completion = await client.chat.completions.create({
    model: MODEL, messages, tools: TOOLS, tool_choice: 'auto', temperature: 0.4,
  });

  while (completion.choices[0]?.finish_reason === 'tool_calls') {
    const assistantMsg = completion.choices[0].message;
    const toolCalls = assistantMsg.tool_calls ?? [];

    messages.push({ role: 'assistant', content: assistantMsg.content ?? null, tool_calls: toolCalls });
    updatedMessages.push({ role: 'assistant', content: assistantMsg.content ?? '', tool_calls: toolCalls });

    for (const call of toolCalls) {
      const args = JSON.parse(call.function.arguments) as Record<string, string>;
      if (call.function.name === 'end_conversation') {
        finalResponse = args.farewell ?? 'Have a wonderful day!';
        shouldHangUp = true;
      }
      const result = await executeTool(call.function.name, args, session.userId, supabase);
      messages.push({ role: 'tool', content: result, tool_call_id: call.id });
      updatedMessages.push({ role: 'tool', content: result, tool_call_id: call.id });
    }

    if (shouldHangUp) break;

    completion = await client.chat.completions.create({
      model: MODEL, messages, tools: TOOLS, tool_choice: 'auto', temperature: 0.4,
    });
  }

  if (!shouldHangUp) {
    finalResponse = completion.choices[0]?.message?.content ?? 'Sorry, I could not process that.';
    updatedMessages.push({ role: 'assistant', content: finalResponse });
  }

  return { response: finalResponse, shouldHangUp, updatedMessages };
}

export async function saveCallMemory(
  userId: string,
  type: 'morning' | 'evening',
  messages: AgentMessage[],
): Promise<void> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return;

  try {
    const client = new Groq({ apiKey });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const transcript = messages
      .filter(m => m.role === 'user' || (m.role === 'assistant' && !m.tool_calls))
      .map(m => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`)
      .join('\n');

    if (!transcript.trim()) return;

    const res = await client.chat.completions.create({
      model: MODEL,
      messages: [{
        role: 'user',
        content: `Summarise this voice assistant call in ONE sentence (max 20 words). Focus on what actions were taken or patterns noticed.\n\n${transcript}`,
      }],
      temperature: 0.3,
    });

    const summary = res.choices[0]?.message?.content?.trim() ?? '';
    if (!summary) return;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('voice_memory')
      .eq('id', userId)
      .single();

    const existing: CallMemoryEntry[] = profile?.voice_memory ?? [];
    const newEntry: CallMemoryEntry = {
      date: new Date().toISOString().slice(0, 10),
      type,
      summary,
    };

    // Keep last 10 entries
    const updated = [newEntry, ...existing].slice(0, 10);

    await supabase
      .from('user_profiles')
      .update({ voice_memory: updated })
      .eq('id', userId);

  } catch (err) {
    console.error('saveCallMemory failed:', err);
  }
}

export async function generateEveningSummary(
  userName: string,
  completedTasks: VoiceTask[],
  pendingTasks: VoiceTask[],
  memory: CallMemoryEntry[],
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const c = completedTasks.length;
    const p = pendingTasks.length;
    return `Good evening ${userName}! You completed ${c} task${c !== 1 ? 's' : ''} today. ${p > 0 ? `${p} still pending.` : 'Great work!'}`;
  }

  const client = new Groq({ apiKey });
  const completed = completedTasks.map(t => t.title).join(', ') || 'none';
  const pending   = pendingTasks.map(t => t.title).join(', ')   || 'none';
  const memCtx    = memory.length
    ? `Recent patterns: ${memory.slice(0, 3).map(m => m.summary).join('; ')}.`
    : '';

  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [{
      role: 'user',
      content: `Write a warm, encouraging evening summary for ${userName}.
Completed today: ${completed}.
Still pending: ${pending}.
${memCtx}
Keep it to 3-4 sentences, voice-friendly (no lists, no markdown). Include one personalised improvement tip based on their patterns if available, otherwise a general tip.`,
    }],
    temperature: 0.6,
  });

  return res.choices[0]?.message?.content ?? `Good evening ${userName}! Nice work today.`;
}
