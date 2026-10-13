# Layer 10 · Export

_A video file is a list of boxes, and you know how to write every byte._

**You'll write:** `u16`, `u32`, `box`, `fullBox`, `stts`, `stsz`, `stco`, `stss`, `mp4` in `src/10-export.js`
**Check it:** `node tests/run.js 10`, or open `tests.html`
**Builds on:** layers 00–09

Your KineticIntro plays in a browser tab. To post it, send it or drop it into an editor, it has to become a file: an MP4. Two very different jobs hide in that word. **Encoding** squeezes each frame from megabytes down to kilobytes; that's a field of its own, and the browser's [WebCodecs](https://www.w3.org/TR/webcodecs/) API does it for you, often on the computer's video hardware. **Packaging** puts the squeezed frames in a file that every player understands, with an index saying where each frame is and when it plays. That part is a few hundred bytes of careful bookkeeping, and you'll write all of it. Then you'll press a button and watch your own file play.

## Under the hood

### Codec and container

An MP4 is a **container**: a box of boxes that holds the frames, plus a table of contents. The frames inside are compressed by a **codec**, here H.264, the most widely played video format there is. The two are separate: the same H.264 frames could go in a different container, and an MP4 can hold other codecs.

```text
  your frames ──► encoder (H.264, by WebCodecs) ──► chunks ──► container (MP4, by you) ──► file
  RGBA pixels      compresses each frame              one per     where and when each
  (~330 KB each                                       frame,      chunk is, so a player
   at 216 × 384)                                      a few KB    can find and time it
```

### Boxes all the way down

The format comes from Apple's QuickTime and is standardized as the [ISO base media file format](https://www.iso.org/standard/83102.html) (ISO/IEC 14496-12). It's built from one idea: a **box** (QuickTime calls it an atom) is 4 bytes of size, 4 letters of type, and then its contents, which can be more boxes.

```text
  ┌──────────────┬────────────────┬──────────────────────────────┐
  │ size (u32)   │ type (4 ASCII) │ contents: data, or more boxes│
  │ 00 00 00 18  │ s  t  t  s     │ ...                          │
  └──────────────┴────────────────┴──────────────────────────────┘
     the size counts the whole box, these 8 header bytes included
```

A program that doesn't know a box type can still skip it: read the size, jump ahead. It's one reason the format has lasted since QuickTime's first release in 1991. Many boxes are **full boxes**, whose contents start with a version byte and 3 bytes of flags, so the format can change without breaking old readers.

Every number is **big-endian**: the most significant byte comes first, the way you write digits. 300 as a u32 is `00 00 01 2C`. Your computer's processor is almost certainly little-endian and would store it backwards, which is why `u32` builds the bytes by hand with shifts and masks instead of copying memory. Network protocols use big-endian too; it's often called "network byte order".

```text
  ftyp                      which specs the file follows
  mdat                      the media data: every chunk's bytes, back to back
  moov                      the movie: the table of contents
  └ trak                    one track (we have one: video)
    └ mdia
      └ minf
        └ stbl              the sample table: where and when every frame is
          ├ stsd            how to decode them: "avc1", with the encoder's setup (avcC)
          ├ stts            how long each one lasts
          ├ stsc            which chunk each sample is in
          ├ stsz            how many bytes each one is
          ├ stco            where each chunk starts in the file
          └ stss            which ones are key frames
```

`lib/mp4.js` builds the boilerplate boxes (headers full of zeros and fixed numbers) using your `box`, `fullBox`, `u16` and `u32`. Read it: every field is named. The sample table is yours.

> **Study buddy:** "Ask me questions until I can explain what a box's size counts, why the numbers are big-endian, and how a program can skip a box it doesn't understand. No code." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2010%20%28Export%29%3A%20frames%20to%20MP4%2C%20then%20map%20it%20to%20Remotion.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20questions%20until%20I%20can%20explain%20what%20a%20box%27s%20size%20counts%2C%20why%20the%20numbers%20are%20big-endian%2C%20and%20how%20a%20program%20can%20skip%20a%20box%20it%20doesn%27t%20understand.%20No%20code.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2010%20%28Export%29%3A%20frames%20to%20MP4%2C%20then%20map%20it%20to%20Remotion.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20questions%20until%20I%20can%20explain%20what%20a%20box%27s%20size%20counts%2C%20why%20the%20numbers%20are%20big-endian%2C%20and%20how%20a%20program%20can%20skip%20a%20box%20it%20doesn%27t%20understand.%20No%20code.)

