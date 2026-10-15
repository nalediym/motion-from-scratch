// Layer 03 · Time — frame = f(n) and a player that keeps time.
// Read the chapter first (docs/03-time.md). Each comment below is a spec; the tests check it.
// From here on, `frame` is a picture (layer 00) and `n` is a frame number: 0, 1, 2, …
(function (MS) {
  /**
   * How many frames does `seconds` last at `fps` frames per second?
   * Round to the nearest whole frame (Math.round).
   *   secondsToFrames(2, 30) → 60
   */
  function secondsToFrames(seconds, fps) {
    throw MS.todo("secondsToFrames");
  }

  /**
   * How many seconds do `n` frames last at `fps`? Don't round.
   *   framesToSeconds(45, 30) → 1.5
   */
  function framesToSeconds(n, fps) {
    throw MS.todo("framesToSeconds");
  }

  /**
   * Frame number n as a timecode string "HH:MM:SS:FF": hours, minutes,
   * seconds, and the frame within the current second. Every field has
   * two digits. fps is a whole number.
   *   timecode(30 * 61 + 5, 30) → "00:01:01:05"
   */
  function timecode(n, fps) {
    throw MS.todo("timecode");
  }

  /**
   * Check and return a composition: a video described as a function.
   *   spec = { width, height, fps, durationInFrames, render }
   * width, height, fps and durationInFrames must be positive whole numbers,
   * and render a function. Throw an Error otherwise. Return a new object
   * with exactly those five properties.
   * render(frame, n) draws frame number n into `frame`.
   */
  function createComposition(spec) {
    throw MS.todo("createComposition");
  }

  /**
   * Draw frame number n of composition `comp` and return it:
   * make a new frame of the composition's size (createFrame), call
   * comp.render(frame, n), and return the frame.
   * Throw an Error unless n is a whole number from 0 to durationInFrames − 1.
   */
  function renderFrame(comp, n) {
    throw MS.todo("renderFrame");
  }

  /**
   * Which frame should a player show after `elapsedMs` milliseconds?
   * Count the frames that have fully started: frame k starts at
   * k × 1000 / fps ms. Past the last frame:
   *   loop = true   start again from 0 (a 90-frame clip shows frame 0 after frame 89)
   *   loop = false  stay on the last frame
   * elapsedMs is never negative.
   */
  function frameAt(elapsedMs, fps, durationInFrames, loop = true) {
    throw MS.todo("frameAt");
  }

  Object.assign(MS, { secondsToFrames, framesToSeconds, timecode, createComposition, renderFrame, frameAt });
})(globalThis.MS = globalThis.MS || {});
