// lib/mysteries/08-scenes.js — layer 08's checkpoint picture. PROVIDED.
// A word made of dots, filmed through your own camera. Every dot asks one
// small question about a rule (when a sequence is on, where a series starts,
// where the camera puts things, which random number a seed gives, how layers
// stack, how text is measured). A dot that gets a wrong answer flies off its
// letter. Every rule right spells a word.
// Text is checked on a pretend canvas, so the picture never depends on which
// fonts a computer has.
// draw() runs the learner's functions; check() says which rule went wrong,
// never how to fix it. See lib/checkpoint.js for how a checkpoint runs.
(function (MS) {
  const { shuffle } = MS.mysteryKit;
  const WORD = "SCENES", C = 3, M = 6;
  const close = (a, b, eps = 1e-9) => typeof a === "number" && Math.abs(a - b) <= eps;
  const samePt = (p, q) => Array.isArray(p) && close(p[0], q[0], 1e-6) && close(p[1], q[1], 1e-6);
  const samePixel = (p, q, eps = 1) => Array.isArray(p) && q.every((v, i) => close(p[i], v, eps));
  const filled = (w, h, color) => { const f = MS.createFrame(w, h); MS.clearFrame(f, color); return f; };
  const sameFrame = (a, b) => a && a.data && a.width === b.width && a.height === b.height && a.data.every((v, i) => Math.abs(v - b.data[i]) <= 1);
  const cam = (c, x, y) => MS.transformPoint(MS.camera(c, 100, 60), x, y);

  // A pretend canvas with its own made-up font: 0.5 × size per character plus
  // the letter spacing, ascent 0.75 × size, descent 0.3 × size. Like a real
  // one, it ignores a font it can't parse.
  function fakeCanvas(log) {
    return (width, height) => {
      const s = { font: "10px sans-serif", letterSpacing: "0px", fillStyle: "#000000", textBaseline: "alphabetic", textAlign: "start" };
      const size = () => parseFloat(/(\d+(?:\.\d+)?)px/.exec(s.font)[1]);
      const ctx = {
        get font() { return s.font; }, set font(v) { if (/^(normal|bold|[1-9]00) \d+(\.\d+)?px \S.*$/.test(String(v))) s.font = String(v); },
        get letterSpacing() { return s.letterSpacing; }, set letterSpacing(v) { s.letterSpacing = String(v); },
        get fillStyle() { return s.fillStyle; }, set fillStyle(v) { s.fillStyle = String(v); },
        get textBaseline() { return s.textBaseline; }, set textBaseline(v) { s.textBaseline = String(v); },
        get textAlign() { return s.textAlign; }, set textAlign(v) { s.textAlign = String(v); },
        measureText(text) {
          const z = size(), n = [...String(text)].length;
          return { width: n * (0.5 * z + parseFloat(s.letterSpacing)), fontBoundingBoxAscent: 0.75 * z, fontBoundingBoxDescent: 0.3 * z };
        },
        fillText(text, x, y) { log.push({ canvas: [width, height], text, x, y, ...s }); },
        getImageData(x, y, w, h) { const data = new Uint8ClampedArray(w * h * 4); data.fill(77); return { width: w, height: h, data }; },
      };
      return { width, height, getContext: () => ctx };
    };
  }
  const withCanvas = (factory, fn) => { const real = MS.createCanvas; MS.createCanvas = factory; try { return fn(); } finally { MS.createCanvas = real; } };
  const drawn = opts => { const log = []; MS.drawTextCanvas(fakeCanvas(log)(8, 8).getContext("2d"), "Ok", 1, 2, opts); return log[0] || {}; };
  const sprite = (text, opts) => { const log = []; const f = withCanvas(fakeCanvas(log), () => MS.textSprite(text, opts)); return { f, call: log.find(c => c.text === text) || {} }; };

  const RULES = [
    { // S: sequence
      rule: "sequence(n, from, durationInFrames) counts from 0 at frame `from`, and is null before it and from from + durationInFrames on; with no duration it never ends",
      probes: [
        () => MS.sequence(50, 50, 5) === 0, () => MS.sequence(54, 50, 5) === 4, () => MS.sequence(55, 50, 5) === null,
        () => MS.sequence(49, 50, 5) === null, () => MS.sequence(100, 7) === 93, () => MS.sequence(2, -3, 10) === 5,
        () => MS.sequence(7, -3, 10) === null, () => MS.sequence(0, 0, 1) === 0, () => MS.sequence(1, 0, 1) === null,
      ],
    },
    { // C: camera
      rule: "the camera puts the point it looks at in the middle of the screen, zooms around the middle, and turning the camera turns the world the other way",
      probes: [
        () => samePt(cam({ x: 10, y: 10 }, 10, 10), [50, 30]),
        () => samePt(cam({ x: 10, y: 10, zoom: 4 }, 11, 10), [54, 30]),
        () => samePt(cam({ x: 10, y: 10, rotation: Math.PI }, 12, 10), [48, 30]),
        () => samePt(cam({ x: 10, y: 10, rotation: -Math.PI / 2 }, 11, 10), [50, 31]),
        () => samePt(cam({ x: 10, y: 10, zoom: 2, rotation: Math.PI / 2 }, 10, 12), [54, 30]),
        () => samePt(cam({ x: -5, y: 3, zoom: 0.5 }, 15, 3), [60, 30]),
        () => samePt(cam({}, 0, 0), [50, 30]),
      ],
    },
    { // E: series
      rule: "in a series each sequence starts where the one before it ends, moved by its offset, and an offset moves every sequence after it too",
      probes: [
        () => JSON.stringify(MS.series([{ durationInFrames: 10 }, { durationInFrames: 10 }]).map(s => s.from)) === "[0,10]",
        () => JSON.stringify(MS.series([{ durationInFrames: 20 }, { durationInFrames: 5, offset: -5 }, { durationInFrames: 5 }]).map(s => s.from)) === "[0,15,20]",
        () => JSON.stringify(MS.series([{ durationInFrames: 5, offset: 3 }, { durationInFrames: 4 }]).map(s => s.from)) === "[3,8]",
        () => JSON.stringify(MS.series([{ durationInFrames: 6 }, { durationInFrames: 9, offset: 2 }]).map(s => s.durationInFrames)) === "[6,9]",
        () => { const items = [{ durationInFrames: 3 }]; MS.series(items); return items[0].from === undefined; },
        () => MS.series([]).length === 0,
      ],
    },
    { // N: random
      rule: "random(seed) should give exactly Remotion's number (and random(null) a really random one): strings are hashed with 32-bit integer math at every step, numbers are multiplied by 10000000000, and mulberry32 does all its multiplying 32 bits at a time",
      probes: [
        () => MS.random("a") === 0.5655837582889944, () => MS.random("seed-42") === 0.013173656072467566, () => MS.random("é") === 0.29089684784412384,
        () => MS.random(7) === 0.21941731218248606, () => MS.random(-0.25) === 0.1771750277839601, () => MS.mulberry32(0) === 0.26642920868471265,
        () => MS.mulberry32(2 ** 31) === 0.8205775609239936, () => MS.mulberry32(123456789) === 0.2577907438389957,
        () => MS.random("a") === MS.random("a"), () => MS.random("a-very-long-seed-string-for-stars") === 0.920754294609651,
        () => new Set([1, 2, 3, 4].map(() => MS.random(null))).size > 1,
      ],
    },
    { // E: layers
      rule: "renderLayers draws its layers in order, later ones on top; it blurs a sprite before the matrix moves it, fades it by its opacity, keeps everything outside a clip unchanged, and returns the frame",
      probes: (() => {
        const art = () => { const f = MS.createFrame(7, 5); MS.fillRect(f, 2, 1, 3, 3, [255, 160, 40]); return f; };
        const m = () => MS.multiply(MS.translate(3, 2), MS.scale(1.5));
        const ref = (fn) => { const f = filled(16, 12, [10, 10, 30]); fn(f); return f; };
        return [
          () => sameFrame(MS.renderLayers(filled(16, 12, [10, 10, 30]), [{ sprite: art(), matrix: m(), blur: 1.2 }]), ref(f => MS.drawTransformed(f, MS.blur(art(), 1.2), m()))),
          () => sameFrame(MS.renderLayers(filled(16, 12, [10, 10, 30]), [{ sprite: art(), matrix: m(), opacity: 0.6 }]), ref(f => MS.drawTransformed(f, art(), m(), 0.6))),
          () => sameFrame(MS.renderLayers(filled(16, 12, [10, 10, 30]), [{ sprite: art() }, { sprite: filled(2, 2, [0, 255, 0]), matrix: MS.translate(3, 2) }]),
            ref(f => { MS.drawTransformed(f, art(), [1, 0, 0, 1, 0, 0]); MS.drawTransformed(f, filled(2, 2, [0, 255, 0]), MS.translate(3, 2)); })),
          () => sameFrame(MS.renderLayers(filled(16, 12, [10, 10, 30]), [{ sprite: art(), matrix: m(), opacity: 0 }]), filled(16, 12, [10, 10, 30])),
          () => { const f = MS.renderLayers(filled(10, 6, [0, 0, 0]), [{ sprite: filled(10, 6, [255, 255, 255]), clip: { x: 2, y: 1, width: 4, height: 3 } }]);
            return samePixel(MS.getPixel(f, 2, 1), [255, 255, 255, 255]) && samePixel(MS.getPixel(f, 5, 3), [255, 255, 255, 255]) &&
              samePixel(MS.getPixel(f, 1, 1), [0, 0, 0, 255], 0) && samePixel(MS.getPixel(f, 6, 2), [0, 0, 0, 255], 0) && samePixel(MS.getPixel(f, 3, 4), [0, 0, 0, 255], 0); },
          () => { const f = filled(4, 4, [0, 0, 0]); return MS.renderLayers(f, []) === f; },
        ];
      })(),
    },
    { // S: text
      rule: "text is drawn with a font the canvas accepts (weight, size in px, family), an rgba() color with alpha from 0 to 1, spacing in px and an alphabetic baseline; a text sprite is measured with that same font, sized from the font's ascent and descent plus pad, and falls back to the bitmap font at scale round(size ÷ 10)",
      probes: [
        () => drawn({ size: 18, weight: 700, family: "Georgia" }).font === "700 18px Georgia",
        () => drawn({ size: 9 }).font === "400 9px sans-serif",
        () => drawn({ size: 9, color: [1, 2, 3, 153] }).fillStyle === "rgba(1, 2, 3, 0.6)",
        () => drawn({ size: 9, color: [4, 5, 6] }).fillStyle === "rgba(4, 5, 6, 1)",
        () => drawn({ size: 9, letterSpacing: 1.5 }).letterSpacing === "1.5px",
        () => drawn({ size: 9 }).textBaseline === "alphabetic",
        () => { const { f } = sprite("WXYZ", { size: 20, pad: 4 }); return f.width === 48 && f.height === 29; },
        () => { const { f, call } = sprite("Hi", { size: 40, pad: 1 }); return f.baseline === 31 && call.x === 1 && call.y === 31; },
        () => { const { f } = sprite("ABCDEF", { size: 10, letterSpacing: 2, weight: 900, family: "Inter" }); return f.width === 42; },
        () => { const { call } = sprite("Go", { size: 12, weight: 900, family: "Inter" }); return call.font === "900 12px Inter"; },
        () => { const f = withCanvas(() => null, () => MS.textSprite("OK", { size: 47, pad: 3 })); return f.height === 41 && f.baseline === 38 && f.width === MS.measureText("OK", 5) + 6; },
      ],
    },
  ];

  const OFFSETS = [];
  for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) if (Math.abs(dx) + Math.abs(dy) >= 7) OFFSETS.push([dx, dy]);
  shuffle(OFFSETS, 8);
  const px = v => Math.floor(v + 0.5 + 1e-7);
  const STOPS = [[255, 92, 138], [91, 140, 255], [234, 240, 250]];

  MS.mystery("08", {
    draw() {
      const W = M * 2 + (WORD.length * 6 - 1) * C, H = M * 2 + 7 * C;
      const frame = MS.createFrame(W, H);
      MS.clearFrame(frame, [11, 13, 18]);
      const wrong = WORD.split("").map(() => 0), failed = [];
      // The word lives in a world of its own; the camera looks at its middle.
      let film = null;
      try { film = MS.camera({ x: W / 2, y: H / 2 }, W, H); } catch (e) { failed.push(`the camera: ${e.message}`); }
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
          if (!right) wrong[j]++;
          k++;
          const P = right ? [gx, gy] : [gx + o[0], gy + o[1]];
          let at = [P[0] + 7, P[1] + 5];   // where a wrong camera would leave it
          try { if (film) { const q = MS.transformPoint(film, P[0], P[1]); at = [px(q[0]), px(q[1])]; } } catch (e) { failed.push(`the camera: ${e.message}`); }
          MS.fillRect(frame, at[0], at[1], C, C, color);
        }));
      });
      return { frame, wrong, failed: [...new Set(failed)] };
    },
    check({ frame, wrong, failed }, data) {
      const hints = failed.map(msg => `Part of the picture couldn't be drawn (${msg}).`);
      const names = ["first S", "C", "first E", "N", "second E", "last S"];
      wrong.forEach((n, j) => { if (n) hints.push(`Some dots of the ${names[j]} flew off: ${RULES[j].rule}.`); });
      const ok = MS.hashFrame(frame) === data.mystery;
      return { wrong: ok ? 0 : 1, hints };
    },
  });
})(globalThis.MS = globalThis.MS || {});
