// Layer 05 · Easing — a cubic-Bézier solver.
// Read the chapter first (docs/05-easing.md). Each comment below is a spec; the tests check it.
(function (MS) {
  /**
   * One coordinate of a cubic Bézier easing curve at parameter u (0 to 1).
   * The curve's four control values are 0, p1, p2, 1: it starts at 0, ends
   * at 1, and p1 and p2 pull it in between.
   *   bezierPoint(0.2, 0.8, 0.25) → 0.2125
   */
  function bezierPoint(p1, p2, u) {
    throw MS.todo("bezierPoint");
  }

  /**
   * How fast bezierPoint(p1, p2, u) changes as u grows: its derivative.
   *   bezierSlope(0.3, 0.9, 0) → 0.9    (3 × p1 at the start)
   *   bezierSlope(1, 0, 0.5)   → 0      (this curve goes flat in the middle)
   */
  function bezierSlope(p1, p2, u) {
    throw MS.todo("bezierSlope");
  }

  /**
   * Find the u (0 to 1) where the curve's x reaches `x`, so that
   *   |bezierPoint(x1, x2, u) − x| < 1e-7
   * x1 and x2 are between 0 and 1, so there is exactly one such u.
   * x = 0 gives 0 and x = 1 gives 1. It must work for every curve,
   * including ones that go flat (slope 0) somewhere.
   */
  function solveBezierX(x1, x2, x) {
    throw MS.todo("solveBezierX");
  }

  /**
   * CSS's cubic-bezier(x1, y1, x2, y2): return an easing function that
   * takes a time progress x and returns the curve's y at that x.
   * - Throw an Error if x1 or x2 is outside 0–1 (y1 and y2 can be anything).
   * - The function clamps x to 0–1 first, and returns exactly 0 at x = 0
   *   and exactly 1 at x = 1.
   *   cubicBezier(0.42, 0, 1, 1)(0.5) → about 0.3154   (CSS ease-in)
   */
  function cubicBezier(x1, y1, x2, y2) {
    throw MS.todo("cubicBezier");
  }

  Object.assign(MS, { bezierPoint, bezierSlope, solveBezierX, cubicBezier });
})(globalThis.MS = globalThis.MS || {});
