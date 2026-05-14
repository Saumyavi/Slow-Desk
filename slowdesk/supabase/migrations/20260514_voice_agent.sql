-- Voice agent: new profile columns + sessions table
-- Run this if not already applied manually

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS notification_call_enabled         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_call_evening_enabled boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS voice_sessions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid   text        NOT NULL,
  user_id    uuid        REFERENCES auth.users NOT NULL,
  type       text        NOT NULL CHECK (type IN ('morning', 'evening')),
  messages   jsonb       DEFAULT '[]',
  tasks      jsonb       DEFAULT '[]',
  status     text        DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS voice_sessions_call_sid_idx ON voice_sessions (call_sid);
CREATE INDEX IF NOT EXISTS voice_sessions_user_id_idx  ON voice_sessions (user_id);
