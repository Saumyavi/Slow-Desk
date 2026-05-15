-- Cross-call memory: rolling log of past call summaries per user
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS voice_memory jsonb DEFAULT '[]';
