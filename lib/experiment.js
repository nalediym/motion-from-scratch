// lib/experiment.js — runs the "Predict, then run" and "Break it" blocks
// from the chapters. PROVIDED.
//
// Blocks are plain JavaScript that call your MS functions and console.log.
// Two helpers make them easier to read:
//   MS.reveal(label, myGuess, actual)  compares your prediction with reality
//   MS.asciiFrame(frame)               draws a small frame as text
(function (MS) {
  const isList = v => Array.isArray(v) || ArrayBuffer.isView(v);
  MS.formatValue = function (v) {
    if (isList(v)) return "[" + Array.from(v, MS.formatValue).join(", ") + "]";
    if (typeof v === "string") return v;
    if (v && typeof v === "object") { try { return JSON.stringify(v); } catch (e) { return String(v); } }
    return String(v);
  };
  const same = (a, b) => isList(a) && isList(b)
    ? a.length === b.length && Array.from(a).every((x, i) => same(x, Array.from(b)[i]))
    : a === b || (typeof a === "number" && typeof b === "number" && Math.abs(a - b) < 1e-9);

  MS.reveal = function (label, guess, actual) {
    const f = MS.formatValue;
    if (guess === null || guess === undefined)
      return console.log(`✏️  ${label}: fill in your guess first (replace null), then run again.`);
    if (same(guess, actual)) console.log(`✓ ${label}: you predicted ${f(actual)}. Spot on.`);
    else console.log(`✗ ${label}: you guessed ${f(guess)}, the machine says ${f(actual)}. Open the answer below and work out why.`);
  };

  // "·" for empty pixels, then darker-to-brighter characters for ink.
  MS.asciiFrame = function (frame) {
    const ramp = ":-=+*#%@█";
    const rows = [];
    for (let y = 0; y < frame.height; y++) {
      let row = "";
      for (let x = 0; x < frame.width; x++) {
        const i = (y * frame.width + x) * 4, d = frame.data;
        if (d[i + 3] === 0) { row += "·"; continue; }
        const light = ((0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255) * (d[i + 3] / 255);
        row += ramp[Math.min(ramp.length - 1, Math.floor(light * ramp.length))];
      }
      rows.push(row);
    }
    return rows.join("\n");
  };

  // Run something while capturing everything it logs; returns the text.
  function capture(run) {
    const out = [];
    const fmt = a => a.map(MS.formatValue).join(" ");
    const con = { log: (...a) => out.push(fmt(a)), info: (...a) => out.push(fmt(a)), warn: (...a) => out.push("⚠ " + fmt(a)), error: (...a) => out.push("✗ " + fmt(a)) };
    const real = { log: console.log, info: console.info, warn: console.warn, error: console.error };
    try {
      Object.assign(console, con);   // MS.reveal and your own code log through the global console
      run(con);
    } catch (e) {
      out.push(e && e.todo ? `⏳ ${e.message}. Write it first, then run this again.` : `Error: ${e && e.message ? e.message : e}`);
    } finally {
      Object.assign(console, real);
    }
    return out.join("\n") || "(nothing was logged)";
  }
  // Run a block's source text (guide, terminal, Colab).
  MS.runExperiment = source => capture(con => new Function("console", source)(con));
  // Run a block written as a function (notebooks that run code directly).
  MS.runExperimentFn = fn => capture(() => fn());

  // Pull the runnable blocks out of a chapter's Markdown.
  // ```js predict   → kind "predict"     ```js experiment → kind "break"
  MS.extractBlocks = function (markdown) {
    const blocks = [];
    const re = /```js (predict|experiment)\n([\s\S]*?)```/g;
    let m;
    while ((m = re.exec(markdown))) blocks.push({ kind: m[1] === "predict" ? "predict" : "break", code: m[2].replace(/\n$/, "") });
    return blocks;
  };
})(globalThis.MS = globalThis.MS || {});
