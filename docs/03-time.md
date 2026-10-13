# Layer 03 · Time

_A video is a function from frame numbers to pictures._

**You'll write:** `secondsToFrames`, `framesToSeconds`, `timecode`, `createComposition`, `renderFrame`, `frameAt` in `src/03-time.js`
**Check it:** `node tests/run.js 03`, or open `tests.html`
**Builds on:** layers 00–02

Everything so far draws one picture. KineticIntro is 180 of them, shown 30 a second for six seconds. This layer adds time, though not the way you might expect: instead of nudging things a little on every tick, you'll describe each frame as a function of its number, `n`. That one decision, which [Remotion](https://www.remotion.dev/docs/the-fundamentals) is built on, is what lets a video jump to any frame, render in any order, and come out the same every time.

## Under the hood

### Motion is still pictures, fast

Show still pictures quickly enough and your eye reads them as movement. Film shows 24 a second, most web video 30 or 60. That rate is the **frame rate**, in frames per second (fps). Frame `n` is on screen from `n / fps` seconds until the next frame starts:

```text
  time (ms)   0          33.3        66.7        100
              │ frame 0   │ frame 1   │ frame 2   │ frame 3 …     at 30 fps
              └─ 1000 ÷ 30 = 33.3 ms ─┘
```

So converting is multiplying or dividing by fps: 1.5 seconds at 30 fps is 45 frames, and 45 frames is 1.5 seconds. Only one direction needs rounding, because a clip can't last half a frame.

### frame = f(n)

There are two ways to make a ball move. One keeps state and changes it on every tick: `x = x + 2`. The other computes the picture straight from the frame number: `x = 2 × n`.

```text
  by mutation:   tick → x += 2 → draw      frame 40 depends on frames 0–39 having run, in order
  by f(n):       n    → x = 2n → draw      frame 40 depends only on 40
```

The second way wins everywhere that matters. A timeline can jump to frame 140 without playing 0–139. Frames can render out of order, or in parallel: Remotion splits a long video across many CPU cores or cloud machines. And the same `n` always gives the same picture, so a frame can be tested like any other function.

A **composition** packages that function with what a player needs to know: `width`, `height`, `fps`, `durationInFrames`, and `render(frame, n)`. Those are the same props as Remotion's [`<Composition>`](https://www.remotion.dev/docs/composition). KineticIntro's are 1080 × 1920, 30 fps, 180 frames. `renderFrame` gives `render` a brand-new, empty frame every time, so a frame can't depend on what was drawn before it.

> **Study buddy:** "Ask me questions until I can explain why describing frame n as a function of n beats moving things a little on every tick. No code." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2003%20%28Time%29%3A%20frame%20%3D%20f%28n%29%20and%20a%20player%20that%20keeps%20time.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20questions%20until%20I%20can%20explain%20why%20describing%20frame%20n%20as%20a%20function%20of%20n%20beats%20moving%20things%20a%20little%20on%20every%20tick.%20No%20code.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2003%20%28Time%29%3A%20frame%20%3D%20f%28n%29%20and%20a%20player%20that%20keeps%20time.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20questions%20until%20I%20can%20explain%20why%20describing%20frame%20n%20as%20a%20function%20of%20n%20beats%20moving%20things%20a%20little%20on%20every%20tick.%20No%20code.)

### Timecode

