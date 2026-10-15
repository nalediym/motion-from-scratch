# Layer 06 · Springs

_A spring doesn't know where it's going to be, only what happens next._

**You'll write:** `springForce`, `stepSpring`, `spring`, `dampingRatio`, `settleFrame` in `src/06-springs.js`
**Check it:** `node tests/run.js 06`, or open `tests.html`
**Builds on:** layers 00–05

Easing curves are drawn by hand: someone picks four numbers and the motion follows the shape exactly. A spring is different. You describe a physical object, how stiff it is, how much friction it has and how heavy it is, and the motion is whatever physics says happens. That's why spring motion feels alive, and why [Remotion's `spring()`](https://www.remotion.dev/docs/spring) is one of its most-used functions. KineticIntro itself only uses easing curves; springs are the other half of Remotion's motion toolkit. This layer simulates one, step by step, and finds out how small the steps have to be.

## Under the hood

### A spring is a rule, not a curve

Picture a weight on a spring, lying on a slippery table. Pull it and let go. Two forces act on it. The spring pulls it back toward where it wants to rest, harder the further away it is: that's [Hooke's law](https://en.wikipedia.org/wiki/Hooke%27s_law). Friction, called **damping**, pushes against the motion, harder the faster it moves:

```text
              the spring pulls it back
          ┌──────────────┴───────────────┐
  force = −stiffness × (position − target)
        − damping × velocity
          └───────┬────────┘
          friction slows it

  acceleration = force ÷ mass
```

That's the whole description, and it only says what happens *next*: given where the weight is and how fast it's moving, here's how its speed is changing. To find out where it is at frame 30, you have to play time forward from the start.

### Stepping through time

Playing time forward means taking small steps of `dt` seconds. Each step uses the force to update the velocity, and the velocity to update the position. The order matters more than it looks:

```text
  explicit Euler:
    position += velocity × dt
                └─ the old velocity
    velocity += acceleration × dt

  semi-implicit Euler:
    velocity += acceleration × dt
    position += velocity × dt
                └─ the new velocity
```

Both look reasonable, and over one step they barely differ. Over thousands of steps, explicit Euler quietly adds energy every time: a spring with no friction swings a little wider each second, forever. [Semi-implicit Euler](https://en.wikipedia.org/wiki/Semi-implicit_Euler_method) keeps the swing the same size, which is why physics engines use it. It costs nothing extra; it's just the right order.

### How small is small enough?

Each step pretends the force stays the same for `dt` seconds. That's fine while `dt` is short compared with how fast the spring swings. A spring's natural speed is `ω = √(stiffness ÷ mass)`, in radians per second, and semi-implicit Euler stays stable only while `ω × dt` is below 2. Past that, every step overshoots a little more than the last, and the numbers explode.

A video frame is far too long a step: at 30 fps, `dt` is 33 ms, so any spring stiffer than about 3,600 (with mass 1) blows up. This layer steps every **1 ms** instead, and frame `n` is 1000 × n ÷ fps milliseconds in, rounded to the nearest whole step. Notice what that costs: because frame = f(n), working out frame 90 means simulating all 3,000 steps from the start, every time.

> **Study buddy:** "Ask me questions until I can explain why updating the velocity before the position keeps a frictionless spring from gaining energy. No code." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2006%20%28Springs%29%3A%20physics%20stepping%20and%20stability.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20questions%20until%20I%20can%20explain%20why%20updating%20the%20velocity%20before%20the%20position%20keeps%20a%20frictionless%20spring%20from%20gaining%20energy.%20No%20code.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2006%20%28Springs%29%3A%20physics%20stepping%20and%20stability.%20Here%27s%20what%20I%20want%20help%20with%3A%20Ask%20me%20questions%20until%20I%20can%20explain%20why%20updating%20the%20velocity%20before%20the%20position%20keeps%20a%20frictionless%20spring%20from%20gaining%20energy.%20No%20code.)

### The damping ratio

Three numbers describe a spring, but its character comes down to one, the **damping ratio**:

```text
  ζ = damping ÷ (2 × √(stiffness × mass))

  ζ below 1   underdamped
    overshoots, bounces, then settles

  ζ = 1       critically damped
    arrives as fast as possible,
    never overshoots

  ζ above 1   overdamped
    creeps in slowly, never overshoots
```

Remotion's default spring is stiffness 100, damping 10, mass 1, so ζ = 10 ÷ (2 × 10) = 0.5: a little bouncy.

### When is it done?

A spring never quite arrives. Each bounce is smaller than the last, but it never reaches exactly zero. So "done" needs a definition: the spring has **settled** at the first frame from which it stays within some small distance of its target for good. Remotion's [`measureSpring()`](https://www.remotion.dev/docs/measure-spring) uses half a percent of the distance from `from` to `to`, and so does `settleFrame`. "Stays" matters: a bouncy spring can pass through the target zone on its way back out.

## Your turn

Work through `src/06-springs.js` top to bottom. Each function's comment is its spec. Some questions to guide you, in order:

1. **springForce.** If the position is past the target, which way should the force point? How do you fill in config values that are missing without losing the ones you were given?
2. **stepSpring.** Which comes first, the new velocity or the new position? Why must the state you were given stay unchanged? (Think about frame = f(n).)
3. **spring.** How many 1 ms steps is frame 5 at 48 fps? What should frame 0 give, whatever the config?
4. **dampingRatio.** What makes ζ exactly 1?
5. **settleFrame.** If frame 20 is inside the zone but frame 25 is outside, can frame 20 be the answer? Do you need to call `spring()` for every frame, or can you keep stepping one simulation?

Run the tests after each function. A failing test tells you exactly what it expected.

Once it works, the test pictures show four springs, bouncy, default, critically damped and heavy, as graphs and as moving dots.

> **Study buddy:** "Give me three spring configs and ask me to rank them by how much they overshoot and how fast they settle, before I run anything. Then ask me to explain the ranking. No code." [Ask Claude](https://claude.ai/new?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2006%20%28Springs%29%3A%20physics%20stepping%20and%20stability.%20Here%27s%20what%20I%20want%20help%20with%3A%20Give%20me%20three%20spring%20configs%20and%20ask%20me%20to%20rank%20them%20by%20how%20much%20they%20overshoot%20and%20how%20fast%20they%20settle%2C%20before%20I%20run%20anything.%20Then%20ask%20me%20to%20explain%20the%20ranking.%20No%20code.) · [Ask ChatGPT](https://chatgpt.com/?q=You%27re%20my%20study%20buddy%20for%20Motion%20from%20Scratch%20%28github.com%2Fnalediym%2Fmotion-from-scratch%29%2C%20a%20course%20where%20I%20build%20a%20video%20engine%20from%20single%20pixels%20up%20in%20JavaScript.%20Rules%3A%20never%20write%2C%20finish%20or%20fix%20my%20code%2C%20even%20if%20I%20ask.%20Never%20give%2C%20confirm%20or%20rule%20out%20checkpoint%20answers.%20Ask%20me%20questions%20first.%20If%20I%27m%20still%20stuck%2C%20climb%20this%20hint%20ladder%20one%20rung%20at%20a%20time%2C%20never%20past%20the%20top%3A%201%29%20ask%20what%20I%20expected%2C%20what%20happened%20and%20what%20I%27ve%20tried%3B%202%29%20point%20at%20a%20failing%20test%27s%20expected%20vs%20actual%20values%3B%203%29%20ask%20a%20concept%20question%20and%20point%20to%20the%20chapter%20section%3B%204%29%20explain%20with%20an%20analogy%20or%20ASCII%20diagram%2C%20using%20different%20numbers%3B%205%29%20point%20at%20the%20line%20to%20look%20at%20and%20ask%20about%20it.%20Explain%20what%27s%20happening%20under%20the%20hood%20%28bytes%2C%20rounding%2C%20math%2C%20how%20browsers%20do%20it%29.%20I%27m%20on%20layer%2006%20%28Springs%29%3A%20physics%20stepping%20and%20stability.%20Here%27s%20what%20I%20want%20help%20with%3A%20Give%20me%20three%20spring%20configs%20and%20ask%20me%20to%20rank%20them%20by%20how%20much%20they%20overshoot%20and%20how%20fast%20they%20settle%2C%20before%20I%20run%20anything.%20Then%20ask%20me%20to%20explain%20the%20ranking.%20No%20code.)

## Predict, then run

Guess first, then run. In a terminal, `node tools/try.js 06` lists the blocks.

```js predict
// Predict 1: Remotion's default spring goes from 0 to 1. What's the highest value it reaches?
const myGuess = null; // TODO: your guess, to 2 decimals
let highest = 0;
for (let n = 0; n <= 60; n++) highest = Math.max(highest, MS.spring({ frame: n, fps: 30 }));
MS.reveal("the highest value", myGuess, Math.round(highest * 100) / 100);
```

```js predict
// Predict 2: with damping 18 instead of 10, does the spring ever go past 1?
const myGuess = null; // TODO: true or false
let passes = false;
for (let n = 0; n <= 300; n++) if (MS.spring({ frame: n, fps: 30, config: { damping: 18 } }) > 1) passes = true;
MS.reveal("goes past 1", myGuess, passes);
```

```js predict
// Predict 3: the default spring settles at frame 28 (30 fps). Make it four times
// heavier (mass 4) and keep everything else. When does it settle?
const myGuess = null; // TODO: your guess, a frame number
MS.reveal("settle frame with mass 4", myGuess, MS.settleFrame({ fps: 30, config: { mass: 4 } }));
```

<details><summary>Answers</summary>

1. 1.16. With ζ = 0.5, the default spring overshoots by 16% before settling back. There's a formula for the first overshoot, `e^(−πζ ÷ √(1 − ζ²))`, and it gives 0.163.
2. true, but only just: it peaks about a thousandth past 1. Damping 18 makes ζ = 0.9, and anything below 1 overshoots a little. Only from ζ = 1 up does a spring arrive without ever passing its target.
3. 123, more than four times as long. A heavier mass slows the swing (ω halves) *and* makes it bouncier (ζ halves to 0.25), so it takes longer to swing and more swings to settle.

</details>

## Break it

Once your tests pass: make each TODO change, run the experiment before and after, explain the difference, then undo it.

### 1. Explicit Euler

```js experiment
// Break it 1: does the order of the two updates matter?
// TODO(break-it), in src/06-springs.js → stepSpring:
//   move the position with the OLD velocity first, then update the velocity.
const config = { stiffness: 900, damping: 0, mass: 1 };   // no friction: it should swing forever, never growing
for (let s = 1; s <= 4; s++) {
  let far = 0;
  for (let n = (s - 1) * 30; n < s * 30; n++) far = Math.max(far, Math.abs(MS.spring({ frame: n, fps: 30, config }) - 1));
  console.log("second " + s + ": swings up to " + far.toFixed(3) + " from the target");
}
// TODO: before the change, the swing stays the same size. What happens after? Where does the energy come from?
```

### 2. One step per frame

```js experiment
// Break it 2: why 1 ms steps?
// TODO(break-it), in src/06-springs.js → spring:
//   take one step per frame (dt = 1 ÷ fps) instead of 1 ms steps.
const stiff = { stiffness: 4000, damping: 20, mass: 1 };
for (const n of [2, 4, 6, 8, 10]) console.log("frame " + n + ": stiff " + MS.spring({ frame: n, fps: 30, config: stiff }).toFixed(3) + ", default " + MS.spring({ frame: n, fps: 30 }).toFixed(3));
// TODO: which spring survives the change and which explodes? Work out ω × dt for each (ω = √(stiffness ÷ mass)).
```

### 3. Ignore the frame rate

```js experiment
// Break it 3: what is fps for?
// TODO(break-it), in src/06-springs.js → spring:
//   ignore fps and always use 30.
console.log("frame 15 at 30 fps: " + MS.spring({ frame: 15, fps: 30 }).toFixed(4));
console.log("frame 30 at 60 fps: " + MS.spring({ frame: 30, fps: 60 }).toFixed(4));
console.log("frame 12 at 24 fps: " + MS.spring({ frame: 12, fps: 24 }).toFixed(4));
// TODO: all three are half a second in. After the change, which disagree? How would the 60 fps video look?
```

## Checkpoint

When all 14 tests pass, the checkpoint unlocks (layer 00 explains how it works). The picture is another freeze-frame of flying dots, this time on springs. Each dot's position is worked out twice, in two ways that must agree, so if your two answers disagree even slightly, that letter scatters. Its traps: configs with some values missing, a spring that falls instead of rising, frames that aren't a whole number of milliseconds, other frame rates, and a settle frame that has to agree with your spring. The three questions are below.

```js checkpoint
// Checkpoint 06 · Springs. Replace each null with your answer.
MS.answers("06", {
  // 1. A spring has stiffness 300 and mass 2. What damping makes it critically damped?
  //    Round to 2 decimals.
  q1: null,
  // 2. How many 1 ms steps does spring() simulate to work out frame 100 at 24 fps?
  q2: null,
  // 3. react-spring's default config is tension 170 and friction 26 (its names for
  //    stiffness and damping), with mass 1. What's its damping ratio, to 3 decimals?
  q3: null,
});
```

## In the real world

- Remotion's [`spring()`](https://www.remotion.dev/docs/spring) takes the same config names with the same defaults. Instead of simulating in 1 ms steps, it uses the exact formula for a damped spring, one frame at a time. For bouncy springs it lands within about 0.005 of your answer; it treats overdamped springs as critically damped, so there it disagrees.
- Apple's SwiftUI describes springs by their *damping fraction*, which is the damping ratio, and CSS can fake a spring by listing many points in a [`linear()`](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear) easing function.
- Game engines step their physics in small, fixed time steps for exactly the stability reasons in this chapter, whatever the screen's frame rate: see Glenn Fiedler's ["Fix Your Timestep!"](https://gafferongames.com/post/fix_your_timestep/).

## Going further (optional)

- **Read the original.** Glenn Fiedler's ["Integration Basics"](https://gafferongames.com/post/integration_basics/) compares explicit Euler, semi-implicit Euler and RK4 on a spring, with graphs.
- Replace the simulation with the exact formula for an underdamped spring, `to − (to − from) × e^(−ζωt) × (cos(ω_d t) + (ζω ÷ ω_d) × sin(ω_d t))` with `ω_d = ω√(1 − ζ²)`, and compare with your 1 ms answer at frame 10.
- Make `spring()` fast without breaking frame = f(n): cache states so a later frame can continue from an earlier one, and check you still get the same answer whatever order frames are asked in.
