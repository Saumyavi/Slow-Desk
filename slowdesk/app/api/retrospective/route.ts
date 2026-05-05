import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
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
          from: 'SlowDesk <weekly@slowdesk.app>',
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

  const insights: string[] = [];
  if (completedTasks.length > 10) {
    insights.push("You're on fire! 🔥 Over 10 tasks completed this week.");
  } else if (completedTasks.length > 5) {
    insights.push('Solid week! You completed a good number of tasks.');
  } else if (completedTasks.length === 0) {
    insights.push("Looks like you took it slow this week. That's okay too!");
  }
  if (strugglingHabits.length > 0) {
    insights.push(`Having trouble with ${strugglingHabits[0].name}? Try making it easier or more enjoyable.`);
  }
  if (oldPendingTasks && oldPendingTasks.length > 3) {
    insights.push('You have some tasks that have been waiting for a while. Time to tackle them or let them go?');
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
    insights,
    isAllComplete,
    weekStart: weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weekEnd: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  };
}
