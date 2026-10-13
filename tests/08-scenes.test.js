// tests/08-scenes.test.js — PROVIDED. Read a failing test to see what's expected.
(function (MS) {
  const L = "08";

  // ---- a pretend canvas, so text can be tested the same way everywhere ----
  // Like a real one, it ignores a font it can't parse, and measures with the
  // font and letterSpacing it has when measureText is called: every character
  // is 0.6 × size wide plus the letter spacing; the font's ascent is 0.8 × size
  // and its descent 0.25 × size. getImageData returns made-up pixels.
  function fakeCanvas(log) {
    return (width, height) => {
      const state = { font: "10px sans-serif", letterSpacing: "0px", fillStyle: "#000000", textBaseline: "alphabetic", textAlign: "start" };
      const size = () => parseFloat(/(\d+(?:\.\d+)?)px/.exec(state.font)[1]);
      const ctx = {
        get font() { return state.font; },
        set font(v) { if (/^(normal|bold|[1-9]00) \d+(\.\d+)?px \S.*$/.test(String(v))) state.font = String(v); },   // invalid: ignored
        get letterSpacing() { return state.letterSpacing; }, set letterSpacing(v) { state.letterSpacing = String(v); },
        get fillStyle() { return state.fillStyle; }, set fillStyle(v) { state.fillStyle = String(v); },
        get textBaseline() { return state.textBaseline; }, set textBaseline(v) { state.textBaseline = String(v); },
        get textAlign() { return state.textAlign; }, set textAlign(v) { state.textAlign = String(v); },
        measureText(text) {
          const s = size(), n = [...String(text)].length;
          return { width: n * (0.6 * s + parseFloat(state.letterSpacing)), fontBoundingBoxAscent: 0.8 * s, fontBoundingBoxDescent: 0.25 * s,
            actualBoundingBoxAscent: 0.7 * s, actualBoundingBoxDescent: 0, actualBoundingBoxLeft: 0, actualBoundingBoxRight: n * 0.6 * s };
        },
        fillText(text, x, y) { log.push({ canvas: { width, height }, text, x, y, ...state }); },
        getImageData(x, y, w, h) {
          const data = new Uint8ClampedArray(w * h * 4);
          for (let i = 0; i < data.length; i++) data[i] = (i * 7 + 3) % 256;
          return { width: w, height: h, data };
        },
      };
      return { width, height, getContext: type => type === "2d" ? ctx : null };
    };
  }
  // Runs fn with MS.createCanvas swapped for `factory`, then puts it back.
  function withCanvas(factory, fn) {
    const real = MS.createCanvas;
    MS.createCanvas = factory;
    try { return fn(); } finally { MS.createCanvas = real; }
  }

  MS.test(L, "drawTextCanvas sets a font the canvas accepts: weight, then size in px, then family", t => {
    const log = [], ctx = fakeCanvas(log)(10, 10).getContext("2d");
    MS.drawTextCanvas(ctx, "Hi", 4, 30, { size: 40, weight: 900, family: "Inter" });
    t.eq(log.length, 1, "fillText calls");
    t.eq(log[0].font, "900 40px Inter", "the font when the text was drawn");
    MS.drawTextCanvas(ctx, "Hi", 4, 30, { size: 12 });
    t.eq(log[1].font, "400 12px sans-serif", "with no weight or family: 400 and sans-serif");
  });

  MS.test(L, "drawTextCanvas: color as rgba() with alpha from 0 to 1, spacing in px, alphabetic baseline", t => {
    const log = [], ctx = fakeCanvas(log)(10, 10).getContext("2d");
    MS.drawTextCanvas(ctx, "Yo", 2.5, 18, { size: 20, color: [91, 140, 255, 51], letterSpacing: -2 });
    const call = log[0];
    t.eq(call.fillStyle, "rgba(91, 140, 255, 0.2)", "fillStyle");
    t.eq(call.letterSpacing, "-2px", "letterSpacing");
    t.eq(call.textBaseline, "alphabetic", "textBaseline");
    t.eq(call.textAlign, "left", "textAlign");
    t.deep([call.text, call.x, call.y], ["Yo", 2.5, 18], "fillText's text, x and y");
    MS.drawTextCanvas(ctx, "Yo", 0, 0, { size: 20, color: [10, 20, 30] });
    t.eq(log[1].fillStyle, "rgba(10, 20, 30, 1)", "a color with no alpha is opaque");
    t.eq(log[1].letterSpacing, "0px", "no letterSpacing is 0px");
  });

  MS.test(L, "textSprite fits the text: advance width × the font's ascent + descent, plus pad on every side", t => {
    const log = [];
    const f = withCanvas(fakeCanvas(log), () => MS.textSprite("ABCD", { size: 20, pad: 3 }));
    t.eq(f.width, 54, "width: 4 × 12 = 48, plus 3 + 3");
    t.eq(f.height, 27, "height: 16 + 5 = 21, plus 3 + 3");
  });

  MS.test(L, "textSprite rounds the size up to whole pixels", t => {
    const f = withCanvas(fakeCanvas([]), () => MS.textSprite("ABC", { size: 15 }));
    t.eq(f.width, 27, "3 × 9 = 27 exactly");
    t.eq(f.height, 16, "12 + 3.75 = 15.75 → 16");
  });

  MS.test(L, "textSprite draws on its baseline and copies the canvas's pixels", t => {
    const log = [];
    const f = withCanvas(fakeCanvas(log), () => MS.textSprite("Hey", { size: 30, pad: 5, weight: 900, family: "Inter", color: [255, 0, 0] }));
    const call = log.find(c => c.text === "Hey");
    t.ok(call, "it should fillText the text");
    t.deep([call.canvas.width, call.canvas.height], [f.width, f.height], "the canvas it draws on is the sprite's size");
    t.deep([call.x, call.y], [5, 29], "drawn at x = pad, y = pad + ascent");
    t.eq(call.font, "900 30px Inter", "the font");
    t.eq(f.baseline, 29, "sprite.baseline: where the baseline is in the sprite");
    t.deep(Array.from(f.data.slice(0, 8)), [3, 10, 17, 24, 31, 38, 45, 52], "the first two pixels come from getImageData");
    t.eq(f.data.length, f.width * f.height * 4, "a whole frame of pixels");
  });

  MS.test(L, "textSprite measures with the same font and spacing it draws with", t => {
    const f = withCanvas(fakeCanvas([]), () => MS.textSprite("ABCDE", { size: 10, letterSpacing: -1, weight: 700, family: "Inter" }));
    t.eq(f.width, 25, "5 × (6 − 1)");
  });

  MS.test(L, "textSprite without a canvas uses the bitmap font, at scale round(size ÷ 10)", t => {
    const f = withCanvas(() => null, () => MS.textSprite("HI", { size: 37, pad: 2, color: [9, 99, 199] }));
    const want = MS.createFrame(MS.measureText("HI", 4) + 4, 7 * 4 + 4);
    MS.drawText(want, "HI", 2, 2, 4, [9, 99, 199]);
    t.deep([f.width, f.height], [want.width, want.height], "size: the text at scale 4 (3.7 rounds up), plus pad");
    t.deep(f.data, want.data, "pixels");
    t.eq(f.baseline, 30, "the baseline is the bottom of the bitmap capitals: pad + 7 × scale");
  });

  MS.test(L, "sequence: inside its range, frames count from 0 again", t => {
    t.eq(MS.sequence(30, 30, 10), 0, "its first frame");
    t.eq(MS.sequence(34, 30, 10), 4, "four frames in");
    t.eq(MS.sequence(39, 30, 10), 9, "its last frame");
  });

  MS.test(L, "sequence: outside its range it's null (the end is not included)", t => {
    t.eq(MS.sequence(29, 30, 10), null, "the frame before");
    t.eq(MS.sequence(40, 30, 10), null, "from + duration is already outside");
  });

  MS.test(L, "sequence: with no duration it lasts forever; from can be negative", t => {
    t.eq(MS.sequence(5000, 30), 4970, "no duration");
    t.eq(MS.sequence(0, -12, 20), 12, "started 12 frames before the video did");
  });

  MS.test(L, "series puts sequences back to back", t => {
    t.deep(MS.series([{ durationInFrames: 40 }, { durationInFrames: 25 }, { durationInFrames: 10 }]).flatMap(s => [s.from, s.durationInFrames]),
 [0, 40, 40, 25, 65, 10], "from and durationInFrames, in pairs");
  });

  MS.test(L, "series: an offset moves its sequence and every one after it", t => {
    const s = MS.series([{ durationInFrames: 40 }, { durationInFrames: 25, offset: -10 }, { durationInFrames: 10, offset: 5 }]);
    t.deep(s.map(x => x.from), [0, 30, 60], "a negative offset overlaps the one before; a positive one leaves a gap");
  });

  const at = (m, x, y) => MS.transformPoint(m, x, y).map(v => Math.round(v * 1e9) / 1e9);

  MS.test(L, "camera: what it looks at lands in the middle of the screen", t => {
    t.deep(at(MS.camera({}, 200, 100), 0, 0), [100, 50], "the default camera looks at (0, 0)");
    t.deep(at(MS.camera({ x: 30, y: -20 }, 200, 100), 30, -20), [100, 50], "a camera at (30, −20)");
    t.deep(at(MS.camera({ x: 30, y: -20 }, 200, 100), 40, -20), [110, 50], "10 to the right of what it looks at");
  });

  MS.test(L, "camera: zoom grows distances from the middle", t => {
    t.deep(at(MS.camera({ x: 30, y: -20, zoom: 2 }, 200, 100), 40, -15), [120, 60], "zoom 2");
    t.deep(at(MS.camera({ zoom: 0.5 }, 200, 100), -40, 40), [80, 70], "zoom 0.5");
  });

  MS.test(L, "camera: turning the camera turns the world the other way", t => {
    t.deep(at(MS.camera({ rotation: Math.PI / 2 }, 200, 100), 10, 0), [100, 40], "camera turned a quarter turn clockwise: what was to its right is now above the middle");
    t.deep(at(MS.camera({ x: 5, y: 5, zoom: 3, rotation: Math.PI }, 200, 100), 6, 5), [97, 50], "everything at once: half a turn, zoom 3");
  });

  const solid = (w, h, c) => { const f = MS.createFrame(w, h); MS.clearFrame(f, c); return f; };

  MS.test(L, "renderLayers draws its layers in order, later ones on top", t => {
    const f = solid(6, 4, [0, 0, 0]);
    MS.renderLayers(f, [
      { sprite: solid(3, 2, [255, 0, 0]), matrix: MS.translate(1, 1) },
      { sprite: solid(3, 2, [0, 0, 255]), matrix: MS.translate(2, 1) },
      { sprite: solid(1, 1, [0, 255, 0]) },
    ]);
    t.deep(MS.getPixel(f, 1, 1), [255, 0, 0, 255], "only the red layer covers (1, 1)");
    t.deep(MS.getPixel(f, 2, 1), [0, 0, 255, 255], "the blue layer is drawn over the red one");
    t.deep(MS.getPixel(f, 0, 0), [0, 255, 0, 255], "a layer with no matrix is drawn where it is");
    t.deep(MS.getPixel(f, 5, 3), [0, 0, 0, 255], "nothing covers (5, 3)");
  });

  MS.test(L, "renderLayers: opacity fades a layer, and opacity 0 draws nothing", t => {
    const f = solid(4, 2, [0, 0, 0]);
    MS.renderLayers(f, [
      { sprite: solid(2, 2, [200, 200, 200]), opacity: 0.25 },
      { sprite: solid(2, 2, [255, 0, 0]), matrix: MS.translate(2, 0), opacity: 0 },
    ]);
    t.close(MS.getPixel(f, 0, 0)[0], 50, 1, "a quarter of the way to 200");
    t.deep(MS.getPixel(f, 3, 1), [0, 0, 0, 255], "the invisible layer");
  });

  MS.test(L, "renderLayers: a clip keeps everything outside its rectangle as it was", t => {
    const f = solid(8, 4, [0, 0, 0]);
    MS.renderLayers(f, [{ sprite: solid(6, 4, [255, 255, 255]), matrix: MS.translate(1, 0), clip: { x: 3, y: 1, width: 3, height: 2 } }]);
    t.deep(MS.getPixel(f, 3, 1), [255, 255, 255, 255], "inside the clip");
    t.deep(MS.getPixel(f, 5, 2), [255, 255, 255, 255], "inside the clip, other corner");
    t.deep(MS.getPixel(f, 2, 1), [0, 0, 0, 255], "left of the clip");
    t.deep(MS.getPixel(f, 6, 1), [0, 0, 0, 255], "right of the clip");
    t.deep(MS.getPixel(f, 4, 0), [0, 0, 0, 255], "above the clip");
    t.deep(MS.getPixel(f, 4, 3), [0, 0, 0, 255], "below the clip");
  });

  MS.test(L, "renderLayers blurs a sprite before moving it, so a scaled-up layer gets a scaled-up blur", t => {
    const sprite = MS.createFrame(9, 9);
    MS.fillRect(sprite, 3, 3, 3, 3, [255, 255, 255]);
    const m = MS.multiply(MS.translate(2, 1), MS.scale(2));
    const want = solid(24, 24, [0, 0, 0]);
    MS.drawTransformed(want, MS.blur(sprite, 1.5), m);
    const got = MS.renderLayers(solid(24, 24, [0, 0, 0]), [{ sprite, matrix: m, blur: 1.5 }]);
    t.ok(got && got.data, "it should return the frame it drew on");
    for (const [x, y] of [[9, 9], [6, 10], [3, 3], [12, 16]]) t.deep(MS.getPixel(got, x, y), MS.getPixel(want, x, y), `pixel (${x}, ${y})`);
  });

  MS.test(L, "mulberry32 turns a whole number into a number from 0 up to 1, the same one every time", t => {
    t.eq(MS.mulberry32(1), 0.6270739405881613, "seed 1");
    t.eq(MS.mulberry32(42), 0.6011037519201636, "seed 42");
    t.eq(MS.mulberry32(-7), 0.43306733411736786, "seed −7");
    t.eq(MS.mulberry32(42), MS.mulberry32(42), "the same seed again");
  });

  MS.test(L, "random gives Remotion's numbers for string and number seeds", t => {
    t.eq(MS.random("hello"), 0.41293257870711386, "random(\"hello\")");
    t.eq(MS.random(""), 0.26642920868471265, "random(\"\")");
    t.eq(MS.random(1), 0.07301638228818774, "random(1)");
    t.eq(MS.random(0.5), 0.030728988582268357, "random(0.5)");
    t.eq(MS.random("motion-from-scratch"), 0.9684063496533781, "a long seed: the hash has to stay a 32-bit integer all the way");
  });

  MS.test(L, "random(null) is truly random; other seeds are mistakes", t => {
    const r = [1, 2, 3, 4, 5].map(() => MS.random(null));
    t.ok(r.every(v => typeof v === "number" && v >= 0 && v < 1), "random(null) should be a number from 0 up to 1, got " + r.join(", "));
    t.ok(new Set(r).size > 1, "five calls to random(null) should not all give the same number");
    let threw = false;
    try { MS.random({ seed: 1 }); } catch (e) { threw = true; }
    t.ok(threw, "random({ seed: 1 }) should throw");
  });

  // ---- pictures ----
  const BG = [11, 13, 18], INK = [234, 240, 250, 255], BLUE = [91, 140, 255, 255], DIM = [60, 70, 90, 255];

  MS.visual(L, "textSprite in three sizes, with each sprite's box and baseline (real fonts in a browser, the bitmap font elsewhere)", () => {
    const sprites = [16, 24, 36].map(size => MS.textSprite("Motion", { size, weight: 900, family: "Inter", color: INK, pad: 2 }));
    const f = MS.createFrame(sprites.reduce((w, s) => w + s.width + 8, 8), Math.max(...sprites.map(s => s.height)) + 8);
    MS.clearFrame(f, BG);
    let x = 8;
    for (const s of sprites) {
      const y = f.height - 4 - s.height;
      MS.fillRect(f, x, y, s.width, s.height, [30, 36, 50]);
      MS.fillRect(f, x, y + s.baseline, s.width, 1, BLUE);
      MS.drawTransformed(f, s, MS.translate(x, y));
      x += s.width + 8;
    }
    return f;
  });

  MS.visual(L, "300 dots placed with random(\"x\" + i) and random(\"y\" + i): the same picture every time", () => {
    const f = MS.createFrame(160, 60);
    MS.clearFrame(f, BG);
    for (let i = 0; i < 300; i++) {
      const c = MS.interpolateColors(MS.random("c" + i), [0, 1], [BLUE, INK]);
      MS.fillRect(f, Math.floor(MS.random("x" + i) * 160), Math.floor(MS.random("y" + i) * 60), 1, 1, c);
    }
    return f;
  });

  MS.animation(L, "Three words in a series, a slow camera, and stars that stay put", () => {
    const W = 160, H = 70, words = ["ONE", "TWO", "THREE"].map(w => MS.textSprite(w, { size: 22, weight: 900, family: "Inter", color: INK, pad: 6 }));
    const parts = MS.series([{ durationInFrames: 30 }, { durationInFrames: 30, offset: -6 }, { durationInFrames: 36, offset: -6 }]);
    const star = MS.createFrame(1, 1); MS.setPixel(star, 0, 0, [200, 210, 255]);
    const APPLE = MS.cubicBezier(0.16, 1, 0.3, 1);
    return MS.createComposition({
      width: W, height: H, fps: 30, durationInFrames: 84,
      render(frame, n) {
        MS.clearFrame(frame, BG);
        const cam = MS.camera({ x: n * 0.6, y: 0, zoom: 1 + n * 0.002, rotation: Math.sin(n / 30) * 0.05 }, W, H);
        const layers = [];
        for (let i = 0; i < 60; i++) layers.push({ sprite: star, matrix: MS.multiply(cam, MS.translate(MS.random("sx" + i) * 260 - 80, MS.random("sy" + i) * 90 - 45)), opacity: 0.3 + 0.7 * MS.random("so" + i) });
        parts.forEach(({ from, durationInFrames }, i) => {
          const local = MS.sequence(n, from, durationInFrames);
          if (local === null) return;
          const enter = APPLE(MS.clamp(local / 12, 0, 1)), exit = MS.clamp((local - durationInFrames + 8) / 8, 0, 1);
          const s = words[i], k = MS.lerp(0.8, 1, enter) * MS.lerp(1, 1.4, exit);
          layers.push({
            sprite: s, opacity: Math.min(enter, 1 - exit), blur: (1 - enter) * 3 + exit * 3,
            matrix: MS.multiply(MS.translate(W / 2, H / 2), MS.multiply(MS.scale(k), MS.translate(-s.width / 2, -s.height / 2))),
          });
        });
        MS.renderLayers(frame, layers);
      },
    });
  });
})(globalThis.MS = globalThis.MS || {});
