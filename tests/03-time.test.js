// tests/03-time.test.js — PROVIDED. Read a failing test to see what's expected.
(function (MS) {
  const L = "03";
  const dot = n => (frame, k) => { MS.setPixel(frame, k, 0, [255, 255, 255]); };   // a render that lights pixel (n, 0)
  const lit = f => { let c = 0; for (let i = 3; i < f.data.length; i += 4) if (f.data[i]) c++; return c; };

  MS.test(L, "secondsToFrames: seconds × fps", t => {
    t.eq(MS.secondsToFrames(2, 30), 60, "2 s at 30 fps");
    t.eq(MS.secondsToFrames(0.5, 60), 30, "0.5 s at 60 fps");
  });

  MS.test(L, "secondsToFrames rounds to the nearest whole frame", t => {
    t.eq(MS.secondsToFrames(1.01, 30), 30, "30.3 frames → 30");
    t.eq(MS.secondsToFrames(0.1, 25), 3, "2.5 frames → 3");
  });

  MS.test(L, "framesToSeconds: frames ÷ fps, not rounded", t => {
    t.eq(MS.framesToSeconds(45, 30), 1.5, "45 frames at 30 fps");
    t.close(MS.framesToSeconds(1, 60), 1 / 60, 1e-12, "one frame at 60 fps");
  });

  MS.test(L, "timecode pads every field to two digits", t => {
    t.eq(MS.timecode(0, 30), "00:00:00:00");
    t.eq(MS.timecode(7, 30), "00:00:00:07");
  });

  MS.test(L, "timecode carries frames into seconds, minutes and hours", t => {
    t.eq(MS.timecode(30, 30), "00:00:01:00", "30 frames at 30 fps is one second");
    t.eq(MS.timecode(30 * 61 + 5, 30), "00:01:01:05");
    t.eq(MS.timecode(25 * 3600, 25), "01:00:00:00", "an hour at 25 fps");
  });

  MS.test(L, "createComposition keeps the size, fps, duration and render", t => {
    const render = () => {};
    const c = MS.createComposition({ width: 64, height: 36, fps: 24, durationInFrames: 48, render });
    t.eq(c.width, 64, "width"); t.eq(c.height, 36, "height"); t.eq(c.fps, 24, "fps");
    t.eq(c.durationInFrames, 48, "durationInFrames"); t.eq(c.render, render, "render");
  });

  MS.test(L, "createComposition rejects numbers that aren't positive and whole", t => {
    const ok = { width: 8, height: 8, fps: 30, durationInFrames: 10, render: () => {} };
    t.throws(() => MS.createComposition({ ...ok, width: 0 }), "width 0");
    t.throws(() => MS.createComposition({ ...ok, height: 2.5 }), "height 2.5");
    t.throws(() => MS.createComposition({ ...ok, fps: 29.97 }), "fps 29.97");
    t.throws(() => MS.createComposition({ ...ok, durationInFrames: -1 }), "durationInFrames -1");
  });

  MS.test(L, "createComposition rejects a render that isn't a function", t => {
    t.throws(() => MS.createComposition({ width: 8, height: 8, fps: 30, durationInFrames: 10, render: "draw" }));
  });

  MS.test(L, "renderFrame hands render a new, empty frame each time", t => {
    const c = MS.createComposition({ width: 8, height: 2, fps: 30, durationInFrames: 8, render: dot() });
    const a = MS.renderFrame(c, 1), b = MS.renderFrame(c, 3);
    t.eq(b.width, 8, "frame width"); t.eq(b.height, 2, "frame height");
    t.pixel(b, 3, 0, [255, 255, 255, 255], "render got n = 3");
    t.eq(lit(b), 1, "frame 3 shows only its own pixel, nothing left over from frame 1");
    t.ok(a !== b, "each call makes its own frame");
  });

  MS.test(L, "renderFrame rejects frame numbers outside 0 … duration − 1", t => {
    const c = MS.createComposition({ width: 4, height: 4, fps: 30, durationInFrames: 10, render: () => {} });
    t.throws(() => MS.renderFrame(c, -1), "-1");
    t.throws(() => MS.renderFrame(c, 10), "10 (the last frame is 9)");
    t.throws(() => MS.renderFrame(c, 2.5), "2.5");
  });

  MS.test(L, "frameAt counts whole frames that have started", t => {
    t.eq(MS.frameAt(0, 30, 90), 0, "at 0 ms");
    t.eq(MS.frameAt(33.3, 30, 90), 0, "33.3 ms: frame 1 starts at 33.33 ms");
    t.eq(MS.frameAt(33.4, 30, 90), 1, "33.4 ms");
    t.eq(MS.frameAt(2000, 24, 100), 48, "2 s at 24 fps");
  });

  MS.test(L, "frameAt loops back to 0 after the last frame", t => {
    t.eq(MS.frameAt(3000, 30, 90), 0, "3 s into a 3-second loop");
    t.eq(MS.frameAt(3500, 30, 90), 15, "3.5 s");
  });

  MS.test(L, "frameAt holds the last frame when loop is false", t => {
    t.eq(MS.frameAt(5000, 30, 90, false), 89, "5 s into a 3-second clip");
    t.eq(MS.frameAt(1000, 30, 90, false), 30, "before the end it counts as usual");
  });

  // ---- pictures that move (they play with your frameAt and renderFrame) ----
  MS.animation(L, "A ball that crosses the frame in exactly one second", () => MS.createComposition({
    width: 64, height: 24, fps: 30, durationInFrames: 30,
    render(frame, n) {
      MS.clearFrame(frame, [11, 13, 18]);
      MS.fillCircle(frame, 8 + (48 * n) / 29, 12, 6, MS.hex("#5B8CFF"));
    },
  }));

  MS.animation(L, "A clock: the timecode of every frame at 30 fps", () => MS.createComposition({
    width: 77, height: 15, fps: 30, durationInFrames: 90,
    render(frame, n) {
      MS.clearFrame(frame, [11, 13, 18]);
      MS.drawText(frame, MS.timecode(n, 30), 6, 4, 1, MS.hex("#EAF0FA"));
    },
  }));
})(globalThis.MS = globalThis.MS || {});
