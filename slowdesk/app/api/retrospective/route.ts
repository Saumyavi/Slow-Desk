import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getWeeklyRetrospectiveEmail } from '@/lib/emails/weekly-retrospective';

export async function GET(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError || !users) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const results = [];

    for (const user of users.users) {
      if (!user.email) continue;
      try {
        const retrospectiveData = await generateRetrospectiveData(supabaseAdmin, user.id, user.email);
        const emailHtml = getWeeklyRetrospectiveEmail(retrospectiveData);

        await resend.emails.send({
          from: 'SlowDesk <onboarding@resend.dev>',
          to: user.email,
          subject: retrospectiveData.isAllComplete
            ? '🎉 You crushed it this week! Your weekly recap'
            : '📊 Your weekly retrospective is here!',
          html: emailHtml,
        });

        results.push({ email: user.email, status: 'sent' });
      } catch (emailError) {
        console.error(`Failed to send to ${user.email}:`, emailError);
        results.push({ email: user.email, status: 'failed', error: String(emailError) });
      }
    }

    return NextResponse.json({ success: true, totalUsers: users.users.length, results });
  } catch (error) {
    console.error('Retrospective cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateRetrospectiveData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  userId: string,
  userEmail: string,
) {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString();

  const { data: allTasks } = await supabaseAdmin
    .from('tasks')
    .select('title, done, projects(name)')
    .eq('user_id', userId)
    .or(`created_at.gte.${weekAgoStr},updated_at.gte.${weekAgoStr}`);

  const completedTasks = (allTasks || []).filter((t: any) => t.done);
  const pendingTasks = (allTasks || []).filter((t: any) => !t.done);

  const { data: oldPendingTasks } = await supabaseAdmin
    .from('tasks')
    .select('title')
    .eq('user_id', userId)
    .eq('done', false)
    .lt('created_at', weekAgoStr);

  const { data: habits } = await supabaseAdmin
    .from('habits')
    .select('name, habit_history(completed_date)')
    .eq('user_id', userId);

  const habitStats = (habits || []).map((habit: any) => {
    const completedDays = (habit.habit_history || []).filter((h: any) => {
      const d = new Date(h.completed_date);
      return d >= weekAgo && d <= today;
    }).length;

    return {
      name: habit.name,
      completedDays,
      totalDays: 7,
      percentage: Math.round((completedDays / 7) * 100),
    };
  });

  const strugglingHabits = habitStats.filter((h: any) => h.percentage < 50);

  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select('status')
    .eq('user_id', userId);

  const activeProjects = (projects || []).filter((p: any) => p.status === 'active').length;

  const totalTasks = completedTasks.length + pendingTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  let aiInsight = '';
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
          ? `Habits: ${habitStats.map((h: { name: string; percentage: number }) => `${h.name} ${h.percentage}%`).join(', ')}`
          : 'No habits tracked this week',
        (oldPendingTasks || []).length > 0
          ? `Overdue tasks (waiting over a week): ${(oldPendingTasks || []).length}`
          : '',
        activeProjects > 0 ? `Active projects: ${activeProjects}` : '',
      ].filter(Boolean).join('\n');

      const prompt = `You are a warm, thoughtful productivity coach writing a weekly insight for a user's retrospective email. Here is their week in data:\n\n${dataLines}\n\nWrite a single flowing paragraph — exactly 2 sentences — that:\n- Notices a real pattern or tension in the numbers (don't just restate them)\n- Gives one specific, encouraging nudge for next week\n- Sounds human and personal, not corporate or generic\n- Does NOT begin with the word "You"\n- Has no emoji, no bullet points, no headers`;

      const result = await model.generateContent(prompt);
      aiInsight = result.response.text().trim();
    } catch {
      // fall through to static fallback
    }
  }

  if (!aiInsight) {
    if (completedTasks.length === 0) {
      aiInsight = "A quiet week is still a week lived — sometimes stepping back is exactly what you need. Come back Monday with one clear intention and let that carry the momentum.";
    } else if (completionRate >= 80) {
      aiInsight = `Finishing ${completionRate}% of tasks is a genuinely strong result — that kind of consistency compounds over time. Carry the same focus into next week and see what's possible.`;
    } else if (strugglingHabits.length > 0) {
      aiInsight = `The numbers show solid task progress, but ${strugglingHabits[0].name} slipped this week. Try attaching it to something you already do every day — habits stick when they piggyback on existing routines.`;
    } else if ((oldPendingTasks || []).length > 3) {
      aiInsight = "A few tasks have been sitting for a while, quietly accumulating weight. Pick one this week — either close it out or consciously let it go.";
    } else {
      aiInsight = "Progress is progress, no matter the pace. What's one thing you can close out by Wednesday next week?";
    }
  }

  const isAllComplete = completedTasks.length > 0 && pendingTasks.length === 0 && strugglingHabits.length === 0;

  return {
    userName: userEmail.split('@')[0],
    completedTasksCount: completedTasks.length,
    pendingTasksCount: pendingTasks.length,
    completedTasks: completedTasks.slice(0, 10).map((t: any) => ({
      title: t.title,
      project: (t.projects as any)?.name || '',
    })),
    avoidedTasks: (oldPendingTasks || []).slice(0, 5),
    habitStats,
    strugglingHabits,
    activeProjects,
    aiInsight,
    isAllComplete,
    weekStart: weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weekEnd: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  };
}
