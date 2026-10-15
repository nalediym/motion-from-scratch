# Layer 04 · Interpolate

_Every moving number is a line between keyframes._

**You'll write:** `lerp`, `inverseLerp`, `clamp`, `interpolate`, `interpolateColors` in `src/04-interpolate.js`
**Check it:** `node tests/run.js 04`, or open `tests.html`
**Builds on:** layers 00–03

Layer 03 gave every frame a number. Now each frame needs to know where things are: how faded a word is at frame 12, how far the light sweep has traveled by frame 150. KineticIntro answers every one of those questions with a single function from Remotion, `interpolate`. Here's its light sweep:

```js
interpolate(frame, [140, 172], [-20, 130], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
```

Between frames 140 and 172, the sweep travels from −20% to 130% of the way across the logo, and before and after that it stays put. By the end of this layer you'll have written `interpolate` yourself, options and all, plus a version for colors.

## Under the hood

### Keyframes and in-betweens

In hand-drawn animation, a lead animator drew the **keyframes**, the poses that matter, and assistants called [in-betweeners](https://en.wikipedia.org/wiki/Inbetweening) drew every frame between them. Software took over that job, now called *tweening*: you say where something is at a few moments, and the computer fills in the rest.

The simplest way to fill in is a straight line. **lerp**, short for *linear interpolation*, walks a fraction `t` of the way from `a` to `b`:

```text
  lerp(a, b, t) = a + (b − a) × t

  t: 0     0.25  0.5         1          1.5
     40 ── 50 ── 60 ──────── 80 · · · · 100
     a                       b
```

`t` is a fraction, not a frame: 0 is the start, 1 is the end, 0.5 is halfway. Nothing stops it going past 1 or below 0; the line just keeps going. You've already written one: layer 01's `mixColor` is a lerp on four channels at once.

### Map, don't move

`inverseLerp` runs lerp backwards: given a value, which `t` gives it? Put the two together and you can map any range onto any other. Say a word fades in between frames 30 and 50, and you want its opacity at frame 35:

```text
  frames    30 ────●─────────── 50
                  35
  opacity    0 ────●───────────  1

  frames:  inverseLerp(30, 50, 35) = 0.25
  opacity: lerp(0, 1, 0.25)        = 0.25
```

First turn the input into a fraction of its range, then turn that fraction into a point in the output range. For two keyframes, that's all `interpolate` does. Notice what's missing: nothing is stored between frames. The opacity at frame 35 comes from 35 alone, which is exactly what layer 03's frame = f(n) asked for.

> **Study buddy:** "Ask me questions until I can explain why interpolate is inverseLerp followed by lerp, using a fade-out as the example. No code." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2004%20%28Interpolate%29%3A%20lerp%2C%20clamp%2C%20ranges%2C%20extrapolation.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20questions%20until%20I%20can%20explain%20why%20interpolate%20is%20inverseLerp%20followed%20by%20lerp%2C%20using%20a%20fade-out%20as%20the%20example.%20No%20code.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2004%20%28Interpolate%29%3A%20lerp%2C%20clamp%2C%20ranges%2C%20extrapolation.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20questions%20until%20I%20can%20explain%20why%20interpolate%20is%20inverseLerp%20followed%20by%20lerp%2C%20using%20a%20fade-out%20as%20the%20example.%20No%20code.)

### Many keyframes

With more than two keyframes, the ranges become a chain of **segments**. Find the segment the input falls in, then map within that segment alone:

```text
  inputRange  0 ────── 30 ── 50 ──────── 90
  outputRange 0        100   60          60
  segment     └─── 0 ───┘└ 1 ─┘└──── 2 ───┘

  input 40 falls in segment 1:
    t = (40 − 30) / (50 − 30) = 0.5
    output = lerp(100, 60, 0.5) = 80
```

Keyframes don't have to be evenly spaced, and in real animation they rarely are: each word in KineticIntro takes 26 frames to come in and 22 to leave. What `interpolate` does insist on is that the inputs are **strictly increasing**. If they weren't, one input could sit inside two segments at once, and there'd be no single right answer. The outputs can go up, down, or both.