Video editors label frames with [SMPTE timecode](https://en.wikipedia.org/wiki/SMPTE_timecode): `HH:MM:SS:FF`, hours, minutes, seconds, then the frame within the current second. The last field counts up to `fps − 1`, not 99. At 24 fps, frame 100 is 4 seconds and 4 frames: `00:00:04:04`.

### A player keeps time

To play a composition, a browser page asks for [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) callbacks. The browser calls back before each screen refresh, 60 or 120 times a second depending on the screen, with a timestamp. The player turns the time that has passed into a frame number:

```text
  screen refreshes (60 Hz):   │  │  │  │  │  │  │  │  │      every 16.7 ms
  video frames (30 fps):      │  0  │  1  │  2  │  3  │      every 33.3 ms
                                → each frame is shown on two refreshes
```

A frame stays on screen until the next one has *started*, so the player counts whole frames and never rounds up. If drawing a frame takes too long, the player doesn't fall behind: on the next refresh it shows whatever frame the clock says, skipping the ones in between. That's a **dropped frame**. An animation built on `x += 2` would slow down instead. Past the end, a looping player starts again from 0; the [remainder operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder) `%` does exactly that wrap-around.

From this layer on, the test pictures move. The page plays them with `lib/present.js`, which uses *your* `frameAt` and `renderFrame` to decide what to show.

## Your turn

Work through `src/03-time.js` top to bottom. Each function's comment is its spec. Some questions to guide you, in order:

1. **secondsToFrames, framesToSeconds.** Only one of them rounds. Which, and why?
2. **timecode.** How many frames are in one minute at a given fps? Which operator gives you what's left over after taking out whole seconds?
3. **createComposition.** What counts as a positive whole number? Layer 00's `createFrame` asked the same question.
4. **renderFrame.** Why make a new frame on every call instead of keeping one? What would frame 3 contain if you didn't?
5. **frameAt.** Frame `k` starts at `k × 1000 / fps` ms. At 40 ms into a 30 fps clip, which frames have started? What should a 90-frame loop show at exactly 3000 ms?

Run the tests after each function. A failing test tells you exactly what it expected.

Once it works, the test pictures play: a ball that crosses the frame in exactly one second, and a clock showing every frame's timecode.

> **Study buddy:** "I'll paste my frameAt. Don't fix it. Give me an elapsed time where it would show the wrong frame, and let me work out why." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2003%20%28Time%29%3A%20frame%20%3D%20f%28n%29%20and%20a%20player%20that%20keeps%20time.%20Here%27s%20what%20I%20want%20help%20with%3A%20I%27ll%20paste%20my%20frameAt.%20Don%27t%20fix%20it.%20Give%20me%20an%20elapsed%20time%20where%20it%20would%20show%20the%20wrong%20frame%2C%20and%20let%20me%20work%20out%20why.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2003%20%28Time%29%3A%20frame%20%3D%20f%28n%29%20and%20a%20player%20that%20keeps%20time.%20Here%27s%20what%20I%20want%20help%20with%3A%20I%27ll%20paste%20my%20frameAt.%20Don%27t%20fix%20it.%20Give%20me%20an%20elapsed%20time%20where%20it%20would%20show%20the%20wrong%20frame%2C%20and%20let%20me%20work%20out%20why.)

## Predict, then run

Guess first, then run. In a terminal, `node tools/try.js 03` lists the blocks.

```js predict
// Predict 1: how long is one frame on screen at 30 fps, in milliseconds?
const myGuess = null; // TODO: your guess, rounded to 2 decimals
MS.reveal("one frame at 30 fps, in ms", myGuess, Math.round(MS.framesToSeconds(1, 30) * 100000) / 100);
```

```js predict
// Predict 2: after exactly one second, which frame does a 30 fps player show?
const myGuess = null; // TODO: your guess, a frame number
MS.reveal("frame on screen at 1000 ms", myGuess, MS.frameAt(1000, 30, 90));
```

```js predict
// Predict 3: a 120 Hz screen refreshes every 8.33 ms. During one second of
// a 30 fps video, on how many of those 120 refreshes does the picture change?
const myGuess = null; // TODO: your guess, a whole number
let changes = 0, last = -1;
for (let k = 0; k < 120; k++) {
  const n = MS.frameAt((k * 1000) / 120, 30, 300);
  if (n !== last) { changes++; last = n; }
}
MS.reveal("refreshes that show a new frame", myGuess, changes);
```

<details><summary>Answers</summary>

1. 33.33 ms (1000 ÷ 30). That's the whole time budget for drawing a frame if you want to play in real time.
2. 30, not 29 or 31. Frames are numbered from 0, so after one second frames 0–29 have finished and frame 30 has just started, the same way pixel coordinates start at 0.
3. 30. The screen refreshes 120 times, but the video only has 30 new pictures each second, so each one stays up for 4 refreshes in a row. The video looks the same on a 60 Hz screen; each frame just gets 2 refreshes.

