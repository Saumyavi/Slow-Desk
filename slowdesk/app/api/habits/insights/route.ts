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
    return NextResponse.json({
      insights: [],
      hasEnoughData: false,
    });
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

    const prompt = `You are a habit coach analyzing a user's tracking data. Based on the data below, generate 2-3 short, specific insights.

${context}

Rules:
- Each insight must reference exact numbers or day names from the data
- Keep each under 2 sentences — direct, warm, specific
- Notice real patterns: day-of-week gaps, trends, habits that go together, streak fragility
- Do NOT give generic productivity advice — every sentence must be grounded in the numbers
- Return ONLY a valid JSON array of strings, no markdown, no explanation:
["insight one", "insight two", "insight three"]`;

    const geminiResult = await model.generateContent(prompt);
    const raw = geminiResult.response.text().trim()
      .replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    const parsed: string[] = JSON.parse(raw);
    return NextResponse.json({ insights: parsed.slice(0, 3), hasEnoughData: true });
  } catch {
    return NextResponse.json({ insights: buildFallbackInsights(result), hasEnoughData: true });
  }
}

function buildFallbackInsights(result: ReturnType<typeof analyzeHabits>): string[] {
  const insights: string[] = [];

  for (const f of result.findings.slice(0, 2)) {
    if (f.bestDayRate - f.worstDayRate > 25) {
      insights.push(
        `${f.emoji} ${f.name} completion is highest on ${f.bestDay}s (${f.bestDayRate}%) and lowest on ${f.worstDay}s (${f.worstDayRate}%) — consider a lighter version for ${f.worstDay}s.`,
      );
    } else if (f.trendPct > 20) {
      insights.push(
        `${f.emoji} ${f.name} is trending up — ${f.current30} completions this month vs ${f.prev30} last month. Keep the momentum going.`,
      );
    } else if (f.trendPct < -20) {
      insights.push(
        `${f.emoji} ${f.name} dipped this month (${f.current30} vs ${f.prev30} last month). Smaller, easier versions of the habit can help rebuild consistency.`,
      );
    }
  }

  const top = result.coOccurrence[0];
  if (top && top.rate >= 60) {
    insights.push(
      `${top.a} and ${top.b} happen together ${top.rate}% of the time — you've already built a natural habit bundle.`,
    );
  }

  if (insights.length === 0 && result.findings.length > 0) {
    const f = result.findings[0];
    insights.push(
      `${f.emoji} ${f.name} has a ${f.longestStreak}-day best streak and averages ${f.avgStreak} days before a break. You're building a solid foundation.`,
    );
  }

  return insights.slice(0, 3);
}