### Past the ends

Before the first keyframe and after the last, `interpolate` has to make something up. That's **extrapolation**. Say a word scales up from 0.8 to 1 between frames 0 and 10 (KineticIntro's words start at 80% size). What's its scale at frame 20?

```text
  scale
   1.2 ┤                    ·   "extend"
   1.1 ┤               ·
   1.0 ┤          ●━━━━━━━━━━━━ "clamp"
   0.9 ┤     ·
   0.8 ┤●
       └┬─────────┬─────────┬──▶ frame
        0        10        20

  ●        a keyframe
  "extend" keeps going along the end
           segment's line
  "clamp"  holds the end value
```

- **"extend"**, Remotion's default, keeps going along the end segment's line: 1.2, and still growing. With several keyframes, "the end segment" means the **first** segment before the first keyframe and the **last** one after the last keyframe.
- **"clamp"** holds the end value: 1.
- **"identity"** returns the input itself: 20. It only makes sense when input and output measure the same thing.

`extrapolateLeft` and `extrapolateRight` choose separately for each end. "extend" is the honest mathematical continuation, but anything with a natural limit, like opacity, a progress bar or a fade, needs "clamp". KineticIntro clamps every single call.

### Easing plugs in at t

One more option, `easing`, is a function that reshapes `t` before it's mapped to the output. It takes the progress through the segment and returns a new progress:

```text
  t → t        even steps
  ●────●────●────●────●────●────●────●────●
  ●●─●──●───●─────●──────●───────●────────●
  t → t × t    slow start, fast finish
```

Each dot is where the value is after another eighth of the time. Because easing works on `t`, the start and end don't move: `t` = 0 still gives the first output and `t` = 1 the last. Easing only changes *when* the value gets there. With several keyframes, every segment gets its own trip from 0 to 1, so the easing starts over at each keyframe. Past the ends, with "extend", `t` goes below 0 or above 1, and the easing is applied to it there too: with `t × t`, the extension curves instead of running straight. Layer 05 builds real easing curves; this layer just calls whatever function it's given.

### Colors are four numbers

`interpolateColors` blends colors one channel at a time: red with red, green with green, blue with blue, alpha with alpha, each its own interpolation over the same input range. Two things differ from plain numbers:

- **It always clamps.** There's no color past "fully red" to extend into; the channel would leave 0–255.
- **It rounds.** A channel is a whole byte. A `Uint8ClampedArray` would round for you, but it sends exact halves to the nearest *even* number (layer 00's bonus). Rounding with [`Math.round`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round) yourself sends them up instead: 128.5 becomes 129, where a clamped array would give 128.

Remotion's own [`interpolateColors()`](https://www.remotion.dev/docs/interpolate-colors) works the same way: channel by channel, clamped at both ends, rounded.

## Your turn

Work through `src/04-interpolate.js` top to bottom. Each function's comment is its spec. Some questions to guide you, in order:

1. **lerp.** What should `lerp(a, b, 0)` and `lerp(a, b, 1)` give? Check your formula against both before running anything.
2. **inverseLerp.** If `lerp(a, b, t)` gives `v`, what's `t`? Why does `a === b` have to be an error?
3. **clamp.** What should `clamp(1.3, 0, 1)` and `clamp(−0.2, 0, 1)` give?
4. **interpolate.** Check the ranges first; the spec lists what to reject. Then, on paper, for an inputRange of `[0, 4, 6]`: which segment do the inputs −1, 0, 4, 5 and 9 use? Last, for each option: does it act on the input, on `t`, or on the output?
5. **interpolateColors.** What's the same about interpolating a color and interpolating a number, and what are the two differences? Is there anything you've already written that you can lean on?

Run the tests after each function. A failing test tells you exactly what it expected.

Once it works, the test pictures move: two blocks that show "extend" against "clamp", a dot that visits four corners, and a color ramp through three stops.

> **Study buddy:** "Give me an inputRange with uneven keyframes and five inputs, some before and after the ends. Ask me which segment each one uses and what t is. No code." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2004%20%28Interpolate%29%3A%20lerp%2C%20clamp%2C%20ranges%2C%20extrapolation.%20Here%27s%20what%20I%20want%20help%20with%3A%20Give%20me%20an%20inputRange%20with%20uneven%20keyframes%20and%20five%20inputs%2C%20some%20before%20and%20after%20the%20ends.%20Ask%20me%20which%20segment%20each%20one%20uses%20and%20what%20t%20is.%20No%20code.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2004%20%28Interpolate%29%3A%20lerp%2C%20clamp%2C%20ranges%2C%20extrapolation.%20Here%27s%20what%20I%20want%20help%20with%3A%20Give%20me%20an%20inputRange%20with%20uneven%20keyframes%20and%20five%20inputs%2C%20some%20before%20and%20after%20the%20ends.%20Ask%20me%20which%20segment%20each%20one%20uses%20and%20what%20t%20is.%20No%20code.)

