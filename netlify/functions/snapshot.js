export const config = { path: "/api/snapshot" };

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
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

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
Sensitive data / privacy rules: ${[...sensitive_data, privacy_notes].filter(Boolean).join(", ") || "none specified"}
AI comfort level: ${comfort}
  `.trim();

  const teaserPrompt = `You are an AI business consultant. Based on this business profile, identify their single biggest AI opportunity in 3-4 sentences. Be specific to their business. Start directly with the insight — no preamble.

${context}`;

  const emailPrompt = `You are an AI business consultant writing a personalized email to ${name} at ${business_name}.

Based on their intake form, write a warm, specific, actionable email that:
1. Names their #1 AI bottleneck (2-3 sentences)
2. Gives them one concrete prompt they can copy and use TODAY for their top workflow
3. Explains what their custom $49 AI course would include (3-4 bullet points specific to their business)
4. Ends with a soft CTA to get their full course

Keep it under 300 words. Conversational, not corporate. Sign off as "Kelty at Sage Systems".

Business profile:
${context}`;

  try {
    const [teaser, emailBody] = await Promise.all([
      callClaude(teaserPrompt, 300),
      callClaude(emailPrompt, 1000),
    ]);

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
            <p style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#2d7a5e;margin-bottom:24px;">Sage Systems</p>
            ${emailBody.replace(/\n\n/g, '</p><p style="margin:0 0 16px;">').replace(/\n/g, '<br/>').replace(/^/, '<p style="margin:0 0 16px;">')}
            <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
            <p style="font-size:12px;color:#999;">Sage Systems · <a href="${process.env.SITE_URL}" style="color:#2d7a5e;">sage-systems-ai.netlify.app</a></p>
          </div>`,
        }),
      });
      emailSent = emailRes.ok;
    } catch (e) {
      // email failure is non-fatal
    }

    return new Response(JSON.stringify({ teaser, emailSent }), {
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
