import { getStore } from "@netlify/blobs";
import { createHmac, timingSafeEqual, randomBytes } from "crypto";

export const config = { path: "/api/stripe-webhook" };

const STRIPE_BUY_URL = "https://buy.stripe.com/28E00lcbP14d5n35iH8k802";

function escHtml(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function escSubject(s) {
  return String(s || "").replace(/[\r\n]/g, " ");
}

function verifyStripeSignature(rawBody, sigHeader, secret) {
  try {
    const t = sigHeader.split(",").find(p => p.startsWith("t=")).slice(2);
    const v1 = sigHeader.split(",").find(p => p.startsWith("v1=")).slice(3);
    const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
    return timingSafeEqual(Buffer.from(v1, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

function genId() {
  return randomBytes(24).toString("base64url");
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
    const match = raw.match(/[\[\{][\s\S]*[\]\}]/);
    if (match) { try { return JSON.parse(match[0]); } catch {} }
    return fallback;
  }
}

async function generateCourse(intake) {
  const {
    name, email, business_name, website, tagline,
    brand_voice, industry, tools, other_tools,
    time_sinks, dreaded_tasks, workflows,
    sensitive_data, privacy_notes,
  } = intake;

  // Map snapshot fields → course generator context
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
Ideal client: not specified
Priority task to automate: ${priority_task}
Tools to build prompts for: ${tools_needed || "not specified"}
Workflows: ${Array.isArray(workflows) ? workflows.join(", ") : ""}
Off limits / never use AI for: ${off_limits || "none specified"}
  `.trim();

  const courseId = genId();
  const siteUrl = process.env.SITE_URL || "https://sage-systems-ai.netlify.app";
  const courseUrl = `${siteUrl}/course?id=${courseId}`;

  const [welcomeRaw, brainRaw, promptsRaw, toolsRaw, mapRaw, rulesRaw, checklistRaw] = await Promise.all([
    callClaude(`Write a course intro for ${name} at ${business_name}. Return ONLY a JSON array of 4-5 short bullet points. No emojis. First item: their single biggest AI opportunity stated directly. Next 2-3: specific things they will learn or have after this course. Last: one short motivating sentence.\n\nExample: ["Automate intake and FAQ responses saving 5+ hours weekly","10 prompts built for your exact workflows — ready to use today","A Business Brain prompt that gives AI full context every session","Your personal AI tools arsenal mapped to your business","You have everything you need to start this week"]\n\n${ctx}`, 400),
    callClaude(`Create a reusable "Business Brain" system prompt for ${name} at ${business_name} to paste at the start of every Claude or ChatGPT session. Include: who the business is, what they offer, who they serve, brand voice/tone, and any hard limits. Start with: "You are an AI assistant for..."\n\n${ctx}`, 420),
    callClaude(`Create 10 copy-paste prompts for ${name} at ${business_name}. Each targets a different business function and includes [bracket fields]. Cover: (1) client intake/onboarding, (2) content/copywriting, (3) email follow-up, (4) social media, (5) proposal/sales, (6) customer service/FAQ, (7) meeting summary/SOP, (8) research, (9) HR/hiring, (10) wildcard specific to their offer. Each prompt must include [bracket fields] and produce a real usable result specific to ${business_name}.\n\nReturn ONLY valid JSON array:\n[{"title":"Short name","what":"One sentence result","prompt":"Full prompt with [bracket fields]"}]\n\n${ctx}`, 2800),
    callClaude(`Recommend exactly 6 AI tools for ${name} at ${business_name}. Pick tools that directly solve what they described. For each: exact tool name, category, one sentence use case for ${business_name}, one power tip with example prompt.\n\nReturn ONLY valid JSON array:\n[{"tool":"Perplexity","category":"Research","use":"Research competitor pricing with cited sources.","tip":"Ask: Research [your industry] — what are the top 3 problems customers complain about?"}]\n\n${ctx}`, 1000),
    callClaude(`Create a workflow map for ${name} at ${business_name} — what AI handles, what stays human, what to improve first. 4-5 items per column.\n\nReturn ONLY valid JSON:\n{"ai":["..."],"human":["..."],"improve":["..."]}\n\n${ctx}`, 500),
    callClaude(`Write 5 privacy rules for ${name} at ${business_name} — specific things that should NEVER go into any AI tool.\n\nReturn ONLY valid JSON array of strings:\n["Rule 1","Rule 2"]\n\n${ctx}`, 300),
    callClaude(`Write a first-steps checklist for ${name} at ${business_name} — 8 concrete actions to take this week. Specific and actionable.\n\nReturn ONLY valid JSON array of strings:\n["Action 1","Action 2"]\n\n${ctx}`, 450),
  ]);

  const prompts = parseJSON(promptsRaw, []);
  const toolsList = parseJSON(toolsRaw, []);
  const map = parseJSON(mapRaw, { ai: [], human: [], improve: [] });
  const rules = parseJSON(rulesRaw, []);
  const checklist = parseJSON(checklistRaw, []);

  const courseData = {
    id: courseId, name, email, business_name,
    brand_color: intake.brand_color || null,
    welcome: welcomeRaw, brain: brainRaw,
    prompts, tools: toolsList, map, rules, checklist,
    logo: null,
    study: { flashcards: [], quiz: [], match: [] },
    intake,
  };

  const store = getStore("courses");
  await store.setJSON(courseId, courseData);

  // Email customer their course link
  const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
body{margin:0;padding:0;background:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}
@media only screen and (max-width:560px){.wrap{padding:12px 0 32px !important}.card{padding:28px 20px !important}}
</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td>
<table class="wrap" align="center" width="100%" style="max-width:560px;margin:0 auto;padding:24px 16px 48px" cellpadding="0" cellspacing="0">
  <tr><td style="background:#1C412C;border-radius:16px 16px 0 0;padding:24px 28px;text-align:center">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#a8c8a4">Sage Systems</p>
    <p style="margin:0;font-size:13px;color:rgba(255,255,255,.5)">Custom AI Course</p>
  </td></tr>
  <tr><td class="card" style="background:#fff;padding:32px 28px 24px;border-left:1px solid #e4ede4;border-right:1px solid #e4ede4">
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7A9C78">It's ready, ${escHtml(name)}.</p>
    <h1 style="margin:0 0 14px;font-size:1.9rem;font-weight:900;letter-spacing:-1px;color:#1C412C;line-height:1.1">Your AI course<br/>for ${escHtml(business_name)}.</h1>
    <p style="margin:0;font-size:.93rem;color:#6b7b6b;line-height:1.65">Built from your answers. ${prompts.length} prompts ready to copy. Your workflow map, privacy rules, and tool arsenal — all specific to your business.</p>
  </td></tr>
  <tr><td style="background:#fff;padding:0 28px 24px;border-left:1px solid #e4ede4;border-right:1px solid #e4ede4">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="48%" style="padding:14px 5px;text-align:center;background:#f5faf5;border:1px solid #d4e8d4;border-radius:12px">
        <div style="font-size:1.6rem;font-weight:900;color:#1C412C;line-height:1">7</div>
        <div style="font-size:11px;font-weight:600;color:#7A9C78;text-transform:uppercase;letter-spacing:.06em;margin-top:3px">Modules</div>
      </td>
      <td width="4%"></td>
      <td width="48%" style="padding:14px 5px;text-align:center;background:#1C412C;border:1px solid #1C412C;border-radius:12px">
        <div style="font-size:1.6rem;font-weight:900;color:#21E68A;line-height:1">${prompts.length}</div>
        <div style="font-size:11px;font-weight:600;color:#a8c8a4;text-transform:uppercase;letter-spacing:.06em;margin-top:3px">Prompts</div>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#fff;padding:24px 28px 28px;border:1px solid #e4ede4;border-top:none;border-radius:0 0 16px 16px">
    <a href="${courseUrl}" style="display:block;background:#1C412C;color:#fff;font-size:1rem;font-weight:800;padding:18px 28px;border-radius:12px;text-decoration:none;text-align:center">Open Your Course →</a>
    <p style="margin:12px 0 0;font-size:12px;color:#9aab9a;text-align:center">Bookmark this link — it's your permanent access.</p>
  </td></tr>
  <tr><td style="padding:24px 0 0;text-align:center">
    <p style="margin:0;font-size:12px;color:#b0bdb0">Sage Systems · <a href="${siteUrl}" style="color:#7A9C78;text-decoration:none">sage-systems-ai.netlify.app</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  await Promise.allSettled([
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || "onboarding@resend.dev",
        to: email,
        subject: escSubject(`Your Custom AI Course is Ready — ${business_name}`),
        html: emailHtml,
      }),
    }),
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || "onboarding@resend.dev",
        to: "keltysage01@gmail.com",
        reply_to: email,
        subject: escSubject(`New paid course — ${business_name} (${name})`),
        html: `<p style="font-family:sans-serif">New $9.99 payment from <strong>${escHtml(name)}</strong> (${escHtml(email)}) — <strong>${escHtml(business_name)}</strong>.<br/>Course generated and emailed.<br/><br/><a href="${escHtml(courseUrl)}">View their course</a></p>`,
      }),
    }),
  ]);

  return courseId;
}

export default async function handler(req, context) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) return new Response("Webhook not configured", { status: 500 });
  if (!sig || !verifyStripeSignature(rawBody, sig, secret)) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  // Acknowledge Stripe immediately — do the work in background
  if (event.type !== "checkout.session.completed") {
    return new Response("ok", { status: 200 });
  }

  const session = event.data.object;
  const tempId = session.client_reference_id;

  if (!tempId) {
    console.error("stripe-webhook: no client_reference_id in session", session.id);
    return new Response("ok", { status: 200 });
  }

  const doWork = async () => {
    try {
      const pendingStore = getStore("pending-intakes");
      const intake = await pendingStore.get(tempId, { type: "json" });

      if (!intake) {
        console.error("stripe-webhook: no pending intake for tempId", tempId);
        return;
      }

      await generateCourse(intake);
      await pendingStore.delete(tempId);
    } catch (err) {
      console.error("stripe-webhook: course generation failed", err.message);
    }
  };

  if (context?.waitUntil) {
    context.waitUntil(doWork());
  } else {
    doWork();
  }

  return new Response("ok", { status: 200 });
}
