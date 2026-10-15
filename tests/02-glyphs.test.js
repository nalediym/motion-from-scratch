// tests/02-glyphs.test.js — PROVIDED. Read a failing test to see what's expected.
(function (MS) {
  const L = "02";
  const W = [255, 255, 255, 255], EMPTY = [0, 0, 0, 0];
  const inked = f => { let n = 0; for (let i = 3; i < f.data.length; i += 4) if (f.data[i]) n++; return n; };
  const inkCount = ch => MS.FONT_5x7[ch].join("").split("").filter(c => c === "#").length;

  MS.test(L, "measureText: glyph widths plus tracking between them", t => {
    t.eq(MS.measureText("", 3), 0, "empty text is 0 wide");
    t.eq(MS.measureText("A", 1), 5, "one glyph, no gap");
    t.eq(MS.measureText("AB", 1), 11, "5 + 1 + 5");
    t.eq(MS.measureText("AB", 3), 33, "everything scales");
    t.eq(MS.measureText("AB", 1, 2), 12, "tracking 2 means a 2-cell gap");
    t.eq(MS.measureText("A B", 2), 34, "a space counts as a glyph");
  });

  MS.test(L, "drawGlyph copies the font's # cells at scale 1", t => {
    const f = MS.createFrame(5, 7);
    MS.drawGlyph(f, "R", 0, 0, 1, W);
    const g = MS.FONT_5x7.R;
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++)
      t.pixel(f, c, r, g[r][c] === "#" ? W : EMPTY, `row ${r}, column ${c} of "R"`);
  });

  MS.test(L, "drawGlyph: every cell becomes a scale × scale block", t => {
    const f = MS.createFrame(20, 28);
    MS.drawGlyph(f, "T", 0, 0, 4, W);
    t.eq(inked(f), inkCount("T") * 16, "each # becomes 4 × 4 = 16 pixels");
    t.pixel(f, 19, 3, W, "T's top bar reaches the right edge");
    t.pixel(f, 0, 4, EMPTY, "row 1 of T is empty on the left");
  });

  MS.test(L, "drawGlyph positions the glyph at (x, y)", t => {
    const f = MS.createFrame(12, 10);
    MS.drawGlyph(f, "I", 6, 2, 1, W);
    t.pixel(f, 6, 2, W, "I's top-left cell lands at (6, 2)");
    t.pixel(f, 5, 2, EMPTY, "nothing left of x");
    t.pixel(f, 6, 1, EMPTY, "nothing above y");
  });

  MS.test(L, "drawGlyph draws lowercase as uppercase", t => {
    const a = MS.createFrame(5, 7), b = MS.createFrame(5, 7);
    MS.drawGlyph(a, "g", 0, 0, 1, W);
    MS.drawGlyph(b, "G", 0, 0, 1, W);
    t.deep(a.data, b.data, '"g" should look exactly like "G"');
  });

  MS.test(L, "drawGlyph draws tofu for missing characters", t => {
    const f = MS.createFrame(5, 7);
    MS.drawGlyph(f, "@", 0, 0, 1, W);
    t.pixel(f, 0, 0, W, "top-left corner"); t.pixel(f, 4, 6, W, "bottom-right corner");
    t.pixel(f, 2, 0, W, "top edge"); t.pixel(f, 0, 3, W, "left edge");
    t.pixel(f, 2, 3, EMPTY, "the inside stays empty");
    t.eq(inked(f), 20, "the outer ring of a 5 × 7 box is 20 cells");
  });

  MS.test(L, "drawText advances one glyph plus tracking each character", t => {
    const f = MS.createFrame(30, 7);
    const w = MS.drawText(f, "II", 0, 0, 1, W);
    t.eq(w, 11, "drawText returns the width");
    t.pixel(f, 6, 0, W, "the second I starts at x = 5 + 1");
    t.pixel(f, 5, 0, EMPTY, "the tracking gap is empty");
  });

  MS.test(L, "drawText: spaces take room but draw nothing", t => {
    const f = MS.createFrame(30, 7);
    MS.drawText(f, "I I", 0, 0, 1, W);
    t.eq(inked(f), inkCount("I") * 2, "only the two I's have ink");
    t.pixel(f, 12, 0, W, "the second I starts after a glyph-wide space");
  });

  MS.test(L, "drawText aligns center and right around x", t => {
    const c = MS.createFrame(40, 7);
    MS.drawText(c, "II", 20, 0, 1, W, { align: "center" });   // width 11 → left edge 14.5 → 15 after rounding
    t.pixel(c, 15, 0, W, "centered: left edge near 20 − 11 / 2");
    t.pixel(c, 13, 0, EMPTY);
    const r = MS.createFrame(40, 7);
    MS.drawText(r, "II", 40, 0, 1, W, { align: "right" });
    t.pixel(r, 39, 0, W, "right-aligned: the last column touches x");
    t.pixel(r, 28, 0, EMPTY, "and starts at x − 11");
  });

  MS.test(L, "drawText uses opts.tracking", t => {
    const f = MS.createFrame(30, 7);
    t.eq(MS.drawText(f, "II", 0, 0, 1, W, { tracking: 3 }), 13);
    t.pixel(f, 8, 0, W, "second I starts at 5 + 3");
  });

  MS.test(L, "text blends, so transparent ink shows the background", t => {
    const f = MS.createFrame(5, 7);
    MS.clearFrame(f, [0, 0, 255]);
    MS.drawGlyph(f, "I", 0, 0, 1, [255, 0, 0, 128]);
    t.pixel(f, 0, 0, [128, 0, 127, 255], "half red over blue", 1);
  });

  // ---- pictures ----
  MS.visual(L, "DESIGN. at scale 4", () => {
    const f = MS.createFrame(184, 44);
    MS.clearFrame(f, MS.hex("#0B0D12"));
    MS.drawText(f, "DESIGN.", 92, 8, 4, MS.hex("#EAF0FA"), { align: "center" });   // 164 px wide
    return f;
  });
  MS.visual(L, "Alignment and tofu", () => {
    const f = MS.createFrame(200, 60);
    MS.clearFrame(f, MS.hex("#141821"));
    MS.fillRect(f, 100, 0, 1, 60, MS.hex("#FF5C8A"));
    MS.drawText(f, "LEFT", 100, 6, 2, MS.hex("#EAF0FA"));
    MS.drawText(f, "CENTER", 100, 24, 2, MS.hex("#5B8CFF"), { align: "center" });
    MS.drawText(f, "RIGHT @", 100, 42, 2, MS.hex("#EAF0FA"), { align: "right" });
    return f;
  });
})(globalThis.MS = globalThis.MS || {});
