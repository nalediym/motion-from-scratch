// tests/09-kinetic-intro.test.js — PROVIDED. Read a failing test to see what's expected.
(function (MS) {
  const L = "09";
  const near = (t, got, want, eps, msg) => t.close(got, want, eps, msg);
  const state = (t, s, want, msg) => {
    t.ok(s && typeof s === "object", `${msg}: expected { visible, scale, opacity, blur }, got ${s}`);
    t.eq(s.visible, want[0], msg + ", visible");
    near(t, s.scale, want[1], 1e-6, msg + ", scale");
    near(t, s.opacity, want[2], 1e-6, msg + ", opacity");
    near(t, s.blur, want[3], 1e-6, msg + ", blur");
  };
  const closePixel = (t, got, want, eps, msg) => { t.ok(got, msg + ": no pixel"); want.forEach((w, i) => near(t, got[i], w, eps, `${msg}, ${["red", "green", "blue", "alpha"][i]}`)); };
  // Text depends on the fonts a computer has, so tests that measure text use the bitmap font everywhere.
  const bitmapOnly = fn => { const real = MS.createCanvas; MS.createCanvas = () => null; try { return fn(); } finally { MS.createCanvas = real; } };
  const WORD2 = { a: 40, b: 88, enterFrom: 0.8, exitTo: 1.5, blurIn: 14, blurOut: 16 };   // "ANIMATE."

  MS.test(L, "sceneState: a scene is on screen from 2 frames before `a` to 2 frames after `b`", t => {
    t.eq(MS.sceneState(37, WORD2).visible, false, "frame 37");
    t.eq(MS.sceneState(38, WORD2).visible, true, "frame 38");
    t.eq(MS.sceneState(90, WORD2).visible, true, "frame 90");
    t.eq(MS.sceneState(91, WORD2).visible, false, "frame 91");
  });

  MS.test(L, "sceneState: at `a` it starts small, invisible and fully blurred", t => {
    state(t, MS.sceneState(40, WORD2), [true, 0.8, 0, 14], "frame 40");
    state(t, MS.sceneState(38, WORD2), [true, 0.8, 0, 14], "frame 38, before it starts: held, like a clamp");
  });

  MS.test(L, "sceneState: it enters along cubic-bezier(0.16, 1, 0.3, 1)", t => {
    state(t, MS.sceneState(45, WORD2), [true, 0.951602543, 0.738269926, 3.664221036], "frame 45, 5 frames in");
  });

  MS.test(L, "sceneState: in the middle, it pushes in slowly and steadily toward pushTo", t => {
    state(t, MS.sceneState(66, WORD2), [true, 1.021666667, 1, 0], "frame 66: 26 of 48 frames along the push");
  });

  MS.test(L, "sceneState: it exits along cubic-bezier(0.6, 0, 0.2, 1), growing toward exitTo", t => {
    state(t, MS.sceneState(77, WORD2), [true, 1.394039897, 0.29531467, 11.274965283], "frame 77");
    state(t, MS.sceneState(88, WORD2), [true, 1.56, 0, 16], "frame 88: gone, and 1.04 × 1.5 = 1.56 times as big");
  });

  MS.test(L, "sceneState: a blur of 0.15 or less counts as no blur", t => {
    const s = { a: 0, b: 100, blurIn: 14, blurOut: 16 };
    near(t, MS.sceneState(15, s).blur, 0.2075, 1e-4, "frame 15 (0.21 is kept)");
    t.eq(MS.sceneState(16, s).blur, 0, "frame 16 (0.146 becomes 0)");
    t.eq(MS.sceneState(80, s).blur, 0, "frame 80 (0.142 becomes 0)");
    near(t, MS.sceneState(81, s).blur, 0.3481, 1e-4, "frame 81");
  });

  MS.test(L, "sceneState: the defaults are KineticIntro's (enterDur 26, exitDur 22, pushTo 1.04)", t => {
    state(t, MS.sceneState(13, { a: 0, b: 60 }), [true, 1.008666667, 0.971779105, 0], "frame 13");
    state(t, MS.sceneState(26, { a: 0, b: 60 }), [true, 1.017333333, 1, 0], "frame 26: fully in");
    state(t, MS.sceneState(49, { a: 0, b: 60 }), [true, 1.032666667, 0.29531467, 0], "frame 49: 11 frames into the exit");
  });

  MS.test(L, "sceneState: a short scene can enter and exit at once; opacity is the smaller of the two", t => {
    state(t, MS.sceneState(10, { a: 0, b: 20, enterFrom: 0.5, exitTo: 2, blurIn: 4, blurOut: 6 }), [true, 1.759664865, 0.214712778, 4.981150411], "a 20-frame scene, frame 10");
  });

  MS.test(L, "maskUp: the word rises from 110% below its slot to 0, along the enter curve", t => {
    near(t, MS.maskUp(10, 12), 110, 1e-9, "before it starts");
    near(t, MS.maskUp(12, 12), 110, 1e-9, "at the start");
    near(t, MS.maskUp(17, 12), 22.499047301, 1e-6, "5 frames in");
    near(t, MS.maskUp(34, 12), 0, 1e-9, "22 frames in: home");
    near(t, MS.maskUp(15, 10, 10), 3.104298421, 1e-6, "a 10-frame rise, half way");
  });

  MS.test(L, "linearGradientT: 90deg runs left to right, 180deg top to bottom, 0deg bottom to top", t => {
    near(t, MS.linearGradientT(50, 20, 200, 100, 90), 0.25, 1e-9, "90deg");
    near(t, MS.linearGradientT(50, 20, 200, 100, 180), 0.2, 1e-9, "180deg");
    near(t, MS.linearGradientT(50, 20, 200, 100, 0), 0.8, 1e-9, "0deg");
  });

  MS.test(L, "linearGradientT: at any angle, the gradient line just reaches the corners", t => {
    near(t, MS.linearGradientT(0, 0, 200, 100, 100), 0, 1e-9, "100deg: the top-left corner is 0");
    near(t, MS.linearGradientT(200, 100, 200, 100, 100), 1, 1e-9, "100deg: the bottom-right corner is 1");
    near(t, MS.linearGradientT(30, 70, 200, 100, 100), 0.194561245, 1e-6, "100deg: a point inside");
    near(t, MS.linearGradientT(10, 10, 40, 40, 45), 0.5, 1e-9, "45deg: on the diagonal through the middle");
  });

  const overlay = (bg, c) => { const f = MS.createFrame(1, 1); MS.setPixel(f, 0, 0, bg); MS.blendOverlay(f, 0, 0, c); return MS.getPixel(f, 0, 0); };

  MS.test(L, "blendOverlay: dark backdrops get darker, light ones lighter", t => {
    closePixel(t, overlay([60, 60, 60], [255, 255, 255, 128]), [90, 90, 90, 255], 1, "half-white over dark grey");
    closePixel(t, overlay([200, 180, 40], [255, 255, 255, 128]), [228, 218, 60, 255], 1, "half-white over a mix of light and dark channels");
    closePixel(t, overlay([100, 150, 200], [0, 0, 0, 255]), [0, 45, 145, 255], 1, "black over a blue");
    closePixel(t, overlay([128, 128, 128], [200, 100, 20]), [200, 101, 21, 255], 1, "over mid-grey, an opaque color nearly keeps itself");
  });

  MS.test(L, "blendOverlay: over transparent pixels it's an ordinary blend", t => {
    closePixel(t, overlay([0, 0, 0, 0], [255, 255, 255, 128]), [255, 255, 255, 128], 1, "half-white over nothing");
    closePixel(t, overlay([200, 100, 50, 128], [90, 200, 30, 200]), [145, 169, 24, 228], 1, "both partly transparent");
    const f = MS.createFrame(2, 2);
    MS.blendOverlay(f, 5, 1, [255, 0, 0]);
    t.deep(Array.from(f.data), new Array(16).fill(0), "a pixel outside the frame changes nothing");
  });

  MS.test(L, "background: KineticIntro's two radial gradients", t => {
    const bg = MS.background(108, 192);
    t.deep([bg.width, bg.height], [108, 192], "size");
    closePixel(t, MS.getPixel(bg, 54, 73), [36, 55, 94, 255], 1, "near the center of the background gradient");
    closePixel(t, MS.getPixel(bg, 54, 86), [38, 58, 101, 255], 1, "the center of the glow");
    closePixel(t, MS.getPixel(bg, 0, 0), [12, 14, 20, 255], 1, "the top-left corner");
    closePixel(t, MS.getPixel(bg, 107, 191), [11, 13, 18, 255], 1, "the bottom-right corner: #0B0D12");
    closePixel(t, MS.getPixel(bg, 20, 150), [14, 18, 27, 255], 1, "lower left");
  });

  MS.test(L, "vignette: an inset shadow, darkest in the corners and clear in the middle", t => {
    const v = MS.vignette(108, 192, 28, 0.7);
    t.deep([v.width, v.height], [108, 192], "size");
    closePixel(t, MS.getPixel(v, 0, 0), [0, 0, 0, 132], 2, "a corner: about 0.7 × 3/4 of 255");
    closePixel(t, MS.getPixel(v, 0, 96), [0, 0, 0, 87], 2, "the middle of an edge: about 0.7 × 1/2 of 255");
    closePixel(t, MS.getPixel(v, 54, 0), [0, 0, 0, 87], 2, "the middle of the top edge");
    closePixel(t, MS.getPixel(v, 10, 10), [0, 0, 0, 76], 2, "10 pixels in from a corner");
    t.close(MS.getPixel(v, 54, 96)[3], 0, 0, "the middle of the frame: alpha");
  });

  MS.test(L, "wordLayer: nothing while the word is off screen", t => {
    t.eq(MS.wordLayer(37, 1, 108), null, "frame 37, the second word");
    t.eq(MS.wordLayer(91, 1, 108), null, "frame 91, the second word");
  });

  MS.test(L, "wordLayer: opacity and scale from sceneState, blur scaled to the frame size", t => {
    const layer = MS.wordLayer(77, 1, 216), s = MS.sceneState(77, WORD2);
    t.ok(layer && layer.sprite, "a layer with a sprite");
    near(t, layer.opacity, s.opacity, 1e-9, "opacity");
    near(t, layer.blur, s.blur * 0.2, 1e-9, "blur: the frame is 216 wide, 0.2 of 1080");
    const [cx, cy] = MS.transformPoint(layer.matrix, layer.sprite.width / 2, layer.sprite.height / 2);
    near(t, cx, 108, 1e-9, "the sprite's center lands in the middle of the frame (x)");
    near(t, cy, 192, 1e-9, "the sprite's center lands in the middle of the frame (y)");
    const [ex] = MS.transformPoint(layer.matrix, layer.sprite.width / 2 + 10, layer.sprite.height / 2);
    near(t, ex - cx, 10 * s.scale, 1e-9, "10 sprite pixels become 10 × scale frame pixels");
  });

  MS.test(L, "wordLayer: the sprite is the word's box plus padding for the blur, and the mask hides the word at first", t => {
    bitmapOnly(() => {
      const text = MS.textSprite("ANIMATE.", { size: 30, weight: 900, family: "Inter", letterSpacing: -0.8 });
      const pad = Math.ceil(3 * 16 * 0.2) + 2;
      const late = MS.wordLayer(66, 1, 216);
      t.deep([late.sprite.width, late.sprite.height], [text.width + 2 * pad, text.height + 2 * pad], "sprite size");
      let ink = 0, early = MS.wordLayer(42, 1, 216);
      for (let i = 3; i < late.sprite.data.length; i += 4) ink += late.sprite.data[i];
      t.ok(ink > 0, "at frame 66 the word is in its slot");
      let hidden = 0;
      for (let i = 3; i < early.sprite.data.length; i += 4) hidden += early.sprite.data[i];
      t.eq(hidden, 0, "at frame 42 (the rise starts at 42) the word is still below its slot, so nothing shows");
    });
  });

  MS.test(L, "lockupLayer: on from frame 118, with the subtitle fading in from 150", t => {
    t.eq(MS.lockupLayer(117, 216), null, "frame 117");
    bitmapOnly(() => {
      const early = MS.lockupLayer(146, 216), late = MS.lockupLayer(170, 216);
      t.ok(early && late, "layers at frames 146 and 170");
      near(t, late.opacity, MS.sceneState(170, { a: 120, b: 180, enterFrom: 0.86, exitTo: 1, blurIn: 14, exitDur: 2 }).opacity, 1e-9, "opacity at 170");
      const bottom = l => { let s = 0; const s0 = l.sprite; for (let y = Math.floor(s0.height * 0.6); y < s0.height; y++) for (let x = 0; x < s0.width; x++) s += s0.data[(y * s0.width + x) * 4 + 3]; return s; };
      t.eq(bottom(early), 0, "at 146 the subtitle (the lower part of the sprite) is invisible");
      t.ok(bottom(late) > 0, "at 170 it's there");
      // The "·" is primary blue. Overlay lifts a mid-dark color less than an ordinary blend would.
      const dot = MS.getPixel(MS.lockupLayer(155, 216).sprite, 83, 19);
      t.ok(dot && Math.abs(dot[0] - 130) <= 1 && Math.abs(dot[1] - 189) <= 1, "at 155 the sweep crosses the blue dot and overlays it to about [130, 189, 255], got " + dot);
    });
  });

  MS.test(L, "kineticIntro: 1080 × 1920 at 30 fps for 6 seconds, scaled by width", t => {
    const c = MS.kineticIntro(108);
    t.deep([c.width, c.height, c.fps, c.durationInFrames], [108, 192, 30, 180], "width, height, fps, durationInFrames");
  });

  MS.test(L, "kineticIntro: a frame is the background, the words, the lockup and the vignette, in that order", t => {
    bitmapOnly(() => {
      for (const n of [10, 60, 150]) {
        const got = MS.renderFrame(MS.kineticIntro(108), n);
        const want = MS.background(108, 192);
        const layers = [0, 1, 2].map(i => MS.wordLayer(n, i, 108)).concat([MS.lockupLayer(n, 108), { sprite: MS.vignette(108, 192, 28, 0.7) }]);
        MS.renderLayers(want, layers.filter(Boolean));
        let worst = 0;
        for (let i = 0; i < want.data.length; i++) worst = Math.max(worst, Math.abs(want.data[i] - got.data[i]));
        t.ok(worst <= 1, `frame ${n}: differs from the layers drawn by hand by up to ${worst}`);
      }
    });
  });

  // ---- pictures ----
  MS.animation(L, "KineticIntro, rebuilt from pixels up (real fonts in a browser, the bitmap font elsewhere)", () => MS.kineticIntro(216));

  MS.visual(L, "The pieces at frame 156: background, the vignette on its own, and the lockup's sprite with its light sweep", () => {
    const W = 216, H = 384, bg = MS.background(W, H), v = MS.vignette(W, H, 56, 0.7), lock = MS.lockupLayer(156, W);
    const f = MS.createFrame(3 * W + 8, H);
    MS.clearFrame(f, [40, 44, 56]);
    MS.drawTransformed(f, bg, MS.translate(0, 0));
    MS.drawTransformed(f, v, MS.translate(W + 4, 0));
    MS.drawTransformed(f, lock.sprite, MS.translate(2 * W + 8 + (W - lock.sprite.width) / 2, (H - lock.sprite.height) / 2));
    return f;
  });
})(globalThis.MS = globalThis.MS || {});
