# Layer 08 · Scenes

_A scene is a stack of pictures, each with its own clock._

**You'll write:** `drawTextCanvas`, `textSprite`, `sequence`, `series`, `camera`, `renderLayers` in `src/08-scenes.js`
**Check it:** `node tests/run.js 08`, or open `tests.html`
**Builds on:** layers 00–07

KineticIntro is four scenes on one timeline: three words, then the logo. Each word is real text in Inter, the heaviest weight, turned into a picture and then moved, scaled, blurred and faded on its own schedule. This layer builds the parts for that: text from the browser's real fonts, clocks that start and stop, a camera, and a stack of layers with effects.

## Under the hood

### Real text is a picture the browser draws for you

Layer 02's bitmap font had one size and no curves. Real fonts are outlines, and the browser's text engine turns an outline into pixels, with smooth edges, at any size. You ask for it through a canvas: set [`ctx.font`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font), then call [`fillText`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText). The font is a string in the same order as CSS's [`font` shorthand](https://www.w3.org/TR/css-fonts-4/#font-prop): weight, then size, then family, like `"900 150px Inter"`.

Two things fail silently. A font string the canvas can't parse is simply ignored, as [the HTML standard](https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-font) requires, so `"150px 900 Inter"` leaves you drawing in whatever font was there before, often `10px sans-serif`. And fonts load in the background: until Inter has arrived, the canvas quietly draws with a fallback font. The course pages ask the browser to load Inter when they open, and draw their pictures again once it's in.

To make a picture that fits the text, you measure first. [`measureText`](https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics) returns the text's advance width and the font's own ascent and descent:

```text
   ┌─────────────────────────────┐  ┐
   │                             │  │
   │   D E S I G N .             │  │ fontBoundingBoxAscent
   ├─────────────────────────────┤  ┘ ◄── the baseline: letters sit on it
   │                             │  ┐ fontBoundingBoxDescent (room for g, p, y)
   └─────────────────────────────┘  ┘
   ◄────────── width ───────────►
```

`measureText` also reports `actualBoundingBoxAscent` and `actualBoundingBoxDescent`: the ink of this particular word. "ace" has less ink above its baseline than "Hid", so boxes cut to the ink would put their baselines at different heights. The font's ascent and descent are the same for every word in that font and size, so "DESIGN." and "ANIMATE." get boxes of the same height with their baselines at the same place, and they line up. The pixels come back from [`getImageData`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData) as straight (not premultiplied) RGBA bytes, row by row: exactly the layout your frames have used since layer 00.

> **Study buddy:** "Ask me questions until I can explain what a font's ascent, descent and baseline are, and why sprites for two different words should use the font's ascent rather than each word's own ink. No code." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2008%20%28Scenes%29%3A%20real%20fonts%2C%20sequences%2C%20a%20camera%2C%20layers%20and%20masks.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20questions%20until%20I%20can%20explain%20what%20a%20font%27s%20ascent%2C%20descent%20and%20baseline%20are%2C%20and%20why%20sprites%20for%20two%20different%20words%20should%20use%20the%20font%27s%20ascent%20rather%20than%20each%20word%27s%20own%20ink.%20No%20code.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2008%20%28Scenes%29%3A%20real%20fonts%2C%20sequences%2C%20a%20camera%2C%20layers%20and%20masks.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20questions%20until%20I%20can%20explain%20what%20a%20font%27s%20ascent%2C%20descent%20and%20baseline%20are%2C%20and%20why%20sprites%20for%20two%20different%20words%20should%20use%20the%20font%27s%20ascent%20rather%20than%20each%20word%27s%20own%20ink.%20No%20code.)

### Every layer has its own clock

