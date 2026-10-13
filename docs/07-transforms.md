# Layer 07 · Transforms & blur

_A matrix is six numbers that say where everything goes._

**You'll write:** `translate`, `scale`, `rotate`, `multiply`, `transformPoint`, `invert`, `drawTransformed`, `boxBlur`, `blur` in `src/07-transforms.js`
**Check it:** `node tests/run.js 07`, or open `tests.html`
**Builds on:** layers 00–06

Each word in KineticIntro arrives the same way: it grows from 80% to full size while it sharpens out of a 14-pixel blur, then keeps pushing slowly toward the camera before it blurs away again. In CSS that's two lines, `transform: scale(…)` and `filter: blur(…)`, and the browser does the work. In this layer you do the work: matrices that move, scale and turn anything, a way to draw a picture through a matrix without holes or dark edges, and a blur whose cost doesn't depend on how wide it is.

## Under the hood

### Six numbers move everything

Moving, scaling, rotating and slanting are all the same kind of operation, an **affine transform**, and six numbers describe any of them. The [HTML canvas standard](https://html.spec.whatwg.org/multipage/canvas.html#transformations) and CSS's [`matrix()`](https://www.w3.org/TR/css-transforms-1/#funcdef-transform-matrix) both write them as `a, b, c, d, e, f`:

```text
  ┌ a  c  e ┐   ┌ x ┐        x' = a·x + c·y + e
  │ b  d  f │ × │ y │        y' = b·x + d·y + f
  └ 0  0  1 ┘   └ 1 ┘
```

The six numbers are easier to read as three arrows. `(e, f)` is where the origin `(0, 0)` lands. `(a, b)` is where one step along x, the point `(1, 0)`, lands, measured from there; `(c, d)` is the same for one step along y. Draw those three things and you've drawn the whole transform: every other point follows from them.

```text
  scale(2, 0.5)                       a slant: c = 0.5, the rest as in scale(1)
  (1, 0) → (2, 0)                     (1, 0) → (1, 0)
  (0, 1) → (0, 0.5)                   (0, 1) → (0.5, 1)

  ┌────┐                              ┌────┐          ┌────┐
  │    │    →    ┌────────┐           │    │    →      ╲    ╲
  │    │         └────────┘           │    │            ╲    ╲
  └────┘                              └────┘             └────┘
                                      (y points down, so the bottom moves right)
```

On a screen, y points **down**. A rotation that turns +x toward +y therefore looks clockwise, the opposite of the math textbook picture. Canvas and CSS both work this way.

### Order matters

A transform made of steps is one matrix: **multiplying** two matrices gives a single matrix that does both. But which one happens first changes the result. Take the point `x = 3`:

```text
  scale by 2, then move right 4:    3 → 6 → 10
  move right 4, then scale by 2:    3 → 7 → 14
```

In `multiply(m, n)`, `n` happens first. That reads backwards at first, but it's the same order as function calls: in `m(n(p))`, n runs first.

Order is also how you scale around a point other than the origin. `scale(1.04)` on its own grows everything away from `(0, 0)`, the top-left corner, so a word in the middle of the screen would drift down and to the right. To grow around the middle, three steps: move the middle to the origin, scale, move it back.

### Drawing backwards

To draw a picture through a matrix, the obvious plan is to take every source pixel, move it, and paint it where it lands. Try that with a 3× zoom: neighboring source pixels land 3 pixels apart, and the pixels in between are never painted.

```text
  forward: each source pixel goes somewhere     backward: each destination pixel asks
                                                "where did I come from?"
  █ █ █      →     █ · · █ · · █                █ █ █      ←     █ █ █ █ █ █ █ █ █
                   · · · · · · ·                                  (every pixel is filled)
                   holes
```

So renderers work **backwards**: for each pixel of the destination, find the point in the source that lands on it, and take the color from there. That needs the matrix that undoes `m`, its **inverse**. Not every matrix has one. The number `a·d − b·c` (the **determinant**) says how much the matrix scales areas. When it's 0, the matrix squashes everything onto a line or a point, and there's no way back: many source points land on the same spot.

### Between the pixels

The point you find in the source is almost never exactly on a pixel. Pixel `(x, y)` is a little square from `(x, y)` to `(x + 1, y + 1)`, so its center is `(x + 0.5, y + 0.5)`. A point between centers takes a little of each of the four nearest pixels, more from the nearer ones. That's **bilinear sampling**: blend along x, then along y.

```text
     center (3.5, 0.5)       center (4.5, 0.5)
            ●─────────●──────────────────●
                      ↑ the sample, 30% of the way from left to right
                         gets 70% of the left pixel and 30% of the right
```

Nearest-neighbor sampling (just take the closest pixel) is faster, but edges turn into stairs as a picture rotates, and a slow move jumps a whole pixel at a time. Bilinear sampling lets a picture move by a fraction of a pixel, which matters for slow motion like KineticIntro's 4% push.

> **Study buddy:** "Ask me questions until I can explain why drawing through a matrix works backwards, from destination pixels to source points, and what the determinant has to do with it. No code." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2007%20%28Transforms%20%26%20blur%29%3A%20matrices%2C%20resampling%20and%20blur.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20questions%20until%20I%20can%20explain%20why%20drawing%20through%20a%20matrix%20works%20backwards%2C%20from%20destination%20pixels%20to%20source%20points%2C%20and%20what%20the%20determinant%20has%20to%20do%20with%20it.%20No%20code.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2007%20%28Transforms%20%26%20blur%29%3A%20matrices%2C%20resampling%20and%20blur.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20questions%20until%20I%20can%20explain%20why%20drawing%20through%20a%20matrix%20works%20backwards%2C%20from%20destination%20pixels%20to%20source%20points%2C%20and%20what%20the%20determinant%20has%20to%20do%20with%20it.%20No%20code.)

