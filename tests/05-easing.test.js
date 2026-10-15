// tests/05-easing.test.js — PROVIDED. Read a failing test to see what's expected.
(function (MS) {
  const L = "05";

  MS.test(L, "bezierPoint starts at 0 and ends at 1", t => {
    t.close(MS.bezierPoint(0.3, 0.9, 0), 0, 1e-12, "u = 0");
    t.close(MS.bezierPoint(0.3, 0.9, 1), 1, 1e-12, "u = 1");
  });

  MS.test(L, "bezierPoint in between", t => {
    t.close(MS.bezierPoint(0.2, 0.8, 0.25), 0.2125, 1e-12, "p1 = 0.2, p2 = 0.8, u = 0.25");
    t.close(MS.bezierPoint(1, 1, 0.5), 0.875, 1e-12, "p1 = p2 = 1, u = 0.5");
    t.close(MS.bezierPoint(1.5, -0.5, 0.25), 0.578125, 1e-12, "control values can be outside 0–1");
  });

  MS.test(L, "bezierPoint with control values 1/3 and 2/3 is a straight line", t => {
    for (const u of [0.1, 0.37, 0.9]) t.close(MS.bezierPoint(1 / 3, 2 / 3, u), u, 1e-12, `u = ${u}`);
  });

  MS.test(L, "bezierSlope at the ends: 3 × p1 at the start, 3 × (1 − p2) at the end", t => {
    t.close(MS.bezierSlope(0.3, 0.9, 0), 0.9, 1e-12, "u = 0");
    t.close(MS.bezierSlope(0.3, 0.9, 1), 0.3, 1e-12, "u = 1");
  });

  MS.test(L, "bezierSlope in between", t => {
    t.close(MS.bezierSlope(0.2, 0.8, 0.25), 1.05, 1e-12, "p1 = 0.2, p2 = 0.8, u = 0.25");
    t.close(MS.bezierSlope(1 / 3, 2 / 3, 0.4), 1, 1e-12, "a straight line has slope 1 everywhere");
    t.close(MS.bezierSlope(1, 0, 0.5), 0, 1e-12, "this curve goes flat in the middle");
  });

  MS.test(L, "bezierSlope is how fast bezierPoint changes", t => {
    const h = 1e-6;
    for (const u of [0.15, 0.5, 0.8]) {
      const rate = (MS.bezierPoint(0.7, 0.1, u + h) - MS.bezierPoint(0.7, 0.1, u - h)) / (2 * h);
      t.close(MS.bezierSlope(0.7, 0.1, u), rate, 1e-6, `u = ${u}`);
    }
  });

  MS.test(L, "solveBezierX: x = 0 gives u = 0, x = 1 gives u = 1", t => {
    t.eq(MS.solveBezierX(0.25, 0.25, 0), 0, "x = 0");
    t.eq(MS.solveBezierX(0.25, 0.25, 1), 1, "x = 1");
  });

  // u must be in 0–1, and the curve's x at u must be within 1e-7 of the x asked for.
  const solves = (t, x1, x2, x) => {
    const u = MS.solveBezierX(x1, x2, x), where = `x1 = ${x1}, x2 = ${x2}, x = ${x}`;
    t.ok(typeof u === "number" && u >= 0 && u <= 1, `${where}: u should be between 0 and 1, got ${u}`);
    t.close(MS.bezierPoint(x1, x2, u), x, 1e-7, `${where}: the curve's x at your u`);
  };

  MS.test(L, "solveBezierX finds the u whose x matches", t => {
    for (const x of [0.1, 0.3, 0.6, 0.9]) solves(t, 0.25, 0.25, x);
    for (const x of [0.05, 0.5, 0.95]) solves(t, 0.42, 1, x);
  });

  MS.test(L, "solveBezierX still works where the curve goes flat", t => {
    for (const x of [0.3, 0.49, 0.5, 0.51]) solves(t, 1, 0, x);   // flat in the middle
    solves(t, 0, 0, 0.000001);                                     // flat at the start
    solves(t, 1, 1, 0.999999);                                     // flat at the end
  });

  MS.test(L, "cubicBezier makes an easing function: 0 at the start, 1 at the end", t => {
    const f = MS.cubicBezier(0.25, 0.1, 0.25, 1);
    t.eq(typeof f, "function", "cubicBezier returns a function");
    t.eq(f(0), 0, "x = 0");
    t.eq(f(1), 1, "x = 1");
  });

  MS.test(L, "cubicBezier: x below 0 or above 1 is clamped first", t => {
    const f = MS.cubicBezier(0.25, 0.1, 0.25, 1);
    t.eq(f(-0.5), 0, "x = −0.5");
    t.eq(f(1.5), 1, "x = 1.5");
  });

  MS.test(L, "cubicBezier: a straight line gives x back", t => {
    const f = MS.cubicBezier(0.3, 0.3, 0.7, 0.7);
    for (const x of [0.1, 0.45, 0.8]) t.close(f(x), x, 1e-6, `x = ${x}`);
  });

  MS.test(L, "cubicBezier matches the browser's ease-in and ease-out", t => {
    t.close(MS.cubicBezier(0.42, 0, 1, 1)(0.5), 0.315357, 1e-5, "ease-in at x = 0.5");
    t.close(MS.cubicBezier(0, 0, 0.58, 1)(0.5), 0.684643, 1e-5, "ease-out at x = 0.5");
    const inOut = MS.cubicBezier(0.42, 0, 0.58, 1);
    t.close(inOut(0.2) + inOut(0.8), 1, 1e-6, "ease-in-out is symmetric: f(0.2) + f(0.8) = 1");
  });

  MS.test(L, "cubicBezier lets y overshoot past 1", t => {
    const back = MS.cubicBezier(0.34, 1.56, 0.64, 1);
    t.ok(back(0.6) > 1, `this curve goes past 1 before settling; at x = 0.6 it gave ${back(0.6)}`);
  });

  MS.test(L, "cubicBezier rejects x control points outside 0–1, but y can be anything", t => {
    t.throws(() => MS.cubicBezier(-0.1, 0, 0.5, 1), "x1 = −0.1");
    t.throws(() => MS.cubicBezier(0.5, 0, 1.2, 1), "x2 = 1.2");
    MS.cubicBezier(0, 0, 1, 1);
    MS.cubicBezier(1, 0, 0, 1);
    MS.cubicBezier(0.5, -2, 0.5, 3);
  });

  // ---- pictures ----
  const CURVES = [
    ["LINEAR", [0, 0, 1, 1]], ["EASE", [0.25, 0.1, 0.25, 1]], ["APPLE", [0.16, 1, 0.3, 1]],
    ["SMOOTH", [0.6, 0, 0.2, 1]], ["BACK", [0.34, 1.56, 0.64, 1]],
  ];
  const BG = [11, 13, 18], INK = [234, 240, 250, 255], DIM = [60, 70, 90], BLUE = [91, 140, 255, 255];   // #EAF0FA, #5B8CFF

  MS.visual(L, "Five easing curves: time goes right, progress goes up", () => {
    const S = 36, H = 48, PAD = 6, f = MS.createFrame(CURVES.length * (S + PAD) + PAD, H + 18);
    MS.clearFrame(f, BG);
    CURVES.forEach(([name, [x1, y1, x2, y2]], i) => {
      const ox = PAD + i * (S + PAD), oy = 4, ease = MS.cubicBezier(x1, y1, x2, y2);
      const at = (x, y) => [ox + x * (S - 1), oy + (H - 1) * (1 - 0.6 * y)];   // y = 1 sits 40% from the top: room to overshoot
      for (let k = 0; k <= 40; k++) {   // the control handles, P0 → P1 and P3 → P2
        MS.fillRect(f, ...at(MS.lerp(0, x1, k / 40), MS.lerp(0, y1, k / 40)), 1, 1, DIM);
        MS.fillRect(f, ...at(MS.lerp(1, x2, k / 40), MS.lerp(1, y2, k / 40)), 1, 1, DIM);
      }
      for (let k = 0; k <= 200; k++) MS.fillRect(f, ...at(k / 200, ease(k / 200)), 1, 1, INK);
      MS.fillCircle(f, ...at(x1, y1), 1.5, BLUE);
      MS.fillCircle(f, ...at(x2, y2), 1.5, BLUE);
      MS.drawText(f, name, ox + S / 2, H + 8, 1, DIM, { align: "center" });
    });
    return f;
  });

  MS.animation(L, "The same move in the same second, with five timings", () => MS.createComposition({
    width: 120, height: CURVES.length * 10 + 4, fps: 30, durationInFrames: 45,
    render(frame, n) {
      MS.clearFrame(frame, BG);
      CURVES.forEach(([name, c], i) => {
        const y = 3 + i * 10;
        MS.drawText(frame, name, 2, y + 1, 1, DIM);
        MS.fillRect(frame, 40, y + 4, 76, 1, [30, 36, 50]);
        const x = MS.interpolate(n, [0, 30], [40, 110], { easing: MS.cubicBezier(...c), extrapolateRight: "clamp" });
        MS.fillCircle(frame, x + 3, y + 4.5, 3, INK);
      });
    },
  }));

  MS.animation(L, "KineticIntro's timing: a word rises in with APPLE, fades out with SMOOTH", () => {
    const APPLE = MS.cubicBezier(0.16, 1, 0.3, 1), SMOOTH = MS.cubicBezier(0.6, 0, 0.2, 1);
    return MS.createComposition({
      width: 100, height: 30, fps: 30, durationInFrames: 60,
      render(frame, n) {
        MS.clearFrame(frame, BG);
        const y = MS.interpolate(n, [2, 24], [30, 8], { easing: APPLE, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const fade = MS.interpolate(n, [30, 52], [1, 0], { easing: SMOOTH, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        MS.drawText(frame, "DESIGN.", 50, y, 2, [...INK.slice(0, 3), Math.round(255 * fade)], { align: "center" });
        MS.fillRect(frame, 0, 22, 100, 8, BG);   // a mask: the word rises from behind this edge
      },
    });
  });
})(globalThis.MS = globalThis.MS || {});
