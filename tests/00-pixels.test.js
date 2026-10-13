// tests/00-pixels.test.js — PROVIDED. Read a failing test to see what's expected.
(function (MS) {
  const L = "00";
  const count = (f, pred) => { let n = 0; for (let i = 0; i < f.data.length; i += 4) if (pred(f.data, i)) n++; return n; };

  MS.test(L, "createFrame makes width × height × 4 bytes, all zero", t => {
    const f = MS.createFrame(3, 2);
    t.eq(f.width, 3, "width"); t.eq(f.height, 2, "height");
    t.ok(f.data instanceof Uint8ClampedArray, "data should be a Uint8ClampedArray");
    t.eq(f.data.length, 24, "3 × 2 pixels × 4 channels");
    t.ok(f.data.every(v => v === 0), "every byte starts at 0 (transparent black)");
  });

  MS.test(L, "createFrame rejects sizes that aren't positive whole numbers", t => {
    t.throws(() => MS.createFrame(0, 5), "width 0 should throw");
    t.throws(() => MS.createFrame(4, -1), "negative height should throw");
    t.throws(() => MS.createFrame(2.5, 2), "width 2.5 should throw");
  });

  MS.test(L, "pixelIndex walks rows left to right, 4 bytes per pixel", t => {
    const f = MS.createFrame(10, 5);
    t.eq(MS.pixelIndex(f, 0, 0), 0, "(0, 0)");
    t.eq(MS.pixelIndex(f, 1, 0), 4, "(1, 0) is one pixel = 4 bytes later");
    t.eq(MS.pixelIndex(f, 0, 1), 40, "(0, 1) skips a whole row of 10 pixels");
    t.eq(MS.pixelIndex(f, 3, 2), 92, "(3, 2)");
  });

  MS.test(L, "setPixel writes exactly 4 bytes in the right place", t => {
    const f = MS.createFrame(4, 3);
    MS.setPixel(f, 2, 1, [10, 20, 30, 40]);
    t.pixel(f, 2, 1, [10, 20, 30, 40]);
    t.eq(count(f, (d, i) => d[i] || d[i + 1] || d[i + 2] || d[i + 3]), 1, "only one pixel should change");
  });

  MS.test(L, "setPixel treats a missing alpha as 255", t => {
    const f = MS.createFrame(2, 2);
    MS.setPixel(f, 1, 1, [91, 140, 255]);
    t.pixel(f, 1, 1, [91, 140, 255, 255]);
  });

  MS.test(L, "setPixel rounds fractional coordinates down", t => {
    const f = MS.createFrame(4, 4);
    MS.setPixel(f, 2.7, 1.2, [255, 0, 0]);
    t.pixel(f, 2, 1, [255, 0, 0, 255]);
  });

  MS.test(L, "setPixel ignores pixels outside the frame (no throw, no wrap-around)", t => {
    const f = MS.createFrame(3, 3);
    MS.setPixel(f, -1, 0, [255, 255, 255]);
    MS.setPixel(f, 3, 0, [255, 255, 255]);   // x = width must NOT land on (0, 1)
    MS.setPixel(f, 0, 3, [255, 255, 255]);
    MS.setPixel(f, 0, -1, [255, 255, 255]);
    t.ok(f.data.every(v => v === 0), "nothing should be drawn; check (0, 1) for wrap-around");
  });

  MS.test(L, "Uint8ClampedArray clamps and rounds for you", t => {
    const f = MS.createFrame(1, 1);
    MS.setPixel(f, 0, 0, [300, -5, 127.6]);
    t.pixel(f, 0, 0, [255, 0, 128, 255], "300 → 255, −5 → 0, 127.6 → 128");
  });

  MS.test(L, "getPixel reads back what setPixel wrote", t => {
    const f = MS.createFrame(5, 5);
    MS.setPixel(f, 4, 4, [1, 2, 3, 4]);
    t.deep(MS.getPixel(f, 4, 4), [1, 2, 3, 4]);
    t.deep(MS.getPixel(f, 4.9, 4.1), [1, 2, 3, 4], "fractional coordinates round down");
    t.ok(Array.isArray(MS.getPixel(f, 0, 0)), "getPixel should return a plain array");
  });

  MS.test(L, "getPixel returns null outside the frame", t => {
    const f = MS.createFrame(2, 2);
    t.eq(MS.getPixel(f, 2, 0), null, "x = width");
    t.eq(MS.getPixel(f, 0, -1), null, "y = -1");
  });

  MS.test(L, "clearFrame fills every pixel", t => {
    const f = MS.createFrame(6, 4);
    MS.clearFrame(f, [11, 13, 18]);
    t.eq(count(f, (d, i) => d[i] === 11 && d[i + 1] === 13 && d[i + 2] === 18 && d[i + 3] === 255), 24, "all 24 pixels should be [11, 13, 18, 255]");
  });

  // ---- pictures for tests.html ----
  MS.visual(L, "Checkerboard: every other pixel, via setPixel", () => {
    const f = MS.createFrame(16, 16);
    MS.clearFrame(f, [26, 39, 64]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x + y) % 2 === 0) MS.setPixel(f, x, y, [234, 240, 250]);
    return f;
  });
  MS.visual(L, "XOR pattern: color = x ^ y", () => {
    const f = MS.createFrame(64, 64);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const v = (x ^ y) * 4; MS.setPixel(f, x, y, [v, 140, 255 - v]); }
    return f;
  });
})(globalThis.MS = globalThis.MS || {});