### Where: sizes and offsets

To show frame 90, a player needs its bytes. `stsz` gives every frame's size and `stco` gives where each **chunk** starts in the file (a chunk is a run of samples stored together; here every frame is its own chunk, which keeps `stsc` a one-liner). The offsets count from the very first byte of the file, so they have to skip the `ftyp`, then the `mdat`'s own 8-byte header, then every chunk before it.

```text
  byte 0                 ftyp.length   + 8
  ┌──────────┬───────────┬─────────────┬────────┬────────┬─ ─ ─┬──────────┐
  │ ftyp     │ mdat hdr  │ chunk 1     │ chunk 2│ chunk 3│     │ moov     │
  └──────────┴───────────┴─────────────┴────────┴────────┴─ ─ ─┴──────────┘
                         ▲ offset 1    ▲ offset 2 = offset 1 + size 1
```

### When: timescales and runs

MP4 counts time in whole ticks of a **timescale**: ticks per second. This file's media uses 90000, a habit from MPEG broadcasting, because it divides evenly by 24, 25, 30, 50 and 60, so common frame rates get whole-number frame durations. At 30 fps, every frame lasts 3000 ticks. `stts` stores durations as runs, "180 samples of 3000", so a constant frame rate costs 8 bytes no matter how long the video is. That's [run-length encoding](https://en.wikipedia.org/wiki/Run-length_encoding), the same trick as "A × 3" instead of "AAA".

The movie header (`mvhd`) and track header (`tkhd`) keep their own, coarser clock in milliseconds, for showing the length to people.

### Which: key frames

H.264 saves most of its space by storing most frames as differences from earlier ones. A **key frame** stands alone; the frames after it are built from it. A player can only start decoding at a key frame, so jumping to 0:04 means finding the key frame at or before it. `stss` lists them, by sample number, counting from 1. The provided encoder makes one every two seconds: fewer key frames make a smaller file, and more make seeking quicker.

### The order of the boxes

Your file puts `mdat` before `moov`. That's the easy order: when you write the offsets you already know exactly where everything is. It's also how a camera records: it can't write the table of contents until it stops filming. Its one downside is that a player streaming the file over a network has to fetch the end before it can start. Moving `moov` to the front ("fast start") fixes that, but then the offsets have to skip the `moov` too.

## Your turn

Work through `src/10-export.js` top to bottom. Each function's comment is its spec. Some questions to guide you, in order:

1. **u16 and u32.** How do you get the top byte of a 32-bit number? Which operator moves bits right without bringing the sign along?
2. **box.** What's the size of a box with no contents? How do you know the total size before you copy the parts in?
3. **fullBox.** Can you build it out of `box`?
4. **stts.** Walking through the durations, when do you start a new run?
5. **stsz, stco, stss.** In what order do the count and the list go? What number does the first sample have?
6. **mp4.** Which boxes can you build before you know the offsets? Where does the first chunk start? Which numbers are in 90000ths of a second and which in milliseconds?

Run the tests after each function. A failing test tells you exactly what it expected. `MS.parseMP4(file)` (provided) reads your file back as a tree of boxes, and `MS.findBox(tree, "moov/trak/mdia/minf/stbl")` finds one: use them to look at what you made.

Once it works, the test pictures show every byte of a small MP4 as a pixel, colored by its box, and your KineticIntro with an **Export MP4** button. In a browser, press it: the frames are rendered by your code, encoded by the browser, packaged by your `mp4()`, and played back on the page. That's your video file.

> **Study buddy:** "Hand me the first 64 bytes of an MP4 as hex and let me find the box boundaries, sizes and types myself. Check my reading, but don't read it for me. No code." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2010%20%28Export%29%3A%20frames%20to%20MP4%2C%20then%20map%20it%20to%20Remotion.%20Here%27s%20what%20I%20want%20help%20with%3A%20Hand%20me%20the%20first%2064%20bytes%20of%20an%20MP4%20as%20hex%20and%20let%20me%20find%20the%20box%20boundaries%2C%20sizes%20and%20types%20myself.%20Check%20my%20reading%2C%20but%20don%27t%20read%20it%20for%20me.%20No%20code.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2010%20%28Export%29%3A%20frames%20to%20MP4%2C%20then%20map%20it%20to%20Remotion.%20Here%27s%20what%20I%20want%20help%20with%3A%20Hand%20me%20the%20first%2064%20bytes%20of%20an%20MP4%20as%20hex%20and%20let%20me%20find%20the%20box%20boundaries%2C%20sizes%20and%20types%20myself.%20Check%20my%20reading%2C%20but%20don%27t%20read%20it%20for%20me.%20No%20code.)