### Edges without dark fringes

Bilinear sampling at the edge of a picture mixes a pixel of the picture with a transparent pixel outside it. Here's the trap from layer 01. A transparent pixel is stored as `[0, 0, 0, 0]`: "black, invisible". Average a white pixel with it channel by channel, and you get `[128, 128, 128, 128]`, a half-transparent **grey**. The black that was never visible has leaked in, and every edge gets a dark fringe.

```text
  straight average                 premultiplied average
  [255,255,255,255]                color × alpha:  255·255 and 0·0
  [  0,  0,  0,  0]                alpha:          255 and 0
  ────────────────── ÷ 2           ─────────────────────────────
  [128,128,128,128]  grey          alpha 128, color (255·255) ÷ 255 = 255: still white
```

The fix is to average **premultiplied** colors: weight each pixel's color by its alpha, so a transparent pixel adds nothing to the color, only to the alpha. Divide by the total alpha at the end to get a plain color back. Browsers keep pixels premultiplied for exactly this reason.

### A blur that doesn't care how big it is

The simplest blur is a **box blur**: each pixel becomes the average of the pixels in a box around it. A box of radius `r` is `2r + 1` pixels wide. Two tricks make it fast:

```text
  1. rows, then columns:  blurring every row, then every column, gives the same
                          result as averaging the whole square, but each pixel
                          adds up 2·(2r + 1) values instead of (2r + 1)².

  2. a running sum:       moving the box one pixel right changes only its two ends.
                          ┌───────────┐
                          │ a b c d e │ f        sum(b…f) = sum(a…e) − a + f
                          └───────────┘
                          Two operations per pixel, whether r is 1 or 100.
```

Pixels outside the frame count as transparent, so a blur fades a picture out at its edges instead of smearing the edge pixels outward. Average premultiplied, for the same reason as above.

### Three boxes make a bell

