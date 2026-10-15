# Layer 05 · Easing

_A curve that decides when, not where._

**You'll write:** `bezierPoint`, `bezierSlope`, `solveBezierX`, `cubicBezier` in `src/05-easing.js`
**Check it:** `node tests/run.js 05`, or open `tests.html`
**Builds on:** layers 00–04

Layer 04's `interpolate` takes an `easing` function and reshapes `t` with it. This layer makes the functions worth passing. KineticIntro defines two curves in its code: **APPLE**, `bezier(0.16, 1, 0.3, 1)`, which every entrance uses, and **SMOOTH**, `bezier(0.6, 0, 0.2, 1)`, for every exit. Those four numbers are the same ones CSS takes in `cubic-bezier()`. By the end of this layer you'll turn any four numbers into an easing function, the way a browser does, with a little numerical root-finding.

## Under the hood

### Why ease

Nothing in the real world starts or stops instantly. A ball rolling to a stop slows down; a car pulling away speeds up. Linear motion jumps to full speed on the first frame and halts dead on the last, and our eyes read that as mechanical. An **easing function** fixes this by changing *when* the value gets where it's going: it takes the fraction of the time that has passed, `x`, and returns the fraction of the distance covered, `y`. It starts at (0, 0) and ends at (1, 1), and the shape between is the personality.

CSS describes that shape with a [cubic Bézier curve](https://www.w3.org/TR/css-easing-1/#cubic-bezier-easing-functions) and two control points, P1 = (x1, y1) and P2 = (x2, y2). Its keywords are just named curves: `ease` is `cubic-bezier(0.25, 0.1, 0.25, 1)`, `ease-in` is `(0.42, 0, 1, 1)`, `ease-out` is `(0, 0, 0.58, 1)`.

### A Bézier curve is lerps of lerps

In 1959, Paul de Casteljau, a mathematician at Citroën, found a way to describe smooth car-body curves to a computer; Pierre Bézier at Renault published the same curves a few years later, and they took his name. De Casteljau's way of computing a point on the curve uses nothing but layer 04's `lerp`. For an easing curve, the four control values along one axis are 0, `p1`, `p2` and 1:

```text
  control values:
  0         p1         p2         1
       ●          ●          ●
             ●         ●
                B(u)

  each ● is u of the way from the value
  on its left to the value on its right,
  one row up
```

Run it once with the x values and once with the y values, and you get the point (x, y) on the curve at parameter `u`. Multiply the lerps out and you get a cubic polynomial in `u` instead, which is how browsers write it. Either way works. `bezierSlope` is that polynomial's derivative: how fast the curve moves along one axis as `u` grows.

### The catch: u isn't time

As `u` runs from 0 to 1, the point travels along the curve, but `x` and `y` *both* depend on `u`. An easing function is asked a different question: at time `x`, what's `y`? To answer it, first find the `u` where the curve's x equals the time you were given, then read the curve's y at that `u`:

```text
  x (time)
  │ solve
  ▼
  u
  │ bezierPoint(y1, y2, u)
  ▼
  y (progress)
```

There's no tidy formula for that first arrow. (Cubic equations do have a formula, but it's fussy and loses precision.) So browsers find `u` numerically.

### Newton's method

Guess a `u`, see how far its x is from the target, then use the slope to jump to where a straight line would hit the target: `u ← u − error ÷ slope`. Here's ease-in (x1 = 0.42, x2 = 1) looking for x = 0.6, starting from the guess `u` = 0.6:

```text
  step  u          x at u       error
  0     0.6        0.76896      +0.169
  1     0.4370     0.58058      −0.0194
  2     0.4525     0.59988      −0.00012
  3     0.452605   0.60000000   −0.000000005

  step  slope   next u = u − error ÷ slope
  0     1.037   0.4370
  1     1.256   0.4525
  2     1.240   0.452605
  3             close enough
```

The error goes 0.17, 0.02, 0.0001, 0.000000005: each step roughly doubles the number of correct digits. That's [Newton's method](https://en.wikipedia.org/wiki/Newton%27s_method), and it's usually done in three or four steps.

> **Study buddy:** "Ask me questions until I can explain why Newton's method divides by the slope, and what goes wrong when the slope is nearly zero. Use a curve that isn't an easing curve. No code." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2005%20%28Easing%29%3A%20a%20cubic-B%C3%A9zier%20solver.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20questions%20until%20I%20can%20explain%20why%20Newton%27s%20method%20divides%20by%20the%20slope%2C%20and%20what%20goes%20wrong%20when%20the%20slope%20is%20nearly%20zero.%20Use%20a%20curve%20that%20isn%27t%20an%20easing%20curve.%20No%20code.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2005%20%28Easing%29%3A%20a%20cubic-B%C3%A9zier%20solver.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20questions%20until%20I%20can%20explain%20why%20Newton%27s%20method%20divides%20by%20the%20slope%2C%20and%20what%20goes%20wrong%20when%20the%20slope%20is%20nearly%20zero.%20Use%20a%20curve%20that%20isn%27t%20an%20easing%20curve.%20No%20code.)

