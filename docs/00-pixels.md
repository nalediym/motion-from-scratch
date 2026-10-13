# Layer 00 · Pixels

_A framebuffer is memory you can see._

**You'll write:** `createFrame`, `pixelIndex`, `setPixel`, `getPixel`, `clearFrame` in `src/00-pixels.js`
**Check it:** `node tests/run.js 00`, or open `tests.html`
**Time:** one or two sittings

Every frame of the KineticIntro you'll build in layer 09 is 1080 × 1920 pixels. Before anything can move, you need somewhere to put those pixels and a way to change them one at a time. That place is called a **framebuffer**, and by the end of this layer you'll have written one.

## Under the hood

### A pixel is three or four numbers

Your screen is a grid of tiny lights. Each one mixes red, green and blue light, and how bright each color glows is a number from 0 (off) to 255 (full). Why 255? Each channel gets one **byte**: 8 bits, which can hold 2⁸ = 256 different values, 0 through 255.

```text
  [255,   0,   0]  red          [  0,   0,   0]  black (all off)
  [255, 255, 255]  white        [ 91, 140, 255]  Motion Studio's blue
```

A fourth number, **alpha**, says how opaque the pixel is: 255 is solid, 0 is invisible. Alpha doesn't matter yet, but layer 01 is all about it. So one pixel is 4 bytes: **R, G, B, A**.

### Memory is one long line

A picture is 2-D, but computer memory is a single long row of bytes. So you have to decide how to lay the grid out in a line. Nearly everything (browsers, image files, GPUs) uses the same answer: **row by row, left to right**, 4 bytes per pixel.

Here's a frame 4 pixels wide and 3 tall, with each cell showing where that pixel starts in the line:

```text
            x = 0   x = 1   x = 2   x = 3
          ┌───────┬───────┬───────┬───────┐
  y = 0   │   0   │   4   │   8   │  12   │
          ├───────┼───────┼───────┼───────┤
  y = 1   │  16   │  20   │  24   │  28   │
          ├───────┼───────┼───────┼───────┤
  y = 2   │  32   │  36   │  40   │  44   │
          └───────┴───────┴───────┴───────┘

  data: [ R G B A  R G B A  R G B A  R G B A | R G B A ... ]
          └ (0,0) ┘└ (1,0) ┘└ (2,0) ┘└ (3,0) ┘ └ (0,1) ...
          index 0   index 4   index 8   index 12  index 16
```

Look at the numbers for a while before writing `pixelIndex`. Going one step right adds the same amount each time. Going one step down adds a different, bigger amount. What is each amount, and why? If you can say that out loud, the formula writes itself.

### Why a Uint8ClampedArray

JavaScript has **typed arrays**: fixed-size blocks of raw numbers, much faster than normal arrays because every slot is the same type. `Uint8ClampedArray` means:

- **Uint8**: each slot is an unsigned 8-bit integer, 0–255. Exactly one channel.
- **Clamped**: if you store something out of range, it's pinned to the nearest edge instead of wrapping around. Store 300 and you get 255; store −5 and you get 0; store 127.6 and it rounds to 128.

The browser uses this exact type for the pixels of a canvas (`ImageData.data`), which is why you're using it. Compare it with its unclamped cousin `Uint8Array`, where 300 wraps around to 44 (300 − 256). For colors, wrapping is a disaster: a pixel that should be "a bit brighter than white" would turn nearly black.

### The edge of the world

What should happen if someone calls `setPixel(frame, 4, 0, ...)` on a frame that's 4 pixels wide? There is no column 4. But the index formula will still happily compute a number, and that number lands somewhere real:

```text
  setPixel(frame, x = 4, y = 0)  on a 4-wide frame

          x = 0   x = 1   x = 2   x = 3   (x = 4?)
  y = 0   ░░░░░░  ░░░░░░  ░░░░░░  ░░░░░░  ← you meant here
  y = 1   ██████  ░░░░░░  ░░░░░░  ░░░░░░
          └─ but the formula points here: (0, 1)
```

