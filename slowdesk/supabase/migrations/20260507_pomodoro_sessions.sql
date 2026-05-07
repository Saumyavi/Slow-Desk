-- Pomodoro / focus session tracking
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id            TEXT        PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id       TEXT,
  task_title    TEXT        NOT NULL,
  duration_secs INTEGER     NOT NULL DEFAULT 1500,  -- 25 min default
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pomodoro_user_date
  ON pomodoro_sessions(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_pomodoro_task
  ON pomodoro_sessions(task_id)
  WHERE task_id IS NOT NULL;

ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own pomodoro sessions"
  ON pomodoro_sessions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
