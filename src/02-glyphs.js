// Layer 02 · Glyphs — text from a hand-made bitmap font.
// Read docs/02-glyphs.md first. Run `node tests/run.js 02` to check your work.
//
// The font lives in lib/font5x7.js as MS.FONT_5x7: an object mapping a
// character to 7 strings of 5 characters, "#" for ink and "." for empty.
// Use fillRect from layer 01 to draw each "#" as a scale × scale block.
(function (MS) {
  const GLYPH_W = 5;
  const GLYPH_H = 7;

  /**
   * Draw one character with its top-left corner at (x, y).
   * Each "#" cell becomes a filled square of size `scale` × `scale`.
   * - The font only has uppercase letters: "a" must draw like "A".
   * - A character missing from the font draws "tofu": a hollow 5 × 7 box
   *   (the outer ring of cells filled, the inside empty).
   */
  function drawGlyph(frame, ch, x, y, scale, color) {
    throw MS.todo("drawGlyph");
  }

  /**
   * How wide is `text` in pixels?
   * Each glyph is GLYPH_W cells wide, and `tracking` empty cells sit
   * BETWEEN glyphs (not after the last one). Multiply cells by `scale`.
   *   measureText("AB", 1)    → 5 + 1 + 5 = 11
   *   measureText("AB", 3)    → 33
   *   measureText("", 3)      → 0
   */
  function measureText(text, scale, tracking = 1) {
    throw MS.todo("measureText");
  }

  /**
   * Draw a line of text and return its width (same number measureText gives).
   * opts.tracking : empty cells between glyphs (default 1)
   * opts.align    : "left" (default) — x is the left edge
   *                 "center"         — x is the middle
   *                 "right"          — x is the right edge
   * A space draws nothing but still takes up a glyph's width.
   */
  function drawText(frame, text, x, y, scale, color, opts = {}) {
    throw MS.todo("drawText");
  }

  Object.assign(MS, { GLYPH_W, GLYPH_H, drawGlyph, measureText, drawText });
})(globalThis.MS = globalThis.MS || {});
