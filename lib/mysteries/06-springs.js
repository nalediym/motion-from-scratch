// lib/mysteries/06-springs.js — layer 06's checkpoint picture. PROVIDED.
// A freeze-frame of dots on springs. Each dot's spring is worked out twice, in
// two ways that must agree (defaults written out or left out, falling or
// rising, 60 fps or 30 fps...). Where your two answers agree, the dot lands on
// its letter. Every rule right spells a word.
// draw() runs the learner's functions; check() says which rule went wrong,
// never how to fix it. See lib/checkpoint.js for how a checkpoint runs.
(function (MS) {
  const { shuffle } = MS.mysteryKit;
  const WORD = "SPRING", C = 3, M = 5;
  const sp = (frame, fps, extra) => MS.spring({ frame, fps, ...extra });
  const FULL = { stiffness: 100, damping: 10, mass: 1 }, QUICK = { stiffness: 260, damping: 14 };
  // Per letter: two ways to get the same progress at frame n (`want` places the dot, `got` moves it).
  const PAIRS = [
    { frames: [3, 5, 7, 9, 12, 16], want: n => sp(n, 30, { config: FULL }), got: n => sp(n, 30) },
    { frames: [3, 6, 9, 13, 18], want: (n, k) => sp(n, 30, { config: k % 2 ? { stiffness: 100, damping: 10, mass: 2 } : { stiffness: 100, damping: 14, mass: 1 } }),
      got: (n, k) => sp(n, 30, { config: k % 2 ? { mass: 2 } : { damping: 14 } }) },
    { frames: [4, 6, 8, 11, 15], want: n => sp(n, 30), got: n => (sp(n, 30, { from: 40, to: 10 }) - 40) / -30 },
    { frames: [2, 3, 5, 7, 10], want: n => sp(n, 30, { config: QUICK }), got: n => sp(2 * n, 60, { config: QUICK }) },
    { frames: [3, 4, 7, 10, 13, 15], want: n => sp(Math.round((1000 * n) / 24), 1000), got: n => sp(n, 24) },
  ];
  // The last letter checks settleFrame on a spring with every option set.
  const SETTLE = { fps: 25, from: 3, to: -2, config: { stiffness: 300, damping: 18 }, threshold: 0.01 }, SETTLES_AT = 13;
  const OFFSETS = [];
  for (let dy = -12; dy <= 12; dy++) for (let dx = -12; dx <= 12; dx++) if (Math.abs(dx) + Math.abs(dy) >= 8) OFFSETS.push([dx, dy]);
  shuffle(OFFSETS, 6);
  const px = v => Math.floor(v + 0.5 + 1e-7);
  const STOPS = [[255, 92, 138], [91, 140, 255], [234, 240, 250]];


  MS.mystery("06", {
    draw() {
      const W = M * 2 + (WORD.length * 6 - 1) * C, H = M * 2 + 7 * C;
      const frame = MS.createFrame(W, H);
      MS.clearFrame(frame, [11, 13, 18]);
      const scattered = WORD.split("").map(() => 0), failed = [];
      let settled = false;
      try { settled = MS.settleFrame(SETTLE) === SETTLES_AT; } catch (e) { failed.push(`settleFrame threw "${e.message}"`); }
      let dot = 0;
      [...WORD].forEach((ch, j) => {
        const color = MS.interpolateColors(j, [0, 2.5, 5], STOPS);
        let k = 0;
        MS.FONT_5x7[ch].forEach((row, r) => [...row].forEach((cell, c) => {
          if (cell !== "#") return;
          const P = [M + (j * 6 + c) * C, M + r * C], o = OFFSETS[dot++ % OFFSETS.length];
          let at = [P[0] + o[0], P[1] + o[1]];
          if (j === 5) { if (settled) at = P; }
          else {
            try {
              const pair = PAIRS[j], n = pair.frames[k % pair.frames.length];
              const want = pair.want(n, k), got = pair.got(n, k);
              const A = [P[0] + o[0], P[1] + o[1]], B = [P[0] + o[0] - o[0] / want, P[1] + o[1] - o[1] / want];
              at = [px(A[0] + (B[0] - A[0]) * got), px(A[1] + (B[1] - A[1]) * got)];
            } catch (e) { failed.push(`the ${ch}: ${e.message}`); at = [NaN, NaN]; }
          }
          k++;
          if (at[0] !== P[0] || at[1] !== P[1]) scattered[j]++;
          if (Number.isFinite(at[0]) && Number.isFinite(at[1])) MS.fillRect(frame, at[0], at[1], C, C, color);
        }));
      });
      return { frame, scattered, failed: [...new Set(failed)] };
    },
    check({ frame, scattered, failed }, data) {
      const hints = failed.map(msg => `Part of the picture couldn't be drawn (${msg}).`);
      const why = [
        "The S is scattered: spring() with no config should behave exactly like spring() with Remotion's defaults written out (stiffness 100, damping 10, mass 1).",
        "The P is scattered: a config that gives only some values, just damping or just mass, takes the defaults for the rest.",
        "The R is scattered: a spring falling from 40 to 10 should move exactly like one rising from 0 to 1, flipped and stretched. Check how from and to are used.",
        "The I is scattered: frame 2n at 60 fps is the same moment as frame n at 30 fps, so it should give the same value.",
        "The N is scattered: at 24 fps, frame n is Math.round(1000 × n ÷ 24) milliseconds in, exactly like that many frames at 1000 fps.",
        "The G is scattered: settleFrame gave the wrong frame for a spring with every option set. It should be the first frame from which spring() stays within threshold × |to − from| of `to`, using the fps, from, to, config and threshold it's given.",
      ];
      scattered.forEach((n, j) => { if (n) hints.push(why[j]); });
      const ok = MS.hashFrame(frame) === data.mystery;
      return { wrong: ok ? 0 : 1, hints };
    },
  });
})(globalThis.MS = globalThis.MS || {});