A box blur looks boxy: a single bright dot becomes a flat square. Box-blur that square again and the profile becomes a triangle; a third time and it's a smooth bell, very close to a **Gaussian**. That's the [central limit theorem](https://en.wikipedia.org/wiki/Central_limit_theorem) at work: adding up a few random amounts quickly gives a bell curve.

```text
  one box        two boxes        three boxes
  ▁▁████▁▁       ▁▂▄██▄▂▁        ▁▂▅██▅▂▁
```

A Gaussian blur's size is its **standard deviation**, σ (sigma), in pixels, and that's what CSS's [`blur()`](https://www.w3.org/TR/filter-effects-1/#funcdef-filter-blur) takes: `blur(14px)` means σ = 14. To pick `r` for three boxes, match the spread. A box of radius `r` has a variance (σ²) of `r(r + 1) ÷ 3`, and variances add up when blurs are stacked, so three boxes give `r(r + 1)`. Setting that equal to σ² and solving gives the radius in `blur`'s spec. For σ = 5 it's `round((√101 − 1) ÷ 2)` = round(4.52) = 5.

## Your turn

Work through `src/07-transforms.js` top to bottom. Each function's comment is its spec. Some questions to guide you, in order:

1. **translate and scale.** Using the three arrows, where do `(0, 0)`, `(1, 0)` and `(0, 1)` land for each? What should `scale(3)` do when there's no second number?
2. **rotate.** After a quarter turn, where should `(1, 0)` land? And `(0, 1)`? What about a turn by any angle: what are the coordinates of a point one step from the origin at that angle?
3. **transformPoint.** Which of the six numbers multiply x, which multiply y, and which are just added?
4. **multiply.** If `n` sends the origin to some point, where does `multiply(m, n)` send it? Answer the same question for `(1, 0)` and `(0, 1)`, and you have all six numbers.
5. **invert.** What undoes `scale(4)`? What undoes `translate(3, −1)`? For any matrix, you have two equations, `x' = …` and `y' = …`: can you solve them for x and y? Where does `a·d − b·c` turn up?
6. **drawTransformed.** Which point of `src` lands on the center of dest pixel `(2, 5)`? Which four src pixels surround that point, and how far is it from each of their centers? Do you need to visit every pixel of dest, or only the ones `src` can reach?
7. **boxBlur.** What do you keep in your running sums so a transparent pixel doesn't pull the color toward black? When the box slides by one pixel, which pixel leaves and which arrives?
8. **blur.** Once `boxBlur` works, this one is short. Check your radius for σ = 5 against the chapter.

Run the tests after each function. A failing test tells you exactly what it expected.

Once it works, the test pictures show one sprite drawn through five different matrices, the same word at four blur sizes, and a word that pushes in out of a blur, then spins away.

> **Study buddy:** "Give me two transforms, like 'rotate a quarter turn' and 'move right 5', and ask me where a point ends up in each order before I run anything. Keep going until I get the order of multiply right every time. No code." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2007%20%28Transforms%20%26%20blur%29%3A%20matrices%2C%20resampling%20and%20blur.%20Here%27s%20what%20I%20want%20help%20with%3A%20Give%20me%20two%20transforms%2C%20like%20%27rotate%20a%20quarter%20turn%27%20and%20%27move%20right%205%27%2C%20and%20ask%20me%20where%20a%20point%20ends%20up%20in%20each%20order%20before%20I%20run%20anything.%20Keep%20going%20until%20I%20get%20the%20order%20of%20multiply%20right%20every%20time.%20No%20code.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2007%20%28Transforms%20%26%20blur%29%3A%20matrices%2C%20resampling%20and%20blur.%20Here%27s%20what%20I%20want%20help%20with%3A%20Give%20me%20two%20transforms%2C%20like%20%27rotate%20a%20quarter%20turn%27%20and%20%27move%20right%205%27%2C%20and%20ask%20me%20where%20a%20point%20ends%20up%20in%20each%20order%20before%20I%20run%20anything.%20Keep%20going%20until%20I%20get%20the%20order%20of%20multiply%20right%20every%20time.%20No%20code.)

## Predict, then run

Guess first, then run. In a terminal, `node tools/try.js 07` lists the blocks.

```js predict
// Predict 1: move right 10, then turn a quarter turn (clockwise on screen).
// Where does the origin (0, 0) end up?
const myGuess = null; // TODO: your guess, as [x, y]
const m = MS.multiply(MS.rotate(Math.PI / 2), MS.translate(10, 0));
MS.reveal("the origin ends up at", myGuess, MS.transformPoint(m, 0, 0).map(v => Math.round(v * 1e6) / 1e6));
```

```js predict
// Predict 2: a white line 1 pixel wide and fully opaque (alpha 255), blurred with σ = 2.
// What's the highest alpha left anywhere in the blurred line?
const myGuess = null; // TODO: your guess, 0 to 255
const line = MS.createFrame(21, 21);
MS.fillRect(line, 10, 0, 1, 21, [255, 255, 255]);
const blurred = MS.blur(line, 2);
let highest = 0;
for (let i = 3; i < blurred.data.length; i += 4) highest = Math.max(highest, blurred.data[i]);
MS.reveal("the highest alpha", myGuess, highest);
```

```js predict
// Predict 3: a white square is drawn half a pixel to the right of the pixel grid, onto
// a transparent frame. Its left edge only half covers a column of pixels. What's the
// RED value of a pixel in that half-covered column?
const myGuess = null; // TODO: your guess, 0 to 255
const square = MS.createFrame(4, 4);
MS.clearFrame(square, [255, 255, 255]);
const out = MS.createFrame(8, 6);
MS.drawTransformed(out, square, MS.translate(2.5, 1));
MS.reveal("the red value at the edge", myGuess, MS.getPixel(out, 2, 2)[0]);
```

<details><summary>Answers</summary>

