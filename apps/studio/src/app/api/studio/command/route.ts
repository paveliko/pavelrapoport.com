import Anthropic from "@anthropic-ai/sdk";
import { LinearClient } from "@linear/sdk";
import { createClient } from "@supabase/supabase-js";
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
- Read and list tasks from Linear (by status filter or specific task lookup)
- Accept voice transcriptions (coming soon) — treat them same as text
- Help think through technical decisions
- Draft messages, emails, quick texts

## Response format
You MUST always respond with valid JSON only. No text before or after the JSON.
IMPORTANT: Return raw JSON only. No markdown, no code fences, no backticks, no explanation before or after.

When the user wants to create a task, respond ONLY with:
{"action": "create_task", "title": "...", "description": "...", "priority": 1, "reply": "человекочитаемый ответ"}

Priority scale: 1=urgent, 2=high, 3=medium, 4=low

When the user wants to see a list of tasks, respond ONLY with:
{"action": "read_tasks", "filter": "all|in_progress|todo|backlog|completed_today", "reply": "Показываю задачи..."}

Filters:
- "all" — all active tasks (not completed, not cancelled)
- "in_progress" — tasks currently being worked on
- "todo" — tasks in the todo state
- "backlog" — tasks in the backlog
- "completed_today" — tasks completed in the last 24 hours

When the user asks about a specific task (by identifier like "AI-36" or by keywords), respond ONLY with:
{"action": "get_task_status", "identifier": "AI-36", "reply": "Ищу задачу AI-36..."}
or
{"action": "get_task_status", "keywords": "whatsapp интеграция", "reply": "Ищу задачу..."}
Provide either "identifier" or "keywords", not both.

For all other messages, respond ONLY with:
{"action": "reply", "reply": "твой ответ"}

## Rules
1. Detect language from the incoming message. Reply in the same language. Default: Russian.
2. Tone: like a smart colleague on WhatsApp — friendly, direct, no fluff.
3. Keep replies under 500 characters. If more is needed, ask if they want details.
4. When creating a task, set the "reply" field to a short confirmation like "Создаю задачу: [title]".
5. If asked about capabilities you don't have yet, say "coming soon" — never pretend.
6. You are NOT Pavel. You are his digital assistant. Don't impersonate him.
7. If someone asks to reach Pavel directly — say "Я передам Павлу, он свяжется."
8. When you need current information (news, prices, weather, docs), use web_search. Keep final reply under 500 chars for WhatsApp. Include source URL when relevant.

## Conversation style
- Ask clarifying questions when the request is ambiguous.
  Example: user says "создай задачу" without details →
  ask "Какое название задачи и приоритет?"
