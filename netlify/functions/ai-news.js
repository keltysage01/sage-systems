import { getStore } from "@netlify/blobs";

export const config = { path: "/api/ai-news" };

function parseJSON(raw, fallback) {
  try { return JSON.parse(raw); } catch {
    const m = raw.match(/\[[\s\S]*\]/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    return fallback;
  }
}

async function callPerplexity(prompt) {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1400,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1400,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

export default async function handler(req) {
  const url = new URL(req.url);
  const courseId = url.searchParams.get("id");
  const force = url.searchParams.get("refresh") === "1";
  if (!courseId) return new Response("Missing id", { status: 400 });

  const coursesStore = getStore("courses");
  let course;
  try {
    course = await coursesStore.get(courseId, { type: "json" });
  } catch (e) {
    return new Response("Error loading course", { status: 500 });
  }
  if (!course) return new Response("Course not found", { status: 404 });

  const { business_name, offer, ideal_client } = course;
  const businessSlug = (offer || business_name)
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 44);
  const cacheKey = `news-${businessSlug}`;
  const newsStore = getStore("knowledge-base");

  // Serve cache if fresh (< 20 hours) and not force-refreshed
  if (!force) {
    try {
      const cached = await newsStore.get(cacheKey, { type: "json" });
      if (cached?.generated_at && (Date.now() - cached.generated_at) < 20 * 3600 * 1000) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch {}
  }

  const prompt = `You are an AI intelligence analyst briefing a business owner on what's new in AI this week.

Business context:
- Business: ${business_name}
- What they do: ${offer}
- Who they serve: ${ideal_client || "their clients"}

Find 5 real, specific AI tools, product launches, feature updates, or practical developments from the past 7-10 days that would directly help this specific type of business. Focus on tools that are actually available and usable today — not vague trends or concepts.

For each item:
- tool: exact product/tool name (e.g. "Claude", "Perplexity", "Canva", "Zapier")
- headline: one punchy line about what's new (under 12 words)
- why: 1-2 sentences explaining why this matters specifically for ${business_name}'s type of business. Be specific — reference their industry/clients.
- action: one thing they can do TODAY. Start with a verb. Be concrete.
- tag: one of "New Tool", "Major Update", "New Feature", "Tip", "Free"

Return ONLY a valid JSON array. No markdown, no preamble:
[{"tool":"...","headline":"...","why":"...","action":"...","tag":"..."}]

Mix the tags. Include at least one free option. Make the "why" specific to their business, not generic.`;

  let raw = "";
  try {
    if (process.env.PERPLEXITY_API_KEY) {
      raw = await callPerplexity(prompt);
    } else {
      raw = await callClaude(prompt);
    }
  } catch (e) {
    console.error("AI news fetch error:", e.message);
  }

  let items = parseJSON(raw, []);

  // Fallback content if generation failed
  if (!items.length) {
    items = [
      { tool: "Claude Projects", headline: "Save your Business Brain once, use it forever", why: `Set up a Claude Project for ${business_name} so every session starts with full context — no re-explaining needed.`, action: "Open Claude → click Projects → create one for your business → paste your Business Brain as the system prompt", tag: "Free" },
      { tool: "Perplexity AI", headline: "Real-time research with cited sources", why: "Research competitors, industry trends, or client questions with live web results and citations — much more reliable than ChatGPT for current info.", action: "Go to perplexity.ai → search for your top competitor and ask 'What are customers saying about [competitor]?'", tag: "Free" },
      { tool: "NotebookLM", headline: "Ask questions about your own documents", why: "Upload your SOPs, client contracts, or training materials and have AI answer questions about them instantly.", action: "Go to notebooklm.google.com → upload any business document → ask it to summarize the key points", tag: "Free" },
    ];
  }

  const result = { items, generated_at: Date.now(), business_type: offer || business_name };

  try {
    await newsStore.setJSON(cacheKey, result);
  } catch {}

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
