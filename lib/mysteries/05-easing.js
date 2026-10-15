// lib/mysteries/05-easing.js — layer 05's checkpoint picture. PROVIDED.
// A freeze-frame: every dot is flying from a scattered start, each on its own
// easing curve, caught at the instant when, if every curve is right, they all
// line up into a word. Each letter's dots ride one kind of tricky curve.
// draw() runs the learner's functions; check() says which rule went wrong,
// never how to fix it. See lib/checkpoint.js for how a checkpoint runs.
(function (MS) {
  const { shuffle } = MS.mysteryKit;
  const WORD = "BEZIER", C = 3, M = 5;
  // One family of curves per letter. Each dot gets a curve [x1, y1, x2, y2] and
  // a point on it, u (or, for the last letter, an x outside the curve).
  const FAMILIES = [
    { trap: "everyday", curves: [[0.25, 0.1, 0.25, 1], [0.16, 1, 0.3, 1], [0.6, 0, 0.2, 1], [0.42, 0, 0.58, 1]], us: [0.2, 0.33, 0.47, 0.6, 0.73] },
    { trap: "flat start", curves: [[0, 0.6, 0.4, 1], [0, 0.8, 0.6, 1], [0, 0.5, 0.25, 1]], us: [0.03, 0.06, 0.1, 0.16] },
    { trap: "flat middle", curves: [[1, 0, 0, 1], [1, 0.2, 0, 0.8], [0.95, 0.05, 0.05, 0.95]], us: [0.3, 0.38, 0.44, 0.56, 0.62] },
    { trap: "overshoot", curves: [[0.34, 1.56, 0.64, 1], [0.7, -0.4, 0.4, 1.4], [0.5, -0.5, 0.5, 1.5]], us: [0.5, 0.65, 0.8, 0.92] },
    { trap: "flat end", curves: [[0.42, 0, 1, 1], [0.6, 0.2, 1, 0.8], [0.3, 0.1, 1, 0.6]], us: [0.75, 0.84, 0.9, 0.95] },
    { trap: "outside", curves: [[0.25, 0.1, 0.25, 1], [0.16, 1, 0.3, 1]], xs: [-0.6, 1.25, -0.2, 2, 0, 1] },
  ];
  // Where each dot starts, relative to the spot where it should be caught.
  const OFFSETS = [];
  for (let dy = -12; dy <= 12; dy++) for (let dx = -12; dx <= 12; dx++) if (Math.abs(dx) + Math.abs(dy) >= 8) OFFSETS.push([dx, dy]);
  shuffle(OFFSETS, 5);
  const px = v => Math.floor(v + 0.5 + 1e-7);
  const STOPS = [[255, 92, 138], [91, 140, 255], [234, 240, 250]];

  MS.mystery("05", {
    draw() {
      const W = M * 2 + (WORD.length * 6 - 1) * C, H = M * 2 + 7 * C;
      const frame = MS.createFrame(W, H);
      MS.clearFrame(frame, [11, 13, 18]);
      const scattered = WORD.split("").map(() => 0), failed = [];
      let dot = 0;
      [...WORD].forEach((ch, j) => {
        const fam = FAMILIES[j], color = MS.interpolateColors(j, [0, 2.5, 5], STOPS);
        const eases = fam.curves.map(c => { try { return MS.cubicBezier(...c); } catch (e) { failed.push(`cubicBezier(${c.join(", ")}) threw "${e.message}"`); return null; } });
        let k = 0;
        MS.FONT_5x7[ch].forEach((row, r) => [...row].forEach((cell, c) => {
          if (cell !== "#") return;
          const P = [M + (j * 6 + c) * C, M + r * C], o = OFFSETS[dot++ % OFFSETS.length];
          const ci = k % fam.curves.length, [x1, y1, x2, y2] = fam.curves[ci];
          let x, y;
          if (fam.xs) { x = fam.xs[k % fam.xs.length]; y = x <= 0 ? 0 : 1; }
          else { const u = fam.us[k % fam.us.length]; x = MS.bezierPoint(x1, x2, u); y = MS.bezierPoint(y1, y2, u); }
          k++;
          // Start A and end B are chosen so that at progress y the dot is exactly at P.
          let A, B;
          if (y === 0) { A = P; B = [P[0] + o[0], P[1] + o[1]]; }
          else { A = [P[0] + o[0], P[1] + o[1]]; B = [P[0] + o[0] - o[0] / y, P[1] + o[1] - o[1] / y]; }
          let got = NaN;
          try { if (eases[ci]) got = eases[ci](x); } catch (e) { failed.push(`easing ${ci + 1} of the ${ch} threw "${e.message}" at x = ${x}`); }
          const at = [px(A[0] + (B[0] - A[0]) * got), px(A[1] + (B[1] - A[1]) * got)];
          if (at[0] !== P[0] || at[1] !== P[1]) scattered[j]++;
          if (Number.isFinite(at[0]) && Number.isFinite(at[1])) MS.fillRect(frame, at[0], at[1], C, C, color);
        }));
      });
      return { frame, scattered, failed: [...new Set(failed)] };
    },
    check({ frame, scattered, failed }, data) {
      const hints = failed.map(msg => `${msg}. x1 and x2 may be anything from 0 to 1, including exactly 0 or 1.`);
      const why = [
        "The B is scattered. Its dots ride everyday curves like CSS ease. An easing's input is x, the time, not the curve's parameter u: y is read off the curve at the u whose x matches.",
        "The first E is scattered. Its curves start flat (x1 = 0), so near the start x barely changes as u grows. Your solver has to find u there too.",
        "The Z is scattered. Its curves go flat in the middle (x1 = 1, x2 = 0), where the slope is 0. A step that divides by the slope can't be trusted there.",
        "The I is scattered. Its curves overshoot: y goes above 1 or below 0, and an easing function returns those values as they are.",
        "The second E is scattered. Its curves end flat (x2 = 1), so near the end x barely changes as u grows. Your solver has to find u there too.",
        "The R is scattered. Its dots ask for x below 0 or above 1. Clamp x to 0–1 first: anything up to 0 gives exactly 0, anything from 1 up gives exactly 1.",
      ];
      scattered.forEach((n, j) => { if (n) hints.push(`${why[j]} (${n} dot${n === 1 ? "" : "s"} off.)`); });
      const ok = MS.hashFrame(frame) === data.mystery;
      return { wrong: ok ? 0 : 1, hints };
    },
  });
})(globalThis.MS = globalThis.MS || {});
