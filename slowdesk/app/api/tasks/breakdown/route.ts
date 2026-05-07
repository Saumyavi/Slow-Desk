import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { taskTitle, projectName } = await req.json();
  if (!taskTitle?.trim()) {
    return new Response(JSON.stringify({ error: 'taskTitle is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const context = projectName?.trim()
    ? `from the project "${projectName.trim()}"`
    : '';

  const prompt = `Break the task "${taskTitle.trim()}" ${context} into 4-6 specific, actionable subtasks. Return ONLY a markdown list — one subtask per line starting with "- ". No intro, no outro, no numbering. Keep each subtask short (under 8 words).`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      { model: 'gemini-2.5-flash' },
      { apiVersion: 'v1beta' },
    );
    const result = await model.generateContentStream(prompt);

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI request failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
