import { getStore } from "@netlify/blobs";

export const config = { path: "/course" };

function esc(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function buildScreens(course) {
  const { name, business_name, welcome, brain, prompts = [], map = {}, rules = [], checklist = [] } = course;
  const biz = esc(business_name);
  const owner = esc(name);
  const slug = (business_name || "course").toLowerCase().replace(/[^a-z0-9]+/g, "_");

  const screens = [];
  const moduleStarts = {};

  const lessonItem = (t) => `<div class="lesson-item"><span class="li-dot"></span>${t}</div>`;

  const winScreen = (module, capability, next) => `
    <div class="win-screen">
      <div class="win-icon"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 15l6 6L23 8" stroke="#2d7a5e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
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
      <img class="welcome-logo" src="/assets/logo.png" alt="Sage Systems" onerror="this.style.display='none'"/>
      <div class="welcome-tag">Custom AI Course</div>
      <h1 class="welcome-title">AI for ${biz}</h1>
      <p class="welcome-for">Built for <strong>${owner}</strong> — specific to the real workflows of <strong>${biz}</strong>.</p>
      <p class="welcome-body">${esc(welcome).replace(/\n\n/g,"</p><p class=\"welcome-body\">").replace(/\n/g,"<br/>")}</p>
      <div class="welcome-pills">
        <span class="w-pill">5 modules</span>
        <span class="w-pill">Copy-paste prompts</span>
        <span class="w-pill">Progress saved</span>
        <span class="w-pill">Self-paced</span>
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
  screens.push({ id: "module-map", module: 0, html: `
    <div class="screen-tag">Your course</div>
    <h2 class="screen-title">What you will build</h2>
    <p class="screen-desc">Five modules. Work through them in order, or jump to any module you want to revisit.</p>
    <div class="mmap-grid">
      ${modulesMeta.map(m=>`
        <div class="mmap-card" onclick="jumpToModule(${m.n})" id="mcard-${m.n}">
          <div class="mmap-num">Module ${m.n}</div>
          <div class="mmap-title">${m.title}</div>
          <div class="mmap-desc">${m.desc}</div>
          <div class="mmap-arrow">→</div>
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
    <div class="tool-pills"><span class="tool-pill">Claude</span><span class="tool-pill">ChatGPT</span><span class="tool-pill">Any AI chat</span></div>` });

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
    <div class="tool-pills"><span class="tool-pill">Claude</span><span class="tool-pill">ChatGPT</span></div>` });

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
    <div class="hook-card">Not everything in your business should be automated. Some things AI does well — drafting, summarizing, generating options. Some things need your judgment, your relationships, your expertise.<br/><br/>This map shows you what's what for ${biz}.</div>` });

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
    <div class="hook-card">AI is powerful, but it's a third-party system. Anything you paste into a public AI tool could be used to improve that tool's models.<br/><br/>Before you automate anything, know what information should never leave your hands.</div>` });

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
      <img src="/assets/logo.png" alt="Sage Systems" class="grad-logo" onerror="this.style.display='none'"/>
      <div class="grad-headline">Course complete.</div>
      <p class="grad-sub">You now have a complete AI starter system for ${biz}.</p>
      <div class="grad-list">
        <div class="grad-item"><span class="gi-check">✓</span>Business Brain ready to use</div>
        <div class="grad-item"><span class="gi-check">✓</span>${prompts.length} custom prompts in your library</div>
        <div class="grad-item"><span class="gi-check">✓</span>Workflow map showing what AI handles</div>
        <div class="grad-item"><span class="gi-check">✓</span>Privacy rules for ${biz}</div>
        <div class="grad-item"><span class="gi-check">✓</span>First-steps checklist to start this week</div>
      </div>
      <button class="btn-map" onclick="goTo(2)">Back to course map</button>
    </div>` });

  return { screens, moduleStarts, slug, checklistLen: checklist.length };
}

// ── CSS ──────────────────────────────────────────────────────────────
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--sage:#2d7a5e;--sage-mid:#4aab7e;--sage-light:#7ec89a;--sage-pale:#f0faf4;--bg:#f5f7f5;--white:#fff;--text:#1a1a1a;--muted:#6b7280;--border:#e5ebe7;--r:14px;--sh:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04)}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--bg);color:var(--text);min-height:100vh;line-height:1.6;overflow-x:hidden}

