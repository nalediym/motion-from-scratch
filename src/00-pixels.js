// Layer 00 · Pixels — a framebuffer: memory you can see.
// Read docs/00-pixels.md first. Run `node tests/run.js 00` to check your work.
//
// A frame is a plain object:
//   { width, height, data }
// where `data` is a Uint8ClampedArray holding 4 numbers per pixel, row by row:
//
//   data:  [ R G B A | R G B A | R G B A | ... ]
//            pixel 0   pixel 1   pixel 2
//
// A color is an array [r, g, b] or [r, g, b, a], each 0–255.
// If alpha is missing, treat it as 255 (fully opaque).
(function (MS) {
  /**
   * Make a new frame, every pixel transparent black [0, 0, 0, 0].
   * Throw an Error if width or height is not a positive whole number.
   * @returns {{ width: number, height: number, data: Uint8ClampedArray }}
   */
  function createFrame(width, height) {
    throw MS.todo("createFrame");
  }

  /**
   * Where does pixel (x, y) start inside frame.data?
   * Return the index of its R value. (G, B and A follow right after it.)
   * Assume x and y are whole numbers inside the frame.
   */
  function pixelIndex(frame, x, y) {
    throw MS.todo("pixelIndex");
  }

  /**
   * Write `color` into pixel (x, y), replacing what was there.
   * - Round fractional coordinates down (2.7 → 2).
   * - If (x, y) is outside the frame, do nothing. Don't throw, and don't
   *   let x = width "wrap around" onto the next row.
   */
  function setPixel(frame, x, y, color) {
    throw MS.todo("setPixel");
  }

  /**
   * Read pixel (x, y) as a new array [r, g, b, a].
   * Round coordinates down like setPixel. Return null if outside the frame.
   */
  function getPixel(frame, x, y) {
    throw MS.todo("getPixel");
  }

  /**
   * Fill every pixel of the frame with `color`.
   */
  function clearFrame(frame, color) {
    throw MS.todo("clearFrame");
  }

  Object.assign(MS, { createFrame, pixelIndex, setPixel, getPixel, clearFrame });
})(globalThis.MS = globalThis.MS || {});
