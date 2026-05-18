-- Voice agent: calendar awareness, project progress snapshot, evening call time.
-- Safe to re-run.

-- voice_sessions: persist the calendar context and project progress used for the call
ALTER TABLE voice_sessions
  ADD COLUMN IF NOT EXISTS calendar_events  jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS project_progress jsonb DEFAULT '[]';

-- user_profiles: separate time-of-day for the evening call.
-- Morning time + timezone already exist as notification_time / notification_timezone.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS notification_call_evening_time text NOT NULL DEFAULT '19:00';
