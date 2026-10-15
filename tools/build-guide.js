#!/usr/bin/env node
// tools/build-guide.js — builds guide.html from docs/, src/ stubs and tests/.
// Run by tools/build.js. The page's own script is in tools/guide-runtime.js.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const chapterText = require("./chapter-text");

const root = path.join(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");

const ctx = vm.createContext({});
vm.runInContext(read("lib/course.js"), ctx);
const COURSE = ctx.MS.COURSE;
const C = COURSE;
const ready = COURSE.layers.filter(l => l.ready);

// ---------- a small Markdown converter for the subset the chapters use ----------
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function inline(s) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(`<code>${esc(c)}</code>`); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => {
    const ext = /^https?:/.test(u);
    if (!ext && /\.md$/.test(u)) u = "#layer-" + u.slice(0, 2);         // chapter links jump within the guide
    else if (!ext) u = C.repo + "/blob/main/docs/" + u;
    return `<a href="${u}"${ext ? ' target="_blank" rel="noopener"' : ""}>${t}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[\s(])\*([^*\s][^*]*)\*(?=[\s).,:;!?]|$)/g, "$1<em>$2</em>");
  s = s.replace(/(^|[\s(])_([^_]+)_(?=[\s).,:;!?]|$)/g, "$1<em>$2</em>");
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[+i]);
  return s;
}
function tryCell(l, kind, n, codeText) {
  const label = kind === "predict" ? `Predict ${n}` : `Break it ${n}`;
  const rows = Math.min(18, codeText.split("\n").length + 1);
  return `<div class="tryit" data-kind="${kind}" data-layer="${l.id}" data-key="${l.id}-${kind[0]}${n}">
<textarea class="tryit-code" rows="${rows}" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="${label} code">${esc(codeText)}</textarea>
<div class="tryit-actions"><button class="btn" type="button" data-try>Run</button><button class="btn ghost" type="button" data-try-reset>Reset</button></div>
<pre class="tryit-out" hidden></pre>
</div>`;
}
function checkpointCell(l, codeText) {
  const rows = Math.min(20, codeText.split("\n").length + 1);
  return `<div class="cpcell" data-layer="${l.id}">
<textarea class="tryit-code" rows="${rows}" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Checkpoint ${l.id} answers">${esc(codeText)}</textarea>
<div class="tryit-actions"><button class="btn" type="button" data-cp-run>Run checkpoint</button><button class="btn ghost" type="button" data-cp-reset>Reset</button></div>
<div class="cp-result" data-cp-out hidden></div>
</div>`;
}
function markdown(md, l) {
  const lines = md.replace(/\r/g, "").split("\n");
  const out = [];
  const count = { predict: 0, experiment: 0 };
  let i = 0, para = [];
  const flush = () => { if (para.length) { const meta = para.every(x => x.startsWith("**")); out.push(`<p${meta ? ' class="meta"' : ""}>${para.map(inline).join(meta ? "<br>" : " ")}</p>`); para = []; } };
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      flush();
      const lang = line.slice(3).trim();
      const body = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++]);
      i++;
      if (lang === "js checkpoint") {
        out.push(checkpointCell(l, body.join("\n")));
      } else if (lang === "js predict" || lang === "js experiment") {
        const kind = lang === "js predict" ? "predict" : "experiment";
        out.push(tryCell(l, kind === "predict" ? "predict" : "break", ++count[kind], body.join("\n")));
      } else {
        // A diagram knows how many characters wide it is, so narrow screens can shrink it to fit (see pre.diagram).
        const cols = Math.max(1, ...body.map(b => [...b].length));
        out.push(lang === "text" ? `<pre class="diagram" style="--cols:${cols}"><code>${esc(body.join("\n"))}</code></pre>` : `<pre><code>${esc(body.join("\n"))}</code></pre>`);
      }
      continue;
    }
    if (/^#{1,3} /.test(line)) {
      flush();
      const level = line.match(/^#+/)[0].length;
      const text = line.replace(/^#+ /, "");
      if (level === 1) { i++; continue; }                 // the layer title is rendered separately
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      out.push(`<h${level + 1} data-anchor="${id}">${inline(text)}</h${level + 1}>`);
      i++; continue;
    }
    if (/^\s*(<details|<\/details>|<summary)/.test(line)) { flush(); out.push(line.replace(/<summary>([^<]*)<\/summary>/, (_, t) => `<summary>${inline(t)}</summary>`)); i++; continue; }
    if (/^(\d+\.|-) /.test(line)) {
      flush();
      const ordered = /^\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^(\d+\.|-) /.test(lines[i])) {
        let item = lines[i].replace(/^(\d+\.|-) /, "");
        i++;
        while (i < lines.length && /^ {2,}\S/.test(lines[i])) item += " " + lines[i++].trim();
        items.push(`<li>${inline(item)}</li>`);
      }
      out.push(ordered ? `<ol>${items.join("")}</ol>` : `<ul>${items.join("")}</ul>`);
      continue;
    }
    if (/^> /.test(line)) {                               // a study-buddy callout
      flush();
      const body = [];
      while (i < lines.length && /^> ?/.test(lines[i])) body.push(lines[i++].replace(/^> ?/, ""));
      out.push(`<blockquote class="ask">${inline(body.join(" "))}</blockquote>`);
      continue;
    }
    if (line.trim() === "") { flush(); i++; continue; }
    para.push(line.trim());
    i++;
  }
  flush();
  return out.join("\n");
}

// ---------- assemble ----------
const chapters = ready.map(l => {
  const f = COURSE.files(l);
  const md = chapterText(read(f.doc));
  const lede = (md.match(/^_(.+)_\s*$/m) || [, ""])[1];
  const body = md.replace(/^_(.+)_\s*$/m, "");             // lede rendered in the header
  return { l, lede, html: markdown(body, l) };
});

const embed = (id, text) => `<script type="text/plain" id="${id}">${text.replace(/<\/script/gi, "<\\/script")}</script>`;
const sources = [
  embed("lib-course", read("lib/course.js")),
  embed("lib-share", read("lib/share.js")),
  ...[...COURSE.libs, ...COURSE.browserLibs].map(f => embed("lib:" + f, read(f))),
  ...ready.map(l => embed(`mystery-${l.id}`, read(COURSE.files(l).mystery))),
  ...ready.map(l => embed(`stub-${l.id}`, read(COURSE.files(l).src))),
  ...ready.map(l => embed(`test-${l.id}`, read(COURSE.files(l).test))),
].join("\n");

const style = read("lib/style.css");
const soon = COURSE.layers.filter(l => !l.ready);
const tabs = ready.map(l => `<a class="tab" href="#layer-${l.id}" data-layer="${l.id}"><span class="num">${l.id}</span>${l.title}</a>`).join("") +
  (soon.length ? `<span class="tab soon">${soon[0].id}–${soon[soon.length - 1].id} coming soon</span>` : "");
const askTip = "Opens a new chat with tutor rules, your code and your test results. Hints and questions, never answers.";

const sections = chapters.map(({ l, lede, html }) => `
<section class="chapter" id="layer-${l.id}" data-layer="${l.id}">
  <div class="read">
    <header class="ch-head">
      <span class="eyebrow">Layer ${l.id}</span>
      <h2>${l.title}</h2>
      <p class="lede">${inline(lede)}</p>
      <a class="to-bench" href="#bench-${l.id}">Open the workbench ↓</a>
    </header>
    ${html}
  </div>
  <aside class="bench" id="bench-${l.id}" aria-label="Layer ${l.id} workbench">
    <div class="bench-head">
      <span class="num">${l.id}</span><strong>Workbench</strong>
      <span class="score" data-score></span>
    </div>
    <p class="bench-note">Your <code>src/${l.id}-${l.slug}.js</code>. Edits save in this browser.${l.id !== "00" ? " Runs on top of your earlier layers." : ""}</p>
    <textarea class="editor" spellcheck="false" autocapitalize="off" autocomplete="off" id="editor-${l.id}" aria-label="Code for layer ${l.id}"></textarea>
    <div class="bench-actions">
      <button class="btn" type="button" data-run>Run tests <kbd data-kbd>⌘↵</kbd></button>
      <button class="btn ghost" type="button" data-copy>Copy</button>
      <button class="btn ghost" type="button" data-reset>Reset to starter code</button>
    </div>
    <p class="bench-confirm" data-confirm hidden>Replace your code with the starter code? <button class="btn ghost" type="button" data-reset-yes>Yes, reset</button> <button class="btn ghost" type="button" data-reset-no>Keep my code</button></p>
    <p class="help">Stuck? <a class="tip" data-tip="${askTip}" data-ask="claude" href="${C.claudeLink(l)}" target="_blank" rel="noopener">Ask Claude</a> · <a class="tip" data-tip="${askTip}" data-ask="chatgpt" href="${C.chatgptLink(l)}" target="_blank" rel="noopener">Ask ChatGPT</a>
      <span class="level"><span class="tip" tabindex="0" data-tip="How much help a tutor may give you. 1 is questions only; 5 points at the line to look at. The Ask links and Claude in Chrome both follow it.">Hint level</span><span class="dots" role="radiogroup" aria-label="Hint level">${C.hintLevels.map((h, i) => `<button type="button" role="radio" aria-checked="false" data-level="${i + 1}" title="${i + 1}: ${h}" aria-label="Level ${i + 1}: ${h}"></button>`).join("")}</span><span class="level-now" data-hint-level></span></span></p>
    <div class="bench-error" data-error hidden></div>
    <ul class="results" data-results></ul>
    <div class="visuals" data-visuals></div>
    <details class="tutor-sees"><summary>What your tutor sees</summary><p class="bench-note">Claude in Chrome reads this when you type <code>/tutor</code> (<a href="index.html#chrome">set it up</a>). The Ask links send it too.</p><pre data-tutor-text></pre></details>
  </aside>
</section>`).join("\n");

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Motion from Scratch · Guide</title>
<meta name="description" content="${COURSE.subtitle}. An interactive guide: read each layer, write the code beside it, and run the tests in your browser.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@112,700;112,800&family=Inter:wght@500;900&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;600&family=Silkscreen&display=swap">
<style>
${style}
/* ---- guide layout: chapter on the left, workbench on the right ---- */
body { padding-block: 24px 80px; }
.top { max-width: 1240px; margin: 0 auto 28px; display: flex; flex-direction: column; gap: 14px; }
.tabs { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; max-width: 100%; }
.tab { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; font-size: 0.85rem; text-decoration: none; color: var(--ink); background: var(--paper); border: 1px solid var(--line); border-radius: 999px; padding: 4px 12px 4px 4px; }
.tab .num { font-size: 0.75rem; padding: 1px 6px; }
.tab.soon { opacity: 0.45; }
.tab[aria-current="true"] { border-color: var(--key); }
.chapter { max-width: 1240px; margin: 0 auto 72px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 470px); gap: 36px; align-items: start; scroll-margin-top: 12px; }
.read { display: flex; flex-direction: column; gap: 16px; min-width: 0; container-type: inline-size; }
.read h3 { font-size: 1.4rem; margin-top: 18px; }
.read h4 { font-family: var(--display); font-stretch: 112%; font-size: 1.05rem; margin: 6px 0 0; }
.read ul, .read ol { margin: 0; padding-left: 1.3em; display: flex; flex-direction: column; gap: 6px; max-width: 66ch; }
.read pre.diagram { background: transparent; border: 1px dashed var(--line); color: var(--ink); --px: 16px; padding-inline: var(--px);
  /* Shrink a wide diagram until its widest line fits the column (monospace characters are about 0.6em wide), never above 13px. */
  font-size: clamp(9px, calc((100cqi - 2 * var(--px) - 2px) / (var(--cols, 40) * 0.61)), 13px); }
@media (max-width: 480px) { .read pre.diagram { --px: 10px; } }
.read details { border: 1px solid var(--line); border-radius: 6px; padding: 10px 14px; background: var(--paper); max-width: 66ch; }
.read details > summary { cursor: pointer; font-weight: 700; color: var(--pencil); }
.read details[open] > summary { margin-bottom: 10px; }
.read details p, .read details ol { margin-bottom: 8px; }
.ch-head { display: flex; flex-direction: column; gap: 8px; padding-bottom: 6px; border-bottom: 2px solid var(--ink); }
.ch-head h2 { font-size: clamp(2rem, 5vw, 2.8rem); }
.to-bench { display: none; font-size: 0.9rem; }
.bench { scroll-margin-top: 12px; }
.read blockquote.ask { margin: 0; font-size: 0.92rem; border: 1px dashed var(--pencil); border-radius: 6px; padding: 10px 12px; color: var(--ink); }
.read p.meta { font-size: 0.9rem; color: var(--muted); border-left: 3px solid var(--pencil); padding-left: 12px; }
.bench { position: sticky; top: 12px; max-height: calc(100vh - 24px); overflow: auto; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.bench-head { display: flex; align-items: center; gap: 10px; }
.bench-note { font-size: 0.82rem; color: var(--muted); }
.editor { width: 100%; min-height: 340px; resize: vertical; font-family: var(--mono); font-size: 12.5px; line-height: 1.5; tab-size: 2; color: var(--code-ink); background: var(--code-bg); border: 1px solid var(--line); border-radius: 6px; padding: 10px 12px; white-space: pre; overflow: auto; }
.bench-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.bench-actions kbd { font-family: var(--mono); font-size: 0.7rem; opacity: 0.7; margin-left: 4px; }
.bench-confirm { font-size: 0.85rem; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.bench-error { border: 1px dashed var(--fail); color: var(--fail); font-family: var(--mono); font-size: 0.8rem; padding: 8px 10px; border-radius: 6px; overflow-wrap: anywhere; }
.bench .visuals canvas { max-width: 100%; }
.tryit { border: 1px solid var(--line); border-left: 3px solid var(--pencil); background: var(--paper); border-radius: 6px; padding: 12px; display: flex; flex-direction: column; gap: 8px; max-width: 100%; min-width: 0; }
.tryit[data-kind="break"] { border-left-color: var(--key); }
.tryit-code { width: 100%; resize: vertical; font-family: var(--mono); font-size: 12.5px; line-height: 1.5; tab-size: 2; color: var(--code-ink); background: var(--code-bg); border: 1px solid var(--line); border-radius: 6px; padding: 10px 12px; white-space: pre; overflow: auto; }
.tryit-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.tryit-out { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.cpcell { border: 2px solid var(--ink); background: var(--paper); border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 10px; max-width: 100%; min-width: 0; }
.cpcell.complete { border-color: var(--pass); }
.cp-result { display: flex; flex-direction: column; gap: 8px; }
.tab.complete .num { background: var(--pass); }
.tab.complete::after { content: "★"; color: var(--pass); }
.howto { background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 10px 14px; max-width: 760px; }
.howto summary { cursor: pointer; font-weight: 700; color: var(--pencil); }
.howto ol { margin: 10px 0; padding-left: 1.3em; display: flex; flex-direction: column; gap: 6px; }
.howto p { font-size: 0.92rem; }
.tabbar { display: flex; gap: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
.tabbar .tabs { flex: 1 1 320px; min-width: 0; }
.tools { display: flex; gap: 8px; flex-wrap: wrap; }
.tools .btn { text-decoration: none; padding-block: 6px; font-size: 0.85rem; }
.tip { position: relative; }
.tip::after { content: attr(data-tip); position: absolute; top: calc(100% + 8px); left: 0; z-index: 30; width: max-content; max-width: 260px; white-space: normal; text-align: left; font: 400 0.8rem/1.4 var(--body); letter-spacing: 0; text-transform: none; color: var(--bg); background: var(--ink); padding: 8px 10px; border-radius: 6px; opacity: 0; pointer-events: none; transform: translateY(-3px); transition: opacity .12s, transform .12s; }
.tools .tip::after, .help [data-ask="chatgpt"]::after { left: auto; right: 0; }
.tip:hover::after, .tip:focus-visible::after { opacity: 1; transform: none; transition-delay: .25s; }
@media (hover: none) { .tip::after, .bench-actions kbd { display: none; } }
.toast { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); z-index: 40; width: min(440px, calc(100vw - 32px)); background: var(--ink); color: var(--bg); border-radius: 8px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 6px 24px rgba(0,0,0,.25); font-size: 0.9rem; }
.toast input { font: inherit; font-size: 0.85rem; width: 100%; border: 0; border-radius: 4px; padding: 6px 8px; }
.banner { max-width: 760px; border: 2px solid var(--key); background: var(--paper); border-radius: 8px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
.help { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 14px; font-size: 0.85rem; color: var(--muted); border-top: 1px dashed var(--line); padding-top: 10px; }
.level { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dots { display: inline-flex; gap: 6px; }
.dots button { width: 16px; height: 16px; padding: 0; border-radius: 50%; border: 2px solid var(--pencil); background: transparent; cursor: pointer; }
.dots button.on { background: var(--pencil); }
.dots button:focus-visible { outline: 2px solid var(--key); outline-offset: 2px; }
.level-now { font-size: 0.8rem; }
.tutor-sees { font-size: 0.85rem; border-top: 1px dashed var(--line); padding-top: 8px; }
.tutor-sees summary { cursor: pointer; font-weight: 700; color: var(--pencil); }
.tutor-sees pre { margin: 8px 0 0; max-height: 320px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 11.5px; }
@media (max-width: 960px) {
  .chapter { grid-template-columns: minmax(0, 1fr); }
  .bench { position: static; max-height: none; }
  .to-bench { display: inline; }
}
</style>
</head>
<body>
<div class="top">
  <div class="pegbar" aria-hidden="true"><i></i><i></i><i></i></div>
  <span class="eyebrow">The interactive guide</span>
  <h1>${COURSE.title}</h1>
  <p class="lede">${COURSE.subtitle}. Read a layer, then write its code in the workbench. Tests and pictures run in your browser.</p>
  <details class="howto">
    <summary>How to use this guide</summary>
    <ol>
      <li><strong>Read</strong> a layer. Make each <em>Predict</em> guess before you peek.</li>
      <li><strong>Write</strong> its functions in the workbench.</li>
      <li><strong>Run tests</strong> (or press ⌘/Ctrl + Enter). Failing tests show the value they expected and what they got; pictures appear as your code works.</li>
      <li><strong>Break it</strong> with the chapter's experiments.</li>
      <li><strong>Pass the checkpoint</strong> at the end of the chapter. When its tab shows ★, move to the next layer.</li>
      <li><strong>Stuck?</strong> Use the Ask links; the <em>Hint level</em> dots set how much help.</li>
    </ol>
    <p>All the ways to take the course are on <a href="index.html#start">the course home</a>.</p>
  </details>
  <div class="banner" data-progress-banner hidden></div>
  <div class="tabbar">
    <nav class="tabs" aria-label="Layers">${tabs}</nav>
    <div class="tools">
      <button class="btn ghost tip" type="button" data-save data-tip="Copies a private link with your code and answers. Open it on another device to pick up where you left off. Nothing is uploaded.">Save progress</button>
      <a class="btn ghost tip" data-showcase href="showcase.html" target="_blank" rel="noopener" data-tip="Opens a page that runs your engine and shows what it draws, ready to share. Your checkpoint answers stay private.">Share my engine ↗</a>
    </div>
  </div>
  <div class="toast" data-toast role="status" aria-live="polite" hidden><p data-toast-text></p><input type="text" readonly data-toast-input hidden aria-label="Link to copy"></div>
</div>
${sections}
${sources}
<script>
(function () {
  const $ = id => document.getElementById(id).textContent;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const key = id => "mfs-src-" + id;
  const codeFor = id => {
    const ed = document.getElementById("editor-" + id);
    return ed ? ed.value : (store.get(key(id)) ?? $("stub-" + id));
  };
  const run = src => new Function(src)();
  const escH = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const mark = { pass: "✓", fail: "✗", todo: "·" };

${read("tools/guide-runtime.js")}

  // Fresh MS with the libraries plus your code for layers up to this one.
  // Returns an error message, or null when everything loaded.
  function prepare(id) {
    globalThis.MS = {};
    run($("lib-course"));
    [...MS.COURSE.libs, ...MS.COURSE.browserLibs].forEach(f => run($("lib:" + f)));
    MS.COURSE.layers.filter(l => l.ready).forEach(l => run($("mystery-" + l.id)));
    for (const l of MS.COURSE.layers.filter(l => l.ready && l.id <= id)) {
      try { run(codeFor(l.id)); }
      catch (e) { return (l.id === id ? "Your code" : "Your layer " + l.id + " code") + " didn't load: " + e.name + ": " + e.message; }
    }
    return null;
  }

  function runLayer(section) {
    const id = section.dataset.layer;
    const errBox = section.querySelector("[data-error]");
    const list = section.querySelector("[data-results]");
    const vis = section.querySelector("[data-visuals]");
    errBox.hidden = true; list.innerHTML = ""; vis.innerHTML = "";
    const err = prepare(id);
    if (err) { errBox.hidden = false; errBox.textContent = err; state[id] = { error: err }; afterRun(id); return; }
    run($("test-" + id));
    const results = MS.runTests(id);
    state[id] = { results };
    const passed = results.filter(r => r.status === "pass").length;
    section.querySelector("[data-score]").textContent = passed + " / " + results.length;
    renderCheckpoint(id, results);
    list.innerHTML = MS.quietTodos(results).map(r => '<li class="' + r.status + '"><span class="mark">' + mark[r.status] + "</span><span>" + escH(r.name) + (r.message ? '<span class="msg">' + escH(r.message) + "</span>" : "") + "</span></li>").join("");
    for (const v of MS.visuals.filter(v => v.layer === id)) vis.appendChild(MS.figure(v));
    if (passed === results.length) list.before(vis); else vis.before(list);   // the pictures are the reward
  }

  document.querySelectorAll(".chapter").forEach(section => {
    const id = section.dataset.layer;
    const ed = section.querySelector(".editor");
    ed.value = store.get(key(id)) ?? $("stub-" + id);
    ed.addEventListener("input", () => store.set(key(id), ed.value));
    ed.addEventListener("keydown", e => {
      if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); ed.setRangeText("  ", ed.selectionStart, ed.selectionEnd, "end"); store.set(key(id), ed.value); }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); runLayer(section); }
    });
    section.querySelector("[data-run]").addEventListener("click", () => runLayer(section));
    const confirm = section.querySelector("[data-confirm]");
    section.querySelector("[data-reset]").addEventListener("click", () => { confirm.hidden = false; });
    section.querySelector("[data-reset-no]").addEventListener("click", () => { confirm.hidden = true; });
    section.querySelector("[data-reset-yes]").addEventListener("click", () => { ed.value = $("stub-" + id); store.set(key(id), ed.value); confirm.hidden = true; runLayer(section); });
    section.querySelector("[data-copy]").addEventListener("click", e => {
      const b = e.currentTarget;
      const done = ok => { b.textContent = ok ? "Copied" : "Select and copy"; setTimeout(() => (b.textContent = "Copy"), 1500); };
      try { navigator.clipboard.writeText(ed.value).then(() => done(true), () => { ed.select(); done(false); }); }
      catch (err) { ed.select(); done(false); }
    });
    runLayer(section);
  });

  // Checkpoint cells: run tests, load answers, draw the mystery, mark questions
  function renderCheckpoint(id, results) {
    const cell = document.querySelector('.cpcell[data-layer="' + id + '"]');
    if (!cell) return;
    const out = cell.querySelector("[data-cp-out]");
    const saved = store.get("mfs-cp-" + id);
    try { run(saved !== null ? saved : cell.querySelector("textarea").value); }
    catch (e) { out.hidden = false; out.innerHTML = '<p class="cp-hint">Your answers did not load: ' + escH(e.message) + "</p>"; return; }
    const cp = MS.runCheckpoint(id, results);
    (state[id] = state[id] || {}).cp = cp; afterRun(id);
    out.hidden = false;
    MS.showCheckpoint(out, cp);
    cell.classList.toggle("complete", !!cp.complete);
    const tab = document.querySelector('.tab[data-layer="' + id + '"]');
    if (tab) tab.classList.toggle("complete", !!cp.complete);
    const score = document.querySelector('#layer-' + id + ' [data-score]');
    if (score && cp.complete) score.textContent = "★ complete";
  }
  document.querySelectorAll(".cpcell").forEach(cell => {
    const id = cell.dataset.layer, ta = cell.querySelector("textarea"), k = "mfs-cp-" + id;
    const saved = store.get(k);
    if (saved !== null) ta.value = saved;
    ta.addEventListener("input", () => store.set(k, ta.value));
    const go = () => {
      const err = prepare(id);
      const out = cell.querySelector("[data-cp-out]");
      if (err) { out.hidden = false; out.textContent = err; return; }
      run($("test-" + id));
      renderCheckpoint(id, MS.runTests(id));
    };
    ta.addEventListener("keydown", e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); go(); } });
    cell.querySelector("[data-cp-run]").addEventListener("click", go);
    cell.querySelector("[data-cp-reset]").addEventListener("click", () => { ta.value = ta.defaultValue; store.set(k, ta.value); go(); });
  });

  // Predict / Break it cells
  document.querySelectorAll(".tryit").forEach(cell => {
    const ta = cell.querySelector(".tryit-code"), out = cell.querySelector(".tryit-out");
    const k = "mfs-try-" + cell.dataset.key;
    const saved = store.get(k);
    if (saved !== null) ta.value = saved;
    ta.addEventListener("input", () => store.set(k, ta.value));
    const go = () => {
      const err = prepare(cell.dataset.layer);
      out.hidden = false;
      out.textContent = err ? err : MS.runExperiment(ta.value);
    };
    ta.addEventListener("keydown", e => {
      if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); ta.setRangeText("  ", ta.selectionStart, ta.selectionEnd, "end"); store.set(k, ta.value); }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); go(); }
    });
    cell.querySelector("[data-try]").addEventListener("click", go);
    cell.querySelector("[data-try-reset]").addEventListener("click", () => { ta.value = ta.defaultValue; store.set(k, ta.value); out.hidden = true; });
  });

  // highlight the tab for the chapter in view
  const tabs = [...document.querySelectorAll(".tab[data-layer]")];
  const io = new IntersectionObserver(entries => {
    for (const en of entries) if (en.isIntersecting)
      tabs.forEach(t => t.setAttribute("aria-current", String(t.dataset.layer === en.target.dataset.layer)));
  }, { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll(".chapter").forEach(s => io.observe(s));
})();
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(root, "guide.html"), page);
console.log(`guide.html: ${ready.length} chapters, ${(page.length / 1024).toFixed(0)} KB`);
