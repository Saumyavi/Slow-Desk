import { createClient } from './client';

function getClient() { return createClient(); }

export async function getHabits(userId: string) {
  const supabase = getClient();
  const { data: habits, error } = await supabase
    .from('habits')
    .select('*, habit_history(completed_date), subhabits(*)')
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
    subhabits: (h.subhabits || []).sort((a: any, b: any) => a.position - b.position),
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
    .update({ ...updates, updated_at: new Date().toISOString() })
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

  const { data: existing } = await supabase
    .from('habit_history')
    .select('id')
    .eq('habit_id', habitId)
    .eq('completed_date', date)
    .maybeSingle();

  if (existing) {
    await supabase.from('habit_history').delete().eq('id', existing.id);
  } else {
    await supabase.from('habit_history').insert({ habit_id: habitId, completed_date: date });
  }
  return true;
}

export async function getSubhabits(habitId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('subhabits')
    .select('*')
    .eq('habit_id', habitId)
    .order('position', { ascending: true });
  if (error || !data) return [];
  return data;
}

export async function createSubhabit(habitId: string, title: string, position: number = 0) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('subhabits')
    .insert({
      id: `sh${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      habit_id: habitId,
      title,
      position,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSubhabit(subhabitId: string, updates: any) {
  const supabase = getClient();
  const { error } = await supabase
    .from('subhabits')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', subhabitId);
  if (error) throw error;
  return true;
}

export async function deleteSubhabit(subhabitId: string) {
  const supabase = getClient();
  const { error } = await supabase.from('subhabits').delete().eq('id', subhabitId);
  if (error) throw error;
  return true;
}
