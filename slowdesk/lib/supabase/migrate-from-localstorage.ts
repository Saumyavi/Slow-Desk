import { createClient } from './client';
import * as db from './db';

/**
 * Migrates data from localStorage to Supabase for a given user
 * Run this in the browser console to migrate your existing data
 */
export async function migrateLocalStorageToSupabase(email: string) {
  const supabase = createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No authenticated user');
    return;
  }

  console.log('Starting migration for user:', email);

  try {
    // Migrate tasks
    const tasksKey = `sd:${email}:tasks`;
    const tasksData = localStorage.getItem(tasksKey);
    if (tasksData) {
      const tasks = JSON.parse(tasksData);
      console.log(`Found ${tasks.length} tasks to migrate`);
      for (const task of tasks) {
        await db.createTask(user.id, task);
      }
      console.log('✓ Tasks migrated');
    }

    // Migrate projects
    const projectsKey = `sd:${email}:projects`;
    const projectsData = localStorage.getItem(projectsKey);
    if (projectsData) {
      const projects = JSON.parse(projectsData);
      console.log(`Found ${projects.length} projects to migrate`);
      for (const project of projects) {
        await db.createProject(user.id, project);
      }
      console.log('✓ Projects migrated');
    }

    // Migrate calendar events
    const eventsKey = `sd:${email}:events`;
    const eventsData = localStorage.getItem(eventsKey);
    if (eventsData) {
      const events = JSON.parse(eventsData);
      console.log(`Found ${events.length} events to migrate`);
      for (const event of events) {
        await db.createCalendarEvent(user.id, event);
      }
      console.log('✓ Calendar events migrated');
    }

    // Migrate habits
    const habitsKey = `sd:${email}:habits`;
    const habitsData = localStorage.getItem(habitsKey);
    if (habitsData) {
      const habits = JSON.parse(habitsData);
      console.log(`Found ${habits.length} habits to migrate`);
      for (const habit of habits) {
        const newHabit = await db.createHabit(user.id, habit);
        // Migrate habit history
        if (habit.history && habit.history.length > 0) {
          console.log(`  Migrating ${habit.history.length} history entries for habit: ${habit.name}`);
          for (const date of habit.history) {
            await db.toggleHabitDate(newHabit.id, date);
          }
        }
      }
      console.log('✓ Habits migrated');
    }

    // Migrate completions
    const completionsKey = `sd:${email}:completions`;
    const completionsData = localStorage.getItem(completionsKey);
    if (completionsData) {
      const completions = JSON.parse(completionsData);
      const dates = Object.keys(completions);
      console.log(`Found ${dates.length} completion records to migrate`);
      for (const date of dates) {
        const count = completions[date];
        if (count > 0) {
          // Insert the completion record directly
          for (let i = 0; i < count; i++) {
            await db.incrementDailyCompletion(user.id, date);
          }
        }
      }
      console.log('✓ Completions migrated');
    }

    console.log('✅ Migration completed successfully!');
    console.log('You can now refresh the page to see your migrated data.');

  } catch (err) {
    console.error('Migration failed:', err);
  }
}

// Make it available globally in browser console
if (typeof window !== 'undefined') {
  (window as any).migrateFromLocalStorage = migrateLocalStorageToSupabase;
}
