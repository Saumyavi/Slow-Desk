import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
  }

  const { transcript, today } = await req.json();
  if (!transcript?.trim()) {
    return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
  }

  const prompt = `Today is ${today}. A user spoke this task aloud: "${transcript.trim()}"

Extract structured task data and return ONLY a valid JSON object with exactly these fields:
{
  "title": "core action, clean and concise, no date/time/reminder phrases",
  "due": one of exactly: "today" | "tomorrow" | "this week" | "next week" | "someday",
  "time": time in "H:MM AM" or "H:MM PM" format, or "—" if not mentioned,
  "priority": one of exactly: "high" | "medium" | "low",
  "project": category or project name if mentioned, else ""
}

Mapping rules:
- due: today/tonight/now → "today"; tomorrow → "tomorrow"; this week/by [weekday within 7 days] → "this week"; next week/next [weekday] → "next week"; no date or vague → "someday"
- priority: urgent/important/asap/critical/must → "high"; soon/by specific day/deadline → "medium"; default → "low"
- title: keep only the task action, remove all scheduling/reminder text
- No markdown code fences, no explanation — just the raw JSON object.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      { model: 'gemini-2.5-flash' },
      { apiVersion: 'v1beta' },
    );
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonStr);

    const validDue = ['today', 'tomorrow', 'this week', 'next week', 'someday'] as const;
    const validPriority = ['high', 'medium', 'low'] as const;

    return NextResponse.json({
      title: String(parsed.title || transcript).trim(),
      due: validDue.includes(parsed.due) ? parsed.due : 'this week',
      time: String(parsed.time || '—').trim(),
      priority: validPriority.includes(parsed.priority) ? parsed.priority : 'medium',
      project: String(parsed.project || '').trim(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI parsing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
