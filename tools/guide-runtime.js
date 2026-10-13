  // ---- tools/guide-runtime.js: spliced into guide.html's script by build-guide.js ----
  // Not a standalone file. It shares the page script's scope ($, store, run,
  // codeFor, escH) and is placed before the chapters start running.

  run($("lib-course")); run($("lib-share"));
  const C = MS.COURSE, share = MS.share;
  const state = {};                                   // per layer: { results, cp, error }
  const layerOf = id => C.layers.find(l => l.id === id);
  const level = id => Math.min(5, Math.max(1, parseInt(store.get("mfs-hint-" + id), 10) || 1));
  const listIds = ids => ids.length > 1 ? "layers " + ids.slice(0, -1).join(", ") + " and " + ids[ids.length - 1] : "layer " + ids[0];

  // ---------- "What your tutor sees" ----------
  // Plain text that Claude in Chrome (or any tutor) can read. Statuses only:
  // checkpoint answers never appear here.
  function cpLine(cp) {
    if (cp.locked) return "Checkpoint: locked until every test passes";
    const word = { right: "right", wrong: "not yet", blank: "blank" };
    return "Checkpoint: " + (cp.complete ? "passed ★" : "unlocked") +
      "; mystery picture " + (cp.mystery.ok ? "correct" : "not quite" + (cp.mystery.hints.length ? " (the runner says: " + cp.mystery.hints.join(" ") + ")" : "")) +
      "; questions " + cp.questions.map(q => q.n + " " + word[q.status]).join(", ");
  }
  function tutorText(id) {
    const l = layerOf(id), s = state[id] || {}, lv = level(id);
    const out = [
      "Motion from Scratch · Layer " + id + " · " + l.title + " (" + l.builds + ")",
      "Hint level the learner allows: " + lv + " of 5 (" + C.hintLevels[lv - 1] + ")",
    ];
    if (s.error) out.push("Code error: " + s.error);
    else if (s.results) {
      const pass = s.results.filter(r => r.status === "pass").length, bad = s.results.filter(r => r.status !== "pass");
      out.push("Tests: " + pass + " / " + s.results.length + " passing");
      bad.slice(0, 8).forEach(r => out.push("  " + (r.status === "todo" ? "· not written yet: " + r.name : "✗ " + r.name + (r.message ? " (" + r.message + ")" : ""))));
      if (bad.length > 8) out.push("  …and " + (bad.length - 8) + " more");
    }
    if (s.cp) out.push(cpLine(s.cp));
    out.push("", "Learner's code (src/" + id + "-" + l.slug + ".js):", codeFor(id));
    return out.join("\n");
  }
  function afterRun(id) {
    const sec = document.getElementById("layer-" + id);
    if (!sec) return;
    const pre = sec.querySelector("[data-tutor-text]");
    if (pre) pre.textContent = tutorText(id);
    const lv = level(id), label = sec.querySelector("[data-hint-level]"), more = sec.querySelector("[data-hint]");
    if (label) label.textContent = "Hint level " + lv + " of 5: " + C.hintLevels[lv - 1];
    if (more) more.disabled = lv >= 5;
  }

  // ---------- Ask links that bring the learner's code along ----------
  function askText(id, maxCode) {
    const s = state[id] || {}, lv = level(id);
    const parts = ["My hint level is " + lv + " of 5, so go no further than: " + C.hintLevels[lv - 1] + "."];
    if (s.error) parts.push("My code doesn't load: " + s.error + ".");
    else if (s.results) {
      const pass = s.results.filter(r => r.status === "pass").length;
      const fail = s.results.filter(r => r.status === "fail"), todo = s.results.filter(r => r.status === "todo").length;
      parts.push(pass + " of " + s.results.length + " tests pass" + (todo ? ", " + todo + " not written yet" : "") + ".");
      if (fail.length) parts.push("Failing: " + fail.slice(0, 3).map(r => r.name + (r.message ? " (" + r.message + ")" : "")).join("; ") + ".");
    }
    let code = codeFor(id);
    if (code.length > maxCode) code = code.slice(0, maxCode) + "\n// …cut off here; ask me for the rest";
    parts.push("My code so far:\n" + code);
    return parts.join(" ");
  }
  // Chat apps reject very long links, so trim the code until the link fits.
  const fit = make => { for (let max = 2400; ; max -= 400) { const href = make(max); if (href.length <= 7000 || max <= 0) return href; } };
  const linkFor = (who, id, text) => (who === "claude" ? C.claudeLink : C.chatgptLink)(layerOf(id), text);
  const wireAsk = (a, build) => ["pointerdown", "focus", "click"].forEach(ev => a.addEventListener(ev, () => { a.href = build(); }));

  document.querySelectorAll(".chapter").forEach(sec => {
    const id = sec.dataset.layer;
    sec.querySelectorAll("[data-ask]").forEach(a => wireAsk(a, () => fit(max => linkFor(a.dataset.ask, id, askText(id, max)))));
    sec.querySelector("[data-hint]").addEventListener("click", () => { store.set("mfs-hint-" + id, String(Math.min(5, level(id) + 1))); afterRun(id); });
    sec.querySelector("[data-hint-reset]").addEventListener("click", () => { store.set("mfs-hint-" + id, "1"); afterRun(id); });
    sec.querySelector(".editor").addEventListener("input", () => afterRun(id));
  });
  document.querySelectorAll(".cpcell").forEach(cell => {
    const id = cell.dataset.layer;
    cell.querySelectorAll("[data-ask-cp]").forEach(a => wireAsk(a, () =>
      linkFor(a.dataset.askCp, id, C.checkpointAsk + (state[id] && state[id].cp ? " Where I am: " + cpLine(state[id].cp) + "." : ""))));
  });

  // ---------- Save, move or share ----------
  const shareBox = document.getElementById("save");
  const status = shareBox.querySelector("[data-share-status]"), fallback = shareBox.querySelector("[data-share-fallback]");
  const nameIn = shareBox.querySelector("[data-share-name]"), openA = shareBox.querySelector("[data-share-open]");
  nameIn.value = store.get("mfs-share-name") || "";
  const here = () => location.href.split("#")[0];
  function collect(kind) {
    const src = {};
    document.querySelectorAll(".chapter").forEach(sec => {
      const id = sec.dataset.layer, v = sec.querySelector(".editor").value;
      if (v !== $("stub-" + id)) src[id] = v;
    });
    if (kind === "showcase") return { v: 1, kind: "showcase", name: nameIn.value.trim().slice(0, 40), src };
    const cp = {}, tries = {};
    document.querySelectorAll(".cpcell").forEach(c => { const t = c.querySelector("textarea"); if (t.value !== t.defaultValue) cp[c.dataset.layer] = t.value; });
    document.querySelectorAll(".tryit").forEach(c => { const t = c.querySelector(".tryit-code"); if (t.value !== t.defaultValue) tries[c.dataset.key] = t.value; });
    return { v: 1, kind: "progress", src, cp, try: tries };
  }
  async function linkOf(kind) {
    const data = await share.pack(collect(kind));
    return kind === "showcase" ? new URL("showcase.html", here()).href + "#s=" + data : here() + "#progress=" + data;
  }
  shareBox.querySelectorAll("[data-share]").forEach(b => b.addEventListener("click", async () => {
    const kind = b.dataset.share, what = kind === "progress" ? "Progress link" : "Showcase link";
    const empty = Object.keys(collect(kind).src).length ? "" : " You haven't changed any code yet, so there isn't much in it.";
    let url;
    try { url = await linkOf(kind); } catch (e) { status.textContent = "Couldn't make the link: " + e.message; return; }
    try { await navigator.clipboard.writeText(url); fallback.hidden = true; status.textContent = what + " copied." + empty; }
    catch (e) { fallback.hidden = false; fallback.value = url; fallback.select(); status.textContent = what + " is in the box below. Copy it from there." + empty; }
  }));
  const refreshOpen = () => linkOf("showcase").then(u => { openA.href = u; }, () => {});
  shareBox.addEventListener("toggle", () => { if (shareBox.open) refreshOpen(); });
  nameIn.addEventListener("input", () => { store.set("mfs-share-name", nameIn.value); refreshOpen(); });
  ["pointerdown", "focus"].forEach(ev => openA.addEventListener(ev, refreshOpen));

  // ---------- Opening a progress link ----------
  const banner = document.querySelector("[data-progress-banner]");
  const incoming = location.hash.match(/^#progress=(.+)$/);
  const clearHash = () => history.replaceState(null, "", location.pathname + location.search);
  if (incoming) share.unpack(incoming[1]).then(data => {
    if (!data || data.kind !== "progress") throw new Error("it isn't a progress link.");
    const ids = new Set(C.layers.filter(l => l.ready).map(l => l.id));
    const tryKeys = new Set([...document.querySelectorAll(".tryit")].map(c => c.dataset.key));
    const ok = v => typeof v === "string" && v.length < 300000;
    const writes = [];
    for (const [id, v] of Object.entries(data.src || {})) if (ids.has(id) && ok(v)) writes.push(["mfs-src-" + id, v]);
    for (const [id, v] of Object.entries(data.cp || {})) if (ids.has(id) && ok(v)) writes.push(["mfs-cp-" + id, v]);
    for (const [k, v] of Object.entries(data.try || {})) if (tryKeys.has(k) && ok(v)) writes.push(["mfs-try-" + k, v]);
    const withCode = Object.keys(data.src || {}).filter(id => ids.has(id)).sort();
    banner.hidden = false;
    banner.innerHTML = "<p><strong>This link holds saved work" + (withCode.length ? ", including your code for " + listIds(withCode) : "") + ".</strong> " +
      "Load it into this browser? It replaces the work saved here for those parts. Only load links you made yourself, because the code in them runs on this page.</p>" +
      '<span class="btn-row"><button class="btn" type="button" data-load>Load my work</button><button class="btn ghost" type="button" data-skip>Not now</button></span>';
    banner.querySelector("[data-load]").addEventListener("click", () => { writes.forEach(([k, v]) => store.set(k, v)); clearHash(); location.reload(); });
    banner.querySelector("[data-skip]").addEventListener("click", () => { clearHash(); banner.hidden = true; });
  }).catch(e => { banner.hidden = false; banner.textContent = "This progress link didn't open: " + e.message; });
  // ---- end of tools/guide-runtime.js ----
