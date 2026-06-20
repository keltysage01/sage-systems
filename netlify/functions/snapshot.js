import { getStore } from "@netlify/blobs";

export const config = { path: "/api/snapshot" };

function genTempId() {
  return "tmp_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
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

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body = await req.json();
  const {
    name, business_name, industry, tagline, brand_voice = [],
    tools = [], other_tools, time_sinks, dreaded_tasks,
    workflows = [], sensitive_data = [], privacy_notes, comfort, email,
  } = body;

  const context = `
Business: ${business_name} (${industry})
Owner: ${name}
What they do: ${tagline}
Brand voice: ${brand_voice.join(", ") || "not specified"}
Tools they use: ${[...tools, other_tools].filter(Boolean).join(", ") || "not specified"}
Biggest time sinks: ${time_sinks}
Things they dread: ${dreaded_tasks || "not specified"}
Top workflows to improve: ${workflows.join(", ") || "not specified"}
Sensitive data: ${[...sensitive_data, privacy_notes].filter(Boolean).join(", ") || "none"}
AI comfort level: ${comfort}
  `.trim();

  const teaserPrompt = `You are an AI business consultant. Based on this business profile, write a sharp, specific 2-3 sentence insight about their single biggest AI opportunity. Be direct and specific to their business. No preamble. Start with the insight.

${context}`;

  const promptsPrompt = `You are an AI business consultant. Based on this business profile, create exactly 3 copy-paste prompts they can use TODAY in Claude or ChatGPT.

Each prompt should:
- Target one of their top workflows
- Be specific to their business type
- Include [bracket fields] they fill in
- Be immediately useful

Return ONLY a JSON array of 3 objects with this exact format:
[
  {"label": "Short workflow name (3-5 words)", "prompt": "The full copy-paste prompt with [bracket fields]"},
  {"label": "...", "prompt": "..."},
  {"label": "...", "prompt": "..."}
]

Business profile:
${context}`;

  const emailPrompt = `You are an AI business consultant writing a personalized email to ${name} at ${business_name}.

Write a warm, specific email that:
1. Names their #1 AI bottleneck (2 sentences)
2. Gives one concrete action to take this week
3. Explains what their $49 custom course includes (3 bullet points specific to their business)
4. Ends with a soft CTA

Under 250 words. Sign off as "Kelty at Sage Systems".

${context}`;

  // Save intake data so the Stripe webhook can retrieve it after payment
  const tempId = genTempId();
  try {
    const store = getStore("pending-intakes");
    await store.setJSON(tempId, body, { metadata: { createdAt: Date.now() } });
  } catch (err) {
    console.error("Failed to save pending intake:", err.message);
  }

  try {
    const [teaser, promptsRaw, emailBody] = await Promise.all([
      callClaude(teaserPrompt, 200),
      callClaude(promptsPrompt, 800),
      callClaude(emailPrompt, 800),
    ]);

    let actionPrompts = [];
    try {
      actionPrompts = JSON.parse(promptsRaw);
    } catch (e) {
      const match = promptsRaw.match(/\[[\s\S]*\]/);
      if (match) {
        try { actionPrompts = JSON.parse(match[0]); } catch (e2) {}
      }
    }

    let emailSent = false;
    try {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || "hello@sagesystems.ai",
          to: email,
          subject: `Your AI Bottleneck Snapshot — ${business_name}`,
          html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a;">
            <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#2d7a5e;margin-bottom:24px;">Sage Systems</p>
            ${emailBody.replace(/\n\n/g, '</p><p style="margin:0 0 16px;">').replace(/\n/g, '<br/>').replace(/^/, '<p style="margin:0 0 16px;">')}
            <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
            <p style="font-size:12px;color:#999;">Sage Systems · <a href="${process.env.SITE_URL}" style="color:#2d7a5e;">sage-systems-ai.netlify.app</a></p>
          </div>`,
        }),
      });
      emailSent = emailRes.ok;
    } catch (e) {}

    return new Response(JSON.stringify({ teaser, actionPrompts, emailSent, tempId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