## Predict, then run

Guess first, then run. In a terminal, `node tools/try.js 04` lists the blocks.

```js predict
// Predict 1: a fade-in from frame 0 to 30, with only its right end clamped.
// What opacity does it give at frame −10, before the fade starts?
const myGuess = null; // TODO: your guess, to 2 decimals
MS.reveal("opacity at frame −10", myGuess, Math.round(MS.interpolate(-10, [0, 30], [0, 1], { extrapolateRight: "clamp" }) * 100) / 100);
```

```js predict
// Predict 2: what color is halfway between pure red and pure green?
const myGuess = null; // TODO: your guess, as [r, g, b, a]
MS.reveal("halfway from red to green", myGuess, MS.interpolateColors(0.5, [0, 1], [[255, 0, 0], [0, 255, 0]]));
```

```js predict
// Predict 3: a move from 0 to 100 over frames 0–20, eased with t => t * t.
// At which whole frame does it first reach halfway (50)?
const myGuess = null; // TODO: your guess, a frame number
let n = 0;
while (MS.interpolate(n, [0, 20], [0, 100], { easing: t => t * t }) < 50) n++;
MS.reveal("first frame at or past 50", myGuess, n);
```

<details><summary>Answers</summary>

1. −0.33. Only the right end was clamped, so the left end still extends, backwards along the fade's line to an opacity below zero. This happens for real: KineticIntro shows each word from two frames *before* its animation starts, and those frames sit before the first keyframe. A browser treats a negative opacity as 0, so you'd never notice here, but a position or a scale has no such safety net. Clamp both ends.
2. `[128, 128, 0, 255]`: a dim olive, not the bright yellow you might expect. Each channel is only halfway up, and sRGB numbers aren't proportional to light: a channel at 128 gives off only about a fifth of the light of 255 (see the [sRGB transfer function](https://en.wikipedia.org/wiki/SRGB#Transfer_function_%28%22gamma%22%29)). Halfway in numbers is much darker than halfway in light. That's why CSS lets you choose where colors get mixed: [`color-mix(in oklab, red, lime)`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) blends in a space built to match how bright colors look.
3. 15. With `t × t`, the value reaches halfway when `t × t` = 0.5, so `t` ≈ 0.71: frame 14.1 of 20. Frame 15 is the first whole frame past it. An eased move can spend most of its time on the first half of the distance; layer 05 makes curves that ease in, out, or both.

</details>

## Break it

Once your tests pass: make each TODO change, run the experiment before and after, explain the difference, then undo it.

### 1. Only ever use the first segment

```js experiment
// Break it 1: what is finding the segment for?
// TODO(break-it), in src/04-interpolate.js → interpolate:
//   always use the first two keyframes, whatever the input. Change nothing else.
const keys = [0, 15, 30, 45, 60];
for (const n of [0, 10, 20, 35, 50]) {
  const x = MS.interpolate(n, keys, [10, 54, 54, 10, 10]), y = MS.interpolate(n, keys, [10, 10, 30, 30, 10]);
  console.log("frame " + n + " → (" + Math.round(x) + ", " + Math.round(y) + ")");
}
// TODO: the dot should visit four corners of a 64 × 40 frame. After the change, where does it go, and why?
```

