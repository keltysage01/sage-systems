import { getStore } from "@netlify/blobs";

export const config = { path: "/api/onboard" };

const DEFAULT_TOOLS_KB = `
TOOL LIBRARY — 30 tools by function:

WRITING & CONTENT: Claude/Anthropic (all writing, reasoning, strategy — always recommend unless they already use it daily), ChatGPT/OpenAI (Custom GPTs for repeatable tasks, DALL-E image generation, spreadsheet analysis — recommend alongside Claude when they need a custom assistant or images), Jasper (brand-consistent content at scale, teams of 5+), Copy.ai (ads, sales copy, product descriptions, e-commerce), Descript (edit podcast and video recordings like a text doc, auto-transcription)

RESEARCH & INTELLIGENCE: Perplexity AI (real-time web research with cited sources, fast competitor and market research, FREE–$20/mo), NotebookLM/Google (upload your own documents, PDFs, URLs — then ask questions about them, generate summaries, create audio overviews — COMPLETELY FREE, no paid tier), Claude Research Mode (deep synthesis across many sources)

MEETINGS & COMMUNICATION: Fireflies.ai (auto-transcribes any meeting, generates action items, syncs notes to CRM, FREE–$19/mo), Otter.ai (live transcription for Google Meet and Zoom, FREE–$20/mo), Notion AI (team knowledge base, meeting notes, internal docs, $10/mo add-on)

SALES & CRM: HubSpot AI (AI-assisted CRM, email sequences, pipeline management, FREE–$90/mo+), Apollo.io (B2B lead prospecting + personalized outreach, FREE–$99/mo), Lavender (AI email coach that scores and rewrites your sales emails in real time, FREE–$29/mo)

CUSTOMER SERVICE: Intercom Fin AI (fully autonomous AI support agent, handles common questions automatically, $39/mo+), Tidio (AI chatbot for small business websites, handles FAQs and captures leads after hours, FREE–$29/mo), Zendesk AI (enterprise-level ticket routing and agent assistance, $55/agent/mo+)

AUTOMATION & WORKFLOWS: Zapier with AI (connect 6,000+ apps, automate repetitive tasks with natural language, FREE–$19.99/mo), Make.com (complex multi-step automations, data-heavy workflows, FREE–$16/mo), Relay.app (automations with a human review step before AI acts, FREE–$19/mo)

SOCIAL MEDIA & MARKETING: Buffer + AI Assistant (schedule posts and generate content, FREE–$15/mo), Predis.ai (generate visual social posts from a product name or topic, great for e-commerce/restaurants, FREE–$29/mo), Opus Clip (turn one long YouTube or webinar video into 10 short clips automatically, FREE–$19/mo)

DESIGN & VISUAL: Canva AI / Magic Studio (create branded graphics, social posts, presentations, short videos — NO design skills needed, FREE–$15/mo — recommend Pro for business), Adobe Firefly (generate commercial-safe custom images at scale, FREE–$9.99/mo)

OPERATIONS & PRODUCTIVITY: Reclaim.ai (AI calendar management — auto-schedules tasks, meetings, and focus time, FREE–$12/mo), Motion (AI project and task management that auto-reprioritizes your day, $19/mo)

LEGAL & FINANCE: Harvey AI (legal document review and contract analysis, enterprise pricing), Kick (AI bookkeeping that auto-categorizes transactions, $35/mo — great for solopreneurs), Clio Duo (AI assistant for law firm practice management, included in Clio plans)

VIDEO & AUDIO: Veed.io (auto-captions, AI avatar videos, translate videos, turn long content into clips, FREE–$18/mo), Runway (AI video generation from text or images), ElevenLabs (voice cloning and AI narration, create audio from any text), Descript (edit audio/video by editing a text transcript), Adobe Podcast (one-click studio-quality voice cleanup, free)

GOOGLE WORKSPACE INTEGRATION: Gemini/Google (AI built directly into Gmail, Docs, Sheets, Slides, Meet, Drive — drafts emails, summarizes threads, generates formulas, builds decks — $30/user/mo add-on — HIGHEST VALUE for any Google Workspace user)

INDUSTRY-SPECIFIC: Alma (AI for therapist private practices — notes, billing, scheduling), Curaytor (AI marketing for real estate agents — listings, social, ads), Restaurant365 AI (food cost, scheduling, inventory for restaurant operators)

---

TOOL ROUTING RULES — match intake answers to tools:
"social media posts / marketing content / need visuals / no designer" → Canva AI (nearly always relevant for solo and small business)
"Google Workspace / Gmail / Google Docs / Google Sheets" → Gemini (high priority, deep integration is the differentiator)
"reading lots of documents / reports / research / need to process information fast" → NotebookLM (always free, always relevant for document-heavy businesses)
"video content / YouTube / reels / coaching videos / webinars" → Veed.io or Opus Clip
"B2B sales / cold outreach / prospecting / lead generation" → Apollo.io + Lavender
"lots of client meetings / losing track of what was discussed" → Fireflies.ai
"repetitive copy-paste between apps / manual data entry / connecting tools" → Zapier AI
"answering the same customer questions / website support / FAQ" → Tidio (small) or Intercom Fin (growing)
"want to build a custom AI assistant for my team / specific repeatable task" → ChatGPT Custom GPTs
"building a business plan / entering a new market / competitive strategy" → Claude + Viktor AI
"legal practice / lots of contracts to review" → Harvey AI or Clio Duo
"bookkeeping taking too long / messy finances / no bookkeeper" → Kick
"long video to repurpose as short clips" → Opus Clip
"team needs one place for knowledge / information living in people's heads" → Notion AI
"need podcast or audio content / voice narration" → ElevenLabs + Descript

---

SELECTION RULES:
- Recommend Claude to almost everyone as the core AI — unless they explicitly already use it daily
- Maximum 6 tools total — only recommend what directly addresses something in their intake
- NEVER recommend a tool that doesn't connect to their actual answers
- Solo operators: skip enterprise tools (Zendesk, Harvey enterprise, Jasper team)
- "Free only" budget: Claude (free tier), Canva (free), NotebookLM (free), Tidio (free), Zapier (free), Buffer (free), Perplexity (free)
- Do NOT recommend both Claude AND ChatGPT unless there is a specific reason for each
- Google Workspace users: always include Gemini
- Canva AI is relevant for almost any business that creates visual content
- NotebookLM is relevant for almost any business that processes documents or research
- Use their exact industry in the "use" and "tip" — a hair salon and a B2B consultant get different examples even if they get the same tool
`.trim();

