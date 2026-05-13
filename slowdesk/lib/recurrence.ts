const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const NLP_DAY_MAP: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function cleanTitle(input: string, match: string): string {
  return input
    .replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[-–—,\s]+|[-–—,\s]+$/g, '')
    .trim() || input.trim();
}

export function recurrenceLabel(rule: string): string {
  if (!rule) return '';
  if (rule === 'daily') return 'Every day';
  const [type, val] = rule.split(':');
  if (type === 'weekly')   return `Every ${DAY_NAMES[parseInt(val, 10)] ?? '?'}`;
  if (type === 'biweekly') return `Every 2 weeks (${DAY_NAMES[parseInt(val, 10)] ?? '?'})`;
  if (type === 'monthly')  return `Monthly on ${ordinal(parseInt(val, 10))}`;
  return '';
}

export function nextOccurrenceDate(rule: string, after: Date): string {
  const d = new Date(after);
  d.setHours(0, 0, 0, 0);
  if (rule === 'daily') {
    d.setDate(d.getDate() + 1);
  } else {
    const [type, val] = rule.split(':');
    const n = parseInt(val, 10);
    if (type === 'weekly') {
      d.setDate(d.getDate() + 1);
      while (d.getDay() !== n) d.setDate(d.getDate() + 1);
    } else if (type === 'biweekly') {
      d.setDate(d.getDate() + 14);
    } else if (type === 'monthly') {
      d.setDate(d.getDate() + 1);
      while (d.getDate() !== n) {
        d.setDate(d.getDate() + 1);
        if (d.getDate() === 1 && n > 28) break;
      }
    }
  }
  return d.toISOString().slice(0, 10);
}

export function parseRecurrenceFromTitle(input: string): { rule: string; cleanTitle: string } | null {
  const text = input.toLowerCase().trim();

  const dailyMatch = text.match(/\b(every\s+day|daily|each\s+day|every\s+morning|every\s+night|every\s+evening|every\s+weekday|weekdays|every\s+weekdays)\b/);
  if (dailyMatch) return { rule: 'daily', cleanTitle: cleanTitle(input, dailyMatch[0]) };

  const weekendMatch = text.match(/\b(every\s+weekend|weekends|each\s+weekend)\b/);
  if (weekendMatch) return { rule: 'weekly:6', cleanTitle: cleanTitle(input, weekendMatch[0]) };

  const biweeklyGeneric = text.match(/\b(every\s+2\s+weeks|every\s+two\s+weeks|fortnightly|every\s+other\s+week|bi-?weekly)\b/);
  if (biweeklyGeneric) {
    return { rule: `biweekly:${new Date().getDay()}`, cleanTitle: cleanTitle(input, biweeklyGeneric[0]) };
  }
  const biweeklyDayMatch = text.match(/\bevery\s+other\s+(sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)\b/);
  if (biweeklyDayMatch) {
    const key = biweeklyDayMatch[1].slice(0, 3) as keyof typeof NLP_DAY_MAP;
    if (NLP_DAY_MAP[key] !== undefined)
      return { rule: `biweekly:${NLP_DAY_MAP[key]}`, cleanTitle: cleanTitle(input, biweeklyDayMatch[0]) };
  }

  const weeklyMatch = text.match(/\b(every|each)\s+(sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)\b/);
  if (weeklyMatch) {
    const key = weeklyMatch[2].slice(0, 3) as keyof typeof NLP_DAY_MAP;
    if (NLP_DAY_MAP[key] !== undefined)
      return { rule: `weekly:${NLP_DAY_MAP[key]}`, cleanTitle: cleanTitle(input, weeklyMatch[0]) };
  }

  const monthlyOrdinalFwd = text.match(/\bevery\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (monthlyOrdinalFwd) {
    const day = parseInt(monthlyOrdinalFwd[1], 10);
    if (day >= 1 && day <= 28) return { rule: `monthly:${day}`, cleanTitle: cleanTitle(input, monthlyOrdinalFwd[0]) };
  }
  const monthlyOrdinalBwd = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+of\s+every\s+month\b/);
  if (monthlyOrdinalBwd) {
    const day = parseInt(monthlyOrdinalBwd[1], 10);
    if (day >= 1 && day <= 28) return { rule: `monthly:${day}`, cleanTitle: cleanTitle(input, monthlyOrdinalBwd[0]) };
  }

  const monthlyMatch = text.match(/\b(every\s+month|monthly|each\s+month)\b/);
  if (monthlyMatch) return { rule: 'monthly:1', cleanTitle: cleanTitle(input, monthlyMatch[0]) };

  return null;
}
