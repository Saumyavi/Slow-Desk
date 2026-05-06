-- Add notification preference columns to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS notification_email_enabled    BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_whatsapp_enabled BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_phone            TEXT,
  ADD COLUMN IF NOT EXISTS notification_time             TEXT      NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS notification_timezone         TEXT      NOT NULL DEFAULT 'UTC';