### 2. Ease the output instead of t

```js experiment
// Break it 2: why does easing work on t?
// TODO(break-it), in src/04-interpolate.js → interpolate:
//   apply easing to the final output value instead of to t.
const easeIn = t => t * t;
for (const n of [0, 5, 10]) console.log("frame " + n + " → " + MS.interpolate(n, [0, 10], [100, 200], { easing: easeIn }));
// TODO: before the change the value goes 100, 125, 200. What does it do after, and why?
```

An easing function expects a progress between 0 and 1. Handed a value like 150, it has nothing sensible to say.

### 3. Let any inputRange through

```js experiment
// Break it 3: why must the inputs be strictly increasing?
// TODO(break-it), in src/04-interpolate.js → interpolate:
//   delete the check that the inputs are strictly increasing.
const keys = [0, 20, 10, 30];   // 10 comes after 20
for (const n of [5, 15, 25]) {
  try { console.log(n + " → " + MS.interpolate(n, keys, [0, 100, 200, 300])); }
  catch (e) { console.log(n + " → " + e.message); }
}
// TODO: 15 lies inside all three segments. Which one did your code use?
//   Is either answer right?
```

## Checkpoint

When all 14 tests pass, the checkpoint unlocks (layer 00 explains how it works). The picture is a long-exposure photo of a light moved by your `interpolate`. Its traps: keyframes that aren't evenly spaced, a light switched on before its first keyframe, another left on past both ends of a long chain of keyframes, easing that restarts every segment, and a fade in alpha. The three questions are below.

```js checkpoint
// Checkpoint 04 · Interpolate. Replace each null with your answer.
MS.answers("04", {
  // 1. KineticIntro's light sweep is
  //      interpolate(frame, [140, 172], [-20, 130], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  //    Where is the sweep at frame 164?
  q1: null,
  // 2. A title slides in with interpolate(frame, [0, 20], [-160, 0]) and no options.
  //    Where is it at frame 26?
  q2: null,
  // 3. A background fades through three colors:
  //      interpolateColors(frame, [0, 60, 90], [MS.hex("#1A2740"), MS.hex("#5B8CFF"), MS.hex("#FFFFFF")])
  //    What is its red channel at frame 70?
  q3: null,
});
```

## In the real world

- Remotion's [`interpolate()`](https://www.remotion.dev/docs/interpolate) is this function at heart: same arguments, same "extend" default, the same "clamp" and "identity", plus a fourth extrapolation, "wrap". Newer versions add more on top: a different easing for each segment, `posterize` to update only every few frames, and outputs that aren't plain numbers, like CSS transform strings.
- CSS animations are keyframes on a 0–100% input range. An [`@keyframes`](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes) rule lists values at percentages, the browser interpolates every frame between them, and [`animation-timing-function`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timing-function) eases each pair of keyframes separately, the way your easing restarts every segment.
- GPUs have lerp built in: GLSL's [`mix()`](https://registry.khronos.org/OpenGL-Refpages/gl4/html/mix.xhtml) is lerp, and [`smoothstep()`](https://registry.khronos.org/OpenGL-Refpages/gl4/html/smoothstep.xhtml) is a clamped `inverseLerp` with easing built in.

## Going further (optional)

- **Read the original.** Remotion's [`interpolate.ts`](https://github.com/remotion-dev/remotion/blob/main/packages/core/src/interpolate.ts). The file has grown to handle strings and more, but look for `findRange` and `interpolateFunction`: a few dozen lines between them that do what yours does. Does its `findRange` pick the same segment as yours when an input lands exactly on a keyframe? Does it matter?
- Add Remotion's fourth mode, "wrap": past the end, start the range over, like layer 03's looping player.
- Mix light instead of numbers: convert each channel to linear light with the sRGB transfer function, interpolate, convert back, and compare your red-to-green midpoint with `interpolateColors`.
