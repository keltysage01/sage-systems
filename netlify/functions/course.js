import { getStore } from "@netlify/blobs";

export const config = { path: "/course" };

function esc(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

export default async function handler(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) return new Response("Course not found", { status: 404, headers: { "Content-Type": "text/html" } });

  let course;
  try {
    const store = getStore("courses");
    course = await store.get(id, { type: "json" });
  } catch (err) {
    return new Response(`<h1>Error loading course: ${err.message}</h1>`, { status: 500, headers: { "Content-Type": "text/html" } });
  }

  if (!course) return new Response("Course not found — this link may be invalid.", { status: 404, headers: { "Content-Type": "text/html" } });

  const modules = [
    {
      id: "m1", label: "Module 1", title: "Your Business Brain",
      desc: "Copy this and paste it at the start of every Claude or ChatGPT conversation. It gives AI everything it needs to work for your specific business.",
      content: `<div class="mono-box" id="brain">${esc(course.brain)}</div><button class="copy-btn" onclick="copyEl('brain',this)">Copy to clipboard</button>`,
    },
    {
      id: "m2", label: "Module 2", title: "Your Prompt Library",
      desc: "Five ready-to-use prompts built for your workflows. Fill in the [bracket fields] and paste into Claude or ChatGPT.",
      content: (course.prompts || []).map((p, i) => `
        <div class="prompt-card">
          <div class="prompt-label">${esc(p.title)}</div>
          <div class="mono-box" id="p${i}">${esc(p.prompt)}</div>
          <button class="copy-btn" onclick="copyEl('p${i}',this)">Copy prompt</button>
        </div>`).join(""),
    },
    {
      id: "m3", label: "Module 3", title: "Your Workflow Map",
      desc: "What AI handles in your business, what stays human, and where to start improving.",
      content: `<div class="map-grid">
        <div class="map-col"><div class="map-col-title">AI handles this</div><ul>${(course.map?.ai||[]).map(i=>`<li>${esc(i)}</li>`).join("")}</ul></div>
        <div class="map-col"><div class="map-col-title">You handle this</div><ul>${(course.map?.human||[]).map(i=>`<li>${esc(i)}</li>`).join("")}</ul></div>
        <div class="map-col improve"><div class="map-col-title">Improve first</div><ul>${(course.map?.improve||[]).map(i=>`<li>${esc(i)}</li>`).join("")}</ul></div>
      </div>`,
    },
    {
      id: "m4", label: "Module 4", title: "Your Privacy Rules",
      desc: "What should never go into any AI tool in your business — specific to your clients and your work.",
      content: `<ul class="rules-list">${(course.rules||[]).map(r=>`<li>${esc(r)}</li>`).join("")}</ul>`,
    },
    {
      id: "m5", label: "Module 5", title: "Your First-Steps Checklist",
      desc: "Eight concrete actions to take this week to start using AI in your business.",
      content: `<ul class="check-list">${(course.checklist||[]).map((s,i)=>`<li><span class="step-num">${i+1}</span>${esc(s.replace(/^step\s*\d+[:.]\s*/i,""))}</li>`).join("")}</ul>`,
    },
  ];

  const modulesHtml = modules.map((m, i) => `
    <div class="module ${i===0?"open":""}" id="${m.id}">
      <div class="mod-header" onclick="toggle('${m.id}')">
        <div><div class="mod-label">${m.label}</div><div class="mod-title">${m.title}</div></div>
        <div class="mod-chevron">›</div>
      </div>
      <div class="mod-body">
        <p class="mod-desc">${m.desc}</p>
        ${m.content}
      </div>
    </div>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>AI Course — ${esc(course.business_name)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0c1510;color:#eef4f0;line-height:1.6;overflow-x:hidden}
    .bg-mesh{position:fixed;inset:0;z-index:0;background:
      radial-gradient(ellipse 80% 60% at 15% 10%,rgba(60,120,80,.45) 0%,transparent 60%),
      radial-gradient(ellipse 60% 50% at 85% 25%,rgba(80,190,140,.2) 0%,transparent 55%),
      radial-gradient(ellipse 70% 55% at 50% 90%,rgba(120,180,100,.18) 0%,transparent 60%),
      #0c1510;
      animation:mesh 14s ease-in-out infinite alternate}
    @keyframes mesh{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(12deg) brightness(1.08)}}
    nav{position:sticky;top:0;z-index:10;background:rgba(12,21,16,.9);backdrop-filter:blur(20px);border-bottom:1px solid rgba(180,220,190,.08);padding:16px 28px;display:flex;justify-content:space-between;align-items:center}
    .logo{font-weight:800;font-size:1rem;color:#fff}
    .logo span{background:linear-gradient(135deg,#7ec89a,#b8e0a0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .nav-biz{font-size:.75rem;font-weight:600;color:rgba(238,244,240,.4);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .page{position:relative;z-index:2;max-width:800px;margin:0 auto;padding:52px 24px 100px}
    .course-tag{font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7ec89a;margin-bottom:12px}
    .course-title{font-size:clamp(2rem,5vw,2.8rem);font-weight:900;letter-spacing:-1.5px;color:#fff;margin-bottom:20px;line-height:1.1}
    .welcome{font-size:.97rem;color:rgba(238,244,240,.6);line-height:1.75;max-width:640px;margin-bottom:52px;white-space:pre-line}

    .module{margin-bottom:14px;background:rgba(255,255,255,.04);backdrop-filter:blur(20px);border:1px solid rgba(180,220,190,.1);border-radius:20px;overflow:hidden;transition:border-color .2s}
    .module.open{border-color:rgba(126,200,154,.2)}
    .mod-header{padding:22px 28px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;transition:background .18s}
    .mod-header:hover{background:rgba(255,255,255,.03)}
    .mod-label{font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#7ec89a;margin-bottom:4px}
    .mod-title{font-size:1rem;font-weight:700;color:#fff}
    .mod-chevron{color:rgba(238,244,240,.3);font-size:1.3rem;transition:transform .25s cubic-bezier(.22,1,.36,1)}
    .module.open .mod-chevron{transform:rotate(90deg)}
    .mod-body{display:none;padding:0 28px 28px;animation:fadeUp .3s cubic-bezier(.22,1,.36,1)}
    .module.open .mod-body{display:block}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    .mod-desc{font-size:.85rem;color:rgba(238,244,240,.45);margin-bottom:18px;line-height:1.6}

    .mono-box{background:rgba(255,255,255,.03);border:1px solid rgba(180,220,190,.1);border-radius:14px;padding:20px;font-family:"SF Mono","Fira Code",monospace;font-size:.8rem;color:rgba(238,244,240,.75);white-space:pre-wrap;line-height:1.65}
    .copy-btn{display:inline-flex;align-items:center;gap:6px;background:rgba(45,122,94,.18);border:1px solid rgba(126,200,154,.28);color:#a3d4b0;font-size:.78rem;font-weight:600;padding:8px 18px;border-radius:100px;cursor:pointer;transition:all .18s;margin-top:12px;font-family:inherit}
    .copy-btn:hover{background:rgba(45,122,94,.32)}
    .copy-btn.copied{background:rgba(45,122,94,.4);color:#7ec89a}

    .prompt-card{background:rgba(255,255,255,.03);border:1px solid rgba(180,220,190,.08);border-radius:14px;padding:20px;margin-bottom:12px}
    .prompt-label{font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7ec89a;margin-bottom:12px}

    .map-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
    @media(max-width:600px){.map-grid{grid-template-columns:1fr}}
    .map-col{background:rgba(255,255,255,.03);border:1px solid rgba(180,220,190,.08);border-radius:14px;padding:18px}
    .map-col.improve{border-color:rgba(126,200,154,.18)}
    .map-col-title{font-size:.65rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7ec89a;margin-bottom:12px}
    .map-col ul{list-style:none}
    .map-col ul li{font-size:.83rem;color:rgba(238,244,240,.6);padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);line-height:1.4}
    .map-col ul li:last-child{border-bottom:none}
    .map-col ul li::before{content:"—";margin-right:8px;color:rgba(126,200,154,.35)}

    .rules-list{list-style:none}
    .rules-list li{padding:13px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:.9rem;color:rgba(238,244,240,.65);display:flex;gap:12px;align-items:flex-start;line-height:1.5}
    .rules-list li:last-child{border-bottom:none}
    .rules-list li::before{content:"×";color:#ef4444;font-weight:700;flex-shrink:0;margin-top:1px}

    .check-list{list-style:none}
    .check-list li{padding:13px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:.9rem;color:rgba(238,244,240,.65);display:flex;gap:12px;align-items:flex-start;line-height:1.5}
    .check-list li:last-child{border-bottom:none}
    .step-num{background:rgba(45,122,94,.2);border:1px solid rgba(126,200,154,.25);color:#7ec89a;font-size:.65rem;font-weight:800;padding:2px 8px;border-radius:100px;flex-shrink:0;margin-top:2px;min-width:22px;text-align:center}
  </style>
</head>
<body>
  <div class="bg-mesh"></div>
  <nav>
    <div class="logo">Sage <span>Systems</span></div>
    <div class="nav-biz">${esc(course.business_name)}</div>
  </nav>
  <div class="page">
    <div class="course-tag">Custom AI Course</div>
    <h1 class="course-title">Your AI Starter Plan</h1>
    <p class="welcome">${esc(course.welcome)}</p>
    ${modulesHtml}
  </div>
  <script>
    function toggle(id) {
      document.getElementById(id).classList.toggle('open');
    }
    function copyEl(id, btn) {
      navigator.clipboard.writeText(document.getElementById(id).innerText).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);
      });
    }
  </script>
</body>
</html>`;

  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