This "wrap-around" bug is real and common: shapes that hang off the right edge reappear on the left, one row down. Your `setPixel` must check bounds itself instead of trusting the formula. Later layers will draw things that slide off-screen all the time, so this check is load-bearing.

### Getting it on screen

Your frame is just numbers in memory. To see it, `lib/present.js` (provided) copies them into a `<canvas>`:

```text
  your frame.data ──► new ImageData(data, w, h) ──► ctx.putImageData(...)
        (CPU memory)        (browser wrapper)          │
                                                       ▼
                     display ◄── GPU ◄── compositor ◄── canvas
               (refreshes ~60 times a second)
```

You don't need to write that part. The important idea is that the screen only ever shows what's in memory, and drawing just means changing numbers.

### How big is a frame?

Your final video is 1080 × 1920, 4 bytes per pixel. Work it out before you read on: how many bytes is one frame? How many is 6 seconds at 30 frames per second?

<details><summary>Answer</summary>

One frame is 1080 × 1920 × 4 = 8,294,400 bytes, about 8.3 MB. 180 frames is about 1.5 GB. Yet the MP4 you export in layer 10 will be a few megabytes. Hold on to that gap; it's what video compression is for.

</details>

## Your turn

Work through `src/00-pixels.js` top to bottom. Each function's comment is its spec. Some questions to guide you, in order:

1. **createFrame.** How many bytes does a `width × height` frame need? What does a brand-new typed array contain? What counts as a "positive whole number", and is `2.5` one?
2. **pixelIndex.** Use the grid above. What do you multiply `y` by to skip whole rows? Why the final `× 4`?
3. **setPixel.** What order do you do things in: round, check bounds, compute index, write? What happens if you compute the index before checking bounds? What should alpha be when the color only has three numbers?
4. **getPixel.** Why return a *new* array instead of a piece of `frame.data`? (Hint: what happens if the caller changes it?)
5. **clearFrame.** You could call `setPixel` for every pixel. That works. Is there a way that touches `frame.data` directly with a single loop? Which is faster, and why?

Run `node tests/run.js 00` after each function. A failing test tells you exactly which pixel was wrong.

## Predict, then run

Each block has a line for your guess. **Replace `null` with what you think will happen, then run the block.** It tells you whether you were right; the answers underneath explain why. Guess before you run: the point is to catch the places where your mental model and the machine disagree.

To run a block, press **Run** under it in the guide or run its cell in a notebook. In a terminal, `node tools/try.js 00 p1` runs prediction 1; to fill in your guess there, copy the block into `scratch.js` and run `node tools/try.js --file scratch.js`.

```js predict
// Predict 1: how many bytes does one full-size video frame need?
const myGuess = null; // TODO: your guess, a single number
const frame = MS.createFrame(1080, 1920);
MS.reveal("data.length of a 1080 × 1920 frame", myGuess, frame.data.length);
```

```js predict
// Predict 2: what comes back after writing out-of-range numbers?
const myGuess = null; // TODO: your guess as [r, g, b, a]
const f = MS.createFrame(1, 1);
MS.setPixel(f, 0, 0, [300, -5, 127.6]);
MS.reveal("getPixel after setPixel([300, -5, 127.6])", myGuess, MS.getPixel(f, 0, 0));
```

```js predict
// Predict 3: what happens when you write to slot 1.5? (None of your code is involved.)
const myGuess = null; // TODO: your guess as an array of 4 numbers
const a = new Uint8ClampedArray(4);
a[1.5] = 200;
MS.reveal("the array after a[1.5] = 200", myGuess, a);
```

<details><summary>Answers</summary>

1. 8,294,400 (1080 × 1920 × 4).
2. `[255, 0, 128, 255]`. Clamped, rounded, and alpha filled in.
3. `[0, 0, 0, 0]`. A typed array only has whole-number slots, and a write to a fractional index like `1.5` is silently thrown away: no error, no change. This is why `setPixel` must round coordinates. Forget it, and drawing at x = 2.5 quietly does nothing.

Bonus: try `a[0] = 127.5; a[1] = 128.5`. Both become 128. Clamped arrays round exact halves to the nearest even number ("banker's rounding"), so rounding errors don't all lean the same way.