async function getToolsKB() {
  try {
    const store = getStore("knowledge-base");
    const kb = await store.get("tools-kb");
    if (kb) return kb;
  } catch {}
  return DEFAULT_TOOLS_KB;
}

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

export default async function handler(req, context) {
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

  const TOOLS_KB = await getToolsKB();

  const KB = `AI FLUENCY FRAMEWORK (4 D's): Delegation (which tasks to hand to AI), Description (how to prompt clearly), Discernment (evaluate outputs critically — AI hallucinates), Diligence (accountability, privacy, quality control).

PROMPTING FRAMEWORK: Role + Context + Task + Format + Constraints. Advanced: chain-of-thought ("think step by step"), examples-based prompting, iterative refinement.

DEPARTMENT USE CASES: Marketing (campaigns, content repurposing, social posts, email sequences, SEO briefs), Sales (outreach, proposals, follow-ups, CRM notes, call prep), HR (job descriptions, onboarding docs, performance reviews), Operations (meeting summaries, SOPs, project plans), Customer Support (response templates, FAQs, training docs), Finance/Legal (document summaries, contract review — always human final sign-off).

${TOOLS_KB}`;

  const [welcomeRaw, brainRaw, promptsRaw, toolsRaw, mapRaw, rulesRaw, checklistRaw, studyRaw] = await Promise.all([
    callClaude(`Write a course intro for ${name} at ${business_name}. Return ONLY a JSON array of 4-5 short bullet points. No emojis. First item: their single biggest AI opportunity stated directly. Next 2-3 items: specific things they will learn or have after this course. Last item: one short motivating sentence. No preamble, no markdown, just the JSON array.\n\nExample: ["Automate intake and FAQ responses saving 5+ hours weekly","10 prompts built for your exact workflows — ready to use today","A Business Brain prompt that gives AI full context every session","Your personal AI tools arsenal mapped to your business","You have everything you need to start this week"]\n\n${ctx}`, 400),

    callClaude(`Create a reusable "Business Brain" system prompt for ${name} at ${business_name} to paste at the start of every Claude or ChatGPT session. Include: who the business is, what they offer, who they serve, brand voice/tone, and any hard limits. Make it practical and ready to copy. Start with: "You are an AI assistant for..."\n\n${ctx}`, 420),

    callClaude(`Create 10 copy-paste prompts for ${name} at ${business_name}. Each targets a different business function and includes [bracket fields] to fill in. Cover a diverse mix: (1) client intake or onboarding, (2) content creation or copywriting, (3) email sequence or follow-up, (4) social media post or campaign, (5) proposal or sales outreach, (6) customer service or FAQ response, (7) meeting summary or SOP, (8) research or competitive analysis, (9) hiring or HR task, (10) one wildcard specific to their exact offer and industry. Each prompt must be detailed and produce a real, usable result — not a generic template. Always include [bracket fields] for customization. Make every prompt specific to ${business_name}'s actual offer and industry — not generic business advice.\n\nReturn ONLY valid JSON array:\n[{"title":"Short name 3-5 words","what":"One sentence: what specific result this prompt produces for ${business_name}","prompt":"Full detailed prompt with [bracket fields]"}]\n\n${ctx}\n\n${KB}`, 2800),

    callClaude(`Recommend exactly 6 AI tools for ${name} at ${business_name}. Use the TOOL ROUTING RULES and SELECTION RULES below to pick the best 6 tools for their specific situation. Match their intake answers to the routing rules. Be specific and opinionated — pick tools that directly solve what they described, not generic recommendations.\n\nFor each tool: exact tool name, category (Writing/Research/Design/Automation/Meetings/Video/Audio/Data/Sales-CRM/Customer-Service), one sentence describing the specific use case for ${business_name} using their industry and offer, and one power tip with an example prompt or action they can try today.\n\nReturn ONLY valid JSON array:\n[{"tool":"Perplexity","category":"Research","use":"Research competitor pricing and client pain points with cited sources.","tip":"Ask: Research [your industry] — what are the top 3 problems customers complain about? Give me sources."}]\n\n${ctx}\n\n${KB}`, 1000),

    callClaude(`Create a workflow map for ${name} at ${business_name} — what AI handles, what stays human, what to improve first. 4-5 items per column, specific to their business.\n\nReturn ONLY valid JSON:\n{"ai":["..."],"human":["..."],"improve":["..."]}\n\n${ctx}`, 500),

    callClaude(`Write 5 privacy rules for ${name} at ${business_name} — specific things that should NEVER go into any AI tool, specific to their business type and clients.\n\nReturn ONLY valid JSON array of strings:\n["Rule 1","Rule 2"]\n\n${ctx}`, 300),

    callClaude(`Write a first-steps checklist for ${name} at ${business_name} — 8 concrete actions to take this week to start using AI. Each should be specific and actionable for their situation.\n\nReturn ONLY valid JSON array of strings (no "Step N:" prefix):\n["Action 1","Action 2"]\n\n${ctx}`, 450),

    callClaude(`Create interactive study materials for ${name} at ${business_name} to reinforce their AI course. No emojis anywhere.\n\n1. FLASHCARDS (18): Mix of: AI vocabulary with plain-English definitions, business AI applications, AI tool names and their best use cases (e.g. Perplexity, ElevenLabs, Fireflies, Gamma), and prompting techniques. Keep definitions under 20 words.\n2. QUIZ (6 questions): Scenario-based multiple-choice, 4 choices each, one correct (0-indexed), brief explanation. Include at least 2 questions about choosing the right AI tool.\n3. MATCH (8 pairs): Short terms (2-4 words) paired with definitions (5-10 words). Include AI tool names.\n\nReturn ONLY valid JSON, no extra text:\n{"flashcards":[{"term":"Business Brain","def":"A reusable prompt that gives AI context about your business every session."},{"term":"Perplexity","def":"AI search tool that provides real-time answers with cited sources."}],"quiz":[{"q":"You need to draft a proposal for a new client. What do you do first?","choices":["Open ChatGPT and start typing","Paste your Business Brain first","Use a generic template","Ask a colleague"],"correct":1,"explain":"Paste your Business Brain first so AI has full context before generating anything."}],"match":[{"term":"Fireflies.ai","def":"Records and summarizes meetings, syncs notes to your CRM"}]}\n\n${ctx}\n\n${KB}`, 3800),
  ]);

  const welcome = welcomeRaw;
  const brain = brainRaw;
  const prompts = parseJSON(promptsRaw, []);
  const tools = parseJSON(toolsRaw, []);
  const map = parseJSON(mapRaw, { ai: [], human: [], improve: [] });
  const rules = parseJSON(rulesRaw, []);
  const checklist = parseJSON(checklistRaw, []);
  const study = parseJSON(studyRaw, { flashcards: [], quiz: [], match: [] });

  const courseId = genId();
  const courseData = {
    id: courseId, name, email, business_name, brand_color,
    welcome, brain, prompts, tools, map, rules, checklist,
    logo: logo || null, study,
  };

  const siteUrl = process.env.SITE_URL || "https://sage-systems-ai.netlify.app";
  const courseUrl = `${siteUrl}/course?id=${courseId}`;

  try {
    const store = getStore("courses");
    await store.setJSON(courseId, courseData);
  } catch (err) {
    console.error("Blob store error:", err.message);
  }

  const emailHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
body,table,td{margin:0;padding:0;border:0}
body{background:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}
a{color:inherit}
@media only screen and (max-width:560px){
  .wrap{padding:12px 0 32px !important}
  .card-hero{padding:28px 20px 22px !important}
  .card-stats{padding:0 20px 22px !important}
  .card-divider{padding:0 20px !important}
  .card-modules{padding:20px !important}
  .card-cta{padding:22px 20px 26px !important}
  .h1{font-size:1.5rem !important;letter-spacing:-0.5px !important}
  .stat-td{padding:12px 6px !important}
  .stat-num{font-size:1.4rem !important}
  .cta-btn{padding:16px 24px !important;font-size:0.95rem !important}
}
</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td>
<table class="wrap" align="center" width="100%" style="max-width:560px;margin:0 auto;padding:24px 16px 48px" cellpadding="0" cellspacing="0" role="presentation">

  <!-- Header -->
  <tr><td style="background:#1C412C;border-radius:16px 16px 0 0;padding:24px 28px;text-align:center">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#a8c8a4">Sage Systems</p>
    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);font-weight:500">Custom AI Course</p>
  </td></tr>

  <!-- Hero -->
  <tr><td class="card-hero" style="background:#ffffff;padding:32px 28px 24px;border-left:1px solid #e4ede4;border-right:1px solid #e4ede4">
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7A9C78">It's ready, ${name}.</p>
    <h1 class="h1" style="margin:0 0 14px;font-size:1.9rem;font-weight:900;letter-spacing:-1px;color:#1C412C;line-height:1.1">Your AI course<br/>for ${business_name}.</h1>
    <p style="margin:0;font-size:0.93rem;color:#6b7b6b;line-height:1.65">Built from your answers. Specific to your workflows. Copy-paste prompts ready to use today.</p>
  </td></tr>

  <!-- Stats -->
  <tr><td class="card-stats" style="background:#ffffff;padding:0 28px 24px;border-left:1px solid #e4ede4;border-right:1px solid #e4ede4">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td class="stat-td" width="33%" style="padding:14px 5px;text-align:center;background:#f5faf5;border:1px solid #d4e8d4;border-radius:12px">
        <div class="stat-num" style="font-size:1.6rem;font-weight:900;color:#1C412C;letter-spacing:-1px;line-height:1">6</div>
        <div style="font-size:11px;font-weight:600;color:#7A9C78;text-transform:uppercase;letter-spacing:0.06em;margin-top:3px">Modules</div>
      </td>
      <td width="4%"></td>
      <td class="stat-td" width="33%" style="padding:14px 5px;text-align:center;background:#f5faf5;border:1px solid #d4e8d4;border-radius:12px">
        <div class="stat-num" style="font-size:1.6rem;font-weight:900;color:#1C412C;letter-spacing:-1px;line-height:1">${prompts.length}</div>
        <div style="font-size:11px;font-weight:600;color:#7A9C78;text-transform:uppercase;letter-spacing:0.06em;margin-top:3px">Prompts</div>
      </td>
      <td width="4%"></td>
      <td class="stat-td" width="26%" style="padding:14px 5px;text-align:center;background:#1C412C;border:1px solid #1C412C;border-radius:12px">
        <div class="stat-num" style="font-size:1.6rem;font-weight:900;color:#21E68A;letter-spacing:-1px;line-height:1">✓</div>
        <div style="font-size:11px;font-weight:600;color:#a8c8a4;text-transform:uppercase;letter-spacing:0.06em;margin-top:3px">Live Now</div>
      </td>
    </tr></table>
  </td></tr>

  <!-- Divider -->
  <tr><td class="card-divider" style="background:#ffffff;padding:0 28px;border-left:1px solid #e4ede4;border-right:1px solid #e4ede4">
    <div style="border-top:1px solid #eef3ee"></div>
  </td></tr>

  <!-- Module List -->
  <tr><td class="card-modules" style="background:#ffffff;padding:22px 28px;border-left:1px solid #e4ede4;border-right:1px solid #e4ede4">
    <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#7A9C78">What's inside</p>
    ${['AI Command Center','Prompt Library','Workflow Map','Privacy Rules','First Steps','AI Tools Arsenal'].map((m,i)=>`
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="${i<5?'border-bottom:1px solid #f0f5f0;':''}"><tr>
      <td style="padding:10px 0;width:36px;vertical-align:middle">
        <div style="width:26px;height:26px;background:#f0f5f0;border-radius:7px;text-align:center;line-height:26px;font-size:11px;font-weight:800;color:#1C412C">${String(i+1).padStart(2,'0')}</div>
      </td>
      <td style="padding:10px 0 10px 10px;font-size:0.9rem;font-weight:600;color:#2d4a3e;vertical-align:middle">${m}</td>
    </tr></table>`).join('')}
  </td></tr>

  <!-- CTA -->
  <tr><td class="card-cta" style="background:#ffffff;padding:24px 28px 28px;border-left:1px solid #e4ede4;border-right:1px solid #e4ede4;border-bottom:1px solid #e4ede4;border-radius:0 0 16px 16px">
    <a class="cta-btn" href="${courseUrl}" style="display:block;background:#1C412C;color:#ffffff;font-size:1rem;font-weight:800;padding:18px 28px;border-radius:12px;text-decoration:none;letter-spacing:-0.3px;text-align:center">Open Your Course →</a>
    <p style="margin:12px 0 0;font-size:12px;color:#9aab9a;text-align:center">Bookmark this link — it's your permanent access.</p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:24px 0 0;text-align:center">
    <p style="margin:0;font-size:12px;color:#b0bdb0">Sage Systems · <a href="${siteUrl}" style="color:#7A9C78;text-decoration:none">sage-systems-ai.netlify.app</a></p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  const sendEmails = async () => {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || "onboarding@resend.dev",
          to: email,
          subject: `Your Custom AI Course is Ready — ${business_name}`,
          html: emailHtml,
        }),
      });
    } catch (err) { console.error("Customer email error:", err.message); }
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || "onboarding@resend.dev",
          to: "keltysage01@gmail.com",
          reply_to: email,
          subject: `New course generated — ${business_name}`,
          html: `<p style="font-family:sans-serif">New order from <strong>${name}</strong> (${email}) — <strong>${business_name}</strong>.<br/>Course auto-generated and sent.<br/><br/><a href="${courseUrl}">View their course</a></p>`,
        }),
      });
    } catch (err) {}
  };

  if (context?.waitUntil) {
    context.waitUntil(sendEmails());
  } else {
    await sendEmails();
  }

  return new Response(JSON.stringify({ ok: true, courseUrl }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
