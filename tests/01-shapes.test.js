// tests/01-shapes.test.js — PROVIDED. Read a failing test to see what's expected.
(function (MS) {
  const L = "01";
  const inked = f => { let n = 0; for (let i = 3; i < f.data.length; i += 4) if (f.data[i]) n++; return n; };

  MS.test(L, "hex parses #RRGGBB into [r, g, b, a]", t => {
    t.deep(MS.hex("#5B8CFF"), [91, 140, 255, 255]);
    t.deep(MS.hex("1a2740"), [26, 39, 64, 255], "no #, lowercase");
    t.deep(MS.hex("#0B0D12", 128), [11, 13, 18, 128], "custom alpha");
  });

  MS.test(L, "hex rejects anything that isn't 6 hex digits", t => {
    t.throws(() => MS.hex("#FFF"), "short form #FFF isn't supported");
    t.throws(() => MS.hex("blue"), "color names aren't hex");
    t.throws(() => MS.hex("#12345G"), "G isn't a hex digit");
  });

  MS.test(L, "blendPixel: an opaque color simply replaces", t => {
    const f = MS.createFrame(1, 1);
    MS.setPixel(f, 0, 0, [0, 0, 255]);
    MS.blendPixel(f, 0, 0, [255, 0, 0, 255]);
    t.pixel(f, 0, 0, [255, 0, 0, 255]);
  });

  MS.test(L, "blendPixel: alpha 0 changes nothing", t => {
    const f = MS.createFrame(1, 1);
    MS.setPixel(f, 0, 0, [0, 0, 255]);
    MS.blendPixel(f, 0, 0, [255, 0, 0, 0]);
    t.pixel(f, 0, 0, [0, 0, 255, 255]);
  });

  MS.test(L, "blendPixel: half-transparent red over opaque blue", t => {
    const f = MS.createFrame(1, 1);
    MS.setPixel(f, 0, 0, [0, 0, 255]);
    MS.blendPixel(f, 0, 0, [255, 0, 0, 128]);
    t.pixel(f, 0, 0, [128, 0, 127, 255], "about halfway between red and blue", 1);
  });

  MS.test(L, "blendPixel: onto a transparent pixel keeps the color, not a darkened one", t => {
    const f = MS.createFrame(1, 1);
    MS.blendPixel(f, 0, 0, [255, 0, 0, 128]);
    t.pixel(f, 0, 0, [255, 0, 0, 128], "still pure red, just half transparent", 1);
  });

  MS.test(L, "blendPixel: half red over half blue", t => {
    const f = MS.createFrame(1, 1);
    MS.setPixel(f, 0, 0, [0, 0, 255, 128]);
    MS.blendPixel(f, 0, 0, [255, 0, 0, 128]);
    t.pixel(f, 0, 0, [170, 0, 85, 192], "alpha adds up to about 75%", 1);
  });

  MS.test(L, "blendPixel ignores pixels outside the frame", t => {
    const f = MS.createFrame(2, 2);
    MS.blendPixel(f, 2, 0, [255, 255, 255]);
    MS.blendPixel(f, -1, 1, [255, 255, 255]);
    t.eq(inked(f), 0);
  });

  MS.test(L, "fillRect covers exactly w × h pixels", t => {
    const f = MS.createFrame(10, 10);
    MS.fillRect(f, 2, 3, 4, 2, [255, 255, 255]);
    t.eq(inked(f), 8, "4 × 2 = 8 pixels");
    t.pixel(f, 2, 3, [255, 255, 255, 255], "top-left corner is inside");
    t.pixel(f, 5, 4, [255, 255, 255, 255], "bottom-right pixel is inside");
    t.pixel(f, 6, 4, [0, 0, 0, 0], "x + w is outside (exclusive)");
    t.pixel(f, 2, 5, [0, 0, 0, 0], "y + h is outside (exclusive)");
  });

  MS.test(L, "fillRect rounds edges and clips to the frame", t => {
    const f = MS.createFrame(5, 5);
    MS.fillRect(f, -3, 1.6, 5, 1, [255, 255, 255]);   // x −3..2 → 0..2, y 1.6..2.6 → rows 2
    t.eq(inked(f), 2, "only x = 0 and 1 on row 2 are inside the frame");
    t.pixel(f, 1, 2, [255, 255, 255, 255]);
  });

  MS.test(L, "fillRect blends instead of overwriting", t => {
    const f = MS.createFrame(1, 1);
    MS.setPixel(f, 0, 0, [0, 0, 255]);
    MS.fillRect(f, 0, 0, 1, 1, [255, 0, 0, 128]);
    t.pixel(f, 0, 0, [128, 0, 127, 255], "", 1);
  });

  MS.test(L, "fillCircle tests each pixel's center against the radius", t => {
    const a = MS.createFrame(21, 21);
    MS.fillCircle(a, 10.5, 10.5, 5, [255, 255, 255]);
    t.eq(inked(a), 81, "radius 5 centered on a pixel center covers 81 pixels");
    t.pixel(a, 10, 10, [255, 255, 255, 255], "center");
    t.pixel(a, 10, 4, [0, 0, 0, 0], "just outside the top");
    const b = MS.createFrame(20, 20);
    MS.fillCircle(b, 10, 10, 3.2, [255, 255, 255]);
    t.eq(inked(b), 32, "radius 3.2 centered on a pixel corner covers 32 pixels");
  });

  MS.test(L, "fillCircle clips at the frame edge", t => {
    const f = MS.createFrame(10, 10);
    MS.fillCircle(f, 0, 0, 3, [255, 255, 255]);
    t.ok(inked(f) > 0 && inked(f) < 12, "a quarter circle should be drawn without errors");
  });

  MS.test(L, "mixColor blends all four channels", t => {
    t.deep(MS.mixColor([0, 0, 0], [255, 100, 50, 0], 0), [0, 0, 0, 255], "t = 0 gives a (alpha defaults to 255)");
    t.deep(MS.mixColor([0, 0, 0], [255, 100, 50, 0], 1), [255, 100, 50, 0], "t = 1 gives b");
    t.deep(MS.mixColor([0, 0, 0], [255, 100, 50, 0], 0.5), [127.5, 50, 25, 127.5], "halfway, unrounded");
  });

  MS.test(L, "fillVerticalGradient samples each row at its middle", t => {
    const f = MS.createFrame(1, 2);
    MS.fillVerticalGradient(f, [0, 0, 0], [200, 100, 40]);
    t.pixel(f, 0, 0, [50, 25, 10, 255], "row 0 uses t = 0.25");
    t.pixel(f, 0, 1, [150, 75, 30, 255], "row 1 uses t = 0.75");
  });

  MS.test(L, "fillRadialGradient fades from inner to outer", t => {
    const f = MS.createFrame(4, 4);
    MS.fillRadialGradient(f, 2, 2, 2, 2, [255, 255, 255], [0, 0, 0]);
    t.pixel(f, 1, 1, [165, 165, 165, 255], "near the center", 1);
    t.pixel(f, 0, 1, [53, 53, 53, 255], "farther out", 1);
    t.pixel(f, 0, 0, [0, 0, 0, 255], "the corner is past the radius, so pure outer");
  });

  MS.test(L, "fillRadialGradient stretches into an ellipse", t => {
    const f = MS.createFrame(40, 10);
    MS.fillRadialGradient(f, 20, 5, 20, 5, [255, 255, 255], [0, 0, 0]);
    const left = MS.getPixel(f, 0, 5)[0], top = MS.getPixel(f, 20, 0)[0];
    t.close(left, top, 30, "the left edge and top edge are both about one radius away");
  });

  // ---- pictures ----
  MS.visual(L, "Shapes, blended", () => {
    const f = MS.createFrame(96, 64);
    MS.clearFrame(f, MS.hex("#0B0D12"));
    MS.fillRect(f, 8, 8, 44, 30, MS.hex("#5B8CFF"));
    MS.fillCircle(f, 52, 36, 20, MS.hex("#FF5C8A", 170));
    MS.fillRect(f, 40, 20, 48, 12, MS.hex("#EAF0FA", 90));
    return f;
  });
  MS.visual(L, "Motion Studio's background: radial-gradient(70% 60% at 50% 38%, #1A2740, #0B0D12)", () => {
    const f = MS.createFrame(108, 192);
    MS.fillRadialGradient(f, 108 * 0.5, 192 * 0.38, 108 * 0.7, 192 * 0.6, MS.hex("#1A2740"), MS.hex("#0B0D12"));
    return f;
  });
})(globalThis.MS = globalThis.MS || {});
