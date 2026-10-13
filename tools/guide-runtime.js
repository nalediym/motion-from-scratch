  // ---- tools/guide-runtime.js: spliced into guide.html's script by build-guide.js ----
  // Not a standalone file. It shares the page script's scope ($, store, run,
  // codeFor, escH) and is placed before the chapters start running.

  run($("lib-course")); run($("lib-share"));
  if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) document.querySelectorAll("[data-kbd]").forEach(k => { k.textContent = "Ctrl↵"; });
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
  function tutorText(id, maxCode) {
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
    let code = codeFor(id);
    if (maxCode && code.length > maxCode) code = code.slice(0, maxCode) + "\n// …cut off here; ask me for the rest";
    out.push("", "Learner's code (src/" + id + "-" + l.slug + ".js):", code);
    return out.join("\n");
  }
  function afterRun(id) {
    const sec = document.getElementById("layer-" + id);
    if (!sec) return;
    const pre = sec.querySelector("[data-tutor-text]");
    if (pre) pre.textContent = tutorText(id);
    const lv = level(id), label = sec.querySelector("[data-hint-level]");
    if (label) label.textContent = lv + " · " + C.hintShort[lv - 1];
    sec.querySelectorAll("[data-level]").forEach(b => { const on = Number(b.dataset.level) <= lv; b.classList.toggle("on", on); b.setAttribute("aria-checked", String(Number(b.dataset.level) === lv)); });
    refreshShowcase();
  }

  // ---------- Ask links that bring the learner's code along ----------
  const askText = (id, maxCode) => "my code for this layer. My tutor panel shows:\n" + tutorText(id, maxCode);
  // Chat apps reject very long links, so trim the code until the link fits.
  const fit = make => { for (let max = 2400; ; max -= 400) { const href = make(max); if (href.length <= 7000 || max <= 0) return href; } };
  const linkFor = (who, id, text) => (who === "claude" ? C.claudeLink : C.chatgptLink)(layerOf(id), text);
  const wireAsk = (a, build) => ["pointerdown", "focus", "click"].forEach(ev => a.addEventListener(ev, () => { a.href = build(); }));

  document.querySelectorAll(".chapter").forEach(sec => {
    const id = sec.dataset.layer;
    sec.querySelectorAll("[data-ask]").forEach(a => wireAsk(a, () => fit(max => linkFor(a.dataset.ask, id, askText(id, max)))));
    sec.querySelectorAll("[data-level]").forEach(b => b.addEventListener("click", () => { store.set("mfs-hint-" + id, b.dataset.level); afterRun(id); }));
    sec.querySelector(".editor").addEventListener("input", () => afterRun(id));
  });

  // ---------- Save progress / Share my engine ----------
  const here = () => location.href.split("#")[0];
  const saveBtn = document.querySelector("[data-save]"), showA = document.querySelector("[data-showcase]");
  const toast = document.querySelector("[data-toast]"), toastText = toast.querySelector("[data-toast-text]"), toastIn = toast.querySelector("[data-toast-input]");
  let toastTimer;
  const say = (text, link) => {
    clearTimeout(toastTimer);
    toast.hidden = false; toastText.textContent = text;
    toastIn.hidden = !link; if (link) { toastIn.value = link; toastIn.select(); }
    toastTimer = setTimeout(() => { toast.hidden = true; }, link ? 15000 : 6000);
  };
  function collect(kind) {
    const src = {};
    document.querySelectorAll(".chapter").forEach(sec => {
      const id = sec.dataset.layer, v = sec.querySelector(".editor").value;
      if (v !== $("stub-" + id)) src[id] = v;
    });
    if (kind === "showcase") return { v: 1, kind: "showcase", name: "", src };
    const cp = {}, tries = {};
    document.querySelectorAll(".cpcell").forEach(c => { const t = c.querySelector("textarea"); if (t.value !== t.defaultValue) cp[c.dataset.layer] = t.value; });
    document.querySelectorAll(".tryit").forEach(c => { const t = c.querySelector(".tryit-code"); if (t.value !== t.defaultValue) tries[c.dataset.key] = t.value; });
    return { v: 1, kind: "progress", src, cp, try: tries };
  }
  saveBtn.addEventListener("click", async () => {
    let url;
    try { url = here() + "#progress=" + await share.pack(collect("progress")); } catch (e) { say("Couldn't make the link: " + e.message); return; }
    try { await navigator.clipboard.writeText(url); say("Progress link copied. Bookmark it, or open it on another device. It holds your answers, so keep it private."); }
    catch (e) { say("Copy your progress link from the box below. It holds your answers, so keep it private.", url); }
  });
  // The showcase opens in a new tab, so its link is kept ready ahead of the click.
  // "&mine" shows the owner's box (name + copy) on the showcase page.
  let showTimer;
  function refreshShowcase() {
    clearTimeout(showTimer);
    showTimer = setTimeout(() => share.pack(collect("showcase")).then(d => { showA.href = new URL("showcase.html", here()).href + "#s=" + d + "&mine"; }, () => {}), 300);
  }
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
