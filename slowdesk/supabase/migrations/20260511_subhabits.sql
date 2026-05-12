-- Create subhabits table
CREATE TABLE IF NOT EXISTS subhabits (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_subhabits_habit_id ON subhabits(habit_id);

-- Add RLS policies
ALTER TABLE subhabits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subhabits"
  ON subhabits FOR SELECT
  USING (
    habit_id IN (
      SELECT id FROM habits WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own subhabits"
  ON subhabits FOR INSERT
  WITH CHECK (
    habit_id IN (
      SELECT id FROM habits WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own subhabits"
  ON subhabits FOR UPDATE
  USING (
    habit_id IN (
      SELECT id FROM habits WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own subhabits"
  ON subhabits FOR DELETE
  USING (
    habit_id IN (
      SELECT id FROM habits WHERE user_id = auth.uid()
    )
  );

-- Add comment
COMMENT ON TABLE subhabits IS 'Sub-habits or steps that are part of a main habit';
