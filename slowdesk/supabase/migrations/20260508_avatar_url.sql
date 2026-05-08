-- Add avatar_url column to user_profiles for profile picture upload
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create storage bucket for avatars (run once)
-- Note: bucket creation must be done via Supabase dashboard or Storage API,
-- not via SQL. Ensure a public bucket named 'avatars' exists.

-- RLS policy: users can read/write their own avatar
-- (assumes Supabase Storage RLS is enabled on the 'avatars' bucket)
