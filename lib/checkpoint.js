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
  // Each mystery has draw() (runs YOUR functions) and check() (explains what
  // went wrong, comparing against the expected fingerprint).
  const MYSTERIES = {
    // Layer 00: a word, drawn pixel by pixel with setPixel, through three traps.
    "00": {
      draw() {
        const word = "PIXELS", S = 2, M = 3;
        const W = M * 2 + (word.length * 6 - 1) * S, H = M * 2 + 7 * S;
        const f = MS.createFrame(W, H);
        MS.clearFrame(f, [11, 13, 18]);
        const ink = new Set(), cmds = [];
        [...word].forEach((ch, i) => MS.FONT_5x7[ch].forEach((row, r) => [...row].forEach((cell, c) => {
          if (cell !== "#") return;
          for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) {
            const x = M + (i * 6 + c) * S + dx, y = M + r * S + dy;
            ink.add(x + "," + y);
            cmds.push([x + 0.7, y + 0.2, [300, 300, 300]]);   // traps: fractional coords, out-of-range color
          }
        })));
        for (let y = 0; y < H - 1; y++) cmds.push([W, y, [255, 92, 138]]);  // trap: one pixel past the right edge
        shuffle(cmds, 2026).forEach(([x, y, c]) => MS.setPixel(f, x, y, c));
        return { frame: f, ink };
      },
      check({ frame: f, ink }) {
        const BG = [11, 13, 18, 255], WHITE = [255, 255, 255, 255];
        let wrong = 0, decoys = 0, missing = 0, dark = 0, extra = 0;
        for (let y = 0; y < f.height; y++) for (let x = 0; x < f.width; x++) {
          const p = MS.getPixel(f, x, y), isInk = ink.has(x + "," + y);
          if (same(p, isInk ? WHITE : BG)) continue;
          wrong++;
          if (p && p[0] === 255 && p[1] === 92) decoys++;
          else if (isInk && same(p, BG)) missing++;
          else if (isInk) dark++;
          else extra++;
        }
        const hints = [];
        if (decoys) hints.push(`${decoys} pink speck(s) appeared near the left edge. A pixel drawn one step past the right edge wrapped onto the next row. Look at how setPixel decides whether (x, y) is inside the frame.`);
        if (missing && !extra) hints.push(`${missing} letter pixel(s) never got drawn. The commands use fractional coordinates like 3.7, and a write to a fractional index is silently ignored. Look at what setPixel does with x and y before using them.`);
        if (extra && !decoys) hints.push(`${extra} pixel(s) landed next to where they belong. Fractional coordinates should round DOWN (3.7 → 3), not to the nearest whole number.`);
        if (dark) hints.push(`${dark} letter pixel(s) came out the wrong color. The commands use the color [300, 300, 300], which should clamp to white. Look at the kind of array createFrame makes.`);
        return { wrong, hints };
      },
    },

    // Layer 01: a word made of touching half-transparent squares, painted on
    // nothing, then composited over a gradient card.
    "01": {
      draw() {
        const word = "BLEND", C = 3, M = 4;
        const W = M * 2 + (word.length * 6 - 1) * C, H = M * 2 + 7 * C;
        const layer = MS.createFrame(W, H);              // transparent: trap for the divide-by-alpha rule
        let cells = 0;
        [...word].forEach((ch, i) => MS.FONT_5x7[ch].forEach((row, r) => [...row].forEach((cell, c) => {
          if (cell !== "#") return;
          cells++;
          MS.fillRect(layer, M + (i * 6 + c) * C, M + r * C, C, C, [0, 140, 255, 128]);   // neighbors share edges
        })));
        const card = MS.createFrame(W, H);
        MS.fillVerticalGradient(card, MS.hex("#1A2740"), MS.hex("#0B0D12"));
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const p = MS.getPixel(layer, x, y);
          if (p[3]) MS.blendPixel(card, x, y, p);
        }
        return { frame: card, layer, cells, C };
      },
      check({ frame, layer, cells, C }, data) {
        let inked = 0, seams = 0, darkened = 0;
        for (let y = 0; y < layer.height; y++) for (let x = 0; x < layer.width; x++) {
          const p = MS.getPixel(layer, x, y);
          if (!p[3]) continue;
          inked++;
          if (p[3] > 130) seams++;
          else if (!near(p.slice(0, 3), [0, 140, 255], 2)) darkened++;
        }
        const matches = MS.hashFrame(frame) === data.mystery;
        const hints = [];
        if (seams) hints.push(`${seams} pixel(s) were painted twice where two squares touch, leaving darker seams. A rectangle's right and bottom edges should be exclusive.`);
        if (inked < cells * C * C && !seams) hints.push(`The squares came out smaller than ${C} × ${C}. Check how fillRect rounds its edges.`);
        if (darkened) hints.push(`${darkened} pixel(s) of ink came out darker than the color painted. See-through color painted onto an empty pixel should keep its color; look at the divide-by-outAlpha step in blendPixel.`);
        if (!matches && !hints.length) hints.push("The letters are right but the background card isn't. Check fillVerticalGradient: each row samples t = (y + 0.5) / height.");
        return { wrong: matches ? 0 : 1, hints };
      },
    },

    // Layer 02: three centered lines with lowercase, an emoji and middle dots.
    "02": {
      draw() {
        const lines = ["hello, pixels!", "MADE BY ME \u{1F44B}", "· CENTER ·"];
        const S = 2, W = 190, M = 6, LINE = 7 * S + 6;
        const f = MS.createFrame(W, M * 2 + lines.length * LINE - 6);
        MS.clearFrame(f, [11, 13, 18]);
        lines.forEach((text, i) => MS.drawText(f, text, W / 2, M + i * LINE, S, [255, 255, 255], { align: "center" }));
        const stats = lines.map((_, i) => {
          let ink = 0, left = W, right = -1;
          for (let y = M + i * LINE; y < M + i * LINE + 7 * S; y++) for (let x = 0; x < W; x++) {
            const p = MS.getPixel(f, x, y);
            if (p && p[0] > 128) { ink++; left = Math.min(left, x); right = Math.max(right, x); }
          }
          return { ink, left, right };
        });
        return { frame: f, stats, S };
      },
      check({ frame, stats, S }, data) {
        const want = data.lines;
        const matches = MS.hashFrame(frame) === data.mystery;
        const hints = [];
        if (stats[0].ink !== want[0].ink) hints.push(`Line 1 ("hello, pixels!") came out wrong. It's all lowercase, and the font only has uppercase: look for tofu boxes.`);
        if (stats[1].ink === want[1].ink + 20 * S * S) hints.push("Line 2 drew two tofu boxes for one emoji. Walk the text by characters (for...of), not by string index.");
        else if (stats[1].ink !== want[1].ink) hints.push(`Line 2 ("MADE BY ME 👋") came out wrong. Expect one tofu box for the emoji, and check how spaces are handled.`);
        const shifted = stats.some((s, i) => s.ink === want[i].ink && (s.left !== want[i].left || s.right !== want[i].right));
        if (shifted) hints.push("A line is shifted sideways. Centering uses measureText: tracking belongs only BETWEEN glyphs, and the left edge is x − width / 2.");
        if (!matches && !hints.length) hints.push("Something small differs. Compare your drawText with the spec comment line by line.");
        return { wrong: matches ? 0 : 1, hints };
      },
    },
  };
  MS.CHECKPOINT_MYSTERIES = MYSTERIES;   // used by tools/checkpoint-data.js

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
  const locked = report => `🔒 Checkpoint locked: ${report.testsLeft} test(s) still to pass.`;
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
    if (report.mystery.frame && MS.asciiFrame) lines.push(MS.asciiFrame(report.mystery.frame).split("\n").map(l => "      " + l).join("\n"));
    for (const h of report.mystery.hints) lines.push("    → " + h);
    lines.push("    Questions: " + report.questions.map(q => `${q.n} ${MARK[q.status]}`).join("   "));
    return lines.join("\n");
  };
})(globalThis.MS = globalThis.MS || {});
