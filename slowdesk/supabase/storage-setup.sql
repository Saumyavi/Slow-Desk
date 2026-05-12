-- Create storage bucket for project documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
DROP POLICY IF EXISTS "Users can upload their own project documents" ON storage.objects;
CREATE POLICY "Users can upload their own project documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can view their own project documents" ON storage.objects;
CREATE POLICY "Users can view their own project documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own project documents" ON storage.objects;
CREATE POLICY "Users can update their own project documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own project documents" ON storage.objects;
CREATE POLICY "Users can delete their own project documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
