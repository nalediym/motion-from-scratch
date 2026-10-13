# Layer 02 · Glyphs

_A font is a lookup table from characters to tiny pictures._

**You'll write:** `drawGlyph`, `measureText`, `drawText` in `src/02-glyphs.js`
**Check it:** `node tests/run.js 02`
**Builds on:** layers 00–01 (especially `fillRect`)

KineticIntro is mostly words: **DESIGN.**, **ANIMATE.**, **RENDER.**, then **MOTION·STUDIO**. In this layer you'll draw text using nothing but the rectangles you already have and a font made of `#` and `.` characters. In layer 07 you'll switch to the browser's real fonts, and this layer is how you'll understand what the browser is doing for you.

## Under the hood

### Two kinds of fonts

**Bitmap fonts** store each character as a grid of on/off pixels. Arcade machines, early terminals, and the first Macintosh used them; Susan Kare drew the original Mac fonts on graph paper in 1983–84. They're simple and fast, but they only look right at one size.

**Outline fonts** (TrueType, OpenType) store each character as curves, so they can be drawn at any size. Drawing one means rasterizing the curves into pixels with antialiasing, which is the "which pixels does this shape cover?" problem from layer 01, done very well. That's what the browser does when you write `font-size: 150px`.

You're building a bitmap font renderer because it shows the whole pipeline with no magic: _character → lookup → grid → pixels_.

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

Reading it is a nested loop: for each row `r`, for each column `c`, if the cell is `#`, fill a `scale × scale` square at `(x + c × scale, y + r × scale)`. Scaling by repeating each pixel as a block like this is called **nearest-neighbor** scaling. It's why pixel art stays crisp.

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
- **Tracking** is uniform extra space between all letters. (Kerning, which tightens specific pairs like "AV", is a different thing. Our font skips it.)
- Notice that tracking only goes *between* glyphs. The last glyph doesn't get a gap after it.

**Alignment needs measuring first.** To center text on `x`, you need its total width before drawing the first glyph, so the left edge is `x − width / 2`. Real layout engines work in the same two passes: measure everything, then place everything. KineticIntro centers every word, so you'll use this constantly.

### Characters are trickier than they look

- **Case.** The font has only uppercase. Mapping `"g"` to `"G"` is a tiny case of what real fonts do with **fallback**: when the font lacks a character, find a substitute.
- **Missing characters.** When there's no substitute, show **tofu**: an empty box. (Google's font family Noto is named for "no more tofu".) Tofu is ugly on purpose. It tells you something is missing instead of silently skipping it.
- **What counts as one character?** `"MOTION·STUDIO"` has 13 characters, and `·` is one of them. But try `"👋".length` in the console: it says 2. JavaScript strings count 16-bit units, and many emoji take two. `for (const ch of text)` and `[...text]` walk real characters. A plain `for (let i = 0; i < text.length; i++)` splits that emoji in half. Pick your loop carefully.

### Sizing for the real video

KineticIntro sets its words at a font size of 150 px in a 1080 px wide frame. Font size is the height of the font's whole design box, not of a capital letter. In Inter, the font it uses, capitals are about 73% of that, so roughly 110 px tall. Our capitals are 7 cells tall, so a scale of about 16 matches. Can **ANIMATE.** fit across 1080 pixels at scale 16 with tracking 1? How large can the scale get before it doesn't? Work it out with `measureText` once it passes.

## Your turn

1. **measureText.** Start here: it's pure arithmetic and has the clearest tests. What should it return for the empty string? For one glyph?
2. **drawGlyph.** Look up the glyph (uppercase first). If it's missing, draw tofu, the outer ring of the 5 × 7 grid. Otherwise loop rows and columns and fill the `#` cells with `fillRect`.
3. **drawText.** Measure once, work out the starting x from `align`, then walk the characters, advancing by one glyph plus tracking each time. Spaces advance without drawing.

## Predict, then run

1. How wide is `"DESIGN."` at scale 4 with tracking 1?
2. What does `drawGlyph(f, "Ä", 0, 0, 1, white)` draw?
3. `drawText(f, "II", 20, 0, 1, white, { align: "center" })`: the width is 11, so the left edge is 14.5. Which pixel column gets the first ink, and why that one?

<details><summary>Answers</summary>

1. 164 pixels: 7 glyphs × 5 cells × 4, plus 6 gaps × 1 × 4.
2. Tofu. "Ä" isn't in the font, and uppercasing it doesn't help.
3. Column 15. Your `fillRect` rounds edges, and `round(14.5)` is 15. Text lands on whole pixels, just like rectangles.

</details>

## Break it

1. **Put tracking after every glyph**, including the last, in `measureText`. Which tests fail? Center a word and look: it drifts right by half a gap. Real UI text that looks "slightly off-center" is often this bug.
2. **Loop by index.** Change `drawText` to `for (let i = 0; i < text.length; i++)` and draw `"HI 👋"`. How many tofu boxes appear for the one emoji, and why?
3. **Skip the uppercase step.** Draw `"Design."`. What appears?

## Checkpoint

- `node tests/run.js 02` shows 11 of 11 passing.
- `tests.html` shows **DESIGN.** in big pixel letters, plus an alignment test with a pink center line and one tofu box.
- You can explain why centering text needs `measureText` before the first glyph is drawn.

## In the real world

- Canvas's [`measureText`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText) and `textAlign` do what you just did, for outline fonts, with kerning and shaping on top.
- Text shaping engines like HarfBuzz handle what our font ignores: kerning, ligatures, scripts that join letters, and right-to-left text.
- In Motion Studio's `KineticIntro.tsx`, each word is centered with flexbox and drawn by the browser at a 150 px font size. In layer 07 you'll switch to real fonts too, so you can compare your pixel version with the browser's directly.

## Study buddy prompts

- "I'm on layer 02 of Motion from Scratch. Ask me questions until I can explain the difference between advance, tracking and kerning. No code."
- "Here's my measureText. Don't fix it; give me one input where it's wrong and let me work out why."
- "Explain how outline fonts get rasterized, connecting it to the pixel-center rule I learned in layer 01."

## Going further (optional)

- **Design your own glyphs.** Add lowercase letters or symbols to a copy of the font. What's the smallest grid where lowercase "g" still has a readable descender?
- **Outlines.** Draw text with a 1-cell dark outline by drawing it shifted in 8 directions, then on top. Count how many `fillRect` calls that costs, and think about why real renderers don't do it this way.
