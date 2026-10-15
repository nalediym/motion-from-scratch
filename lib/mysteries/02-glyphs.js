// lib/mysteries/02-glyphs.js — layer 02's checkpoint picture. PROVIDED.
// Layer 02: three centered lines with lowercase, an emoji and middle dots.
// draw() runs the learner's functions; check() says which rule went wrong,
// never how to fix it. See lib/checkpoint.js for how a checkpoint runs.
(function (MS) {
  MS.mystery("02", {
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
      return { frame: f, stats, S, record: { lines: stats } };   // record is stored with the fingerprints
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
  });
})(globalThis.MS = globalThis.MS || {});
