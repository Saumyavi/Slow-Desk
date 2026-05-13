export interface ExtractedTask {
  title: string;
  priority: 'high' | 'medium' | 'low';
  due: 'today' | 'tomorrow' | 'this week' | 'overdue' | null;
  notes: string;
}

/**
 * Parse tasks from OCR-extracted text using pattern matching
 * @param text - Raw text from OCR
 * @returns Array of structured tasks
 */
export function parseTasksFromText(text: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Task marker patterns
  const taskMarkers = [
    /^[-•*]\s+(.+)$/,           // - Task, • Task, * Task
    /^(\d+)[\.)]\s+(.+)$/,      // 1. Task, 1) Task
    /^\[[ xX]\]\s+(.+)$/,       // [ ] Task, [x] Task, [X] Task
    /^☐\s+(.+)$/,               // ☐ Task (checkbox emoji)
    /^TODO:?\s+(.+)$/i,         // TODO: Task, todo Task
    /^Task:?\s+(.+)$/i,         // Task: Do something
  ];

  for (let line of lines) {
    let taskText: string | null = null;

    // Check if line matches any task marker pattern
    for (const pattern of taskMarkers) {
      const match = line.match(pattern);
      if (match) {
        // Get the task text (last capture group)
        taskText = match[match.length - 1].trim();
        break;
      }
    }

    // If no marker found, check if line looks like a task
    if (!taskText && line.length > 5 && line.length < 150) {
      // Check for action verbs at the start
      const actionVerbs = /^(buy|call|email|send|fix|update|create|write|schedule|book|pay|submit|review|check|finish|complete|prepare|organize|plan|contact|meet|discuss|research|find|get|make|do|cancel|reschedule|confirm|order|purchase|install|download|upload|sign|read|watch|listen|attend|visit|clean|wash|cook|eat|drink|exercise|practice|study|learn|teach|help|ask|answer|reply|respond|follow up|remind|notify)/i;

      if (actionVerbs.test(line)) {
        taskText = line;
      }
    }

    // If we found a task, parse its details
    if (taskText) {
      const priority = detectPriority(taskText);
      const due = detectDueDate(taskText);
      const { title, notes } = cleanTaskTitle(taskText);

      tasks.push({
        title,
        priority,
        due,
        notes,
      });
    }
  }

  // Remove duplicate tasks (case-insensitive)
  const seen = new Set<string>();
  return tasks.filter(task => {
    const key = task.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Detect task priority from text content
 */
function detectPriority(text: string): 'high' | 'medium' | 'low' {
  const lower = text.toLowerCase();

  // High priority indicators
  const highPriorityKeywords = [
    'urgent',
    'asap',
    'important',
    'critical',
    'emergency',
    'immediately',
    'now',
    '!!!',
    '!!',
    'priority',
    'must',
  ];

  for (const keyword of highPriorityKeywords) {
    if (lower.includes(keyword)) {
      return 'high';
    }
  }

  // Low priority indicators
  const lowPriorityKeywords = [
    'maybe',
    'someday',
    'optional',
    'if possible',
    'when free',
    'nice to have',
    'eventually',
  ];

  for (const keyword of lowPriorityKeywords) {
    if (lower.includes(keyword)) {
      return 'low';
    }
  }

  // Default to medium
  return 'medium';
}

/**
 * Detect due date from text content
 */
function detectDueDate(text: string): 'today' | 'tomorrow' | 'this week' | null {
  const lower = text.toLowerCase();

  // Today indicators
  const todayKeywords = ['today', 'asap', 'now', 'immediately'];
  for (const keyword of todayKeywords) {
    if (lower.includes(keyword)) {
      return 'today';
    }
  }

  // Tomorrow indicators
  const tomorrowKeywords = ['tomorrow', 'tmr', 'tmrw'];
  for (const keyword of tomorrowKeywords) {
    if (lower.includes(keyword)) {
      return 'tomorrow';
    }
  }

  // This week indicators
  const thisWeekKeywords = [
    'this week',
    'by friday',
    'by weekend',
    'this weekend',
    'by end of week',
    'eow',
  ];
  for (const keyword of thisWeekKeywords) {
    if (lower.includes(keyword)) {
      return 'this week';
    }
  }

  // Date patterns (treat as this week for simplicity)
  const datePatterns = [
    /\d{1,2}[\/\-]\d{1,2}/,        // 5/6 or 5-6
    /(mon|tue|wed|thu|fri|sat|sun)/i, // Monday, Tue, etc.
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i,
  ];

  for (const pattern of datePatterns) {
    if (pattern.test(text)) {
      return 'this week';
    }
  }

  return null;
}

/**
 * Clean task title and extract notes
 */
function cleanTaskTitle(text: string): { title: string; notes: string } {
  let title = text;
  let notes = '';

  // Remove priority/due date markers
  const markersToRemove = [
    /urgent/gi,
    /asap/gi,
    /important/gi,
    /critical/gi,
    /!!!+/g,
    /!!+/g,
    /today/gi,
    /tomorrow/gi,
    /this week/gi,
    /by friday/gi,
    /by weekend/gi,
  ];

  for (const marker of markersToRemove) {
    title = title.replace(marker, '');
  }

  // Extract notes if there's additional context in parentheses
  const notesMatch = title.match(/\((.+)\)/);
  if (notesMatch) {
    notes = notesMatch[1].trim();
    title = title.replace(/\(.+\)/, '');
  }

  // Clean up whitespace
  title = title.replace(/\s+/g, ' ').trim();

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // Remove trailing punctuation except for ?
  title = title.replace(/[.,;:]+$/, '');

  return { title, notes };
}

/**
 * Get a user-friendly summary of extracted tasks
 */
export function getTasksSummary(tasks: ExtractedTask[]): string {
  if (tasks.length === 0) {
    return 'No tasks found';
  }

  const highPriority = tasks.filter(t => t.priority === 'high').length;
  const dueToday = tasks.filter(t => t.due === 'today' || t.due === 'overdue').length;

  let summary = `Found ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;

  if (highPriority > 0) {
    summary += `, ${highPriority} high priority`;
  }

  if (dueToday > 0) {
    summary += `, ${dueToday} due today`;
  }

  return summary;
}
