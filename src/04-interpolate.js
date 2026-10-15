// Layer 04 · Interpolate — lerp, clamp, ranges, extrapolation.
// Read the chapter first (docs/04-interpolate.md). Each comment below is a spec; the tests check it.
(function (MS) {
  /**
   * Linear interpolation: a at t = 0, b at t = 1, and everything along the
   * straight line between and beyond. Don't clamp t.
   *   lerp(10, 20, 0.25) → 12.5
   */
  function lerp(a, b, t) {
    throw MS.todo("lerp");
  }

  /**
   * The opposite of lerp: what t gives v? (v − a) as a fraction of (b − a).
   *   inverseLerp(10, 20, 15) → 0.5
   * Throw an Error if a === b.
   */
  function inverseLerp(a, b, v) {
    throw MS.todo("inverseLerp");
  }

  /**
   * v, kept between min and max.
   *   clamp(12, 0, 10) → 10
   */
  function clamp(v, min, max) {
    throw MS.todo("clamp");
  }

  /**
   * Map `input` from inputRange onto outputRange, like Remotion's interpolate.
   *   interpolate(5, [0, 10], [0, 100]) → 50
   * Both ranges have the same length (at least 2), and inputRange must be
   * strictly increasing; throw an Error otherwise. With more than two points,
   * use the segment the input falls in. Past the ends, options decide:
   *   extrapolateLeft / extrapolateRight:
   *     "extend"   (default) keep going along the end segment's line
   *     "clamp"    stay at the end value
   *     "identity" return the input itself
   *   easing: a function applied to t, the progress through the segment
   *     (0 at its start, 1 at its end), before t is mapped to the output.
   *     With "extend", t keeps going past 0 and 1 and is still eased.
   *     Default: t => t.
   */
  function interpolate(input, inputRange, outputRange, options = {}) {
    throw MS.todo("interpolate");
  }

  /**
   * Interpolate between colors ([r, g, b] or [r, g, b, a]; missing alpha is
   * 255), one channel at a time, clamped at both ends. Round each channel to
   * a whole number and return [r, g, b, a].
   *   interpolateColors(0.5, [0, 1], [[0, 0, 0], [200, 200, 200]]) → [100, 100, 100, 255]
   */
  function interpolateColors(input, inputRange, colors) {
    throw MS.todo("interpolateColors");
  }

  Object.assign(MS, { lerp, inverseLerp, clamp, interpolate, interpolateColors });
})(globalThis.MS = globalThis.MS || {});
