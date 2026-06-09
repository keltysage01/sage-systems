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
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0;padding:0;background:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:24px 16px 48px;">

  <!-- Header -->
  <div style="background:#1C412C;border-radius:20px 20px 0 0;padding:28px 32px 24px;text-align:center;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#a8c8a4;">Sage Systems</p>
    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);font-weight:500;">Custom AI Course</p>
  </div>

  <!-- Hero -->
  <div style="background:#ffffff;padding:36px 32px 28px;border-left:1px solid #e4ede4;border-right:1px solid #e4ede4;">
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7A9C78;">It's ready, ${name}.</p>
    <h1 style="margin:0 0 16px;font-size:2rem;font-weight:900;letter-spacing:-1px;color:#1C412C;line-height:1.1;">Your AI course<br/>for ${business_name}.</h1>
    <p style="margin:0;font-size:0.95rem;color:#6b7b6b;line-height:1.6;">Built from your answers. Specific to your workflows.<br/>Copy-paste prompts ready to use today.</p>
  </div>

  <!-- Stats -->
  <div style="background:#ffffff;padding:0 32px 28px;border-left:1px solid #e4ede4;border-right:1px solid #e4ede4;">
    <div style="display:flex;gap:10px;">
      <div style="flex:1;background:#f5faf5;border:1px solid #d4e8d4;border-radius:14px;padding:16px;text-align:center;">
        <div style="font-size:1.6rem;font-weight:900;color:#1C412C;letter-spacing:-1px;">5</div>
        <div style="font-size:11px;font-weight:600;color:#7A9C78;text-transform:uppercase;letter-spacing:0.06em;margin-top:2px;">Modules</div>
      </div>
      <div style="flex:1;background:#f5faf5;border:1px solid #d4e8d4;border-radius:14px;padding:16px;text-align:center;">
        <div style="font-size:1.6rem;font-weight:900;color:#1C412C;letter-spacing:-1px;">${prompts.length}</div>
        <div style="font-size:11px;font-weight:600;color:#7A9C78;text-transform:uppercase;letter-spacing:0.06em;margin-top:2px;">Prompts</div>
      </div>
      <div style="flex:1;background:#1C412C;border:1px solid #1C412C;border-radius:14px;padding:16px;text-align:center;">
        <div style="font-size:1.6rem;font-weight:900;color:#00F057;letter-spacing:-1px;">✓</div>
        <div style="font-size:11px;font-weight:600;color:#a8c8a4;text-transform:uppercase;letter-spacing:0.06em;margin-top:2px;">Live Now</div>
      </div>
    </div>
  </div>

  <!-- Divider -->
  <div style="background:#ffffff;padding:0 32px;border-left:1px solid #e4ede4;border-right:1px solid #e4ede4;">
    <div style="border-top:1px solid #eef3ee;"></div>
  </div>

  <!-- Module List -->
  <div style="background:#ffffff;padding:24px 32px;border-left:1px solid #e4ede4;border-right:1px solid #e4ede4;">
    <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#7A9C78;">What's inside</p>
    ${['AI Command Center','Prompt Library','Workflow Map','Privacy Rules','First Steps'].map((m,i)=>`
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;${i<4?'border-bottom:1px solid #f0f5f0;':''}">
      <div style="width:26px;height:26px;background:#f0f5f0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#1C412C;flex-shrink:0;">${String(i+1).padStart(2,'0')}</div>
      <span style="font-size:0.9rem;font-weight:600;color:#2d4a3e;">${m}</span>
    </div>`).join('')}
  </div>

  <!-- CTA -->
  <div style="background:#ffffff;padding:28px 32px 32px;border-left:1px solid #e4ede4;border-right:1px solid #e4ede4;border-radius:0 0 20px 20px;border-bottom:1px solid #e4ede4;">
    <a href="${courseUrl}" style="display:block;background:#1C412C;color:#ffffff;font-size:1rem;font-weight:800;padding:18px 32px;border-radius:14px;text-decoration:none;letter-spacing:-0.3px;text-align:center;">Open Your Course →</a>
    <p style="margin:14px 0 0;font-size:12px;color:#9aab9a;text-align:center;">Bookmark this link — it's your permanent access.</p>
  </div>

  <!-- Footer -->
  <p style="text-align:center;font-size:12px;color:#b0bdb0;margin-top:28px;">Sage Systems · <a href="${siteUrl}" style="color:#7A9C78;text-decoration:none;">sage-systems-ai.netlify.app</a></p>

</div>
</body></html>`,
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
