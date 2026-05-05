import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getWeeklyRetrospectiveEmail } from '@/lib/emails/weekly-retrospective';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  try {
    // Verify this is a cron request (security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create admin client with service role key
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError || !users) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const results = [];

    // Send retrospective email to each user
    for (const user of users.users) {
      try {
        const retrospectiveData = await generateRetrospectiveData(user.id);
        const emailHtml = getWeeklyRetrospectiveEmail(retrospectiveData);

        await resend.emails.send({
          from: 'SlowDesk <weekly@slowdesk.app>',
          to: user.email!,
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

    return NextResponse.json({
      success: true,
      totalUsers: users.users.length,
      results
    });
  } catch (error) {
    console.error('Retrospective cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateRetrospectiveData(userId: string) {
  const supabase = await createClient();

  // Calculate date range: last 7 days (this past week)
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const weekAgoStr = weekAgo.toISOString();
  const todayStr = today.toISOString();

  // Fetch tasks from the past week
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .or(`created_at.gte.${weekAgoStr},updated_at.gte.${weekAgoStr}`);

  const completedTasks = (allTasks || []).filter(t => t.completed);
  const pendingTasks = (allTasks || []).filter(t => !t.completed);

  // Find tasks that were never completed (created more than a week ago but still pending)
  const { data: oldPendingTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', false)
    .lt('created_at', weekAgoStr);

  // Fetch habits data from the past week
  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId);

  // Analyze habit completion
  const habitStats = (habits || []).map(habit => {
    const completedDays = Object.keys(habit.completed_dates || {}).filter(date => {
      const d = new Date(date);
      return d >= weekAgo && d <= today;
    }).length;

    return {
      name: habit.name,
      completedDays,
      totalDays: 7,
      percentage: Math.round((completedDays / 7) * 100),
    };
  });

  // Find struggling habits (< 50% completion)
  const strugglingHabits = habitStats.filter(h => h.percentage < 50);

  // Fetch projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId);

  const activeProjects = (projects || []).filter(p => p.status === 'active').length;

  // Generate insights
  const insights = [];

  if (completedTasks.length > 10) {
    insights.push('You\'re on fire! 🔥 Over 10 tasks completed this week.');
  } else if (completedTasks.length > 5) {
    insights.push('Solid week! You completed a good number of tasks.');
  } else if (completedTasks.length === 0) {
    insights.push('Looks like you took it slow this week. That\'s okay too!');
  }

  if (strugglingHabits.length > 0) {
    insights.push(`Having trouble with ${strugglingHabits[0].name}? Try making it easier or more enjoyable.`);
  }

  if (oldPendingTasks && oldPendingTasks.length > 3) {
    insights.push('You have some tasks that have been waiting for a while. Time to tackle them or let them go?');
  }

  const isAllComplete = completedTasks.length > 0 && pendingTasks.length === 0 && strugglingHabits.length === 0;

  return {
    userName: userId, // We'll use user metadata if available
    completedTasksCount: completedTasks.length,
    pendingTasksCount: pendingTasks.length,
    completedTasks: completedTasks.slice(0, 10), // Top 10
    avoidedTasks: (oldPendingTasks || []).slice(0, 5), // Top 5 oldest
    habitStats,
    strugglingHabits,
    activeProjects,
    insights,
    isAllComplete,
    weekStart: weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weekEnd: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  };
}
