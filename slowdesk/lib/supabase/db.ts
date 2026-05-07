import { createClient } from './client';
import { nextOccurrenceDate, dateToDueBucket, Task } from '@/lib/data';

// Helper to get fresh supabase client
function getClient() {
  return createClient();
}

// ========== USER PROFILES ==========

export async function getUserProfile(userId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    name: data.name,
    bio: data.bio,
    role: data.role,
    location: data.location,
    avatar: data.avatar,
    status: data.status,
  };
}

export interface NotificationPrefs {
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  phone: string | null;
  time: string;
  timezone: string;
}

export async function getNotificationPrefs(userId: string): Promise<NotificationPrefs | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('notification_email_enabled, notification_whatsapp_enabled, notification_phone, notification_time, notification_timezone')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    emailEnabled: data.notification_email_enabled ?? false,
    whatsappEnabled: data.notification_whatsapp_enabled ?? false,
    phone: data.notification_phone ?? null,
    time: data.notification_time ?? '08:00',
    timezone: data.notification_timezone ?? 'UTC',
  };
}

export async function updateNotificationPrefs(userId: string, prefs: Partial<NotificationPrefs>) {
  const supabase = getClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (prefs.emailEnabled !== undefined)   updates.notification_email_enabled    = prefs.emailEnabled;
  if (prefs.whatsappEnabled !== undefined) updates.notification_whatsapp_enabled = prefs.whatsappEnabled;
  if (prefs.phone !== undefined)          updates.notification_phone            = prefs.phone;
  if (prefs.time !== undefined)           updates.notification_time             = prefs.time;
  if (prefs.timezone !== undefined)       updates.notification_timezone         = prefs.timezone;

  const { error } = await supabase.from('user_profiles').update(updates).eq('id', userId);
  if (error) throw error;
  return true;
}

export async function createUserProfile(userId: string, name: string, email: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from('user_profiles')
    .insert({ id: userId, name });

  if (error) throw error;
  return true;
}

