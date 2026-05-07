-- Replace partial index with a proper unique constraint so upsert ON CONFLICT works
DROP INDEX IF EXISTS idx_calendar_events_google_id;

ALTER TABLE calendar_events
  ADD CONSTRAINT unique_user_google_event
  UNIQUE (user_id, google_event_id);
