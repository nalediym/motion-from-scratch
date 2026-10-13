# Layer 02 · Glyphs

_A font is a lookup table from characters to tiny pictures._

**You'll write:** `drawGlyph`, `measureText`, `drawText` in `src/02-glyphs.js`
**Check it:** `node tests/run.js 02`, or open `tests.html`
**Builds on:** layers 00–01 (especially `fillRect`)

KineticIntro is mostly words: **DESIGN.**, **ANIMATE.**, **RENDER.**, then **MOTION·STUDIO**. In this layer you'll draw text using nothing but the rectangles you already have and a font made of `#` and `.` characters. In layer 07 you'll switch to the browser's real fonts, and this layer is how you'll understand what the browser is doing for you.

## Under the hood

### Two kinds of fonts

**[Bitmap fonts](https://en.wikipedia.org/wiki/Computer_font#Bitmap_fonts)** store each character as a grid of on/off pixels. Arcade machines, early terminals and the first Macintosh used them; [Susan Kare](https://en.wikipedia.org/wiki/Susan_Kare) drew the original Mac fonts on graph paper in 1983–84. They're simple and fast, but they only look right at one size.

**Outline fonts** ([TrueType](https://developer.apple.com/fonts/TrueType-Reference-Manual/), [OpenType](https://learn.microsoft.com/en-us/typography/opentype/spec/)) store each character as curves, so they can be drawn at any size. Drawing one means rasterizing the curves into pixels with antialiasing, which is the "which pixels does this shape cover?" problem from layer 01, done very well. That's what the browser does when you write `font-size: 150px`.

You're building a bitmap font renderer because it shows the whole pipeline with no magic: _character → lookup → grid → pixels_.

> **Study buddy:** "Explain how outline fonts get rasterized, connecting it to the pixel-center rule I learned in layer 01." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2002%20%28Glyphs%29%3A%20text%20from%20a%20hand-made%20bitmap%20font.%20Here%27s%20what%20I%20want%20help%20with%3A%20Explain%20how%20outline%20fonts%20get%20rasterized%2C%20connecting%20it%20to%20the%20pixel-center%20rule%20I%20learned%20in%20layer%2001.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2002%20%28Glyphs%29%3A%20text%20from%20a%20hand-made%20bitmap%20font.%20Here%27s%20what%20I%20want%20help%20with%3A%20Explain%20how%20outline%20fonts%20get%20rasterized%2C%20connecting%20it%20to%20the%20pixel-center%20rule%20I%20learned%20in%20layer%2001.)

### The font file

`lib/font5x7.js` is the font. Every glyph is 7 rows of 5 cells:

```text
   MS.FONT_5x7.N  =               drawn at scale 3:
   [ "#...#",                     ■■■         ■■■
     "##..#",                     ■■■■■■      ■■■
     "#.#.#",                     ■■■   ■■■   ■■■
     "#..##",          ──►        ■■■      ■■■■■■
     "#...#",                     ■■■         ■■■
     "#...#",                     ■■■         ■■■
     "#...#" ]                    ■■■         ■■■
                                  (each # becomes a 3 × 3 block)
```

Reading it is a nested loop: for each row `r`, for each column `c`, if the cell is `#`, fill a `scale × scale` square at `(x + c × scale, y + r × scale)`. Scaling by repeating each pixel as a block like this is called **[nearest-neighbor](https://en.wikipedia.org/wiki/Nearest-neighbor_interpolation)** scaling. It's why pixel art stays crisp.

### Laying out a line

Text layout is the job of deciding where each glyph goes. Ours is the simplest possible version:

```text
   x                                                    one glyph = 5 cells
   │◄─ 5 ─►│◄1►│◄─ 5 ─►│◄1►│◄─ 5 ─►│                    tracking  = gap between glyphs
   ┌───────┐   ┌───────┐   ┌───────┐
   │   H   │   │   I   │   │   !   │                    width = 3 × 5 + 2 × 1 = 17 cells
   └───────┘   └───────┘   └───────┘                          (× scale for pixels)
   ◄──────────── measureText = 17 ───────────►
```

- **Advance** is how far you move right after each glyph: its width plus the tracking.
- **Tracking** is uniform extra space *between* glyphs, so none after the last one (CSS calls it [`letter-spacing`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/letter-spacing)). [Kerning](https://en.wikipedia.org/wiki/Kerning), which tightens specific pairs like "AV", is different; our font skips it.

**Alignment needs measuring first.** To center text on `x`, you need its total width before drawing the first glyph, so the left edge is `x − width / 2`. Real layout engines work in the same two passes: measure everything, then place everything. KineticIntro centers every word, so you'll use this constantly.

> **Study buddy:** "Ask me questions until I can explain the difference between advance, tracking and kerning. No code." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2002%20%28Glyphs%29%3A%20text%20from%20a%20hand-made%20bitmap%20font.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20questions%20until%20I%20can%20explain%20the%20difference%20between%20advance%2C%20tracking%20and%20kerning.%20No%20code.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2002%20%28Glyphs%29%3A%20text%20from%20a%20hand-made%20bitmap%20font.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20questions%20until%20I%20can%20explain%20the%20difference%20between%20advance%2C%20tracking%20and%20kerning.%20No%20code.)

### Characters are trickier than they look

- **Case.** The font has only uppercase. Mapping `"g"` to `"G"` (with [`toUpperCase`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toUpperCase)) is a tiny case of what real fonts do with **fallback**: when the font lacks a character, find a substitute.
- **Missing characters.** When there's no substitute, show **tofu**: an empty box. (Google's font family [Noto](https://fonts.google.com/noto) is named for "no more tofu".) Tofu is ugly on purpose. It tells you something is missing instead of silently skipping it.
- **What counts as one character?** `"MOTION·STUDIO"` has 13 characters, and `·` is one of them. But try `"👋".length` in the console: it says 2. JavaScript strings count 16-bit units ([`String.length`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length)), and characters beyond the first 65,536 take two, called a [surrogate pair](https://www.unicode.org/faq/utf_bom.html) in Unicode's UTF-16 encoding. [`for...of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of) and [spread](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) (`[...text]`) walk real characters. A plain `for (let i = 0; i < text.length; i++)` splits that emoji in half. Pick your loop carefully.

### Sizing for the real video

KineticIntro sets its words at a font size of 150 px in a 1080 px wide frame. Font size is the height of the font's whole design box (the "em"), not of a capital letter ([`font-size`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-size)). In Inter, the font it uses, capitals are about 73% of that, so roughly 110 px tall. Our capitals are 7 cells tall, so a scale of about 16 matches. Can **ANIMATE.** fit across 1080 pixels at scale 16 with tracking 1? How large can the scale get before it doesn't? Work it out with `measureText` once it passes.

## Your turn

1. **measureText.** Start here: it's pure arithmetic and has the clearest tests. What should it return for the empty string? For one glyph?
2. **drawGlyph.** Uppercase first, and tofu if it's still missing. The loop is in *The font file* above.
3. **drawText.** Measure once, work out the starting x from `align`, then walk the characters, advancing by one glyph plus tracking each time.

Once it works, the test pictures show **DESIGN.** in big pixel letters, plus an alignment test with a pink center line and one tofu box.

> **Study buddy:** "Here's my measureText. Don't fix it; give me one input where it's wrong and let me work out why." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2002%20%28Glyphs%29%3A%20text%20from%20a%20hand-made%20bitmap%20font.%20Here%27s%20what%20I%20want%20help%20with%3A%20Here%27s%20my%20measureText.%20Don%27t%20fix%20it%3B%20give%20me%20one%20input%20where%20it%27s%20wrong%20and%20let%20me%20work%20out%20why.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2002%20%28Glyphs%29%3A%20text%20from%20a%20hand-made%20bitmap%20font.%20Here%27s%20what%20I%20want%20help%20with%3A%20Here%27s%20my%20measureText.%20Don%27t%20fix%20it%3B%20give%20me%20one%20input%20where%20it%27s%20wrong%20and%20let%20me%20work%20out%20why.)

## Predict, then run

Guess first, then run. In a terminal, `node tools/try.js 02` lists the blocks.

```js predict
// Predict 1: how wide is "DESIGN." at scale 4 with tracking 1?
const myGuess = null; // TODO: your guess in pixels
MS.reveal('measureText("DESIGN.", 4)', myGuess, MS.measureText("DESIGN.", 4));
```

```js predict
// Predict 2: "Ä" isn't in the font. How many of its 35 cells get ink?
const myGuess = null; // TODO: a number from 0 to 35
const f = MS.createFrame(5, 7);
MS.drawGlyph(f, "Ä", 0, 0, 1, [255, 255, 255]);
let n = 0;
for (let i = 3; i < f.data.length; i += 4) if (f.data[i]) n++;
MS.reveal("cells inked for Ä", myGuess, n);
console.log(MS.asciiFrame(f));
```

```js predict
// Predict 3: centered on x = 20, "II" is 11 wide, so its left edge is 14.5.
// Which column gets the first ink?
const myGuess = null; // TODO: a column number
const f = MS.createFrame(40, 7);
MS.drawText(f, "II", 20, 0, 1, [255, 255, 255], { align: "center" });
let first = -1;
for (let x = 0; x < f.width; x++) if (MS.getPixel(f, x, 0)[3]) { first = x; break; }
MS.reveal("first inked column", myGuess, first);
```

<details><summary>Answers</summary>

1. 164 pixels: 7 glyphs × 5 cells × 4, plus 6 gaps × 1 × 4.
2. 20. "Ä" isn't in the font and uppercasing it doesn't help, so you get tofu: the 20 cells around the edge of the box.
3. Column 15. Your `fillRect` rounds edges, and `round(14.5)` is 15. Text lands on whole pixels, just like rectangles.

</details>

## Break it

Once your tests pass: make each TODO change, run the experiment before and after, explain the difference, then undo it.

### 1. Tracking after every glyph

```js experiment
// Break it 1: is centered text still centered?
// TODO(break-it), in src/02-glyphs.js → measureText:
//   count tracking after every glyph, including the last one.
const f = MS.createFrame(40, 7);
MS.drawText(f, "II", 20, 0, 1, [255, 255, 255], { align: "center" });
let left = -1, right = -1;
for (let x = 0; x < f.width; x++) if (MS.getPixel(f, x, 0)[3]) { if (left < 0) left = x; right = x; }
console.log("empty columns on the left:", left, "| on the right:", f.width - 1 - right);
console.log(MS.asciiFrame(f));
// TODO: before the change the two sides differ by one column (from rounding).
// After it, which way does the text shift, and by how much? Why that direction?
```

Real UI text that looks "slightly off-center" is often this bug.

### 2. Loop by index

```js experiment
// Break it 2: one emoji, drawn by your drawText.
// TODO(break-it), in src/02-glyphs.js → drawText:
//   walk the text with for (let i = 0; i < text.length; i++) and text[i].
console.log('"HI 👋".length =', "HI 👋".length, '  [..."HI 👋"].length =', [..."HI 👋"].length);
const f = MS.createFrame(30, 7);
MS.drawText(f, "HI 👋", 0, 0, 1, [255, 255, 255]);
console.log(MS.asciiFrame(f));
// TODO: count the tofu boxes before and after the change. Why does one emoji become two?
```

### 3. Skip the uppercase step

```js experiment
// Break it 3: mixed-case text.
// TODO(break-it), in src/02-glyphs.js → drawGlyph:
//   look the character up exactly as given, without uppercasing it.
const f = MS.createFrame(36, 7);
MS.drawText(f, "Design", 0, 0, 1, [255, 255, 255]);
console.log(MS.asciiFrame(f));
// TODO: predict what you'll see after the change, then run. Which letters survive?
```

## Checkpoint

When all 11 tests pass, the checkpoint unlocks (layer 00 explains how it works). This mystery picture's traps: lowercase text, an emoji, middle dots, and three lines that must all be centered. Then answer the three questions below.

```js checkpoint
// Checkpoint 02 · Glyphs. Replace each null with your answer.
MS.answers("02", {
  // 1. How wide, in pixels, is "HELLO, WORLD!" at scale 2 with tracking 1?
  q1: null,
  // 2. How many tofu boxes does drawText draw for "Ça va? 👋"?
  q2: null,
  // 3. drawText(frame, "HI", 100, 0, 3, color, { align: "center" }):
  //    which pixel column gets the first ink?
  q3: null,
});
```

## In the real world

- Canvas's [`measureText`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText) and [`textAlign`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textAlign) do what you just did, for outline fonts, with kerning and shaping on top.
- Text shaping engines like [HarfBuzz](https://harfbuzz.github.io/) handle what our font ignores: kerning, ligatures, scripts that join letters, and right-to-left text.
- In Motion Studio's `KineticIntro.tsx`, each word is centered with flexbox and drawn by the browser at a 150 px font size.

## Going further (optional)

- **Design your own glyphs.** Add lowercase letters or symbols to a copy of the font. What's the smallest grid where lowercase "g" still has a readable descender?
- **Outlines.** Draw text with a 1-cell dark outline by drawing it shifted in 8 directions, then on top. Count how many `fillRect` calls that costs, and think about why real renderers don't do it this way.