A scene doesn't care what time the video says it is. It cares how long it has been running. Remotion's [`<Sequence>`](https://www.remotion.dev/docs/sequence) gives each part of a video its own frame counter: inside `<Sequence from={30} durationInFrames={20}>`, video frame 30 is frame 0, and outside frames 30–49 the sequence isn't drawn at all.

```text
  video frame:   0 ··· 29  30  31  ···  49  50 ···
  sequence:      (not on)   0   1  ···  19  (not on)
```

[`<Series>`](https://www.remotion.dev/docs/series) works out the `from`s for you by putting sequences back to back. An **offset** moves a sequence earlier (negative) or later (positive), and since each sequence starts where the one before it ends, everything after it moves too.

### A camera is the world moving the other way

Pan a camera to the right and everything on screen slides left. Turn it clockwise and the world turns counterclockwise. A camera is the opposite of an object: an object's matrix moves it into the world, and a camera's matrix moves the world into the camera's view. Whatever the camera does, the world does the reverse, and the point it looks at has to end up in the middle of the screen. Every layer's own matrix gets multiplied by the camera's, so one camera move moves the whole scene.

### Layers, masks, and the order of effects

A scene is drawn like a painting: background first, each layer on top of the ones before. That's the [painter's algorithm](https://en.wikipedia.org/wiki/Painter%27s_algorithm). Each layer is a sprite plus instructions: where it goes, how see-through it is, how blurred, and which part of the screen it may touch.

```text
  sprite ──► blur ──► matrix ──► opacity ──► clip ──► onto the frame
          (in the sprite's       (fade)     (only inside
           own pixels)                        a rectangle)
```

Order matters, and CSS has an answer. The [Filter Effects spec](https://www.w3.org/TR/filter-effects-1/#FilterProperty) applies an element's filters "in the element's local coordinate system", before its transform moves it to the screen. So a word with `filter: blur(10px)` and `transform: scale(2)` gets a blur twice as wide. Blurring the sprite first, then transforming it, gives the same result.

A **clip** is the simplest mask: a rectangle the layer can't paint outside. CSS's `overflow: hidden` is one, and KineticIntro uses it to make each word rise out of an invisible slot.

## Your turn

Work through `src/08-scenes.js` top to bottom. Each function's comment is its spec. Some questions to guide you, in order:

1. **drawTextCanvas.** In what order do weight, size and family go? How do you turn an alpha of 0–255 into the 0–1 that `rgba()` wants?
2. **textSprite.** Which font must be set before you call `measureText`? Where's the baseline in the sprite, if there's `pad` empty pixels above the font's ascent? When `MS.createCanvas` gives you `null`, which layer 02 function tells you the width?
3. **sequence.** For a sequence from frame 30 lasting 20 frames, what's its last frame? Is frame 50 inside?
4. **series.** Where does the second sequence start? If the second one has an offset, where does the third start?
5. **camera.** Where should the point the camera looks at end up? If the camera turns clockwise, which way should the world turn? You have `translate`, `scale`, `rotate` and `multiply` from layer 07: in which order does a world point need them?
6. **renderLayers.** When should the blur happen, before or after the matrix? How can you stop a layer from painting outside its clip, using only what you already have?

Run the tests after each function. A failing test tells you exactly what it expected.

Once it works, the test pictures show text sprites with their boxes and baselines (real fonts in a browser, your bitmap font elsewhere), one sprite drawn as three layers (faded, blurred before it's scaled up, and seen through a window), and three words playing in a series over stars filmed by a drifting camera.

> **Study buddy:** "Give me a timeline with three sequences and some offsets, and ask me which sequences are on at a few frames, and what each one's own frame number is. No code." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2008%20%28Scenes%29%3A%20real%20fonts%2C%20sequences%2C%20a%20camera%2C%20layers%20and%20masks.%20Here%27s%20what%20I%20want%20help%20with%3A%20Give%20me%20a%20timeline%20with%20three%20sequences%20and%20some%20offsets%2C%20and%20ask%20me%20which%20sequences%20are%20on%20at%20a%20few%20frames%2C%20and%20what%20each%20one%27s%20own%20frame%20number%20is.%20No%20code.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2008%20%28Scenes%29%3A%20real%20fonts%2C%20sequences%2C%20a%20camera%2C%20layers%20and%20masks.%20Here%27s%20what%20I%20want%20help%20with%3A%20Give%20me%20a%20timeline%20with%20three%20sequences%20and%20some%20offsets%2C%20and%20ask%20me%20which%20sequences%20are%20on%20at%20a%20few%20frames%2C%20and%20what%20each%20one%27s%20own%20frame%20number%20is.%20No%20code.)

## Predict, then run

Guess first, then run. In a terminal, `node tools/try.js 08` lists the blocks.

```js predict
// Predict 1: a sequence starts at frame 60 and lasts 30 frames.
// Is it still on at video frame 90?
const myGuess = null; // TODO: true or false
MS.reveal("on at frame 90", myGuess, MS.sequence(90, 60, 30) !== null);
```

```js predict
// Predict 2: three 30-frame sequences in a series. The second and third each start
// 6 frames before the previous one ends. At which frame is the last one over?
const myGuess = null; // TODO: your guess, the first frame it's no longer on
const parts = MS.series([{ durationInFrames: 30 }, { durationInFrames: 30, offset: -6 }, { durationInFrames: 30, offset: -6 }]);
const last = parts[parts.length - 1];
MS.reveal("the series is over at frame", myGuess, last.from + last.durationInFrames);
```

```js predict
// Predict 3: a 400 × 300 screen. The camera looks at (0, 0) and is turned half a turn.
// Where on the screen does the world point (30, 10) appear?
const myGuess = null; // TODO: your guess, as [x, y]
const p = MS.transformPoint(MS.camera({ rotation: Math.PI }, 400, 300), 30, 10);
MS.reveal("(30, 10) appears at", myGuess, p.map(v => Math.round(v * 1e6) / 1e6));
```

<details><summary>Answers</summary>

1. false. The sequence covers frames 60 to 89: 30 frames. Frame 90 is the first frame after it, the same way an array of length 30 has no index 30, so `sequence(90, 60, 30)` is null.
2. 78. Each overlap pulls its sequence, and everything after it, 6 frames earlier: 3 × 30 − 2 × 6. Offsets add up along a series, which is why one offset can move a whole chain of scenes.
3. [170, 140]. Half a turn sends (30, 10) to (−30, −10), so the point appears 30 to the left of and 10 above the middle (200, 150). A half turn looks the same whichever way the camera turns; try a quarter turn to tell the two apart.

</details>

## Break it

Once your tests pass: make each TODO change, run the experiment before and after, explain the difference, then undo it.

### 1. Include the last frame

```js experiment
// Break it 1: why is the end of a sequence not included?
// TODO(break-it), in src/08-scenes.js → sequence:
//   count frame from + durationInFrames as inside, too.
const parts = MS.series([{ durationInFrames: 30 }, { durationInFrames: 30 }, { durationInFrames: 30 }]);
for (const n of [29, 30, 31, 59, 60]) {
  const on = parts.map((p, i) => MS.sequence(n, p.from, p.durationInFrames) === null ? null : "word " + (i + 1)).filter(Boolean);
  console.log("frame " + n + ": " + on.join(" and "));
}
// TODO: before the change, exactly one word is on at every frame. After it, what happens at frames 30 and 60?
```

### 2. Turn the world the same way

```js experiment
// Break it 2: which way should the world turn?
// TODO(break-it), in src/08-scenes.js → camera:
//   turn the world the same way as the camera, not the opposite way.
const cam = MS.camera({ rotation: Math.PI / 2 }, 200, 100);
const where = (x, y) => MS.transformPoint(cam, x, y).map(v => Math.round(v)).join(", ");
console.log("(30, 0), right of what the camera looks at, appears at " + where(30, 0));
console.log("(0, 30), below what it looks at, appears at " + where(0, 30));
// TODO: before the change, turning the camera clockwise swings what was on its right up above the middle.
// Where does it go after? Look at something a little right of center, then tilt your head clockwise
// (right ear toward your right shoulder): where does it move in your view, and which one matches?
```

### 3. Blur after moving

```js experiment
// Break it 3: why blur before the matrix?
// TODO(break-it), in src/08-scenes.js → renderLayers:
//   move the sprite first (into a frame the size of the output), then blur that.
const word = MS.textSprite("HI", { size: 20, pad: 6 });
const layer = { sprite: word, matrix: MS.multiply(MS.translate(10, 4), MS.scale(2)), blur: 2 };
const t0 = Date.now();
for (let i = 0; i < 200; i++) MS.renderLayers(MS.createFrame(70, 40), [layer]);
console.log("200 renders took " + (Date.now() - t0) + " ms");
console.log(MS.asciiFrame(MS.renderLayers(MS.createFrame(70, 40), [layer])));
// TODO: is the blur as soft as before? How did the time change, and why (think of how many pixels get blurred)?
```

## Checkpoint

When all 19 tests pass, the checkpoint unlocks (layer 00 explains how it works). The picture is a word made of dots, filmed through your own camera. Every dot asks one small question about a rule, and a dot that gets a wrong answer flies off its letter. Text is checked on a pretend canvas, so the picture is the same on every computer. Its traps: sequences that start before frame 0, last one frame, or never end; offsets on the first sequence of a series; cameras turned both ways and zoomed out; layers that are faded, invisible or blurred, and windows that hang off the frame or the sprite; and text that's sized, spaced and measured exactly. The three questions are below.

```js checkpoint
// Checkpoint 08 · Scenes. Replace each null with your answer.
MS.answers("08", {
  // 1. KineticIntro's three words each last 48 frames, and each starts 40 frames after
  //    the one before. As a series, what offset do the second and third words need?
  q1: null,
  // 2. A layer has blur 14, and its matrix scales it up by 1.5. On the screen, its
  //    blur looks like a blur of which σ?
  q2: null,
  // 3. A 1080 × 1920 screen. The camera looks at (100, 0) and is turned a quarter turn
  //    clockwise (rotation Math.PI / 2), zoom 1. Where does the world point (0, 0)
  //    appear? Answer as [x, y].
  q3: null,
});
```

## In the real world

- Remotion loads web fonts with `loadFont()` from [`@remotion/google-fonts`](https://www.remotion.dev/docs/google-fonts/load-font), which holds the render until the font is ready. Under the hood that's [`delayRender()`](https://www.remotion.dev/docs/delay-render), the general way to make a render wait for anything asynchronous.
- [`useCurrentFrame()`](https://www.remotion.dev/docs/use-current-frame) inside a `<Sequence>` returns the sequence's own frame, exactly like `sequence()`. Remotion also has [`<Freeze>`](https://www.remotion.dev/docs/freeze) and [`<Loop>`](https://www.remotion.dev/docs/loop), which change the frame number in other ways.
- 2D engines like [PixiJS](https://pixijs.com/) and game engines keep a scene graph: every object has a matrix relative to its parent, and the camera is one more matrix at the top.
- CSS has many masks: `overflow: hidden` and [`clip-path`](https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path) cut shapes, and [`mask-image`](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image) uses a picture's alpha.

## Going further (optional)

- **Read the original.** The HTML standard's [text preparation algorithm](https://html.spec.whatwg.org/multipage/canvas.html#text-preparation-algorithm) is what `fillText` and `measureText` run. Look for where `letterSpacing` and `textBaseline` come in.
- Add `rotate` and a center point to `camera`'s options, and make a camera that orbits a word.
- **Randomness you can replay.** `Math.random()` breaks frame = f(n): Remotion renders frames in parallel on several copies of the page, and [its docs warn](https://www.remotion.dev/docs/using-randomness) that each copy gets different numbers. Its [`random(seed)`](https://www.remotion.dev/docs/random) is a function instead: a string hash, then one step of [mulberry32](https://gist.github.com/tommyettinger/46a874533244883189143505d203312c). Write your own from [its source](https://github.com/remotion-dev/remotion/blob/main/packages/core/src/random.ts) until `random("hello")` gives 0.41293257870711386, and work out why it multiplies with [`Math.imul`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul) instead of `*`. Then scatter the test animation's stars with it.
- Blend `random()` values at whole numbers with your easing from layer 05 into a smooth `noise(x)`, and make the stars twinkle.
