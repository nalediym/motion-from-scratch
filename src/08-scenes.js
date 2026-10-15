// Layer 08 · Scenes — real fonts, sequences, a camera, layers and masks.
// Read the chapter first (docs/08-scenes.md). Each comment below is a spec; the tests check it.
(function (MS) {
  // Text options, used by both text functions:
  //   { size, weight = 400, family = "sans-serif", color = [255, 255, 255, 255], letterSpacing = 0, pad = 0 }
  // size and letterSpacing are in pixels; color is [r, g, b] or [r, g, b, a] with 0–255 values.

  /**
   * Draw `text` on a 2D canvas context, with its baseline's left end at (x, y).
   * Before calling ctx.fillText(text, x, y), set:
   *   ctx.font          weight, size and family as CSS writes them: "900 40px Inter"
   *   ctx.letterSpacing the spacing in px, like "-2px" (and "0px" for none)
   *   ctx.fillStyle     the color as "rgba(r, g, b, alpha)", alpha from 0 to 1:
   *                     [91, 140, 255, 51] → "rgba(91, 140, 255, 0.2)"
   *   ctx.textBaseline  "alphabetic", and ctx.textAlign "left"
   */
  function drawTextCanvas(ctx, text, x, y, opts) {
    throw MS.todo("drawTextCanvas");
  }

  /**
   * A frame with `text` in it, sized to fit, plus a `baseline` property: the
   * y of the text's baseline inside the frame.
   * With a canvas (MS.createCanvas(w, h) returns one in browsers, null elsewhere):
   * - measure the text with ctx.measureText, using the same font and spacing
   *   you'll draw with;
   * - width = Math.ceil(metrics.width) + 2 × pad (at least 1),
   *   height = Math.ceil(metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent) + 2 × pad;
   * - draw it with drawTextCanvas on a canvas that size, at x = pad and
   *   y = pad + fontBoundingBoxAscent (that's also the baseline);
   * - copy the canvas's pixels (ctx.getImageData) into a new frame.
   * With no canvas, use your bitmap font from layer 02: scale = Math.round(size ÷ 10)
   * (at least 1), the frame is the text's width at that scale plus 2 × pad by
   * 7 × scale + 2 × pad, the text is drawn at (pad, pad), and the baseline is
   * pad + 7 × scale. The bitmap font ignores weight, family and letterSpacing.
   */
  function textSprite(text, opts) {
    throw MS.todo("textSprite");
  }

  /**
   * Like Remotion's <Sequence from durationInFrames>: for frame n of the video,
   * the sequence's own frame number, counting from 0 at frame `from`. Return
   * null when n is outside the sequence: before `from`, or at or after
   * from + durationInFrames. With no duration, it never ends.
   */
  function sequence(n, from, durationInFrames) {
    throw MS.todo("sequence");
  }

  /**
   * Like Remotion's <Series>: items is a list of { durationInFrames, offset }.
   * Each item starts when the one before it ends (the first at frame 0), moved
   * by its offset (default 0; negative overlaps the one before). An offset moves
   * every item after it too. Return a new list of { from, durationInFrames }.
   */
  function series(items) {
    throw MS.todo("series");
  }

  /**
   * The matrix that films the world with a camera, for a screen width × height.
   * The camera looks at world point (x, y), which lands in the middle of the
   * screen. zoom scales everything around the middle. rotation (radians) turns
   * the camera clockwise, so the world on screen turns the other way.
   * Defaults: x 0, y 0, zoom 1, rotation 0.
   */
  function camera({ x, y, zoom, rotation }, width, height) {
    throw MS.todo("camera");
  }

  /**
   * Draw layers onto `frame` in order (later ones on top) and return `frame`.
   * Each layer is { sprite, matrix, opacity, blur, clip }:
   *   sprite   a frame
   *   matrix   where the sprite goes, as for drawTransformed (default: no change)
   *   opacity  0 to 1 (default 1); a layer with opacity 0 draws nothing
   *   blur     a σ for your blur (default 0: none), applied to the sprite
   *            BEFORE the matrix moves it
   *   clip     optional { x, y, width, height } in frame pixels (whole numbers):
   *            the layer only changes pixels inside this rectangle
   */
  function renderLayers(frame, layers) {
    throw MS.todo("renderLayers");
  }

  Object.assign(MS, { drawTextCanvas, textSprite, sequence, series, camera, renderLayers });
})(globalThis.MS = globalThis.MS || {});
