// Layer 09 · KineticIntro — the recreation.
// Read the chapter first (docs/09-kinetic-intro.md). Each comment below is a spec; the tests check it.
(function (MS) {
  // KineticIntro's numbers. Its frame is 1080 × 1920; at another width, multiply
  // every length in pixels (font sizes, spacing, blurs, gaps) by k = width ÷ 1080.
  //   colors   ink #EAF0FA, muted #8A93A6, primary #5B8CFF
  //   easing   APPLE = cubic-bezier(0.16, 1, 0.3, 1), SMOOTH = cubic-bezier(0.6, 0, 0.2, 1)
  //   "clamp"  means extrapolateLeft and extrapolateRight are both "clamp"
  // Tip: make your easing functions inside the functions that use them (or the
  // first time they're needed), not when this file loads.

  /**
   * Where a KineticIntro Scene is at frame n. The scene runs from frame a to b.
   * Options (defaults, the same as KineticIntro's Scene): a, b, enterFrom (0.92),
   * exitTo (1.14), blurIn (10), blurOut (12), enterDur (26), exitDur (22), pushTo (1.04).
   *   enter   = interpolate(n, [a, a + enterDur], [0, 1]), clamped, eased with APPLE
   *   exit    = interpolate(n, [b − exitDur, b], [0, 1]), clamped, eased with SMOOTH
   *   push    = interpolate(n, [a, b], [1, pushTo]), clamped
   * Return { visible, scale, opacity, blur }:
   *   visible = n is from a − 2 to b + 2 (both included)
   *   scale   = lerp(enterFrom, 1, enter) × push × lerp(1, exitTo, exit)
   *   opacity = the smaller of enter and 1 − exit
   *   blur    = (1 − enter) × blurIn + exit × blurOut, or 0 if that's 0.15 or less
   */
  function sceneState(n, opts) {
    throw MS.todo("sceneState");
  }

  /**
   * KineticIntro's MaskUp: how far below its slot a word is at frame n, as a
   * percentage of the word's own height. It rises from 110 at frame `at` to 0 at
   * frame at + dur (default 22), clamped, eased with APPLE.
   */
  function maskUp(n, at, dur) {
    throw MS.todo("maskUp");
  }

  /**
   * Where the point (x, y) of a w × h box falls along a CSS linear-gradient(deg),
   * as a number from 0 (where the gradient starts) to 1 (where it ends).
   * 0deg points up, 90deg points right (angles go clockwise). The gradient line
   * runs through the box's center in that direction, and is just long enough
   * that its two ends touch the box's corners: |w × sin| + |h × cos| long.
   */
  function linearGradientT(x, y, w, h, deg) {
    throw MS.todo("linearGradientT");
  }

  /**
   * Blend `color` onto pixel (x, y) like CSS's mix-blend-mode: overlay. Like your
   * blendPixel (layer 01), but where the two overlap, the color becomes
   * B(backdrop, color) instead of the color itself. With every channel as a
   * number from 0 to 1 (divide by 255), for each of red, green and blue:
   *   B = 2 × Cb × Cs                      if the backdrop Cb ≤ 0.5
   *   B = 1 − 2 × (1 − Cb) × (1 − Cs)      otherwise
   *   αo = αs + αb × (1 − αs)
   *   Co = ((1 − αb) × αs × Cs + αb × αs × B + (1 − αs) × αb × Cb) ÷ αo
   * (s is the color you blend, b the pixel already there, o the result.) Store
   * Co and αo back as 0–255. Pixels outside the frame, and a result with αo = 0,
   * leave the frame unchanged.
   */
  function blendOverlay(frame, x, y, color) {
    throw MS.todo("blendOverlay");
  }

  /**
   * KineticIntro's background, as a new width × height frame, using your
   * fillRadialGradient (layer 01):
   *   radial-gradient(70% 60% at 50% 38%, #1A2740, #0B0D12)
   *   then over it, blended normally,
   *   radial-gradient(60% 40% at 50% 45%, rgba(91, 140, 255, 0.22), transparent 60%)
   * "70% 60%" are the ellipse's x and y radii as fractions of width and height.
   * "transparent 60%" means the glow has faded out 60% of the way to its edge.
   * Use alpha 56 for 0.22, and fade the glow to the same blue with alpha 0.
   */
  function background(width, height) {
    throw MS.todo("background");
  }

  /**
   * An inset box-shadow, as a width × height frame: CSS's
   *   box-shadow: inset 0 0 <radius>px rgba(0, 0, 0, alpha)
   * A blur radius of r means a Gaussian blur with σ = r ÷ 2. Make a frame that's
   * the size of the screen plus a margin of Math.ceil(3σ) + 2 on every side,
   * opaque black except for a transparent hole the size of the screen in the
   * middle. Blur it with your blur(σ), then cut the middle out (drop the margin)
   * with its alpha multiplied by `alpha`.
   */
  function vignette(width, height, radius, alpha) {
    throw MS.todo("vignette");
  }

  /**
   * The layer (for renderLayers) of word i at frame n, in a frame `width` wide
   * (and Math.round(width × 16 ÷ 9) high); null when the word's scene isn't visible.
   * The words are "DESIGN.", "ANIMATE.", "RENDER.". Word i's scene: a = 40 × i,
   * b = a + 48, enterFrom 0.8, exitTo 1.5, blurIn 14, blurOut 16.
   * - The text: textSprite, 150 px, weight 900, family "Inter", ink, letterSpacing −4 px.
   * - The mask: a frame the size of the text sprite, with the text drawn into it
   *   moved down by maskUp(n, a + 2) percent of the text's height. Anything that
   *   lands outside it is cut off.
   * - The sprite: that mask frame in the middle of a bigger frame with
   *   pad = Math.ceil(3 × 16 × k) + 2 empty pixels on every side, room for the blur.
   * - The layer: { sprite, matrix, opacity, blur }, where the matrix scales the
   *   sprite by the scene's scale around the sprite's center and puts that center
   *   in the middle of the frame, opacity is the scene's, and blur is the scene's × k.
   * (Remember: renderLayers blurs before the matrix, like CSS.)
   */
  function wordLayer(n, i, width) {
    throw MS.todo("wordLayer");
  }

  /**
   * The lockup's layer at frame n (null when its scene isn't visible). Its scene:
   * a = 120, b = 180, enterFrom 0.86, exitTo 1, blurIn 14, exitDur 2.
   * - Title: textSprites "MOTION", "·", "STUDIO" in a row, Math.round(14 × k) px
   *   apart (96 px, weight 900, "Inter", letterSpacing −3 px); the "·" is primary,
   *   the rest ink.
   * - Subtitle: textSprite "built in code" (36 px, weight 500, "Inter", muted,
   *   letterSpacing 2 px), Math.round(22 × k) below the title, faded by
   *   interpolate(n, [150, 168], [0, 1]), clamped.
   * - The sprite: the title above the subtitle, each centered (round positions
   *   to whole pixels), with pad = Math.ceil(3 × 14 × k) + 2 empty pixels around.
   * - The light sweep, after the title and before the subtitle: over the title's
   *   box grown by Math.round(16 × k) on every side: for each pixel in it, let
   *   p = 100 × linearGradientT of the pixel's center (x + 0.5, y + 0.5), measured
   *   from the grown box's top-left corner, in a box the grown box's size, at
   *   100deg; and s = interpolate(n, [140, 172], [−20, 130]), clamped. blendOverlay
   *   white with alpha 0.5 × max(0, 1 − |p − s| ÷ 12), in 0–255 (skip pixels where
   *   that's 0).
   * - The layer: as for the words, from the lockup's scene.
   */
  function lockupLayer(n, width) {
    throw MS.todo("lockupLayer");
  }

  /**
   * KineticIntro: a composition `width` wide (default 1080), Math.round(width × 16 ÷ 9)
   * high, 30 fps, 180 frames. Each frame is the background, then with your
   * renderLayers: the three words, the lockup, and on top the vignette
   * (radius 280 × k, alpha 0.7). The background and vignette never change: make
   * them once, when the composition is made, not for every frame.
   */
  function kineticIntro(width) {
    throw MS.todo("kineticIntro");
  }

  Object.assign(MS, { sceneState, maskUp, linearGradientT, blendOverlay, background, vignette, wordLayer, lockupLayer, kineticIntro });
})(globalThis.MS = globalThis.MS || {});
