-- Google Calendar OAuth tokens on user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS google_calendar_connected     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_calendar_access_token  TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_token_expiry  TIMESTAMPTZ;

-- source + google_event_id on calendar_events
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS source          TEXT NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Prevent duplicate Google events on re-sync
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_events_google_id
  ON calendar_events(user_id, google_event_id)
  WHERE google_event_id IS NOT NULL;
