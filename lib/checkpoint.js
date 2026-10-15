// lib/checkpoint.js — each layer's checkpoint. PROVIDED.
// Draws the mystery picture with the learner's code (a wrong rule shows up in
// the picture, with a hint about which rule, never the fix) and checks the
// answers in checkpoints/NN-*.js against fingerprints.
(function (MS) {
  MS.checkpointAnswers = {};
  // Your checkpoints/NN-*.js file calls this.
  MS.answers = function (layerId, answers) { MS.checkpointAnswers[layerId] = answers || {}; };

  // FNV-1a: a tiny, fast fingerprint. Not encryption; it just keeps the
  // answers out of plain sight so the repo doesn't spoil them.
  function fnv(bytes) {
    let h = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, "0");
  }
  const textBytes = s => Array.from(unescape(encodeURIComponent(s)), c => c.charCodeAt(0));
  const norm = v => (Array.isArray(v) || ArrayBuffer.isView(v)) ? Array.from(v, norm) : v;
  MS.hashAnswer = (layerId, qid, value) => fnv(textBytes(`${layerId}:${qid}:${JSON.stringify(norm(value))}`));
  MS.hashFrame = frame => fnv(frame.data);

  // A small seeded shuffle, so the commands always come in the same scrambled order.
  function shuffle(list, seed) {
    let s = seed >>> 0;
    const rand = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    return list;
  }
  const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  const near = (a, b, tol) => a && b && a.every((v, i) => Math.abs(v - b[i]) <= tol);

  // ------------------------------------------------------------ the mysteries
  // Each layer's mystery lives in lib/mysteries/NN-name.js and registers
  // itself here: draw() runs the learner's functions, check(drawn, data)
  // explains what went wrong against the expected fingerprint.
  const MYSTERIES = {};
  MS.mystery = (layerId, def) => { MYSTERIES[layerId] = def; };
  MS.mysteryKit = { shuffle, same, near };
  MS.CHECKPOINT_MYSTERIES = MYSTERIES;   // read when the checkpoint fingerprints are generated

  // ------------------------------------------------------------ running one
  // testResults: what MS.runTests(layerId) returned.
  MS.runCheckpoint = function (layerId, testResults) {
    const data = (MS.CHECKPOINT_DATA || {})[layerId];
    const left = testResults.filter(r => r.status !== "pass").length;
    // No tests loaded means nothing has been proven yet: stay locked.
    const report = { layer: layerId, available: !!data && !!MYSTERIES[layerId], locked: left > 0 || testResults.length === 0, testsLeft: testResults.length ? left : "all", questions: [], mystery: null, complete: false };
    if (!report.available || report.locked) return report;

    try {
      const drawn = MYSTERIES[layerId].draw();
      const m = MYSTERIES[layerId].check(drawn, data);
      report.mystery = { frame: drawn.frame, ok: m.wrong === 0 && MS.hashFrame(drawn.frame) === data.mystery, hints: m.hints };
      if (!report.mystery.ok && !m.hints.length) report.mystery.hints = ["The picture differs from the expected one, but none of the usual traps fired. Re-read the spec comments for this layer."];
    } catch (e) {
      report.mystery = { frame: null, ok: false, hints: [`Your code threw an error while drawing the mystery picture: ${e.message}`] };
    }
    const given = MS.checkpointAnswers[layerId] || {};
    report.questions = Object.keys(data.questions).map((qid, i) => {
      const v = given[qid];
      const status = v === null || v === undefined ? "blank" : MS.hashAnswer(layerId, qid, v) === data.questions[qid] ? "right" : "wrong";
      return { id: qid, n: i + 1, status };
    });
    report.complete = report.mystery.ok && report.questions.every(q => q.status === "right");
    return report;
  };

  // Shared wording for every report below.
  const MARK = { right: "✓", wrong: "✗ not yet", blank: "✏️ blank" };
  const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const locked = report => `🔒 Checkpoint locked: ${report.testsLeft} ${report.testsLeft === 1 ? "test" : "tests"} still to pass.`;
  const headline = (report, file) => report.complete ? "★ Checkpoint passed: layer complete!"
    : "◇ Checkpoint unlocked" + (file ? `: answer the questions in ${file}` : "");
  const picture = report => `Mystery picture, drawn by your code: ${report.mystery.ok ? "✓ correct" : "✗ not quite"}`;

  // Pages (tests.html and the guide): fills `el` using the course's CSS classes.
  MS.showCheckpoint = function (el, report, file) {
    if (!report.available) { el.innerHTML = ""; return; }
    if (report.locked) { el.innerHTML = `<p class="cp-head">${locked(report)}</p>`; return; }
    el.innerHTML = `<p class="cp-head">${esc(headline(report, file))}</p>
      <div class="cp-body"><figure class="cp-pic"></figure><div><p>${picture(report)}</p>
      ${report.mystery.hints.map(h => `<p class="cp-hint">→ ${esc(h)}</p>`).join("")}
      <p>Questions: ${report.questions.map(q => `<span class="cp-q ${q.status}">${q.n} ${MARK[q.status]}</span>`).join(" ")}</p></div></div>`;
    if (report.mystery.frame && MS.present) el.querySelector(".cp-pic").appendChild(MS.present(report.mystery.frame, document.createElement("canvas"), 3));
  };

  // Notebooks: self-contained HTML (the picture becomes a PNG when lib/png.js is loaded).
  MS.checkpointHTML = function (report) {
    if (!report.available) return "";
    const box = inner => `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;border-top:1px dashed #c7d5e3;padding-top:8px;margin-top:8px">${inner}</div>`;
    if (report.locked) return box(`<p><strong>${locked(report)}</strong></p>`);
    let img = "";
    if (report.mystery.frame && MS.encodePNG) img = `<img alt="Mystery picture" src="data:image/png;base64,${MS.toBase64(MS.encodePNG(MS.zoomFrame(report.mystery.frame, 3)))}" style="max-width:100%;image-rendering:pixelated;border:1px solid #c7d5e3">`;
    const color = { right: "#1d8a5b", wrong: "#c93636", blank: "#7d889b" };
    return box(`<p><strong>${headline(report)}</strong></p>
${img}<p>${picture(report)}</p>
${report.mystery.hints.map(x => `<p style="color:#c93636">→ ${esc(x)}</p>`).join("")}
<p>Questions: ${report.questions.map(q => `<span style="color:${color[q.status]};margin-right:12px">${q.n} ${MARK[q.status]}</span>`).join("")}</p>`);
  };

  // Terminals and Colab: plain text with the picture drawn in characters.
  MS.checkpointText = function (report, file) {
    if (!report.available) return "";
    if (report.locked) return "  " + locked(report);
    const lines = ["  " + headline(report, file), "    " + picture(report)];
    const f = report.mystery.frame;
    if (f && MS.asciiFrame && !report.complete) lines.push(MS.asciiFrame(f, f.width > 120 ? 2 : 1).split("\n").map(l => "      " + l).join("\n"));
    for (const h of report.mystery.hints) lines.push("    → " + h);
    lines.push("    Questions: " + report.questions.map(q => `${q.n} ${MARK[q.status]}`).join("   "));
    return lines.join("\n");
  };
})(globalThis.MS = globalThis.MS || {});
