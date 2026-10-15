// lib/mysteries/09-kinetic-intro.js — layer 09's checkpoint picture. PROVIDED.
// A word made of dots. Every dot asks one small question about a piece of
// KineticIntro (a scene's timing, the mask, the gradient angle, overlay, the
// background and vignette, the layers, the whole composition). A dot that
// gets a wrong answer flies off its letter. Every rule right spells a word.
// Text is drawn with the bitmap font here, so the picture is the same on every
// computer, whatever fonts it has.
// draw() runs the learner's functions; check() says which rule went wrong,
// never how to fix it. See lib/checkpoint.js for how a checkpoint runs.
(function (MS) {
  const { shuffle } = MS.mysteryKit;
  const WORD = "KINETIC", C = 3, M = 6;
  const close = (a, b, eps) => typeof a === "number" && Math.abs(a - b) <= eps;
  const samePixel = (p, q, eps = 1) => Array.isArray(p) && q.every((v, i) => close(p[i], v, eps));
  const bitmapOnly = fn => { const real = MS.createCanvas; MS.createCanvas = () => null; try { return fn(); } finally { MS.createCanvas = real; } };
  const scene = (n, o, want) => { const s = MS.sceneState(n, o); return s && s.visible === want[0] && close(s.scale, want[1], 1e-6) && close(s.opacity, want[2], 1e-6) && close(s.blur, want[3], 1e-6); };
  const W0 = { a: 0, b: 48, enterFrom: 0.8, exitTo: 1.5, blurIn: 14, blurOut: 16 }, LOCK = { a: 120, b: 180, enterFrom: 0.86, exitTo: 1, blurIn: 14, exitDur: 2 };
  const ODD = { a: 5, b: 30, enterDur: 10, exitDur: 5, pushTo: 1.2, enterFrom: 0.5, exitTo: 2, blurIn: 4, blurOut: 6 };
  const overlay = (bg, c) => { const f = MS.createFrame(1, 1); MS.setPixel(f, 0, 0, bg); MS.blendOverlay(f, 0, 0, c); return MS.getPixel(f, 0, 0); };
  const sum = (f, from = 0) => { let s = 0; for (let i = from * 4 + 3; i < f.data.length; i += 4) s += f.data[i]; return s; };
  const layerOk = (layer, n, opts, width) => {
    const s = MS.sceneState(n, opts), k = width / 1080, H = Math.round((width * 16) / 9);
    if (!layer || !layer.sprite) return false;
    const [cx, cy] = MS.transformPoint(layer.matrix, layer.sprite.width / 2, layer.sprite.height / 2);
    const [ex] = MS.transformPoint(layer.matrix, layer.sprite.width / 2 + 1, layer.sprite.height / 2);
    return close(layer.opacity, s.opacity, 1e-9) && close(layer.blur, s.blur * k, 1e-9) && close(cx, width / 2, 1e-6) && close(cy, H / 2, 1e-6) && close(ex - cx, s.scale, 1e-6);
  };
  const byHand = (n, width) => {
    const H = Math.round((width * 16) / 9), k = width / 1080, f = MS.background(width, H);
    const layers = [0, 1, 2].map(i => MS.wordLayer(n, i, width)).concat([MS.lockupLayer(n, width), { sprite: MS.vignette(width, H, 280 * k, 0.7) }]);
    return MS.renderLayers(f, layers.filter(Boolean));
  };

  const RULES = [
    { // K: scene timing
      rule: "a scene enters over enterDur frames along APPLE, pushes in steadily from a to b, exits over exitDur frames along SMOOTH, is visible from a − 2 to b + 2, and calls a blur of 0.15 or less no blur",
      probes: [
        () => scene(3, W0, [true, 0.911684015, 0.547052442, 6.34126581]), () => scene(20, W0, [true, 1.016305208, 0.998222335, 0]),
        () => scene(40, W0, [true, 1.492072185, 0.112118352, 14.206106368]), () => scene(-2, W0, [true, 0.8, 0, 14]),
        () => scene(125, LOCK, [true, 0.966568982, 0.738269926, 3.664221036]), () => scene(179, LOCK, [true, 1.039333333, 0.29531467, 8.456223962]),
        () => scene(182, LOCK, [true, 1.04, 0, 12]), () => scene(150, LOCK, [true, 1.02, 1, 0]),
        () => scene(7, ODD, [true, 0.890080044, 0.752126072, 0.991495713]), () => scene(27, ODD, [true, 1.66421663, 0.584849804, 2.490901175]),
        () => MS.sceneState(183, LOCK).visible === false && MS.sceneState(-3, W0).visible === false,
        () => scene(10, { a: 0, b: 20, enterFrom: 0.5, exitTo: 2, blurIn: 4, blurOut: 6 }, [true, 1.759664865, 0.214712778, 4.981150411]),
        () => scene(9, { a: 3, b: 18, enterFrom: 0.9, exitTo: 1.2, blurIn: 2, blurOut: 3, enterDur: 12, exitDur: 12 }, [true, 1.032551009, 0.904167288, 0.343939924]),
      ],
    },
    { // I: the mask
      rule: "maskUp goes from 110 at frame `at` to 0 at frame at + dur along APPLE, clamped at both ends, and dur is 22 when it isn't given",
      probes: [
        () => close(MS.maskUp(84, 82), 59.340401118, 1e-6), () => close(MS.maskUp(90, 82), 8.614393439, 1e-6),
        () => close(MS.maskUp(104, 82), 0, 1e-9), () => close(MS.maskUp(3, 0, 6), 3.104298421, 1e-6),
        () => close(MS.maskUp(1, 0, 6), 34.537026275, 1e-6), () => close(MS.maskUp(70, 82), 110, 1e-9), () => close(MS.maskUp(200, 82), 0, 1e-9),
      ],
    },
    { // N: the gradient line
      rule: "a CSS gradient angle points clockwise from straight up, and its gradient line runs through the box's center, just long enough to reach the corners",
      probes: [
        () => close(MS.linearGradientT(0, 50, 100, 50, 270), 1, 1e-9), () => close(MS.linearGradientT(10, 40, 80, 60, 135), 0.357142857, 1e-6),
        () => close(MS.linearGradientT(60, 5, 120, 30, 30), 0.60072316, 1e-6), () => close(MS.linearGradientT(75, 12, 150, 24, 100), 0.5, 1e-9),
        () => close(MS.linearGradientT(0, 0, 64, 64, 225), 0.5, 1e-9), () => close(MS.linearGradientT(64, 0, 64, 64, 45), 1, 1e-9),
      ],
    },
    { // E: overlay
      rule: "overlay multiplies where the backdrop is dark and screens where it's light, and mixes with ordinary blending where either is transparent",
      probes: [
        () => samePixel(overlay([30, 200, 128], [255, 255, 255, 64]), [38, 214, 160, 255]),
        () => samePixel(overlay([240, 10, 90], [20, 220, 160, 255]), [227, 17, 113, 255]),
        () => samePixel(overlay([90, 90, 90, 60], [255, 0, 0, 100]), [198, 24, 24, 136]),
        () => samePixel(overlay([0, 0, 0, 0], [12, 34, 56, 0]), [0, 0, 0, 0], 0),
      ],
    },
    { // T: background and vignette
      rule: "the background is KineticIntro's two radial gradients (radii as fractions of width and height, the glow gone at 60%), and the vignette is an inset shadow: σ is half the blur radius",
      probes: (() => {
        const bgAt = (x, y, want) => () => samePixel(MS.getPixel(MS.background(90, 160), x, y), want);
        const vigAt = (x, y, want) => () => samePixel(MS.getPixel(MS.vignette(90, 160, 20, 0.5), x, y), want, 2);
        return [
          bgAt(45, 60, [36, 54, 93, 255]), bgAt(5, 5, [13, 17, 25, 255]), bgAt(80, 150, [11, 13, 18, 255]), bgAt(45, 72, [38, 58, 100, 255]), bgAt(70, 40, [19, 27, 43, 255]),
          vigAt(0, 0, [0, 0, 0, 94]), vigAt(45, 80, [0, 0, 0, 0]), vigAt(0, 80, [0, 0, 0, 62]), vigAt(5, 30, [0, 0, 0, 40]), vigAt(89, 159, [0, 0, 0, 94]),
        ];
      })(),
    },
    { // I: the layers
      rule: "each word and the lockup is one layer while its scene is visible (null otherwise), scaled by the scene around its center in the middle of the frame, with the scene's opacity, a blur scaled by width ÷ 1080, padding for the blur, and a mask that hides the word until it rises; the lockup's sweep is overlaid, not blended normally, and its subtitle fades in",
      probes: [
        () => MS.wordLayer(131, 2, 108) === null && MS.wordLayer(77, 2, 108) === null && MS.wordLayer(78, 2, 108) !== null && MS.lockupLayer(117, 108) === null,
        () => bitmapOnly(() => layerOk(MS.wordLayer(5, 0, 108), 5, W0, 108)),
        () => bitmapOnly(() => layerOk(MS.wordLayer(126, 2, 324), 126, { a: 80, b: 128, enterFrom: 0.8, exitTo: 1.5, blurIn: 14, blurOut: 16 }, 324)),
        () => bitmapOnly(() => layerOk(MS.lockupLayer(130, 108), 130, LOCK, 108)),
        () => bitmapOnly(() => layerOk(MS.lockupLayer(179, 270), 179, LOCK, 270)),
        () => bitmapOnly(() => { const l = MS.wordLayer(82, 2, 108), t = MS.textSprite("RENDER.", { size: 15, weight: 900, family: "Inter" }), pad = Math.ceil(3 * 16 * 0.1) + 2;
          return l.sprite.width === t.width + 2 * pad && l.sprite.height === t.height + 2 * pad && sum(l.sprite) === 0; }),
        () => bitmapOnly(() => sum(MS.wordLayer(100, 2, 108).sprite) > 0),
        () => bitmapOnly(() => { const a = MS.lockupLayer(149, 108).sprite, b = MS.lockupLayer(160, 108).sprite; return sum(a) < sum(b); }),
        () => bitmapOnly(() => samePixel(MS.getPixel(MS.lockupLayer(154, 216).sprite, 86, 19), [125, 183, 255, 255])),
      ],
    },
    { // C: the composition
      rule: "kineticIntro is 30 fps, 180 frames, width × 16 ÷ 9 high (rounded), and each frame is the background, then the words, the lockup and the vignette drawn with renderLayers",
      probes: [
        () => { const c = MS.kineticIntro(90); return c.width === 90 && c.height === 160 && c.fps === 30 && c.durationInFrames === 180; },
        () => { const c = MS.kineticIntro(99); return c.height === 176; },
        ...[22, 75, 158].map(n => () => bitmapOnly(() => {
          const got = MS.renderFrame(MS.kineticIntro(108), n), want = byHand(n, 108);
          return got.data.every((v, i) => Math.abs(v - want.data[i]) <= 1);
        })),
      ],
    },
  ];

  const OFFSETS = [];
  for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) if (Math.abs(dx) + Math.abs(dy) >= 7) OFFSETS.push([dx, dy]);
  shuffle(OFFSETS, 9);
  const STOPS = [[255, 92, 138], [91, 140, 255], [234, 240, 250]];

  MS.mystery("09", {
    draw() {
      const W = M * 2 + (WORD.length * 6 - 1) * C, H = M * 2 + 7 * C;
      const frame = MS.createFrame(W, H);
      MS.clearFrame(frame, [11, 13, 18]);
      const wrong = WORD.split("").map(() => 0), failed = [];
      let dot = 0;
      [...WORD].forEach((ch, j) => {
        const color = MS.interpolateColors(j, [0, 3, 6], STOPS), rules = RULES[j];
        // Dot k asks probes k, k + dots, k + 2 × dots...; with fewer probes than dots, they repeat.
        const n = rules.probes.length, dots = MS.FONT_5x7[ch].join("").split("").filter(cell => cell === "#").length;
        let k = 0;
        MS.FONT_5x7[ch].forEach((row, r) => [...row].forEach((cell, c) => {
          if (cell !== "#") return;
          const gx = M + (j * 6 + c) * C, gy = M + r * C, o = OFFSETS[dot++ % OFFSETS.length];
          const mine = n >= dots ? rules.probes.filter((p, i) => i % dots === k) : [rules.probes[k % n]];
          let right = false;
          try { right = mine.every(p => p() === true); } catch (e) { failed.push(`the ${ch}: ${e.message}`); }
          if (!right) wrong[j]++;
          k++;
          MS.fillRect(frame, right ? gx : gx + o[0], right ? gy : gy + o[1], C, C, color);
        }));
      });
      return { frame, wrong, failed: [...new Set(failed)] };
    },
    check({ frame, wrong, failed }, data) {
      const hints = failed.map(msg => `Part of the picture couldn't be drawn (${msg}).`);
      const names = ["K", "first I", "N", "E", "T", "second I", "C"];
      wrong.forEach((n, j) => { if (n) hints.push(`Some dots of the ${names[j]} flew off: ${RULES[j].rule}.`); });
      const ok = MS.hashFrame(frame) === data.mystery;
      return { wrong: ok ? 0 : 1, hints };
    },
  });
})(globalThis.MS = globalThis.MS || {});
