# Layer 09 · KineticIntro

_Everything you've built, on one timeline._

**You'll write:** `sceneState`, `maskUp`, `linearGradientT`, `blendOverlay`, `background`, `vignette`, `wordLayer`, `lockupLayer`, `kineticIntro` in `src/09-kinetic-intro.js`
**Check it:** `node tests/run.js 09`, or open `tests.html`
**Builds on:** layers 00–08

This is the layer the whole course has been heading for. KineticIntro, from [Claude Motion Studio](https://github.com/MoussaabBadla/claude-motion-studio), is six seconds of portrait video: **DESIGN.**, **ANIMATE.** and **RENDER.** rise out of nowhere, push toward you and blur away, then **MOTION·STUDIO** settles in with a sweep of light and a subtitle. In Remotion it's a few React components styled with CSS, and Chrome draws it. Here you turn that CSS into calls of your own functions: every gradient, blur, curve and blend is something you've built. The numbers come from KineticIntro's source; where CSS leaves a choice to the browser (exactly where flexbox puts a box, how text is antialiased), this layer says what it chose.

## Under the hood

### Reading a component as math

KineticIntro wraps each word in a `Scene` component. Stripped of React, a Scene is a handful of `interpolate` calls on the frame number, and three numbers that come out of them: how big, how see-through and how blurred.

```text
  word 2, "ANIMATE.": a = 40, b = 88       (not to scale)
  frame:     38  40                        66                      88  90
  enter:         0 ── APPLE, 26 frames ───►1
  exit:                                    0 ─ SMOOTH, 22 frames ─►1
  push:          1 ───────────────────────────────────────────────►1.04
  visible:   ◄──────────────────────────────────────────────────────────►
```

`scale` multiplies three things: growing from `enterFrom` while it enters, the slow push, and growing toward `exitTo` while it leaves. `opacity` is the smaller of "how far in" and "how far from out". The blur is the leftover of the entrance plus the start of the exit. A blur below 0.15 px is invisible, so KineticIntro turns it off, and that saves Chrome a filter pass on most frames.

Notice what isn't there: no state, no "previous frame". Each number is a function of n. That's layer 03's frame = f(n), all the way up.

### A mask is a window

Inside each Scene, a `MaskUp` holds the word in a box with `overflow: hidden`, and slides the word up from 110% of its own height below the box to its place. The box is a window: you only see the part of the word that's inside it.

```text
   frame 42 (start)         frame 44               frame 64 (home)
   ┌────────────────┐       ┌────────────────┐      ┌────────────────┐
   │                │       │ ▄▄  ▄  ▄ ▄ ▄▄▄ │      │ █▀█ █▄ █ █ █▀▄ │
   └────────────────┘       └────────────────┘      └────────────────┘
     ANIMATE.  (hidden,       ▀▀  ▀  ▀ ▀ ▀▀▀
     below the window)        (the rest still hidden)
```

The order of effects matters again. The window is inside the Scene, and the Scene's blur applies to everything in it, so the word is cut by the window first and blurred afterwards: the cut edge goes soft. That's why the window belongs in the sprite, before `renderLayers` blurs it. The sprite needs empty padding around the window, too, or the blur would have nowhere to spread.

### Where CSS puts a gradient

The light sweep is a `linear-gradient(100deg, …)`. [CSS Images](https://www.w3.org/TR/css-images-3/#linear-gradients) defines exactly where such a gradient runs. `0deg` points up and angles turn clockwise, so `90deg` points right and `100deg` points right and a little down. The **gradient line** goes through the middle of the box in that direction, and its length is chosen so that the lines of equal color through two opposite corners land exactly on 0% and 100%:

```text
   0%  ┊                          ┊  100%      ┊ lines of equal color, at right
       ┊┌────────────────────────┐┊               angles to the gradient line
       ┊│                        │┊
   ────●┼────────── ● ───────────┼●────►       the line runs through the middle;
       ┊│        middle          │┊           its ends are where the color lines
       ┊└────────────────────────┘┊           through two opposite corners cross it
       drawn at 90deg. At 100deg everything tilts 10° clockwise, and the
       line grows to |W·sin A| + |H·cos A| so its ends still meet the corners' lines
```

A point's position along the gradient is how far along that line its shadow falls. The background's `radial-gradient(70% 60% at 50% 38%, …)` is simpler: an ellipse with radii of 70% of the width and 60% of the height, centered half way across and 38% down, which your `fillRadialGradient` can draw once you turn the percentages into pixels. A stop like `transparent 60%` ends the gradient early: past 60% of the way out, it's transparent. CSS mixes gradient colors premultiplied, so fading to `transparent` (which is black at alpha 0) never darkens anything, as you saw in layer 07.

> **Study buddy:** "Give me a box, a gradient angle and a point, and ask me to sketch where the gradient line goes and roughly what percentage the point is at. Then ask me whether the line is longer at 45deg or at 90deg, for a square box, and whether that's always so. No code." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2009%20%28KineticIntro%29%3A%20the%20recreation.%20Here%27s%20what%20I%20want%20help%20with%3A%20Give%20me%20a%20box%2C%20a%20gradient%20angle%20and%20a%20point%2C%20and%20ask%20me%20to%20sketch%20where%20the%20gradient%20line%20goes%20and%20roughly%20what%20percentage%20the%20point%20is%20at.%20Then%20ask%20me%20whether%20the%20line%20is%20longer%20at%2045deg%20or%20at%2090deg%2C%20for%20a%20square%20box%2C%20and%20whether%20that%27s%20always%20so.%20No%20code.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2009%20%28KineticIntro%29%3A%20the%20recreation.%20Here%27s%20what%20I%20want%20help%20with%3A%20Give%20me%20a%20box%2C%20a%20gradient%20angle%20and%20a%20point%2C%20and%20ask%20me%20to%20sketch%20where%20the%20gradient%20line%20goes%20and%20roughly%20what%20percentage%20the%20point%20is%20at.%20Then%20ask%20me%20whether%20the%20line%20is%20longer%20at%2045deg%20or%20at%2090deg%2C%20for%20a%20square%20box%2C%20and%20whether%20that%27s%20always%20so.%20No%20code.)

### Blend modes: changing what "over" means

Layer 01's blend put the new color over the old one. CSS's [`mix-blend-mode`](https://www.w3.org/TR/compositing-1/#mix-blend-mode) keeps that recipe but changes one ingredient: where the two colors overlap, the result is `B(backdrop, source)` instead of just the source. The [general formula](https://www.w3.org/TR/compositing-1/#generalformula) mixes three parts, by how much each color covers:

```text
  only the source shows:     (1 − αb) × αs × Cs
  both overlap:              αb × αs × B(Cb, Cs)       ← the blend mode lives here
  only the backdrop shows:   (1 − αs) × αb × Cb
```

With `B(Cb, Cs) = Cs` that's exactly your `blendPixel`. KineticIntro's sweep uses [overlay](https://www.w3.org/TR/compositing-1/#blendingoverlay): where the backdrop is dark it multiplies, which makes dark darker; where it's light it "screens", which makes light lighter. So white pushes every channel toward white, by how much depending on the backdrop: a dark channel at most doubles, a light one goes all the way. KineticIntro's letters are already nearly white, so the sweep shows most on the blue dot, and on the empty space around the letters (next paragraph).

Which backdrop, though? A blend mode only blends with the content of its own **stacking context**, and the Scene's `transform` (and its `will-change`) make it one. So the sweep never touches the page's background: it blends with the lockup's own pixels, and where those are transparent, it's an ordinary half-white blend. That's why `lockupLayer` blends the sweep into its sprite, not into the frame.

### A shadow is a blur

The vignette is `box-shadow: inset 0 0 280px rgba(0, 0, 0, 0.7)`. An inset shadow is the shadow of everything *outside* the box, falling inward. [CSS Backgrounds](https://www.w3.org/TR/css-backgrounds-3/#shadow-blur) says a blur radius of 280px means a Gaussian blur with σ = 140, half the radius. So: make a frame that's black everywhere except a hole the size of the screen, blur it with your three box blurs, and keep the middle. The margin around the hole must be wider than the blur reaches, or the far edge of the black would fade in too, and a blur reaches a few σ, which is why the spec asks for a little more than 3σ. Watch the units: `filter: blur(16px)` means σ = 16, but a box-shadow blur radius of 280px means σ = 140.

### Make it once

At full size, the vignette blurs a frame of more than five million pixels. If `render` did that for every frame, KineticIntro would take minutes. But frame = f(n) only says a frame must depend on n *alone*; anything that doesn't depend on n at all can be made once and reused. The background and the vignette never change, so `kineticIntro` makes them when the composition is made, and each frame starts from a copy.

## Your turn

Work through `src/09-kinetic-intro.js` top to bottom. Each function's comment is its spec. Some questions to guide you, in order:

1. **sceneState.** Which of your layer 04 options gives "clamp" at both ends, and which takes an easing? At frame `a`, what should each of the four numbers be?
2. **maskUp.** What's the value one frame before `at`? One frame after `at + dur`?
3. **linearGradientT.** Which unit vector points in the direction of the angle, with 0deg up and y pointing down? How far along it is the point, measured from the middle of the box?
4. **blendOverlay.** Which color decides between "multiply" and "screen": the source or the backdrop? What happens to the formula when the backdrop is fully transparent?
5. **background.** What radii and center does each gradient give `fillRadialGradient`? How do you draw the glow over the background without wiping it out?
6. **vignette.** How do you make a frame that's opaque black with a transparent hole? After blurring, which matrix cuts the middle out?
7. **wordLayer.** Where does the word go inside its window at frame `a + 2`? Why does the sprite need padding, and why is that padding's size based on blur 16?
8. **lockupLayer.** In what order do the title, the sweep and the subtitle go into the sprite? Where's the sweep's box?
9. **kineticIntro.** What can you make once, outside `render`?

Run the tests after each function. A failing test tells you exactly what it expected.

Once it works, the test pictures show KineticIntro itself, playing, and three of its pieces on their own.

> **Study buddy:** "Show me the CSS for one KineticIntro Scene and ask me to translate each property into one of my functions, one at a time. Only tell me which layer to look in if I'm stuck. No code." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2009%20%28KineticIntro%29%3A%20the%20recreation.%20Here%27s%20what%20I%20want%20help%20with%3A%20Show%20me%20the%20CSS%20for%20one%20KineticIntro%20Scene%20and%20ask%20me%20to%20translate%20each%20property%20into%20one%20of%20my%20functions%2C%20one%20at%20a%20time.%20Only%20tell%20me%20which%20layer%20to%20look%20in%20if%20I%27m%20stuck.%20No%20code.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2009%20%28KineticIntro%29%3A%20the%20recreation.%20Here%27s%20what%20I%20want%20help%20with%3A%20Show%20me%20the%20CSS%20for%20one%20KineticIntro%20Scene%20and%20ask%20me%20to%20translate%20each%20property%20into%20one%20of%20my%20functions%2C%20one%20at%20a%20time.%20Only%20tell%20me%20which%20layer%20to%20look%20in%20if%20I%27m%20stuck.%20No%20code.)

## Predict, then run

Guess first, then run. In a terminal, `node tools/try.js 09` lists the blocks.

```js predict
// Predict 1: "DESIGN." runs from frame 0 to 48. Half way, at frame 24, how big is it?
const myGuess = null; // TODO: your guess, to 3 decimals (1 = its normal size)
const s = MS.sceneState(24, { a: 0, b: 48, enterFrom: 0.8, exitTo: 1.5, blurIn: 14, blurOut: 16 });
MS.reveal("the scale at frame 24", myGuess, Math.round(s.scale * 1000) / 1000);
```

```js predict
// Predict 2: the vignette at half size (540 × 960, blur radius 140, alpha 0.7).
// What's the alpha of the very top-left pixel, from 0 to 255?
const myGuess = null; // TODO: your guess
MS.reveal("the corner's alpha", myGuess, MS.getPixel(MS.vignette(540, 960, 140, 0.7), 0, 0)[3]);
```

```js predict
// Predict 3: overlay opaque black onto a light grey [200, 200, 200].
// What's the red value afterwards?
const myGuess = null; // TODO: your guess, 0 to 255
const f = MS.createFrame(1, 1);
MS.clearFrame(f, [200, 200, 200]);
MS.blendOverlay(f, 0, 0, [0, 0, 0]);
MS.reveal("red after overlaying black", myGuess, MS.getPixel(f, 0, 0)[0]);
```

<details><summary>Answers</summary>

1. 1.02. It has all but finished entering: APPLE gets within a hair of 1 several frames before frame 26, though it only reaches 1 exactly at the end. And the push has been growing it the whole time: 4% over 48 frames is 2% by half way. The push is so slow you never see it as motion, only as the word feeling alive.
2. 134, about 0.7 × ¾ of 255. A corner pixel is close to two edges, so the blurred black reaches it from two sides: only about a quarter of the area around it is the transparent hole. Halfway down an edge it's about half, so the alpha there is about 0.7 × ½ of 255.
3. 145. Over a light backdrop, overlay screens, so even black only pulls 200 down to 145: overlay keeps the light parts light. Over a dark grey, the same black would give pure black.

</details>

## Break it

Once your tests pass: make each TODO change, run the experiment before and after, explain the difference, then undo it.

### 1. A window with no frame

```js experiment
// Break it 1: why does the window go in the sprite?
// TODO(break-it), in src/09-kinetic-intro.js → wordLayer:
//   skip the window: draw the text straight into the padded sprite, moved down by maskUp, and
//   leave out the frame that cuts it off.
const layer = MS.wordLayer(44, 1, 216);
const s = layer.sprite, pad = Math.ceil(3 * 16 * 0.2) + 2;   // the empty border around the window
let below = 0;
for (let y = s.height - pad; y < s.height; y++) for (let x = 0; x < s.width; x++) below += s.data[(y * s.width + x) * 4 + 3];
console.log("ink below the window at frame 44: " + below);
// TODO: before the change, how much ink is below the window? After it, what would the viewer see under the word?
```

### 2. Overlay, backwards

```js experiment
// Break it 2: whose color decides?
// TODO(break-it), in src/09-kinetic-intro.js → blendOverlay:
//   choose between the two formulas with the SOURCE color (Cs ≤ 0.5) instead of the backdrop's.
for (const grey of [30, 100, 200]) {
  const f = MS.createFrame(1, 1);
  MS.clearFrame(f, [grey, grey, grey]);
  MS.blendOverlay(f, 0, 0, [255, 255, 255, 128]);
  console.log("half-white over grey " + grey + " → " + MS.getPixel(f, 0, 0)[0]);
}
// TODO: before the change, the white barely lifts the darkest grey and lifts the middle one most. After it? (That other blend mode has a name: hard-light.)
```

### 3. Make it every frame

```js experiment
// Break it 3: what does "make it once" save?
// TODO(break-it), in src/09-kinetic-intro.js → kineticIntro:
//   make the background and the vignette inside render, for every frame.
const comp = MS.kineticIntro(216);
const t0 = Date.now();
for (let n = 0; n < 180; n += 18) MS.renderFrame(comp, n);
console.log("10 frames: " + (Date.now() - t0) + " ms");
// TODO: how much slower is it after the change? How long would all 180 frames take at 1080 wide?
```

## Checkpoint

When all 21 tests pass, the checkpoint unlocks (layer 00 explains how it works). The picture is a word made of dots, and every dot asks one small question about a piece of KineticIntro: a dot that gets a wrong answer flies off its letter. Text is drawn with the bitmap font here, so the picture is the same on every computer. Its traps: scenes with every option changed, frames before a scene starts and after it ends, a two-frame exit, masks that haven't started or have long finished, gradient angles all the way round, overlay where one side is transparent, the background and vignette at other sizes, layers at other widths, and whole frames compared with your own pieces drawn by hand. The three questions are below.

```js checkpoint
// Checkpoint 09 · KineticIntro. Replace each null with your answer.
MS.answers("09", {
  // 1. For how many frames is "ANIMATE." (a = 40, b = 88) completely opaque, opacity exactly 1?
  q1: null,
  // 2. The light sweep's center s moves from −20% to 130% between frames 140 and 172.
  //    What's the first whole frame at which it has reached the middle (s ≥ 50)?
  q2: null,
  // 3. At full size (1080 wide), how many pixels wide is the margin around the
  //    vignette's hole?
  q3: null,
});
```

## In the real world

- Remotion's [`interpolate`](https://www.remotion.dev/docs/interpolate) with [`Easing.bezier`](https://www.remotion.dev/docs/easing) is exactly your layers 04 and 05, and [`<AbsoluteFill>`](https://www.remotion.dev/docs/absolute-fill) is a full-frame flexbox container; KineticIntro centers its words inside one.
- Chrome draws a Remotion frame with its compositor: each Scene with a transform, filter or opacity can get its own GPU layer, much like your sprites, and blends them in an order very like `renderLayers`.
- CSS's [`isolation: isolate`](https://developer.mozilla.org/en-US/docs/Web/CSS/isolation) makes a stacking context on purpose, so blend modes inside it can't reach outside it.
- Big shadows and blurs are among the most expensive things a page can draw, which is why browsers try to draw them once and reuse the result: "make it once", done for you.

## Going further (optional)

- **Read the original.** The [Compositing and Blending spec](https://www.w3.org/TR/compositing-1/#blending) lists all the separable blend modes with their formulas. Add `screen`, `multiply` and `soft-light` to your `blendOverlay` as options and try each on the sweep.
- Cache the text sprites: they only depend on the word, not on n. How much faster is a frame?
- Render KineticIntro at full size, 1080 × 1920, and time one frame. Which piece takes longest?
