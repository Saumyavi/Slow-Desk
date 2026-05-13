import { createClient } from './client';

function getClient() { return createClient(); }

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

export async function getProjectDocuments(projectId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('project_documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function uploadProjectDocument(
  _userId: string,
  projectId: string,
  file: File,
): Promise<{ id: string; storage_path: string; file_name: string }> {
  const supabase = getClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
  const filePath = `${user.id}/${projectId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('project-documents')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });
  if (uploadError) throw uploadError;

  const docId = `pd${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { data, error: dbError } = await supabase
    .from('project_documents')
    .insert({
      id: docId,
      project_id: projectId,
      user_id: user.id,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      storage_path: filePath,
    })
    .select()
    .single();
  if (dbError) throw dbError;

  return { id: data.id, storage_path: data.storage_path, file_name: data.file_name };
}

export async function deleteProjectDocument(userId: string, documentId: string) {
  const supabase = getClient();

  const { data: doc } = await supabase
    .from('project_documents')
    .select('storage_path')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single();
  if (!doc) throw new Error('Document not found');

  await supabase.storage.from('project-documents').remove([doc.storage_path]);

  const { error } = await supabase
    .from('project_documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', userId);
  if (error) throw error;
  return true;
}

export async function getProjectDocumentUrl(storagePath: string): Promise<string> {
  const supabase = getClient();
  const { data } = supabase.storage.from('project-documents').getPublicUrl(storagePath);
  return data.publicUrl;
}
