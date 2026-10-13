// tests/04-interpolate.test.js — PROVIDED. Read a failing test to see what's expected.
(function (MS) {
  const L = "04";
  const sq = t => t * t;

  MS.test(L, "lerp: a at t = 0, b at t = 1, and in between", t => {
    t.eq(MS.lerp(10, 20, 0), 10, "t = 0");
    t.eq(MS.lerp(10, 20, 1), 20, "t = 1");
    t.eq(MS.lerp(10, 20, 0.25), 12.5, "t = 0.25");
    t.eq(MS.lerp(8, 2, 0.5), 5, "it works downhill too");
  });

  MS.test(L, "lerp doesn't stop at the ends", t => {
    t.eq(MS.lerp(0, 10, 1.5), 15, "t = 1.5");
    t.eq(MS.lerp(0, 10, -0.5), -5, "t = -0.5");
  });

  MS.test(L, "inverseLerp: where v sits between a and b", t => {
    t.eq(MS.inverseLerp(10, 20, 15), 0.5);
    t.eq(MS.inverseLerp(0, 4, 1), 0.25);
    t.eq(MS.inverseLerp(20, 10, 15), 0.5, "a > b works too");
    t.eq(MS.inverseLerp(0, 10, 20), 2, "outside the range");
  });

  MS.test(L, "inverseLerp refuses a range of zero width", t => {
    t.throws(() => MS.inverseLerp(3, 3, 3), "a === b would divide by zero");
  });

  MS.test(L, "clamp keeps a value between min and max", t => {
    t.eq(MS.clamp(5, 0, 10), 5, "inside");
    t.eq(MS.clamp(-3, 0, 10), 0, "below");
    t.eq(MS.clamp(12, 0, 10), 10, "above");
  });

  MS.test(L, "interpolate maps one range onto another", t => {
    t.eq(MS.interpolate(5, [0, 10], [0, 100]), 50);
    t.eq(MS.interpolate(30, [20, 40], [1, 0]), 0.5, "a fade out: outputs can go down");
  });

  MS.test(L, "interpolate with several points uses the segment the input falls in", t => {
    t.eq(MS.interpolate(15, [0, 10, 20], [0, 1, 3]), 2, "halfway along the second segment");
    t.eq(MS.interpolate(10, [0, 10, 20], [0, 1, 3]), 1, "exactly on a point");
    t.eq(MS.interpolate(25, [0, 10, 20, 30], [0, 10, 0, 10]), 5, "the third segment of three");
  });

  MS.test(L, "interpolate keeps going past both ends by default", t => {
    t.eq(MS.interpolate(15, [0, 10], [0, 100]), 150, "past the right end");
    t.eq(MS.interpolate(-2, [0, 10], [0, 100]), -20, "past the left end");
    t.eq(MS.interpolate(25, [0, 10, 20], [0, 100, 110]), 115, "past the end of the LAST segment, at its slope");
  });

  MS.test(L, "extrapolate 'clamp' holds the end value", t => {
    t.eq(MS.interpolate(15, [0, 10], [0, 100], { extrapolateRight: "clamp" }), 100, "right");
    t.eq(MS.interpolate(-5, [0, 10], [0, 100], { extrapolateLeft: "clamp" }), 0, "left");
    t.eq(MS.interpolate(15, [0, 10], [0, 100], { extrapolateLeft: "clamp" }), 150, "clamping the left leaves the right alone");
  });

  MS.test(L, "extrapolate 'identity' returns the input itself", t => {
    t.eq(MS.interpolate(15, [0, 10], [0, 100], { extrapolateRight: "identity" }), 15);
    t.eq(MS.interpolate(-4, [0, 10], [0, 100], { extrapolateLeft: "identity" }), -4);
  });

  MS.test(L, "easing reshapes progress through each segment", t => {
    t.eq(MS.interpolate(5, [0, 10], [0, 100], { easing: sq }), 25, "halfway in, t² = 0.25");
    t.eq(MS.interpolate(15, [0, 10, 20], [0, 10, 20], { easing: sq }), 12.5, "easing restarts in each segment");
    t.eq(MS.interpolate(15, [0, 10], [0, 100], { easing: sq, extrapolateRight: "clamp" }), 100, "clamped: easing sees t = 1");
    t.eq(MS.interpolate(15, [0, 10], [0, 100], { easing: sq }), 225, "extended: t = 1.5 is eased too (1.5² = 2.25)");
  });

  MS.test(L, "interpolate rejects ranges it can't use", t => {
    t.throws(() => MS.interpolate(1, [0, 10], [0, 5, 10]), "different lengths");
    t.throws(() => MS.interpolate(1, [0], [5]), "only one point");
    t.throws(() => MS.interpolate(1, [0, 0], [0, 1]), "two inputs the same");
    t.throws(() => MS.interpolate(1, [10, 0], [0, 1]), "inputs going down");
  });

  MS.test(L, "interpolateColors blends each channel and rounds", t => {
    t.deep(MS.interpolateColors(0.5, [0, 1], [[0, 0, 0, 255], [255, 100, 50, 255]]), [128, 50, 25, 255], "halfway: 127.5 rounds to 128");
    t.deep(MS.interpolateColors(0.5, [0, 1], [[0, 0, 0], [200, 200, 200]]), [100, 100, 100, 255], "missing alpha counts as 255");
  });

  MS.test(L, "interpolateColors goes through several stops and stops at the ends", t => {
    const red = [255, 0, 0, 255], green = [0, 255, 0, 255], blue = [0, 0, 255, 255];
    t.deep(MS.interpolateColors(1.5, [0, 1, 2], [red, green, blue]), [0, 128, 128, 255], "between the 2nd and 3rd stop");
    t.deep(MS.interpolateColors(3, [0, 1, 2], [red, green, blue]), blue, "past the end it stays on the last color");
    t.deep(MS.interpolateColors(-1, [0, 1, 2], [red, green, blue]), red, "before the start it stays on the first");
  });

  // ---- pictures ----
  MS.animation(L, "Extend (top) keeps going; clamp (bottom) stops at the last point", () => MS.createComposition({
    width: 96, height: 30, fps: 30, durationInFrames: 60,
    render(frame, n) {
      MS.clearFrame(frame, [11, 13, 18]);
      MS.fillRect(frame, 0, 14, 96, 1, [40, 50, 70]);
      MS.fillRect(frame, MS.interpolate(n, [10, 40], [6, 70]), 4, 8, 8, MS.hex("#5B8CFF"));
      MS.fillRect(frame, MS.interpolate(n, [10, 40], [6, 70], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 18, 8, 8, MS.hex("#FF5C8A"));
    },
  }));

  MS.animation(L, "Keyframes: a dot through four corners", () => MS.createComposition({
    width: 64, height: 40, fps: 30, durationInFrames: 60,
    render(frame, n) {
      MS.clearFrame(frame, [11, 13, 18]);
      const keys = [0, 15, 30, 45, 59];
      MS.fillCircle(frame, MS.interpolate(n, keys, [10, 54, 54, 10, 10]), MS.interpolate(n, keys, [10, 10, 30, 30, 10]), 4, MS.hex("#EAF0FA"));
    },
  }));

  MS.visual(L, "A color ramp through three stops (interpolateColors)", () => {
    const f = MS.createFrame(96, 12);
    const stops = [MS.hex("#1A2740"), MS.hex("#5B8CFF"), MS.hex("#FF5C8A")];
    for (let x = 0; x < f.width; x++) MS.fillRect(f, x, 0, 1, 12, MS.interpolateColors(x, [0, 48, 95], stops));
    return f;
  });
})(globalThis.MS = globalThis.MS || {});