</details>

## Break it

Once your tests pass, break things on purpose. Each experiment has two parts:

- a **TODO** block saying what to change in your own code (it never shows the solution, only what to alter);
- an **experiment** block to run before and after the change.

Run the experiment, make the change, run it again, and explain the difference. Then undo the change and check your tests pass again. In a terminal: `node tools/try.js 00 b1`.

### 1. Swap x and y

```js
// src/00-pixels.js → pixelIndex
// TODO(break-it): swap x and y in your formula. Change nothing else.
```

```js experiment
// Break it 1: where do two pixels start, before and after the swap?
const f = MS.createFrame(4, 2);   // 4 wide, 2 tall: data has 32 slots, 0 to 31
console.log("pixelIndex(3, 0) =", MS.pixelIndex(f, 3, 0));
console.log("pixelIndex(0, 1) =", MS.pixelIndex(f, 0, 1));
// TODO: note both numbers, make the change, run again.
// Is either new number outside the 32 slots? What would setPixel do with it?
```

Then run `node tests/run.js 00` and look at the XOR pattern in `tests.html`. Which tests catch the swap, and what happened to the picture?

### 2. Delete the bounds check

```js
// src/00-pixels.js → setPixel
// TODO(break-it): comment out your check that (x, y) is inside the frame.
```

```js experiment
// Break it 2: draw one pixel just past the right edge.
const f = MS.createFrame(4, 3);
MS.setPixel(f, 4, 0, [255, 255, 255]);   // x = width: there is no column 4
console.log(MS.asciiFrame(f));
// TODO: before the change you should see only dots (·).
// After it, which pixel lit up, and why that one?
```

### 3. Lose the clamping

```js
// src/00-pixels.js → createFrame
// TODO(break-it): use Uint8Array instead of Uint8ClampedArray.
```

```js experiment
// Break it 3: out-of-range values, with and without clamping.
const f = MS.createFrame(1, 1);
MS.setPixel(f, 0, 0, [300, -5, 127.6]);
console.log(MS.getPixel(f, 0, 0));
// TODO: after the change, explain each of the three numbers.
// Hint: 256 possible values wrap around like a clock face.
```

Which test fails with `Uint8Array`, and why would wrapping be a disaster for colors?

## Checkpoint

- `node tests/run.js 00` shows 11 of 11 passing.
- `tests.html` shows a checkerboard and a blue-and-orange XOR pattern under Layer 00.
- You can explain, without looking, why pixel (3, 2) in a 10-wide frame starts at index 92.

## In the real world

- The browser's own version of your frame is [`ImageData`](https://developer.mozilla.org/en-US/docs/Web/API/ImageData). Same layout, same `Uint8ClampedArray`.
- Video cards keep the image being shown in a region of memory literally called the framebuffer, scanned out to the display many times a second.
- Remotion doesn't touch pixels directly. It draws with the browser, then takes a screenshot of each frame, which is a full framebuffer like yours. You'll see that in layer 10.

## Study buddy prompts

Paste one of these into Claude Code, Codex or ChatGPT. The repo's `CLAUDE.md` and `AGENTS.md` already tell coding agents not to hand you answers.

