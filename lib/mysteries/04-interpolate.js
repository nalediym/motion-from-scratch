// lib/mysteries/04-interpolate.js — layer 04's checkpoint picture. PROVIDED.
// A long-exposure photo of one light moved by your interpolate: every stroke
// is a keyframed move, and the light changes color as it travels. Every rule
// right writes a word, underlined with eased, fading dots.
// draw() runs the learner's functions; check() says which rule went wrong,
// never how to fix it. See lib/checkpoint.js for how a checkpoint runs.
(function (MS) {
  const M = 6, TOP = 6, LEFT = [6, 26, 48, 68, 88];   // each letter's left edge
  const W = 108, H = TOP + 18 + 5 + 2 + M;
  const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
  // One light on one timeline. Each stroke: keyframe times, the light's x and y
  // at each keyframe (inside its letter's box, 16 pixels tall), and when the light is on.
  const STROKES = [
    { letter: 0, keys: [0, 6], xs: [0, 12], ys: [0, 0], on: [0, 6] },
    { letter: 0, keys: [10, 12, 16], xs: [6, 6, 6], ys: [4, 6, 16], on: [6, 16] },                 // on before its first keyframe
    { letter: 1, keys: [20, 23, 25, 29, 30], xs: [0, 4, 8, 12, 16], ys: [0, 16, 5, 16, 0], on: [20, 30] },
    { letter: 2, keys: [34, 38, 42, 46], xs: [12, 0, 0, 12], ys: [0, 0, 16, 16], on: [32, 48], opts: CLAMP },   // on longer than its keyframes
    { letter: 2, keys: [50, 52], xs: [0, 9], ys: [8, 8], on: [50, 52] },
    { letter: 3, keys: [56, 60, 62, 65, 68, 70, 74], xs: [12, 0, 0, 9, 0, 0, 12], ys: [0, 0, 8, 8, 8, 16, 16], on: [56, 74] },
    { letter: 4, keys: [78, 83, 84, 89], xs: [0, 0, 12, 12], ys: [16, 0, 16, 0], on: [78, 89] },
  ];
  const GLOW = { keys: [0, 45, 90], colors: [[255, 92, 138], [91, 140, 255], [234, 240, 250]] };   // the light's color over time
  const FADE = [[234, 240, 250, 255], [90, 144, 250, 39]];                                        // the underline fades out
  const px = v => Math.floor(v + 0.5 + 1e-7);   // nearest whole pixel; halves go right, whatever the last bit of rounding error

  MS.mystery("04", {
    draw() {
      const frame = MS.createFrame(W, H);
      MS.clearFrame(frame, [11, 13, 18]);
      const failed = [];
      STROKES.forEach((st, i) => {
        try {
          const x0 = LEFT[st.letter];
          for (let k = 0; k <= (st.on[1] - st.on[0]) * 8; k++) {   // the shutter catches the light 8 times per time unit
            const s = st.on[0] + k / 8;
            const color = MS.interpolateColors(Math.floor(s), GLOW.keys, GLOW.colors);
            MS.fillRect(frame, x0 + px(MS.interpolate(s, st.keys, st.xs, st.opts)), TOP + px(MS.interpolate(s, st.keys, st.ys, st.opts)), 2, 2, color);
          }
        } catch (e) { failed.push(`stroke ${i + 1}: ${e.message}`); }
      });
      try {
        for (let k = 0; k <= 12; k++)
          MS.fillRect(frame, px(MS.interpolate(k, [0, 4, 12], [M, 38, W - M - 2], { easing: t => t * t })), TOP + 23, 2, 2, MS.interpolateColors(k, [0, 12], FADE));
      } catch (e) { failed.push(`the underline: ${e.message}`); }
      return { frame, failed };
    },
    check({ frame, failed }, data) {
      const hints = failed.map(msg => `Part of the picture couldn't be drawn (${msg}).`);
      // Small probes, one per rule, on a range with uneven keyframes.
      const R = [0, 4, 5, 10], V = [5, 40, 50, 0];
      const run = fn => { try { return fn(); } catch (e) { return NaN; } };
      const near = (got, want) => Array.isArray(want)
        ? Array.isArray(got) && got.length === want.length && want.every((w, i) => Math.abs(got[i] - w) < 1e-6)
        : Math.abs(got - want) < 1e-6;
      if (!near([1, 4.5, 6, 9].map(x => run(() => MS.interpolate(x, R, V))), [13.75, 45, 40, 10]))
        hints.push("Some letters are bent out of shape. Keyframes don't have to be evenly spaced: the segment an input falls in depends on the keyframe times themselves.");
      if (!near(run(() => MS.interpolate(-2, R, V)), -12.5))
        hints.push("The T's stem is wrong at the top. Its light switches on before the first keyframe, and before the first keyframe \"extend\" carries on along the FIRST segment's line.");
      if (!near(run(() => MS.interpolate(12, R, V, { extrapolateRight: "clamp" })), 0) || !near(run(() => MS.interpolate(-3, R, V, { extrapolateLeft: "clamp" })), 5))
        hints.push("The first E's light stays on longer than its keyframes, clamped at both ends. Clamping holds the value of the very first or very last keyframe, however many keyframes there are.");
      if (!near(run(() => MS.interpolate(7.5, R, V, { easing: t => t * t })), 37.5))
        hints.push("The dots under the word should bunch up at the start of each segment. Easing reshapes t, the progress through the segment the input is in.");
      if (!near(run(() => MS.interpolateColors(0.25, [0, 1], [[0, 0, 0, 0], [0, 0, 0, 200]])), [0, 0, 0, 50]))
        hints.push("The dots under the word should fade out. Alpha is interpolated just like red, green and blue.");
      const ok = MS.hashFrame(frame) === data.mystery;
      return { wrong: ok ? 0 : 1, hints };
    },
  });
})(globalThis.MS = globalThis.MS || {});
