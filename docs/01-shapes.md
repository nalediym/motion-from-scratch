# Layer 01 · Shapes & blending

_Deciding which pixels a shape covers, and what happens where shapes overlap._

**You'll write:** `hex`, `blendPixel`, `fillRect`, `fillCircle`, `mixColor`, `fillVerticalGradient`, `fillRadialGradient` in `src/01-shapes.js`
**Check it:** `node tests/run.js 01`
**Builds on:** layer 00

KineticIntro has a glowing radial background, words that fade in and out, and a light sweep that brightens the logo as it passes. All three are this layer: filling shapes, mixing colors, and **blending** a see-through color over what's already there.

## Under the hood

### Colors as text: hex

Designers write colors like `#5B8CFF`. That's three bytes written in base 16 (hexadecimal), two digits each:

```text
   #  5B   8C   FF
      │    │    └─ blue  = 0xFF = 15×16 + 15 = 255
      │    └────── green = 0x8C =  8×16 + 12 = 140
      └─────────── red   = 0x5B =  5×16 + 11 =  91
```

JavaScript can read base-16 text for you (look up `parseInt`'s second argument). There are two common approaches: cut the string into three 2-character pieces, or read all six digits as one number and pull bytes out of it with bit shifts (`>>`) and masks (`& 255`). Either is fine. The second shows you how colors are often packed in memory.

### Rasterizing: which pixels does a shape cover?

A rectangle from x = 2 to x = 6 is an idea with perfect edges. The screen only has whole pixels. Turning shapes into pixels is called **rasterization**, and the rule almost every renderer uses is: _a pixel belongs to the shape if its **center** is inside._

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

Jagged edges like these are called **aliasing**. Real renderers soften them with **antialiasing**: a pixel that's 40% covered gets 40% of the color. See **Going further**.

### Alpha blending: painting with see-through paint

Here's the big one. When you paint a half-transparent red over a blue pixel, the result is a mix. When you paint it over an empty, fully transparent pixel, it should still be red, just see-through.

This was worked out in 1984 by Thomas Porter and Tom Duff at Lucasfilm, in a paper called "Compositing Digital Images". It's how film effects layered spaceships over backgrounds, and how every browser layers one element over another. Their "over" operation, with alphas written as 0 to 1:

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

Colors stored this way are called **straight alpha**. Many renderers store colors already multiplied by alpha instead (**premultiplied alpha**), because then the formula needs no division. That choice has consequences, which you'll explore below.

### Gradients: one color per position

A gradient answers one question per pixel: _how far along am I, from 0 to 1?_ Then it mixes the two colors by that amount:

```text
  mixColor(a, b, t) = a + (b − a) × t      (for each of R, G, B and A)

  t = 0          t = 0.25        t = 0.5         t = 0.75        t = 1
  ██ a           ██              ██ halfway      ██              ██ b
```

A vertical gradient gets `t` from the row. A radial gradient gets `t` from distance to a center point. Dividing each axis by its own radius (`rx`, `ry`) stretches the circle into an ellipse.

That's exactly what CSS does. KineticIntro's background is written in CSS as:

```text
  radial-gradient(70% 60% at 50% 38%, #1A2740, #0B0D12)
                  └rx  ry┘   └cx  cy┘   inner     outer
  on a 1080 × 1920 frame:  rx = 756   ry = 1152   cx = 540   cy = 729.6
```

When your tests pass, `tests.html` draws that exact background. It's the first real piece of the recreation.

## Your turn

1. **hex.** What should happen with `"#FFF"`, `"blue"`, or `"#12345G"`? A regular expression like `/^#?[0-9a-f]{6}$/i` is one way to check. Can you explain each part of it?
2. **blendPixel.** Turn both alphas into 0–1 first. Handle the case where `outAlpha` is 0. What would dividing by 0 put in the pixel?
3. **fillRect.** Round the four edges, then clip them to the frame *before* looping. Why is clipping first better than letting `blendPixel` ignore off-screen pixels?
4. **fillCircle.** Compute the bounding box, clip it, then test each pixel's center.
5. **mixColor, fillVerticalGradient, fillRadialGradient.** Where is the middle of row `y`? Why sample there instead of at its top edge?

## Predict, then run

1. How many pixels does `fillRect(f, 0.4, 0, 2, 1, c)` cover? And `fillRect(f, 0.6, 0, 2, 1, c)`?
2. A circle of radius 5 centered on a pixel center. The area of a circle is πr² ≈ 78.5. How many pixels will be filled?
3. `[255, 0, 0, 128]` blended onto `[0, 0, 0, 0]`. What are the four numbers afterwards?

<details><summary>Answers</summary>

1. Two each. Edges 0 → 2, and 1 → 3.
2. 81. Close to 78.5 but not equal: pixels are all-or-nothing, so the count wobbles around the true area.
3. `[255, 0, 0, 128]`. The color stays pure red; only the alpha says "half there".

</details>

## Break it

1. **Forget the division.** Remove `/ outAlpha` from `blendPixel`. Which tests fail? Blend 50% red onto a transparent pixel and look at the result: it's dark red, `[128, 0, 0, 128]`. When that pixel is later layered over something bright, it shows up as a dark fringe. Dark halos around cut-out images are this exact bug, in real software.
2. **Make the right edge inclusive.** Change `fillRect` so it covers `right` too. Then draw two half-transparent rectangles side by side, one from 0 to 10 and the next from 10 to 20. Look closely at x = 10. What happened, and why does it look like a seam?
3. **Skip the bounding box.** Make `fillCircle` loop over the whole frame. Time drawing 1,000 small circles on a 1080 × 1920 frame, before and after, with `console.time`.

## Checkpoint

- `node tests/run.js 01` shows 17 of 17 passing.
- `tests.html` shows overlapping blended shapes, and a tall dark-blue glowing background. That background is KineticIntro's.
- You can explain why half-transparent red over nothing stays red.

## In the real world

- Canvas's `globalAlpha` and CSS `opacity` both use Porter–Duff "over".
- Browsers usually keep pixels premultiplied internally. That's why a canvas pixel with very low alpha can come back from `getImageData` with slightly different colors than you put in: precision was lost in the multiply and divide.
- Motion Studio's `KineticIntro.tsx` paints its background with the CSS gradient above, then adds a second radial glow and a dark vignette on top. Those are three layers blended "over" each other, which you can now do by hand.

## Study buddy prompts

- "I'm on layer 01 of Motion from Scratch. Without giving me code, walk me through Porter–Duff 'over' by asking me what should happen in three cases I can check by hand."
- "Ask me to predict which pixels fillRect(1.5, 0, 2, 1) covers, then tell me whether my reasoning (not just my answer) was right."
- "Explain straight versus premultiplied alpha with an analogy, then give me a break-it experiment that shows the difference."

## Going further (optional)

- **Antialiased circles.** Instead of in-or-out, use coverage `clamp(r − distance + 0.5, 0, 1)` and multiply it into the color's alpha before blending. Compare the edges at scale in `tests.html`.
- **Premultiplied mode.** Write `blendPremultiplied` where colors are stored already multiplied by alpha. Show that the formula no longer needs a division, and find which test values it can't reproduce exactly after 8-bit rounding.