## Predict, then run

Guess first, then run. In a terminal, `node tools/try.js 10` lists the blocks.

```js predict
// Predict 1: what are the 4 bytes of u32(1000)?
const myGuess = null; // TODO: your guess, as [a, b, c, d]
MS.reveal("u32(1000)", myGuess, Array.from(MS.u32(1000)));
```

```js predict
// Predict 2: 180 frames that all last 3000 ticks. How many bytes is the whole stts box?
const myGuess = null; // TODO: your guess
MS.reveal("stts bytes", myGuess, MS.stts(new Array(180).fill(3000)).length);
```

```js predict
// Predict 3: three chunks of 1000, 200 and 200 bytes. Where in the file does the second one start?
const myGuess = null; // TODO: your guess, a byte number
const chunks = [1000, 200, 200].map((n, i) => ({ data: new Uint8Array(n), key: i === 0, timestamp: i * 33333, duration: 33333 }));
const file = MS.mp4(chunks, { width: 16, height: 16, description: new Uint8Array([1, 66, 0, 30]) });
const stco = MS.findBox(MS.parseMP4(file), "moov/trak/mdia/minf/stbl/stco");
MS.reveal("the second chunk's offset", myGuess, new DataView(stco.body.buffer, stco.body.byteOffset).getUint32(12));
```

<details><summary>Answers</summary>

1. [0, 0, 3, 232]. 1000 is 3 × 256 + 232. The two top bytes are 0, and they still have to be there: a u32 is always 4 bytes.
2. 24. 8 for the box header, 4 for version and flags, 4 for the entry count, and one entry of 8 bytes: (180, 3000). An hour of 30 fps video would make it exactly the same size.
3. 1040. The ftyp is 32 bytes (8 of header, then "isom", a version and four 4-letter brands), the mdat's header is 8 more, and the first chunk is 1000.

</details>

## Break it

Once your tests pass: make each TODO change, run the experiment before and after, explain the difference, then undo it.

### 1. Little-endian

```js experiment
// Break it 1: what happens if the bytes are backwards?
// TODO(break-it), in src/10-export.js → u32:
//   write the smallest byte first.
const chunks = [400, 120].map((n, i) => ({ data: new Uint8Array(n), key: i === 0, timestamp: 0, duration: 33333 }));
const file = MS.mp4(chunks, { width: 16, height: 16, description: new Uint8Array([1, 66, 0, 30]) });
console.log("first 8 bytes: " + Array.from(file.slice(0, 8)).join(" "));
try { console.log("boxes: " + MS.parseMP4(file).map(b => b.type).join(", ")); }
catch (e) { console.log("can't read it: " + e.message); }
// TODO: what size does the first box claim to be after the change? What would a video player do with that?
```

### 2. Forget the mdat's header

```js experiment
// Break it 2: what is an offset measured from?
// TODO(break-it), in src/10-export.js → mp4:
//   start the first chunk's offset at the end of the ftyp, without the mdat's 8 header bytes.
const chunks = [[9, 9, 9, 9], [7, 7, 7]].map((b, i) => ({ data: new Uint8Array(b), key: i === 0, timestamp: 0, duration: 33333 }));
const file = MS.mp4(chunks, { width: 16, height: 16, description: new Uint8Array([1, 66, 0, 30]) });
const stco = MS.findBox(MS.parseMP4(file), "moov/trak/mdia/minf/stbl/stco");
const first = new DataView(stco.body.buffer, stco.body.byteOffset).getUint32(8);
console.log("chunk 1 is at byte " + first + "; the 4 bytes there are " + Array.from(file.slice(first, first + 4)).join(" "));
// TODO: before the change they're 9 9 9 9. After it, what is the player reading instead of the frame?
```

