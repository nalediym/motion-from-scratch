// tests/06-springs.test.js — PROVIDED. Read a failing test to see what's expected.
(function (MS) {
  const L = "06";
  const plain = { stiffness: 50, damping: 0, mass: 1 };

  MS.test(L, "springForce pulls back toward the target (Hooke's law)", t => {
    t.close(MS.springForce(2, 0, 0, plain), -100, 1e-12, "2 past the target");
    t.close(MS.springForce(-1, 0, 3, plain), 200, 1e-12, "4 short of the target");
    t.close(MS.springForce(3, 0, 3, plain), 0, 1e-12, "at the target, no pull");
  });

  MS.test(L, "springForce: damping pushes against the velocity", t => {
    t.close(MS.springForce(0, 3, 0, { stiffness: 50, damping: 4, mass: 1 }), -12, 1e-12, "moving at +3");
    t.close(MS.springForce(1, -2, 0, { stiffness: 50, damping: 4, mass: 1 }), -42, 1e-12, "spring and damper together");
  });

  MS.test(L, "springForce: missing config values use Remotion's defaults", t => {
    t.close(MS.springForce(1, 1, 0, {}), -110, 1e-12, "empty config: stiffness 100, damping 10");
    t.close(MS.springForce(1, 1, 0), -110, 1e-12, "no config at all");
    t.close(MS.springForce(1, 1, 0, { damping: 0 }), -100, 1e-12, "only damping given");
  });

  MS.test(L, "stepSpring: velocity first, then position with the new velocity", t => {
    const s = MS.stepSpring({ position: 1, velocity: 0 }, 0, { stiffness: 100, damping: 0, mass: 1 }, 0.01);
    t.close(s.velocity, -1, 1e-12, "velocity");
    t.close(s.position, 0.99, 1e-12, "position (it already moved, using the new velocity)");
  });

  MS.test(L, "stepSpring: a heavier mass speeds up less", t => {
    const s = MS.stepSpring({ position: 1, velocity: 0 }, 0, { stiffness: 100, damping: 0, mass: 4 }, 0.01);
    t.close(s.velocity, -0.25, 1e-12, "velocity");
    t.close(s.position, 0.9975, 1e-12, "position");
  });

  MS.test(L, "stepSpring returns a new state and leaves the old one alone", t => {
    const before = { position: 2, velocity: 1 };
    const after = MS.stepSpring(before, 0, {}, 0.001);
    t.ok(after !== before, "it should return a new object");
    t.eq(before.position, 2, "the old position");
    t.eq(before.velocity, 1, "the old velocity");
  });

  MS.test(L, "spring starts at `from` on frame 0", t => {
    t.eq(MS.spring({ frame: 0, fps: 30 }), 0, "default from = 0");
    t.eq(MS.spring({ frame: 0, fps: 30, from: 5, to: 10 }), 5, "from = 5");
  });

  MS.test(L, "spring matches a simulation in 1 ms steps", t => {
    t.close(MS.spring({ frame: 30, fps: 30 }), 1.0022390596465578, 1e-9, "frame 30 at 30 fps");
    t.close(MS.spring({ frame: 10, fps: 30, from: 0, to: 100 }), 115.47237566170986, 1e-7, "0 → 100, frame 10");
    t.close(MS.spring({ frame: 12, fps: 30, from: 40, to: 10 }), 5.452007774883348, 1e-9, "falling from 40 to 10, frame 12");
  });

  MS.test(L, "spring rounds each frame to a whole number of 1 ms steps", t => {
    t.close(MS.spring({ frame: 7, fps: 48 }), 0.5934350170124664, 1e-9, "frame 7 at 48 fps is 145.83 ms → 146 steps");
    t.close(MS.spring({ frame: 20, fps: 30, config: { damping: 200 } }), 0.2826860556738996, 1e-9, "frame 20 at 30 fps is 666.67 ms → 667 steps");
  });

  MS.test(L, "spring: fps changes the frame numbers, not the time", t => {
    t.close(MS.spring({ frame: 18, fps: 60 }), MS.spring({ frame: 9, fps: 30 }), 1e-12, "frame 18 at 60 fps and frame 9 at 30 fps are both 300 ms");
  });

  MS.test(L, "spring: the default spring overshoots, then settles", t => {
    let highest = 0;
    for (let n = 0; n <= 30; n++) highest = Math.max(highest, MS.spring({ frame: n, fps: 30 }));
    t.ok(highest > 1, `it should pass 1 on the way; the highest value in frames 0–30 was ${highest}`);
    t.close(MS.spring({ frame: 90, fps: 30 }), 1, 1e-3, "three seconds later it's at rest");
  });

  MS.test(L, "dampingRatio", t => {
    t.close(MS.dampingRatio({ stiffness: 100, damping: 30, mass: 1 }), 1.5, 1e-12, "overdamped");
    t.close(MS.dampingRatio({ stiffness: 25, damping: 10, mass: 1 }), 1, 1e-12, "critically damped");
    t.close(MS.dampingRatio({ stiffness: 200, damping: 10, mass: 2 }), 0.25, 1e-12, "bouncy");
  });

  MS.test(L, "settleFrame: the first frame from which it stays close", t => {
    t.eq(MS.settleFrame({ fps: 30 }), 28, "the default spring at 30 fps");
    t.eq(MS.settleFrame({ fps: 60 }), 55, "the same spring at 60 fps");
    t.eq(MS.settleFrame({ fps: 30, config: { damping: 20 } }), 23, "critically damped");
  });

  MS.test(L, "settleFrame: edge cases", t => {
    t.eq(MS.settleFrame({ fps: 30, from: 4, to: 4 }), 0, "already there");
    t.eq(MS.settleFrame({ fps: 30, config: { damping: 200 } }), Infinity, "too slow to settle within 10 seconds");
  });

  // ---- pictures ----
  const SPRINGS = [
    ["BOUNCY", { damping: 4 }], ["DEFAULT", {}], ["CRITICAL", { damping: 20 }], ["HEAVY", { mass: 4 }],
  ];
  const BG = [11, 13, 18], INK = [234, 240, 250, 255], DIM = [60, 70, 90], LINE = [30, 36, 50];

  MS.visual(L, "Four springs from 0 to 1 over 2 seconds; the dashed line is the target", () => {
    const W = 120, H = 34, f = MS.createFrame(W * 2 + 18, (H + 14) * 2 + 4);
    MS.clearFrame(f, BG);
    SPRINGS.forEach(([name, config], i) => {
      const ox = 6 + (i % 2) * (W + 6), oy = 4 + Math.floor(i / 2) * (H + 14);
      const yOf = v => oy + (H - 1) * (1 - v / 1.6);   // 0 at the bottom, 1.6 at the top
      for (let x = 0; x < W; x += 2) MS.fillRect(f, ox + x, Math.round(yOf(1)), 1, 1, DIM);
      for (let n = 0; n <= 60; n++) {
        const v = MS.spring({ frame: n, fps: 30, config });
        MS.fillRect(f, ox + Math.round(n * (W - 2) / 60), Math.round(yOf(v)), 2, 2, INK);
      }
      MS.drawText(f, name, ox, oy + H + 3, 1, DIM);
    });
    return f;
  });

  MS.animation(L, "The same four springs, moving", () => MS.createComposition({
    width: 120, height: SPRINGS.length * 11 + 4, fps: 30, durationInFrames: 75,
    render(frame, n) {
      MS.clearFrame(frame, BG);
      SPRINGS.forEach(([name, config], i) => {
        const y = 3 + i * 11;
        MS.drawText(frame, name, 2, y + 1, 1, DIM);
        MS.fillRect(frame, 52, y + 4, 58, 1, LINE);
        MS.fillRect(frame, 100, y, 1, 9, DIM);   // the target
        const x = MS.spring({ frame: Math.max(0, n - 5), fps: 30, from: 52, to: 100, config });
        MS.fillCircle(frame, x, y + 4.5, 3, INK);
      });
    },
  }));
})(globalThis.MS = globalThis.MS || {});