export async function updateUserProfile(userId: string, updates: any) {
  const supabase = getClient();
  const { error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
  return true;
}

// ========== USER PREFERENCES ==========

export async function getUserPreferences(userId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function updateUserPreferences(userId: string, updates: any) {
  const supabase = getClient();
  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
  return true;
}

// ========== TASKS ==========

export async function getTasks(userId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*, projects(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((t: any) => ({
    id: t.id,
    title: t.title,
    done: t.done,
    project: t.projects?.name || '',
    tone: t.tone,
    attach: t.attach,
    due: t.due,
    time: t.time,
    priority: t.priority,
    recurrenceRule: t.recurrence_rule ?? undefined,
    recurrenceTemplateId: t.recurrence_template_id ?? undefined,
  }));
}

export async function createTask(userId: string, task: any) {
  const supabase = getClient();

  // Get project_id from project name if provided
  let projectId = null;
  if (task.project) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .eq('name', task.project)
      .maybeSingle();
    projectId = projects?.id || null;
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      id: `t${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: userId,
      project_id: projectId,
      title: task.title,
      done: task.done,
      tone: task.tone,
      attach: task.attach,
      due: task.due,
      time: task.time,
      priority: task.priority,
      recurrence_rule: task.recurrenceRule ?? null,
      recurrence_template_id: task.recurrenceTemplateId ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(userId: string, taskId: string, updates: any) {
  const supabase = getClient();

  const updateData: any = { updated_at: new Date().toISOString() };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.done !== undefined) updateData.done = updates.done;
  if (updates.tone !== undefined) updateData.tone = updates.tone;
  if (updates.attach !== undefined) updateData.attach = updates.attach;
  if (updates.due !== undefined) updateData.due = updates.due;
  if (updates.time !== undefined) updateData.time = updates.time;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.recurrenceRule !== undefined) updateData.recurrence_rule = updates.recurrenceRule || null;

  if (updates.project !== undefined) {
    if (updates.project) {
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', userId)
        .eq('name', updates.project)
        .maybeSingle();
      updateData.project_id = projects?.id || null;
    } else {
      updateData.project_id = null;
    }
  }

  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

export async function deleteTask(userId: string, taskId: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

export async function spawnNextRecurrence(userId: string, completedTask: Task): Promise<Task | null> {
  if (!completedTask.recurrenceRule) return null;
  const nextDate   = nextOccurrenceDate(completedTask.recurrenceRule, new Date());
  const dueBucket  = dateToDueBucket(nextDate);
  const templateId = completedTask.recurrenceTemplateId ?? completedTask.id;
  const newTask    = {
    title:               completedTask.title,
    done:                false,
    project:             completedTask.project,
    tone:                completedTask.tone,
    attach:              0,
    due:                 dueBucket,
    time:                completedTask.time,
    priority:            completedTask.priority,
    recurrenceRule:      completedTask.recurrenceRule,
    recurrenceTemplateId: templateId,
  };
  return await createTask(userId, newTask);
}

export async function getRecurringHistory(userId: string, task: Task): Promise<{ title: string; completedAt: string }[]> {
  const supabase = getClient();
  const templateId = task.recurrenceTemplateId ?? task.id;
  const { data } = await supabase
    .from('tasks')
    .select('title, updated_at')
    .eq('user_id', userId)
    .eq('done', true)
    .or(`id.eq.${templateId},recurrence_template_id.eq.${templateId}`)
    .order('updated_at', { ascending: false })
    .limit(30);
  return (data ?? []).map((r: any) => ({ title: r.title, completedAt: r.updated_at }));
}

export async function skipRecurrence(userId: string, task: Task): Promise<Task | null> {
  const supabase = getClient();
  // Delete current instance
  await supabase.from('tasks').delete().eq('id', task.id).eq('user_id', userId);
  // Spawn the next one
  return await spawnNextRecurrence(userId, task);
}

export async function catchUpRecurringTasks(userId: string): Promise<Task[]> {
  const supabase = getClient();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const { data } = await supabase
    .from('tasks')
    .select('id, recurrence_rule, updated_at')
    .eq('user_id', userId)
    .eq('done', false)
    .not('recurrence_rule', 'is', null);

  if (!data?.length) return [];

  const stale = data.filter((t: any) => new Date(t.updated_at) < yesterday);
  for (const t of stale) {
    await supabase
      .from('tasks')
      .update({ due: 'today', updated_at: new Date().toISOString() })
      .eq('id', t.id)
      .eq('user_id', userId);
  }
  return stale.length > 0 ? await getTasks(userId) : [];
}

// ========== PROJECTS ==========

export async function getProjects(userId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((p: any) => ({
    id: p.id,
    name: p.name,
    short: p.short,
    tone: p.tone,
    due: p.due || 'Ongoing',
    desc: p.description || '',
  }));
}

export async function createProject(userId: string, project: any) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('projects')
    .insert({
      id: `p${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: userId,
      name: project.name,
      short: project.short,
      tone: project.tone,
      due: project.due,
      description: project.desc,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(userId: string, projectId: string, updates: any) {
  const supabase = getClient();
  const { error } = await supabase
    .from('projects')
    .update({
      name: updates.name,
      short: updates.short,
      tone: updates.tone,
      due: updates.due,
      description: updates.desc,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

export async function deleteProject(userId: string, projectId: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

// ========== CALENDAR EVENTS ==========

export async function getCalendarEvents(userId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: true })
    .order('month', { ascending: true })
    .order('day', { ascending: true });

  if (error || !data) return [];

  return data.map((e: any) => ({
    id: e.id,
    title: e.title,
    day: e.day,
    month: e.month,
    year: e.year,
    time: e.time,
    endTime: e.end_time,
    color: e.color,
    note: e.note || '',
    source: (e.source ?? 'local') as 'local' | 'google',
    googleEventId: e.google_event_id ?? undefined,
  }));
}

export async function createCalendarEvent(userId: string, event: any) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      id: `e${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: userId,
      title: event.title,
      day: event.day,
      month: event.month,
      year: event.year,
      time: event.time,
      end_time: event.endTime,
      color: event.color,
      note: event.note,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCalendarEvent(userId: string, eventId: string, updates: any) {
  const supabase = getClient();
  const { error } = await supabase
    .from('calendar_events')
    .update({
      title: updates.title,
      day: updates.day,
      month: updates.month,
      year: updates.year,
      time: updates.time,
      end_time: updates.endTime,
      color: updates.color,
      note: updates.note,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

export async function deleteCalendarEvent(userId: string, eventId: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

// ========== GOOGLE CALENDAR ==========

export async function getGoogleCalendarStatus(userId: string) {
  const supabase = getClient();
  const { data } = await supabase
    .from('user_profiles')
    .select('google_calendar_connected, google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry')
    .eq('id', userId)
    .single();
  return data ?? null;
}

export async function saveGoogleCalendarTokens(userId: string, tokens: {
  accessToken: string;
  refreshToken: string | null;
  expiryMs: number;
}) {
  const supabase = getClient();
  const { error } = await supabase
    .from('user_profiles')
    .update({
      google_calendar_connected: true,
      google_calendar_access_token: tokens.accessToken,
      google_calendar_refresh_token: tokens.refreshToken,
      google_calendar_token_expiry: new Date(tokens.expiryMs).toISOString(),
    })
    .eq('id', userId);
  if (error) throw error;
}

export async function clearGoogleCalendarTokens(userId: string) {
  const supabase = getClient();
  await supabase
    .from('user_profiles')
    .update({
      google_calendar_connected: false,
      google_calendar_access_token: null,
      google_calendar_refresh_token: null,
      google_calendar_token_expiry: null,
    })
    .eq('id', userId);
  // Remove synced Google events
  await supabase
    .from('calendar_events')
    .delete()
    .eq('user_id', userId)
    .eq('source', 'google');
}

export async function upsertGoogleCalendarEvent(userId: string, event: {
  googleEventId: string;
  title: string;
  day: number; month: number; year: number;
  time: string; endTime: string;
  note: string;
}) {
  const supabase = getClient();
  const { error } = await supabase
    .from('calendar_events')
    .upsert({
      user_id: userId,
      google_event_id: event.googleEventId,
      title: event.title,
      day: event.day,
      month: event.month,
      year: event.year,
      time: event.time,
      end_time: event.endTime,
      color: '#5b8fbf',
      note: event.note,
      source: 'google',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,google_event_id', ignoreDuplicates: false });
  if (error) throw error;
}

// ========== NOTES ==========

export async function getNotes(userId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  return data.map((n: any) => ({
    id: n.id,
    title: n.title,
    updatedAt: n.updated_at,
    updated: relativeTime(n.updated_at),
    tone: n.tone,
    preview: (n.content || '').slice(0, 100) + '...',
  }));
}

export async function getNote(userId: string, noteId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    tone: data.tone,
  };
}

export async function createNote(userId: string, title: string, content: string, tone: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('notes')
    .insert({
      id: `n${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: userId,
      title,
      content,
      tone,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNote(userId: string, noteId: string, updates: any) {
  const supabase = getClient();
  const { error } = await supabase
    .from('notes')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

export async function deleteNote(userId: string, noteId: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

// ========== HABITS ==========

export async function getHabits(userId: string) {
  const supabase = getClient();
  const { data: habits, error } = await supabase
    .from('habits')
    .select('*, habit_history(completed_date)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !habits) return [];

  return habits.map((h: any) => ({
    id: h.id,
    name: h.name,
    emoji: h.emoji,
    goal: h.goal,
    color: h.color,
    history: (h.habit_history || []).map((hh: any) => hh.completed_date),
  }));
}

export async function createHabit(userId: string, habit: any) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('habits')
    .insert({
      id: `h${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: userId,
      name: habit.name,
      emoji: habit.emoji,
      goal: habit.goal,
      color: habit.color,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateHabit(userId: string, habitId: string, updates: any) {
  const supabase = getClient();
  const { error } = await supabase
    .from('habits')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', habitId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

export async function deleteHabit(userId: string, habitId: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

export async function toggleHabitDate(habitId: string, date: string) {
  const supabase = getClient();

  // Check if the date already exists
  const { data: existing } = await supabase
    .from('habit_history')
    .select('id')
    .eq('habit_id', habitId)
    .eq('completed_date', date)
    .maybeSingle();

  if (existing) {
    // Remove the date
    await supabase
      .from('habit_history')
      .delete()
      .eq('id', existing.id);
  } else {
    // Add the date
    await supabase
      .from('habit_history')
      .insert({
        habit_id: habitId,
        completed_date: date,
      });
  }

  return true;
}

// ========== NOTIFICATIONS ==========

export async function getNotifications(userId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(40);

  if (error || !data) return [];

  return data.map((n: any) => ({
    id: n.id,
    icon: n.icon,
    text: n.text,
    color: n.color,
    createdAt: n.created_at,
    readAt: n.read_at,
  }));
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

// ========== DAILY COMPLETIONS ==========

export async function getDailyCompletions(userId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('daily_completions')
    .select('date, count')
    .eq('user_id', userId);

  if (error || !data) return {};

  const result: Record<string, number> = {};
  data.forEach((d: any) => {
    result[d.date] = d.count;
  });
  return result;
}

export async function incrementDailyCompletion(userId: string, date: string) {
  const supabase = getClient();

  const { data: existing } = await supabase
    .from('daily_completions')
    .select('id, count')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('daily_completions')
      .update({
        count: existing.count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('daily_completions')
      .insert({
        user_id: userId,
        date,
        count: 1,
      });
  }

  return true;
}

export async function decrementDailyCompletion(userId: string, date: string) {
  const supabase = getClient();

  const { data: existing } = await supabase
    .from('daily_completions')
    .select('id, count')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (existing && existing.count > 0) {
    await supabase
      .from('daily_completions')
      .update({
        count: existing.count - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  }

  return true;
}

// ========== HELPER FUNCTIONS ==========

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return 'just now';
  if (mins < 60)  return `${mins} minutes ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days === 1) return 'yesterday';
  if (days < 7)   return `${days} days ago`;
  if (days < 30)  return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
