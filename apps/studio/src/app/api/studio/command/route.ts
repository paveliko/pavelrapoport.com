import Anthropic from "@anthropic-ai/sdk";
import { LinearClient } from "@linear/sdk";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const LINEAR_TEAM_ID = "ffb2de5f-f0b7-476f-ad46-979be7844800";
const LINEAR_PROJECT_ID = "92833011-b74b-4d36-bee6-8423517a53d0";

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
- Create tasks in Linear when asked
- Accept voice transcriptions (coming soon) — treat them same as text
- Help think through technical decisions
- Draft messages, emails, quick texts

## Response format
You MUST always respond with valid JSON only. No text before or after the JSON.
IMPORTANT: Return raw JSON only. No markdown, no code fences, no backticks, no explanation before or after.

When the user wants to create a task, respond ONLY with:
{"action": "create_task", "title": "...", "description": "...", "priority": 1, "reply": "человекочитаемый ответ"}

Priority scale: 1=urgent, 2=high, 3=medium, 4=low

For all other messages, respond ONLY with:
{"action": "reply", "reply": "твой ответ"}

## Rules
1. Detect language from the incoming message. Reply in the same language. Default: Russian.
2. Tone: like a smart colleague on WhatsApp — friendly, direct, no fluff.
3. Keep replies under 500 characters. If more is needed, ask if they want details.
4. When creating a task, set the "reply" field to a short confirmation like "Создаю задачу: [title]".
5. If asked about capabilities you don't have yet, say "coming soon" — never pretend.
6. You are NOT Pavel. You are his digital assistant. Don't impersonate him.
7. If someone asks to reach Pavel directly — say "Я передам Павлу, он свяжется."`;

interface CreateTaskAction {
  action: "create_task";
  title: string;
  description?: string;
  priority?: number;
  reply: string;
}

interface ReplyAction {
  action: "reply";
  reply: string;
}

type AgentResponse = CreateTaskAction | ReplyAction;

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  const { env: cfEnv } = await getCloudflareContext();
  if (apiKey !== (cfEnv as Record<string, unknown>).STUDIO_COMMAND_API_KEY) {
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

  const client = new Anthropic({ apiKey: (cfEnv as Record<string, unknown>).ANTHROPIC_API_KEY as string });

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

    const rawReply =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Strip markdown code fences if present
    const cleanReply = rawReply
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    let parsed: AgentResponse;
    try {
      parsed = JSON.parse(cleanReply);
    } catch {
      return Response.json({ reply: rawReply });
    }

    if (parsed.action === "create_task") {
      const linear = new LinearClient({
        apiKey: (cfEnv as Record<string, unknown>).LINEAR_API_KEY as string,
      });

      const issuePayload = await linear.createIssue({
        teamId: LINEAR_TEAM_ID,
        title: parsed.title,
        description: parsed.description,
        priority: parsed.priority,
        projectId: LINEAR_PROJECT_ID,
      });

      const issue = await issuePayload.issue;

      return Response.json({
        reply: `✅ ${issue?.identifier}: ${parsed.title}`,
      });
    }

    return Response.json({ reply: parsed.reply });
  } catch (err) {
    console.error("Claude API error:", err);
    return Response.json({ error: "AI service error" }, { status: 500 });
  }
}
