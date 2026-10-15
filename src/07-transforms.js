// Layer 07 · Transforms & blur — matrices, resampling and blur.
// Read the chapter first (docs/07-transforms.md). Each comment below is a spec; the tests check it.
(function (MS) {
  // A matrix is an array of six numbers [a, b, c, d, e, f], in the same order
  // as canvas's setTransform(a, b, c, d, e, f). It moves the point (x, y) to
  //   x' = a·x + c·y + e
  //   y' = b·x + d·y + f

  /** The matrix that moves every point by (tx, ty). */
  function translate(tx, ty) {
    throw MS.todo("translate");
  }

  /**
   * The matrix that scales x by sx and y by sy, around the origin (0, 0).
   * With one number, it scales both: scale(2) is scale(2, 2).
   */
  function scale(sx, sy) {
    throw MS.todo("scale");
  }

  /**
   * The matrix that rotates by `angle` radians around the origin. A positive
   * angle turns +x toward +y: on a screen, where y points down, that's clockwise.
   *   rotate(Math.PI / 2) moves (1, 0) to (0, 1).
   */
  function rotate(angle) {
    throw MS.todo("rotate");
  }

  /**
   * One matrix that does n first, then m: transforming a point with
   * multiply(m, n) gives the same point as transforming it with n, then with m.
   * Return a new array.
   */
  function multiply(m, n) {
    throw MS.todo("multiply");
  }

  /** Where matrix m moves the point (x, y), as [x', y']. */
  function transformPoint(m, x, y) {
    throw MS.todo("transformPoint");
  }

  /**
   * The matrix that undoes m: transformPoint(invert(m), ...) moves every point
   * m moved back where it came from. Some matrices squash every point onto a
   * line or a single point, like scale(0, 1); they can't be undone, so return
   * null for them (when a·d − b·c is 0).
   */
  function invert(m) {
    throw MS.todo("invert");
  }

  /**
   * Draw the frame `src` onto the frame `dest`, moved by the matrix m (which
   * maps src's coordinates to dest's), blending over what's already there
   * with your blendPixel.
   * - Pixel (x, y) covers the square from (x, y) to (x + 1, y + 1), so its
   *   center is (x + 0.5, y + 0.5). This is true in both frames.
   * - Each dest pixel gets the color of src at the point that m moves onto
   *   that pixel's center. Between pixel centers, blend the four nearest src
   *   pixels, weighted by how close their centers are (bilinear sampling).
   *   Pixels outside src count as fully transparent.
   * - Blend premultiplied: weight each src pixel's color by its alpha as well,
   *   so transparent pixels fade an edge without darkening it.
   * - Multiply the sampled alpha by opacity (default 1).
   * If m can't be inverted, draw nothing. Pixels of dest that src doesn't
   * reach must not change.
   */
  function drawTransformed(dest, src, m, opacity = 1) {
    throw MS.todo("drawTransformed");
  }

  /**
   * Blur a frame with a box of 2r + 1 pixels: first every row, then every
   * column. Each pixel becomes the average of the pixels in the box centered
   * on it. Pixels outside the frame count as fully transparent. Average
   * premultiplied, as in drawTransformed: alpha is the plain average, and the
   * color is weighted by alpha. r is a whole number.
   * Return a new frame, and leave `frame` unchanged. boxBlur(frame, 0)
   * returns an unchanged copy.
   */
  function boxBlur(frame, r) {
    throw MS.todo("boxBlur");
  }

  /**
   * A Gaussian blur with standard deviation sigma (in pixels), the way CSS's
   * filter: blur(sigma px) means it, made from three box blurs in a row,
   * each of radius r = Math.round((√(1 + 4σ²) − 1) ÷ 2).
   * Return a new frame, and leave `frame` unchanged.
   */
  function blur(frame, sigma) {
    throw MS.todo("blur");
  }

  Object.assign(MS, { translate, scale, rotate, multiply, transformPoint, invert, drawTransformed, boxBlur, blur });
})(globalThis.MS = globalThis.MS || {});
