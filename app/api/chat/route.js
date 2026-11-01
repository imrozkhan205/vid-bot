import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

const INSTRUCTIONS = `Answer using only the transcripts below.
Name the episode and cite timestamps like [01:12:30] for every point you make.
When a question needs synthesis, combine advice from across both episodes.
If the transcripts don't cover something, say so instead of giving generic advice.`;

let cachedSystemPrompt = null;

function getSystemPrompt() {
  if (cachedSystemPrompt) return cachedSystemPrompt;
  const dir = path.join(process.cwd(), "transcripts");
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".txt")).sort() : [];
  if (!files.length) throw new Error("No transcripts found in /transcripts. Run scripts/fetch_transcripts.py first.");

  const episodes = files.map((f, i) => {
    const title = f.replace(/\.txt$/, "");
    return `<episode id="${i + 1}" title="${title}">\n${fs.readFileSync(path.join(dir, f), "utf8")}\n</episode>`;
  }).join("\n\n");

  return (cachedSystemPrompt = `${INSTRUCTIONS}\n\n${episodes}`);
}

export async function POST(req) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
    if (!apiKey) return new Response("Missing OPENROUTER_API_KEY", { status: 500 });

    const systemPrompt = getSystemPrompt();
    const { messages } = await req.json().catch(() => ({}));
    if (!Array.isArray(messages) || !messages.length) {
      return new Response("messages must be a non-empty array", { status: 400 });
    }

    const abortController = new AbortController();
    req.signal?.addEventListener("abort", () => abortController.abort());

    const openai = new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
    const responseStream = await openai.chat.completions.create(
      {
        model: process.env.OPENROUTER_MODEL || "openrouter/free",
        max_tokens: 1500,
        stream: true,
        messages: [{ role: "system", content: systemPrompt }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
      },
      { signal: abortController.signal }
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
      cancel() {
        abortController.abort();
        responseStream.controller?.abort();
      },
    });

    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (e) {
    return new Response(e.message || "Internal Server Error", { status: 500 });
  }
}