### Bisection, the safety net

Newton's method has a weak spot: where the curve goes flat, the slope is near zero, and dividing by it flings `u` far away. **Bisection** can't fail. The curve's x only ever increases, so the answer is always inside a known gap, starting with 0 to 1. Check the middle: if its x is too big, the answer is in the left half; otherwise it's in the right half. Each check halves the gap:

```text
  [0 ─────────────────────────────── 1]
  x at 0.5 too big?    keep the left half
  [0 ─────────────── 0.5]
  x at 0.25 too small? keep the right half
          [0.25 ──── 0.5]
  … until the x at the middle is within 1e-7
```

The gap is in `u`, but the spec's 1e-7 is about `x`, and an easing curve's x can change up to 3 times faster than `u`, so it can take about 25 halvings. It's slow but sure, so real solvers use both. [WebKit's `UnitBezier`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/UnitBezier.h), the code behind Safari's CSS animations, takes a first guess from a table of 11 samples, tries up to 4 Newton steps, and bisects if they don't get close enough.

### Only x has to behave

CSS insists that x1 and x2 stay between 0 and 1, and it rejects the curve otherwise. Outside that range the curve's x can turn around and run backwards, which would mean time running backwards: one moment `x` would have three different `u`s and no single answer. That's the same reason layer 04 insisted on increasing keyframes.

The y values have no such rule. A y control point above 1 makes the value **overshoot** its target and settle back, like `cubic-bezier(0.34, 1.56, 0.64, 1)`; one below 0 makes it back up before it starts, called **anticipation**. Both are old tricks from hand-drawn animation.

## Your turn

Work through `src/05-easing.js` top to bottom. Each function's comment is its spec. Some questions to guide you, in order:

1. **bezierPoint.** What should it give at `u` = 0 and `u` = 1, whatever `p1` and `p2` are? Work the picture above by hand for `p1` = 0.1, `p2` = 0.7 and `u` = 0.5 before you run anything.
2. **bezierSlope.** If you multiplied the lerps out into a polynomial, how do you take its derivative? The test "bezierSlope is how fast bezierPoint changes" lets you check your answer numerically.
3. **solveBezierX.** What's a good first guess for `u`? When should you stop trusting Newton's method? If you use bisection, what tells you which half to keep?
4. **cubicBezier.** It returns a function. What does that function do with x = −0.5? Where do x1 and x2 get checked: once, or on every call?

Run the tests after each function. A failing test tells you exactly what it expected.

Once it works, the test pictures show five easing curves with their control points, five dots making the same move with five timings, and a word rising in with APPLE and fading out with SMOOTH.

> **Study buddy:** "I'll describe how my solveBezierX works, in words. Don't fix it. Give me a curve and an x where it would fail, and let me work out why." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2005%20%28Easing%29%3A%20a%20cubic-B%C3%A9zier%20solver.%20Here%27s%20what%20I%20want%20help%20with%3A%20I%27ll%20describe%20how%20my%20solveBezierX%20works%2C%20in%20words.%20Don%27t%20fix%20it.%20Give%20me%20a%20curve%20and%20an%20x%20where%20it%20would%20fail%2C%20and%20let%20me%20work%20out%20why.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2005%20%28Easing%29%3A%20a%20cubic-B%C3%A9zier%20solver.%20Here%27s%20what%20I%20want%20help%20with%3A%20I%27ll%20describe%20how%20my%20solveBezierX%20works%2C%20in%20words.%20Don%27t%20fix%20it.%20Give%20me%20a%20curve%20and%20an%20x%20where%20it%20would%20fail%2C%20and%20let%20me%20work%20out%20why.)

## Predict, then run

Guess first, then run. In a terminal, `node tools/try.js 05` lists the blocks.

```js predict
// Predict 1: CSS ease-in is cubic-bezier(0.42, 0, 1, 1). Halfway along its curve
// (u = 0.5), what fraction of the time has passed? That's the curve's x at u = 0.5.
const myGuess = null; // TODO: your guess, to 4 decimals
MS.reveal("ease-in's x at u = 0.5", myGuess, MS.bezierPoint(0.42, 1, 0.5));
```

```js predict
// Predict 2: cubic-bezier(0.34, 1.56, 0.64, 1) overshoots. What's the highest
// value it reaches? Its control point says 1.56.
const myGuess = null; // TODO: your guess, to 2 decimals
const back = MS.cubicBezier(0.34, 1.56, 0.64, 1);
let highest = 0;
for (let i = 0; i <= 1000; i++) highest = Math.max(highest, back(i / 1000));
MS.reveal("the highest value", myGuess, Math.round(highest * 100) / 100);
```

```js predict
// Predict 3: KineticIntro's APPLE, cubic-bezier(0.16, 1, 0.3, 1). What fraction
// of the time does it take to cover 90% of the distance?
const myGuess = null; // TODO: your guess, to 2 decimals
const APPLE = MS.cubicBezier(0.16, 1, 0.3, 1);
let x = 0;
while (APPLE(x) < 0.9) x = Math.round((x + 0.01) * 100) / 100;
MS.reveal("time to cover 90%", myGuess, x);
```

