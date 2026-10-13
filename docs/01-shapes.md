# Layer 01 · Shapes & blending

_Deciding which pixels a shape covers, and what happens where shapes overlap._

**You'll write:** `hex`, `blendPixel`, `fillRect`, `fillCircle`, `mixColor`, `fillVerticalGradient`, `fillRadialGradient` in `src/01-shapes.js`
**Check it:** `node tests/run.js 01`
**Builds on:** layer 00

KineticIntro has a glowing radial background, words that fade in and out, and a light sweep that brightens the logo as it passes. All three are this layer: filling shapes, mixing colors, and **blending** a see-through color over what's already there.

## Under the hood

### Colors as text: hex

Designers write colors like `#5B8CFF` (the CSS [hex color](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/hex-color) notation). That's three bytes written in base 16 ([hexadecimal](https://en.wikipedia.org/wiki/Hexadecimal)), two digits each:

```text
   #  5B   8C   FF
      │    │    └─ blue  = 0xFF = 15×16 + 15 = 255
      │    └────── green = 0x8C =  8×16 + 12 = 140
      └─────────── red   = 0x5B =  5×16 + 11 =  91
```

JavaScript can read base-16 text for you (look up [`parseInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt)'s second argument, the radix). There are two common approaches: cut the string into three 2-character pieces, or read all six digits as one number and pull bytes out of it with bit shifts ([`>>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Right_shift)) and masks ([`& 255`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_AND)). Either is fine. The second shows you how colors are often packed in memory.

### Rasterizing: which pixels does a shape cover?

