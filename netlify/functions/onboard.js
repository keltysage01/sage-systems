export const config = { path: "/api/onboard" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const data = await req.json();

  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1a1a1a;">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#2d7a5e;margin-bottom:24px;">NEW COURSE ORDER — Sage Systems</p>
      <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:4px;">${data.business_name}</h2>
      <p style="color:#888;margin-bottom:32px;">${data.name} · <a href="mailto:${data.email}">${data.email}</a>${data.website ? ` · <a href="${data.website}">${data.website}</a>` : ''}</p>

      <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
        ${row("Offer", data.offer)}
        ${row("Ideal client", data.ideal_client)}
        ${row("Priority task", data.priority_task)}
        ${row("Tools needed", data.tools_needed)}
        ${row("Off limits", data.off_limits)}
        ${row("Brand color", data.brand_color)}
        ${row("Tone", Array.isArray(data.tone) ? data.tone.join(", ") : data.tone)}
        ${row("Tagline", data.tagline)}
        ${row("Learning style", data.learning_style)}
        ${row("Extra notes", data.extra_notes)}
      </table>

      <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
      <p style="font-size:0.85rem;color:#888;">Reply directly to <a href="mailto:${data.email}">${data.email}</a> when their course is ready.</p>
    </div>
  `;

  function row(label, value) {
    if (!value) return '';
    return `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:700;color:#555;width:35%;vertical-align:top;">${label}</td>
      <td style="padding:10px 0 10px 16px;border-bottom:1px solid #f0f0f0;color:#111;">${value}</td>
    </tr>`;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || "hello@sagesystems.ai",
        to: "keltysage01@gmail.com",
        reply_to: data.email,
        subject: `🌿 New Course Order — ${data.business_name}`,
        html,
      }),
    });
  } catch (err) { /* log silently */ }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
