-- Add actual due_date column to tasks for proper date rollover
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;
