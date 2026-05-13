import { createClient } from './client';
import { nextOccurrenceDate, dateToDueBucket } from '@/lib/data';
import type { Task } from '@/lib/types';

function getClient() { return createClient(); }

function dueBucketToDate(bucket: string): string | null {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const add = (days: number) => {
    const d = new Date(today); d.setDate(d.getDate() + days);
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  switch (bucket) {
    case 'overdue':
    case 'today':     return add(0);
    case 'tomorrow':  return add(1);
    case 'this week': return add(3);
    case 'next week': return add(9);
    case 'someday':   return null;
    default:          return null;
  }
}

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
    due: t.due_date ? dateToDueBucket(t.due_date) : t.due,
    time: t.time,
    priority: t.priority,
    description: t.description ?? undefined,
    recurrenceRule: t.recurrence_rule ?? undefined,
    recurrenceTemplateId: t.recurrence_template_id ?? undefined,
  }));
}

export async function createTask(userId: string, task: any) {
  const supabase = getClient();

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
      due_date: dueBucketToDate(task.due),
      time: task.time,
      priority: task.priority,
      description: task.description ?? null,
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

  if (updates.title !== undefined)         updateData.title           = updates.title;
  if (updates.done !== undefined)          updateData.done            = updates.done;
  if (updates.tone !== undefined)          updateData.tone            = updates.tone;
  if (updates.attach !== undefined)        updateData.attach          = updates.attach;
  if (updates.due !== undefined)           { updateData.due = updates.due; updateData.due_date = dueBucketToDate(updates.due); }
  if (updates.time !== undefined)          updateData.time            = updates.time;
  if (updates.priority !== undefined)      updateData.priority        = updates.priority;
  if (updates.description !== undefined)   updateData.description     = updates.description || null;
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
  return await createTask(userId, {
    title:                completedTask.title,
    done:                 false,
    project:              completedTask.project,
    tone:                 completedTask.tone,
    attach:               0,
    due:                  dueBucket,
    time:                 completedTask.time,
    priority:             completedTask.priority,
    recurrenceRule:       completedTask.recurrenceRule,
    recurrenceTemplateId: templateId,
  });
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
  await supabase.from('tasks').delete().eq('id', task.id).eq('user_id', userId);
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

export async function getSubtasksByUser(userId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true });

  if (error || !data) return [];

  return data.map((s: any) => ({
    id: s.id,
    task_id: s.task_id,
    title: s.title,
    done: s.done,
    position: s.position,
  }));
}

export async function createSubtask(userId: string, taskId: string, title: string, position: number) {
  const supabase = getClient();
  const id = `st${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const { data, error } = await supabase
    .from('subtasks')
    .insert({ id, user_id: userId, task_id: taskId, title, done: false, position })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, task_id: data.task_id, title: data.title, done: data.done, position: data.position };
}

export async function toggleSubtask(userId: string, subtaskId: string, done: boolean) {
  const supabase = getClient();
  const { error } = await supabase
    .from('subtasks')
    .update({ done })
    .eq('id', subtaskId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteSubtask(userId: string, subtaskId: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('id', subtaskId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function savePomodoroSession(userId: string, taskId: string, taskTitle: string, durationSecs: number) {
  const supabase = getClient();
  const { error } = await supabase.from('pomodoro_sessions').insert({
    id: `p${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    task_id: taskId,
    task_title: taskTitle,
    duration_secs: durationSecs,
  });
  if (error) throw error;
}

export async function getTaskPomodorosToday(userId: string, taskId: string): Promise<number> {
  const supabase = getClient();
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from('pomodoro_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .gte('completed_at', `${today}T00:00:00.000Z`);
  return count ?? 0;
}

export async function getDailyPomodoroCount(userId: string): Promise<number> {
  const supabase = getClient();
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from('pomodoro_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('completed_at', `${today}T00:00:00.000Z`);
  return count ?? 0;
}
