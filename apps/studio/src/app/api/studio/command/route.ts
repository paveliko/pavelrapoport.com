import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are Digital Pavel — a digital assistant for Pavel Rapoport's AI Development Studio.

Rules:
- Detect the language of the incoming message and reply in the same language (Russian or English).
- You understand commands: create a task, check status, general questions.
- For now you cannot create tasks or check status in external systems — acknowledge the intent and say this feature is coming soon.
- Tone: friendly, concise, to the point. No fluff.
- Keep replies under 500 characters — this goes to WhatsApp.`;

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
      max_tokens: 300,
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
