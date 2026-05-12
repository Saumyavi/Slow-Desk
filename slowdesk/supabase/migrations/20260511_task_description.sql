-- Add description column to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment
COMMENT ON COLUMN tasks.description IS 'Optional description, notes, links, or context for the task';