/* SHELL */
.course-top{position:sticky;top:0;z-index:100;background:var(--white);border-bottom:1px solid var(--border);height:56px;padding:0 20px;display:flex;align-items:center;justify-content:space-between}
.top-logo{height:32px;width:auto}
.top-right{display:flex;align-items:center;gap:12px}
.top-biz{font-size:.72rem;font-weight:700;color:var(--muted);letter-spacing:.02em;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.btn-map-top{font-size:.75rem;font-weight:600;color:var(--sage);background:none;border:1px solid rgba(45,122,94,.25);border-radius:100px;padding:5px 12px;cursor:pointer;transition:all .18s}
.btn-map-top:hover{background:var(--sage-pale)}
.progress-rail{position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--border)}
.progress-fill{height:2px;background:linear-gradient(90deg,var(--sage),var(--sage-light));transition:width .4s ease}

.course-main{max-width:680px;margin:0 auto;padding:40px 20px 120px}

/* SCREENS */
.screen{display:none}
.screen.active{display:block;animation:sIn .35s cubic-bezier(.22,1,.36,1)}
@keyframes sIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}

/* BOTTOM NAV */
.course-nav{position:fixed;bottom:0;left:0;right:0;z-index:100;background:var(--white);border-top:1px solid var(--border);padding:12px 20px;display:flex;justify-content:space-between;align-items:center}
.btn-back{background:none;border:none;color:var(--muted);font-size:.88rem;font-weight:600;cursor:pointer;padding:10px 4px;font-family:inherit}
.btn-back:hover{color:var(--text)}
.nav-ctr{font-size:.72rem;color:#bbb;font-weight:500}
.btn-next{background:var(--sage);color:var(--white);font-size:.92rem;font-weight:700;padding:11px 28px;border:none;border-radius:100px;cursor:pointer;transition:all .18s;font-family:inherit}
.btn-next:hover{background:var(--sage-mid);transform:translateY(-1px)}

/* TYPOGRAPHY */
.screen-tag{font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--sage);margin-bottom:10px}
.screen-title{font-size:clamp(1.6rem,4vw,2.1rem);font-weight:800;letter-spacing:-.8px;line-height:1.15;margin-bottom:14px;color:#111}
.screen-desc{font-size:.93rem;color:var(--muted);line-height:1.7;margin-bottom:24px}

/* WELCOME */
.welcome-shell{text-align:center;padding:32px 0 20px}
.welcome-logo{height:60px;width:auto;margin-bottom:28px}
.welcome-tag{font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--sage);margin-bottom:12px}
.welcome-title{font-size:clamp(2rem,5vw,2.8rem);font-weight:900;letter-spacing:-1.5px;margin-bottom:8px;color:#111}
.welcome-for{font-size:.95rem;color:var(--muted);margin-bottom:20px}
.welcome-body{font-size:.93rem;color:#555;line-height:1.75;max-width:560px;margin:0 auto 24px;text-align:left}
.welcome-pills{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:8px}
.w-pill{font-size:.75rem;font-weight:600;color:var(--sage);background:var(--sage-pale);border:1px solid rgba(45,122,94,.2);padding:5px 14px;border-radius:100px}

/* SETUP */
.setup-list{margin-top:20px;display:flex;flex-direction:column;gap:10px}
.setup-row{display:flex;align-items:flex-start;gap:10px;font-size:.88rem;color:#555;line-height:1.5;padding:12px 16px;background:var(--white);border:1px solid var(--border);border-radius:10px}
.setup-dot{width:7px;height:7px;border-radius:50%;background:var(--sage-light);flex-shrink:0;margin-top:5px}

/* MODULE INTRO */
.module-intro-shell{padding-bottom:8px}
.mod-badge{width:52px;height:52px;background:var(--sage);color:var(--white);font-size:1.2rem;font-weight:900;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;letter-spacing:-.5px}
.lesson-list{margin-top:20px;display:flex;flex-direction:column;gap:10px}
.lesson-item{display:flex;align-items:center;gap:10px;font-size:.9rem;color:#555;padding:12px 16px;background:var(--white);border:1px solid var(--border);border-radius:10px}
.li-dot{width:6px;height:6px;border-radius:50%;background:var(--sage);flex-shrink:0}

/* MODULE MAP */
.mmap-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:4px}
@media(max-width:500px){.mmap-grid{grid-template-columns:1fr}}
.mmap-card{background:var(--white);border:1.5px solid var(--border);border-radius:var(--r);padding:18px 20px;cursor:pointer;transition:all .18s;position:relative}
.mmap-card:hover{border-color:var(--sage-light);transform:translateY(-2px);box-shadow:var(--sh)}
.mmap-card.done{border-color:var(--sage);background:var(--sage-pale)}
.mmap-num{font-size:.63rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--sage);margin-bottom:6px}
.mmap-title{font-size:.92rem;font-weight:700;color:#111;margin-bottom:4px}
.mmap-desc{font-size:.78rem;color:var(--muted);line-height:1.4}
.mmap-arrow{position:absolute;top:18px;right:16px;color:rgba(45,122,94,.35);font-size:.9rem}

/* HOOK */
.hook-card{background:var(--white);border-left:3px solid var(--sage-light);border-radius:0 var(--r) var(--r) 0;padding:24px 24px;font-size:1rem;color:#333;line-height:1.75;margin-bottom:20px;box-shadow:var(--sh)}
.tool-pills{display:flex;gap:8px;flex-wrap:wrap}
.tool-pill{font-size:.73rem;font-weight:600;color:var(--sage);background:var(--sage-pale);border:1px solid rgba(45,122,94,.2);padding:5px 12px;border-radius:100px}

/* PROMPT CARD */
.prompt-card{background:var(--white);border:1.5px solid var(--border);border-radius:var(--r);padding:22px;box-shadow:var(--sh)}
.prompt-dest{font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:12px}
.prompt-dest strong{color:var(--sage)}
.prompt-box{background:#f8faf8;border:1.5px solid var(--border);border-radius:10px;padding:18px;font-family:"SF Mono","Fira Code",monospace;font-size:.8rem;color:#333;white-space:pre-wrap;line-height:1.65;max-height:260px;overflow-y:auto;margin-bottom:12px}
.copy-btn{display:inline-flex;align-items:center;gap:6px;background:var(--sage);color:var(--white);font-size:.8rem;font-weight:700;padding:9px 20px;border-radius:100px;border:none;cursor:pointer;transition:all .18s;font-family:inherit}
.copy-btn:hover{background:var(--sage-mid)}
.copy-btn.copied{background:#059669}
.star-reminder{margin-top:14px;padding:11px 14px;background:#fffbf0;border:1px solid #fde68a;border-radius:9px;font-size:.78rem;color:#92400e;line-height:1.5}

/* WORKFLOW MAP */
.wmap-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
@media(max-width:560px){.wmap-grid{grid-template-columns:1fr}}
.wmap-col{background:var(--white);border:1.5px solid var(--border);border-radius:var(--r);padding:18px;box-shadow:var(--sh)}
.wmap-improve{border-color:rgba(45,122,94,.25);background:var(--sage-pale)}
.wmap-col-title{font-size:.63rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--sage);margin-bottom:12px}
.wmap-col ul{list-style:none}
.wmap-col ul li{font-size:.83rem;color:#555;padding:7px 0;border-bottom:1px solid var(--border);line-height:1.4}
.wmap-col ul li:last-child{border-bottom:none}
.wmap-col ul li::before{content:"–";margin-right:7px;color:var(--sage-light)}

/* PRIVACY RULES */
.rules-card{background:var(--white);border:1.5px solid var(--border);border-radius:var(--r);padding:4px 22px;box-shadow:var(--sh)}
.rules-list{list-style:none}
.rules-list li{display:flex;gap:12px;align-items:flex-start;padding:13px 0;border-bottom:1px solid var(--border);font-size:.9rem;color:#555;line-height:1.5}
.rules-list li:last-child{border-bottom:none}
.rule-x{color:#ef4444;font-weight:800;flex-shrink:0;font-size:.9rem;margin-top:1px}

/* CHECKLIST */
.check-list{list-style:none}
.check-item{display:flex;align-items:flex-start;gap:12px;padding:13px 16px;background:var(--white);border:1.5px solid var(--border);border-radius:10px;margin-bottom:8px;cursor:pointer;transition:all .18s;font-size:.9rem;color:#555;line-height:1.5;user-select:none}
.check-item:hover{border-color:var(--sage-light)}
.check-item.checked-item{background:var(--sage-pale);border-color:rgba(45,122,94,.3);color:#2d5a43}
.check-box{width:20px;height:20px;border:2px solid var(--border);border-radius:6px;flex-shrink:0;transition:all .18s;margin-top:1px;display:flex;align-items:center;justify-content:center}
.check-box.checked{background:var(--sage);border-color:var(--sage)}
.check-box.checked::after{content:"✓";color:#fff;font-size:.65rem;font-weight:800}

/* WIN */
.win-screen{padding:28px 0}
.win-icon{width:64px;height:64px;background:var(--sage-pale);border:2px solid rgba(45,122,94,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:20px}
.win-eyebrow{font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--sage);margin-bottom:8px}
.win-text{font-size:1.4rem;font-weight:800;letter-spacing:-.5px;color:#111;margin-bottom:16px;line-height:1.2}
.win-next{font-size:.9rem;color:var(--muted);line-height:1.6;max-width:480px}

/* GRADUATION */
.grad-shell{text-align:center;padding:32px 0}
.grad-logo{height:56px;width:auto;margin-bottom:28px}
.grad-headline{font-size:clamp(2rem,5vw,2.8rem);font-weight:900;letter-spacing:-1.5px;color:#111;margin-bottom:12px}
.grad-sub{font-size:1rem;color:var(--muted);margin-bottom:32px;line-height:1.6}
.grad-list{display:inline-flex;flex-direction:column;gap:10px;text-align:left;margin-bottom:32px}
.grad-item{display:flex;align-items:center;gap:10px;font-size:.92rem;color:#444;padding:12px 18px;background:var(--white);border:1px solid var(--border);border-radius:10px}
.gi-check{color:var(--sage);font-weight:700;font-size:.9rem;flex-shrink:0}
.btn-map{background:none;border:1.5px solid var(--sage);color:var(--sage);font-size:.88rem;font-weight:700;padding:10px 24px;border-radius:100px;cursor:pointer;transition:all .18s;font-family:inherit}
.btn-map:hover{background:var(--sage-pale)}
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
  <div class="course-top">
    <img class="top-logo" src="/assets/logo.png" alt="Sage Systems" onerror="this.style.display='none'"/>
    <div class="top-right">
      <span class="top-biz">${esc(course.business_name)}</span>
      <button class="btn-map-top" onclick="goTo(2)">Course map</button>
    </div>
    <div class="progress-rail"><div class="progress-fill" id="pf"></div></div>
  </div>

  <div class="course-main">
    ${screensHtml}
  </div>

  <div class="course-nav">
    <button class="btn-back" id="btn-back" onclick="back()">← Back</button>
    <span class="nav-ctr" id="nav-ctr"></span>
    <button class="btn-next" id="btn-next" onclick="next()">Begin Course</button>
  </div>

  <script>
    const TOTAL = ${total};
    const SLUG = ${JSON.stringify(slug)};
    const MS = ${JSON.stringify(moduleStarts)};
    const CL = ${checklistLen};
    const KEY = 'course_' + SLUG + '_screen';
    let cur = Math.min(parseInt(localStorage.getItem(KEY) || '0'), TOTAL - 1);

    function goTo(n) {
      if (n < 0 || n >= TOTAL) return;
      document.getElementById('s' + cur).classList.remove('active');
      cur = n;
      document.getElementById('s' + cur).classList.add('active');
      localStorage.setItem(KEY, cur);
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function next() { goTo(cur + 1); }
    function back() { goTo(cur - 1); }

    function jumpToModule(m) { if (MS[m] !== undefined) goTo(MS[m]); }

    function render() {
      document.getElementById('pf').style.width = (cur / (TOTAL - 1) * 100) + '%';
      document.getElementById('nav-ctr').textContent = (cur + 1) + ' / ' + TOTAL;
      document.getElementById('btn-back').style.visibility = cur > 0 ? 'visible' : 'hidden';
      const nb = document.getElementById('btn-next');
      if (cur === TOTAL - 1) { nb.style.display = 'none'; }
      else { nb.style.display = ''; nb.textContent = cur === 0 ? 'Begin Course' : 'Next →'; }
      // mark completed modules on map
      Object.entries(MS).forEach(([m, start]) => {
        const card = document.getElementById('mcard-' + m);
        if (!card) return;
        const next = Object.values(MS).find(s => s > start) || TOTAL;
        card.classList.toggle('done', cur >= next);
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

    render();
    restoreChecks();
  </script>
</body>
</html>`;

  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
