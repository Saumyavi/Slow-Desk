import { createClient } from './client';
import { relativeTime } from '@/lib/utils/dates';

function getClient() { return createClient(); }

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
  return { id: data.id, title: data.title, content: data.content, tone: data.tone };
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
    .update({ ...updates, updated_at: new Date().toISOString() })
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