- Use follow-up questions naturally, like a real assistant.
- You have conversation history — reference previous messages when relevant.
- Format for WhatsApp: *bold* for emphasis (single asterisk),
  _italic_ for subtle emphasis, lists with - or numbers.
  No markdown headers (#), no double asterisks (**).
  Keep it clean and readable on a phone screen.`;

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

interface ReadTasksAction {
  action: "read_tasks";
  filter: "all" | "in_progress" | "todo" | "backlog" | "completed_today";
  reply: string;
}

interface GetTaskStatusAction {
  action: "get_task_status";
  identifier?: string;
  keywords?: string;
  reply: string;
}

type AgentResponse =
  | CreateTaskAction
  | ReplyAction
  | ReadTasksAction
  | GetTaskStatusAction;

function formatTaskList(
  issues: Array<{ identifier: string; title: string; stateName: string }>,
  totalCount: number,
): string {
  if (issues.length === 0) return "Нет задач по этому фильтру";
  const lines = issues.map(
    (i) => `• ${i.identifier}: ${i.title} [${i.stateName}]`,
  );
  let result = lines.join("\n");
  if (totalCount > issues.length) {
    result += `\n\n...и ещё ${totalCount - issues.length}`;
  }
  if (result.length > 480) {
    result = result.substring(0, 477) + "...";
  }
  return result;
}

function formatTaskDetail(issue: {
  identifier: string;
  title: string;
  stateName: string;
  priority: number;
  assigneeName: string | null;
  updatedAt: string;
}): string {
  const priorityLabels: Record<number, string> = {
    0: "Нет",
    1: "Срочный",
    2: "Высокий",
    3: "Средний",
    4: "Низкий",
  };
  return [
    `${issue.identifier}: ${issue.title}`,
    `Статус: ${issue.stateName}`,
    `Приоритет: ${priorityLabels[issue.priority] ?? "Неизвестно"}`,
    `Исполнитель: ${issue.assigneeName ?? "Не назначен"}`,
    `Обновлено: ${new Date(issue.updatedAt).toLocaleDateString("ru-RU")}`,
  ].join("\n");
}

function extractJsonEnvelope(text: string): unknown | null {
  const stripped = text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    // fall through to brace scan
  }

  for (let end = stripped.lastIndexOf("}"); end !== -1; end = stripped.lastIndexOf("}", end - 1)) {
    let depth = 0;
    for (let i = end; i >= 0; i--) {
      const ch = stripped[i];
      if (ch === "}") depth++;
      else if (ch === "{") {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(stripped.slice(i, end + 1));
          } catch {
            break;
          }
        }
      }
    }
  }

  return null;
}

function markdownToWhatsApp(text: string): string {
  return text
    .replace(/^###\s+(.+)$/gm, "*$1*")
    .replace(/^##\s+(.+)$/gm, "*$1*")
    .replace(/^#\s+(.+)$/gm, "*$1*")
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/~~(.+?)~~/g, "~$1~")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/\*\*/g, "*");
}

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  const { env: cfEnv } = await getCloudflareContext();
  if (apiKey !== (cfEnv as Record<string, unknown>).STUDIO_COMMAND_API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    (cfEnv as Record<string, unknown>).SUPABASE_URL as string,
    (cfEnv as Record<string, unknown>).SUPABASE_SERVICE_ROLE_KEY as string,
  );

  let body: {
    message?: string;
    from?: string;
    type?: string;
    wa_message_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, from, type, wa_message_id } = body;

  if (!message || typeof message !== "string") {
    return Response.json({ error: "Missing 'message' field" }, { status: 400 });
  }

  if (type && type !== "text") {
    return Response.json(
      { reply: "I can only process text messages for now." },
      { status: 200 },
    );
  }

  const phoneNumber = from ?? "unknown";

  // Deduplication: if wa_message_id already processed, return cached reply
  if (wa_message_id) {
    const { data: existing } = await supabase
      .from("whatsapp_messages")
      .select("id, phone_number, created_at")
      .eq("wa_message_id", wa_message_id)
      .eq("direction", "incoming")
      .maybeSingle();

    if (existing) {
      const { data: cachedReply } = await supabase
        .from("whatsapp_messages")
        .select("content")
        .eq("phone_number", existing.phone_number)
        .eq("direction", "outgoing")
        .gt("created_at", existing.created_at)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      return Response.json({
        reply: cachedReply?.content ?? "Message already processed.",
      });
    }
  }

  // Save incoming message
  await supabase.from("whatsapp_messages").insert({
    phone_number: phoneNumber,
    direction: "incoming",
    message_type: type ?? "text",
    content: message,
    wa_message_id: wa_message_id ?? null,
  });

  // Load conversation history (last 10 messages)
  const { data: history } = await supabase
    .from("whatsapp_messages")
    .select("direction, content")
    .eq("phone_number", phoneNumber)
    .order("created_at", { ascending: false })
    .limit(10);

  const historyMessages = (history ?? [])
    .reverse()
    .map((msg) => ({
      role:
        msg.direction === "incoming"
          ? ("user" as const)
          : ("assistant" as const),
      content: msg.content,
    }));

  // Add [from:] context to the latest user message
  if (historyMessages.length > 0) {
    const last = historyMessages[historyMessages.length - 1];
    if (last.role === "user") {
      last.content = `[from: ${phoneNumber}]\n${last.content}`;
    }
  }

  const client = new Anthropic({
    apiKey: (cfEnv as Record<string, unknown>).ANTHROPIC_API_KEY as string,
  });

  const startTime = Date.now();

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages:
        historyMessages.length > 0
          ? historyMessages
          : [
              {
                role: "user" as const,
                content: `[from: ${phoneNumber}]\n${message}`,
              },
            ],
    });

    const latencyMs = Date.now() - startTime;
    const tokensUsed =
      (response.usage.input_tokens ?? 0) +
      (response.usage.output_tokens ?? 0);

    const rawReply = response.content
      .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .replace(/<\/?cite[^>]*>/g, "")
      .trim();

    const usedWebSearch = response.content.some(
      (b) => b.type === "server_tool_use" || b.type === "web_search_tool_result",
    );

    const envelope = extractJsonEnvelope(rawReply);
    let parsed: AgentResponse;
    if (envelope !== null) {
      parsed = envelope as AgentResponse;
    } else {
      const waReply = markdownToWhatsApp(rawReply);
      // Save raw reply as outgoing
      await supabase.from("whatsapp_messages").insert({
        phone_number: phoneNumber,
        direction: "outgoing",
        message_type: "text",
        content: waReply,
        agent_action: usedWebSearch ? "web_search" : "raw_reply",
        agent_metadata: usedWebSearch ? { used_web_search: true } : null,
        tokens_used: tokensUsed,
        latency_ms: latencyMs,
      });
      return Response.json({ reply: waReply });
    }

    let replyText: string;
    let agentAction: string;
    let agentMetadata: Record<string, unknown> | null = null;

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

      replyText = `✅ ${issue?.identifier}: ${parsed.title}`;
      agentAction = "create_task";
      agentMetadata = {
        title: parsed.title,
        description: parsed.description,
        priority: parsed.priority,
        linear_issue_id: issue?.identifier,
      };
    } else if (parsed.action === "read_tasks") {
      const linear = new LinearClient({
        apiKey: (cfEnv as Record<string, unknown>).LINEAR_API_KEY as string,
      });

      const stateFilter: Record<string, unknown> = {};
      const issueFilter: Record<string, unknown> = {
        team: { id: { eq: LINEAR_TEAM_ID } },
      };

      switch (parsed.filter) {
        case "in_progress":
          stateFilter.name = { eq: "In Progress" };
          break;
        case "todo":
          stateFilter.name = { eq: "Todo" };
          break;
        case "backlog":
          stateFilter.name = { eq: "Backlog" };
          break;
        case "completed_today":
          stateFilter.type = { eq: "completed" };
          issueFilter.completedAt = {
            gte: new Date(Date.now() - 86400000).toISOString(),
          };
          break;
        default:
          // "all" — exclude completed and canceled
          stateFilter.type = { nin: ["completed", "canceled"] };
          break;
      }

      if (Object.keys(stateFilter).length > 0) {
        issueFilter.state = stateFilter;
      }

      const issueConnection = await linear.issues({
        filter: issueFilter,
        first: 10,
      });

      const issues = issueConnection.nodes;
      const issuesFormatted = await Promise.all(
        issues.map(async (issue) => ({
          identifier: issue.identifier,
          title: issue.title,
          stateName: (await issue.state)?.name ?? "Unknown",
        })),
      );

      replyText = formatTaskList(issuesFormatted, issues.length);
      agentAction = "read_tasks";
      agentMetadata = { filter: parsed.filter, count: issues.length };
    } else if (parsed.action === "get_task_status") {
      const linear = new LinearClient({
        apiKey: (cfEnv as Record<string, unknown>).LINEAR_API_KEY as string,
      });

      let foundIssue = null;

      if (parsed.identifier) {
        const issueNumber = parseInt(parsed.identifier.replace(/\D/g, ""), 10);
        const results = await linear.issues({
          filter: {
            team: { id: { eq: LINEAR_TEAM_ID } },
            number: { eq: issueNumber },
          },
          first: 1,
        });
        foundIssue = results.nodes[0] ?? null;
      } else if (parsed.keywords) {
        const results = await linear.issues({
          filter: {
            team: { id: { eq: LINEAR_TEAM_ID } },
            or: [
              { title: { contains: parsed.keywords } },
              { description: { contains: parsed.keywords } },
            ],
          },
          first: 5,
        });
        foundIssue = results.nodes[0] ?? null;
      }

      if (foundIssue) {
        const state = await foundIssue.state;
        const assignee = await foundIssue.assignee;
        replyText = formatTaskDetail({
          identifier: foundIssue.identifier,
          title: foundIssue.title,
          stateName: state?.name ?? "Unknown",
          priority: foundIssue.priority,
          assigneeName: assignee?.name ?? null,
          updatedAt: foundIssue.updatedAt.toISOString(),
        });
        agentAction = "get_task_status";
        agentMetadata = { identifier: foundIssue.identifier };
      } else {
        replyText = "Задача не найдена";
        agentAction = "get_task_status";
        agentMetadata = {
          identifier: parsed.identifier ?? null,
          keywords: parsed.keywords ?? null,
        };
      }
    } else {
      replyText = parsed.reply;
      agentAction = usedWebSearch ? "web_search" : "reply";
      if (usedWebSearch) {
        agentMetadata = { used_web_search: true };
      }
    }

    replyText = markdownToWhatsApp(replyText);

    // Save outgoing message
    await supabase.from("whatsapp_messages").insert({
      phone_number: phoneNumber,
      direction: "outgoing",
      message_type: "text",
      content: replyText,
      agent_action: agentAction,
      agent_metadata: agentMetadata,
      tokens_used: tokensUsed,
      latency_ms: latencyMs,
    });

    return Response.json({ reply: replyText });
  } catch (err) {
    console.error("Claude API error:", err);
    return Response.json({ error: "AI service error" }, { status: 500 });
  }
}
