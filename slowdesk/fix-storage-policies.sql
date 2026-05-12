-- Check if policies exist on storage.objects
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload their own project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own project documents" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Users can upload their own project documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own project documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own project documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own project documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
