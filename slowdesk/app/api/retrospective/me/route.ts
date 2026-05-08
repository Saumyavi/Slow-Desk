import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString();

  const { data: allTasks } = await supabase
    .from('tasks')
    .select('title, done')
    .eq('user_id', user.id)
    .or(`created_at.gte.${weekAgoStr},updated_at.gte.${weekAgoStr}`);

  const completedTasks = (allTasks || []).filter(t => t.done);
  const pendingTasks   = (allTasks || []).filter(t => !t.done);
  const totalTasks     = completedTasks.length + pendingTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const { data: habits } = await supabase
    .from('habits')
    .select('name, habit_history(completed_date)')
    .eq('user_id', user.id);

  const habitStats = (habits || []).map((habit: any) => {
    const completedDays = ((habit.habit_history as any[]) || []).filter((h: any) => {
      const d = new Date(h.completed_date);
      return d >= weekAgo && d <= today;
    }).length;
    return { name: habit.name, percentage: Math.round((completedDays / 7) * 100) };
  });

  const strugglingHabits = habitStats.filter(h => h.percentage < 50);

  let insight = '';
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel(
        { model: 'gemini-2.5-flash' },
        { apiVersion: 'v1beta' },
      );
      const dataLines = [
        `Tasks completed: ${completedTasks.length} of ${totalTasks} (${completionRate}%)`,
        habitStats.length > 0
          ? `Habits: ${habitStats.map(h => `${h.name} ${h.percentage}%`).join(', ')}`
          : 'No habits tracked this week',
      ].join('\n');

      const prompt = `You are a warm, thoughtful productivity coach writing a weekly insight. Here is the user's week:\n\n${dataLines}\n\nWrite a single flowing paragraph — exactly 2 sentences — that notices a real pattern, gives one specific encouraging nudge, sounds human and personal. Does NOT begin with "You". No emoji, no bullets.`;

      const result = await model.generateContent(prompt);
      insight = result.response.text().trim();
    } catch { /* fall through to static fallback */ }
  }

  if (!insight) {
    if (completionRate >= 80) {
      insight = `Finishing ${completionRate}% of tasks is a genuinely strong result — that kind of consistency compounds over time. Carry the same focus into next week and see what's possible.`;
    } else if (strugglingHabits.length > 0) {
      insight = `The numbers show solid task progress, but ${strugglingHabits[0].name} slipped this week. Try attaching it to something you already do every day — habits stick when they piggyback on existing routines.`;
    } else if (completedTasks.length === 0) {
      insight = "A quiet week is still a week lived — sometimes stepping back is exactly what you need. Come back Monday with one clear intention and let that carry the momentum.";
    } else {
      insight = "Progress is progress, no matter the pace. What's one thing you can close out by Wednesday next week?";
    }
  }

  return NextResponse.json({
    insight,
    stats: { completedTasks: completedTasks.length, totalTasks, completionRate },
  });
}
