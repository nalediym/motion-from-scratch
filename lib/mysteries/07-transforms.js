// lib/mysteries/07-transforms.js — layer 07's checkpoint picture. PROVIDED.
// A word made of dots, set in italics by your own matrix. Every dot asks one
// small question about a rule (where a matrix moves a point, the order of
// multiply, undoing a matrix, which source pixel lands where, soft edges,
// blur radius...). A dot that gets a wrong answer flies off its letter.
// Every rule right spells a word.
// draw() runs the learner's functions; check() says which rule went wrong,
// never how to fix it. See lib/checkpoint.js for how a checkpoint runs.
(function (MS) {
  const { shuffle } = MS.mysteryKit;
  const WORD = "MATRIX", C = 3, M = 6;
  const close = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
  const samePt = (p, q) => Array.isArray(p) && close(p[0], q[0]) && close(p[1], q[1]);
  const samePixel = (p, q, eps = 1) => Array.isArray(p) && q.every((v, i) => close(p[i], v, eps));
  const frameOf = (w, h, pixels) => { const f = MS.createFrame(w, h); pixels.forEach(([x, y, c]) => MS.setPixel(f, x, y, c)); return f; };
  const filled = (w, h, color) => { const f = MS.createFrame(w, h); MS.clearFrame(f, color); return f; };
  const MATS = [[1.5, 0, 0, 0.5, -3, 2], [0, 2, -1, 0, 4, 4], [1, 0.5, -0.25, 1, 0, -6], [-2, 1, 3, 1.5, 7, -1], [0.8, -0.6, 0.6, 0.8, 10, 20]];
  const POINTS = [[0, 0], [3, -2], [-1.5, 4], [10, 7]];

  // One entry per letter: { rule, probes }, where each probe is () => true when
  // the learner's functions get that rule right.
  const RULES = [
    { // M: where a matrix moves a point
      rule: "a matrix [a, b, c, d, e, f] moves (x, y) to (a·x + c·y + e, b·x + d·y + f); scale with one number scales both directions; a positive rotation turns +x toward +y",
      probes: [
        () => samePt(MS.transformPoint([1, 2, 3, 4, 5, 6], 1, 1), [9, 12]),
        () => samePt(MS.transformPoint(MS.translate(-4, 2.5), 1, 1), [-3, 3.5]),
        () => samePt(MS.transformPoint(MS.scale(1.5), -2, 4), [-3, 6]),
        () => samePt(MS.transformPoint(MS.scale(2, -1), 3, 3), [6, -3]),
        () => samePt(MS.transformPoint(MS.rotate(Math.PI), 2, 1), [-2, -1]),
        () => samePt(MS.transformPoint(MS.rotate(-Math.PI / 2), 0, 3), [3, 0]),
        () => samePt(MS.transformPoint(MS.rotate(Math.PI / 2), 4, 0), [0, 4]),
      ],
    },
    { // A: multiply's order
      rule: "multiply(m, n) should move a point exactly as moving it with n, then with m, does",
      probes: MATS.flatMap((m, i) => POINTS.map(([x, y], j) => () => {
        const n = MATS[(i + j + 1) % MATS.length], [nx, ny] = MS.transformPoint(n, x, y);
        return samePt(MS.transformPoint(MS.multiply(m, n), x, y), MS.transformPoint(m, nx, ny));
      })),
    },
    { // T: undoing a matrix
      rule: "invert(m) should move every point that m moved back to where it started, and give null for a matrix with a·d − b·c = 0",
      probes: [
        ...MATS.flatMap(m => POINTS.slice(1).map(([x, y]) => () => { const [u, v] = MS.transformPoint(m, x, y); return samePt(MS.transformPoint(MS.invert(m), u, v), [x, y]); })),
        () => MS.invert([2, 1, 4, 2, 5, 5]) === null,
        () => MS.invert(MS.scale(1, 0)) === null,
      ],
    },
    { // R: which source pixel lands where
      rule: "drawTransformed should color each destination pixel from the source point that m moves onto that pixel's center (x + 0.5, y + 0.5)",
      probes: (() => {
        const RED = [220, 30, 30, 255], GRN = [30, 200, 60, 255], BLU = [40, 60, 230, 255], YEL = [240, 220, 20, 255], CYN = [20, 200, 210, 255], MAG = [210, 40, 200, 255];
        const src = () => frameOf(3, 2, [[0, 0, RED], [1, 0, GRN], [2, 0, BLU], [0, 1, YEL], [1, 1, CYN], [2, 1, MAG]]);
        const cases = [
          // a quarter turn: src's 3 × 2 becomes 2 × 3
          { m: () => MS.multiply(MS.translate(2, 0), MS.rotate(Math.PI / 2)), w: 2, h: 3, want: [[1, 0, RED], [1, 1, GRN], [1, 2, BLU], [0, 0, YEL], [0, 1, CYN], [0, 2, MAG]] },
          // upside down
          { m: () => MS.multiply(MS.translate(3, 2), MS.rotate(Math.PI)), w: 3, h: 2, want: [[2, 1, RED], [1, 1, GRN], [0, 1, BLU], [2, 0, YEL], [1, 0, CYN], [0, 0, MAG]] },
          // twice as big: no dest center lands on a src center, so every pixel is a bilinear mix (the last two are partly off its edge)
          { m: () => MS.multiply(MS.translate(1, 1), MS.scale(2)), w: 8, h: 6, want: [[2, 2, [176, 108, 45, 255]], [3, 2, [77, 169, 80, 255]], [5, 2, [69, 91, 191, 255]], [2, 3, [182, 179, 60, 255]], [4, 4, [68, 160, 208, 191]], [6, 4, [210, 40, 200, 143]]] },
        ];
        return cases.flatMap(c => c.want.map(([x, y, color]) => () => {
          const dest = MS.createFrame(c.w, c.h);
          MS.drawTransformed(dest, src(), c.m());
          return samePixel(MS.getPixel(dest, x, y), color);
        }));
      })(),
    },
    { // I: soft edges and opacity
      rule: "where a sprite only partly covers a pixel it should fade without darkening, and opacity scales the sprite's alpha before it's blended",
      probes: [
        () => { const d = MS.createFrame(6, 3); MS.drawTransformed(d, filled(3, 1, [255, 255, 255]), MS.translate(1.5, 1)); return samePixel(MS.getPixel(d, 1, 1), [255, 255, 255, 128]); },
        () => { const d = MS.createFrame(6, 3); MS.drawTransformed(d, filled(3, 1, [255, 255, 255]), MS.translate(1.5, 1)); return samePixel(MS.getPixel(d, 4, 1), [255, 255, 255, 128]); },
        () => { const d = MS.createFrame(3, 6); MS.drawTransformed(d, filled(1, 2, [255, 200, 0]), MS.translate(1, 2.25)); return samePixel(MS.getPixel(d, 1, 2), [255, 200, 0, 191]); },
        () => {
          const d = filled(3, 3, [20, 40, 120]), want = filled(3, 3, [20, 40, 120]);
          MS.drawTransformed(d, filled(1, 1, [250, 250, 250]), MS.translate(1, 1), 0.4);
          MS.blendPixel(want, 1, 1, [250, 250, 250, 102]);
          return samePixel(MS.getPixel(d, 1, 1), MS.getPixel(want, 1, 1));
        },
        () => { const d = filled(3, 3, [20, 40, 120]); MS.drawTransformed(d, filled(1, 1, [250, 250, 250]), MS.translate(1, 1), 0.4); return samePixel(MS.getPixel(d, 0, 1), [20, 40, 120, 255], 0); },
      ],
    },
    { // X: blur
      rule: "blur(σ) is three box blurs of radius round((√(1 + 4σ²) − 1) ÷ 2); each box blur averages premultiplied colors, counts pixels outside the frame as transparent, and returns a new frame",
      probes: (() => {
        const art = () => { const f = MS.createFrame(11, 7); MS.fillRect(f, 3, 2, 3, 3, [255, 80, 0]); MS.setPixel(f, 8, 4, [80, 200, 255, 160]); return f; };
        const three = (f, r) => MS.boxBlur(MS.boxBlur(MS.boxBlur(f, r), r), r);
        const same = (a, b) => a.data.length === b.data.length && a.data.every((v, i) => v === b.data[i]);
        return [
          () => same(MS.blur(art(), 1.1), three(art(), 1)),
          () => same(MS.blur(art(), 1.6), three(art(), 1)),
          () => same(MS.blur(art(), 2.2), three(art(), 2)),
          () => same(MS.blur(art(), 3.3), three(art(), 3)),
          () => same(MS.blur(art(), 0.3), art()),
          () => samePixel(MS.getPixel(MS.boxBlur(frameOf(5, 5, [[2, 2, [255, 0, 0]]]), 1), 1, 1).slice(0, 3), [255, 0, 0]),
          () => samePixel(MS.getPixel(MS.boxBlur(filled(4, 4, [0, 255, 0]), 1), 0, 0), [0, 255, 0, 113]),
          () => samePixel(MS.getPixel(MS.boxBlur(filled(4, 4, [0, 255, 0]), 1), 1, 0), [0, 255, 0, 170]),
          () => { const f = art(), before = Array.from(f.data); MS.blur(f, 2); MS.boxBlur(f, 1); return f.data.every((v, i) => v === before[i]); },
        ];
      })(),
    },
  ];

  const ITALIC = [1, 0, -0.25, 1, 6, 0];   // the word leans right: a shear, then a nudge
  const OFFSETS = [];
  for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) if (Math.abs(dx) + Math.abs(dy) >= 7) OFFSETS.push([dx, dy]);
  shuffle(OFFSETS, 7);
  const px = v => Math.floor(v + 0.5 + 1e-7);
  const STOPS = [[255, 92, 138], [91, 140, 255], [234, 240, 250]];

  MS.mystery("07", {
    draw() {
      const W = M * 2 + (WORD.length * 6 - 1) * C + 6, H = M * 2 + 7 * C;
      const frame = MS.createFrame(W, H);
      MS.clearFrame(frame, [11, 13, 18]);
      const wrong = WORD.split("").map(() => new Set()), failed = [];
      let dot = 0;
      [...WORD].forEach((ch, j) => {
        const color = MS.interpolateColors(j, [0, 2.5, 5], STOPS), rules = RULES[j];
        // Dot k asks probes k, k + dots, k + 2 × dots...; with fewer probes than dots, they repeat.
        const n = rules.probes.length, dots = MS.FONT_5x7[ch].join("").split("").filter(cell => cell === "#").length;
        let k = 0;
        MS.FONT_5x7[ch].forEach((row, r) => [...row].forEach((cell, c) => {
          if (cell !== "#") return;
          const gx = M + (j * 6 + c) * C, gy = M + r * C, o = OFFSETS[dot++ % OFFSETS.length];
          const mine = n >= dots ? rules.probes.filter((p, i) => i % dots === k) : [rules.probes[k % n]];
          let right = false;
          try { right = mine.every(p => p() === true); } catch (e) { failed.push(`the ${ch}: ${e.message}`); }
          if (!right) wrong[j].add(rules.rule);
          k++;
          const P = right ? [gx, gy] : [gx + o[0], gy + o[1]];
          let at = P;
          try { const q = MS.transformPoint(ITALIC, P[0], P[1]); at = [px(q[0]), px(q[1])]; } catch (e) { failed.push(`leaning the word: ${e.message}`); }
          MS.fillRect(frame, at[0], at[1], C, C, color);
        }));
      });
      return { frame, wrong: wrong.map(s => s.size), failed: [...new Set(failed)] };
    },
    check({ frame, wrong, failed }, data) {
      const hints = failed.map(msg => `Part of the picture couldn't be drawn (${msg}).`);
      wrong.forEach((n, j) => { if (n) hints.push(`Some dots of the ${WORD[j]} flew off: ${RULES[j].rule}.`); });
      const ok = MS.hashFrame(frame) === data.mystery;
      return { wrong: ok ? 0 : 1, hints };
    },
  });
})(globalThis.MS = globalThis.MS || {});
