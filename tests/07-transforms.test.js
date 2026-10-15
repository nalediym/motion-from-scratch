// tests/07-transforms.test.js — PROVIDED. Read a failing test to see what's expected.
(function (MS) {
  const L = "07";
  const pt = (m, x, y) => MS.transformPoint(m, x, y);
  const closePt = (t, got, want, msg) => {
    t.ok(Array.isArray(got) && got.length === 2, `${msg}: expected [x, y], got ${got}`);
    t.close(got[0], want[0], 1e-9, msg + " (x)");
    t.close(got[1], want[1], 1e-9, msg + " (y)");
  };
  const closeMatrix = (t, got, want, msg) => {
    t.ok(Array.isArray(got) && got.length === 6, `${msg}: expected [a, b, c, d, e, f], got ${got}`);
    want.forEach((w, i) => t.close(got[i], w, 1e-9, `${msg}, entry ${"abcdef"[i]}`));
  };
  const closePixel = (t, got, want, msg) => {
    t.ok(got, `${msg}: no pixel`);
    want.forEach((w, i) => t.close(got[i], w, 1, `${msg}, ${["red", "green", "blue", "alpha"][i]}`));
  };
  const filled = (w, h, color) => { const f = MS.createFrame(w, h); MS.clearFrame(f, color); return f; };

  MS.test(L, "translate moves every point by the same amount", t => {
    closePt(t, pt(MS.translate(5, -2), 0, 0), [5, -2], "the origin");
    closePt(t, pt(MS.translate(5, -2), 10, 10), [15, 8], "(10, 10)");
  });

  MS.test(L, "scale: one number scales both directions, two scale x and y apart", t => {
    closePt(t, pt(MS.scale(3), 2, -1), [6, -3], "scale(3)");
    closePt(t, pt(MS.scale(2, 0.5), 4, 4), [8, 2], "scale(2, 0.5)");
    closePt(t, pt(MS.scale(-1, 1), 7, 3), [-7, 3], "a mirror");
  });

  MS.test(L, "rotate turns +x toward +y (clockwise on a screen, where y points down)", t => {
    closePt(t, pt(MS.rotate(Math.PI / 2), 1, 0), [0, 1], "90°: right becomes down");
    closePt(t, pt(MS.rotate(Math.PI / 2), 0, 1), [-1, 0], "90°: down becomes left");
    closePt(t, pt(MS.rotate(Math.PI / 6), 10, 0), [10 * Math.cos(Math.PI / 6), 5], "30°");
  });

  MS.test(L, "transformPoint uses all six numbers in canvas's order", t => {
    closePt(t, pt([2, 1, -1, 3, 5, 7], 2, 3), [6, 18], "[a, b, c, d, e, f] = [2, 1, -1, 3, 5, 7] at (2, 3)");
    closePt(t, pt([1, 0, 0, 1, 0, 0], 4, 9), [4, 9], "the identity matrix changes nothing");
  });

  MS.test(L, "multiply(m, n) does n first, then m", t => {
    closePt(t, pt(MS.multiply(MS.translate(10, 0), MS.scale(3)), 1, 1), [13, 3], "scale by 3, then move right 10");
    closePt(t, pt(MS.multiply(MS.scale(3), MS.translate(10, 0)), 1, 1), [33, 3], "move right 10, then scale by 3");
  });

  MS.test(L, "multiply works for any two matrices", t => {
    const m = [2, 1, -1, 3, 5, 7], n = [0.5, -2, 4, 1, -3, 6];
    const [x, y] = pt(n, 1.5, -2);
    closePt(t, pt(MS.multiply(m, n), 1.5, -2), pt(m, x, y), "one matrix that does n, then m");
    closeMatrix(t, MS.multiply(m, n), [3, -5.5, 7, 7, -7, 22], "the product");
  });

  MS.test(L, "invert undoes a matrix", t => {
    closeMatrix(t, MS.invert(MS.translate(3, 4)), [1, 0, 0, 1, -3, -4], "translate(3, 4)");
    closeMatrix(t, MS.invert(MS.scale(2, 4)), [0.5, 0, 0, 0.25, 0, 0], "scale(2, 4)");
    const m = [2, 1, -1, 3, 5, 7], [x, y] = pt(m, -4, 9);
    closePt(t, pt(MS.invert(m), x, y), [-4, 9], "there and back again");
  });

  MS.test(L, "invert returns null for a matrix that squashes everything flat", t => {
    t.eq(MS.invert(MS.scale(0, 1)), null, "scale(0, 1)");
    t.eq(MS.invert([1, 2, 2, 4, 9, 9]), null, "a matrix whose two columns point the same way");
  });

  MS.test(L, "drawTransformed: a whole-pixel move copies pixels exactly and leaves the rest alone", t => {
    const src = MS.createFrame(2, 2);
    MS.setPixel(src, 0, 0, [255, 0, 0]); MS.setPixel(src, 1, 0, [0, 255, 0]); MS.setPixel(src, 0, 1, [0, 0, 255]); MS.setPixel(src, 1, 1, [255, 255, 0, 128]);
    const dest = filled(5, 4, [9, 9, 9]);
    MS.drawTransformed(dest, src, MS.translate(2, 1));
    t.deep(MS.getPixel(dest, 2, 1), [255, 0, 0, 255], "pixel (2, 1)");
    t.deep(MS.getPixel(dest, 3, 1), [0, 255, 0, 255], "pixel (3, 1)");
    t.deep(MS.getPixel(dest, 2, 2), [0, 0, 255, 255], "pixel (2, 2)");
    t.deep(MS.getPixel(dest, 1, 1), [9, 9, 9, 255], "pixel (1, 1) is outside the copy");
    t.deep(MS.getPixel(dest, 4, 3), [9, 9, 9, 255], "pixel (4, 3) is outside the copy");
  });

  MS.test(L, "drawTransformed: a mirror lands every pixel in its mirrored place", t => {
    const src = MS.createFrame(4, 1);
    [10, 20, 30, 40].forEach((v, x) => MS.setPixel(src, x, 0, [v, v, v]));
    const dest = MS.createFrame(4, 1);
    MS.drawTransformed(dest, src, MS.multiply(MS.translate(4, 0), MS.scale(-1, 1)));
    t.deep([0, 1, 2, 3].map(x => MS.getPixel(dest, x, 0)[0]), [40, 30, 20, 10], "red channel, left to right");
  });

  MS.test(L, "drawTransformed: between source pixels it blends the four nearest (bilinear)", t => {
    const src = MS.createFrame(2, 2);
    for (const y of [0, 1]) { MS.setPixel(src, 0, y, [200, 0, 0]); MS.setPixel(src, 1, y, [0, 0, 200]); }
    const dest = MS.createFrame(4, 4);
    MS.drawTransformed(dest, src, MS.scale(2));
    closePixel(t, MS.getPixel(dest, 1, 1), [150, 0, 50, 255], "pixel (1, 1): its center is a quarter of the way from red to blue");
    closePixel(t, MS.getPixel(dest, 2, 1), [50, 0, 150, 255], "pixel (2, 1): three quarters of the way");
    closePixel(t, MS.getPixel(dest, 0, 1), [200, 0, 0, 191], "pixel (0, 1): a quarter of its sample falls outside the source, which is transparent");
  });

  MS.test(L, "drawTransformed: transparent neighbors fade the edge without darkening it", t => {
    const dest = MS.createFrame(5, 4);
    MS.drawTransformed(dest, filled(2, 2, [255, 255, 255]), MS.translate(1.5, 1));
    closePixel(t, MS.getPixel(dest, 1, 1), [255, 255, 255, 128], "the left edge, half covered: still white, half transparent");
    closePixel(t, MS.getPixel(dest, 2, 1), [255, 255, 255, 255], "fully covered");
    closePixel(t, MS.getPixel(dest, 3, 1), [255, 255, 255, 128], "the right edge");
  });

  MS.test(L, "drawTransformed: opacity scales the alpha, then it blends over what's there", t => {
    const dest = filled(4, 4, [0, 0, 100]);
    MS.drawTransformed(dest, filled(2, 2, [255, 255, 255]), MS.translate(1, 1), 0.25);
    closePixel(t, MS.getPixel(dest, 1, 1), [64, 64, 139, 255], "a quarter of the way from the background to white");
    t.deep(MS.getPixel(dest, 0, 0), [0, 0, 100, 255], "outside the copy");
  });

  MS.test(L, "drawTransformed: a matrix that can't be inverted draws nothing", t => {
    const dest = filled(3, 3, [9, 9, 9]);
    MS.drawTransformed(dest, filled(2, 2, [255, 255, 255]), MS.scale(0, 1));
    t.deep(MS.getPixel(dest, 0, 0), [9, 9, 9, 255], "pixel (0, 0)");
    t.deep(MS.getPixel(dest, 1, 1), [9, 9, 9, 255], "pixel (1, 1)");
  });

  MS.test(L, "boxBlur spreads one pixel evenly over a (2r + 1) × (2r + 1) square", t => {
    const f = MS.createFrame(7, 7);
    MS.setPixel(f, 3, 3, [255, 0, 0]);
    const out = MS.boxBlur(f, 1);
    closePixel(t, MS.getPixel(out, 3, 3), [255, 0, 0, 28], "the center: 1/9 of the alpha");
    closePixel(t, MS.getPixel(out, 2, 4), [255, 0, 0, 28], "a corner of the square");
    t.eq(MS.getPixel(out, 1, 3)[3], 0, "outside the square, alpha");
  });

  MS.test(L, "boxBlur: pixels outside the frame count as transparent", t => {
    const out = MS.boxBlur(filled(5, 5, [255, 255, 255]), 1);
    closePixel(t, MS.getPixel(out, 2, 2), [255, 255, 255, 255], "the middle");
    closePixel(t, MS.getPixel(out, 2, 0), [255, 255, 255, 170], "an edge: 6 of its 9 neighbors are inside");
    closePixel(t, MS.getPixel(out, 0, 0), [255, 255, 255, 113], "a corner: 4 of 9");
  });

  MS.test(L, "boxBlur returns a new frame, and r = 0 gives an unchanged copy", t => {
    const f = MS.createFrame(3, 3);
    MS.setPixel(f, 1, 1, [10, 20, 30]);
    const out = MS.boxBlur(f, 1);
    t.ok(out !== f && out.data !== f.data, "it should return a new frame");
    t.deep(MS.getPixel(f, 1, 1), [10, 20, 30, 255], "the original is untouched");
    const copy = MS.boxBlur(f, 0);
    t.ok(copy !== f && copy.data !== f.data, "r = 0 should still return a new frame");
    t.deep(copy.data, f.data, "r = 0 changes nothing");
  });

  MS.test(L, "blur(σ) is three box blurs of radius round((√(1 + 4σ²) − 1) ÷ 2)", t => {
    const f = MS.createFrame(15, 9);
    MS.fillRect(f, 5, 3, 4, 2, [255, 200, 0]);
    MS.setPixel(f, 12, 6, [0, 120, 255, 200]);
    const three = r => MS.boxBlur(MS.boxBlur(MS.boxBlur(f, r), r), r);
    t.deep(MS.blur(f, 2.5).data, three(2).data, "σ = 2.5 → r = 2");
    t.deep(MS.blur(f, 3).data, three(3).data, "σ = 3 → r = 3 (2.54 rounds up)");
    t.deep(MS.blur(f, 1.2).data, three(1).data, "σ = 1.2 → r = 1 (0.8 rounds up)");
    t.deep(MS.blur(f, 0.4).data, f.data, "σ = 0.4 → r = 0: nothing changes");
  });

  // ---- pictures ----
  const BG = [11, 13, 18], INK = [234, 240, 250, 255], BLUE = [91, 140, 255, 255], DIM = [60, 70, 90];
  const word = (text, color, size = 1) => {
    const f = MS.createFrame(MS.measureText(text, size) + 2, 7 * size + 2);
    MS.drawText(f, text, 1, 1, size, color);
    return f;
  };
  const about = (cx, cy, m) => MS.multiply(MS.translate(cx, cy), MS.multiply(m, MS.translate(-cx, -cy)));

  MS.visual(L, "One sprite through five matrices: moved, scaled 3×, rotated, sheared and mirrored", () => {
    const s = word("MS", INK), f = MS.createFrame(200, 40);
    MS.clearFrame(f, BG);
    const at = (x, m) => MS.multiply(MS.translate(x, 20), MS.multiply(m, MS.translate(-s.width / 2, -s.height / 2)));
    MS.drawTransformed(f, s, at(16, MS.scale(1)));
    MS.drawTransformed(f, s, at(54, MS.scale(3)));
    MS.drawTransformed(f, s, at(100, MS.multiply(MS.rotate(-Math.PI / 6), MS.scale(2.5))));
    MS.drawTransformed(f, s, at(142, MS.multiply([1, 0, -0.6, 1, 0, 0], MS.scale(2.5))));
    MS.drawTransformed(f, s, at(182, MS.scale(-2.5, 2.5)));
    return f;
  });

  MS.visual(L, "The same word blurred with σ = 0, 1, 2 and 4", () => {
    const s = word("BLUR", BLUE, 2), pad = 12, f = MS.createFrame(4 * (s.width + 2 * pad), s.height + 2 * pad);
    MS.clearFrame(f, BG);
    [0, 1, 2, 4].forEach((sigma, i) => {
      const big = MS.createFrame(s.width + 2 * pad, s.height + 2 * pad);
      MS.drawTransformed(big, s, MS.translate(pad, pad));
      MS.drawTransformed(f, MS.blur(big, sigma), MS.translate(i * big.width, 0));
    });
    return f;
  });

  MS.animation(L, "A word pushing in out of a blur, then spinning away", () => {
    const s = word("HELLO", INK), W = 120, H = 44, APPLE = MS.cubicBezier(0.16, 1, 0.3, 1);
    return MS.createComposition({
      width: W, height: H, fps: 30, durationInFrames: 60,
      render(frame, n) {
        MS.clearFrame(frame, BG);
        const enter = APPLE(MS.clamp(n / 24, 0, 1)), exit = MS.clamp((n - 40) / 20, 0, 1);
        const big = MS.createFrame(s.width + 16, s.height + 16);
        MS.drawTransformed(big, s, MS.translate(8, 8));
        const sprite = MS.blur(big, (1 - enter) * 3);
        const m = MS.multiply(MS.rotate(exit * Math.PI), MS.scale(MS.lerp(1.6, 3, enter) * (1 - exit)));
        MS.drawTransformed(frame, sprite, MS.multiply(about(W / 2, H / 2, m), MS.translate(W / 2 - sprite.width / 2, H / 2 - sprite.height / 2)), enter);
        MS.fillRect(frame, 0, H - 2, W * n / 59, 1, DIM);
      },
    });
  });
})(globalThis.MS = globalThis.MS || {});
