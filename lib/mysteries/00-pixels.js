// lib/mysteries/00-pixels.js — layer 00's checkpoint picture. PROVIDED.
// Layer 00: a word, drawn pixel by pixel with setPixel, through three traps.
// draw() runs the learner's functions; check() says which rule went wrong,
// never how to fix it. See lib/checkpoint.js for how a checkpoint runs.
(function (MS) {
  const { shuffle, same, near } = MS.mysteryKit;
  MS.mystery("00", {
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
  });
})(globalThis.MS = globalThis.MS || {});
