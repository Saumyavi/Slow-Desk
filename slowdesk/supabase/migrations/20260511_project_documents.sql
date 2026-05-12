-- Create project_documents table to store file metadata
CREATE TABLE IF NOT EXISTS project_documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_user_id ON project_documents(user_id);

-- Enable RLS
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own project documents" ON project_documents;
CREATE POLICY "Users can view their own project documents"
  ON project_documents FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own project documents" ON project_documents;
CREATE POLICY "Users can insert their own project documents"
  ON project_documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own project documents" ON project_documents;
CREATE POLICY "Users can update their own project documents"
  ON project_documents FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own project documents" ON project_documents;
CREATE POLICY "Users can delete their own project documents"
  ON project_documents FOR DELETE
  USING (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE project_documents IS 'Reference documents and files attached to projects';
