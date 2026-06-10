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
  const bg1 = lighten(brand, 0.86);
  const bg2 = lighten(brand, 0.79);
  const bg3 = lighten(brand, 0.72);
  return `:root{--olive:${olive};--olive-mid:${oliveMid};--sage:${sage};--sage-light:${sageLight}}` +
    `body{background:linear-gradient(155deg,${bg1} 0%,${bg2} 40%,${bg3} 100%)}`;
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
      <div class="win-icon"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 15l6 6L23 8" stroke="#00F057" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
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
  screens.push({ id: "welcome", module: 0, html: `
    <div class="welcome-shell">
      <div class="welcome-identity">
        ${logo ? `<img class="welcome-logo" src="${logo}" alt="${biz}" onerror="this.style.display='none'" style="mix-blend-mode:multiply;object-fit:contain"/>` : `<div class="welcome-biz-name">${biz}</div>`}
        <div class="welcome-tag">Custom AI Course</div>
      </div>
      <h1 class="welcome-title">Your AI course<br/>is ready, ${owner}.</h1>
      <div class="welcome-stats">
        <div class="wstat"><span class="wstat-n">5</span><span class="wstat-l">Modules</span></div>
        <div class="wstat-div"></div>
        <div class="wstat"><span class="wstat-n">${prompts.length}</span><span class="wstat-l">Prompts</span></div>
        <div class="wstat-div"></div>
        <div class="wstat"><span class="wstat-n">✓</span><span class="wstat-l">Self-paced</span></div>
      </div>
      <div class="welcome-body-card gl">
        <p class="welcome-body">${esc(welcome).replace(/\n\n/g,"</p><p class=\"welcome-body\">").replace(/\n/g,"<br/>")}</p>
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
            <div class="mmap-title" style="font-size:1.1rem">${modulesMeta[0].title}</div>
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
    <h2 class="screen-title">Picture this</h2>
    <div class="hook-card">Every time you open a new AI chat, AI has no idea who you are, what your business does, or what your rules are. You start from scratch every single time.<br/><br/>The Business Brain fixes that. One paste at the start of every session — and AI already knows ${biz}, your clients, your voice, and your limits.</div>
    <div class="tool-pills"><span class="tool-pill">Claude</span><span class="tool-pill">ChatGPT</span><span class="tool-pill">Any AI chat</span></div>
    <div class="concept-note"><span class="d-pill">Delegation</span><strong>Should AI do this?</strong> The first skill in AI fluency is knowing which tasks to hand off. The Business Brain earns AI more delegation — by giving it the context to make good calls on your behalf.</div>` });

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
    <h2 class="screen-title">The idea</h2>
    <div class="hook-card">Generic prompts give generic results. These were written for ${biz} — your workflows, your tools, your clients.<br/><br/>Start with one. Copy it. Fill in the brackets. Paste it. See what comes back. Then improve from there. Do this before making it fancy.</div>
    <div class="tool-pills"><span class="tool-pill">Claude</span><span class="tool-pill">ChatGPT</span></div>
    <div class="concept-note"><span class="d-pill">Description</span><strong>Am I communicating clearly?</strong> The quality of AI's output is directly tied to the quality of your prompt. These are pre-built with the three ingredients of clear description: what you want, how you want it done, and what a good result looks like.</div>` });

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
    <h2 class="screen-title">The idea</h2>
    <div class="hook-card">Not everything in your business should be automated. Some things AI does well — drafting, summarizing, generating options. Some things need your judgment, your relationships, your expertise.<br/><br/>This map shows you what's what for ${biz}.</div>
    <div class="concept-note"><span class="d-pill">Discernment</span><strong>Is this output trustworthy?</strong> AI can hallucinate — state wrong information with full confidence. The workflow map shows where human review belongs. Always check AI outputs before they reach a client.</div>` });

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
    <h2 class="screen-title">The idea</h2>
    <div class="hook-card">AI is powerful, but it's a third-party system. Anything you paste into a public AI tool could be used to improve that tool's models.<br/><br/>Before you automate anything, know what information should never leave your hands.</div>
    <div class="concept-note"><span class="d-pill">Diligence</span><strong>Am I responsible for this?</strong> You're accountable for what AI produces on your behalf — even if AI wrote the first draft. That means verifying outputs, disclosing AI use when appropriate, and keeping client data private.</div>` });

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
    <h2 class="screen-title">Do this before making it fancy</h2>
    <div class="hook-card">Start with the manual version of every workflow. See if AI actually helps. Keep what works. Skip what doesn't.<br/><br/>One step at a time. You don't have to automate everything today — you just have to start.</div>` });

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
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --olive:#1C412C;--olive-mid:#2d6040;--sage:#7A9C78;--sage-light:#a8c8a4;--neon:#00F057;
  --glass:rgba(255,255,255,0.28);--glass-hi:rgba(255,255,255,0.55);--glass-border:rgba(255,255,255,0.6);
  --glass-shine:rgba(255,255,255,0.7);--r:18px;
  --text:#1C412C;--muted:#7A9C78;--shadow:0 4px 24px rgba(28,65,44,.08);
}
html,body{height:100%;margin:0;padding:0;overflow:hidden}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:linear-gradient(155deg,#e2ead8 0%,#d0e2c4 40%,#c4d9b4 100%);color:var(--text);line-height:1.6}
.app-shell{position:fixed;inset:0;display:flex;flex-direction:column;overflow:hidden}
.bg-mesh{position:fixed;inset:0;z-index:0;background:radial-gradient(ellipse 70% 50% at 20% 15%,rgba(200,230,180,.5) 0%,transparent 55%),radial-gradient(ellipse 55% 45% at 80% 80%,rgba(160,210,150,.35) 0%,transparent 55%),radial-gradient(ellipse 60% 55% at 60% 30%,rgba(220,240,200,.4) 0%,transparent 60%);animation:mesh 18s ease-in-out infinite alternate;pointer-events:none}
@keyframes mesh{0%{opacity:.8}100%{opacity:1;filter:hue-rotate(8deg)}}

/* SHELL */
.course-top{flex-shrink:0;position:relative;z-index:100;background:var(--glass);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);border-bottom:1px solid var(--glass-border);height:60px;padding:0 20px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 0 var(--glass-shine),inset 0 1px 0 var(--glass-shine)}
.top-logo{height:36px;width:auto;mix-blend-mode:multiply;object-fit:contain;max-width:160px}
.top-biz-pill{font-size:.85rem;font-weight:800;letter-spacing:-.3px;color:var(--olive);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.top-right{display:flex;align-items:center;gap:10px}
.btn-map-top{font-size:.72rem;font-weight:600;color:var(--olive);background:var(--glass);border:1px solid var(--glass-border);border-radius:100px;padding:5px 14px;cursor:pointer;transition:all .2s;font-family:inherit}
.btn-map-top:hover{background:rgba(255,255,255,.5)}
.progress-rail{position:absolute;bottom:0;left:0;right:0;height:2px;background:rgba(122,156,120,.2)}
.progress-fill{height:2px;background:linear-gradient(90deg,var(--olive),var(--neon));transition:width .4s ease}

.course-main{flex:1;overflow-y:auto;overflow-x:hidden}
.card-wrap{max-width:740px;margin:0 auto;padding:24px 16px 32px}

/* SCREENS */
.screen{display:none}
.screen.active{display:block}
.screen.anim-right{animation:sInR .3s cubic-bezier(.22,1,.36,1)}
.screen.anim-left{animation:sInL .3s cubic-bezier(.22,1,.36,1)}
@keyframes sInR{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
@keyframes sInL{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:translateX(0)}}

/* BOTTOM NAV — iOS glass tab bar */
.course-nav{flex-shrink:0;background:rgba(255,255,255,.38);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);border-top:1px solid var(--glass-border);padding:12px 24px max(14px,env(safe-area-inset-bottom,14px));display:flex;justify-content:space-between;align-items:center;gap:12px;box-shadow:inset 0 1px 0 var(--glass-shine)}
.btn-arrow{width:52px;height:52px;border-radius:50%;background:var(--glass);border:1px solid var(--glass-border);color:var(--olive);font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;font-family:inherit;flex-shrink:0;box-shadow:var(--shadow);touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.btn-arrow:hover{background:rgba(255,255,255,.55);transform:scale(1.05)}
.btn-arrow:disabled{opacity:.22;pointer-events:none}
.nav-ctr{font-size:.95rem;font-weight:700;color:var(--olive);letter-spacing:-.2px;text-align:center;min-width:64px}
.nav-ctr .nav-total{font-weight:400;color:var(--sage)}
.nav-tab-btn{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;background:none;border:none;font-family:inherit;padding:6px 12px;border-radius:12px;transition:all .2s;flex-shrink:0}
.nav-tab-btn svg{width:22px;height:22px;stroke:var(--sage);fill:none;stroke-width:1.8;transition:stroke .2s}
.nav-tab-btn span{font-size:.58rem;font-weight:600;color:var(--sage);transition:color .2s;letter-spacing:.02em}
.nav-tab-btn.active{background:rgba(28,65,44,.08)}
.nav-tab-btn.active svg{stroke:var(--olive)}
.nav-tab-btn.active span{color:var(--olive);font-weight:700}

/* GLASS CARD — reusable */
.gl{background:var(--glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:var(--r);box-shadow:var(--shadow),inset 0 1px 0 var(--glass-shine);position:relative;overflow:hidden}
.gl::before{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(130deg,rgba(255,255,255,.18) 0%,transparent 45%,rgba(255,255,255,.06) 100%);pointer-events:none}

/* TYPOGRAPHY */
.screen-tag{font-size:.63rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--sage);margin-bottom:10px}
.screen-title{font-size:clamp(1.55rem,4vw,2rem);font-weight:800;letter-spacing:-.6px;line-height:1.15;margin-bottom:14px;color:var(--olive)}
.screen-desc{font-size:.93rem;color:var(--sage);line-height:1.7;margin-bottom:24px}

/* WELCOME */
.welcome-shell{text-align:center;padding:28px 0 16px}
.welcome-identity{margin-bottom:22px}
.welcome-logo{height:72px;width:auto;margin-bottom:10px;mix-blend-mode:multiply;object-fit:contain}
.welcome-tag{font-size:.63rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--sage);margin-top:6px}
.welcome-title{font-size:clamp(1.9rem,5vw,2.5rem);font-weight:900;letter-spacing:-1.2px;line-height:1.12;margin:0 0 24px;color:var(--olive)}
.welcome-stats{display:flex;align-items:center;justify-content:center;gap:0;background:var(--glass);backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:16px;padding:18px 24px;margin-bottom:20px;box-shadow:var(--shadow),inset 0 1px 0 var(--glass-shine)}
.wstat{display:flex;flex-direction:column;align-items:center;flex:1}
.wstat-n{font-size:1.7rem;font-weight:900;color:var(--olive);letter-spacing:-1px;line-height:1}
.wstat-l{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--sage);margin-top:4px}
.wstat-div{width:1px;height:36px;background:var(--glass-border);flex-shrink:0;margin:0 8px}
.welcome-body-card{padding:20px 22px;margin-bottom:8px;text-align:left}
.welcome-body{font-size:.92rem;color:var(--olive-mid);line-height:1.78;margin:0}
.welcome-body+.welcome-body{margin-top:14px}

/* SETUP */
.setup-list{margin-top:18px;display:flex;flex-direction:column;gap:10px}
.setup-row{display:flex;align-items:flex-start;gap:10px;font-size:.88rem;color:var(--olive-mid);line-height:1.5;padding:13px 16px;background:var(--glass);border:1px solid var(--glass-border);border-radius:12px;backdrop-filter:blur(14px)}
.setup-dot{width:7px;height:7px;border-radius:50%;background:var(--neon);flex-shrink:0;margin-top:5px;box-shadow:0 0 8px var(--neon)}

/* MODULE INTRO */
.module-intro-shell{padding-bottom:8px}
.mod-badge{width:52px;height:52px;background:var(--olive);color:#fff;font-size:1.15rem;font-weight:900;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;letter-spacing:-.5px;box-shadow:0 4px 16px rgba(28,65,44,.25)}
.lesson-list{margin-top:18px;display:flex;flex-direction:column;gap:10px}
.lesson-item{display:flex;align-items:center;gap:10px;font-size:.9rem;color:var(--olive-mid);padding:12px 16px;background:var(--glass);border:1px solid var(--glass-border);border-radius:12px;backdrop-filter:blur(14px)}
.li-dot{width:6px;height:6px;border-radius:50%;background:var(--neon);flex-shrink:0;box-shadow:0 0 6px var(--neon)}

/* MODULE MAP — main dashboard view */
.mmap-header{text-align:center;margin-bottom:20px}
.mmap-dash-title{font-size:1.55rem;font-weight:700;color:var(--olive);letter-spacing:-.4px;margin-bottom:4px}
.mmap-dash-sub{font-size:.85rem;color:var(--sage)}
.mmap-featured{margin-bottom:14px}
.mmap-featured .mmap-card{padding:22px 22px 18px}
.mmap-featured .mmap-title{font-size:1.15rem;font-weight:700;margin-bottom:12px}
.mmap-featured .start-btn{display:inline-block;background:rgba(255,255,255,.65);border:1px solid var(--glass-border);color:var(--olive);font-size:.82rem;font-weight:600;padding:9px 22px;border-radius:100px;cursor:pointer;font-family:inherit;transition:all .2s;backdrop-filter:blur(10px)}
.mmap-featured .start-btn:hover{background:rgba(255,255,255,.85)}
.mmap-grid{display:flex;flex-direction:column;gap:10px}
.mmap-card{background:var(--glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:var(--r);padding:16px 18px;cursor:pointer;transition:all .2s;position:relative;box-shadow:var(--shadow),inset 0 1px 0 var(--glass-shine);overflow:hidden}
.mmap-card::before{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(130deg,rgba(255,255,255,.16) 0%,transparent 50%);pointer-events:none}
.mmap-card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(28,65,44,.12),inset 0 1px 0 var(--glass-shine)}
.mmap-card.done .mmap-progress-fill{background:var(--neon);box-shadow:0 0 8px var(--neon)}
.mmap-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.mmap-left{flex:1;min-width:0}
.mmap-num{font-size:.6rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--sage);margin-bottom:4px}
.mmap-title{font-size:.93rem;font-weight:600;color:var(--olive);margin-bottom:8px;line-height:1.3}
.mmap-progress-track{height:4px;background:rgba(122,156,120,.25);border-radius:100px;overflow:hidden}
.mmap-progress-fill{height:4px;background:var(--olive);border-radius:100px;transition:width .4s}
.mmap-icon{width:36px;height:36px;flex-shrink:0;background:rgba(255,255,255,.45);border:1px solid var(--glass-border);border-radius:10px;display:flex;align-items:center;justify-content:center}
.mmap-icon svg{width:18px;height:18px;stroke:var(--sage);fill:none;stroke-width:1.8}

/* HOOK */
.hook-card{background:var(--glass);backdrop-filter:blur(18px);border-left:3px solid var(--neon);border-radius:0 var(--r) var(--r) 0;padding:22px;font-size:.95rem;color:var(--olive-mid);line-height:1.8;margin-bottom:18px;box-shadow:var(--shadow)}
.tool-pills{display:flex;gap:8px;flex-wrap:wrap}
.tool-pill{font-size:.72rem;font-weight:600;color:var(--olive);background:rgba(255,255,255,.45);border:1px solid var(--glass-border);padding:5px 12px;border-radius:100px}

/* PROMPT CARD */
.prompt-card{background:var(--glass);backdrop-filter:blur(18px);border:1px solid var(--glass-border);border-radius:var(--r);padding:20px;box-shadow:var(--shadow)}
.prompt-dest{font-size:.7rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--sage);margin-bottom:12px}
.prompt-dest strong{color:var(--olive)}
.prompt-box{background:rgba(255,255,255,.35);border:1px solid var(--glass-border);border-radius:12px;padding:16px;font-family:"SF Mono","Fira Code",monospace;font-size:.78rem;color:var(--olive);white-space:pre-wrap;line-height:1.65;max-height:240px;overflow-y:auto;margin-bottom:12px}
.copy-btn{display:inline-flex;align-items:center;gap:6px;background:var(--olive);color:#fff;font-size:.8rem;font-weight:700;padding:9px 20px;border-radius:100px;border:none;cursor:pointer;transition:all .2s;font-family:inherit;box-shadow:0 2px 12px rgba(28,65,44,.2)}
.copy-btn:hover{background:var(--olive-mid);transform:translateY(-1px)}
.copy-btn.copied{background:#2d9a5e;box-shadow:0 0 16px rgba(0,240,87,.3)}
.star-reminder{margin-top:14px;padding:11px 14px;background:rgba(255,240,180,.3);border:1px solid rgba(200,180,100,.3);border-radius:10px;font-size:.78rem;color:var(--olive-mid);line-height:1.5;backdrop-filter:blur(8px)}

/* WORKFLOW MAP */
.wmap-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
@media(max-width:560px){.wmap-grid{grid-template-columns:1fr}}
.wmap-col{background:var(--glass);backdrop-filter:blur(18px);border:1px solid var(--glass-border);border-radius:var(--r);padding:16px;box-shadow:var(--shadow)}
.wmap-improve{border-color:rgba(0,240,87,.2);background:rgba(0,240,87,.06)}
.wmap-col-title{font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--sage);margin-bottom:10px}
.wmap-col ul{list-style:none}
.wmap-col ul li{font-size:.82rem;color:var(--olive-mid);padding:7px 0;border-bottom:1px solid rgba(122,156,120,.15);line-height:1.4}
.wmap-col ul li:last-child{border-bottom:none}
.wmap-col ul li::before{content:"–";margin-right:7px;color:var(--sage-light)}

/* PRIVACY RULES */
.rules-card{background:var(--glass);backdrop-filter:blur(18px);border:1px solid var(--glass-border);border-radius:var(--r);padding:4px 20px;box-shadow:var(--shadow)}
.rules-list{list-style:none}
.rules-list li{display:flex;gap:12px;align-items:flex-start;padding:13px 0;border-bottom:1px solid rgba(122,156,120,.15);font-size:.9rem;color:var(--olive-mid);line-height:1.5}
.rules-list li:last-child{border-bottom:none}
.rule-x{color:#c94040;font-weight:800;flex-shrink:0;font-size:.9rem;margin-top:1px}

/* CHECKLIST */
.check-list{list-style:none}
.check-item{display:flex;align-items:flex-start;gap:12px;padding:13px 16px;background:var(--glass);backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:12px;margin-bottom:8px;cursor:pointer;transition:all .2s;font-size:.9rem;color:var(--olive-mid);line-height:1.5;user-select:none}
.check-item:hover{background:rgba(255,255,255,.4);transform:translateY(-1px)}
.check-item.checked-item{background:rgba(0,240,87,.08);border-color:rgba(0,240,87,.3);color:var(--olive)}
.check-box{width:20px;height:20px;border:2px solid rgba(122,156,120,.4);border-radius:6px;flex-shrink:0;transition:all .2s;margin-top:1px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.4)}
.check-box.checked{background:var(--neon);border-color:var(--neon);box-shadow:0 0 10px rgba(0,240,87,.4)}
.check-box.checked::after{content:"✓";color:var(--olive);font-size:.65rem;font-weight:900}

/* MODE BAR */
.mode-bar{flex-shrink:0;position:relative;z-index:50;background:rgba(255,255,255,.22);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--glass-border);padding:10px 16px;display:none;gap:6px;align-items:center;flex-wrap:wrap}
.mode-btn{flex-shrink:0;padding:9px 18px;min-height:40px;border-radius:100px;font-size:.8rem;font-weight:700;border:1px solid transparent;background:transparent;color:var(--sage);cursor:pointer;transition:all .2s;font-family:inherit;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.mode-btn svg{width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2}
.mode-btn.active{background:var(--olive);color:#fff;border-color:var(--olive);box-shadow:0 2px 8px rgba(28,65,44,.2)}
/* INTERACTIVE PANELS */
.imode-panel{position:relative;z-index:2}
.imode-inner{max-width:740px;margin:0 auto;padding:20px 16px 120px}
.no-study{text-align:center;color:var(--sage);padding:40px 0;font-size:.9rem}
/* FLASHCARDS */
.flash-header{text-align:center;margin-bottom:18px}
.flash-counter{font-size:.72rem;font-weight:700;color:var(--sage);letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
.flash-bar{height:3px;background:rgba(122,156,120,.2);border-radius:2px;max-width:200px;margin:0 auto;overflow:hidden}
.flash-bar-fill{height:100%;background:var(--neon);border-radius:2px;transition:width .4s}
.flash-scene{perspective:1200px;margin:0 auto 16px;max-width:520px;height:240px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.flash-3d{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .55s cubic-bezier(.4,0,.2,1)}
.flash-3d.flipped{transform:rotateY(180deg)}
.flash-face{position:absolute;inset:0;border-radius:22px;background:rgba(255,255,255,.72);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);box-shadow:0 8px 40px rgba(28,65,44,.12),inset 0 1px 0 rgba(255,255,255,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 28px;text-align:center;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.flash-face-lbl{font-size:.6rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--sage);margin-bottom:12px}
.flash-face-text{font-size:1.15rem;font-weight:700;color:var(--olive);line-height:1.45}
.flash-back-face{transform:rotateY(180deg)}
.flash-back-face .flash-face-text{font-size:.95rem;font-weight:500;color:var(--olive-mid);line-height:1.65}
.flash-tap-cue{font-size:.72rem;color:var(--sage);text-align:center;margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:6px}
.flash-btns{display:flex;gap:10px;max-width:520px;margin:0 auto}
.flash-btns.hidden{visibility:hidden;pointer-events:none}
.btn-still{flex:1;min-height:52px;padding:14px 12px;border-radius:16px;border:1.5px solid rgba(122,156,120,.35);background:rgba(255,255,255,.5);color:var(--sage);font-size:.88rem;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.btn-know{flex:1;min-height:52px;padding:14px 12px;border-radius:16px;border:1.5px solid rgba(0,240,87,.5);background:rgba(0,240,87,.15);color:var(--olive-mid);font-size:.88rem;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.btn-still:active{background:rgba(255,255,255,.8)}
.btn-know:active{background:rgba(0,240,87,.3)}
.flash-done{text-align:center;padding:32px 0}
.flash-done-icon{font-size:2.8rem;margin-bottom:12px}
.flash-done-title{font-size:1.3rem;font-weight:800;color:var(--olive);margin-bottom:8px}
.flash-done-sub{font-size:.88rem;color:var(--sage);margin-bottom:20px;line-height:1.5}
/* QUIZ */
.quiz-qnum{font-size:.63rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--sage);margin-bottom:10px}
.quiz-qtext{font-size:1rem;font-weight:700;color:var(--olive);line-height:1.55;margin-bottom:18px}
.quiz-choices{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
.quiz-choice{padding:16px 20px;min-height:56px;border-radius:16px;border:1.5px solid var(--glass-border);background:rgba(255,255,255,.55);backdrop-filter:blur(10px);color:var(--olive);font-size:.92rem;font-weight:600;text-align:left;cursor:pointer;transition:all .2s;font-family:inherit;width:100%;display:flex;align-items:center;touch-action:manipulation;-webkit-tap-highlight-color:transparent;line-height:1.4}
.quiz-choice:active:not(:disabled){background:rgba(255,255,255,.8)}
.quiz-choice.correct{background:rgba(0,240,87,.18);border-color:rgba(0,240,87,.6);color:var(--olive-mid)}
.quiz-choice.wrong{background:rgba(220,50,50,.1);border-color:rgba(220,50,50,.45);color:#7a2020}
.quiz-choice:disabled{cursor:default}
.quiz-feed{padding:13px 16px;border-radius:14px;font-size:.83rem;line-height:1.5;display:none}
.quiz-feed.show{display:block}
.quiz-feed.correct{background:rgba(0,240,87,.1);border:1px solid rgba(0,240,87,.3);color:var(--olive-mid)}
.quiz-feed.wrong{background:rgba(220,50,50,.07);border:1px solid rgba(220,50,50,.25);color:#7a2020}
.btn-qnext{width:100%;padding:13px;border-radius:14px;background:var(--olive);color:#fff;font-size:.9rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;display:none;margin-top:12px}
.btn-qnext.show{display:block}
.quiz-score{text-align:center;padding:32px 0}
.quiz-score-num{font-size:3rem;font-weight:900;color:var(--olive);letter-spacing:-2px;margin-bottom:6px}
.quiz-score-pct{font-size:.88rem;color:var(--sage);margin-bottom:16px}
.quiz-score-msg{font-size:1rem;font-weight:700;color:var(--olive-mid);margin-bottom:24px}
/* MATCH */
.match-intro{text-align:center;margin-bottom:16px}
.match-intro p{font-size:.8rem;color:var(--sage);line-height:1.4}
.match-cols{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.match-col-lbl{font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--sage);margin-bottom:8px;text-align:center}
.match-col-cards{display:flex;flex-direction:column;gap:8px}
.match-card{padding:14px 12px;border-radius:14px;border:1.5px solid var(--glass-border);background:rgba(255,255,255,.55);backdrop-filter:blur(10px);color:var(--olive);font-size:.82rem;font-weight:600;line-height:1.4;cursor:pointer;transition:all .25s;text-align:center;min-height:64px;display:flex;align-items:center;justify-content:center;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.match-card:hover:not(.matched):not(.selected){background:rgba(255,255,255,.65)}
.match-card.selected{background:rgba(28,65,44,.12);border-color:var(--olive);box-shadow:0 0 0 2px var(--olive)}
.match-card.matched{background:rgba(0,240,87,.12);border-color:rgba(0,240,87,.5);color:var(--olive-mid);cursor:default;opacity:.8}
.match-card.wrong{animation:mshake .4s}
@keyframes mshake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
.match-done{text-align:center;padding:32px 0}
.match-done-icon{font-size:2.8rem;margin-bottom:12px}
.match-done-title{font-size:1.3rem;font-weight:800;color:var(--olive);margin-bottom:8px}
.match-done-sub{font-size:.88rem;color:var(--sage);margin-bottom:20px}
/* BACK TO LEARN NAV */
.btn-mode-back{padding:12px 22px;min-height:46px;border-radius:100px;background:rgba(255,255,255,.5);border:1px solid var(--glass-border);color:var(--olive);font-size:.84rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;white-space:nowrap;backdrop-filter:blur(10px);touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.btn-mode-back:hover{background:rgba(255,255,255,.7)}
/* RESTART BTN */
.btn-restart{padding:10px 24px;border-radius:100px;background:rgba(255,255,255,.5);border:1px solid var(--glass-border);color:var(--olive);font-size:.85rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;display:inline-block}
.btn-restart:hover{background:rgba(255,255,255,.7)}
/* CONCEPT NOTE */
.concept-note{margin-top:16px;background:rgba(28,65,44,.07);border-left:3px solid var(--olive-mid);border-radius:0 10px 10px 0;padding:12px 16px;font-size:.82rem;line-height:1.55;color:var(--olive)}.concept-note strong{font-weight:800;color:var(--olive)}.concept-note .d-pill{display:inline-block;font-size:.68rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;background:var(--olive);color:#fff;border-radius:100px;padding:2px 8px;margin-right:6px}
/* WIN */
.win-screen{padding:28px 0}
.win-icon{width:64px;height:64px;background:rgba(0,240,87,.12);border:1.5px solid rgba(0,240,87,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:18px;box-shadow:0 0 24px rgba(0,240,87,.15)}
.win-eyebrow{font-size:.63rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--sage);margin-bottom:8px}
.win-text{font-size:1.35rem;font-weight:800;letter-spacing:-.4px;color:var(--olive);margin-bottom:14px;line-height:1.2}
.win-next{font-size:.9rem;color:var(--sage);line-height:1.6;max-width:480px}

/* GRADUATION */
.grad-shell{text-align:center;padding:28px 0}
.grad-logo{height:72px;width:auto;margin-bottom:24px;mix-blend-mode:multiply;object-fit:contain}
.grad-headline{font-size:clamp(1.9rem,5vw,2.6rem);font-weight:900;letter-spacing:-1.2px;color:var(--olive);margin-bottom:10px}
.grad-sub{font-size:.95rem;color:var(--sage);margin-bottom:28px;line-height:1.6}
.grad-list{display:inline-flex;flex-direction:column;gap:10px;text-align:left;margin-bottom:28px}
.grad-item{display:flex;align-items:center;gap:10px;font-size:.9rem;color:var(--olive-mid);padding:12px 18px;background:var(--glass);backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:12px}
.gi-check{color:var(--neon);font-weight:700;font-size:.9rem;flex-shrink:0;filter:drop-shadow(0 0 4px var(--neon))}
.btn-map{background:rgba(255,255,255,.5);border:1px solid var(--glass-border);color:var(--olive);font-size:.88rem;font-weight:700;padding:10px 24px;border-radius:100px;cursor:pointer;transition:all .2s;font-family:inherit;backdrop-filter:blur(10px)}
.btn-map:hover{background:rgba(255,255,255,.7)}

/* BIZ NAME FALLBACKS (when no logo uploaded) */
.welcome-biz-name{font-size:clamp(1.4rem,5vw,1.9rem);font-weight:900;letter-spacing:-0.8px;color:var(--olive);margin-bottom:4px;line-height:1.1}
.grad-biz-name{font-size:clamp(1.4rem,5vw,1.9rem);font-weight:900;letter-spacing:-0.8px;color:var(--olive);margin-bottom:20px;line-height:1.1}

/* MOBILE */
@media(max-width:520px){
  .card-wrap{padding:16px 12px 24px}
  .course-nav{padding:10px 16px max(12px,env(safe-area-inset-bottom,12px));gap:8px}
  .btn-arrow{width:42px;height:42px;font-size:1rem}
  .nav-ctr{min-width:48px;font-size:.85rem}
  .screen-title{font-size:1.45rem}
  .welcome-title{font-size:1.8rem}
  .mmap-grid{grid-template-columns:1fr}
  .wmap-grid{grid-template-columns:1fr;gap:10px}
  .prompt-box{font-size:.8rem;padding:14px}
  .copy-btn{width:100%;text-align:center}
  .rules-list{padding:16px 18px}
  .check-item{padding:12px 14px}
  .hook-card{padding:18px 16px;font-size:.9rem}
  .lesson-list{gap:8px}
  .module-intro-shell{padding:20px 0}
  .top-biz-pill{max-width:130px;font-size:.78rem}
  .btn-map-top{padding:5px 10px;font-size:.68rem}
  .grad-list{width:100%}
  .grad-item{padding:10px 14px;font-size:.85rem}
  .concept-note{font-size:.78rem;padding:10px 12px}
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
  <div class="bg-mesh"></div>
  <div class="app-shell">
  <div class="course-top">
    ${course.logo ? `<img class="top-logo" src="${course.logo}" alt="${esc(course.business_name)}" onerror="this.style.display='none'"/>` : `<div class="top-biz-pill">${esc(course.business_name)}</div>`}
    <div class="top-right">
      <button class="btn-map-top" onclick="goTo(2)">Dashboard</button>
    </div>
    <div class="progress-rail"><div class="progress-fill" id="pf"></div></div>
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

  <div class="course-main">
    <div class="card-wrap" id="learn-panel">
      ${screensHtml}
    </div>
    <div id="flash-panel" class="imode-panel" style="display:none"></div>
    <div id="quiz-panel" class="imode-panel" style="display:none"></div>
    <div id="match-panel" class="imode-panel" style="display:none"></div>
  </div>

  <div class="course-nav">
    <button class="nav-tab-btn active" id="tab-dashboard" onclick="goTo(2)" title="Dashboard">
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      <span>Dashboard</span>
    </button>
    <span id="learn-nav" style="display:flex;align-items:center;gap:12px">
      <button class="btn-arrow" id="btn-back" onclick="back()" aria-label="Previous">&#8592;</button>
      <span class="nav-ctr" id="nav-ctr"></span>
      <button class="btn-arrow" id="btn-next" onclick="next()" aria-label="Next">&#8594;</button>
    </span>
    <button class="btn-mode-back" id="btn-mode-back" onclick="setMode('learn')" style="display:none">← Lesson</button>
    <button class="nav-tab-btn" id="tab-profile" onclick="goTo(${total-1})" title="Completion">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
      <span>Profile</span>
    </button>
  </div>
  </div>

  <script>
    // ── DATA ──────────────────────────────────────────────
    const TOTAL = ${total};
    const SLUG = ${JSON.stringify(slug)};
    const MS = ${JSON.stringify(moduleStarts)};
    const CL = ${checklistLen};
    const STUDY = ${JSON.stringify(course.study || {flashcards:[],quiz:[],match:[]})};
    const SMODS = ${JSON.stringify(screens.map(s => s.module))};
    const KEY = 'course_' + SLUG + '_screen';
    let cur = Math.min(parseInt(localStorage.getItem(KEY) || '0'), TOTAL - 1);
    let dir = 1;

    function goTo(n) {
      if (n < 0 || n >= TOTAL) return;
      dir = n > cur ? 1 : -1;
      const prev = document.getElementById('s' + cur);
      prev.classList.remove('active', 'anim-right', 'anim-left');
      cur = n;
      const next = document.getElementById('s' + cur);
      next.classList.add('active', dir > 0 ? 'anim-right' : 'anim-left');
      next.addEventListener('animationend', () => next.classList.remove('anim-right', 'anim-left'), { once: true });
      localStorage.setItem(KEY, cur);
      render();
      document.querySelector('.course-main').scrollTo({ top: 0, behavior: 'instant' });
    }
    function next() { goTo(cur + 1); }
    function back() { goTo(cur - 1); }

    function jumpToModule(m) { if (MS[m] !== undefined) goTo(MS[m]); }

    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
    });

    function render() {
      const inMod = SMODS[cur] > 0;
      document.getElementById('mode-bar').style.display = inMod ? 'flex' : 'none';
      if (!inMod && curMode !== 'learn') setMode('learn');
      document.getElementById('pf').style.width = (cur / (TOTAL - 1) * 100) + '%';
      const ctr = document.getElementById('nav-ctr');
      ctr.innerHTML = (cur + 1) + '<span class="nav-total"> / ' + TOTAL + '</span>';
      document.getElementById('btn-back').disabled = cur === 0;
      document.getElementById('btn-next').disabled = cur === TOTAL - 1;
      // tab active state
      document.getElementById('tab-dashboard')?.classList.toggle('active', cur === 2);
      document.getElementById('tab-profile')?.classList.toggle('active', cur === TOTAL - 1);
      // mark completed modules on map + update progress bars
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
          if (pct > 0 && pct < 100) { bar.style.background = '#00F057'; bar.style.boxShadow = '0 0 8px #00F057'; }
          else if (pct === 100) { bar.style.background = '#00F057'; }
        }
      });
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

    render();
    restoreChecks();

    // ── HELPERS ────────────────────────────────────────────
    function eh(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    // ── MODE SWITCHING ─────────────────────────────────────
    function setMode(m) {
      curMode = m;
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
      document.getElementById('learn-panel').style.display = m === 'learn' ? '' : 'none';
      ['flash','quiz','match'].forEach(p => document.getElementById(p+'-panel').style.display = m === p ? '' : 'none');
      document.getElementById('learn-nav').style.display = m === 'learn' ? 'flex' : 'none';
      document.getElementById('btn-mode-back').style.display = m !== 'learn' ? 'block' : 'none';
      document.querySelector('.course-main').scrollTo({top:0,behavior:'instant'});
      if (m === 'flash') initFlash();
      if (m === 'quiz')  initQuiz();
      if (m === 'match') initMatch();
    }

    // ── FLASHCARDS ─────────────────────────────────────────
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
          + '<div class="flash-done-icon">'+(k===t?'🎉':'💪')+'</div>'
          + '<div class="flash-done-title">'+(k===t?'All '+t+' cards known!':k+' of '+t+' known')+'</div>'
          + '<div class="flash-done-sub">'+(k<t?'A few more to go. Shuffle and keep going.':'Ready to quiz yourself?')+'</div>'
          + '<button class="btn-restart" onclick="initFlash()">Shuffle &amp; restart</button>'
          + (k===t?'<br/><br/><button class="mode-btn active" style="margin:0 auto" onclick="setMode(\'quiz\')">Try the quiz →</button>':'')
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
        + '<div class="flash-tap-cue">'+(fFlipped?'↩ Tap to flip back':'👆 Tap card to reveal definition')+'</div>'
        + '<div class="flash-btns'+(fFlipped?'':' hidden')+'" id="fbtns">'
        + '<button class="btn-still" onclick="markFlash(false)">Still learning</button>'
        + '<button class="btn-know" onclick="markFlash(true)">Got it ✓</button>'
        + '</div></div>';
    }
    function flipFlash() {
      fFlipped = !fFlipped;
      const c = document.getElementById('fc3d');
      if (c) c.style.transform = fFlipped ? 'rotateY(180deg)' : '';
      const h = document.querySelector('.flash-tap-cue'); if (h) h.textContent = fFlipped ? '↩ Tap to flip back' : '👆 Tap card to reveal definition';
      const b = document.getElementById('fbtns'); if (b) b.classList.toggle('hidden', !fFlipped);
    }
    function markFlash(known) { if(known) fKnown.add(fQueue[fIdx]); fIdx++; fFlipped=false; renderFlash(); }

    // ── QUIZ ───────────────────────────────────────────────
    let qIdx=0, qAnswered=false, qScore=0, qOrd=[];
    function initQuiz() {
      qOrd = STUDY.quiz.map((_,i)=>i).sort(()=>Math.random()-.5);
      qIdx=0; qAnswered=false; qScore=0;
      renderQuiz();
    }
    function renderQuiz() {
      const p = document.getElementById('quiz-panel');
      const qs = STUDY.quiz;
      if (!qs.length) { p.innerHTML='<div class="imode-inner"><p class="no-study">No quiz questions yet — generate a new course to get them.</p></div>'; return; }
      if (qIdx >= qOrd.length) {
        const pct = Math.round(qScore/qOrd.length*100);
        const msg = pct>=80?'🎉 You nailed it!':pct>=60?'👍 Solid progress — keep reviewing.':'📖 Review the flashcards and try again.';
        p.innerHTML = '<div class="imode-inner"><div class="quiz-score">'
          + '<div class="quiz-score-num">'+qScore+'/'+qOrd.length+'</div>'
          + '<div class="quiz-score-pct">'+pct+'% correct</div>'
          + '<div class="quiz-score-msg">'+msg+'</div>'
          + '<button class="btn-restart" onclick="initQuiz()">Retake quiz</button>'
          + (pct>=80?'<br/><br/><button class="mode-btn active" style="margin:0 auto" onclick="setMode(\'match\')">Try matching →</button>':'')
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

    // ── MATCH ──────────────────────────────────────────────
    let mSel=null, mDone=new Set(), mTerms=[], mDefs=[];
    function initMatch() {
      const pairs=STUDY.match;
      if(!pairs||!pairs.length){document.getElementById('match-panel').innerHTML='<div class="imode-inner"><p class="no-study">No matching pairs yet — generate a new course to get them.</p></div>';return;}
      mSel=null; mDone.clear();
      mTerms=pairs.map((p,i)=>({txt:p.term,idx:i})).sort(()=>Math.random()-.5);
      mDefs=pairs.map((p,i)=>({txt:p.def,idx:i})).sort(()=>Math.random()-.5);
      renderMatch();
    }
    function renderMatch() {
      const p=document.getElementById('match-panel');
      if(mDone.size===STUDY.match.length){
        p.innerHTML='<div class="imode-inner"><div class="match-done"><div class="match-done-icon">🎯</div><div class="match-done-title">All matched!</div><div class="match-done-sub">Perfect score on the matching game.</div><button class="btn-restart" onclick="initMatch()">Play again</button></div></div>';
        return;
      }
      const tCols = mTerms.map((t,i)=>'<div class="match-card'+(mDone.has(t.idx)?' matched':(mSel&&mSel.side==='t'&&mSel.i===i?' selected':''))+'" onclick="selM(\'t\','+i+')" id="mt'+i+'">'+eh(t.txt)+'</div>').join('');
      const dCols = mDefs.map((d,i)=>'<div class="match-card'+(mDone.has(d.idx)?' matched':'')+'" onclick="selM(\'d\','+i+')" id="md'+i+'">'+eh(d.txt)+'</div>').join('');
      p.innerHTML='<div class="imode-inner">'
        +'<div class="match-intro"><p>Tap a term on the left, then its matching definition on the right.</p><p>'+(mDone.size)+' / '+STUDY.match.length+' matched</p></div>'
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