1. [0, 10]. The move happens first, so the origin goes to (10, 0); then the quarter turn swings it from "right" to "down". In the other order the origin would turn first (staying put, because it's the center of the turn) and then move to (10, 0).
2. 39, about 15% of what it was. A blur doesn't remove any ink, it spreads it: the same total alpha now covers a band about 13 pixels wide, so each pixel gets much less. That's why KineticIntro's blurred words look faint as well as soft.
3. 255. The pixel is half transparent (alpha 128), but still pure white. Averaged straight, the transparent pixel outside the square would have pulled it to 128, a grey fringe.

</details>

## Break it

Once your tests pass: make each TODO change, run the experiment before and after, explain the difference, then undo it.

### 1. Multiply the other way round

```js experiment
// Break it 1: what does the order inside multiply decide?
// TODO(break-it), in src/07-transforms.js → multiply:
//   swap m and n, so it does m first, then n.
const grow = (cx, cy, s) => MS.multiply(MS.translate(cx, cy), MS.multiply(MS.scale(s), MS.translate(-cx, -cy)));
for (const s of [1, 1.5, 2]) console.log("scale " + s + " around (50, 20): the middle goes to " + MS.transformPoint(grow(50, 20, s), 50, 20).join(", "));
// TODO: before the change, the middle stays put. After it, where does it go, and why does it move more as s grows?
```

### 2. Paint forwards

```js experiment
// Break it 2: why draw backwards?
// TODO(break-it), in src/07-transforms.js → drawTransformed:
//   instead, loop over src's pixels, move each pixel's center with m, and set the
//   dest pixel it lands on to that src pixel's color.
const dot = MS.createFrame(4, 4);
MS.clearFrame(dot, [255, 255, 255]);
const out = MS.createFrame(20, 20);
MS.drawTransformed(out, dot, MS.scale(4));
let painted = 0;
for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (MS.getPixel(out, x, y)[3] > 0) painted++;
console.log("pixels painted: " + painted);
console.log(MS.asciiFrame(out));
// TODO: a 4 × 4 square scaled by 4 should cover 16 × 16 pixels. How many get painted after the change?
```

### 3. Forget the alpha

```js experiment
// Break it 3: what is premultiplying for?
// TODO(break-it), in src/07-transforms.js → boxBlur:
//   average each channel on its own, ignoring alpha (red is the average of the reds).
const sign = MS.createFrame(30, 15);
MS.fillRect(sign, 8, 4, 14, 7, [255, 220, 0]);
const soft = MS.blur(sign, 2);
console.log("a pixel just outside the yellow box: " + MS.getPixel(soft, 6, 7).join(", "));
// TODO: before the change it's yellow and faint. After it, what color is it? Picture it over a white page.
```

## Checkpoint

When all 18 tests pass, the checkpoint unlocks (layer 00 explains how it works). The picture is a word made of dots, leaning in italics through your own `transformPoint`. Every dot asks one small question about a rule, and a dot that gets a wrong answer flies off its letter. Its traps: matrices that use all six numbers, rotations past a quarter turn, `multiply` in both orders, matrices that can't be undone, pictures turned upside down and scaled up, sprites that only half cover a pixel, opacity over a background, blur radii that only just round up or down, and the edges of the frame. The three questions are below.

```js checkpoint
// Checkpoint 07 · Transforms & blur. Replace each null with your answer.
MS.answers("07", {
  // 1. KineticIntro's frame is 1080 × 1920. Its words push in to scale 1.04 around the
  //    middle of the frame, (540, 960). Where does the frame's left edge (x = 0) end up?
  //    One decimal.
  q1: null,
  // 2. KineticIntro blurs its words in from blur(14px). Built from three box blurs, how
  //    many pixels wide is the area one pixel spreads over? Count every pixel that gets
  //    any of it, before anything is rounded to whole bytes.
  q2: null,
  // 3. m = multiply(translate(100, 50), multiply(rotate(Math.PI / 2), scale(2))).
  //    Which point does m move to (60, 70)? Answer as [x, y].
  q3: null,
});
```

## In the real world

- Canvas keeps one of these matrices as its "current transform": [`translate()`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/translate), [`rotate()`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/rotate) and [`scale()`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/scale) each multiply it by a new matrix on the right, which is why the last one you call happens to your shapes first. [`DOMMatrix`](https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrix) has the same six numbers as its `a` to `f`.
- CSS's [`transform-origin`](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-origin) is the "move to the origin, scale, move back" trick, done for you. Its default is the element's center, which is why KineticIntro's `scale()` grows words from their middle.
- [`imageSmoothingEnabled`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled) switches canvas between smooth sampling and nearest-neighbor, and CSS's [`image-rendering: pixelated`](https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering) does the same for images, which is how this course's pages show your frames with crisp pixels.
- Browsers hand `filter: blur()` to their graphics library (Chrome's is [Skia](https://skia.org/)), which picks its own fast way to approximate a Gaussian, often on the GPU.

## Going further (optional)

- **Read the original.** The Filter Effects spec's [`feGaussianBlur`](https://www.w3.org/TR/filter-effects-1/#feGaussianBlurElement) section gives its own recipe for three box blurs, with a box size chosen a different way, and a special case for even sizes. Work out its box size for σ = 14 and compare the spread with yours.
- Add `skew(ax, ay)` (CSS has [`skew()`](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/skew)) and draw a word leaning by 15°.
- Make `drawTransformed` faster: when m is only a translation by whole pixels, no sampling is needed at all. How much faster is the third test picture?
