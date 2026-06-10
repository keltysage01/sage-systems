import { getStore } from "@netlify/blobs";

export const config = { path: "/course" };

function esc(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function brandCSS() { return ''; } // EG dark theme — customer brand colors disabled

function buildScreens(course) {
  const { name, business_name, welcome, brain, prompts = [], map = {}, rules = [], checklist = [], logo } = course;
  const biz = esc(business_name);
  const slug = (business_name || "course").toLowerCase().replace(/[^a-z0-9]+/g, "_");

  const screens = [];
  const moduleStarts = {};

  const lessonItem = (t) => `<div class="lesson-item"><span class="li-dot"></span>${t}</div>`;

  const winScreen = (module, capability, next) => `
    <div class="win-screen">
      <div class="win-icon"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 15l6 6L23 8" stroke="#21E68A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div class="win-eyebrow">You can now</div>
      <div class="win-text">${capability}</div>
      ${next ? `<p class="win-next">${next}</p>` : ""}
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
        ${logo ? `<img class="welcome-logo" src="${logo}" alt="${biz}" onerror="this.style.display='none'"/>` : `<div class="welcome-biz-name">${biz}</div>`}
        <div class="welcome-tag">Custom AI Course</div>
      </div>
      <div class="welcome-stats">
        <div class="wstat"><span class="wstat-n">5</span><span class="wstat-l">Modules</span></div>
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
    { n:2, title:"Prompt Library",     desc:"Five ready-to-use prompts built for your workflows" },
    { n:3, title:"Workflow Map",        desc:"What AI handles, what stays human, what to fix first" },
    { n:4, title:"Privacy Rules",       desc:"What should never go into any AI tool" },
    { n:5, title:"First Steps",         desc:"Eight actions to take this week to get started" },
  ];
  const modIcons = [
    `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>`,
    `<svg viewBox="0 0 24 24"><path d="M8 6h8M6 12h12M10 18h4"/></svg>`,
    `<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    `<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`,
  ];
  screens.push({ id: "module-map", module: 0, html: `
    <div class="mmap-header">
      <div class="mmap-dash-title">Course Dashboard</div>
      <div class="mmap-dash-sub">${biz} — 5 modules</div>
    </div>
    <div class="mmap-featured">
      <div class="mmap-card" onclick="jumpToModule(1)" id="mcard-1">
        <div class="mmap-row">
          <div class="mmap-left">
            <div class="mmap-num">Module 1</div>
            <div class="mmap-title" style="font-size:1.05rem">${modulesMeta[0].title}</div>
            <p style="font-size:.8rem;color:rgba(234,240,255,.45);margin-bottom:14px;line-height:1.4;font-family:var(--mono)">${modulesMeta[0].desc}</p>
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
    <p class="screen-desc">Paste this at the start of every new AI session. Save it somewhere easy — a note, a doc, a pinned chat.</p>
    ${promptCard("m1-brain","Claude · ChatGPT · any new session", brain, "Business Brain")}` });

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
      <p class="screen-desc">${prompts.length} prompts built specifically for ${biz}. Each one targets a workflow you already have. Fill in the [bracket fields] and paste into Claude or ChatGPT.</p>
      <div class="lesson-list">
        ${lessonItem(`${prompts.length} prompts, each targeting a real workflow`)}
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
      ${promptCard(`p${i}`,"Claude · ChatGPT (after your Business Brain)", p.prompt, "prompt")}` });
  });

  screens.push({ id:"m2-win", module:2, html:winScreen(2,
    `Run any of your ${prompts.length} custom prompts and get results specific to ${biz}.`,
    "Next: a map of what AI handles in your business, what stays human, and what to improve first.") });

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
    "Next: your privacy rules — what should never go into any AI tool.") });

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
    "Last module: eight concrete actions to take this week.") });

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

  // ── GRADUATION ───────────────────────────────────────────────────
  screens.push({ id:"grad", module:0, html:`
    <div class="grad-shell">
      ${logo ? `<img src="${logo}" alt="${biz}" class="grad-logo" onerror="this.style.display='none'"/>` : `<div class="grad-biz-name">${biz}</div>`}
      <div class="grad-headline">Course complete.</div>
      <p class="grad-sub">You now have a complete AI starter system for ${biz}.</p>
      <div class="grad-list">
        <div class="grad-item"><span class="gi-check">✓</span>Business Brain ready to use</div>
        <div class="grad-item"><span class="gi-check">✓</span>${prompts.length} custom prompts in your library</div>
        <div class="grad-item"><span class="gi-check">✓</span>Workflow map showing what AI handles</div>
        <div class="grad-item"><span class="gi-check">✓</span>Privacy rules for ${biz}</div>
        <div class="grad-item"><span class="gi-check">✓</span>First-steps checklist to start this week</div>
      </div>
      <div class="concept-note" style="text-align:left;margin-bottom:20px">You've now built the four pillars of AI fluency at ${biz}: <strong>Delegation</strong> (what to hand off), <strong>Description</strong> (how to communicate clearly), <strong>Discernment</strong> (what to trust), and <strong>Diligence</strong> (what you're accountable for).</div>
      <button class="btn-map" onclick="goTo(2)">Back to course map</button>
    </div>` });

  return { screens, moduleStarts, slug, checklistLen: checklist.length };
}

// ── CSS ──────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --eg-bg:#070A0F;--eg-bg-2:#0A0E15;--eg-bg-3:#0D1219;
  --eg-green:#21E68A;--eg-green-soft:rgba(33,230,138,0.08);
  --eg-green-border:rgba(33,230,138,0.25);--eg-green-glow:rgba(33,230,138,0.5);
  --eg-mint:#96FFD2;--eg-green-deep:#1A9E6A;
  --eg-text:#EAF0FF;--eg-muted:rgba(234,240,255,0.72);
  --eg-muted-2:rgba(234,240,255,0.46);--eg-muted-3:rgba(234,240,255,0.22);
  --eg-border:rgba(234,240,255,0.06);--eg-border-strong:rgba(234,240,255,0.11);
  --eg-glass-bg:rgba(13,18,25,0.58);--eg-glass-bg-strong:rgba(9,13,20,0.82);
  --eg-red:#EF4444;--eg-amber:#F59E0B;
  /* mapped vars */
  --olive:#EAF0FF;--olive-mid:rgba(234,240,255,0.72);
  --sage:rgba(234,240,255,0.46);--sage-light:rgba(234,240,255,0.22);
  --neon:#21E68A;--paper:#070A0F;
  --sand:rgba(13,18,25,0.58);--sand2:rgba(9,13,20,0.82);
  --line:rgba(234,240,255,0.08);
  --display:"Bebas Neue",Impact,"Arial Narrow",sans-serif;
  --body:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  --mono:"JetBrains Mono",ui-monospace,monospace;
  --r:14px;
}
html,body{height:100%}
body{
  font-family:var(--body);background:var(--eg-bg);color:var(--eg-text);
  -webkit-font-smoothing:antialiased;overflow:hidden;
}
/* grid overlay */
body::before{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:0;
  background-image:
    linear-gradient(rgba(33,230,138,.016) 1px,transparent 1px),
    linear-gradient(90deg,rgba(33,230,138,.016) 1px,transparent 1px);
  background-size:54px 54px;
  mask-image:linear-gradient(to bottom,black,rgba(0,0,0,.28));
}
/* scanlines */
body::after{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.22;
  background:repeating-linear-gradient(
    to bottom,rgba(0,0,0,0) 0,rgba(0,0,0,0) 2px,rgba(0,0,0,.2) 3px,rgba(0,0,0,0) 4px
  );
}

/* APP SHELL */
.app{
  display:flex;flex-direction:column;height:100dvh;height:100vh;
  max-width:600px;margin:0 auto;position:relative;z-index:2;
  background:linear-gradient(180deg,var(--eg-bg),var(--eg-bg-2));
}

/* TOP BAR */
.top{
  flex-shrink:0;display:flex;align-items:center;gap:8px;padding:10px 16px;
  border-bottom:1px solid var(--eg-border);
  background:rgba(7,10,15,0.88);
  backdrop-filter:blur(28px) saturate(1.25);-webkit-backdrop-filter:blur(28px) saturate(1.25);
  z-index:50;
}
/* EG LOGO */
.eg-logo{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;line-height:1;flex-shrink:0}
.eg-logo-dot{width:7px;height:7px;border-radius:999px;background:var(--eg-green);flex-shrink:0;
  box-shadow:0 0 8px rgba(33,230,138,.65),0 0 22px rgba(33,230,138,.22)}
.eg-logo-text{font-family:var(--display);font-size:17px;letter-spacing:.06em;color:var(--eg-text);text-transform:uppercase}
.eg-logo-c{color:var(--eg-green)}
.top-where{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;
  color:var(--eg-muted-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:0 1 auto;min-width:0}
.ptrack{flex:1;height:3px;border-radius:99px;background:var(--eg-border);overflow:hidden;min-width:20px}
.pfill{height:100%;width:0%;border-radius:99px;background:linear-gradient(90deg,var(--eg-green),var(--eg-mint));
  transition:width .5s cubic-bezier(.2,.8,.2,1);box-shadow:0 0 6px rgba(33,230,138,.4)}
.pts-badge{
  flex-shrink:0;display:inline-flex;align-items:center;gap:5px;
  font-family:var(--mono);font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
  color:var(--eg-green);background:var(--eg-green-soft);
  border:1px solid var(--eg-green-border);border-radius:4px;padding:4px 9px;white-space:nowrap;
}
.pts-badge::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--eg-green);
  box-shadow:0 0 8px rgba(33,230,138,.5);flex-shrink:0}
.pts-badge.bump{animation:ptsbump .4s ease}
@keyframes ptsbump{0%,100%{transform:scale(1)}40%{transform:scale(1.18)}}
.btn-mods{
  flex-shrink:0;border:1px solid var(--eg-border-strong);background:rgba(234,240,255,.025);
  color:var(--eg-muted);cursor:pointer;font-family:var(--mono);font-size:10px;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase;padding:5px 11px;border-radius:4px;
  white-space:nowrap;transition:border-color .15s,color .15s;
}
.btn-mods:active{border-color:var(--eg-green-border);color:var(--eg-green);background:var(--eg-green-soft)}

/* MODE BAR */
.mode-bar{
  flex-shrink:0;display:none;gap:6px;align-items:center;padding:7px 14px;
  border-bottom:1px solid var(--eg-border);background:rgba(7,10,15,.75);flex-wrap:wrap;
}
.mode-btn{
  flex-shrink:0;padding:6px 13px;min-height:34px;border-radius:4px;
  font-family:var(--mono);font-size:.68rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
  border:1px solid transparent;background:transparent;color:var(--eg-muted-2);cursor:pointer;
  transition:all .18s;display:inline-flex;align-items:center;gap:5px;
  touch-action:manipulation;-webkit-tap-highlight-color:transparent;
}
.mode-btn svg{width:11px;height:11px;stroke:currentColor;fill:none;stroke-width:2}
.mode-btn.active{background:var(--eg-green-soft);color:var(--eg-green);border-color:var(--eg-green-border)}

/* MAIN */
.course-main{flex:1 1 0;overflow-y:auto;overflow-x:hidden;min-height:0}
.stage{max-width:600px;margin:0 auto;padding:20px 18px 24px}

/* SCREENS */
.screen{display:none}
.screen.active{display:block}
.screen.anim-right{animation:sInR .3s cubic-bezier(.2,.8,.2,1)}
.screen.anim-left{animation:sInL .3s cubic-bezier(.2,.8,.2,1)}
@keyframes sInR{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes sInL{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:none}}

/* DOTS */
.dots{flex-shrink:0;display:flex;justify-content:center;align-items:center;gap:6px;padding:6px 16px 2px;min-height:24px}
.dot{width:6px;height:6px;border-radius:50%;background:var(--eg-border-strong);transition:all .25s;flex-shrink:0}
.dot.active{background:var(--eg-green);width:18px;border-radius:3px;box-shadow:0 0 6px rgba(33,230,138,.4)}
.dot.visited{background:rgba(33,230,138,.3)}

/* NAV */
.nav{
  flex-shrink:0;display:flex;align-items:center;gap:12px;
  padding:10px 16px calc(14px + env(safe-area-inset-bottom,0px));
  background:rgba(7,10,15,.88);border-top:1px solid var(--eg-border);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
}
.nav-back{
  background:none;border:none;cursor:pointer;color:var(--eg-muted-2);
  font-family:var(--mono);font-size:.72rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
  padding:10px 6px;min-width:48px;text-align:left;transition:color .15s;
}
.nav-back:active{color:var(--eg-text)}
.nav-next{
  flex:1;background:var(--eg-green);color:var(--eg-bg);border:none;border-radius:8px;
  font-family:var(--body);font-weight:800;font-size:.95rem;padding:14px 24px;cursor:pointer;
  transition:transform .15s,box-shadow .15s;
  box-shadow:0 0 28px rgba(33,230,138,.28);text-align:center;
  touch-action:manipulation;-webkit-tap-highlight-color:transparent;
}
.nav-next:active{transform:scale(.98);box-shadow:0 0 14px rgba(33,230,138,.18)}
.btn-mode-back{
  display:none;width:100%;padding:13px 24px;
  background:rgba(234,240,255,.025);border:1px solid var(--eg-border-strong);
  color:var(--eg-muted);font-family:var(--mono);font-size:.72rem;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase;border-radius:8px;cursor:pointer;touch-action:manipulation;
}

/* GLASS CARD */
.gl{
  position:relative;isolation:isolate;overflow:hidden;
  border:1px solid var(--eg-border-strong);border-radius:var(--r);
  background:linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.015) 32%,rgba(33,230,138,.02)),var(--eg-glass-bg);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 20px 60px -28px rgba(0,0,0,.5);
  backdrop-filter:blur(24px) saturate(1.3);-webkit-backdrop-filter:blur(24px) saturate(1.3);
}

/* TYPOGRAPHY */
.screen-tag{
  font-family:var(--mono);font-size:.6rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;
  color:var(--eg-green);margin-bottom:10px;display:flex;align-items:center;gap:8px;
}
.screen-tag::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--eg-green);
  box-shadow:0 0 6px rgba(33,230,138,.5);flex-shrink:0}
.screen-title{
  font-family:var(--display);font-size:clamp(2.2rem,6.5vw,3.2rem);font-weight:400;
  letter-spacing:.02em;line-height:.92;text-transform:uppercase;margin-bottom:12px;color:var(--eg-text);
}
.screen-desc{font-size:.9rem;color:var(--eg-muted);line-height:1.65;margin-bottom:20px}

/* WELCOME */
.welcome-shell{padding:16px 0 8px}
.welcome-identity{margin-bottom:20px}
.welcome-logo{height:56px;width:auto;margin-bottom:8px;object-fit:contain}
.welcome-tag{font-family:var(--mono);font-size:.58rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--eg-green);margin-top:6px;opacity:.8}
.welcome-biz-name{font-family:var(--display);font-size:clamp(2.4rem,7vw,3.2rem);font-weight:400;letter-spacing:.02em;text-transform:uppercase;color:var(--eg-text);margin-bottom:4px;line-height:.92}
.welcome-stats{display:flex;align-items:center;border:1px solid var(--eg-border-strong);border-radius:var(--r);padding:14px 18px;margin-bottom:18px;background:rgba(13,18,25,.5)}
.wstat{display:flex;flex-direction:column;align-items:center;flex:1}
.wstat-n{font-family:var(--display);font-size:2rem;font-weight:400;color:var(--eg-green);letter-spacing:.02em;line-height:1;text-transform:uppercase}
.wstat-l{font-family:var(--mono);font-size:.56rem;font-weight:600;text-transform:uppercase;letter-spacing:.14em;color:var(--eg-muted-2);margin-top:4px}
.wstat-div{width:1px;height:32px;background:var(--eg-border);flex-shrink:0;margin:0 6px}
.welcome-body-card{padding:18px 20px;margin-bottom:6px}
.welcome-body{font-size:.88rem;color:var(--eg-muted);line-height:1.7;margin:0}
.welcome-body+.welcome-body{margin-top:12px}
.welcome-bullets{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
.welcome-bullets li{font-size:.88rem;color:var(--eg-muted);line-height:1.5;padding-left:18px;position:relative}
.welcome-bullets li::before{content:"—";position:absolute;left:0;color:var(--eg-green);font-weight:700}

/* SETUP */
.setup-list{margin-top:16px;display:flex;flex-direction:column;gap:8px}
.setup-row{display:flex;align-items:flex-start;gap:10px;font-size:.87rem;color:var(--eg-muted);line-height:1.5;padding:12px 14px;background:rgba(13,18,25,.5);border:1px solid var(--eg-border-strong);border-radius:10px}
.setup-dot{width:7px;height:7px;border-radius:50%;background:var(--eg-green);flex-shrink:0;margin-top:5px;box-shadow:0 0 8px rgba(33,230,138,.5)}

/* MODULE MAP */
.mmap-header{margin-bottom:16px}
.mmap-dash-title{font-family:var(--display);font-size:2.2rem;font-weight:400;color:var(--eg-text);letter-spacing:.04em;text-transform:uppercase;margin-bottom:4px;line-height:.92}
.mmap-dash-sub{font-family:var(--mono);font-size:.62rem;color:var(--eg-muted-2);letter-spacing:.1em;text-transform:uppercase}
.mmap-featured{margin-bottom:12px}
.mmap-featured .mmap-card{padding:20px 18px 16px}
.mmap-featured .mmap-title{font-weight:700;margin-bottom:10px}
.mmap-featured .start-btn{display:inline-block;background:var(--eg-green);color:var(--eg-bg);font-family:var(--body);font-size:.82rem;font-weight:800;padding:8px 18px;border-radius:6px;cursor:pointer;border:none;transition:box-shadow .15s}
.mmap-grid{display:flex;flex-direction:column;gap:8px}
.mmap-card{background:rgba(13,18,25,.55);border:1px solid var(--eg-border-strong);border-radius:var(--r);padding:14px 16px;cursor:pointer;transition:border-color .18s,background .18s;backdrop-filter:blur(16px)}
.mmap-card:active{background:rgba(13,18,25,.75);border-color:rgba(33,230,138,.2)}
.mmap-card.done{border-color:rgba(33,230,138,.22);background:rgba(33,230,138,.04)}
.mmap-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.mmap-left{flex:1;min-width:0}
.mmap-num{font-family:var(--mono);font-size:.56rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--eg-muted-2);margin-bottom:4px}
.mmap-title{font-size:.9rem;font-weight:700;color:var(--eg-text);margin-bottom:8px;line-height:1.3}
.mmap-progress-track{height:2px;background:var(--eg-border);border-radius:99px;overflow:hidden}
.mmap-progress-fill{height:2px;background:var(--eg-green);border-radius:99px;transition:width .4s}
.mmap-card.done .mmap-progress-fill{box-shadow:0 0 6px rgba(33,230,138,.4)}
.mmap-icon{width:36px;height:36px;flex-shrink:0;background:var(--eg-green-soft);border:1px solid var(--eg-green-border);border-radius:8px;display:flex;align-items:center;justify-content:center}
.mmap-icon svg{width:16px;height:16px;stroke:var(--eg-green);fill:none;stroke-width:1.8}

/* MODULE INTRO */
.module-intro-shell{padding-bottom:6px}
.mod-badge{font-family:var(--display);font-size:4.5rem;font-weight:400;color:var(--eg-green);opacity:.18;line-height:1;margin-bottom:12px;letter-spacing:.04em;text-transform:uppercase}
.lesson-list{margin-top:16px;display:flex;flex-direction:column;gap:8px}
.lesson-item{display:flex;align-items:center;gap:10px;font-size:.87rem;color:var(--eg-muted);padding:11px 14px;background:rgba(13,18,25,.5);border:1px solid var(--eg-border-strong);border-radius:10px}
.li-dot{width:6px;height:6px;border-radius:50%;background:var(--eg-green);flex-shrink:0;box-shadow:0 0 6px rgba(33,230,138,.4)}

/* HOOK CARD */
.hook-card{background:rgba(13,18,25,.55);border:1px solid var(--eg-border-strong);border-left:2px solid var(--eg-green);border-radius:0 var(--r) var(--r) 0;padding:18px;font-size:.9rem;color:var(--eg-muted);line-height:1.7;margin-bottom:16px;backdrop-filter:blur(16px)}
.hook-bullets ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:11px}
.hook-bullets li{padding-left:20px;position:relative;font-size:.88rem;line-height:1.5;color:var(--eg-muted)}
.hook-bullets li::before{content:"";position:absolute;left:0;top:7px;width:7px;height:7px;border-radius:50%;background:var(--eg-green);flex-shrink:0;box-shadow:0 0 6px rgba(33,230,138,.4)}
.tool-pills{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}
.tool-pill{font-family:var(--mono);font-size:.62rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--eg-green);background:var(--eg-green-soft);border:1px solid var(--eg-green-border);padding:4px 10px;border-radius:4px}

/* PROMPT CARD */
.prompt-card{background:rgba(13,18,25,.6);border:1px solid var(--eg-border-strong);border-radius:var(--r);padding:18px;backdrop-filter:blur(16px)}
.prompt-dest{font-family:var(--mono);font-size:.6rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--eg-muted-2);margin-bottom:10px}
.prompt-dest strong{color:var(--eg-green)}
.prompt-box{background:rgba(4,6,9,.8);border:1px solid var(--eg-border);border-radius:8px;padding:14px;font-family:var(--mono);font-size:.76rem;color:rgba(150,255,210,.85);white-space:pre-wrap;line-height:1.65;max-height:220px;overflow-y:auto;margin-bottom:11px}
.copy-btn{display:inline-flex;align-items:center;gap:6px;background:var(--eg-green);color:var(--eg-bg);font-size:.82rem;font-weight:800;padding:9px 20px;border-radius:6px;border:none;cursor:pointer;font-family:var(--body);transition:box-shadow .15s;touch-action:manipulation;box-shadow:0 0 20px rgba(33,230,138,.25)}
.copy-btn:active{opacity:.85;box-shadow:none}
.copy-btn.copied{background:var(--eg-mint);box-shadow:0 0 20px rgba(150,255,210,.3)}
.star-reminder{margin-top:12px;padding:10px 13px;background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.18);border-radius:8px;font-family:var(--mono);font-size:.7rem;color:rgba(245,158,11,.75);line-height:1.55}

/* WORKFLOW MAP */
.wmap-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
@media(max-width:480px){.wmap-grid{grid-template-columns:1fr}}
.wmap-col{background:rgba(13,18,25,.55);border:1px solid var(--eg-border-strong);border-radius:var(--r);padding:14px;backdrop-filter:blur(12px)}
.wmap-improve{border-color:rgba(33,230,138,.15);background:rgba(33,230,138,.03)}
.wmap-col-title{font-family:var(--mono);font-size:.56rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--eg-muted-2);margin-bottom:8px}
.wmap-col ul{list-style:none}
.wmap-col ul li{font-size:.8rem;color:var(--eg-muted);padding:6px 0;border-bottom:1px solid var(--eg-border);line-height:1.4}
.wmap-col ul li:last-child{border-bottom:none}
.wmap-col ul li::before{content:"–";margin-right:6px;color:var(--eg-green);opacity:.6}

/* PRIVACY RULES */
.rules-card{background:rgba(13,18,25,.55);border:1px solid var(--eg-border-strong);border-radius:var(--r);padding:4px 18px;backdrop-filter:blur(12px)}
.rules-list{list-style:none}
.rules-list li{display:flex;gap:11px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--eg-border);font-size:.87rem;color:var(--eg-muted);line-height:1.5}
.rules-list li:last-child{border-bottom:none}
.rule-x{color:var(--eg-red);font-weight:700;flex-shrink:0;font-size:.88rem;margin-top:1px}

/* CHECKLIST */
.check-list{list-style:none}
.check-item{display:flex;align-items:flex-start;gap:11px;padding:12px 14px;background:rgba(13,18,25,.5);border:1px solid var(--eg-border-strong);border-radius:10px;margin-bottom:7px;cursor:pointer;font-size:.88rem;color:var(--eg-muted);line-height:1.5;user-select:none;transition:border-color .18s,background .18s;touch-action:manipulation}
.check-item.checked-item{background:rgba(33,230,138,.05);border-color:rgba(33,230,138,.2);color:var(--eg-text)}
.check-box{width:20px;height:20px;border:1.5px solid var(--eg-border-strong);border-radius:5px;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;background:transparent;transition:all .18s}
.check-box.checked{background:var(--eg-green);border-color:var(--eg-green);box-shadow:0 0 10px rgba(33,230,138,.3)}
.check-box.checked::after{content:"✓";color:var(--eg-bg);font-size:.65rem;font-weight:900}

/* CONCEPT NOTE */
.concept-note{margin-top:14px;background:rgba(13,18,25,.5);border-left:2px solid rgba(33,230,138,.4);border-radius:0 8px 8px 0;padding:11px 15px;font-size:.8rem;line-height:1.55;color:var(--eg-muted)}
.concept-note strong{font-weight:700;color:var(--eg-text)}
.concept-note .d-pill{display:inline-block;font-family:var(--mono);font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;background:var(--eg-green-soft);color:var(--eg-green);border:1px solid var(--eg-green-border);border-radius:4px;padding:2px 8px;margin-right:6px}

/* WIN SCREEN */
.win-screen{padding:20px 0}
.win-icon{width:60px;height:60px;background:rgba(33,230,138,.1);border:1px solid rgba(33,230,138,.22);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:16px}
.win-eyebrow{font-family:var(--mono);font-size:.6rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--eg-green);margin-bottom:8px}
.win-text{font-family:var(--display);font-size:clamp(1.9rem,5.5vw,2.6rem);font-weight:400;letter-spacing:.02em;text-transform:uppercase;color:var(--eg-text);margin-bottom:14px;line-height:.92}
.win-next{font-family:var(--mono);font-size:.78rem;color:var(--eg-muted-2);line-height:1.65;max-width:460px}

/* GRADUATION */
.grad-shell{padding:16px 0}
.grad-logo{height:56px;width:auto;margin-bottom:20px;object-fit:contain}
.grad-biz-name{font-family:var(--display);font-size:clamp(2rem,6vw,2.8rem);font-weight:400;letter-spacing:.02em;text-transform:uppercase;color:var(--eg-text);margin-bottom:18px;line-height:.92}
.grad-headline{font-family:var(--display);font-size:clamp(2.6rem,8vw,3.8rem);font-weight:400;letter-spacing:.02em;text-transform:uppercase;color:var(--eg-text);margin-bottom:8px;line-height:.88}
.grad-sub{font-family:var(--mono);font-size:.78rem;color:var(--eg-muted-2);margin-bottom:22px;line-height:1.6;letter-spacing:.06em;text-transform:uppercase}
.grad-list{display:flex;flex-direction:column;gap:8px;margin-bottom:22px}
.grad-item{display:flex;align-items:center;gap:10px;font-size:.87rem;color:var(--eg-muted);padding:11px 16px;background:rgba(13,18,25,.5);border:1px solid var(--eg-border-strong);border-radius:10px}
.gi-check{color:var(--eg-green);font-weight:700;font-size:.88rem;flex-shrink:0}
.btn-map{background:rgba(234,240,255,.025);border:1px solid var(--eg-border-strong);color:var(--eg-text);font-size:.82rem;font-weight:700;padding:10px 22px;border-radius:8px;cursor:pointer;font-family:var(--body)}

/* INTERACTIVE PANELS */
.imode-panel{position:relative}
.imode-inner{max-width:600px;margin:0 auto;padding:18px 16px 100px}
.no-study{text-align:center;color:var(--eg-muted-2);padding:36px 0;font-size:.85rem;font-family:var(--mono)}

/* FLASHCARDS */
.flash-header{text-align:center;margin-bottom:16px}
.flash-counter{font-family:var(--mono);font-size:.66rem;font-weight:600;color:var(--eg-muted-2);letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px}
.flash-bar{height:2px;background:var(--eg-border);border-radius:2px;max-width:180px;margin:0 auto;overflow:hidden}
.flash-bar-fill{height:100%;background:var(--eg-green);border-radius:2px;transition:width .4s;box-shadow:0 0 6px rgba(33,230,138,.4)}
.flash-scene{perspective:1100px;margin:0 auto 14px;max-width:500px;height:220px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.flash-3d{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .5s cubic-bezier(.4,0,.2,1)}
.flash-3d.flipped{transform:rotateY(180deg)}
.flash-face{
  position:absolute;inset:0;border-radius:14px;
  background:linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.015) 32%,rgba(33,230,138,.02)),rgba(13,18,25,.85);
  border:1px solid var(--eg-border-strong);
  box-shadow:0 8px 40px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.07);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:28px 24px;text-align:center;backface-visibility:hidden;-webkit-backface-visibility:hidden;
  backdrop-filter:blur(20px);
}
.flash-face-lbl{font-family:var(--mono);font-size:.56rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--eg-muted-2);margin-bottom:10px}
.flash-face-text{font-size:1.05rem;font-weight:700;color:var(--eg-text);line-height:1.4}
.flash-back-face{transform:rotateY(180deg)}
.flash-back-face .flash-face-text{font-size:.88rem;font-weight:400;color:var(--eg-muted);line-height:1.65}
.flash-tap-cue{font-family:var(--mono);font-size:.62rem;color:var(--eg-muted-2);text-align:center;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:5px;letter-spacing:.08em;text-transform:uppercase}
.flash-btns{display:flex;gap:9px;max-width:500px;margin:0 auto}
.flash-btns.hidden{visibility:hidden;pointer-events:none}
.btn-still{flex:1;min-height:48px;padding:12px;border-radius:8px;border:1px solid var(--eg-border-strong);background:rgba(234,240,255,.025);color:var(--eg-muted-2);font-size:.85rem;font-weight:700;cursor:pointer;font-family:var(--body);touch-action:manipulation;transition:border-color .15s}
.btn-know{flex:1;min-height:48px;padding:12px;border-radius:8px;border:1px solid rgba(33,230,138,.3);background:rgba(33,230,138,.07);color:var(--eg-green);font-size:.85rem;font-weight:700;cursor:pointer;font-family:var(--body);touch-action:manipulation}
.flash-done{text-align:center;padding:36px 0 20px}
.flash-done-title{font-family:var(--display);font-size:2.2rem;font-weight:400;color:var(--eg-text);letter-spacing:.04em;text-transform:uppercase;margin-bottom:8px}
.flash-done-sub{font-family:var(--mono);font-size:.75rem;color:var(--eg-muted-2);margin-bottom:22px;line-height:1.5;letter-spacing:.04em}

/* QUIZ */
.quiz-qnum{font-family:var(--mono);font-size:.6rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--eg-muted-2);margin-bottom:10px}
.quiz-qtext{font-size:.93rem;font-weight:700;color:var(--eg-text);line-height:1.5;margin-bottom:16px}
.quiz-choices{display:flex;flex-direction:column;gap:9px;margin-bottom:12px}
.quiz-choice{padding:13px 18px;min-height:50px;border-radius:10px;border:1px solid var(--eg-border-strong);background:rgba(13,18,25,.5);color:var(--eg-text);font-size:.88rem;font-weight:600;text-align:left;cursor:pointer;font-family:var(--body);width:100%;display:flex;align-items:center;transition:border-color .15s;line-height:1.4;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.quiz-choice:active:not(:disabled){background:rgba(13,18,25,.8)}
.quiz-choice.correct{background:rgba(33,230,138,.08);border-color:rgba(33,230,138,.3);color:rgba(33,230,138,.9)}
.quiz-choice.wrong{background:rgba(239,68,68,.07);border-color:rgba(239,68,68,.3);color:rgba(239,68,68,.8)}
.quiz-choice:disabled{cursor:default}
.quiz-feed{padding:11px 14px;border-radius:10px;font-family:var(--mono);font-size:.72rem;line-height:1.55;display:none}
.quiz-feed.show{display:block}
.quiz-feed.correct{background:rgba(33,230,138,.07);border:1px solid rgba(33,230,138,.2);color:rgba(33,230,138,.85)}
.quiz-feed.wrong{background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);color:rgba(239,68,68,.75)}
.btn-qnext{width:100%;padding:12px;border-radius:8px;background:var(--eg-green);color:var(--eg-bg);font-size:.88rem;font-weight:800;border:none;cursor:pointer;font-family:var(--body);display:none;margin-top:10px}
.btn-qnext.show{display:block}
.quiz-score{text-align:center;padding:28px 0}
.quiz-score-num{font-family:var(--display);font-size:3.8rem;font-weight:400;color:var(--eg-green);letter-spacing:.04em;margin-bottom:4px;text-transform:uppercase}
.quiz-score-pct{font-family:var(--mono);font-size:.72rem;color:var(--eg-muted-2);margin-bottom:14px;letter-spacing:.1em;text-transform:uppercase}
.quiz-score-msg{font-size:.93rem;font-weight:700;color:var(--eg-text);margin-bottom:22px}

/* MATCH */
.match-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.match-ctr{font-family:var(--mono);font-size:.66rem;font-weight:600;color:var(--eg-muted-2);letter-spacing:.1em;text-transform:uppercase}
.match-bar{flex:1;height:2px;background:var(--eg-border);border-radius:2px;margin:0 10px;overflow:hidden}
.match-bar-fill{height:100%;background:var(--eg-green);border-radius:2px;transition:width .4s}
.match-hint{font-family:var(--mono);font-size:.68rem;color:var(--eg-muted-2);text-align:center;margin-bottom:11px;letter-spacing:.08em;text-transform:uppercase}
.match-cols{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:start}
.match-col-lbl{font-family:var(--mono);font-size:.54rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--eg-muted-2);margin-bottom:7px;text-align:center}
.match-col-cards{display:flex;flex-direction:column;gap:6px}
.match-card{padding:11px 10px;border-radius:10px;border:1px solid var(--eg-border-strong);background:rgba(13,18,25,.5);color:var(--eg-text);font-size:.78rem;font-weight:600;line-height:1.35;cursor:pointer;transition:all .25s cubic-bezier(.4,0,.2,1);text-align:center;min-height:52px;display:flex;align-items:center;justify-content:center;touch-action:manipulation;-webkit-tap-highlight-color:transparent;overflow:hidden}
.match-card:active:not(.matched):not(.selected){transform:scale(.97)}
.match-card.selected{background:rgba(33,230,138,.12);border-color:rgba(33,230,138,.5);color:var(--eg-green);box-shadow:0 0 16px rgba(33,230,138,.15)}
.match-card.matched{opacity:0;max-height:0;min-height:0;padding-top:0;padding-bottom:0;border-top-width:0;border-bottom-width:0;margin-bottom:-6px;pointer-events:none;cursor:default}
.match-card.wrong{animation:mshake .36s}
@keyframes mshake{0%,100%{transform:translateX(0)}25%,75%{transform:translateX(-5px)}50%{transform:translateX(5px)}}
.match-done{text-align:center;padding:36px 0 20px}
.match-done-title{font-family:var(--display);font-size:2.2rem;font-weight:400;text-transform:uppercase;color:var(--eg-text);margin-bottom:8px;letter-spacing:.04em}
.match-done-score{font-family:var(--mono);font-size:.72rem;color:var(--eg-muted-2);margin-bottom:22px;letter-spacing:.1em;text-transform:uppercase}
.btn-restart{padding:9px 22px;border-radius:8px;background:rgba(234,240,255,.025);border:1px solid var(--eg-border-strong);color:var(--eg-text);font-size:.82rem;font-weight:700;cursor:pointer;font-family:var(--body);display:inline-block;touch-action:manipulation}

/* MODULE MODAL */
.mapback{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:200;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px)}
.mapback[hidden]{display:none}
.mapcard{
  background:linear-gradient(180deg,rgba(10,14,21,.97),rgba(7,10,15,.99));
  border:1px solid var(--eg-border-strong);border-top:1px solid rgba(33,230,138,.12);
  border-radius:18px 18px 0 0;
  padding:22px 18px calc(24px + env(safe-area-inset-bottom,0px));
  width:100%;max-width:600px;max-height:80vh;overflow-y:auto;
  backdrop-filter:blur(36px);
}
.maptop{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.maptitle{font-family:var(--display);font-size:1.6rem;font-weight:400;color:var(--eg-text);letter-spacing:.06em;text-transform:uppercase}
.mapclose{background:rgba(234,240,255,.04);border:1px solid var(--eg-border-strong);color:var(--eg-muted-2);border-radius:4px;font-family:var(--mono);font-size:.66rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:6px 14px;cursor:pointer}
.mapmod{display:flex;align-items:center;gap:14px;padding:13px 14px;border:1px solid var(--eg-border-strong);border-radius:10px;cursor:pointer;margin-bottom:8px;transition:border-color .18s,background .18s;touch-action:manipulation;background:rgba(13,18,25,.4)}
.mapmod:active{background:rgba(33,230,138,.04);border-color:rgba(33,230,138,.2)}
.mapmod.done{border-color:rgba(33,230,138,.2);background:rgba(33,230,138,.03)}
.mapmod-num{font-family:var(--mono);font-size:.6rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--eg-muted-2);min-width:24px}
.mapmod-name{flex:1;font-size:.9rem;font-weight:700;color:var(--eg-text)}
.mapmod-check{color:var(--eg-green);font-weight:700;font-size:.88rem}

/* POINTS FLOAT */
.pts-float{position:fixed;pointer-events:none;z-index:300;font-family:var(--display);font-weight:400;font-size:2rem;color:var(--eg-green);text-transform:uppercase;left:50%;transform:translateX(-50%);animation:pfloat .9s ease-out forwards;text-shadow:0 0 24px rgba(33,230,138,.6)}
@keyframes pfloat{0%{opacity:1;top:65%}100%{opacity:0;top:35%}}

/* REDUCED MOTION */
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
/* BACKDROP FALLBACK */
@supports not((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .top,.nav,.mapcard{background:rgba(4,6,9,.97)}
  .mmap-card,.hook-card,.prompt-card,.rules-card,.flash-face,.course-main{background:rgba(9,13,20,.97)}
}
/* MOBILE */
@media(max-width:480px){
  .stage{padding:16px 14px 20px}
  .screen-title{font-size:2.1rem}
  .wmap-grid{grid-template-columns:1fr}
  .prompt-box{font-size:.77rem;padding:12px}
  .copy-btn{width:100%;justify-content:center}
  .hook-card{padding:14px}
  .concept-note{font-size:.77rem;padding:10px 12px}
  .top-where{display:none}
  .eg-logo-text{font-size:15px}
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
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>AI Course — ${esc(course.business_name)}</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="app">

    <div class="top">
      <div class="eg-logo" aria-label="Econ Growth">
        <span class="eg-logo-dot"></span>
        <span class="eg-logo-text">e<span class="eg-logo-c">C</span>on Growth</span>
      </div>
      <div class="top-where" id="top-where">Welcome</div>
      <div class="ptrack"><div class="pfill" id="pfill"></div></div>
      <div class="pts-badge" id="pts-badge">0 pts</div>
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
        <div class="maptitle">Modules</div>
        <button class="mapclose" onclick="closeMap()">Close</button>
      </div>
      <div class="maplist" id="maplist"></div>
    </div>
  </div>

  <canvas id="confetti-canvas" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1000;display:block"></canvas>
  <div id="pts-float" class="pts-float" hidden>+12</div>

  <script>
    function eh(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    const TOTAL = ${total};
    const SLUG = ${JSON.stringify(slug)};
    const MS = ${JSON.stringify(moduleStarts)};
    const CL = ${checklistLen};
    const STUDY = ${JSON.stringify(course.study || {flashcards:[],quiz:[],match:[]}).replace(/</g,'\\u003c')};
    const SMODS = ${JSON.stringify(screens.map(s => s.module))};
    const SIDS = ${JSON.stringify(screens.map(s => s.id))};
    const MNAMES = ['Intro','AI Command Center','Prompt Library','Workflow Map','Privacy Rules','First Steps'];
    const WIN_IDS = new Set(['m1-win','m2-win','m3-win','m4-win','m5-win','grad']);
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
      document.getElementById('pfill').style.width = (cur / (TOTAL - 1) * 100) + '%';
      const whereEl = document.getElementById('top-where');
      if (whereEl) {
        if (SIDS[cur] === 'welcome') whereEl.textContent = 'Welcome';
        else if (SIDS[cur] === 'module-map') whereEl.textContent = 'Dashboard';
        else if (inMod) whereEl.textContent = MNAMES[mod];
        else whereEl.textContent = '';
      }
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
      renderDots();
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

    function openMap() {
      const modal = document.getElementById('module-modal');
      if (!modal) return;
      const list = document.getElementById('maplist');
      if (list) {
        const entries = [
          {n:1,name:'AI Command Center'},{n:2,name:'Prompt Library'},
          {n:3,name:'Workflow Map'},{n:4,name:'Privacy Rules'},{n:5,name:'First Steps'}
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

    function launchConfetti() {
      const canvas = document.getElementById('confetti-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const colors = ['#21E68A','#96FFD2','#EAF0FF','#1A9E6A','#ffffff','#070A0F','#21E68A'];
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

    function copyEl(id, btn) {
      const text = document.getElementById(id).innerText;
      navigator.clipboard.writeText(text).then(() => {
        const o = btn.textContent; btn.textContent = 'Copied'; btn.classList.add('copied');
        setTimeout(() => { btn.textContent = o; btn.classList.remove('copied'); }, 2000);
      }).catch(() => {
        const el = document.getElementById(id), r = document.createRange();
        r.selectNodeContents(el); const sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(r); document.execCommand('copy'); sel.removeAllRanges();
        const o = btn.textContent; btn.textContent = 'Copied';
        setTimeout(() => btn.textContent = o, 2000);
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
        if (backBtn) backBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (modeBack) modeBack.style.display = 'block';
      }
      renderDots();
      document.getElementById('course-main').scrollTo({top:0,behavior:'instant'});
      if (m === 'flash') initFlash();
      if (m === 'quiz')  initQuiz();
      if (m === 'match') initMatch();
    }

    let fIdx=0, fFlipped=false, fKnown=new Set(), fQueue=[];
    function initFlash() {
      fQueue = STUDY.flashcards.map((_,i)=>i).sort(()=>Math.random()-.5);
      fIdx=0; fFlipped=false; fKnown.clear(); renderFlash();
    }
    function renderFlash() {
      const p = document.getElementById('flash-panel');
      const cards = STUDY.flashcards;
      if (!cards.length) { p.innerHTML='<div class="imode-inner"><p class="no-study">No flashcards yet — generate a new course to get them.</p></div>'; return; }
      if (fIdx >= fQueue.length) {
        const k = fKnown.size, t = cards.length;
        p.innerHTML = '<div class="imode-inner"><div class="flash-done">'
          + '<div class="flash-done-title">'+(k===t?'All '+t+' known':k+' of '+t+' known')+'</div>'
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

    let qIdx=0, qAnswered=false, qScore=0, qOrd=[];
    function initQuiz() {
      qOrd = STUDY.quiz.map((_,i)=>i).sort(()=>Math.random()-.5);
      qIdx=0; qAnswered=false; qScore=0; renderQuiz();
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

    let mSel=null, mDone=new Set(), mTerms=[], mDefs=[];
    function initMatch() {
      const pairs=STUDY.match;
      if(!pairs||!pairs.length){document.getElementById('match-panel').innerHTML='<div class="imode-inner"><p class="no-study">No matching pairs yet.</p></div>';return;}
      mSel=null; mDone.clear();
      mTerms=pairs.map((p,i)=>({txt:p.term,idx:i})).sort(()=>Math.random()-.5);
      mDefs=pairs.map((p,i)=>({txt:p.def,idx:i})).sort(()=>Math.random()-.5);
      renderMatch();
    }
    function renderMatch() {
      const p=document.getElementById('match-panel');
      const total=STUDY.match.length;
      if(mDone.size===total){
        p.innerHTML='<div class="imode-inner"><div class="match-done"><div class="match-done-title">All matched.</div><div class="match-done-score">'+total+' / '+total+' correct</div><button class="btn-restart" onclick="initMatch()">Play again</button></div></div>';
        return;
      }
      const pct=Math.round(mDone.size/total*100);
      const tCols = mTerms.map((t,i)=>'<div class="match-card'+(mDone.has(t.idx)?' matched':(mSel&&mSel.side==='t'&&mSel.i===i?' selected':''))+'" onclick="selM(&apos;t&apos;,'+i+')" id="mt'+i+'">'+eh(t.txt)+'</div>').join('');
      const dCols = mDefs.map((d,i)=>'<div class="match-card'+(mDone.has(d.idx)?' matched':'')+'" onclick="selM(&apos;d&apos;,'+i+')" id="md'+i+'">'+eh(d.txt)+'</div>').join('');
      p.innerHTML='<div class="imode-inner">'
        +'<div class="match-header"><span class="match-ctr">'+mDone.size+' / '+total+'</span><div class="match-bar"><div class="match-bar-fill" style="width:'+pct+'%"></div></div></div>'
        +'<div class="match-hint">Tap a term, then its matching definition.</div>'
        +'<div class="match-cols"><div><div class="match-col-lbl">Terms</div><div class="match-col-cards">'+tCols+'</div></div>'
        +'<div><div class="match-col-lbl">Definitions</div><div class="match-col-cards">'+dCols+'</div></div></div></div>';
    }
    function selM(side, i) {
      const item = side==='t' ? mTerms[i] : mDefs[i];
      if (mDone.has(item.idx)) return;
      if (!mSel) {
        if (side!=='t') return;
        mSel={side,i};
        document.getElementById('mt'+i)?.classList.add('selected');
        return;
      }
      if (mSel.side==='t' && side==='d') {
        const tIdx=mTerms[mSel.i].idx, dIdx=mDefs[i].idx;
        if (tIdx===dIdx) {
          mDone.add(tIdx); mSel=null; renderMatch();
        } else {
          const te=document.getElementById('mt'+mSel.i), de=document.getElementById('md'+i);
          [te,de].forEach(el=>{if(el){el.classList.add('wrong');setTimeout(()=>el.classList.remove('wrong','selected'),500);}});
          mSel=null;
        }
      } else if (mSel.side==='t' && side==='t') {
        document.getElementById('mt'+mSel.i)?.classList.remove('selected');
        mSel={side,i};
        document.getElementById('mt'+i)?.classList.add('selected');
      }
    }
  </script>
</body>
</html>`;

  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
