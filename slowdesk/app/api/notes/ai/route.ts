import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest } from 'next/server';

const PROMPTS = {
  summarize: (title: string, body: string) =>
    `Summarize this note in 3–5 concise sentences. Be direct, no fluff. Just the summary, nothing else.\n\nNote: "${title}"\n\n${body}`,

  extract: (title: string, body: string) =>
    `Extract every actionable task from this note. Return ONLY a markdown list — one task per line starting with "- ". No intro sentence, no outro, just the list. If there are no tasks, return "- No actionable tasks found."\n\nNote: "${title}"\n\n${body}`,

  ask: (title: string, body: string, question: string) =>
    `Answer this question about the note. Be concise and direct.\n\nNote: "${title}"\n\n${body}\n\nQuestion: ${question}`,
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { content, title, action, question } = await req.json();
  const body = (content || '').trim();
  const noteTitle = (title || 'Untitled').trim();

  if (!body && action !== 'ask') {
    return new Response(JSON.stringify({ error: 'Note has no content' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  let prompt: string;
  if (action === 'summarize') {
    prompt = PROMPTS.summarize(noteTitle, body);
  } else if (action === 'extract') {
    prompt = PROMPTS.extract(noteTitle, body);
  } else if (action === 'ask' && question?.trim()) {
    prompt = PROMPTS.ask(noteTitle, body, question.trim());
  } else {
    return new Response(JSON.stringify({ error: 'Invalid action or missing question' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

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