### 3. Count key frames from 0

```js experiment
// Break it 3: does it matter where counting starts?
// TODO(break-it), in src/10-export.js → stss:
//   number the samples from 0 instead of 1.
const b = MS.stss([true, false, false, true]);
const v = new DataView(b.buffer, b.byteOffset);
console.log("stss lists: " + [1, 2].map(i => v.getUint32(12 + 4 * i)).join(", "));
// TODO: which frames does a player now think are key frames? What happens when someone seeks to 0:02 and it starts decoding at a frame that isn't one?
```

## Checkpoint

When all 15 tests pass, the checkpoint unlocks (layer 00 explains how it works). The picture is a word made of dots, and every dot asks one small question about the bytes of an MP4: a dot that gets a wrong answer flies off its letter. Its traps: numbers whose bytes are all different, numbers past 2¹⁶ and up to 2³² − 1, boxes inside boxes inside boxes, a part that's empty, durations that alternate or run out at the end, empty tables, a single chunk, frames at 24 fps whose durations round, and key frames that aren't the first. The three questions are below.

```js checkpoint
// Checkpoint 10 · Export. Replace each null with your answer.
MS.answers("10", {
  // 1. How many bytes long is the mvhd box that MS.MP4.mvhd() makes?
  q1: null,
  // 2. NTSC video runs at 29.97 fps: each frame lasts 1001 ÷ 30000 of a second.
  //    How many ticks is that at timescale 90000?
  q2: null,
  // 3. KineticIntro has 180 frames, with a key frame every 60 frames starting at the
  //    first. Which numbers does stss list? Answer as an array.
  q3: null,
});
```

## In the real world

You've built, from single pixels up, every piece of a motion-graphics engine. Here's where each one lives in Remotion:

| You wrote | Layer | In Remotion |
|---|---|---|
| `createComposition`, `renderFrame` | 03 | [`<Composition>`](https://www.remotion.dev/docs/composition), and each frame a headless Chrome renders |
| `frameAt`, `MS.play` | 03 | [`<Player>`](https://www.remotion.dev/docs/player), [`useCurrentFrame()`](https://www.remotion.dev/docs/use-current-frame) |
| `interpolate`, `interpolateColors` | 04 | [`interpolate()`](https://www.remotion.dev/docs/interpolate), [`interpolateColors()`](https://www.remotion.dev/docs/interpolate-colors) |
| `cubicBezier` | 05 | [`Easing.bezier()`](https://www.remotion.dev/docs/easing) |
| `spring` | 06 | [`spring()`](https://www.remotion.dev/docs/spring) |
| matrices, `drawTransformed`, `blur` | 07 | CSS `transform` and `filter: blur()`, drawn by Chrome |
| `sequence`, `series`, `random`, `textSprite` | 08 | [`<Sequence>`](https://www.remotion.dev/docs/sequence), [`<Series>`](https://www.remotion.dev/docs/series), [`random()`](https://www.remotion.dev/docs/random), web fonts |
| `kineticIntro` | 09 | the KineticIntro component itself |
| `mp4` | 10 | [`renderMedia()`](https://www.remotion.dev/docs/renderer/render-media), which hands the frames to FFmpeg to encode and package |

- FFmpeg's `-movflags +faststart` moves the `moov` box to the front after writing, the "fast start" from the chapter.
- Files over 4 GB need offsets bigger than a u32 can hold: the `co64` box is `stco` with u64 offsets.
- Streaming video (YouTube, Netflix) uses **fragmented MP4**: many small `moof` + `mdat` pairs, each with its own little sample table, so a player can start before the file ends.

## Going further (optional)

- **Read the original.** ISO/IEC 14496-12 is long, but its box definitions are short and regular. Find `stts` and `stss` in it and compare them with your code. Apple's [QuickTime File Format](https://developer.apple.com/documentation/quicktime-file-format) documentation describes the same boxes as "atoms", with diagrams.
- Make a fast-start file: build the `moov` first with placeholder offsets, measure it, then fix the offsets. Check it still plays.
- Open your exported file in a hex editor (or `xxd` in a terminal) and find the `moov`, the `stss` and your first key frame by hand.
