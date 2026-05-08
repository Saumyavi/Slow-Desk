import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { analyzeHabits, buildGeminiContext, HabitInput } from '@/lib/habit-analysis';

export async function POST(req: NextRequest) {
  const { habits }: { habits: HabitInput[] } = await req.json();

  if (!habits || habits.length === 0) {
    return NextResponse.json({ error: 'No habits provided' }, { status: 400 });
  }

  const result = analyzeHabits(habits);

  if (!result.hasEnoughData) {
    return NextResponse.json({ insights: [], hasEnoughData: false });
  }

  const context = buildGeminiContext(result);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ insights: buildFallbackInsights(result), hasEnoughData: true });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      { model: 'gemini-2.5-flash' },
      { apiVersion: 'v1beta' },
    );

    const prompt = `You are a sharp, personal habit coach who has studied this user's exact data. You speak like a trusted friend who has been watching their numbers — not a chatbot giving generic tips.

Here is their real habit data:
${context}

Generate exactly 3 insights as a JSON array of objects. Each object has:
- "type": one of "pattern", "win", or "nudge"
- "text": 1–2 sentences

Rules (breaking any of these makes the insight useless):
- Every sentence must cite a specific number, day name, streak count, or percentage directly from the data above
- "pattern" → a vulnerability or recurring gap: a day they consistently miss, a streak that breaks at a predictable length, or a decline
- "win" → something genuinely going well: a growing streak, a strong day-of-week, a habit pair that's clicking
- "nudge" → one concrete, specific thing they could do differently — grounded in the numbers, not generic advice
- Never write "consider", "might", "could try", or "habit stacking"
- If a habit wasn't done today and has a long current streak, that is urgent and worth flagging
- Write in second person ("You", "Your")
- Do NOT repeat the same habit in all 3 insights — spread across habits if there are multiple

Return ONLY valid JSON, no markdown, no explanation:
[{"type":"pattern","text":"..."},{"type":"win","text":"..."},{"type":"nudge","text":"..."}]`;

    const geminiResult = await model.generateContent(prompt);
    const raw = geminiResult.response.text().trim()
      .replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    const parsed: { type: string; text: string }[] = JSON.parse(raw);
    return NextResponse.json({ insights: parsed.slice(0, 3), hasEnoughData: true });
  } catch {
    return NextResponse.json({ insights: buildFallbackInsights(result), hasEnoughData: true });
  }
}

function buildFallbackInsights(result: ReturnType<typeof analyzeHabits>): { type: string; text: string }[] {
  const insights: { type: string; text: string }[] = [];

  for (const f of result.findings.slice(0, 2)) {
    if (f.bestDayRate - f.worstDayRate > 25) {
      insights.push({
        type: 'pattern',
        text: `Your ${f.emoji} ${f.name} completion drops to ${f.worstDayRate}% on ${f.worstDay}s vs ${f.bestDayRate}% on ${f.bestDay}s — a ${f.bestDayRate - f.worstDayRate}-point gap that repeats every week.`,
      });
    } else if (f.trendPct > 20) {
      insights.push({
        type: 'win',
        text: `${f.emoji} ${f.name} is up — ${f.current30} completions this month vs ${f.prev30} last month (+${f.trendPct}%). Your current streak is ${f.currentStreak} days.`,
      });
    } else if (f.trendPct < -20) {
      insights.push({
        type: 'nudge',
        text: `${f.emoji} ${f.name} dropped from ${f.prev30} to ${f.current30} completions month-over-month. Your average break is ${f.avgBreak} days — try restarting on a ${f.bestDay}.`,
      });
    }
  }

  const top = result.coOccurrence[0];
  if (top && top.rate >= 60) {
    insights.push({
      type: 'win',
      text: `${top.a} and ${top.b} happen on the same day ${top.rate}% of the time (${top.count} days). You've built a natural pair without trying.`,
    });
  }

  if (insights.length === 0 && result.findings.length > 0) {
    const f = result.findings[0];
    insights.push({
      type: 'win',
      text: `${f.emoji} ${f.name} has a ${f.longestStreak}-day best streak and you've averaged ${f.avgStreak} days before a break. Current streak: ${f.currentStreak} days.`,
    });
  }

  return insights.slice(0, 3);
}
