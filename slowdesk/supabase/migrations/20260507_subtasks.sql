CREATE TABLE IF NOT EXISTS subtasks (
  id          TEXT        PRIMARY KEY DEFAULT ('st' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  task_id     TEXT        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  done        BOOLEAN     NOT NULL DEFAULT false,
  position    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subtasks_task_id_idx  ON subtasks (task_id);
CREATE INDEX IF NOT EXISTS subtasks_user_id_idx  ON subtasks (user_id, created_at ASC);

ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own subtasks"
  ON subtasks FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