</details>

## Break it

Once your tests pass: make each TODO change, run the experiment before and after, explain the difference, then undo it.

### 1. Reuse the frame

```js experiment
// Break it 1: does each frame start clean?
// TODO(break-it), in src/03-time.js → renderFrame:
//   make the frame once, keep it in a variable outside the function,
//   and reuse it on every call. Change nothing else.
const comp = MS.createComposition({
  width: 12, height: 3, fps: 30, durationInFrames: 12,
  render(frame, n) { MS.setPixel(frame, n, 1, [255, 255, 255]); },   // one dot per frame
});
console.log(MS.asciiFrame(MS.renderFrame(comp, 3)));
console.log(MS.asciiFrame(MS.renderFrame(comp, 7)));
// TODO: before the change each frame has one dot. After it, what does frame 7 show, and why?
```

Players render frames out of order all the time: scrubbing, seeking, and rendering in parallel. A frame that depends on the one before it breaks all three.

### 2. Round instead of counting

```js experiment
// Break it 2: which frame is on screen at 20 ms?
// TODO(break-it), in src/03-time.js → frameAt:
//   round to the nearest frame (Math.round) instead of counting started frames.
for (const ms of [0, 10, 20, 30, 40, 50]) console.log(ms + " ms → frame " + MS.frameAt(ms, 30, 90));
// TODO: after the change, at which times does the player show a frame that hasn't started yet?
```

### 3. Forget to loop

```js experiment
// Break it 3: what happens at the end of the clip?
// TODO(break-it), in src/03-time.js → frameAt:
//   return the number of started frames without looping or holding.
const comp = MS.createComposition({ width: 4, height: 4, fps: 30, durationInFrames: 90, render() {} });
for (const ms of [2900, 2990, 3000, 3100]) {
  const n = MS.frameAt(ms, 30, comp.durationInFrames);
  try { MS.renderFrame(comp, n); console.log(ms + " ms → frame " + n + ": drawn"); }
  catch (e) { console.log(ms + " ms → frame " + n + ": " + e.message); }
}
// TODO: after the change, what happens at 3 seconds, and which function notices?
```

## Checkpoint

When all 13 tests pass, the checkpoint unlocks (layer 00 explains how it works). Its traps: moments a hair before a frame starts, a clip that loops, a clip that holds its last frame, half a frame to round, and a timecode caption. The three questions are below.

```js checkpoint
// Checkpoint 03 · Time. Replace each null with your answer.
MS.answers("03", {
  // 1. At 24 fps, how many frames long is a 2.5-second clip?
  q1: null,
  // 2. A 30 fps player loops a 60-frame clip. 2,350 ms after it starts,
  //    which frame number is on screen?
  q2: null,
  // 3. What is the timecode of frame 4,000 at 25 fps? Answer as a string.
  q3: null,
});
```

## In the real world

- In Remotion, [`useCurrentFrame()`](https://www.remotion.dev/docs/use-current-frame) hands every component its `n`, and a component is your `render`: a function of the frame number.
- For real video files, a `<video>` element's [`requestVideoFrameCallback`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback) tells you exactly which decoded frame is on screen, the same question `frameAt` answers.
- US broadcast video runs at 29.97 fps, a leftover from adding color to black-and-white TV, so its timecode has to skip some labels to stay in step with the clock: [drop-frame timecode](https://en.wikipedia.org/wiki/SMPTE_timecode#Drop-frame_timecode).

## Going further (optional)

- **Read the original.** The HTML Standard's [animation frames](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames) section: when `requestAnimationFrame` callbacks run, and what the timestamp means.
- Give the player controls: pause, scrub to any frame (easy, because a frame is just `f(n)`), and play at half speed.
- Write `timecodeDropFrame(n)` for 29.97 fps, which skips the labels `:00` and `:01` at the start of every minute except every tenth minute. Check it against an online timecode calculator.
