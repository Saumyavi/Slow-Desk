# Data Persistence Fix

## Problem
Tasks, projects, calendar events, and notes were being lost after re-login because they were only stored in React state/localStorage and not being persisted to Supabase.

## Solution
Updated all create/update/delete operations to call Supabase database functions:

### Fixed Files:

1. **app/page.tsx** (Dashboard)
   - `onAdd` - Now calls `db.createTask()`
   - `onEdit` - Now calls `db.updateTask()`
   - `onDelete` - Now calls `db.deleteTask()`

2. **app/tasks/page.tsx** (Tasks Page)
   - `onAdd` - Now calls `db.createTask()`
   - `onEditSave` - Now calls `db.updateTask()`
   - `onDelete` - Now calls `db.deleteTask()`

3. **app/projects/page.tsx** (Projects Page)
   - `saveProject` - Now calls `db.createProject()` or `db.updateProject()`
   - `deleteProject` - Now calls `db.deleteProject()`

4. **app/calendar/page.tsx** (Calendar Page)
   - `saveEvent` - Now calls `db.createCalendarEvent()` or `db.updateCalendarEvent()`
   - `deleteEvent` - Now calls `db.deleteCalendarEvent()`

5. **app/notes/page.tsx** (Notes Page)
   - Migrated from localStorage to Supabase
   - `addNote` - Now calls `db.createNote()`
   - `saveNote` - Now calls `db.updateNote()`
   - `deleteNote` - Now calls `db.deleteNote()`
   - `onAddTask` - Now calls `db.createTask()`
   - `onEditTask` - Now calls `db.updateTask()`
   - Initial notes are created in Supabase on first load

6. **lib/supabase/db.ts** (Database Layer)
   - Fixed `.single()` calls to use `.maybeSingle()` to prevent errors when no rows exist
   - Fixed queries in: `getUserPreferences`, `incrementDailyCompletion`, `decrementDailyCompletion`, `toggleHabitDate`, `createTask`, `updateTask`

## Result
✅ All data now persists to Supabase and survives re-login
✅ Tasks, projects, calendar events, and notes all persist correctly
✅ Habits were already working correctly
✅ No API errors for empty query results (fixed user_preferences error)