<details><summary>Answers</summary>

1. 0.6575. Halfway along the curve, two thirds of the time has already gone: `u` is the curve's own parameter, not time. That gap is why `solveBezierX` exists.
2. 1.1. A control point pulls the curve toward it but never reaches it, so 1.56 only lifts the peak to about 1.1. The same is true of every Bézier handle, which is why designers drag handles further than the shape they want.
3. 0.33. APPLE covers 90% of the move in a third of the time and spends the other two thirds on the last 10%. That long, gentle settle is what makes KineticIntro's words feel like they land rather than stop.

</details>

## Break it

Once your tests pass: make each TODO change, run the experiment before and after, explain the difference, then undo it.

### 1. Skip the solve

```js experiment
// Break it 1: why solve for u at all?
// TODO(break-it), in src/05-easing.js → cubicBezier:
//   skip solveBezierX and use x itself as u. Change nothing else.
const easeIn = MS.cubicBezier(0.42, 0, 1, 1);
for (const x of [0.25, 0.5, 0.75]) console.log("ease-in at x = " + x + " → " + easeIn(x).toFixed(4));
// TODO: what does ease-in give at x = 0.5 after the change? Which curve are you really drawing now?
```

### 2. Newton's method with no safety net

```js experiment
// Break it 2: what is the fallback for?
// TODO(break-it), in src/05-easing.js → solveBezierX:
//   use Newton's method only: start at u = x, take 8 steps, return u. Nothing else.
for (const x of [0.3, 0.45, 0.5, 0.55]) {
  const u = MS.solveBezierX(1, 0, x);
  console.log("x = " + x + " → u = " + u + ", the curve's x there: " + MS.bezierPoint(1, 0, u));
}
// TODO: this curve goes flat at u = 0.5. Which x values go wrong after the change, and why those?
```

### 3. Settle for less precision

```js experiment
// Break it 3: how accurate is accurate enough?
// TODO(break-it), in src/05-easing.js → solveBezierX:
//   stop as soon as the curve's x is within 0.01 of x, instead of 1e-7.
const APPLE = MS.cubicBezier(0.16, 1, 0.3, 1);
for (const x of [0.05, 0.1, 0.2, 0.4]) console.log("x = " + x + " → a 1920-pixel move is at " + (APPLE(x) * 1920).toFixed(1) + " px");
// TODO: how many pixels does the looser answer move things? Would you see it on a 1080 × 1920 video?
```

A steep curve magnifies small errors in x: APPLE starts out more than six times steeper than a straight line. The precision you need depends on how far things move on screen, which is why the spec asks for 1e-7.

## Checkpoint

When all 15 tests pass, the checkpoint unlocks (layer 00 explains how it works). The picture is a freeze-frame: dots flying in from scattered places, each on its own easing curve, caught at the instant when they should line up into a word. Its traps: everyday curves, curves that start flat, go flat in the middle or end flat, curves that overshoot, and times outside 0 to 1. The three questions are below.

```js checkpoint
// Checkpoint 05 · Easing. Replace each null with your answer.
MS.answers("05", {
  // 1. CSS's default timing function, ease, is cubic-bezier(0.25, 0.1, 0.25, 1).
  //    Halfway through the time (x = 0.5), how far along is the value? Round to 3 decimals.
  q1: null,
  // 2. KineticIntro brings each word in over 26 frames with APPLE, cubic-bezier(0.16, 1, 0.3, 1).
  //    What is the progress after 5 frames? Round to 2 decimals.
  q2: null,
  // 3. KineticIntro's SMOOTH is cubic-bezier(0.6, 0, 0.2, 1). At what time x does it reach
  //    exactly halfway (y = 0.5)? Round to 3 decimals. There's a way to do this without a solver.
  q3: null,
});
```

## In the real world

- CSS transitions and animations take these curves directly: `transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1)`. The keywords `ease`, `ease-in` and the rest are fixed curves defined in the [CSS Easing Functions](https://www.w3.org/TR/css-easing-1/) spec.
- Remotion's [`Easing.bezier()`](https://www.remotion.dev/docs/easing) is the same idea, code borrowed from React Native: it starts from a table of 11 samples for a better first guess, then takes Newton steps or bisects.
- Design tools speak the same language: Figma's custom easing, After Effects' graph editor and Apple's [`CAMediaTimingFunction`](https://developer.apple.com/documentation/quartzcore/camediatimingfunction) all describe timing with two control points.

## Going further (optional)

- **Read the original.** The [cubic Bézier easing functions](https://www.w3.org/TR/css-easing-1/#cubic-bezier-easing-functions) section of CSS Easing Functions. Notice what browsers do with times below 0 or above 1: instead of clamping, they extend the curve along its tangent lines.
- Do the same: replace clamping with CSS's tangent-line rule, and check that `interpolate` with "extend" now keeps moving smoothly past the end.
- Count your solver's Newton steps for 1,000 values of x, then add an 11-sample lookup table for the first guess, like Remotion's, and count again.
