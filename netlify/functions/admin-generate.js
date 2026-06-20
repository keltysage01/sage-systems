// Temporary one-use admin endpoint — delete after Alex's course is generated
import { getStore } from "@netlify/blobs";
import { randomBytes } from "crypto";

export const config = { path: "/api/admin-generate" };

function escHtml(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function genId() { return randomBytes(24).toString("base64url"); }

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
    const match = raw.match(/[\[\{][\s\S]*[\]\}]/);
    if (match) { try { return JSON.parse(match[0]); } catch {} }
    return fallback;
  }
}

export default async function handler(req) {
  // Must be POST with correct admin secret
  const secret = process.env.ADMIN_SECRET;
  const url = new URL(req.url);
  const tempId = url.searchParams.get("tempId");
  const provided = url.searchParams.get("secret");

  if (!secret || provided !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!tempId) {
    return new Response("Missing tempId", { status: 400 });
  }

  const pendingStore = getStore("pending-intakes");
  const intake = await pendingStore.get(tempId, { type: "json" });
  if (!intake) {
    return new Response("Intake not found", { status: 404 });
  }

  const { name, email, business_name, website, tagline, brand_voice, industry,
    tools, other_tools, time_sinks, dreaded_tasks, workflows, sensitive_data, privacy_notes } = intake;

  const offer = tagline || "";
  const tone = Array.isArray(brand_voice) ? brand_voice.join(", ") : (brand_voice || "");
  const tools_needed = [...(tools || []), other_tools].filter(Boolean).join(", ");
  const priority_task = [time_sinks, dreaded_tasks].filter(Boolean).join("; ");
  const off_limits = [...(sensitive_data || []), privacy_notes].filter(Boolean).join(", ");

  const ctx = `
Business: ${business_name}${industry ? ` (${industry})` : ""}
Owner: ${name}
Website: ${website || "not provided"}
Offer: ${offer}
Brand tone: ${tone || "not specified"}
Priority task to automate: ${priority_task}
Tools to build prompts for: ${tools_needed || "not specified"}
Workflows: ${Array.isArray(workflows) ? workflows.join(", ") : ""}
Off limits / never use AI for: ${off_limits || "none specified"}
  `.trim();

  const courseId = genId();
  const siteUrl = process.env.SITE_URL || "https://sage-systems-ai.netlify.app";
  const courseUrl = `${siteUrl}/course?id=${courseId}`;

  const [welcomeRaw, brainRaw, promptsRaw, toolsRaw, mapRaw, rulesRaw, checklistRaw] = await Promise.all([
    callClaude(`Write a course intro for ${name} at ${business_name}. Return ONLY a JSON array of 4-5 short bullet points. No emojis. First item: their single biggest AI opportunity stated directly. Next 2-3: specific things they will learn or have after this course. Last: one short motivating sentence.\n\n${ctx}`, 400),
    callClaude(`Create a reusable "Business Brain" system prompt for ${name} at ${business_name}. Start with: "You are an AI assistant for..."\n\n${ctx}`, 420),
    callClaude(`Create 10 copy-paste prompts for ${name} at ${business_name}. Return ONLY valid JSON array:\n[{"title":"Short name","what":"One sentence result","prompt":"Full prompt with [bracket fields]"}]\n\n${ctx}`, 2800),
    callClaude(`Recommend exactly 6 AI tools for ${name} at ${business_name}. Return ONLY valid JSON array:\n[{"tool":"Name","category":"Cat","use":"Use case.","tip":"Power tip."}]\n\n${ctx}`, 1000),
    callClaude(`Create a workflow map for ${name} at ${business_name}. Return ONLY valid JSON:\n{"ai":["..."],"human":["..."],"improve":["..."]}\n\n${ctx}`, 500),
    callClaude(`Write 5 privacy rules for ${name} at ${business_name}. Return ONLY valid JSON array of strings.\n\n${ctx}`, 300),
    callClaude(`Write a first-steps checklist for ${name} at ${business_name} — 8 concrete actions. Return ONLY valid JSON array of strings.\n\n${ctx}`, 450),
  ]);

  const courseData = {
    id: courseId, name, email, business_name,
    brand_color: intake.brand_color || null,
    welcome: welcomeRaw, brain: brainRaw,
    prompts: parseJSON(promptsRaw, []),
    tools: parseJSON(toolsRaw, []),
    map: parseJSON(mapRaw, { ai: [], human: [], improve: [] }),
    rules: parseJSON(rulesRaw, []),
    checklist: parseJSON(checklistRaw, []),
    logo: null,
    study: { flashcards: [], quiz: [], match: [] },
    intake,
  };

  const coursesStore = getStore("courses");
  await coursesStore.setJSON(courseId, courseData);
  await pendingStore.delete(tempId);

  // Email customer
  const emailHtml = `<p style="font-family:sans-serif;line-height:1.6">Hi ${escHtml(name)},<br><br>Your custom AI course for <strong>${escHtml(business_name)}</strong> is ready.<br><br><a href="${courseUrl}" style="background:#1C412C;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;margin:8px 0">Open Your Course →</a><br><br>Bookmark this link — it's your permanent access.<br><br>— Sage Systems</p>`;

  await Promise.allSettled([
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: process.env.FROM_EMAIL || "onboarding@resend.dev", to: email, subject: `Your Custom AI Course is Ready — ${business_name}`, html: emailHtml }),
    }),
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: process.env.FROM_EMAIL || "onboarding@resend.dev", to: "keltysage01@gmail.com", subject: `Admin-generated course — ${business_name} (${name})`, html: `<p style="font-family:sans-serif">Course manually generated for <strong>${escHtml(name)}</strong> (${escHtml(email)}).<br><a href="${escHtml(courseUrl)}">View course</a></p>` }),
    }),
  ]);

  return new Response(JSON.stringify({ ok: true, courseId, courseUrl }), {
    headers: { "Content-Type": "application/json" },
  });
}
