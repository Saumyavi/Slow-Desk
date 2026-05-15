-- Add habits and memory columns to voice_sessions
ALTER TABLE voice_sessions
  ADD COLUMN IF NOT EXISTS habits jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS memory jsonb DEFAULT '[]';