- "I'm on layer 00 of Motion from Scratch. Don't give me code. Ask me questions until I can explain why the pixel index is (y × width + x) × 4." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20give%20one%20hint%20at%20a%20time%3A%20point%20at%20the%20test%27s%20expected%20vs%20actual%20values%2C%20then%20ask%20a%20concept%20question%2C%20then%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%20using%20different%20numbers%2C%20then%20point%20at%20the%20line%20to%20look%20at.%20Never%20go%20further%20than%20that.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2000%20%28Pixels%29%3A%20a%20framebuffer%3A%20memory%20you%20can%20see.%20Here%27s%20what%20I%20want%20help%20with%3A%20Don%27t%20give%20me%20code.%20Ask%20me%20questions%20until%20I%20can%20explain%20why%20the%20pixel%20index%20is%20%28y%20%C3%97%20width%20%2B%20x%29%20%C3%97%204.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20give%20one%20hint%20at%20a%20time%3A%20point%20at%20the%20test%27s%20expected%20vs%20actual%20values%2C%20then%20ask%20a%20concept%20question%2C%20then%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%20using%20different%20numbers%2C%20then%20point%20at%20the%20line%20to%20look%20at.%20Never%20go%20further%20than%20that.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2000%20%28Pixels%29%3A%20a%20framebuffer%3A%20memory%20you%20can%20see.%20Here%27s%20what%20I%20want%20help%20with%3A%20Don%27t%20give%20me%20code.%20Ask%20me%20questions%20until%20I%20can%20explain%20why%20the%20pixel%20index%20is%20%28y%20%C3%97%20width%20%2B%20x%29%20%C3%97%204.)
- "Here's my setPixel. Don't fix it. Tell me which test case would break it, and let me find the bug." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20give%20one%20hint%20at%20a%20time%3A%20point%20at%20the%20test%27s%20expected%20vs%20actual%20values%2C%20then%20ask%20a%20concept%20question%2C%20then%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%20using%20different%20numbers%2C%20then%20point%20at%20the%20line%20to%20look%20at.%20Never%20go%20further%20than%20that.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2000%20%28Pixels%29%3A%20a%20framebuffer%3A%20memory%20you%20can%20see.%20Here%27s%20what%20I%20want%20help%20with%3A%20Here%27s%20my%20setPixel.%20Don%27t%20fix%20it.%20Tell%20me%20which%20test%20case%20would%20break%20it%2C%20and%20let%20me%20find%20the%20bug.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20give%20one%20hint%20at%20a%20time%3A%20point%20at%20the%20test%27s%20expected%20vs%20actual%20values%2C%20then%20ask%20a%20concept%20question%2C%20then%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%20using%20different%20numbers%2C%20then%20point%20at%20the%20line%20to%20look%20at.%20Never%20go%20further%20than%20that.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2000%20%28Pixels%29%3A%20a%20framebuffer%3A%20memory%20you%20can%20see.%20Here%27s%20what%20I%20want%20help%20with%3A%20Here%27s%20my%20setPixel.%20Don%27t%20fix%20it.%20Tell%20me%20which%20test%20case%20would%20break%20it%2C%20and%20let%20me%20find%20the%20bug.)
- "Quiz me on Uint8ClampedArray versus Uint8Array with three predict-the-output questions." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20give%20one%20hint%20at%20a%20time%3A%20point%20at%20the%20test%27s%20expected%20vs%20actual%20values%2C%20then%20ask%20a%20concept%20question%2C%20then%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%20using%20different%20numbers%2C%20then%20point%20at%20the%20line%20to%20look%20at.%20Never%20go%20further%20than%20that.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2000%20%28Pixels%29%3A%20a%20framebuffer%3A%20memory%20you%20can%20see.%20Here%27s%20what%20I%20want%20help%20with%3A%20Quiz%20me%20on%20Uint8ClampedArray%20versus%20Uint8Array%20with%20three%20predict-the-output%20questions.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20give%20one%20hint%20at%20a%20time%3A%20point%20at%20the%20test%27s%20expected%20vs%20actual%20values%2C%20then%20ask%20a%20concept%20question%2C%20then%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%20using%20different%20numbers%2C%20then%20point%20at%20the%20line%20to%20look%20at.%20Never%20go%20further%20than%20that.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2000%20%28Pixels%29%3A%20a%20framebuffer%3A%20memory%20you%20can%20see.%20Here%27s%20what%20I%20want%20help%20with%3A%20Quiz%20me%20on%20Uint8ClampedArray%20versus%20Uint8Array%20with%20three%20predict-the-output%20questions.)

## Going further (optional)

- Write `fillFrameFast(frame, color)` using `Uint32Array` over the same buffer (`new Uint32Array(frame.data.buffer)`) to set a whole pixel in one write. Time it against `clearFrame` on a 1080 × 1920 frame. Then look up **endianness** to understand why the byte order inside that 32-bit number looks backwards.
