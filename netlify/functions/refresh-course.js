import { getStore } from "@netlify/blobs";

export const config = { path: "/api/refresh-course" };

const DEFAULT_TOOLS_KB = `TOOL LIBRARY — see onboard.js for full version`;

async function getToolsKB() {
  try {
    const store = getStore("knowledge-base");
    const kb = await store.get("tools-kb");
    if (kb) return kb;
  } catch {}
  return DEFAULT_TOOLS_KB;
}

async function callClaude(prompt, maxTokens) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

function parseJSON(raw, fallback) {
  try { return JSON.parse(raw); } catch {
    const m = raw.match(/[\[\{][\s\S]*[\]\}]/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    return fallback;
  }
}

function buildCtx(course) {
  const i = course.intake;
  if (i) {
    return `Business: ${i.business_name}
Owner: ${i.name}
Website: ${i.website || "not provided"}
Offer: ${i.offer}
Brand tone: ${Array.isArray(i.tone) ? i.tone.join(", ") : (i.tone || "professional")}
Tagline: ${i.tagline || "not provided"}
Ideal client: ${i.ideal_client}
Priority task to automate: ${i.priority_task}
Tools to build prompts for: ${i.tools_needed || "not specified"}
Off limits / never use AI for: ${i.off_limits || "none specified"}
Learning style: ${i.learning_style || "not specified"}
Extra notes: ${i.extra_notes || "none"}`.trim();
  }
  // Fallback for old courses: use brain prompt as context
  return `Business: ${course.business_name}
Owner: ${course.name}
Context (from Business Brain): ${course.brain}`.trim();
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response("", { status: 200 });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

  const { secret, courseId, what = "all" } = body;
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  if (!courseId) {
    return new Response(JSON.stringify({ error: "Missing courseId" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const store = getStore("courses");
  let course;
  try {
    course = await store.get(courseId, { type: "json" });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Blob error: " + e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  if (!course) {
    return new Response(JSON.stringify({ error: "Course not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  const ctx = buildCtx(course);
  const TOOLS_KB = await getToolsKB();
  const KB = `AI FLUENCY FRAMEWORK (4 D's): Delegation, Description, Discernment, Diligence.
PROMPTING FRAMEWORK: Role + Context + Task + Format + Constraints.
DEPARTMENT USE CASES: Marketing, Sales, HR, Operations, Customer Support, Finance/Legal.

${TOOLS_KB}`;

  const { name, business_name } = course;
  const regen = (s) => what === "all" || what === s || (Array.isArray(what) && what.includes(s));
  const updates = {};
  const regenerated = [];

  const tasks = [];

  if (regen("prompts")) {
    tasks.push(
      callClaude(`Create 10 copy-paste prompts for ${name} at ${business_name}. Each targets a different business function and includes [bracket fields] to fill in. Cover a diverse mix: (1) client intake or onboarding, (2) content creation or copywriting, (3) email sequence or follow-up, (4) social media post or campaign, (5) proposal or sales outreach, (6) customer service or FAQ response, (7) meeting summary or SOP, (8) research or competitive analysis, (9) hiring or HR task, (10) one wildcard specific to their exact offer and industry. Each prompt must be detailed and produce a real, usable result — not a generic template. Always include [bracket fields] for customization. Make every prompt specific to ${business_name}'s actual offer and industry.\n\nReturn ONLY valid JSON array:\n[{"title":"Short name 3-5 words","what":"One sentence: what specific result this prompt produces for ${business_name}","prompt":"Full detailed prompt with [bracket fields]"}]\n\n${ctx}\n\n${KB}`, 2800)
        .then(r => { updates.prompts = parseJSON(r, course.prompts); regenerated.push("prompts"); })
    );
  }

  if (regen("tools")) {
    tasks.push(
      callClaude(`Recommend exactly 6 AI tools for ${name} at ${business_name}. Use the TOOL ROUTING RULES and SELECTION RULES below to pick the best 6 tools for their specific situation. Be specific and opinionated.\n\nFor each tool: exact tool name, category, one sentence describing the specific use case for ${business_name}, and one power tip they can try today.\n\nReturn ONLY valid JSON array:\n[{"tool":"Perplexity","category":"Research","use":"Research competitor pricing.","tip":"Ask: Research [your industry] pain points."}]\n\n${ctx}\n\n${KB}`, 1000)
        .then(r => { updates.tools = parseJSON(r, course.tools); regenerated.push("tools"); })
    );
  }

  if (regen("study")) {
    tasks.push(
      callClaude(`Create interactive study materials for ${name} at ${business_name} to reinforce their AI course. No emojis.\n\n1. FLASHCARDS (18): AI vocabulary, business applications, tool names and best uses. Definitions under 20 words.\n2. QUIZ (6 questions): Scenario-based, 4 choices each, one correct (0-indexed). At least 2 questions about choosing the right AI tool.\n3. MATCH (8 pairs): Short terms paired with definitions (5-10 words). Include AI tool names.\n\nReturn ONLY valid JSON:\n{"flashcards":[{"term":"...","def":"..."}],"quiz":[{"q":"...","choices":["..."],"correct":0,"explain":"..."}],"match":[{"term":"...","def":"..."}]}\n\n${ctx}\n\n${KB}`, 3800)
        .then(r => { updates.study = parseJSON(r, course.study); regenerated.push("study"); })
    );
  }

  if (regen("brain")) {
    tasks.push(
      callClaude(`Create a reusable "Business Brain" system prompt for ${name} at ${business_name} to paste at the start of every Claude or ChatGPT session. Include: who the business is, what they offer, who they serve, brand voice/tone, and any hard limits. Make it practical and ready to copy. Start with: "You are an AI assistant for..."\n\n${ctx}`, 420)
        .then(r => { updates.brain = r; regenerated.push("brain"); })
    );
  }

  if (regen("map")) {
    tasks.push(
      callClaude(`Create a workflow map for ${name} at ${business_name} — what AI handles, what stays human, what to improve first. 4-5 items per column.\n\nReturn ONLY valid JSON:\n{"ai":["..."],"human":["..."],"improve":["..."]}\n\n${ctx}`, 500)
        .then(r => { updates.map = parseJSON(r, course.map); regenerated.push("map"); })
    );
  }

  if (regen("checklist")) {
    tasks.push(
      callClaude(`Write a first-steps checklist for ${name} at ${business_name} — 8 concrete actions to take this week to start using AI. Specific and actionable.\n\nReturn ONLY valid JSON array of strings:\n["Action 1","Action 2"]\n\n${ctx}`, 450)
        .then(r => { updates.checklist = parseJSON(r, course.checklist); regenerated.push("checklist"); })
    );
  }

  await Promise.all(tasks);

  const updated = { ...course, ...updates };
  try {
    await store.setJSON(courseId, updated);
  } catch (e) {
    return new Response(JSON.stringify({ error: "Failed to save: " + e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const siteUrl = process.env.SITE_URL || "https://sage-systems-ai.netlify.app";
  return new Response(JSON.stringify({
    ok: true,
    courseId,
    regenerated,
    courseUrl: `${siteUrl}/course?id=${courseId}`,
    business: business_name,
    usedIntake: !!course.intake,
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}
