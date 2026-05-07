-- Recurring tasks support
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS recurrence_rule        TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_template_id TEXT;

CREATE INDEX IF NOT EXISTS idx_tasks_recurrence
  ON tasks(user_id, recurrence_rule)
  WHERE recurrence_rule IS NOT NULL AND done = false;
