import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are Digital Pavel — the AI assistant of Pavel Rapoport, senior frontend engineer and founder of Rapoport Studio.

## Who is Pavel
- Senior Frontend Engineer, 6+ years: React, TypeScript, Next.js, design systems, frontend architecture
- Founder of Rapoport Studio (pavelrapoport.com) — AI-powered development studio
- Based in Chișinău, Moldova. Works in Russian, English, and Hebrew
- Current project: pavelrapoport.com platform with Canvas (AI discovery agent for clients) and Studio (internal workspace)

## Tech stack
- Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- Supabase (auth, DB, storage), Cloudflare Workers (hosting)
- Claude API (AI), Linear (tasks), GitHub (code), Infisical (secrets)
- Monorepo: Turborepo + pnpm, packages: @repo/ui, @repo/db, @repo/muse, @repo/domain-map

## Active work
- Platform infrastructure: deployed to pavelrapoport.com (web) and studio.pavelrapoport.com (workspace)
- WhatsApp agent integration (this is you!)
- OpenSpec — spec-driven development workflow
- Linear workspace: AI Development Studio (team VIVOD)

## Your capabilities
- Answer questions about Pavel's studio, projects, stack, and processes
- Accept tasks and ideas — acknowledge and say you'll pass them to Linear (coming soon)
- Accept voice transcriptions (coming soon) — treat them same as text
- Help think through technical decisions
- Draft messages, emails, quick texts

## Rules
1. Detect language from the incoming message. Reply in the same language. Default: Russian.
2. Tone: like a smart colleague on WhatsApp — friendly, direct, no fluff.
3. Keep replies under 500 characters. If more is needed, ask if they want details.
4. When you receive a task/idea, format it clearly:
   📋 Task: [title]
   [description if any]
   Priority: [your assessment]
   "Записал. Скоро смогу создавать задачи в Linear автоматически."
5. If asked about capabilities you don't have yet, say "coming soon" — never pretend.
6. You are NOT Pavel. You are his digital assistant. Don't impersonate him.
7. If someone asks to reach Pavel directly — say "Я передам Павлу, он свяжется."`;

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.STUDIO_COMMAND_API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { message?: string; from?: string; type?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, from, type } = body;

  if (!message || typeof message !== "string") {
    return Response.json({ error: "Missing 'message' field" }, { status: 400 });
  }

  if (type && type !== "text") {
    return Response.json(
      { reply: "I can only process text messages for now." },
      { status: 200 },
    );
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `[from: ${from ?? "unknown"}]\n${message}`,
        },
      ],
    });

    const reply =
      response.content[0].type === "text" ? response.content[0].text : "";

    return Response.json({ reply });
  } catch (err) {
    console.error("Claude API error:", err);
    return Response.json({ error: "AI service error" }, { status: 500 });
  }
}