A rectangle from x = 2 to x = 6 is an idea with perfect edges. The screen only has whole pixels. Turning shapes into pixels is called **[rasterization](https://en.wikipedia.org/wiki/Rasterisation)**, and the rule almost every renderer uses is: _a pixel belongs to the shape if its **center** is inside._

```text
        0     1     2     3     4     5     6     7
     ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
     │  ·  │  ·  │  ■  │  ■  │  ■  │  ■  │  ·  │  ·  │   rect x = 2 .. 6
     └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
                 ↑ centers at 2.5, 3.5, 4.5, 5.5 are inside
                                         ↑ 6.5 is not
```

For rectangles, testing centers is the same as rounding the edges, which is what the spec asks for.

Notice that the right edge is **exclusive**: a rectangle from 2 to 6 covers 2, 3, 4, 5, and not 6. This "half-open" rule means two rectangles that share an edge (one from 2 to 6, the next from 6 to 9) meet perfectly, with no gap and no pixel painted twice. You'll see why that matters in **Break it**.

### Circles: distance from the center

A pixel is inside a circle if its center is no farther than `r` from the circle's center. That's Pythagoras: `dx² + dy² ≤ r²`. (You can skip the square root by comparing squared distances. Why does that give the same answer?)

```text
          · · · · · · · · ·
          · · · ■ ■ ■ · · ·         every ■ passes  dx² + dy² ≤ r²
          · · ■ ■ ■ ■ ■ · ·
          · · ■ ■ ● ■ ■ · ·         ● = center
          · · ■ ■ ■ ■ ■ · ·
          · · · ■ ■ ■ · · ·         ┌─────────┐  only test pixels
          · · · · · · · · ·         └─────────┘  inside this box
```

You *could* test every pixel in the frame. For a small circle on a 1080 × 1920 frame that's 2 million tests to draw maybe 300 pixels. Instead, only visit the circle's **bounding box**: from `cx − r` to `cx + r` in each direction.

Jagged edges like these are called **aliasing**. Real renderers soften them with **[antialiasing](https://en.wikipedia.org/wiki/Spatial_anti-aliasing)**: a pixel that's 40% covered gets 40% of the color. See **Going further**.

### Alpha blending: painting with see-through paint

Here's the big one. When you paint a half-transparent red over a blue pixel, the result is a mix. When you paint it over an empty, fully transparent pixel, it should still be red, just see-through.

This was worked out in 1984 by Thomas Porter and Tom Duff at Lucasfilm, in a paper called ["Compositing Digital Images"](https://keithp.com/~keithp/porterduff/p253-porter.pdf) (SIGGRAPH '84; the link is the original paper as a PDF). It's how film effects layered spaceships over backgrounds, and how every browser layers one element over another. Their "over" operation, with alphas written as 0 to 1:

```text
  a = alpha of the new color (source)     b = alpha of the existing pixel (destination)

  outAlpha = a + b × (1 − a)
  outRGB   = ( newRGB × a  +  oldRGB × b × (1 − a) ) / outAlpha
```

Read it as coverage. The new paint covers fraction `a` of the pixel. Of what's left, `(1 − a)`, the old pixel covers fraction `b`. The color is the average of the two, weighted by how much each one covers. The **divide by outAlpha** turns "amount of light" back into "color".

```text
  50% red over opaque blue:              50% red over nothing:
  outAlpha = 0.5 + 1 × 0.5 = 1           outAlpha = 0.5 + 0 = 0.5
  red  = (255×0.5 + 0) / 1   ≈ 128       red  = (255×0.5) / 0.5 = 255   ← still pure red
  blue = (0 + 255×1×0.5) / 1 ≈ 127       alpha = 0.5 → 128
```

Colors stored this way are called **straight alpha**. Many renderers store colors already multiplied by alpha instead (**premultiplied alpha**), because then the formula needs no division. Porter and Duff wrote "over" for premultiplied colors in the paper; the formula above is the same equation with the division put back so it works on straight colors. Browsers follow the [W3C Compositing and Blending spec](https://www.w3.org/TR/compositing-1/#porterduffcompositingoperators_srcover), which names this operator **source-over**. That choice has consequences, which you'll explore below.

### Gradients: one color per position

A gradient answers one question per pixel: _how far along am I, from 0 to 1?_ Then it mixes the two colors by that amount:

```text
  mixColor(a, b, t) = a + (b − a) × t      (for each of R, G, B and A)

  t = 0          t = 0.25        t = 0.5         t = 0.75        t = 1
  ██ a           ██              ██ halfway      ██              ██ b
```

A vertical gradient gets `t` from the row. A radial gradient gets `t` from distance to a center point. Dividing each axis by its own radius (`rx`, `ry`) stretches the circle into an ellipse.

That's exactly what CSS does: [`radial-gradient()`](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/radial-gradient), defined in the [CSS Images spec](https://www.w3.org/TR/css-images-3/#radial-gradients), which says the first size is the horizontal radius and the second the vertical, each as a percentage of the box. KineticIntro's background is written in CSS as:

```text
  radial-gradient(70% 60% at 50% 38%, #1A2740, #0B0D12)
                  └rx  ry┘   └cx  cy┘   inner     outer
  on a 1080 × 1920 frame:  rx = 756   ry = 1152   cx = 540   cy = 729.6
```

When your tests pass, `tests.html` draws that exact background. It's the first real piece of the recreation.

## Your turn

1. **hex.** What should happen with `"#FFF"`, `"blue"`, or `"#12345G"`? A [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions) like `/^#?[0-9a-f]{6}$/i` is one way to check. Can you explain each part of it?
2. **blendPixel.** Turn both alphas into 0–1 first. Handle the case where `outAlpha` is 0. What would dividing by 0 put in the pixel?
3. **fillRect.** Round the four edges, then clip them to the frame *before* looping. Why is clipping first better than letting `blendPixel` ignore off-screen pixels?
4. **fillCircle.** Compute the bounding box, clip it, then test each pixel's center.
5. **mixColor, fillVerticalGradient, fillRadialGradient.** Where is the middle of row `y`? Why sample there instead of at its top edge?

## Predict, then run

Replace `null` with your guess, then run each block. (Terminal: `node tools/try.js 01 p1`, or copy a block into `scratch.js` and run `node tools/try.js --file scratch.js`.)

```js predict
// Predict 1: how many pixels does each rectangle cover?
const myGuess = null; // TODO: your guess as [first, second]
const count = f => { let n = 0; for (let i = 3; i < f.data.length; i += 4) if (f.data[i]) n++; return n; };
const a = MS.createFrame(5, 1), b = MS.createFrame(5, 1);
MS.fillRect(a, 0.4, 0, 2, 1, [255, 255, 255]);   // starts at x = 0.4
MS.fillRect(b, 0.6, 0, 2, 1, [255, 255, 255]);   // starts at x = 0.6
MS.reveal("pixels covered by each 2-wide rectangle", myGuess, [count(a), count(b)]);
```

```js predict
// Predict 2: a circle of radius 5 has area πr² ≈ 78.5. How many pixels does it fill?
const myGuess = null; // TODO: your guess, a whole number
const f = MS.createFrame(21, 21);
MS.fillCircle(f, 10.5, 10.5, 5, [255, 255, 255]);
let n = 0;
for (let i = 3; i < f.data.length; i += 4) if (f.data[i]) n++;
MS.reveal("pixels in a radius-5 circle", myGuess, n);
```

```js predict
// Predict 3: half-transparent red painted onto an empty, transparent pixel.
const myGuess = null; // TODO: your guess as [r, g, b, a]
const f = MS.createFrame(1, 1);
MS.blendPixel(f, 0, 0, [255, 0, 0, 128]);
MS.reveal("the pixel after blending", myGuess, MS.getPixel(f, 0, 0));
```

<details><summary>Answers</summary>

1. `[2, 2]`. Edges round to 0 → 2 and 1 → 3.
2. 81. Close to 78.5 but not equal: pixels are all-or-nothing, so the count wobbles around the true area.
3. `[255, 0, 0, 128]`. The color stays pure red; only the alpha says "half there".

</details>

## Break it

Each experiment has a **TODO** block (what to change in your code) and an **experiment** block (run it before and after). Undo each change afterwards. Terminal: `node tools/try.js 01 b1`.

### 1. Forget the division

```js
// src/01-shapes.js → blendPixel
// TODO(break-it): remove the "divide by outAlpha" step from the color math.
//                 Keep the outAlpha math itself.
```

```js experiment
// Break it 1: blend onto nothing, then layer the result over white.
const f = MS.createFrame(1, 1);                  // transparent
MS.blendPixel(f, 0, 0, [255, 0, 0, 128]);        // 50% red onto nothing
const result = MS.getPixel(f, 0, 0);
console.log("50% red on nothing:", result);
const bg = MS.createFrame(1, 1);
MS.clearFrame(bg, [255, 255, 255]);              // white card
MS.blendPixel(bg, 0, 0, result);                 // put the result on top
console.log("...then over white:", MS.getPixel(bg, 0, 0));
// TODO: before the change the second line is a clean pink.
// After it, what color do you get, and why is it darker?
```

Which tests fail? Dark halos around cut-out images in real software are this exact bug.

### 2. Make the right edge inclusive

```js
// src/01-shapes.js → fillRect
// TODO(break-it): make the rectangle also cover the pixel at x = right.
```

```js experiment
// Break it 2: two half-transparent rectangles that share an edge at x = 10.
const f = MS.createFrame(20, 1);
MS.clearFrame(f, [255, 255, 255]);
MS.fillRect(f, 0, 0, 10, 1, [0, 0, 255, 128]);   // covers 0..9
MS.fillRect(f, 10, 0, 10, 1, [0, 0, 255, 128]);  // covers 10..19
console.log("x = 9: ", MS.getPixel(f, 9, 0));
console.log("x = 10:", MS.getPixel(f, 10, 0));
console.log("x = 11:", MS.getPixel(f, 11, 0));
// TODO: before the change all three match. After it, what happens at x = 10?
// Why would that look like a seam?
```

### 3. Skip the bounding box

```js
// src/01-shapes.js → fillCircle
// TODO(break-it): loop over every pixel in the frame instead of the circle's bounding box.
```

```js experiment
// Break it 3: how long do 20 small circles take on a full-size frame?
const f = MS.createFrame(1080, 1920);
const start = Date.now();
for (let i = 0; i < 20; i++) MS.fillCircle(f, 540, 960, 8, [255, 255, 255, 40]);
console.log("20 circles of radius 8:", Date.now() - start, "ms");
// TODO: run before and after. Roughly how many times slower is the full-frame loop?
// How many pixels does each version test per circle?
```

## Checkpoint

Your layer is **complete** when three things are true:

1. **All 17 tests pass.** That unlocks the checkpoint.
2. **The mystery picture comes out right.** The checkpoint runs your functions on a scrambled list of drawing commands full of this chapter's traps: squares that share edges, see-through ink painted onto nothing, then composited over a gradient. Get every rule right and a hidden word appears. Get one wrong and the picture shows it, with a hint about which rule to look at (never the fix).
3. **Three questions are answered correctly** in `checkpoints/01-shapes.js` (in the guide and notebooks, the cell below). Answers are checked against fingerprints, so the repo can't spoil them. You may type an expression instead of a number, like `10 * 10`, or compute an answer with your own functions.

```js checkpoint
// Checkpoint 01 · Shapes & blending. Replace each null with your answer, then run:
//   node tests/run.js 01      (or press "Run checkpoint" in the guide)
MS.answers("01", {
  // 1. You blend [255, 255, 255, 128] (half-transparent white) over an opaque black pixel.
  //    What is the pixel afterwards? Answer as [r, g, b, a].
  q1: null,
  // 2. A pixel is [0, 0, 255, 128]. You blend [255, 0, 0, 64] over it.
  //    What is its new alpha (0–255)?
  q2: null,
  // 3. How many pixels does fillRect(frame, 1.5, 0.5, 3, 2, color) cover?
  //    (Check what Math.round does with exact halves.)
  q3: null,
});
```

Run `node tests/run.js 01`. While tests are failing it shows **🔒 locked**; once they pass it draws the mystery picture right in your terminal and marks each question. When it says **★ Checkpoint passed: layer complete!**, move on. (`tests.html` shows overlapping blended shapes, and a tall dark-blue glowing background. That background is KineticIntro's.)

## In the real world

- Canvas's [`globalAlpha`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalAlpha) and CSS [`opacity`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/opacity) both use Porter–Duff "over"; canvas exposes the full set of operators as [`globalCompositeOperation`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation).
- Browsers usually keep pixels premultiplied internally. That's why a canvas pixel with very low alpha can come back from [`getImageData`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData) with slightly different colors than you put in: precision was lost in the multiply and divide.
- Motion Studio's `KineticIntro.tsx` paints its background with the CSS gradient above, then adds a second radial glow and a dark vignette on top. Those are three layers blended "over" each other, which you can now do by hand.

## Read the originals

- [Porter & Duff, "Compositing Digital Images" (1984)](https://keithp.com/~keithp/porterduff/p253-porter.pdf): the paper that defined "over" and eleven other ways to combine images. Short and readable.
- [Alvy Ray Smith, "Alpha and the History of Digital Compositing" (1995)](http://alvyray.com/Memos/CG/Microsoft/7_alpha.pdf): how the alpha channel was invented, by one of its inventors.
- [W3C Compositing and Blending: source-over](https://www.w3.org/TR/compositing-1/#porterduffcompositingoperators_srcover): how browsers are required to blend.
- [CSS Images: radial gradients](https://www.w3.org/TR/css-images-3/#radial-gradients): the definition behind KineticIntro's background.

## Study buddy prompts

- "I'm on layer 01 of Motion from Scratch. Without giving me code, walk me through Porter–Duff 'over' by asking me what should happen in three cases I can check by hand." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20give%20one%20hint%20at%20a%20time%3A%20point%20at%20the%20test%27s%20expected%20vs%20actual%20values%2C%20then%20ask%20a%20concept%20question%2C%20then%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%20using%20different%20numbers%2C%20then%20point%20at%20the%20line%20to%20look%20at.%20Never%20go%20further%20than%20that.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2001%20%28Shapes%20%26%20blending%29%3A%20rectangles%2C%20circles%2C%20alpha%2C%20gradients.%20Here%27s%20what%20I%20want%20help%20with%3A%20Without%20giving%20me%20code%2C%20walk%20me%20through%20Porter%E2%80%93Duff%20%27over%27%20by%20asking%20me%20what%20should%20happen%20in%20three%20cases%20I%20can%20check%20by%20hand.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20give%20one%20hint%20at%20a%20time%3A%20point%20at%20the%20test%27s%20expected%20vs%20actual%20values%2C%20then%20ask%20a%20concept%20question%2C%20then%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%20using%20different%20numbers%2C%20then%20point%20at%20the%20line%20to%20look%20at.%20Never%20go%20further%20than%20that.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2001%20%28Shapes%20%26%20blending%29%3A%20rectangles%2C%20circles%2C%20alpha%2C%20gradients.%20Here%27s%20what%20I%20want%20help%20with%3A%20Without%20giving%20me%20code%2C%20walk%20me%20through%20Porter%E2%80%93Duff%20%27over%27%20by%20asking%20me%20what%20should%20happen%20in%20three%20cases%20I%20can%20check%20by%20hand.)
- "Ask me to predict which pixels fillRect(1.5, 0, 2, 1) covers, then tell me whether my reasoning (not just my answer) was right." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20give%20one%20hint%20at%20a%20time%3A%20point%20at%20the%20test%27s%20expected%20vs%20actual%20values%2C%20then%20ask%20a%20concept%20question%2C%20then%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%20using%20different%20numbers%2C%20then%20point%20at%20the%20line%20to%20look%20at.%20Never%20go%20further%20than%20that.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2001%20%28Shapes%20%26%20blending%29%3A%20rectangles%2C%20circles%2C%20alpha%2C%20gradients.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20to%20predict%20which%20pixels%20fillRect%281.5%2C%200%2C%202%2C%201%29%20covers%2C%20then%20tell%20me%20whether%20my%20reasoning%20%28not%20just%20my%20answer%29%20was%20right.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20give%20one%20hint%20at%20a%20time%3A%20point%20at%20the%20test%27s%20expected%20vs%20actual%20values%2C%20then%20ask%20a%20concept%20question%2C%20then%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%20using%20different%20numbers%2C%20then%20point%20at%20the%20line%20to%20look%20at.%20Never%20go%20further%20than%20that.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2001%20%28Shapes%20%26%20blending%29%3A%20rectangles%2C%20circles%2C%20alpha%2C%20gradients.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20to%20predict%20which%20pixels%20fillRect%281.5%2C%200%2C%202%2C%201%29%20covers%2C%20then%20tell%20me%20whether%20my%20reasoning%20%28not%20just%20my%20answer%29%20was%20right.)
- "Explain straight versus premultiplied alpha with an analogy, then give me a break-it experiment that shows the difference." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20give%20one%20hint%20at%20a%20time%3A%20point%20at%20the%20test%27s%20expected%20vs%20actual%20values%2C%20then%20ask%20a%20concept%20question%2C%20then%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%20using%20different%20numbers%2C%20then%20point%20at%20the%20line%20to%20look%20at.%20Never%20go%20further%20than%20that.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2001%20%28Shapes%20%26%20blending%29%3A%20rectangles%2C%20circles%2C%20alpha%2C%20gradients.%20Here%27s%20what%20I%20want%20help%20with%3A%20Explain%20straight%20versus%20premultiplied%20alpha%20with%20an%20analogy%2C%20then%20give%20me%20a%20break-it%20experiment%20that%20shows%20the%20difference.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20give%20one%20hint%20at%20a%20time%3A%20point%20at%20the%20test%27s%20expected%20vs%20actual%20values%2C%20then%20ask%20a%20concept%20question%2C%20then%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%20using%20different%20numbers%2C%20then%20point%20at%20the%20line%20to%20look%20at.%20Never%20go%20further%20than%20that.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2001%20%28Shapes%20%26%20blending%29%3A%20rectangles%2C%20circles%2C%20alpha%2C%20gradients.%20Here%27s%20what%20I%20want%20help%20with%3A%20Explain%20straight%20versus%20premultiplied%20alpha%20with%20an%20analogy%2C%20then%20give%20me%20a%20break-it%20experiment%20that%20shows%20the%20difference.)

## Going further (optional)

- **Antialiased circles.** Instead of in-or-out, use coverage `clamp(r − distance + 0.5, 0, 1)` and multiply it into the color's alpha before blending. Compare the edges at scale in `tests.html`.
- **Premultiplied mode.** Write `blendPremultiplied` where colors are stored already multiplied by alpha. Show that the formula no longer needs a division, and find which test values it can't reproduce exactly after 8-bit rounding.
