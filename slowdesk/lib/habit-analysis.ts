export interface HabitInput {
  name: string;
  emoji: string;
  history: string[]; // YYYY-MM-DD
}

export interface HabitFindings {
  name: string;
  emoji: string;
  totalDays: number;     // history entries in last 90 days
  bestDay: string;       // e.g. "Monday"
  bestDayRate: number;   // 0–1
  worstDay: string;
  worstDayRate: number;
  avgStreak: number;
  longestStreak: number;
  current30: number;     // completions in last 30 days
  prev30: number;        // completions in days 31-60 ago
  trendPct: number;      // % change (positive = improving)
}

export interface CoOccurrence {
  a: string;
  b: string;
  rate: number;  // Jaccard similarity
  count: number; // days both were done
}

export interface AnalysisResult {
  findings: HabitFindings[];
  coOccurrence: CoOccurrence[];
  totalDataDays: number;
  hasEnoughData: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function analyzeSingleHabit(habit: HabitInput): HabitFindings {
  const histSet = new Set(habit.history);

  // Day-of-week rates over last 90 days
  const counts = new Array(7).fill(0);
  const totals = new Array(7).fill(0);
  let current30 = 0;
  let prev30    = 0;

  for (let i = 0; i < 90; i++) {
    const d = new Date(Date.now() - i * 86400000);
    const day = d.getDay();
    totals[day]++;
    if (histSet.has(toDateStr(d))) {
      counts[day]++;
      if (i < 30)      current30++;
      else if (i < 60) prev30++;
    }
  }

  const rates = counts.map((c, i) => (totals[i] > 0 ? c / totals[i] : 0));
  const nonZeroRates = rates.filter(r => r > 0);
  const maxRate = Math.max(...rates);
  const minRate = nonZeroRates.length > 0 ? Math.min(...nonZeroRates) : 0;

  const bestDayIdx  = rates.indexOf(maxRate);
  const worstDayIdx = nonZeroRates.length > 0 ? rates.indexOf(minRate) : bestDayIdx;

  // Streak analysis over last 180 days
  const streaks: number[] = [];
  let current = 0;
  for (let i = 0; i < 180; i++) {
    const d = new Date(Date.now() - i * 86400000);
    if (histSet.has(toDateStr(d))) {
      current++;
    } else if (current > 0) {
      streaks.push(current);
      current = 0;
    }
  }
  if (current > 0) streaks.push(current);

  const avgStreak     = streaks.length > 0 ? streaks.reduce((a, b) => a + b, 0) / streaks.length : 0;
  const longestStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
  const trendPct      = prev30 > 0 ? Math.round(((current30 - prev30) / prev30) * 100) : 0;

  return {
    name:          habit.name,
    emoji:         habit.emoji,
    totalDays:     habit.history.length,
    bestDay:       DAYS[bestDayIdx],
    bestDayRate:   Math.round(maxRate * 100),
    worstDay:      DAYS[worstDayIdx],
    worstDayRate:  Math.round(minRate * 100),
    avgStreak:     Math.round(avgStreak * 10) / 10,
    longestStreak,
    current30,
    prev30,
    trendPct,
  };
}

function analyzeCoOccurrence(habits: HabitInput[]): CoOccurrence[] {
  const results: CoOccurrence[] = [];

  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const setA   = new Set(habits[i].history);
      const setB   = new Set(habits[j].history);
      const both   = habits[i].history.filter(d => setB.has(d)).length;
      const either = new Set([...habits[i].history, ...habits[j].history]).size;

      if (either >= 10 && both >= 5) {
        results.push({
          a:     habits[i].name,
          b:     habits[j].name,
          rate:  Math.round((both / either) * 100),
          count: both,
        });
      }
    }
  }

  return results.sort((a, b) => b.rate - a.rate).slice(0, 3);
}

export function analyzeHabits(habits: HabitInput[]): AnalysisResult {
  const totalDataDays = habits.reduce((sum, h) => sum + h.history.length, 0);
  const hasEnoughData = totalDataDays >= 14 && habits.length >= 1;

  return {
    findings:       habits.map(analyzeSingleHabit),
    coOccurrence:   habits.length >= 2 ? analyzeCoOccurrence(habits) : [],
    totalDataDays,
    hasEnoughData,
  };
}

export function buildGeminiContext(result: AnalysisResult): string {
  const lines: string[] = [];

  for (const f of result.findings) {
    lines.push(`Habit: ${f.emoji} ${f.name}`);
    lines.push(`  Completions last 30 days: ${f.current30}/30 (prev 30 days: ${f.prev30}/30, trend: ${f.trendPct > 0 ? '+' : ''}${f.trendPct}%)`);
    lines.push(`  Best day of week: ${f.bestDay} (${f.bestDayRate}% completion rate)`);
    if (f.bestDayRate - f.worstDayRate > 20) {
      lines.push(`  Worst day: ${f.worstDay} (${f.worstDayRate}% completion rate)`);
    }
    lines.push(`  Average streak: ${f.avgStreak} days · Longest: ${f.longestStreak} days`);
  }

  if (result.coOccurrence.length > 0) {
    lines.push('Co-occurrence (done on same day):');
    for (const co of result.coOccurrence) {
      lines.push(`  ${co.a} + ${co.b}: ${co.rate}% of days (${co.count} times)`);
    }
  }

  return lines.join('\n');
}
