import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { parseRecurrenceFromTitle, recurrenceLabel } from '@/lib/data';

export interface ParseRecurrenceResult {
  rule: string | null;
  label: string | null;
  cleanTitle: string;
}

export async function POST(req: NextRequest) {
  const { title }: { title: string } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json<ParseRecurrenceResult>({ rule: null, label: null, cleanTitle: title ?? '' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json<ParseRecurrenceResult>(regexFallback(title));
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      { model: 'gemini-2.5-flash' },
      { apiVersion: 'v1beta' },
    );

    const prompt = `Parse the recurrence rule from this task title.

Return a JSON object with exactly these fields:
- "rule": one of "daily", "weekly:N", "biweekly:N", "monthly:N", or null
- "label": short human-readable string ("Every Monday", "Every other Wednesday", "1st of every month", "Every day") or null
- "cleanTitle": the task title with the recurrence phrase removed and trimmed

Day numbers for weekly/biweekly: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
Monthly N is day of month 1–31.

Examples:
"take medication every day" → {"rule":"daily","label":"Every day","cleanTitle":"take medication"}
"team standup every tuesday" → {"rule":"weekly:2","label":"Every Tuesday","cleanTitle":"team standup"}
"gym every other wednesday" → {"rule":"biweekly:3","label":"Every other Wednesday","cleanTitle":"gym"}
"pay rent on the 1st" → {"rule":"monthly:1","label":"1st of every month","cleanTitle":"pay rent"}
"call mom every sunday" → {"rule":"weekly:0","label":"Every Sunday","cleanTitle":"call mom"}
"review finances on the 15th of each month" → {"rule":"monthly:15","label":"15th of every month","cleanTitle":"review finances"}
"daily journal" → {"rule":"daily","label":"Every day","cleanTitle":"daily journal"}
"fortnightly team sync on friday" → {"rule":"biweekly:5","label":"Every other Friday","cleanTitle":"team sync"}
"design review" → {"rule":null,"label":null,"cleanTitle":"design review"}
"buy groceries" → {"rule":null,"label":null,"cleanTitle":"buy groceries"}

Task title: "${title.replace(/"/g, '\\"')}"

Return ONLY valid JSON. No markdown, no explanation.`;

    const geminiResult = await model.generateContent(prompt);
    const raw = geminiResult.response.text().trim()
      .replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    const parsed = JSON.parse(raw);

    // Validate rule format
    const rule: string | null = parsed.rule ?? null;
    if (rule && !/^(daily|weekly:[0-6]|biweekly:[0-6]|monthly:([1-9]|[12]\d|3[01]))$/.test(rule)) {
      return NextResponse.json<ParseRecurrenceResult>(regexFallback(title));
    }

    return NextResponse.json<ParseRecurrenceResult>({
      rule,
      label: parsed.label ?? null,
      cleanTitle: parsed.cleanTitle ?? title,
    });
  } catch {
    return NextResponse.json<ParseRecurrenceResult>(regexFallback(title));
  }
}

function regexFallback(title: string): ParseRecurrenceResult {
  const parsed = parseRecurrenceFromTitle(title);
  if (!parsed) return { rule: null, label: null, cleanTitle: title };
  return { rule: parsed.rule, label: recurrenceLabel(parsed.rule), cleanTitle: parsed.cleanTitle };
}
