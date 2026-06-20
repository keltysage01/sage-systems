import { getStore } from "@netlify/blobs";

export const config = { path: "/course" };

// TODO: replace with client's booking link when provided
const BOOK_CALL_URL = "#book-call";

function esc(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function hexToRgb(h) {
  h = h.replace('#','');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function toHex(r,g,b) {
  return '#'+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
}
function lighten(h,t) { const [r,g,b]=hexToRgb(h); return toHex(r+(255-r)*t,g+(255-g)*t,b+(255-b)*t); }
function dk(h,t) { const [r,g,b]=hexToRgb(h); return toHex(r*(1-t),g*(1-t),b*(1-t)); }

function brandCSS(brand) {
  if (!brand || !/^#[0-9a-fA-F]{6}$/.test(brand)) return '';
  const olive = dk(brand, 0.08);
  const oliveMid = lighten(brand, 0.1);
  const sage = lighten(brand, 0.38);
  const sageLight = lighten(brand, 0.6);
  const sand = lighten(brand, 0.93);
  const sand2 = lighten(brand, 0.89);
  const line = lighten(brand, 0.79);
  return `:root{--olive:${olive};--olive-mid:${oliveMid};--sage:${sage};--sage-light:${sageLight};--sand:${sand};--sand2:${sand2};--line:${line}}`;
}

function buildScreens(course) {
  const { name, business_name, welcome, brain, prompts = [], tools = [], map = {}, rules = [], checklist = [], logo } = course;
  const biz = esc(business_name);
  const owner = esc(name);
  const slug = (business_name || "course").toLowerCase().replace(/[^a-z0-9]+/g, "_");

  const screens = [];
  const moduleStarts = {};

  const lessonItem = (t) => `<div class="lesson-item"><span class="li-dot"></span>${t}</div>`;

  const winScreen = (module, capability, next, opts) => `
    <div class="win-screen">
      <div class="win-icon"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 15l6 6L23 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div class="win-eyebrow">You can now</div>
      <div class="win-text">${capability}</div>
      ${opts && opts.action ? `<div class="action-step win-action"><span class="action-label">Do this now</span><span>${esc(opts.action)}</span></div>` : ""}
      ${next ? `<p class="win-next">${next}</p>` : ""}
      <div class="win-call-nudge">
        <span class="win-call-label">Want to walk through this live?</span>
        <a class="win-call-link" href="${BOOK_CALL_URL}" target="_blank" rel="noopener">Book a free 30-min growth call →</a>
      </div>
    </div>`;

  const promptCard = (id, dest, promptText, label) => `
    <div class="prompt-card">
      <div class="prompt-dest">Paste into: <strong>${dest}</strong></div>
      <div class="prompt-box" id="${id}">${esc(promptText)}</div>
      <button class="copy-btn" onclick="copyEl('${id}',this)">Copy ${label || "prompt"}</button>
      <div class="star-reminder">Fill in the <strong>[bracket fields]</strong> before sending. If the result is too long: <em>"Shorter. Simpler. Plain language."</em></div>
    </div>`;

  // ── WELCOME ─────────────────────────────────────────────────────
  let welcomeBullets = null;
  try { const p = JSON.parse(welcome); if (Array.isArray(p)) welcomeBullets = p; } catch {}
  const welcomeContent = welcomeBullets
    ? `<ul class="welcome-bullets">${welcomeBullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`
    : `<p class="welcome-body">${esc(welcome).replace(/\n\n/g,"</p><p class=\"welcome-body\">").replace(/\n/g,"<br/>")}</p>`;
  screens.push({ id: "welcome", module: 0, html: `
    <div class="welcome-shell">
      <div class="welcome-identity">
        ${logo ? `<img class="welcome-logo" src="${logo}" alt="${biz}" onerror="this.style.display='none'" style="mix-blend-mode:multiply;object-fit:contain"/>` : `<div class="welcome-biz-name">${biz}</div>`}
        <div class="welcome-tag">Custom AI Course</div>
      </div>
      <div class="welcome-stats">
        <div class="wstat"><span class="wstat-n">7</span><span class="wstat-l">Modules</span></div>
        <div class="wstat-div"></div>
        <div class="wstat"><span class="wstat-n">${prompts.length}</span><span class="wstat-l">Prompts</span></div>
        <div class="wstat-div"></div>
        <div class="wstat"><span class="wstat-n">✓</span><span class="wstat-l">Self-paced</span></div>
      </div>
      <div class="welcome-body-card gl">
        ${welcomeContent}
      </div>
    </div>` });

  // ── SETUP ────────────────────────────────────────────────────────
  screens.push({ id: "setup", module: 0, html: `
    <div class="screen-tag">Before you start</div>
    <h2 class="screen-title">Set up AI for ${biz}</h2>
    <p class="screen-desc">Create a workspace in Claude Projects or ChatGPT called <strong>${biz} Operating Brain</strong>. Paste this prompt in first to give AI everything it needs to know about your business.</p>
    ${promptCard("setup-brain","Claude Projects · ChatGPT · any new session", brain, "Business Brain")}
    <div class="setup-list">
      ${["Upload your logo, headshots, and brand images to the workspace","Paste your website copy into the chat","Tell AI what tools you use and what stays private"].map(s=>`<div class="setup-row"><span class="setup-dot"></span>${s}</div>`).join("")}
    </div>` });

  // ── MODULE MAP ───────────────────────────────────────────────────
  const modulesMeta = [
    { n:1, title:"AI Command Center",  desc:"Your Business Brain — paste it before every AI session" },
    { n:2, title:"Prompt Library",     desc:"Ten ready-to-use prompts built for your workflows" },
    { n:3, title:"Workflow Map",        desc:"What AI handles, what stays human, what to fix first" },
    { n:4, title:"Privacy Rules",       desc:"What should never go into any AI tool" },
    { n:5, title:"First Steps",         desc:"Eight actions to take this week to get started" },
    { n:6, title:"AI Tools Arsenal",    desc:"Six tools mapped to your exact business workflows" },
    { n:7, title:"Anthropic Training Library", desc:"19 free certified courses — Claude, MCP, agents, and AI fluency" },
  ];
  const modIcons = [
    `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>`,
    `<svg viewBox="0 0 24 24"><path d="M8 6h8M6 12h12M10 18h4"/></svg>`,
    `<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    `<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`,
    `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>`,
    `<svg viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  ];
  screens.push({ id: "module-map", module: 0, html: `
    <div class="mmap-header">
      <div class="mmap-dash-title">Course Dashboard</div>
      <div class="mmap-dash-sub">${biz} — 7 modules</div>
    </div>
    <div class="mmap-featured">
      <div class="mmap-card" onclick="jumpToModule(1)" id="mcard-1">
        <div class="mmap-row">
          <div class="mmap-left">
            <div class="mmap-num">Module 1</div>
            <div class="mmap-title" style="font-size:1.05rem">${modulesMeta[0].title}</div>
            <p style="font-size:.82rem;color:var(--sage);margin-bottom:14px;line-height:1.4">${modulesMeta[0].desc}</p>
            <button class="start-btn" onclick="event.stopPropagation();jumpToModule(1)">Start Lesson</button>
          </div>
          <div class="mmap-icon" style="width:44px;height:44px;align-self:flex-start">${modIcons[0]}</div>
        </div>
        <div class="mmap-progress-track" style="margin-top:14px"><div class="mmap-progress-fill" id="mp1" style="width:0%"></div></div>
      </div>
    </div>
    <div class="mmap-grid">
      ${modulesMeta.slice(1).map((m,i)=>`
        <div class="mmap-card" onclick="jumpToModule(${m.n})" id="mcard-${m.n}">
          <div class="mmap-row">
            <div class="mmap-left">
              <div class="mmap-num">Module ${m.n}</div>
              <div class="mmap-title">${m.title}</div>
              <div class="mmap-progress-track"><div class="mmap-progress-fill" id="mp${m.n}" style="width:0%"></div></div>
            </div>
            <div class="mmap-icon">${modIcons[i+1]}</div>
          </div>
        </div>`).join("")}
    </div>` });

  // ── MODULE 1: COMMAND CENTER ─────────────────────────────────────
  moduleStarts[1] = screens.length;
  screens.push({ id:"m1-intro", module:1, html:`
    <div class="module-intro-shell">
      <div class="mod-badge">01</div>
      <div class="screen-tag">Module 1</div>
      <h2 class="screen-title">Your AI Command Center</h2>
      <p class="screen-desc">This is the foundation. You'll create a reusable briefing that teaches AI everything about ${biz} — so every session starts from the right context.</p>
      <div class="lesson-list">
        ${lessonItem("Understand what the Business Brain does")}
        ${lessonItem("Copy your ready-to-use Business Brain prompt")}
        ${lessonItem("Know when and where to paste it")}
      </div>
    </div>` });

  screens.push({ id:"m1-hook", module:1, html:`
    <div class="screen-tag">Module 1 · Lesson 1</div>
    <h2 class="screen-title">The problem</h2>
    <div class="hook-card hook-bullets">
      <ul>
        <li>Every new AI session starts from zero — AI doesn't know your business</li>
        <li>You re-explain your context every single time</li>
        <li>The Business Brain fixes that with one paste</li>
        <li>After that, AI already knows ${biz}, your clients, your voice, and your rules</li>
      </ul>
    </div>
    <div class="tool-pills"><span class="tool-pill">Claude</span><span class="tool-pill">ChatGPT</span><span class="tool-pill">Any AI chat</span></div>
    <div class="concept-note"><span class="d-pill">Delegation</span><strong>Should AI do this?</strong> The Business Brain earns AI more delegation — by giving it the context to make good calls on your behalf.</div>` });

  screens.push({ id:"m1-prompt", module:1, html:`
    <div class="screen-tag">Module 1 · Lesson 2</div>
    <h2 class="screen-title">Your Business Brain</h2>
    <div class="prompt-what">Paste this once at the start of any new AI session — it gives Claude or ChatGPT full context about ${biz} so every response fits your brand, voice, and goals.</div>
    ${promptCard("m1-brain","Claude · ChatGPT · any new session", brain, "Business Brain")}
    <div class="action-step"><span class="action-label">Do this now</span><span>Open Claude or ChatGPT → start a new chat → paste this prompt → save it as a note or pinned message so it's always one tap away</span></div>` });

  screens.push({ id:"m1-win", module:1, html:winScreen(1,
    `Start every AI session with ${biz}'s full context already in place.`,
    "Next: five custom prompts built for your specific workflows.") });

  // ── MODULE 2: PROMPT LIBRARY ─────────────────────────────────────
  moduleStarts[2] = screens.length;
  screens.push({ id:"m2-intro", module:2, html:`
    <div class="module-intro-shell">
      <div class="mod-badge">02</div>
      <div class="screen-tag">Module 2</div>
      <h2 class="screen-title">Your Prompt Library</h2>
      <p class="screen-desc">${prompts.length} prompts built specifically for ${biz} — covering content, sales, operations, client service, and more. Fill in the [bracket fields] and paste into Claude or ChatGPT.</p>
      <div class="lesson-list">
        ${lessonItem(`${prompts.length} prompts across every business function`)}
        ${lessonItem("Always paste your Business Brain first")}
        ${lessonItem("Fill in the [bracket fields] before sending")}
      </div>
    </div>` });

  screens.push({ id:"m2-hook", module:2, html:`
    <div class="screen-tag">Module 2 · Lesson 1</div>
    <h2 class="screen-title">How to use these</h2>
    <div class="hook-card hook-bullets">
      <ul>
        <li>Generic prompts give generic results — these were built for ${biz}</li>
        <li>Copy the prompt, fill in the [bracket fields], paste it</li>
        <li>See what comes back — then improve from there</li>
        <li>Do the simple version first before making it fancy</li>
      </ul>
    </div>
    <div class="tool-pills"><span class="tool-pill">Claude</span><span class="tool-pill">ChatGPT</span></div>
    <div class="concept-note"><span class="d-pill">Description</span><strong>Am I communicating clearly?</strong> Clear prompts have three parts: what you want, how you want it done, and what a good result looks like.</div>` });

  (prompts).forEach((p, i) => {
    screens.push({ id:`m2-p${i}`, module:2, html:`
      <div class="screen-tag">Module 2 · Prompt ${i+1} of ${prompts.length}</div>
      <h2 class="screen-title">${esc(p.title)}</h2>
      ${p.what ? `<div class="prompt-what">${esc(p.what)}</div>` : ''}
      ${promptCard(`p${i}`,"Claude · ChatGPT (after your Business Brain)", p.prompt, "prompt")}
      <div class="action-step"><span class="action-label">Do this now</span><span>Open Claude or ChatGPT → paste your Business Brain first → paste this prompt → fill in the [bracket fields] → send it</span></div>` });
  });

  screens.push({ id:"m2-win", module:2, html:winScreen(2,
    `Run any of your ${prompts.length} custom prompts and get results specific to ${biz}.`,
    "Next: a map of what AI handles in your business, what stays human, and what to improve first.",
    {action:"Pick one prompt from this module, run it in Claude right now, and see what comes back."}) });

  // ── MODULE 3: WORKFLOW MAP ────────────────────────────────────────
  moduleStarts[3] = screens.length;
  screens.push({ id:"m3-intro", module:3, html:`
    <div class="module-intro-shell">
      <div class="mod-badge">03</div>
      <div class="screen-tag">Module 3</div>
      <h2 class="screen-title">Your Workflow Map</h2>
      <p class="screen-desc">This module shows exactly where AI fits into ${biz} — what it can draft, what stays human, and what to tackle first.</p>
      <div class="lesson-list">
        ${lessonItem("See what AI can handle right now")}
        ${lessonItem("Know what should always stay human")}
        ${lessonItem("Know what to improve first")}
      </div>
    </div>` });

  screens.push({ id:"m3-hook", module:3, html:`
    <div class="screen-tag">Module 3 · Lesson 1</div>
    <h2 class="screen-title">What AI is good at</h2>
    <div class="hook-card hook-bullets">
      <ul>
        <li>Not everything in your business should be automated</li>
        <li>AI is good at drafting, summarizing, and generating options</li>
        <li>Some things need your judgment, relationships, and expertise</li>
        <li>This map shows exactly what's what for ${biz}</li>
      </ul>
    </div>
    <div class="concept-note"><span class="d-pill">Discernment</span><strong>Is this output trustworthy?</strong> AI can hallucinate — state wrong information confidently. Always check AI outputs before they reach a client.</div>` });

  screens.push({ id:"m3-map", module:3, html:`
    <div class="screen-tag">Module 3 · Your Map</div>
    <h2 class="screen-title">AI in ${biz}</h2>
    <div class="wmap-grid">
      <div class="wmap-col">
        <div class="wmap-col-title">AI handles this</div>
        <ul>${(map.ai||[]).map(i=>`<li>${esc(i)}</li>`).join("")}</ul>
      </div>
      <div class="wmap-col">
        <div class="wmap-col-title">You handle this</div>
        <ul>${(map.human||[]).map(i=>`<li>${esc(i)}</li>`).join("")}</ul>
      </div>
      <div class="wmap-col wmap-improve">
        <div class="wmap-col-title">Improve first</div>
        <ul>${(map.improve||[]).map(i=>`<li>${esc(i)}</li>`).join("")}</ul>
      </div>
    </div>` });

  screens.push({ id:"m3-win", module:3, html:winScreen(3,
    `See exactly where AI fits into ${biz} — and where it doesn't belong.`,
    "Next: your privacy rules — what should never go into any AI tool.",
    {action:"Look at your Improve First column — pick one item and open Claude. Describe the problem and ask it to help you build a simple process."}) });

  // ── MODULE 4: PRIVACY ─────────────────────────────────────────────
  moduleStarts[4] = screens.length;
  screens.push({ id:"m4-intro", module:4, html:`
    <div class="module-intro-shell">
      <div class="mod-badge">04</div>
      <div class="screen-tag">Module 4</div>
      <h2 class="screen-title">Your Privacy Rules</h2>
      <p class="screen-desc">Before you go further, know what should never be shared with any AI tool. These rules are specific to ${biz} and your clients.</p>
      <div class="lesson-list">
        ${lessonItem("Understand what stays private")}
        ${lessonItem("Know your client data rules")}
        ${lessonItem("Build a habit of checking before pasting")}
      </div>
    </div>` });

  screens.push({ id:"m4-hook", module:4, html:`
    <div class="screen-tag">Module 4 · Lesson 1</div>
    <h2 class="screen-title">What to protect</h2>
    <div class="hook-card hook-bullets">
      <ul>
        <li>AI is a third-party system — what you paste can be seen</li>
        <li>Public AI tools may use your inputs to improve their models</li>
        <li>Client data, financial details, and private records should never go in</li>
        <li>Know what stays private before you start automating anything</li>
      </ul>
    </div>
    <div class="concept-note"><span class="d-pill">Diligence</span><strong>Am I responsible for this?</strong> You're accountable for what AI produces on your behalf. Verify outputs, keep client data private, and disclose AI use when appropriate.</div>` });

  screens.push({ id:"m4-rules", module:4, html:`
    <div class="screen-tag">Module 4 · Your Rules</div>
    <h2 class="screen-title">What stays private at ${biz}</h2>
    <p class="screen-desc">Print this or save it somewhere easy to check before pasting anything into AI.</p>
    <div class="rules-card">
      <ul class="rules-list">${(rules).map(r=>`<li><span class="rule-x">×</span><span>${esc(r)}</span></li>`).join("")}</ul>
    </div>` });

  screens.push({ id:"m4-win", module:4, html:winScreen(4,
    `Use AI confidently knowing exactly what stays private at ${biz}.`,
    "Last module: eight concrete actions to take this week.",
    {action:"Share your privacy rules with anyone at your business who uses AI. Screenshot it or drop it in a team Slack/group chat."}) });

  // ── MODULE 5: FIRST STEPS ─────────────────────────────────────────
  moduleStarts[5] = screens.length;
  screens.push({ id:"m5-intro", module:5, html:`
    <div class="module-intro-shell">
      <div class="mod-badge">05</div>
      <div class="screen-tag">Module 5</div>
      <h2 class="screen-title">Your First Steps</h2>
      <p class="screen-desc">Eight concrete actions specific to ${biz}. Try one at a time. Keep what helps. Come back to the rest later.</p>
      <div class="lesson-list">
        ${lessonItem("Eight actions, one at a time")}
        ${lessonItem("Start with the manual version first")}
        ${lessonItem("Test, then improve from there")}
      </div>
    </div>` });

  screens.push({ id:"m5-hook", module:5, html:`
    <div class="screen-tag">Module 5 · Lesson 1</div>
    <h2 class="screen-title">How to start</h2>
    <div class="hook-card hook-bullets">
      <ul>
        <li>Start with the manual version of every workflow</li>
        <li>See if AI actually helps before scaling it</li>
        <li>Keep what works, skip what doesn't</li>
        <li>One step at a time — you don't have to automate everything today</li>
      </ul>
    </div>` });

  screens.push({ id:"m5-checklist", module:5, html:`
    <div class="screen-tag">Module 5 · Your Checklist</div>
    <h2 class="screen-title">This week at ${biz}</h2>
    <p class="screen-desc">Tap each item to check it off as you go. Progress is saved.</p>
    <ul class="check-list" id="check-list">
      ${(checklist).map((s,i)=>`
        <li class="check-item" id="ci${i}" onclick="toggleCheck(${i})">
          <div class="check-box" id="cb${i}"></div>
          <span>${esc(s.replace(/^step\s*\d+[:.]\s*/i,""))}</span>
        </li>`).join("")}
    </ul>` });

  // ── MODULE 6: AI TOOLS ARSENAL ───────────────────────────────────
  moduleStarts[6] = screens.length;
  screens.push({ id:"m6-intro", module:6, html:`
    <div class="module-intro-shell">
      <div class="mod-badge">06</div>
      <div class="screen-tag">Module 6</div>
      <h2 class="screen-title">Your AI Tools Arsenal</h2>
      <p class="screen-desc">Six AI tools selected specifically for ${biz}. Each one mapped to a workflow you actually have — with a power tip to get results today.</p>
      <div class="lesson-list">
        ${lessonItem("Six tools chosen for your exact business")}
        ${lessonItem("Know which tool to reach for and when")}
        ${lessonItem("One power tip per tool — use it today")}
      </div>
    </div>` });

  screens.push({ id:"m6-hook", module:6, html:`
    <div class="screen-tag">Module 6 · Lesson 1</div>
    <h2 class="screen-title">Choosing the right tool</h2>
    <div class="hook-card hook-bullets">
      <ul>
        <li>Not every task needs Claude — some tools are built for one thing and do it brilliantly</li>
        <li>The wrong tool wastes time; the right tool replaces an hour of work in minutes</li>
        <li>Use Claude and ChatGPT for thinking, writing, and complex tasks</li>
        <li>Use specialist tools (Fireflies, Gamma, ElevenLabs) when the job has one clear output</li>
      </ul>
    </div>
    <div class="concept-note"><span class="d-pill">Delegation</span><strong>Right task, right tool.</strong> The 4 D's apply here: Delegate the right job to the right AI — don't use a hammer for every nail.</div>` });

  screens.push({ id:"m6-tools", module:6, html:`
    <div class="screen-tag">Module 6 · Your Arsenal</div>
    <h2 class="screen-title">Tools for ${biz}</h2>
    <p class="screen-desc">Selected for your workflows. Each tip is a prompt you can run today.</p>
    <div class="tool-grid">
      ${tools.length ? tools.map(t=>`
        <div class="tool-card">
          <div class="tool-card-head">
            <div class="tool-card-name">${esc(t.tool)}</div>
            <div class="tool-card-cat">${esc(t.category)}</div>
          </div>
          <div class="tool-card-use">${esc(t.use)}</div>
          <div class="tool-card-tip"><strong>Try today:</strong> ${esc(t.tip)}</div>
        </div>`).join("") : `<p class="no-study">Tool recommendations loading on next course generation.</p>`}
    </div>` });

  screens.push({ id:"m6-win", module:6, html:winScreen(6,
    `Use the right AI tool for every task at ${biz} — not just one.`,
    "Next: 19 free Anthropic certified courses to go deeper.") });

  // ── MODULE 7: ANTHROPIC TRAINING LIBRARY ─────────────────────────
  moduleStarts[7] = screens.length;
  screens.push({ id:"m7-intro", module:7, html:`
    <div class="module-intro-shell">
      <div class="mod-badge">07</div>
      <div class="screen-tag">Module 7</div>
      <h2 class="screen-title">Anthropic Training Library</h2>
      <p class="screen-desc">19 free, certified courses from Anthropic covering Claude, MCP, agent systems, and AI fluency. Available at Anthropic Academy — no cost, no catch.</p>
      <div class="lesson-list">
        ${lessonItem("19 courses across 6 categories")}
        ${lessonItem("Free with optional certificates")}
        ${lessonItem("Self-paced — start anywhere, finish at your own speed")}
      </div>
    </div>` });

  screens.push({ id:"m7-hook", module:7, html:`
    <div class="screen-tag">Module 7 · Lesson 1</div>
    <h2 class="screen-title">Why go deeper</h2>
    <div class="hook-card hook-bullets">
      <ul>
        <li>Most people use 5% of what Claude can actually do</li>
        <li>Anthropic's free courses unlock the rest — systematically</li>
        <li>Start with Claude 101, finish with Building with the Claude API</li>
        <li>Each course takes 30–120 minutes and earns a certificate</li>
      </ul>
    </div>
    <div class="tool-pills"><span class="tool-pill">100% Free</span><span class="tool-pill">Self-paced</span><span class="tool-pill">Certified</span></div>
    <div class="concept-note"><span class="d-pill">Diligence</span><strong>Invest 2 hours.</strong> Claude 101 alone will change how you use AI every day. The AI Fluency: Small Business course adds a framework that applies across your entire operation.</div>` });

  screens.push({ id:"m7-courses", module:7, html:`
    <div class="screen-tag">Module 7 · All Courses</div>
    <h2 class="screen-title">19 Free Courses</h2>
    <p class="screen-desc">Tap any course to open it. Start with <strong>Claude 101</strong> if you're new — or jump to whatever fits your goals.</p>

    <div class="anthro-section">
      <div class="anthro-section-lbl">General Claude · 3 courses</div>
      <div class="anthro-courses">
        <a class="anthro-card" href="https://anthropic.skilljar.com/claude-101" target="_blank">
          <span class="anthro-card-num">01</span>
          <div class="anthro-card-body"><div class="anthro-card-title">Claude 101</div><div class="anthro-card-desc">Core features, Projects, Artifacts, Skills, Enterprise Search.</div></div>
          <span class="anthro-card-badge anthro-badge-free">Free + Cert</span>
        </a>
        <a class="anthro-card" href="https://anthropic.skilljar.com/introduction-to-claude-cowork" target="_blank">
          <span class="anthro-card-num">02</span>
          <div class="anthro-card-body"><div class="anthro-card-title">Claude Cowork</div><div class="anthro-card-desc">Files, plugins, task loops, Chrome, Microsoft 365.</div></div>
          <span class="anthro-card-badge anthro-badge-free">Free</span>
        </a>
        <a class="anthro-card" href="https://anthropic.skilljar.com/claude-code-101" target="_blank">
          <span class="anthro-card-num">03</span>
          <div class="anthro-card-body"><div class="anthro-card-title">Claude Code 101</div><div class="anthro-card-desc">Agentic loops, Plan Mode, Subagents, MCP, Hooks.</div></div>
          <span class="anthro-card-badge anthro-badge-free">Free</span>
        </a>
      </div>
    </div>

    <div class="anthro-section">
      <div class="anthro-section-lbl">Developer / API · 5 courses</div>
      <div class="anthro-courses">
        <a class="anthro-card" href="https://anthropic.skilljar.com/claude-platform-101" target="_blank">
          <span class="anthro-card-num">04</span>
          <div class="anthro-card-body"><div class="anthro-card-title">Claude Platform 101</div><div class="anthro-card-desc">API requests, agent loops, tool use, extended thinking, managed agents.</div></div>
          <span class="anthro-card-badge anthro-badge-dev">Dev</span>
        </a>
        <a class="anthro-card" href="https://anthropic.skilljar.com/claude-code-in-action" target="_blank">
          <span class="anthro-card-num">05</span>
          <div class="anthro-card-body"><div class="anthro-card-title">Claude Code in Action</div><div class="anthro-card-desc">Context management, custom commands, GitHub, SDK.</div></div>
          <span class="anthro-card-badge anthro-badge-dev">Dev</span>
        </a>
        <a class="anthro-card" href="https://anthropic.skilljar.com/claude-with-the-anthropic-api" target="_blank">
          <span class="anthro-card-num">06</span>
          <div class="anthro-card-body"><div class="anthro-card-title">Building with the Claude API</div><div class="anthro-card-desc">RAG, tool use, prompt caching, agents, Computer Use. Python hands-on.</div></div>
          <span class="anthro-card-badge anthro-badge-dev">Dev</span>
        </a>
        <a class="anthro-card" href="https://anthropic.skilljar.com/claude-in-amazon-bedrock" target="_blank">
          <span class="anthro-card-num">07</span>
          <div class="anthro-card-body"><div class="anthro-card-title">Claude on Amazon Bedrock</div><div class="anthro-card-desc">AWS-accredited. RAG, tool use, extended reasoning, MCP on Bedrock.</div></div>
          <span class="anthro-card-badge anthro-badge-dev">AWS</span>
        </a>
        <a class="anthro-card" href="https://anthropic.skilljar.com/claude-with-google-vertex" target="_blank">
          <span class="anthro-card-num">08</span>
          <div class="anthro-card-body"><div class="anthro-card-title">Claude on Vertex AI</div><div class="anthro-card-desc">GCP. Vision, PDF processing, prompt caching, agent workflows.</div></div>
          <span class="anthro-card-badge anthro-badge-dev">GCP</span>
        </a>
      </div>
    </div>

    <div class="anthro-section">
      <div class="anthro-section-lbl">Model Context Protocol · 2 courses</div>
      <div class="anthro-courses">
        <a class="anthro-card" href="https://anthropic.skilljar.com/introduction-to-model-context-protocol" target="_blank">
          <span class="anthro-card-num">09</span>
          <div class="anthro-card-body"><div class="anthro-card-title">Intro to MCP</div><div class="anthro-card-desc">Build MCP servers and clients with Python. Tools, resources, prompts.</div></div>
          <span class="anthro-card-badge anthro-badge-mcp">MCP</span>
        </a>
        <a class="anthro-card" href="https://anthropic.skilljar.com/model-context-protocol-advanced-topics" target="_blank">
          <span class="anthro-card-num">10</span>
          <div class="anthro-card-body"><div class="anthro-card-title">MCP Advanced Topics</div><div class="anthro-card-desc">Sampling, notifications, transport, production scaling.</div></div>
          <span class="anthro-card-badge anthro-badge-mcp">MCP</span>
        </a>
      </div>
    </div>

    <div class="anthro-section">
      <div class="anthro-section-lbl">Agent Systems · 2 courses</div>
      <div class="anthro-courses">
        <a class="anthro-card" href="https://anthropic.skilljar.com/introduction-to-agent-skills" target="_blank">
          <span class="anthro-card-num">11</span>
          <div class="anthro-card-body"><div class="anthro-card-title">Agent Skills</div><div class="anthro-card-desc">Build reusable markdown instructions Claude applies automatically.</div></div>
          <span class="anthro-card-badge anthro-badge-free">Free</span>
        </a>
        <a class="anthro-card" href="https://anthropic.skilljar.com/introduction-to-subagents" target="_blank">
          <span class="anthro-card-num">12</span>
          <div class="anthro-card-body"><div class="anthro-card-title">Subagents</div><div class="anthro-card-desc">Delegate tasks, manage context, design structured outputs.</div></div>
          <span class="anthro-card-badge anthro-badge-free">Free</span>
        </a>
      </div>
    </div>

    <div class="anthro-section">
      <div class="anthro-section-lbl">AI Fluency · 7 courses</div>
      <div class="anthro-courses">
        <a class="anthro-card" href="https://anthropic.skilljar.com/ai-fluency-framework-foundations" target="_blank">
          <span class="anthro-card-num">13</span>
          <div class="anthro-card-body"><div class="anthro-card-title">AI Fluency: Framework</div><div class="anthro-card-desc">The 4D Framework — Delegation, Description, Discernment, Diligence.</div></div>
          <span class="anthro-card-badge anthro-badge-free">Free + Cert</span>
        </a>
        <a class="anthro-card" href="https://anthropic.skilljar.com/ai-capabilities-and-limitations" target="_blank">
          <span class="anthro-card-num">14</span>
          <div class="anthro-card-body"><div class="anthro-card-title">AI Capabilities &amp; Limits</div><div class="anthro-card-desc">How AI thinks, knowledge limits, working memory, steerability.</div></div>
          <span class="anthro-card-badge anthro-badge-free">Free</span>
        </a>
        <a class="anthro-card" href="https://anthropic.skilljar.com/ai-fluency-for-small-businesses" target="_blank">
          <span class="anthro-card-num">15</span>
          <div class="anthro-card-body"><div class="anthro-card-title">AI Fluency: Small Business</div><div class="anthro-card-desc">Practical AI for owner-operators. Built with PayPal.</div></div>
          <span class="anthro-card-badge anthro-badge-free">Free + Cert</span>
        </a>
        <a class="anthro-card" href="https://anthropic.skilljar.com/ai-fluency-for-nonprofits" target="_blank">
          <span class="anthro-card-num">16</span>
          <div class="anthro-card-body"><div class="anthro-card-title">AI Fluency: Nonprofits</div><div class="anthro-card-desc">Fundraising, communications, program delivery, operations.</div></div>
          <span class="anthro-card-badge anthro-badge-free">Free</span>
        </a>
        <a class="anthro-card" href="https://anthropic.skilljar.com/ai-fluency-for-educators" target="_blank">
          <span class="anthro-card-num">17</span>
          <div class="anthro-card-body"><div class="anthro-card-title">AI Fluency: Educators</div><div class="anthro-card-desc">Apply AI into teaching practice, course design, learning outcomes.</div></div>
          <span class="anthro-card-badge anthro-badge-free">Free + Cert</span>
        </a>
        <a class="anthro-card" href="https://anthropic.skilljar.com/ai-fluency-for-students" target="_blank">
          <span class="anthro-card-num">18</span>
          <div class="anthro-card-body"><div class="anthro-card-title">AI Fluency: Students</div><div class="anthro-card-desc">AI competency for academic performance and career planning.</div></div>
          <span class="anthro-card-badge anthro-badge-free">Free + Cert</span>
        </a>
        <a class="anthro-card" href="https://anthropic.skilljar.com/teaching-ai-fluency" target="_blank">
          <span class="anthro-card-num">19</span>
          <div class="anthro-card-body"><div class="anthro-card-title">Teaching AI Fluency</div><div class="anthro-card-desc">Teach and assess the 4D Framework in instructor-led settings.</div></div>
          <span class="anthro-card-badge anthro-badge-free">Free + Cert</span>
        </a>
      </div>
    </div>

    <div class="action-step" style="margin-top:20px"><span class="action-label">Start here</span><span>Go to <strong>anthropic.com/learn</strong> → enroll in Claude 101 → complete it this week. It takes about 45 minutes and comes with a certificate.</span></div>` });

  screens.push({ id:"m7-win", module:7, html:winScreen(7,
    "Access 19 free Anthropic certified courses — and know exactly where to start.",
    "You've completed all seven modules. See your full summary below.") });

  // ── GRADUATION ───────────────────────────────────────────────────
  screens.push({ id:"grad", module:0, html:`
    <div class="grad-shell">
      ${logo ? `<img src="${logo}" alt="${biz}" class="grad-logo" onerror="this.style.display='none'" style="mix-blend-mode:multiply;object-fit:contain"/>` : `<div class="grad-biz-name">${biz}</div>`}
      <div class="grad-headline">Course complete.</div>
      <p class="grad-sub">You now have a complete AI starter system for ${biz}.</p>
      <div class="grad-list">
        <div class="grad-item"><span class="gi-check">✓</span>Business Brain ready to use</div>
        <div class="grad-item"><span class="gi-check">✓</span>${prompts.length} custom prompts across every function</div>
        <div class="grad-item"><span class="gi-check">✓</span>Workflow map showing what AI handles</div>
        <div class="grad-item"><span class="gi-check">✓</span>Privacy rules for ${biz}</div>
        <div class="grad-item"><span class="gi-check">✓</span>First-steps checklist to start this week</div>
        <div class="grad-item"><span class="gi-check">✓</span>${tools.length || 6} AI tools mapped to your workflows</div>
        <div class="grad-item"><span class="gi-check">✓</span>19 Anthropic certified courses — your path to go deeper</div>
      </div>
      <div class="concept-note" style="text-align:left;margin-bottom:20px">You've now built the four pillars of AI fluency at ${biz}: <strong>Delegation</strong> (what to hand off), <strong>Description</strong> (how to communicate clearly), <strong>Discernment</strong> (what to trust), and <strong>Diligence</strong> (what you're accountable for).</div>
      <div class="grad-call-card">
        <div class="grad-call-eyebrow">Ready to go deeper?</div>
        <div class="grad-call-headline">Book a free AI Growth Call</div>
        <p class="grad-call-desc">30 minutes with Kelty. We'll review your course, map your next automation wins, and build a 90-day AI roadmap for ${esc(biz)}.</p>
        <a class="grad-call-btn" href="${BOOK_CALL_URL}" target="_blank" rel="noopener">Book My Growth Call →</a>
        <p class="grad-call-note">Free · No commitment · Spots limited</p>
      </div>
      <button class="btn-map" onclick="goTo(2)">Back to course map</button>
    </div>` });

  return { screens, moduleStarts, slug, checklistLen: checklist.length };
}

// ── CSS ──────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --olive:#1C412C;--olive-mid:#3a5e45;--sage:#7A9C78;--sage-light:#a8c8a4;
  --neon:#00F057;--paper:#FFFFFF;--sand:#F2F8F3;--sand2:#E8F3EA;--line:#D2E4D5;
  --text:#1A1A1A;--text-mid:#556067;
  --display:"Bebas Neue",Impact,"Arial Narrow",sans-serif;
  --body:"Hanken Grotesk",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  --mono:"JetBrains Mono",ui-monospace,monospace;
  --r:16px;
}
html,body{height:100%;height:100dvh}
body{font-family:var(--body);background:var(--paper);color:var(--text);-webkit-font-smoothing:antialiased;overflow:hidden}
body::before{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;background:linear-gradient(180deg,rgba(232,243,234,.82),rgba(255,255,255,0) 44%)}

/* APP SHELL */
.app{position:relative;z-index:1;display:flex;flex-direction:column;height:100vh;height:100dvh;max-width:600px;margin:0 auto;background:transparent}

/* TOP BAR */
.top{flex-shrink:0;display:flex;align-items:center;gap:8px;padding:12px 20px 10px;border-bottom:1px solid var(--line);background:rgba(255,255,255,.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);z-index:50}
.top-logo{height:28px;width:auto;mix-blend-mode:multiply;object-fit:contain;max-width:90px;flex-shrink:0}
.top-biz{font-family:var(--display);font-weight:700;font-size:13px;color:var(--text);max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:0}
.top-where{font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-weight:600;color:var(--sage);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:0 1 auto;min-width:0}
.ptrack{flex:1;height:7px;border-radius:99px;background:#DDE8DE;overflow:hidden;min-width:20px}
.pfill{height:100%;width:0%;border-radius:99px;background:linear-gradient(90deg,var(--sage),var(--olive));transition:width .55s cubic-bezier(.2,.8,.2,1)}
.pts-badge{flex-shrink:0;font-size:12px;font-weight:600;color:var(--text);background:var(--sand);border:1px solid var(--line);border-radius:99px;padding:5px 11px;white-space:nowrap}
.pts-badge.bump{animation:ptsbump .4s ease}
@keyframes ptsbump{0%,100%{transform:scale(1)}40%{transform:scale(1.2)}}
.btn-mods{flex-shrink:0;border:1px solid var(--line);background:var(--paper);color:var(--olive);cursor:pointer;font-family:var(--body);font-size:12px;font-weight:700;padding:6px 12px;border-radius:99px;white-space:nowrap;transition:background .15s}
.btn-mods:active{background:var(--sand)}

/* MODE BAR */
.mode-bar{flex-shrink:0;display:none;gap:5px;align-items:center;padding:6px 12px;border-bottom:1.5px solid var(--line);background:var(--sand);flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.mode-bar::-webkit-scrollbar{display:none}
.mode-btn{flex-shrink:0;padding:6px 12px;min-height:34px;border-radius:99px;font-size:.75rem;font-weight:700;border:1.5px solid transparent;background:transparent;color:var(--sage);cursor:pointer;transition:all .18s;font-family:inherit;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.mode-btn svg{width:11px;height:11px;stroke:currentColor;fill:none;stroke-width:2}
.mode-btn.active{background:var(--olive);color:#fff;border-color:var(--text)}

/* MAIN */
.course-main{flex:1 1 0;overflow-y:auto;overflow-x:hidden;min-height:0;-webkit-overflow-scrolling:touch;background:transparent}
.stage{max-width:600px;margin:0 auto;padding:28px 22px 52px}

/* SCREENS */
.screen{display:none}
.screen.active{display:block}
.screen.anim-right{animation:sInR .32s cubic-bezier(.16,1,.3,1)}
.screen.anim-left{animation:sInL .32s cubic-bezier(.16,1,.3,1)}
@keyframes sInR{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:none}}
@keyframes sInL{from{opacity:0;transform:translateY(-18px) scale(.98)}to{opacity:1;transform:none}}

/* DOTS */
.dots{flex-shrink:0;display:flex;justify-content:center;align-items:center;gap:6px;padding:6px 16px 2px;min-height:24px}
.dot{width:6px;height:6px;border-radius:50%;background:var(--line);transition:all .25s;flex-shrink:0}
.dot.active{background:var(--olive);width:18px;border-radius:3px}
.dot.visited{background:var(--sage)}

/* NAV */
.nav{flex-shrink:0;display:flex;align-items:center;gap:12px;padding:10px 20px calc(18px + env(safe-area-inset-bottom,0px));background:rgba(255,255,255,.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-top:1px solid var(--line)}
.nav-back{background:none;border:none;cursor:pointer;color:var(--text-mid);font-family:var(--body);font-size:1rem;font-weight:600;padding:12px 6px;min-width:52px;text-align:left;transition:color .15s}
.nav-back:active{color:var(--text)}
.nav-next{flex:1;background:var(--olive);color:#fff;border:none;border-radius:99px;font-family:var(--body);font-weight:700;font-size:1.08rem;padding:16px 24px;cursor:pointer;transition:transform .16s ease,background .16s ease,box-shadow .16s ease;box-shadow:0 8px 22px rgba(28,65,44,.32);text-align:center;touch-action:manipulation;-webkit-tap-highlight-color:transparent;letter-spacing:-.01em}
.nav-next:hover{background:var(--olive-mid);transform:translateY(-2px);box-shadow:0 12px 28px rgba(28,65,44,.36)}
.nav-next:active{transform:scale(.97);box-shadow:0 4px 12px rgba(28,65,44,.2)}
.btn-mode-back{display:none;width:100%;padding:14px 24px;background:var(--paper);border:1px solid var(--line);color:var(--text);font-family:var(--body);font-size:.95rem;font-weight:700;border-radius:99px;cursor:pointer;touch-action:manipulation}

/* GLASS CARD (legacy compat) */
.gl{background:var(--sand);border:1.5px solid var(--line);border-radius:var(--r)}

/* TYPOGRAPHY */
.screen-tag{font-family:var(--mono);font-size:.58rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--olive);background:var(--paper);border:1px solid var(--line);padding:4px 12px;border-radius:99px;display:inline-block;margin-bottom:16px}
.screen-title{font-family:var(--display);font-size:clamp(2rem,6.5vw,2.8rem);font-weight:800;letter-spacing:-.01em;line-height:1.08;margin-bottom:14px;color:var(--text)}
.screen-desc{font-size:1rem;color:var(--text-mid);line-height:1.7;margin-bottom:22px}

/* WELCOME */
.welcome-shell{padding:16px 0 8px}
.welcome-identity{margin-bottom:22px}
.welcome-logo{height:60px;width:auto;margin-bottom:10px;mix-blend-mode:multiply;object-fit:contain}
.welcome-tag{font-size:.62rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--sage);margin-top:6px}
.welcome-biz-name{font-family:var(--display);font-size:clamp(1.8rem,6vw,2.4rem);font-weight:800;letter-spacing:-.01em;color:var(--text);margin-bottom:4px;line-height:1.08}
.welcome-stats{display:flex;align-items:center;border:1px solid var(--line);border-radius:var(--r);padding:16px 18px;margin-bottom:20px;background:var(--paper);box-shadow:0 2px 8px rgba(28,65,44,.05)}
.wstat{display:flex;flex-direction:column;align-items:center;flex:1}
.wstat-n{font-family:var(--display);font-size:1.75rem;font-weight:800;color:var(--text);letter-spacing:-.04em;line-height:1}
.wstat-l{font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--sage);margin-top:4px}
.wstat-div{width:1px;height:32px;background:var(--line);flex-shrink:0;margin:0 6px}
.welcome-body-card{padding:18px 20px;margin-bottom:6px}
.welcome-body{font-size:.95rem;color:var(--text-mid);line-height:1.75;margin:0}
.welcome-body+.welcome-body{margin-top:12px}
.welcome-bullets{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
.welcome-bullets li{font-size:.95rem;color:var(--text-mid);line-height:1.55;padding-left:20px;position:relative}
.welcome-bullets li::before{content:"—";position:absolute;left:0;color:var(--sage);font-weight:600}

/* SETUP */
.setup-list{margin-top:16px;display:flex;flex-direction:column;gap:8px}
.setup-row{display:flex;align-items:flex-start;gap:10px;font-size:.9rem;color:var(--text-mid);line-height:1.55;padding:13px 15px;background:var(--paper);border:1px solid var(--line);border-radius:12px}
.setup-dot{width:7px;height:7px;border-radius:50%;background:var(--olive);flex-shrink:0;margin-top:6px}

/* MODULE MAP (dashboard) */
.mmap-header{margin-bottom:18px}
.mmap-dash-title{font-family:var(--display);font-size:1.6rem;font-weight:800;color:var(--text);letter-spacing:-.01em;margin-bottom:4px}
.mmap-dash-sub{font-size:.88rem;color:var(--sage);font-weight:500}
.mmap-featured{margin-bottom:12px}
.mmap-featured .mmap-card{padding:20px 18px 16px}
.mmap-featured .mmap-title{font-weight:700;margin-bottom:10px}
.mmap-featured .start-btn{display:inline-block;background:var(--olive);color:#fff;font-size:.82rem;font-weight:700;padding:9px 20px;border-radius:99px;cursor:pointer;font-family:inherit;border:none;transition:background .15s}
.mmap-featured .start-btn:hover{background:var(--olive-mid)}
.mmap-grid{display:flex;flex-direction:column;gap:8px}
.mmap-card{background:var(--paper);border:1px solid var(--line);border-radius:var(--r);padding:14px 16px;cursor:pointer;transition:border-color .18s,box-shadow .18s;position:relative}
.mmap-card:hover{box-shadow:0 4px 16px rgba(28,65,44,.08)}
.mmap-card:active{background:var(--sand)}
.mmap-card.done{border-color:var(--sage-light);background:var(--sand)}
.mmap-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.mmap-left{flex:1;min-width:0}
.mmap-num{font-family:var(--display);font-style:italic;font-size:1.3rem;color:var(--olive);opacity:.7;line-height:1;margin-bottom:4px}
.mmap-title{font-family:var(--display);font-size:1.05rem;color:var(--text);margin-bottom:8px;line-height:1.15;letter-spacing:.02em}
.mmap-progress-track{height:3px;background:var(--line);border-radius:99px;overflow:hidden}
.mmap-progress-fill{height:3px;background:var(--olive);border-radius:99px;transition:width .4s}
.mmap-card.done .mmap-progress-fill{background:var(--olive)}
.mmap-icon{width:36px;height:36px;flex-shrink:0;background:var(--sand);border:1px solid var(--line);border-radius:10px;display:flex;align-items:center;justify-content:center}
.mmap-icon svg{width:16px;height:16px;stroke:var(--sage);fill:none;stroke-width:1.8}

/* MODULE INTRO */
.module-intro-shell{padding-bottom:8px}
.mod-badge{font-family:var(--display);font-style:italic;font-size:5.5rem;font-weight:800;color:var(--olive);opacity:.2;line-height:1;margin-bottom:10px;letter-spacing:-.02em}
.lesson-list{margin-top:18px;display:flex;flex-direction:column;gap:9px}
.lesson-item{display:flex;align-items:center;gap:12px;font-size:.92rem;color:var(--text-mid);padding:13px 16px;background:var(--paper);border:1px solid var(--line);border-radius:14px;box-shadow:0 1px 4px rgba(28,65,44,.04)}
.li-dot{width:8px;height:8px;border-radius:50%;background:var(--olive);flex-shrink:0;box-shadow:0 0 0 3px var(--sand)}

/* HOOK CARD */
.hook-card{background:var(--paper);border:1px solid var(--line);border-left:2.5px solid var(--olive);border-radius:0 18px 18px 0;padding:20px 18px;font-size:.95rem;color:var(--text-mid);line-height:1.7;margin-bottom:18px;box-shadow:0 2px 8px rgba(28,65,44,.05)}
.hook-bullets ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:14px}
.hook-bullets li{padding-left:22px;position:relative;font-size:.95rem;line-height:1.55;color:var(--text-mid)}
.hook-bullets li::before{content:"";position:absolute;left:0;top:7px;width:8px;height:8px;border-radius:50%;background:var(--olive);box-shadow:0 0 0 3px var(--sand)}
.tool-pills{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}
.tool-pill{font-size:.72rem;font-weight:600;color:var(--text);background:var(--sand);border:1px solid var(--line);padding:5px 12px;border-radius:99px}

/* PROMPT CARD */
.prompt-what{font-size:.95rem;color:var(--text-mid);line-height:1.65;margin-bottom:14px;padding:13px 16px;background:var(--sand);border-left:2.5px solid var(--olive);border-radius:0 12px 12px 0}
.prompt-card{background:var(--paper);border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:0 2px 12px rgba(28,65,44,.06)}
.prompt-dest{font-size:.62rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--sage);margin-bottom:12px}
.prompt-dest strong{color:var(--olive)}
.prompt-box{background:#F8FCF8;border:1px solid var(--line);border-left:2.5px solid var(--olive);border-radius:0 12px 12px 0;padding:16px 18px;font-family:var(--body);font-size:.95rem;color:var(--text);white-space:pre-wrap;line-height:1.65;max-height:min(42dvh,280px);overflow-y:auto;margin-bottom:14px}
.copy-btn{display:inline-flex;align-items:center;gap:7px;background:var(--olive);color:#fff;font-size:.85rem;font-weight:700;padding:12px 22px;border-radius:99px;border:none;cursor:pointer;font-family:inherit;transition:background .16s ease,transform .12s,box-shadow .16s ease;box-shadow:0 4px 14px rgba(28,65,44,.22);touch-action:manipulation}
.copy-btn:hover{background:var(--olive-mid)}
.copy-btn:active{transform:scale(.96)}
.copy-btn.copied{background:#2d9a5e;box-shadow:0 4px 14px rgba(45,154,94,.3)}
.star-reminder{margin-top:12px;padding:10px 13px;background:#FFFEF0;border:1px solid #E8DFA0;border-radius:10px;font-size:.8rem;color:#6b5700;line-height:1.5}
.action-step{margin-top:14px;padding:14px 16px;background:var(--sand);border:1px solid var(--line);border-radius:14px;font-size:.9rem;color:var(--text-mid);line-height:1.65;display:flex;flex-direction:column;gap:7px}
.action-step.win-action{margin-bottom:0}
.action-label{font-family:var(--mono);font-size:.57rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#fff;background:var(--olive);padding:4px 11px;border-radius:99px;display:inline-block;align-self:flex-start}

/* WORKFLOW MAP */
.wmap-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
@media(max-width:480px){.wmap-grid{grid-template-columns:1fr}}
.wmap-col{background:var(--paper);border:1px solid var(--line);border-radius:var(--r);padding:14px}
.wmap-improve{border-color:var(--line);background:var(--sand)}
.wmap-col-title{font-family:var(--mono);font-size:.6rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--sage);margin-bottom:8px}
.wmap-col ul{list-style:none}
.wmap-col ul li{font-size:.82rem;color:var(--text-mid);padding:6px 0;border-bottom:1px solid var(--line);line-height:1.4}
.wmap-col ul li:last-child{border-bottom:none}
.wmap-col ul li::before{content:"–";margin-right:6px;color:var(--sage)}

/* PRIVACY RULES */
.rules-card{background:var(--paper);border:1px solid var(--line);border-radius:var(--r);padding:4px 18px}
.rules-list{list-style:none}
.rules-list li{display:flex;gap:11px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--line);font-size:.9rem;color:var(--text-mid);line-height:1.5}
.rules-list li:last-child{border-bottom:none}
.rule-x{color:#c94040;font-weight:700;flex-shrink:0;font-size:.88rem;margin-top:1px}

/* CHECKLIST */
.check-list{list-style:none}
.check-item{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:var(--paper);border:1px solid var(--line);border-radius:14px;margin-bottom:8px;cursor:pointer;font-size:.92rem;color:var(--text-mid);line-height:1.55;user-select:none;transition:border-color .2s,background .2s,transform .12s;touch-action:manipulation;box-shadow:0 1px 4px rgba(28,65,44,.04)}
.check-item:active{transform:scale(.99)}
.check-item.checked-item{background:var(--sand2);border-color:var(--sage-light);color:var(--text)}
.check-box{width:22px;height:22px;border:1.5px solid var(--line);border-radius:7px;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;background:var(--paper);transition:all .2s cubic-bezier(.16,1,.3,1)}
.check-box.checked{background:var(--olive);border-color:var(--olive);box-shadow:0 0 0 3px var(--sand2);transform:scale(1.08)}
.check-box.checked::after{content:"✓";color:#fff;font-size:.68rem;font-weight:900}
.checked-item{background:var(--sand);border-color:var(--sage-light) !important}
.checked-item .check-item{background:var(--sand)}

/* CONCEPT NOTE */
.concept-note{margin-top:16px;background:var(--sand);border-left:2.5px solid var(--olive);border-radius:0 14px 14px 0;padding:14px 16px;font-size:.88rem;line-height:1.65;color:var(--text-mid)}
.concept-note strong{font-weight:700;color:var(--text)}
.concept-note .d-pill{display:inline-block;font-size:.62rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;background:var(--olive);color:#fff;border-radius:99px;padding:3px 9px;margin-right:7px}

/* WIN */
.win-screen{padding:24px 0;text-align:center}
.win-icon{width:72px;height:72px;background:linear-gradient(135deg,var(--olive),var(--sage));border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;color:#fff;box-shadow:0 8px 24px rgba(28,65,44,.28);animation:winPop .5s cubic-bezier(.16,1,.3,1) both}
@keyframes winPop{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
.win-eyebrow{font-family:var(--mono);font-size:.6rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--sage);margin-bottom:10px}
.win-text{font-family:var(--display);font-size:clamp(1.6rem,5vw,2rem);font-weight:800;letter-spacing:-.03em;color:var(--text);margin-bottom:16px;line-height:1.15}
.win-next{font-size:.9rem;color:var(--text-mid);line-height:1.65;max-width:400px;margin:0 auto}
.win-action{margin:16px 0}
.win-call-nudge{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:22px;padding-top:18px;border-top:1px solid var(--line)}
.win-call-label{font-size:.78rem;color:var(--text-mid)}
.win-call-link{font-size:.82rem;font-weight:700;color:var(--olive);text-decoration:none;white-space:nowrap}
.win-call-link:hover{text-decoration:underline}

/* BOOK CALL NAV PILL */
.btn-book-call{flex-shrink:0;border:1.5px solid var(--olive);background:transparent;color:var(--olive);text-decoration:none;font-family:var(--body);font-size:11px;font-weight:700;padding:5px 11px;border-radius:99px;white-space:nowrap;transition:background .15s,color .15s;letter-spacing:.01em}
.btn-book-call:hover{background:var(--olive);color:#fff}

/* GRADUATION */
.grad-shell{padding:16px 0;text-align:center}
.grad-logo{height:64px;width:auto;margin-bottom:22px;mix-blend-mode:multiply;object-fit:contain}
.grad-biz-name{font-family:var(--display);font-size:clamp(1.6rem,5vw,2rem);font-weight:800;letter-spacing:-.01em;color:var(--text);margin-bottom:16px;line-height:1.08}
.grad-headline{font-family:var(--display);font-size:clamp(2.2rem,7vw,3rem);font-weight:800;letter-spacing:-.01em;color:var(--text);margin-bottom:8px;line-height:1}
.grad-sub{font-size:1rem;color:var(--text-mid);margin-bottom:24px;line-height:1.65}
.grad-list{display:flex;flex-direction:column;gap:8px;margin-bottom:24px;text-align:left}
.grad-item{display:flex;align-items:center;gap:12px;font-size:.92rem;color:var(--text-mid);padding:13px 16px;background:var(--paper);border:1px solid var(--line);border-radius:14px;box-shadow:0 1px 4px rgba(28,65,44,.04)}
.gi-check{color:var(--olive);font-weight:700;font-size:1rem;flex-shrink:0}
.btn-map{background:var(--sand);border:1px solid var(--line);color:var(--text);font-size:.88rem;font-weight:700;padding:10px 22px;border-radius:99px;cursor:pointer;font-family:inherit;transition:background .15s}
.grad-call-card{background:var(--olive);border-radius:20px;padding:28px 24px;margin-bottom:20px;text-align:center;box-shadow:0 12px 36px rgba(28,65,44,.28)}
.grad-call-eyebrow{font-family:var(--mono);font-size:.6rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--sage-light);margin-bottom:10px}
.grad-call-headline{font-family:var(--display);font-size:clamp(1.6rem,5vw,2rem);font-weight:800;letter-spacing:-.01em;color:#fff;margin-bottom:10px;line-height:1.08}
.grad-call-desc{font-size:.9rem;color:rgba(255,255,255,.75);line-height:1.65;margin-bottom:22px}
.grad-call-btn{display:inline-block;background:#fff;color:var(--olive);font-family:var(--body);font-size:.95rem;font-weight:800;padding:14px 30px;border-radius:99px;text-decoration:none;transition:transform .15s,box-shadow .15s;box-shadow:0 4px 16px rgba(0,0,0,.18)}
.grad-call-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.22)}
.grad-call-note{font-family:var(--mono);font-size:.58rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-top:12px}

/* INTERACTIVE PANELS */
.imode-panel{position:relative}
.imode-inner{max-width:600px;margin:0 auto;padding:18px 16px 100px}
.no-study{text-align:center;color:var(--sage);padding:36px 0;font-size:.9rem}

/* FLASHCARDS */
.flash-header{text-align:center;margin-bottom:16px}
.flash-counter{font-size:.7rem;font-weight:700;color:var(--sage);letter-spacing:.07em;text-transform:uppercase;margin-bottom:5px}
.flash-bar{height:3px;background:var(--line);border-radius:2px;max-width:180px;margin:0 auto;overflow:hidden}
.flash-bar-fill{height:100%;background:var(--olive);border-radius:2px;transition:width .4s}
.flash-scene{perspective:1100px;margin:0 auto 14px;max-width:500px;height:220px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.flash-3d{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .5s cubic-bezier(.4,0,.2,1)}
.flash-3d.flipped{transform:rotateY(180deg)}
.flash-face{position:absolute;inset:0;border-radius:20px;background:var(--paper);border:1px solid var(--line);box-shadow:0 4px 20px rgba(28,65,44,.08);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 24px;text-align:center;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.flash-face-lbl{font-size:.58rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--sage);margin-bottom:10px}
.flash-face-text{font-size:1.1rem;font-weight:700;color:var(--text);line-height:1.4}
.flash-back-face{transform:rotateY(180deg)}
.flash-back-face .flash-face-text{font-size:.92rem;font-weight:500;color:var(--text-mid);line-height:1.6}
.flash-tap-cue{font-size:.7rem;color:var(--sage);text-align:center;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:5px}
.flash-btns{display:flex;gap:9px;max-width:500px;margin:0 auto}
.flash-btns.hidden{visibility:hidden;pointer-events:none}
.btn-still{flex:1;min-height:50px;padding:13px 12px;border-radius:14px;border:1.5px solid var(--line);background:#fff;color:var(--sage);font-size:.87rem;font-weight:700;cursor:pointer;font-family:inherit;touch-action:manipulation}
.btn-know{flex:1;min-height:50px;padding:13px 12px;border-radius:14px;border:1.5px solid var(--sage-light);background:var(--sand);color:var(--text-mid);font-size:.87rem;font-weight:700;cursor:pointer;font-family:inherit;touch-action:manipulation}
.flash-done{text-align:center;padding:36px 0 20px}
.flash-done-title{font-family:var(--display);font-size:1.5rem;font-weight:800;color:var(--text);letter-spacing:-.03em;margin-bottom:8px}
.flash-done-sub{font-size:.87rem;color:var(--sage);margin-bottom:22px;line-height:1.5}

/* QUIZ */
.quiz-qnum{font-size:.62rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--sage);margin-bottom:10px}
.quiz-qtext{font-size:.98rem;font-weight:700;color:var(--text);line-height:1.5;margin-bottom:16px}
.quiz-choices{display:flex;flex-direction:column;gap:9px;margin-bottom:12px}
.quiz-choice{padding:14px 18px;min-height:52px;border-radius:14px;border:1px solid var(--line);background:var(--paper);color:var(--text);font-size:.92rem;font-weight:600;text-align:left;cursor:pointer;font-family:inherit;width:100%;display:flex;align-items:center;transition:border-color .15s;line-height:1.4;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.quiz-choice:active:not(:disabled){background:var(--sand)}
.quiz-choice.correct{background:var(--sand);border-color:var(--sage-light);color:var(--text-mid)}
.quiz-choice.wrong{background:rgba(220,50,50,.06);border-color:rgba(200,50,50,.3);color:#7a2020}
.quiz-choice:disabled{cursor:default}
.quiz-feed{padding:11px 14px;border-radius:12px;font-size:.82rem;line-height:1.5;display:none}
.quiz-feed.show{display:block}
.quiz-feed.correct{background:var(--sand);border:1.5px solid var(--sage-light);color:var(--text-mid)}
.quiz-feed.wrong{background:rgba(220,50,50,.05);border:1.5px solid rgba(200,50,50,.2);color:#7a2020}
.btn-qnext{width:100%;padding:12px;border-radius:12px;background:var(--olive);color:#fff;font-size:.88rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;display:none;margin-top:10px}
.btn-qnext.show{display:block}
.quiz-score{text-align:center;padding:28px 0}
.quiz-score-num{font-family:var(--display);font-size:3rem;font-weight:800;color:var(--text);letter-spacing:-.04em;margin-bottom:4px}
.quiz-score-pct{font-size:.87rem;color:var(--sage);margin-bottom:14px}
.quiz-score-msg{font-size:.98rem;font-weight:700;color:var(--text-mid);margin-bottom:22px}

/* MATCH */
.match-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.match-ctr{font-family:var(--display);font-size:1.4rem;color:var(--text);letter-spacing:.04em;line-height:1}
.match-bar{flex:1;height:5px;background:var(--line);border-radius:3px;margin:0 12px;overflow:hidden}
.match-bar-fill{height:100%;background:var(--olive);border-radius:3px;transition:width .4s}
.match-hint{font-family:var(--mono);font-size:.67rem;color:var(--sage);text-align:center;margin-bottom:14px;letter-spacing:.03em}
.match-cols{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:start}
.match-col-lbl{font-family:var(--mono);font-size:.58rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--sage);margin-bottom:7px;text-align:center}
.match-col-cards{display:flex;flex-direction:column;gap:7px}
.match-card{padding:13px 11px;border-radius:14px;border:1.5px solid var(--line);background:#fff;color:var(--text);font-size:.79rem;font-weight:600;line-height:1.35;cursor:pointer;transition:background .18s,border-color .18s,color .18s,transform .18s,box-shadow .18s;text-align:center;min-height:56px;display:flex;align-items:center;justify-content:center;touch-action:manipulation;-webkit-tap-highlight-color:transparent;overflow:hidden;box-shadow:0 2px 8px rgba(28,65,44,.06)}
.match-card:hover:not(.matched):not(.selected):not(.match-correct){border-color:var(--sage-light);box-shadow:0 4px 14px rgba(28,65,44,.1)}
.match-card:active:not(.matched):not(.selected):not(.match-correct){transform:scale(.97)}
.match-card.selected{background:var(--olive);border-color:var(--text);color:#fff;transform:scale(1.04);box-shadow:0 6px 20px rgba(28,65,44,.28),0 0 0 3px rgba(28,65,44,.12);animation:mpulse 1.2s ease-in-out infinite}
@keyframes mpulse{0%,100%{box-shadow:0 6px 20px rgba(28,65,44,.28),0 0 0 3px rgba(28,65,44,.12)}50%{box-shadow:0 8px 28px rgba(28,65,44,.4),0 0 0 5px rgba(28,65,44,.18)}}
.match-card.match-correct{background:var(--sage);border-color:var(--sage);color:#fff;font-weight:800;animation:mpop .55s cubic-bezier(.4,0,.2,1);pointer-events:none}
@keyframes mpop{0%{transform:scale(1)}35%{transform:scale(1.14)}65%{transform:scale(.96)}100%{transform:scale(1)}}
.match-card.matched{background:var(--sand);border-color:var(--line);color:var(--sage);font-size:.7rem;min-height:32px;padding:6px 8px;opacity:.7;pointer-events:none;cursor:default}
.match-card.wrong{animation:mshake .4s;border-color:rgba(200,50,50,.35);background:rgba(220,50,50,.05);color:#8a2020}
@keyframes mshake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
.match-done{text-align:center;padding:32px 0 20px}
.match-done-icon{font-size:2.8rem;margin-bottom:10px;line-height:1}
.match-done-title{font-family:var(--display);font-size:2.2rem;color:var(--text);margin-bottom:10px;letter-spacing:.03em}
.match-done-pts{display:inline-block;background:var(--olive);color:var(--neon);font-size:1rem;font-weight:800;padding:7px 24px;border-radius:50px;margin-bottom:12px;letter-spacing:.04em}
.match-done-score{font-size:.87rem;color:var(--sage);margin-bottom:22px}
.btn-restart{padding:9px 22px;border-radius:99px;background:#fff;border:1.5px solid var(--line);color:var(--text);font-size:.85rem;font-weight:700;cursor:pointer;font-family:inherit;display:inline-block;touch-action:manipulation}

/* TOOL CARDS */
.tool-grid{display:flex;flex-direction:column;gap:9px}
.tool-card{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:15px 16px}
.tool-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.tool-card-name{font-family:var(--display);font-size:1.1rem;color:var(--text);letter-spacing:.02em}
.tool-card-cat{font-family:var(--mono);font-size:.55rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--sage);background:var(--sand);border:1px solid var(--line);border-radius:99px;padding:3px 9px;white-space:nowrap;flex-shrink:0}
.tool-card-use{font-size:.88rem;color:var(--text-mid);line-height:1.55;margin-bottom:8px}
.tool-card-tip{background:var(--sand);border-left:2.5px solid var(--olive);border-radius:0 8px 8px 0;padding:9px 12px;font-size:.8rem;color:var(--text-mid);line-height:1.45}
.tool-card-tip strong{color:var(--text);font-weight:700}

/* MODULE MODAL */
.mapback{position:fixed;inset:0;background:rgba(28,65,44,.18);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);z-index:200;display:flex;align-items:flex-end;justify-content:center}
.mapback[hidden]{display:none}
.mapcard{background:var(--paper);border:1px solid var(--line);border-radius:24px 24px 0 0;padding:22px 18px calc(24px + env(safe-area-inset-bottom,0px));width:100%;max-width:600px;max-height:80vh;overflow-y:auto;box-shadow:0 -12px 40px rgba(28,65,44,.1)}
.maptop{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.maptitle{font-family:var(--display);font-size:1.9rem;font-weight:800;color:var(--text);letter-spacing:-.01em;line-height:1}
.mapclose{background:var(--sand);border:1px solid var(--line);color:var(--text-mid);border-radius:99px;font-size:.82rem;font-weight:700;padding:8px 14px;cursor:pointer;font-family:inherit}
.mapmod{display:flex;align-items:center;gap:14px;padding:13px 14px;border:1px solid var(--line);border-radius:14px;cursor:pointer;margin-bottom:8px;transition:border-color .18s,background .18s;touch-action:manipulation}
.mapmod:hover,.mapmod:active{background:var(--sand);border-color:var(--sage-light)}
.mapmod.done{border-color:var(--sage-light);background:var(--sand)}
.mapmod-num{font-family:var(--display);font-style:italic;font-size:1.4rem;color:var(--olive);line-height:1;min-width:28px}
.mapmod-name{flex:1;font-size:.92rem;font-weight:700;color:var(--text)}
.mapmod-check{font-size:.88rem;color:var(--olive);font-weight:700}

/* POINTS FLOAT */
.pts-float{position:fixed;pointer-events:none;z-index:300;font-family:var(--display);font-weight:800;font-size:1.4rem;color:var(--text);left:50%;transform:translateX(-50%);animation:pfloat .9s ease-out forwards}
@keyframes pfloat{0%{opacity:1;top:65%}100%{opacity:0;top:35%}}


/* ANTHROPIC ACADEMY */
.anthro-section{margin-bottom:20px}
.anthro-section-lbl{font-family:var(--mono);font-size:.58rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--sage);margin-bottom:8px;padding-left:2px}
.anthro-courses{display:flex;flex-direction:column;gap:6px}
.anthro-card{display:flex;align-items:center;gap:10px;padding:11px 13px;background:#fff;border:1.5px solid var(--line);border-radius:12px;text-decoration:none;color:inherit;transition:border-color .15s,background .15s}
.anthro-card:hover{border-color:var(--sage-light);background:var(--sand)}
.anthro-card-num{font-family:var(--mono);font-size:.58rem;font-weight:700;color:var(--sage);min-width:18px;flex-shrink:0}
.anthro-card-body{flex:1;min-width:0}
.anthro-card-title{font-size:.85rem;font-weight:700;color:var(--text);margin-bottom:2px;line-height:1.2}
.anthro-card-desc{font-size:.72rem;color:var(--text-mid);line-height:1.35;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.anthro-card-badge{font-family:var(--mono);font-size:.54rem;font-weight:700;letter-spacing:.05em;padding:3px 7px;border-radius:4px;flex-shrink:0;white-space:nowrap}
.anthro-badge-free{background:rgba(122,156,120,.12);color:var(--sage);border:1px solid rgba(122,156,120,.25)}
.anthro-badge-dev{background:rgba(100,100,240,.08);color:#6868cc;border:1px solid rgba(100,100,240,.2)}
.anthro-badge-mcp{background:rgba(180,140,40,.08);color:#8a6a10;border:1px solid rgba(180,140,40,.2)}

/* MOBILE */
@media(max-width:480px){
  .stage{padding:20px 16px 36px}
  .screen-title{font-size:1.7rem}
  .wmap-grid{grid-template-columns:1fr}
  .prompt-box{font-size:.8rem;padding:13px;max-height:180px}
  .copy-btn{width:100%;justify-content:center}
  .hook-card{padding:16px 14px}
  .concept-note{font-size:.8rem;padding:11px 13px}
  .top-where{display:none}
  .pts-badge{font-size:10px;padding:3px 8px}
  .btn-mods{font-size:10px;padding:4px 9px}
  .action-step{font-size:.83rem}
  .flash-scene{height:190px}
  .tool-card{padding:13px 14px}
  .match-card{font-size:.75rem;min-height:50px;padding:10px 8px}
.win-icon{width:60px;height:60px}
  .win-text{font-size:1.5rem}
}
`;

export default async function handler(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("Course not found", { status: 404 });

  let course;
  try {
    const store = getStore("courses");
    course = await store.get(id, { type: "json" });
  } catch (e) {
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
  if (!course) return new Response("Course not found — link may be invalid.", { status: 404 });

  const { screens, moduleStarts, slug, checklistLen } = buildScreens(course);
  const total = screens.length;

  const screensHtml = screens.map((s, i) =>
    `<div class="screen${i===0?" active":""}" id="s${i}">${s.html}</div>`
  ).join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>
  <title>AI Course — ${esc(course.business_name)}</title>
  <style>${CSS}</style>${brandCSS(course.brand_color) ? `<style>${brandCSS(course.brand_color)}</style>` : ''}
</head>
<body>
  <div class="app">

    <div class="top">
      ${course.logo ? `<img class="top-logo" src="${course.logo}" alt="${esc(course.business_name)}" onerror="this.style.display='none'"/>` : `<div class="top-biz">${esc(course.business_name)}</div>`}
      <div class="top-where" id="top-where">Welcome</div>
      <div class="ptrack"><div class="pfill" id="pfill"></div></div>
      <div class="pts-badge" id="pts-badge">0 pts</div>
      <a class="btn-book-call" href="${BOOK_CALL_URL}" target="_blank" rel="noopener">Book Call</a>
      <button class="btn-mods" onclick="openMap()">Modules</button>
    </div>

    <div class="mode-bar" id="mode-bar">
      <button class="mode-btn active" data-mode="learn" onclick="setMode('learn')">
        <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
        Learn
      </button>
      <button class="mode-btn" data-mode="flash" onclick="setMode('flash')">
        <svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M12 9v6M9 12h6"/></svg>
        Flashcards
      </button>
      <button class="mode-btn" data-mode="quiz" onclick="setMode('quiz')">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
        Quiz
      </button>
      <button class="mode-btn" data-mode="match" onclick="setMode('match')">
        <svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
        Match
      </button>
    </div>

    <div class="course-main" id="course-main">
      <div class="stage" id="learn-panel">
        ${screensHtml}
      </div>
      <div id="flash-panel" class="imode-panel" style="display:none"></div>
      <div id="quiz-panel" class="imode-panel" style="display:none"></div>
      <div id="match-panel" class="imode-panel" style="display:none"></div>
    </div>

    <div class="dots" id="dots"></div>

    <div class="nav">
      <button class="nav-back" id="btn-back" onclick="back()" style="visibility:hidden">Back</button>
      <button class="nav-next" id="btn-next" onclick="next()">Begin →</button>
      <button class="btn-mode-back" id="btn-mode-back" onclick="setMode('learn')">← Lesson</button>
    </div>

  </div>

  <div class="mapback" id="module-modal" hidden onclick="closeMap()">
    <div class="mapcard" onclick="event.stopPropagation()">
      <div class="maptop">
        <div class="maptitle">Course Modules</div>
        <button class="mapclose" onclick="closeMap()">Close</button>
      </div>
      <div class="maplist" id="maplist"></div>
    </div>
  </div>

  <canvas id="confetti-canvas" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1000;display:block"></canvas>
  <div id="pts-float" class="pts-float" hidden>+12</div>

  <script>
    function eh(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    // ── DATA ──────────────────────────────────────────────
    const TOTAL = ${total};
    const SLUG = ${JSON.stringify(slug)};
    const BIZ = ${JSON.stringify(course.business_name)};
    const MS = ${JSON.stringify(moduleStarts)};
    const CL = ${checklistLen};
    const STUDY = ${JSON.stringify(course.study || {flashcards:[],quiz:[],match:[]}).replace(/</g,'\\u003c')};
    const SMODS = ${JSON.stringify(screens.map(s => s.module))};
    const SIDS = ${JSON.stringify(screens.map(s => s.id))};
    const MNAMES = ['Intro','AI Command Center','Prompt Library','Workflow Map','Privacy Rules','First Steps','AI Tools Arsenal','Anthropic Academy'];
    const WIN_IDS = new Set(['m1-win','m2-win','m3-win','m4-win','m5-win','m6-win','m7-win','grad']);
    const KEY = 'course_' + SLUG + '_screen';
    const PKEY = 'course_' + SLUG + '_pts';
    let cur = Math.min(Math.max(0, parseInt(localStorage.getItem(KEY)) || 0), TOTAL - 1);
    let dir = 1;
    let pts = parseInt(localStorage.getItem(PKEY)) || 0;

    function goTo(n) {
      if (n < 0 || n >= TOTAL) return;
      dir = n > cur ? 1 : -1;
      const prev = document.getElementById('s' + cur);
      prev.classList.remove('active', 'anim-right', 'anim-left');
      const advancing = n > cur;
      cur = n;
      const next = document.getElementById('s' + cur);
      next.classList.add('active', dir > 0 ? 'anim-right' : 'anim-left');
      next.addEventListener('animationend', () => next.classList.remove('anim-right', 'anim-left'), { once: true });
      localStorage.setItem(KEY, cur);
      if (advancing) addPts(12);
      render();
      document.getElementById('course-main').scrollTo({ top: 0, behavior: 'instant' });
      if (WIN_IDS.has(SIDS[cur])) setTimeout(launchConfetti, 180);
    }
    function next() { goTo(cur + 1); }
    function back() { goTo(cur - 1); }
    function jumpToModule(m) { if (MS[m] !== undefined) goTo(MS[m]); }

    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
    });

    function render() {
      const mod = SMODS[cur];
      const inMod = mod > 0;
      document.getElementById('mode-bar').style.display = inMod ? 'flex' : 'none';
      if (!inMod && curMode !== 'learn') setMode('learn');

      // Progress bar
      document.getElementById('pfill').style.width = (cur / (TOTAL - 1) * 100) + '%';

      // Where label
      const whereEl = document.getElementById('top-where');
      if (whereEl) {
        if (SIDS[cur] === 'welcome') whereEl.textContent = 'Welcome';
        else if (SIDS[cur] === 'module-map') whereEl.textContent = 'Dashboard';
        else if (inMod) whereEl.textContent = MNAMES[mod];
        else whereEl.textContent = '';
      }

      // Back / next buttons (only in learn mode)
      if (curMode === 'learn') {
        const backBtn = document.getElementById('btn-back');
        const nextBtn = document.getElementById('btn-next');
        if (backBtn) backBtn.style.visibility = cur === 0 ? 'hidden' : 'visible';
        if (nextBtn) {
          if (cur === 0) nextBtn.textContent = 'Begin →';
          else if (cur === TOTAL - 1) nextBtn.textContent = 'Done';
          else nextBtn.textContent = 'Next →';
        }
      }

      // Dots
      renderDots();

      // Module progress bars
      Object.entries(MS).forEach(([m, start]) => {
        const card = document.getElementById('mcard-' + m);
        if (!card) return;
        const nxt = Object.values(MS).find(s => s > start) || TOTAL;
        const done = cur >= nxt;
        card.classList.toggle('done', done);
        const bar = document.getElementById('mp' + m);
        if (bar) {
          const pct = done ? 100 : cur > start ? Math.round((cur - start) / (nxt - start) * 100) : 0;
          bar.style.width = pct + '%';
        }
      });
    }

    function renderDots() {
      const dotsEl = document.getElementById('dots');
      if (!dotsEl || curMode !== 'learn') { if (dotsEl) dotsEl.innerHTML = ''; return; }
      const mod = SMODS[cur];
      const start = MS[mod] !== undefined ? MS[mod] : 0;
      const modStarts = Object.values(MS).sort((a,b) => a - b);
      const nextModStart = modStarts.find(s => s > start) || TOTAL;
      const len = nextModStart - start;
      if (len <= 1) { dotsEl.innerHTML = ''; return; }
      let html = '';
      for (let i = 0; i < len; i++) {
        const si = start + i;
        const cls = si === cur ? 'dot active' : si < cur ? 'dot visited' : 'dot';
        html += '<div class="' + cls + '"></div>';
      }
      dotsEl.innerHTML = html;
    }

    // ── POINTS ─────────────────────────────────────────────
    function addPts(n) {
      pts += n;
      localStorage.setItem(PKEY, pts);
      const badge = document.getElementById('pts-badge');
      if (badge) { badge.textContent = pts + ' pts'; badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump'); }
      const fl = document.getElementById('pts-float');
      if (fl) {
        fl.textContent = '+' + n;
        fl.hidden = false;
        fl.style.animation = 'none';
        void fl.offsetWidth;
        fl.style.animation = '';
        setTimeout(() => { fl.hidden = true; }, 950);
      }
    }
    function loadPts() {
      const badge = document.getElementById('pts-badge');
      if (badge) badge.textContent = pts + ' pts';
    }

    // ── MODULE MODAL ────────────────────────────────────────
    function openMap() {
      const modal = document.getElementById('module-modal');
      if (!modal) return;
      const list = document.getElementById('maplist');
      if (list) {
        const entries = [
          {n:1,name:'AI Command Center'},{n:2,name:'Prompt Library'},
          {n:3,name:'Workflow Map'},{n:4,name:'Privacy Rules'},{n:5,name:'First Steps'},
          {n:6,name:'AI Tools Arsenal'},{n:7,name:'Anthropic Academy'}
        ];
        list.innerHTML = entries.map(e => {
          const start = MS[e.n];
          const nxt = Object.values(MS).filter(s => s > start)[0] || TOTAL;
          const done = cur >= nxt;
          return '<div class="mapmod' + (done ? ' done' : '') + '" onclick="closeMap();jumpToModule(' + e.n + ')">'
            + '<div class="mapmod-num">0' + e.n + '</div>'
            + '<div class="mapmod-name">' + e.name + '</div>'
            + (done ? '<div class="mapmod-check">✓</div>' : '')
            + '</div>';
        }).join('');
      }
      modal.hidden = false;
    }
    function closeMap() {
      const modal = document.getElementById('module-modal');
      if (modal) modal.hidden = true;
    }

    // ── CONFETTI ────────────────────────────────────────────
    function launchConfetti() {
      const canvas = document.getElementById('confetti-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const colors = ['#1C412C','#FFD700','#7A9C78','#f0e68c','#fff','#FF8C42','#a8c8a4'];
      const pieces = Array.from({length: 80}, () => ({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * 50,
        w: 7 + Math.random() * 8,
        h: 4 + Math.random() * 5,
        rot: Math.random() * 360,
        rotV: (Math.random() - .5) * 9,
        dx: (Math.random() - .5) * 3,
        dy: 3.5 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      }));
      let frame;
      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        pieces.forEach(p => {
          if (p.alpha <= 0) return;
          alive = true;
          p.x += p.dx; p.y += p.dy; p.rot += p.rotV;
          if (p.y > canvas.height * .7) p.alpha -= .025;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot * Math.PI / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
          ctx.restore();
        });
        if (alive) frame = requestAnimationFrame(draw);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      if (frame) cancelAnimationFrame(frame);
      draw();
    }

    // ── COPY / CHECKLIST ────────────────────────────────────
    function copyEl(id, btn) {
      const text = document.getElementById(id).innerText;
      const celebrate = () => {
        const o = btn.textContent;
        btn.textContent = 'Copied! ✓';
        btn.classList.add('copied');
        addPts(8);
        setTimeout(() => { btn.textContent = o; btn.classList.remove('copied'); }, 2400);
      };
      navigator.clipboard.writeText(text).then(celebrate).catch(() => {
        const el = document.getElementById(id), r = document.createRange();
        r.selectNodeContents(el); const sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(r); document.execCommand('copy'); sel.removeAllRanges();
        celebrate();
      });
    }

    function toggleCheck(i) {
      const k = 'course_' + SLUG + '_c' + i;
      const on = localStorage.getItem(k) !== '1';
      localStorage.setItem(k, on ? '1' : '0');
      document.getElementById('cb' + i)?.classList.toggle('checked', on);
      document.getElementById('ci' + i)?.classList.toggle('checked-item', on);
    }

    function restoreChecks() {
      for (let i = 0; i < CL; i++) {
        if (localStorage.getItem('course_' + SLUG + '_c' + i) === '1') {
          document.getElementById('cb' + i)?.classList.add('checked');
          document.getElementById('ci' + i)?.classList.add('checked-item');
        }
      }
    }

    let curMode = 'learn';
    try { render(); loadPts(); restoreChecks(); } catch(e) { console.error(e); }
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById('s'+cur)?.classList.add('active');

    // ── MODE SWITCHING ──────────────────────────────────────
    function setMode(m) {
      curMode = m;
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
      document.getElementById('learn-panel').style.display = m === 'learn' ? '' : 'none';
      ['flash','quiz','match'].forEach(p => document.getElementById(p+'-panel').style.display = m === p ? '' : 'none');
      const backBtn = document.getElementById('btn-back');
      const nextBtn = document.getElementById('btn-next');
      const modeBack = document.getElementById('btn-mode-back');
      if (m === 'learn') {
        if (backBtn) { backBtn.style.display = ''; backBtn.style.visibility = cur === 0 ? 'hidden' : 'visible'; }
        if (nextBtn) nextBtn.style.display = '';
        if (modeBack) modeBack.style.display = 'none';
      } else {
        if (backBtn) { backBtn.style.display = 'none'; }
        if (nextBtn) nextBtn.style.display = 'none';
        if (modeBack) modeBack.style.display = 'block';
      }
      renderDots();
      document.getElementById('course-main').scrollTo({top:0,behavior:'instant'});
      if (m === 'flash') initFlash();
      if (m === 'quiz')  initQuiz();
      if (m === 'match') initMatch();
    }

    // ── FLASHCARDS ──────────────────────────────────────────
    let fIdx=0, fFlipped=false, fKnown=new Set(), fQueue=[];
    function initFlash() {
      fQueue = STUDY.flashcards.map((_,i)=>i).sort(()=>Math.random()-.5);
      fIdx=0; fFlipped=false; fKnown.clear();
      renderFlash();
    }
    function renderFlash() {
      const p = document.getElementById('flash-panel');
      const cards = STUDY.flashcards;
      if (!cards.length) { p.innerHTML='<div class="imode-inner"><p class="no-study">No flashcards yet — generate a new course to get them.</p></div>'; return; }
      if (fIdx >= fQueue.length) {
        const k = fKnown.size, t = cards.length;
        p.innerHTML = '<div class="imode-inner"><div class="flash-done">'
          + '<div class="flash-done-title">'+(k===t?'All '+t+' cards known':k+' of '+t+' known')+'</div>'
          + '<div class="flash-done-sub">'+(k<t?'Keep going — a few more to review.':'Ready to test yourself?')+'</div>'
          + '<button class="btn-restart" onclick="initFlash()">Shuffle &amp; restart</button>'
          + (k===t?'<br/><br/><button class="mode-btn active" style="margin:0 auto" onclick="setMode(&apos;quiz&apos;)">Take the quiz →</button>':'')
          + '</div></div>';
        return;
      }
      const card = cards[fQueue[fIdx]];
      const pct = Math.round(fIdx/fQueue.length*100);
      p.innerHTML = '<div class="imode-inner">'
        + '<div class="flash-header"><div class="flash-counter">'+(fIdx+1)+' / '+fQueue.length+'</div>'
        + '<div class="flash-bar"><div class="flash-bar-fill" style="width:'+pct+'%"></div></div></div>'
        + '<div class="flash-scene" onclick="flipFlash()">'
        + '<div class="flash-3d" id="fc3d"' + (fFlipped?' style="transform:rotateY(180deg)"':'') + '>'
        + '<div class="flash-face"><div class="flash-face-lbl">Term</div><div class="flash-face-text">'+eh(card.term)+'</div></div>'
        + '<div class="flash-face flash-back-face"><div class="flash-face-lbl">Definition</div><div class="flash-face-text">'+eh(card.def)+'</div></div>'
        + '</div></div>'
        + '<div class="flash-tap-cue">'+(fFlipped?'Tap to flip back':'Tap card to reveal definition')+'</div>'
        + '<div class="flash-btns'+(fFlipped?'':' hidden')+'" id="fbtns">'
        + '<button class="btn-still" onclick="markFlash(false)">Still learning</button>'
        + '<button class="btn-know" onclick="markFlash(true)">Got it ✓</button>'
        + '</div></div>';
    }
    function flipFlash() {
      fFlipped = !fFlipped;
      const c = document.getElementById('fc3d');
      if (c) c.style.transform = fFlipped ? 'rotateY(180deg)' : '';
      const h = document.querySelector('.flash-tap-cue'); if (h) h.textContent = fFlipped ? 'Tap to flip back' : 'Tap card to reveal definition';
      const b = document.getElementById('fbtns'); if (b) b.classList.toggle('hidden', !fFlipped);
    }
    function markFlash(known) { if(known) fKnown.add(fQueue[fIdx]); fIdx++; fFlipped=false; renderFlash(); }

    // ── QUIZ ────────────────────────────────────────────────
    let qIdx=0, qAnswered=false, qScore=0, qOrd=[];
    function initQuiz() {
      qOrd = STUDY.quiz.map((_,i)=>i).sort(()=>Math.random()-.5);
      qIdx=0; qAnswered=false; qScore=0;
      renderQuiz();
    }
    function renderQuiz() {
      const p = document.getElementById('quiz-panel');
      const qs = STUDY.quiz;
      if (!qs.length) { p.innerHTML='<div class="imode-inner"><p class="no-study">No quiz questions yet.</p></div>'; return; }
      if (qIdx >= qOrd.length) {
        const pct = Math.round(qScore/qOrd.length*100);
        const msg = pct>=80?'You nailed it.':pct>=60?'Solid progress.':'Review the flashcards and try again.';
        p.innerHTML = '<div class="imode-inner"><div class="quiz-score">'
          + '<div class="quiz-score-num">'+qScore+'/'+qOrd.length+'</div>'
          + '<div class="quiz-score-pct">'+pct+'% correct</div>'
          + '<div class="quiz-score-msg">'+msg+'</div>'
          + '<button class="btn-restart" onclick="initQuiz()">Retake quiz</button>'
          + (pct>=80?'<br/><br/><button class="mode-btn active" style="margin:0 auto" onclick="setMode(&apos;match&apos;)">Try matching →</button>':'')
          + '</div></div>';
        return;
      }
      const q = qs[qOrd[qIdx]];
      p.innerHTML = '<div class="imode-inner">'
        + '<div class="quiz-qnum">Question '+(qIdx+1)+' of '+qOrd.length+'</div>'
        + '<div class="quiz-qtext">'+eh(q.q)+'</div>'
        + '<div class="quiz-choices">'+q.choices.map((c,i)=>'<button class="quiz-choice" onclick="answerQ('+i+')">'+eh(c)+'</button>').join('')+'</div>'
        + '<div class="quiz-feed" id="qfeed"></div>'
        + '<button class="btn-qnext" id="qnext" onclick="nextQ()">Next question →</button>'
        + '</div>';
    }
    function answerQ(i) {
      if (qAnswered) return; qAnswered=true;
      const q = STUDY.quiz[qOrd[qIdx]]; const ok = i===q.correct;
      if (ok) qScore++;
      document.querySelectorAll('.quiz-choice').forEach((b,j)=>{
        b.disabled=true;
        if(j===q.correct) b.classList.add('correct');
        if(j===i && !ok) b.classList.add('wrong');
      });
      const f=document.getElementById('qfeed');
      if(f){f.className='quiz-feed show '+(ok?'correct':'wrong');f.innerHTML=(ok?'✓ Correct. ':'✗ Not quite. ')+eh(q.explain);}
      const n=document.getElementById('qnext'); if(n) n.classList.add('show');
    }
    function nextQ() { qIdx++; qAnswered=false; renderQuiz(); }

    // ── MATCH ───────────────────────────────────────────────
    let mSel=null, mDone=new Set(), mTerms=[], mDefs=[], mPts=0;
    function matchConfetti() {
      const c=document.createElement('canvas');
      c.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
      c.width=window.innerWidth; c.height=window.innerHeight;
      document.body.appendChild(c);
      const ctx=c.getContext('2d');
      const cols=['#FFD700','#1C412C','#7A9C78','#ffffff','#FF8C42','#FF6B9D','#A8E6CF'];
      const pts=Array.from({length:45},()=>({
        x:Math.random()*c.width, y:c.height*.45+Math.random()*c.height*.2,
        vx:(Math.random()-.5)*12, vy:-(Math.random()*10+4),
        col:cols[Math.floor(Math.random()*cols.length)],
        life:1, decay:Math.random()*.02+.01,
        rot:Math.random()*360, rotV:(Math.random()-.5)*10,
        w:Math.random()*9+3, h:Math.random()*5+2
      }));
      let fr=0;
      (function draw(){
        ctx.clearRect(0,0,c.width,c.height);
        let alive=false;
        pts.forEach(p=>{
          p.x+=p.vx; p.y+=p.vy; p.vy+=.45; p.life-=p.decay; p.rot+=p.rotV;
          if(p.life>0){alive=true;ctx.save();ctx.globalAlpha=Math.max(0,p.life);ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.fillStyle=p.col;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();}
        });
        fr++;
        if(alive&&fr<130)requestAnimationFrame(draw);else c.remove();
      })();
    }
    function initMatch() {
      const pairs=STUDY.match;
      if(!pairs||!pairs.length){document.getElementById('match-panel').innerHTML='<div class="imode-inner"><p class="no-study">No matching pairs yet.</p></div>';return;}
      mSel=null; mDone.clear(); mPts=0;
      mTerms=pairs.map((p,i)=>({txt:p.term,idx:i})).sort(()=>Math.random()-.5);
      mDefs=pairs.map((p,i)=>({txt:p.def,idx:i})).sort(()=>Math.random()-.5);
      renderMatch();
    }
    function renderMatch() {
      const p=document.getElementById('match-panel');
      const total=STUDY.match.length;
      if(mDone.size===total){
        matchConfetti(); setTimeout(matchConfetti,280);
        p.innerHTML='<div class="imode-inner"><div class="match-done">'
          +'<div class="match-done-icon">★</div>'
          +'<div class="match-done-title">ALL MATCHED!</div>'
          +'<div class="match-done-pts">+'+mPts+' pts earned</div>'
          +'<div class="match-done-score">Perfect &middot; '+total+' / '+total+'</div>'
          +'<button class="btn-restart" onclick="initMatch()">Play again</button>'
          +'</div></div>';
        return;
      }
      const pct=Math.round(mDone.size/total*100);
      const tCols=mTerms.map((t,i)=>'<div class="match-card'+(mDone.has(t.idx)?' matched':(mSel&&mSel.side==="t"&&mSel.i===i?' selected':''))+'" onclick="selM(&apos;t&apos;,'+i+')" id="mt'+i+'">'+eh(t.txt)+'</div>').join('');
      const dCols=mDefs.map((d,i)=>'<div class="match-card'+(mDone.has(d.idx)?' matched':'')+'" onclick="selM(&apos;d&apos;,'+i+')" id="md'+i+'">'+eh(d.txt)+'</div>').join('');
      p.innerHTML='<div class="imode-inner">'
        +'<div class="match-header"><span class="match-ctr">'+mDone.size+' / '+total+'</span><div class="match-bar"><div class="match-bar-fill" style="width:'+pct+'%"></div></div></div>'
        +'<div class="match-hint">Tap a term, then its matching definition.</div>'
        +'<div class="match-cols"><div><div class="match-col-lbl">Terms</div><div class="match-col-cards">'+tCols+'</div></div>'
        +'<div><div class="match-col-lbl">Definitions</div><div class="match-col-cards">'+dCols+'</div></div></div></div>';
    }
    function selM(side, i) {
      const item=side==='t'?mTerms[i]:mDefs[i];
      if(mDone.has(item.idx)) return;
      if(!mSel){
        if(side!=='t') return;
        mSel={side,i};
        document.getElementById('mt'+i)?.classList.add('selected');
        return;
      }
      if(mSel.side==='t'&&side==='d'){
        const tIdx=mTerms[mSel.i].idx, dIdx=mDefs[i].idx;
        if(tIdx===dIdx){
          const te=document.getElementById('mt'+mSel.i), de=document.getElementById('md'+i);
          [te,de].forEach(el=>{if(el){el.classList.remove('selected');el.classList.add('match-correct');}});
          mSel=null;
          matchConfetti();
          mPts+=12; addPts(12);
          setTimeout(()=>{mDone.add(tIdx);renderMatch();},650);
        } else {
          const te=document.getElementById('mt'+mSel.i), de=document.getElementById('md'+i);
          [te,de].forEach(el=>{if(el){el.classList.add('wrong');setTimeout(()=>el.classList.remove('wrong','selected'),500);}});
          mSel=null;
        }
      } else if(mSel.side==='t'&&side==='t'){
        document.getElementById('mt'+mSel.i)?.classList.remove('selected');
        mSel={side,i};
        document.getElementById('mt'+i)?.classList.add('selected');
      }
    }

  </script>
</body>
</html>`;

  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
