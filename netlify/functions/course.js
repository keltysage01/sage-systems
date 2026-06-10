import { getStore } from "@netlify/blobs";

export const config = { path: "/course" };

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
  const { name, business_name, welcome, brain, prompts = [], map = {}, rules = [], checklist = [], logo } = course;
  const biz = esc(business_name);
  const owner = esc(name);
  const slug = (business_name || "course").toLowerCase().replace(/[^a-z0-9]+/g, "_");

  const screens = [];
  const moduleStarts = {};

  const lessonItem = (t) => `<div class="lesson-item"><span class="li-dot"></span>${t}</div>`;

  const winScreen = (module, capability, next) => `
    <div class="win-screen">
      <div class="win-icon"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 15l6 6L23 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
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
        ${logo ? `<img class="welcome-logo" src="${logo}" alt="${biz}" onerror="this.style.display='none'" style="mix-blend-mode:multiply;object-fit:contain"/>` : `<div class="welcome-biz-name">${biz}</div>`}
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
      ${logo ? `<img src="${logo}" alt="${biz}" class="grad-logo" onerror="this.style.display='none'" style="mix-blend-mode:multiply;object-fit:contain"/>` : `<div class="grad-biz-name">${biz}</div>`}
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
  --olive:#1C412C;--olive-mid:#3a5e45;--sage:#7A9C78;--sage-light:#a8c8a4;
  --neon:#00F057;--paper:#fff;--sand:#F4F9F4;--sand2:#EDF4ED;--line:#DCE9DC;
  --text:#111111;--text-mid:#4a5568;
  --display:"Bebas Neue",Impact,"Arial Narrow",sans-serif;
  --body:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  --mono:"JetBrains Mono",ui-monospace,monospace;
  --r:16px;
}
html,body{height:100%}
body{font-family:var(--body);background:#fff;color:var(--text);-webkit-font-smoothing:antialiased;overflow:hidden}

/* APP SHELL */
.app{display:flex;flex-direction:column;height:100dvh;height:100vh;max-width:600px;margin:0 auto;background:#fff}

/* TOP BAR */
.top{flex-shrink:0;display:flex;align-items:center;gap:8px;padding:10px 16px;border-bottom:1.5px solid var(--line);background:#fff;z-index:50}
.top-logo{height:28px;width:auto;mix-blend-mode:multiply;object-fit:contain;max-width:90px;flex-shrink:0}
.top-biz{font-family:var(--display);font-weight:700;font-size:13px;color:var(--text);max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:0}
.top-where{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--sage);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:0 1 auto;min-width:0}
.ptrack{flex:1;height:4px;border-radius:99px;background:var(--line);overflow:hidden;min-width:20px}
.pfill{height:100%;width:0%;border-radius:99px;background:linear-gradient(90deg,var(--olive),var(--sage));transition:width .5s cubic-bezier(.2,.8,.2,1)}
.pts-badge{flex-shrink:0;font-size:11px;font-weight:800;color:var(--text);background:var(--sand);border:1.5px solid var(--line);border-radius:99px;padding:4px 10px;white-space:nowrap;letter-spacing:-.1px}
.pts-badge.bump{animation:ptsbump .4s ease}
@keyframes ptsbump{0%,100%{transform:scale(1)}40%{transform:scale(1.2)}}
.btn-mods{flex-shrink:0;border:1.5px solid var(--line);background:#fff;color:var(--text);cursor:pointer;font-family:var(--body);font-size:11px;font-weight:700;padding:5px 11px;border-radius:99px;white-space:nowrap;transition:background .15s}
.btn-mods:active{background:var(--sand)}

/* MODE BAR */
.mode-bar{flex-shrink:0;display:none;gap:6px;align-items:center;padding:8px 14px;border-bottom:1.5px solid var(--line);background:var(--sand);flex-wrap:wrap}
.mode-btn{flex-shrink:0;padding:7px 14px;min-height:36px;border-radius:99px;font-size:.78rem;font-weight:700;border:1.5px solid transparent;background:transparent;color:var(--sage);cursor:pointer;transition:all .18s;font-family:inherit;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.mode-btn svg{width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2}
.mode-btn.active{background:var(--olive);color:#fff;border-color:var(--text)}

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
.dot{width:6px;height:6px;border-radius:50%;background:var(--line);transition:all .25s;flex-shrink:0}
.dot.active{background:var(--olive);width:18px;border-radius:3px}
.dot.visited{background:var(--sage)}

/* NAV */
.nav{flex-shrink:0;display:flex;align-items:center;gap:12px;padding:10px 16px calc(14px + env(safe-area-inset-bottom,0px));background:#fff;border-top:1.5px solid var(--line)}
.nav-back{background:none;border:none;cursor:pointer;color:var(--sage);font-family:var(--body);font-size:.95rem;font-weight:600;padding:10px 6px;min-width:52px;text-align:left;transition:color .15s}
.nav-back:active{color:var(--text)}
.nav-next{flex:1;background:var(--olive);color:#fff;border:none;border-radius:99px;font-family:var(--body);font-weight:800;font-size:1rem;padding:15px 24px;cursor:pointer;transition:transform .15s,background .15s;box-shadow:0 6px 20px rgba(28,65,44,.22);text-align:center;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.nav-next:active{transform:scale(.98)}
.btn-mode-back{display:none;width:100%;padding:14px 24px;background:#fff;border:1.5px solid var(--line);color:var(--text);font-family:var(--body);font-size:.95rem;font-weight:700;border-radius:99px;cursor:pointer;touch-action:manipulation}

/* GLASS CARD (legacy compat) */
.gl{background:var(--sand);border:1.5px solid var(--line);border-radius:var(--r)}

/* TYPOGRAPHY */
.screen-tag{font-family:var(--mono);font-size:.63rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--sage);margin-bottom:10px}
.screen-title{font-family:var(--display);font-size:clamp(1.65rem,5vw,2.2rem);font-weight:800;letter-spacing:-.02em;line-height:1.15;margin-bottom:12px;color:var(--text)}
.screen-desc{font-size:.93rem;color:var(--sage);line-height:1.65;margin-bottom:20px}

/* WELCOME */
.welcome-shell{padding:16px 0 8px}
.welcome-identity{margin-bottom:20px}
.welcome-logo{height:60px;width:auto;margin-bottom:8px;mix-blend-mode:multiply;object-fit:contain}
.welcome-tag{font-size:.62rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--sage);margin-top:6px}
.welcome-biz-name{font-family:var(--display);font-size:clamp(1.8rem,6vw,2.4rem);font-weight:800;letter-spacing:-.03em;color:var(--text);margin-bottom:4px;line-height:1.1}
.welcome-stats{display:flex;align-items:center;border:1.5px solid var(--line);border-radius:var(--r);padding:14px 18px;margin-bottom:18px;background:var(--sand)}
.wstat{display:flex;flex-direction:column;align-items:center;flex:1}
.wstat-n{font-family:var(--display);font-size:1.75rem;font-weight:800;color:var(--text);letter-spacing:-.04em;line-height:1}
.wstat-l{font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--sage);margin-top:4px}
.wstat-div{width:1px;height:32px;background:var(--line);flex-shrink:0;margin:0 6px}
.welcome-body-card{padding:18px 20px;margin-bottom:6px}
.welcome-body{font-size:.9rem;color:var(--text-mid);line-height:1.7;margin:0}
.welcome-body+.welcome-body{margin-top:12px}
.welcome-bullets{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
.welcome-bullets li{font-size:.9rem;color:var(--text-mid);line-height:1.5;padding-left:18px;position:relative}
.welcome-bullets li::before{content:"—";position:absolute;left:0;color:var(--sage);font-weight:700}

/* SETUP */
.setup-list{margin-top:16px;display:flex;flex-direction:column;gap:8px}
.setup-row{display:flex;align-items:flex-start;gap:10px;font-size:.88rem;color:var(--text-mid);line-height:1.5;padding:12px 14px;background:var(--sand);border:1.5px solid var(--line);border-radius:12px}
.setup-dot{width:7px;height:7px;border-radius:50%;background:var(--olive);flex-shrink:0;margin-top:5px}

/* MODULE MAP (dashboard) */
.mmap-header{margin-bottom:16px}
.mmap-dash-title{font-family:var(--display);font-size:1.6rem;font-weight:800;color:var(--text);letter-spacing:-.03em;margin-bottom:4px}
.mmap-dash-sub{font-size:.83rem;color:var(--sage)}
.mmap-featured{margin-bottom:12px}
.mmap-featured .mmap-card{padding:20px 18px 16px}
.mmap-featured .mmap-title{font-weight:700;margin-bottom:10px}
.mmap-featured .start-btn{display:inline-block;background:var(--olive);color:#fff;font-size:.8rem;font-weight:700;padding:8px 18px;border-radius:99px;cursor:pointer;font-family:inherit;border:none}
.mmap-grid{display:flex;flex-direction:column;gap:8px}
.mmap-card{background:#fff;border:1.5px solid var(--line);border-radius:var(--r);padding:14px 16px;cursor:pointer;transition:border-color .18s;position:relative}
.mmap-card:active{background:var(--sand)}
.mmap-card.done{border-color:var(--sage-light);background:var(--sand)}
.mmap-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.mmap-left{flex:1;min-width:0}
.mmap-num{font-family:var(--mono);font-size:.58rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--sage);margin-bottom:4px}
.mmap-title{font-family:var(--display);font-size:1.05rem;color:var(--text);margin-bottom:8px;line-height:1.15;letter-spacing:.02em}
.mmap-progress-track{height:3px;background:var(--line);border-radius:99px;overflow:hidden}
.mmap-progress-fill{height:3px;background:var(--olive);border-radius:99px;transition:width .4s}
.mmap-card.done .mmap-progress-fill{background:var(--olive)}
.mmap-icon{width:36px;height:36px;flex-shrink:0;background:var(--sand);border:1.5px solid var(--line);border-radius:10px;display:flex;align-items:center;justify-content:center}
.mmap-icon svg{width:16px;height:16px;stroke:var(--sage);fill:none;stroke-width:1.8}

/* MODULE INTRO */
.module-intro-shell{padding-bottom:6px}
.mod-badge{font-family:var(--display);font-style:italic;font-size:4rem;font-weight:700;color:var(--text);opacity:.18;line-height:1;margin-bottom:12px;letter-spacing:-.04em}
.lesson-list{margin-top:16px;display:flex;flex-direction:column;gap:8px}
.lesson-item{display:flex;align-items:center;gap:10px;font-size:.88rem;color:var(--text-mid);padding:11px 14px;background:var(--sand);border:1.5px solid var(--line);border-radius:12px}
.li-dot{width:6px;height:6px;border-radius:50%;background:var(--olive);flex-shrink:0}

/* HOOK CARD */
.hook-card{background:#fff;border:1.5px solid var(--line);border-left:3px solid var(--olive);border-radius:0 var(--r) var(--r) 0;padding:18px;font-size:.93rem;color:var(--text-mid);line-height:1.7;margin-bottom:16px}
.hook-bullets ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:11px}
.hook-bullets li{padding-left:20px;position:relative;font-size:.9rem;line-height:1.5;color:var(--text-mid)}
.hook-bullets li::before{content:"";position:absolute;left:0;top:7px;width:7px;height:7px;border-radius:50%;background:var(--olive);flex-shrink:0}
.tool-pills{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}
.tool-pill{font-size:.7rem;font-weight:700;color:var(--text);background:var(--sand);border:1.5px solid var(--line);padding:4px 11px;border-radius:99px}

/* PROMPT CARD */
.prompt-card{background:var(--sand);border:1.5px solid var(--line);border-radius:var(--r);padding:18px}
.prompt-dest{font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--sage);margin-bottom:10px}
.prompt-dest strong{color:var(--text)}
.prompt-box{background:#fff;border:1.5px solid var(--line);border-radius:12px;padding:14px;font-family:"SF Mono","Fira Code",monospace;font-size:.77rem;color:var(--text);white-space:pre-wrap;line-height:1.6;max-height:220px;overflow-y:auto;margin-bottom:11px}
.copy-btn{display:inline-flex;align-items:center;gap:6px;background:var(--olive);color:#fff;font-size:.8rem;font-weight:700;padding:9px 20px;border-radius:99px;border:none;cursor:pointer;font-family:inherit;transition:background .15s;touch-action:manipulation}
.copy-btn:active{background:var(--olive-mid)}
.copy-btn.copied{background:#2d9a5e}
.star-reminder{margin-top:12px;padding:10px 13px;background:#FFFBEB;border:1.5px solid #F0E68C;border-radius:10px;font-size:.77rem;color:#6b5700;line-height:1.5}

/* WORKFLOW MAP */
.wmap-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
@media(max-width:480px){.wmap-grid{grid-template-columns:1fr}}
.wmap-col{background:#fff;border:1.5px solid var(--line);border-radius:var(--r);padding:14px}
.wmap-improve{border-color:var(--line);background:var(--sand)}
.wmap-col-title{font-family:var(--mono);font-size:.6rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--sage);margin-bottom:8px}
.wmap-col ul{list-style:none}
.wmap-col ul li{font-size:.8rem;color:var(--text-mid);padding:6px 0;border-bottom:1px solid var(--line);line-height:1.4}
.wmap-col ul li:last-child{border-bottom:none}
.wmap-col ul li::before{content:"–";margin-right:6px;color:var(--sage)}

/* PRIVACY RULES */
.rules-card{background:#fff;border:1.5px solid var(--line);border-radius:var(--r);padding:4px 18px}
.rules-list{list-style:none}
.rules-list li{display:flex;gap:11px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--line);font-size:.88rem;color:var(--text-mid);line-height:1.5}
.rules-list li:last-child{border-bottom:none}
.rule-x{color:#c94040;font-weight:800;flex-shrink:0;font-size:.88rem;margin-top:1px}

/* CHECKLIST */
.check-list{list-style:none}
.check-item{display:flex;align-items:flex-start;gap:11px;padding:12px 14px;background:#fff;border:1.5px solid var(--line);border-radius:12px;margin-bottom:7px;cursor:pointer;font-size:.9rem;color:var(--text-mid);line-height:1.5;user-select:none;transition:border-color .18s,background .18s;touch-action:manipulation}
.check-item.checked-item{background:var(--sand2);border-color:var(--sage-light);color:var(--text)}
.check-box{width:20px;height:20px;border:2px solid var(--line);border-radius:6px;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;background:#fff;transition:all .18s}
.check-box.checked{background:var(--olive);border-color:var(--olive)}
.check-box.checked::after{content:"✓";color:#fff;font-size:.65rem;font-weight:900}

/* CONCEPT NOTE */
.concept-note{margin-top:14px;background:var(--sand);border-left:3px solid var(--olive);border-radius:0 10px 10px 0;padding:11px 15px;font-size:.82rem;line-height:1.55;color:var(--text-mid)}
.concept-note strong{font-weight:800;color:var(--text)}
.concept-note .d-pill{display:inline-block;font-size:.66rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;background:var(--olive);color:#fff;border-radius:99px;padding:2px 8px;margin-right:6px}

/* WIN */
.win-screen{padding:20px 0}
.win-icon{width:60px;height:60px;background:var(--sand2);border:1.5px solid var(--line);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:16px;color:var(--olive)}
.win-eyebrow{font-size:.62rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--sage);margin-bottom:8px}
.win-text{font-family:var(--display);font-size:1.4rem;font-weight:800;letter-spacing:-.02em;color:var(--text);margin-bottom:14px;line-height:1.2}
.win-next{font-size:.9rem;color:var(--sage);line-height:1.6;max-width:460px}

/* GRADUATION */
.grad-shell{padding:16px 0}
.grad-logo{height:60px;width:auto;margin-bottom:20px;mix-blend-mode:multiply;object-fit:contain}
.grad-biz-name{font-family:var(--display);font-size:clamp(1.6rem,5vw,2rem);font-weight:800;letter-spacing:-.03em;color:var(--text);margin-bottom:18px;line-height:1.1}
.grad-headline{font-family:var(--display);font-size:clamp(2rem,7vw,2.8rem);font-weight:800;letter-spacing:-.04em;color:var(--text);margin-bottom:8px;line-height:1}
.grad-sub{font-size:.93rem;color:var(--sage);margin-bottom:22px;line-height:1.6}
.grad-list{display:flex;flex-direction:column;gap:8px;margin-bottom:22px}
.grad-item{display:flex;align-items:center;gap:10px;font-size:.88rem;color:var(--text-mid);padding:11px 16px;background:var(--sand);border:1.5px solid var(--line);border-radius:12px}
.gi-check{color:var(--olive);font-weight:700;font-size:.88rem;flex-shrink:0}
.btn-map{background:var(--sand);border:1.5px solid var(--line);color:var(--text);font-size:.88rem;font-weight:700;padding:10px 22px;border-radius:99px;cursor:pointer;font-family:inherit}

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
.flash-face{position:absolute;inset:0;border-radius:20px;background:#fff;border:1.5px solid var(--line);box-shadow:0 6px 28px rgba(28,65,44,.09);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 24px;text-align:center;backface-visibility:hidden;-webkit-backface-visibility:hidden}
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
.quiz-choice{padding:14px 18px;min-height:52px;border-radius:14px;border:1.5px solid var(--line);background:#fff;color:var(--text);font-size:.9rem;font-weight:600;text-align:left;cursor:pointer;font-family:inherit;width:100%;display:flex;align-items:center;transition:border-color .15s;line-height:1.4;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
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

/* MODULE MODAL */
.mapback{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:200;display:flex;align-items:flex-end;justify-content:center}
.mapback[hidden]{display:none}
.mapcard{background:#fff;border-radius:24px 24px 0 0;padding:22px 18px calc(24px + env(safe-area-inset-bottom,0px));width:100%;max-width:600px;max-height:80vh;overflow-y:auto}
.maptop{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.maptitle{font-family:var(--display);font-size:1.3rem;font-weight:800;color:var(--text);letter-spacing:-.02em}
.mapclose{background:var(--sand);border:1.5px solid var(--line);color:var(--sage);border-radius:99px;font-size:.82rem;font-weight:700;padding:6px 14px;cursor:pointer;font-family:inherit}
.mapmod{display:flex;align-items:center;gap:14px;padding:13px 14px;border:1.5px solid var(--line);border-radius:14px;cursor:pointer;margin-bottom:8px;transition:border-color .18s,background .18s;touch-action:manipulation}
.mapmod:active{background:var(--sand)}
.mapmod.done{border-color:var(--sage-light);background:var(--sand)}
.mapmod-num{font-size:.65rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--sage);min-width:24px}
.mapmod-name{flex:1;font-size:.92rem;font-weight:700;color:var(--text)}
.mapmod-check{font-size:.88rem;color:var(--olive);font-weight:700}

/* POINTS FLOAT */
.pts-float{position:fixed;pointer-events:none;z-index:300;font-family:var(--display);font-weight:800;font-size:1.4rem;color:var(--text);left:50%;transform:translateX(-50%);animation:pfloat .9s ease-out forwards}
@keyframes pfloat{0%{opacity:1;top:65%}100%{opacity:0;top:35%}}

/* MOBILE */
@media(max-width:480px){
  .stage{padding:16px 14px 20px}
  .screen-title{font-size:1.55rem}
  .wmap-grid{grid-template-columns:1fr}
  .prompt-box{font-size:.8rem;padding:12px}
  .copy-btn{width:100%;justify-content:center}
  .hook-card{padding:14px}
  .concept-note{font-size:.78rem;padding:10px 12px}
  .top-where{display:none}
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
  <style>${CSS}</style>${brandCSS(course.brand_color) ? `<style>${brandCSS(course.brand_color)}</style>` : ''}
</head>
<body>
  <div class="app">

    <div class="top">
      ${course.logo ? `<img class="top-logo" src="${course.logo}" alt="${esc(course.business_name)}" onerror="this.style.display='none'"/>` : `<div class="top-biz">${esc(course.business_name)}</div>`}
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

  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
