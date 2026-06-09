import { getStore } from "@netlify/blobs";

export const config = { path: "/api/onboard" };

function genId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
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

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const data = await req.json();
  const {
    name, email, business_name, website, offer,
    brand_color, tone, tagline,
    ideal_client, priority_task, tools_needed, off_limits,
    learning_style, extra_notes, logo,
  } = data;

  const ctx = `
Business: ${business_name}
Owner: ${name}
Website: ${website || "not provided"}
Offer: ${offer}
Brand tone: ${Array.isArray(tone) ? tone.join(", ") : (tone || "not specified")}
Tagline: ${tagline || "not provided"}
Ideal client: ${ideal_client}
Priority task to automate: ${priority_task}
Tools to build prompts for: ${tools_needed || "not specified"}
Off limits / never use AI for: ${off_limits || "none specified"}
Learning style preference: ${learning_style || "not specified"}
Extra notes: ${extra_notes || "none"}
  `.trim();

  const [welcomeRaw, brainRaw, promptsRaw, mapRaw, rulesRaw, checklistRaw] = await Promise.all([
    callClaude(`Write a warm, specific 2-paragraph intro for ${name} at ${business_name}. First paragraph: their single biggest AI opportunity, stated directly. Second paragraph: what their custom course will cover, specific to them. No headers, no preamble. Signed "— Kelty, Sage Systems".\n\n${ctx}`, 320),

    callClaude(`Create a reusable "Business Brain" system prompt for ${name} at ${business_name} to paste at the start of every Claude or ChatGPT session. Include: who the business is, what they offer, who they serve, brand voice/tone, and any hard limits. Make it practical and ready to copy. Start with: "You are an AI assistant for..."\n\n${ctx}`, 420),

    callClaude(`Create 5 copy-paste prompts for ${name} at ${business_name}. Each targets a specific workflow, includes [bracket fields] to fill in, and is ready to use today. Focus on their priority task, their tools, and their offer.\n\nReturn ONLY valid JSON array:\n[{"title":"Short name 3-5 words","prompt":"Full ready-to-use prompt with [bracket fields]"}]\n\n${ctx}`, 900),

    callClaude(`Create a workflow map for ${name} at ${business_name} — what AI handles, what stays human, what to improve first. 4-5 items per column, specific to their business.\n\nReturn ONLY valid JSON:\n{"ai":["..."],"human":["..."],"improve":["..."]}\n\n${ctx}`, 500),

    callClaude(`Write 5 privacy rules for ${name} at ${business_name} — specific things that should NEVER go into any AI tool, specific to their business type and clients.\n\nReturn ONLY valid JSON array of strings:\n["Rule 1","Rule 2"]\n\n${ctx}`, 300),

    callClaude(`Write a first-steps checklist for ${name} at ${business_name} — 8 concrete actions to take this week to start using AI. Each should be specific and actionable for their situation.\n\nReturn ONLY valid JSON array of strings (no "Step N:" prefix):\n["Action 1","Action 2"]\n\n${ctx}`, 450),
  ]);

  const welcome = welcomeRaw;
  const brain = brainRaw;
  const prompts = parseJSON(promptsRaw, []);
  const map = parseJSON(mapRaw, { ai: [], human: [], improve: [] });
  const rules = parseJSON(rulesRaw, []);
  const checklist = parseJSON(checklistRaw, []);

  const courseId = genId();
  const courseData = {
    id: courseId, name, email, business_name, brand_color,
    welcome, brain, prompts, map, rules, checklist,
    logo: logo || null,
  };

  const siteUrl = process.env.SITE_URL || "https://sage-systems-ai.netlify.app";
  const courseUrl = `${siteUrl}/course?id=${courseId}`;

  try {
    const store = getStore("courses");
    await store.setJSON(courseId, courseData);
  } catch (err) {
    console.error("Blob store error:", err.message);
  }

  // Email customer
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || "onboarding@resend.dev",
        to: email,
        subject: `Your Custom AI Course is Ready — ${business_name}`,
        html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1a1a1a;">
          <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#2d7a5e;margin-bottom:28px;">Sage Systems</p>
          <h2 style="font-size:1.5rem;font-weight:800;letter-spacing:-0.5px;margin-bottom:20px;">Your course is ready, ${name}.</h2>
          <p style="color:#555;line-height:1.7;margin-bottom:28px;">${welcome.replace(/\n\n/g, '</p><p style="color:#555;line-height:1.7;margin-bottom:16px;">').replace(/\n/g, '<br/>')}</p>
          <a href="${courseUrl}" style="display:inline-block;background:#2d7a5e;color:#fff;font-size:1rem;font-weight:700;padding:15px 36px;border-radius:100px;text-decoration:none;letter-spacing:-0.2px;">Access Your Course</a>
          <p style="font-size:12px;color:#aaa;margin-top:20px;">Bookmark this link — it's your permanent access to your custom AI course.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:36px 0;"/>
          <p style="font-size:12px;color:#bbb;">Sage Systems · <a href="${siteUrl}" style="color:#2d7a5e;text-decoration:none;">sage-systems-ai.netlify.app</a></p>
        </div>`,
      }),
    });
  } catch (err) { console.error("Customer email error:", err.message); }

  // Notify Kelty
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || "onboarding@resend.dev",
        to: "keltysage01@gmail.com",
        reply_to: email,
        subject: `New course generated — ${business_name}`,
        html: `<p style="font-family:sans-serif;">New order from <strong>${name}</strong> (${email}) — <strong>${business_name}</strong>.<br/>Course auto-generated and sent.<br/><br/><a href="${courseUrl}">View their course</a></p>`,
      }),
    });
  } catch (err) {}

  return new Response(JSON.stringify({ ok: true, courseUrl }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
