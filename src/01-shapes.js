// Layer 01 · Shapes & blending — rectangles, circles, alpha, gradients.
// Read docs/01-shapes.md first. Run `node tests/run.js 01` to check your work.
// You can (and should) use your layer 00 functions here.
(function (MS) {
  /**
   * Turn a CSS-style hex string into a color array.
   *   hex("#5B8CFF")      → [91, 140, 255, 255]
   *   hex("5b8cff", 128)  → [91, 140, 255, 128]
   * Accept upper or lower case, with or without "#".
   * Throw an Error for anything that isn't exactly 6 hex digits.
   */
  function hex(str, alpha = 255) {
    throw MS.todo("hex");
  }

  /**
   * Paint `color` OVER pixel (x, y), respecting its alpha ("source-over").
   * With a = alpha of the new color, b = alpha of the existing pixel,
   * both as 0–1:
   *
   *   outAlpha = a + b × (1 − a)
   *   outRGB   = (newRGB × a + oldRGB × b × (1 − a)) / outAlpha
   *
   * Write outAlpha back as 0–255. If outAlpha is 0, the pixel becomes
   * [0, 0, 0, 0]. Round coordinates down; ignore pixels outside the frame.
   */
  function blendPixel(frame, x, y, color) {
    throw MS.todo("blendPixel");
  }

  /**
   * Blend a w × h rectangle whose top-left corner is (x, y).
   * Round the edges to whole pixels first:
   *   left = round(x), right = round(x + w)   (right is exclusive)
   *   top  = round(y), bottom = round(y + h)  (bottom is exclusive)
   * Clip to the frame, so a rectangle hanging off the edge is fine.
   */
  function fillRect(frame, x, y, w, h, color) {
    throw MS.todo("fillRect");
  }

  /**
   * Blend a circle with center (cx, cy) and radius r.
   * A pixel is inside when its CENTER, (px + 0.5, py + 0.5), is at
   * distance <= r from (cx, cy). Only visit pixels in the circle's
   * bounding box, not the whole frame.
   */
  function fillCircle(frame, cx, cy, r, color) {
    throw MS.todo("fillCircle");
  }

  /**
   * Mix two colors: t = 0 gives a, t = 1 gives b, 0.5 is halfway.
   * Mix all four channels (missing alpha = 255). Don't round.
   */
  function mixColor(a, b, t) {
    throw MS.todo("mixColor");
  }

  /**
   * Fill the whole frame from `top` color to `bottom` color.
   * Row y uses t = (y + 0.5) / height, so you sample each row at its middle.
   * Overwrite pixels (setPixel), don't blend.
   */
  function fillVerticalGradient(frame, top, bottom) {
    throw MS.todo("fillVerticalGradient");
  }

  /**
   * Fill the whole frame with an elliptical radial gradient, like CSS
   * `radial-gradient(rx ry at cx cy, inner, outer)`.
   * For each pixel center (x + 0.5, y + 0.5):
   *   d = sqrt( ((x + 0.5 − cx) / rx)² + ((y + 0.5 − cy) / ry)² )
   *   t = min(d, 1)
   * and write mixColor(inner, outer, t). Overwrite, don't blend.
   */
  function fillRadialGradient(frame, cx, cy, rx, ry, inner, outer) {
    throw MS.todo("fillRadialGradient");
  }

  Object.assign(MS, { hex, blendPixel, fillRect, fillCircle, mixColor, fillVerticalGradient, fillRadialGradient });
})(globalThis.MS = globalThis.MS || {});
